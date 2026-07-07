"""Validate Flyway migration scripts before handing work back.

The checks mirror docs/guides/flyway-operations.md section 4.4:

- migration file names and version uniqueness
- forbidden DELIMITER usage
- defensive checks around legacy cross-schema taoke.* reads
- basic idempotency hints for DDL/DML
- optional flyway_schema_history consistency check when a DB is reachable
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import zlib
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
MIGRATION_DIR = PROJECT_ROOT / "backend" / "taoke-app" / "src" / "main" / "resources" / "db" / "migration"
APPLICATION_DEV = PROJECT_ROOT / "backend" / "taoke-app" / "src" / "main" / "resources" / "application-dev.yaml"

FILENAME_RE = re.compile(r"^V(?P<version>\d+(?:_\d+)*)__[a-z0-9_]+\.sql$")
TAOKE_REF_RE = re.compile(r"(?<![A-Za-z0-9_`])taoke\s*\.", re.IGNORECASE)


@dataclass(frozen=True)
class Migration:
    path: Path
    name: str
    version: str
    text: str


@dataclass
class Finding:
    level: str
    message: str
    path: Path | None = None
    line: int | None = None

    def format(self) -> str:
        prefix = f"[{self.level}]"
        if self.path is None:
            return f"{prefix} {self.message}"
        rel = self.path.relative_to(PROJECT_ROOT)
        if self.line is None:
            return f"{prefix} {rel}: {self.message}"
        return f"{prefix} {rel}:{self.line}: {self.message}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate Flyway migration scripts.")
    parser.add_argument(
        "--version",
        action="append",
        default=[],
        help="Version to validate, e.g. 131. Repeat or comma-separate for multiple versions.",
    )
    parser.add_argument(
        "--migration-dir",
        default=str(MIGRATION_DIR),
        help="Migration directory. Defaults to backend/taoke-app/src/main/resources/db/migration.",
    )
    parser.add_argument(
        "--db-check",
        choices=("auto", "skip", "require"),
        default="auto",
        help="Check flyway_schema_history when DB config/dependencies are available.",
    )
    return parser.parse_args()


def normalize_requested_versions(raw_versions: Iterable[str]) -> set[str]:
    versions: set[str] = set()
    for raw in raw_versions:
        for part in raw.split(","):
            value = part.strip()
            if not value:
                continue
            if value.upper().startswith("V"):
                value = value[1:]
            versions.add(value.replace(".", "_"))
    return versions


def version_sort_key(version: str) -> tuple[int, ...]:
    return tuple(int(part) for part in version.split("_"))


def read_migrations(migration_dir: Path) -> tuple[list[Migration], list[Finding]]:
    findings: list[Finding] = []
    migrations: list[Migration] = []
    if not migration_dir.exists():
        return [], [Finding("ERROR", f"migration directory does not exist: {migration_dir}")]

    for path in sorted(migration_dir.glob("V*.sql"), key=lambda p: p.name):
        match = FILENAME_RE.match(path.name)
        if not match:
            findings.append(Finding("ERROR", "file name must match V{version}__lower_snake_description.sql", path))
            continue
        text = path.read_text(encoding="utf-8-sig")
        migrations.append(Migration(path=path, name=path.name, version=match.group("version"), text=text))
    return migrations, findings


def select_migrations(migrations: list[Migration], requested: set[str]) -> tuple[list[Migration], list[Finding]]:
    if not requested:
        return migrations, []

    by_version: dict[str, list[Migration]] = {}
    for migration in migrations:
        by_version.setdefault(migration.version, []).append(migration)

    selected: list[Migration] = []
    findings: list[Finding] = []
    for version in sorted(requested, key=version_sort_key):
        matches = by_version.get(version, [])
        if not matches:
            findings.append(Finding("ERROR", f"requested V{version} was not found"))
            continue
        selected.extend(matches)
    return selected, findings


def check_duplicate_versions(migrations: list[Migration]) -> list[Finding]:
    by_version: dict[str, list[Migration]] = {}
    for migration in migrations:
        by_version.setdefault(migration.version, []).append(migration)

    findings: list[Finding] = []
    for version, items in sorted(by_version.items(), key=lambda item: version_sort_key(item[0])):
        if len(items) > 1:
            names = ", ".join(item.name for item in items)
            findings.append(Finding("ERROR", f"duplicate Flyway version V{version}: {names}"))
    return findings


def line_number(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def flyway_sql_checksum(text: str) -> int:
    """Return Flyway's SQL migration checksum.

    Flyway calculates CRC32 line by line using UTF-8 bytes and does not include
    line separators, which makes the value stable across CRLF/LF files.
    """
    checksum = 0
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    for line in normalized.split("\n"):
        checksum = zlib.crc32(line.encode("utf-8"), checksum)
    return checksum if checksum < 2**31 else checksum - 2**32


def has_legacy_schema_guard(text: str) -> bool:
    lower = text.lower()
    return "information_schema.schemata" in lower or "information_schema.tables" in lower


def check_sql_content(migration: Migration) -> list[Finding]:
    text = migration.text
    lower = text.lower()
    findings: list[Finding] = []

    if not text.strip():
        findings.append(Finding("ERROR", "migration file is empty", migration.path))

    for idx, line in enumerate(text.splitlines(), start=1):
        if re.match(r"^\s*delimiter\b", line, re.IGNORECASE):
            findings.append(Finding("ERROR", "DELIMITER is forbidden in Flyway scripts", migration.path, idx))

    if TAOKE_REF_RE.search(text) and not has_legacy_schema_guard(text):
        findings.append(
            Finding(
                "ERROR",
                "taoke.* legacy-schema reference needs information_schema.SCHEMATA/TABLES guard",
                migration.path,
                line_number(text, TAOKE_REF_RE.search(text).start()),
            )
        )

    if re.search(r"\balter\s+table\b", lower):
        has_defensive_ddl = any(
            token in lower
            for token in (
                "if not exists",
                "if exists",
                "information_schema.columns",
                "information_schema.tables",
                "prepare stmt",
                "execute stmt",
            )
        )
        if not has_defensive_ddl:
            findings.append(
                Finding(
                    "WARN",
                    "ALTER TABLE appears non-defensive; prefer IF NOT EXISTS or information_schema checks",
                    migration.path,
                )
            )

    if re.search(r"\bdelete\s+from\b", lower) and "where" not in lower:
        findings.append(Finding("ERROR", "DELETE without WHERE is unsafe for migration", migration.path))

    if re.search(r"\binsert\s+into\b", lower):
        has_idempotent_insert = any(
            token in lower
            for token in (
                "insert ignore",
                "on duplicate key update",
                "where not exists",
                "not exists",
            )
        )
        if not has_idempotent_insert:
            findings.append(
                Finding(
                    "WARN",
                    "INSERT may not be idempotent; prefer INSERT IGNORE, ON DUPLICATE KEY UPDATE, or NOT EXISTS",
                    migration.path,
                )
            )

    return findings


def load_db_config() -> dict[str, object]:
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise RuntimeError("PyYAML is not installed") from exc

    with APPLICATION_DEV.open("r", encoding="utf-8") as handle:
        config = yaml.safe_load(handle)

    datasource = config["spring"]["datasource"]
    url = str(datasource["url"]).replace("jdbc:mysql://", "", 1)
    host_port, rest = url.split("/", 1)
    database = rest.split("?", 1)[0]
    if ":" in host_port:
        host, port = host_port.split(":", 1)
    else:
        host, port = host_port, "3306"

    return {
        "host": os.getenv("MYSQL_HOST", host),
        "port": int(os.getenv("MYSQL_PORT", port)),
        "user": os.getenv("MYSQL_USER", str(datasource["username"])),
        "password": os.getenv("MYSQL_PASSWORD", str(datasource["password"])),
        "database": os.getenv("MYSQL_DATABASE", database),
        "charset": "utf8mb4",
    }


def check_db_history(migrations: list[Migration], mode: str) -> list[Finding]:
    if mode == "skip":
        return [Finding("WARN", "database history check skipped by --db-check=skip")]

    try:
        import pymysql  # type: ignore
    except ImportError as exc:
        if mode == "require":
            return [Finding("ERROR", "pymysql is not installed; cannot check flyway_schema_history")]
        return [Finding("WARN", "database history check skipped: pymysql is not installed")]

    try:
        db_cfg = load_db_config()
        connection = pymysql.connect(connect_timeout=5, read_timeout=10, write_timeout=10, **db_cfg)
    except Exception as exc:
        level = "ERROR" if mode == "require" else "WARN"
        return [Finding(level, f"database history check skipped: {exc}")]

    findings: list[Finding] = []
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT version, script, checksum, success FROM flyway_schema_history WHERE version IS NOT NULL"
            )
            history = {
                str(version): (script, checksum, success)
                for version, script, checksum, success in cursor.fetchall()
            }
            cursor.execute(
                "SELECT MAX(CAST(version AS UNSIGNED)) FROM flyway_schema_history WHERE success = 1"
            )
            max_version = cursor.fetchone()[0]

        for migration in migrations:
            record = history.get(migration.version)
            if record is None:
                continue
            script, checksum, success = record
            if success != 1:
                findings.append(Finding("ERROR", f"V{migration.version} has success={success} in flyway_schema_history"))
            if script != migration.name:
                findings.append(
                    Finding(
                        "ERROR",
                        f"V{migration.version} script mismatch: DB has {script}, repo has {migration.name}",
                        migration.path,
                    )
                )
            resolved_checksum = flyway_sql_checksum(migration.text)
            if checksum != resolved_checksum:
                findings.append(
                    Finding(
                        "ERROR",
                        f"V{migration.version} checksum mismatch: DB has {checksum}, repo resolves to {resolved_checksum}",
                        migration.path,
                    )
                )

        if max_version is not None:
            selected_numeric = [
                int(migration.version)
                for migration in migrations
                if "_" not in migration.version and migration.version.isdigit()
            ]
            for version in selected_numeric:
                if version <= int(max_version) and str(version) not in history:
                    findings.append(
                        Finding(
                            "WARN",
                            f"V{version} is <= current DB max version {max_version} but has no history row",
                        )
                    )
    finally:
        connection.close()

    return findings


def main() -> int:
    args = parse_args()
    migration_dir = Path(args.migration_dir).resolve()
    requested = normalize_requested_versions(args.version)

    migrations, findings = read_migrations(migration_dir)
    findings.extend(check_duplicate_versions(migrations))

    selected, selection_findings = select_migrations(migrations, requested)
    findings.extend(selection_findings)

    if selected:
        for migration in selected:
            findings.extend(check_sql_content(migration))
        findings.extend(check_db_history(selected, args.db_check))

    errors = [finding for finding in findings if finding.level == "ERROR"]
    warnings = [finding for finding in findings if finding.level == "WARN"]

    scope = ", ".join(f"V{version}" for version in sorted(requested, key=version_sort_key)) if requested else "all"
    print(f"Flyway migration validation scope: {scope}")
    print(f"Migration directory: {migration_dir}")
    print(f"Checked SQL files: {len(selected)}")

    for finding in findings:
        print(finding.format())

    if errors:
        print(f"\n[FAIL] {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1

    print(f"\n[OK] no blocking Flyway migration issue found ({len(warnings)} warning(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
