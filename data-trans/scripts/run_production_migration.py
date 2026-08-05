#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import quote, urlparse

import pymysql

from data_trans_lib.db import parse_mysql_dsn, table_exists


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
MIGRATION_DIR = BACKEND / "taoke-app" / "src" / "main" / "resources" / "db" / "migration"
DEFAULT_SCHEMA_SQL = ROOT / "data-trans" / "v3test.sql"


@dataclass(frozen=True)
class Step:
    name: str
    script: str
    required_source_tables: tuple[str, ...] = ()
    args: tuple[str, ...] = ()
    optional: bool = False
    condition: str | None = None


def legacy_table(db: str, table: str) -> str:
    return f"{db}.{table}"


def build_steps(legacy_db: str, include_optional: bool) -> list[Step]:
    _ = include_optional
    steps = [
        Step(
            "users",
            "run_legacy_users_migrate.py",
            ("tk_member", "tk_member_ext"),
            (
                "--source-member-table",
                legacy_table(legacy_db, "tk_member"),
                "--source-ext-table",
                legacy_table(legacy_db, "tk_member_ext"),
            ),
        ),
        Step(
            "roles",
            "run_legacy_roles_migrate.py",
            ("tk_member",),
            ("--source-member-table", legacy_table(legacy_db, "tk_member")),
        ),
        Step(
            "buyers",
            "run_legacy_buyers_migrate.py",
            ("tk_member", "tk_member_ext"),
            (
                "--source-member-table",
                legacy_table(legacy_db, "tk_member"),
                "--source-ext-table",
                legacy_table(legacy_db, "tk_member_ext"),
            ),
        ),
        Step(
            "trainers",
            "run_legacy_trainers_migrate.py",
            ("tk_member", "tk_member_ext", "tk_member_authinfo"),
            (
                "--source-member-table",
                legacy_table(legacy_db, "tk_member"),
                "--source-ext-table",
                legacy_table(legacy_db, "tk_member_ext"),
                "--source-authinfo-table",
                legacy_table(legacy_db, "tk_member_authinfo"),
            ),
        ),
        Step(
            "institutions",
            "run_legacy_institutions_migrate.py",
            ("tk_member", "tk_member_ext", "tk_member_authinfo"),
            (
                "--source-member-table",
                legacy_table(legacy_db, "tk_member"),
                "--source-ext-table",
                legacy_table(legacy_db, "tk_member_ext"),
                "--source-authinfo-table",
                legacy_table(legacy_db, "tk_member_authinfo"),
            ),
        ),
        Step(
            "agents",
            "run_legacy_agents_migrate.py",
            ("tk_agent_info", "tk_agent_trainer"),
            (
                "--source-agent-table",
                legacy_table(legacy_db, "tk_agent_info"),
                "--source-binding-table",
                legacy_table(legacy_db, "tk_agent_trainer"),
            ),
            optional=True,
        ),
        Step(
            "trainer_educations",
            "run_legacy_trainer_educations_migrate.py",
            ("tk_member_education",),
            ("--source-table", legacy_table(legacy_db, "tk_member_education")),
            optional=True,
        ),
        Step(
            "trainer_honors",
            "run_legacy_trainer_honors_migrate.py",
            ("tk_member_honor",),
            ("--source-table", legacy_table(legacy_db, "tk_member_honor")),
            optional=True,
        ),
        Step(
            "trainer_work_experiences",
            "run_legacy_trainer_work_experiences_migrate.py",
            ("tk_member_work",),
            ("--source-table", legacy_table(legacy_db, "tk_member_work")),
            optional=True,
            condition="requires legacy trainer work table absent from the uploaded taoke.sql",
        ),
        Step(
            "trainer_books",
            "run_legacy_trainer_books_migrate.py",
            ("tk_trainer_books",),
            ("--source-table", legacy_table(legacy_db, "tk_trainer_books")),
            optional=True,
            condition="requires legacy trainer book table absent from the uploaded taoke.sql",
        ),
        Step(
            "courses",
            "run_legacy_courses_migrate.py",
            ("tk_courseinfo", "tk_coursedata", "tk_course", "tk_member", "tk_cate"),
            (
                "--source-courseinfo-table",
                legacy_table(legacy_db, "tk_courseinfo"),
                "--source-coursedata-table",
                legacy_table(legacy_db, "tk_coursedata"),
                "--source-open-course-table",
                legacy_table(legacy_db, "tk_course"),
                "--source-member-table",
                legacy_table(legacy_db, "tk_member"),
                "--source-cate-table",
                legacy_table(legacy_db, "tk_cate"),
            ),
        ),
        Step(
            "course_plans",
            "run_legacy_course_plans_migrate.py",
            ("tk_course",),
            ("--source-table", legacy_table(legacy_db, "tk_course")),
        ),
        Step(
            "course_images",
            "run_legacy_course_images_migrate.py",
            ("tk_course_pic",),
            ("--source-table", legacy_table(legacy_db, "tk_course_pic")),
            optional=True,
        ),
        Step(
            "videos",
            "run_legacy_videos_migrate.py",
            ("tk_video", "tk_video_series", "tk_cate", "tk_videocate_relation"),
            (
                "--source-video-table",
                legacy_table(legacy_db, "tk_video"),
                "--source-series-table",
                legacy_table(legacy_db, "tk_video_series"),
                "--source-cate-table",
                legacy_table(legacy_db, "tk_cate"),
                "--source-video-cate-relation-table",
                legacy_table(legacy_db, "tk_videocate_relation"),
            ),
            optional=True,
            condition="requires legacy recorded-course master tables absent from the uploaded taoke.sql",
        ),
        Step(
            "video_series_chapters",
            "run_legacy_video_series_chapters_migrate.py",
            ("tk_video_series",),
            (
                "--source-series-table",
                legacy_table(legacy_db, "tk_video_series"),
            ),
            optional=True,
            condition="requires target videos already migrated from tk_video",
        ),
        Step(
            "video_carts",
            "run_legacy_video_carts_migrate.py",
            ("tk_video_cart",),
            ("--source-table", legacy_table(legacy_db, "tk_video_cart")),
            optional=True,
            condition="requires legacy recorded-course cart table absent from the uploaded taoke.sql",
        ),
        Step(
            "trainer_cases",
            "run_legacy_trainer_cases_migrate.py",
            ("tk_comment_course",),
            ("--source-table", legacy_table(legacy_db, "tk_comment_course")),
            optional=True,
        ),
        Step(
            "trainer_lead_messages",
            "run_legacy_trainer_lead_messages_migrate.py",
            ("tk_advices",),
            ("--source-table", legacy_table(legacy_db, "tk_advices")),
            optional=True,
        ),
        Step(
            "training_reviews",
            "run_legacy_training_reviews_migrate.py",
            ("tk_comment_course",),
            ("--source-table", legacy_table(legacy_db, "tk_comment_course")),
            optional=True,
        ),
        Step(
            "demands",
            "run_legacy_demands_migrate.py",
            ("tk_demand", "tk_company_demand"),
            (
                "--source-demand-table",
                legacy_table(legacy_db, "tk_demand"),
                "--source-company-demand-table",
                legacy_table(legacy_db, "tk_company_demand"),
            ),
            optional=True,
        ),
        Step(
            "org_find_trainer_demands",
            "run_legacy_org_find_trainer_demands_migrate.py",
            ("tk_demand_org_find_trainer", "tk_demand_org_find_trainer_contact", "tk_demand_org_find_trainer_ext"),
            (
                "--source-table",
                legacy_table(legacy_db, "tk_demand_org_find_trainer"),
                "--source-contact-table",
                legacy_table(legacy_db, "tk_demand_org_find_trainer_contact"),
                "--source-ext-table",
                legacy_table(legacy_db, "tk_demand_org_find_trainer_ext"),
            ),
            optional=True,
        ),
        Step(
            "demand_follow_ups",
            "run_legacy_demand_follow_ups_migrate.py",
            ("tk_bid", "tk_bid_comments"),
            (
                "--source-bid-table",
                legacy_table(legacy_db, "tk_bid"),
                "--source-bid-comment-table",
                legacy_table(legacy_db, "tk_bid_comments"),
            ),
            optional=True,
        ),
        Step(
            "course_orders",
            "run_legacy_course_orders_migrate.py",
            ("tk_course_order", "tk_course_order_course", "tk_course_order_pay"),
            (
                "--source-order-table",
                legacy_table(legacy_db, "tk_course_order"),
                "--source-item-table",
                legacy_table(legacy_db, "tk_course_order_course"),
                "--source-pay-table",
                legacy_table(legacy_db, "tk_course_order_pay"),
            ),
            optional=True,
        ),
        Step(
            "course_enrollments",
            "run_legacy_course_enrollments_migrate.py",
            ("tk_course_signup",),
            ("--source-table", legacy_table(legacy_db, "tk_course_signup")),
            optional=True,
        ),
        Step(
            "favorites",
            "run_legacy_favorites_migrate.py",
            ("tk_course_fav", "tk_member_fav", "tk_attention", "tk_collect_trainer_contact"),
            (
                "--source-course-fav-table",
                legacy_table(legacy_db, "tk_course_fav"),
                "--source-member-fav-table",
                legacy_table(legacy_db, "tk_member_fav"),
                "--source-attention-table",
                legacy_table(legacy_db, "tk_attention"),
                "--source-collect-trainer-contact-table",
                legacy_table(legacy_db, "tk_collect_trainer_contact"),
            ),
            optional=True,
        ),
        Step(
            "member_provider",
            "run_legacy_member_provider_migrate.py",
            ("tk_member_provider",),
            ("--source-table", legacy_table(legacy_db, "tk_member_provider")),
            optional=True,
        ),
        Step(
            "video_orders",
            "run_video_order_migrate.py",
            ("tk_video_order", "tk_video_order_detail"),
            (
                "--source-order-table",
                legacy_table(legacy_db, "tk_video_order"),
                "--source-detail-table",
                legacy_table(legacy_db, "tk_video_order_detail"),
            ),
            optional=True,
            condition="requires legacy video order master/detail tables absent from the uploaded taoke.sql",
        ),
        Step(
            "video_students",
            "run_video_students_backfill.py",
            (),
            (),
            condition="derived from active video_enrollments after video_orders",
        ),
        Step(
            "video_comments",
            "run_video_comment_migrate.py",
            ("tk_video_comment",),
            ("--source-comment-table", legacy_table(legacy_db, "tk_video_comment")),
            optional=True,
            condition="requires legacy video comment table absent from the uploaded taoke.sql",
        ),
        Step(
            "trainer_category_relations",
            "run_trainer_fields_backfill.py",
            ("tk_membercate_relation", "tk_membergood_relation", "tk_cate", "tk_trade"),
            (
                "--source-cate-relation-table",
                legacy_table(legacy_db, "tk_membercate_relation"),
                "--source-industry-relation-table",
                legacy_table(legacy_db, "tk_membergood_relation"),
                "--source-cate-table",
                legacy_table(legacy_db, "tk_cate"),
                "--source-trade-table",
                legacy_table(legacy_db, "tk_trade"),
            ),
            optional=True,
            condition="requires legacy relation tables absent from the uploaded taoke.sql",
        ),
        Step(
            "video_suppliers",
            "run_video_supplier_migrate.py",
            ("tk_video_topic", "tk_video_topic_item", "tk_video_package_relation", "tk_member"),
            (
                "--source-topic-table",
                legacy_table(legacy_db, "tk_video_topic"),
                "--source-item-table",
                legacy_table(legacy_db, "tk_video_topic_item"),
                "--source-relation-table",
                legacy_table(legacy_db, "tk_video_package_relation"),
                "--source-member-table",
                legacy_table(legacy_db, "tk_member"),
            ),
            optional=True,
            condition="requires target videos already migrated from a legacy video master source",
        ),
        Step(
            "video_packages",
            "run_video_package_migrate.py",
            ("tk_video_topic", "tk_video_topic_item", "tk_video_package_relation"),
            (
                "--source-topic-table",
                legacy_table(legacy_db, "tk_video_topic"),
                "--source-item-table",
                legacy_table(legacy_db, "tk_video_topic_item"),
                "--source-relation-table",
                legacy_table(legacy_db, "tk_video_package_relation"),
            ),
            optional=True,
            condition="requires target videos already migrated from a legacy video master source",
        ),
        Step(
            "post_fixups",
            "run_legacy_post_migrate_fixups.py",
            (),
            ("--source-trust-table", legacy_table(legacy_db, "tk_member_auth")),
        ),
    ]
    return steps


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Production one-command legacy data migration: schema initialization + data-trans scripts.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--source-dsn", default=os.getenv("OLD_MYSQL_DSN") or os.getenv("SOURCE_MYSQL_DSN"))
    parser.add_argument("--target-dsn", default=os.getenv("TARGET_MYSQL_DSN") or os.getenv("NEW_MYSQL_DSN"))
    parser.add_argument("--legacy-db", default=os.getenv("LEGACY_MYSQL_DATABASE", "taoke"))
    parser.add_argument("--asset-base-url", default=os.getenv("LEGACY_ASSET_BASE_URL", "https://www.taoke.com"))
    parser.add_argument("--batch-size", type=int, default=500)
    parser.add_argument("--apply", action="store_true", help="Actually write data. Default is dry-run.")
    parser.add_argument(
        "--schema-mode",
        choices=("sql", "flyway", "none"),
        default=os.getenv("PRODUCTION_SCHEMA_MODE", "flyway"),
        help="How to initialize target schema before data migration.",
    )
    parser.add_argument("--schema-sql", type=Path, default=DEFAULT_SCHEMA_SQL)
    parser.add_argument("--skip-schema", action="store_true", help="Alias for --schema-mode none.")
    parser.add_argument("--recreate-target-schema", action="store_true", help="Allow schema SQL to drop/recreate existing target tables.")
    parser.add_argument("--create-target-database", action="store_true", help="Create the target database if absent.")
    parser.add_argument(
        "--include-optional",
        action="store_true",
        help="Compatibility flag; source-backed optional migrations are attempted by default when their tables exist.",
    )
    parser.add_argument("--fail-on-missing-optional", action="store_true")
    parser.add_argument("--fail-on-known-gaps", action="store_true")
    parser.add_argument("--preflight-only", action="store_true")
    parser.add_argument("--resume-from", default="", help="Skip steps before this step name.")
    parser.add_argument("--only-step", default="", help="Run just one named data step.")
    return parser.parse_args(argv)


def require_args(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required arguments: {', '.join(missing)}")


def target_database_name(target_dsn: str) -> str:
    database = str(parse_mysql_dsn(target_dsn).get("database") or "")
    if not database:
        raise SystemExit("target DSN must include a database name")
    return database


def create_target_database_if_needed(target_dsn: str) -> None:
    cfg = parse_mysql_dsn(target_dsn)
    database = str(cfg.get("database") or "")
    if not database:
        raise SystemExit("target DSN must include a database name")
    cfg["database"] = None
    conn = pymysql.connect(**cfg, autocommit=True)
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
    finally:
        conn.close()


def mysql_dsn_to_jdbc(target_dsn: str) -> tuple[str, str, str]:
    cfg = parse_mysql_dsn(target_dsn)
    parsed = urlparse(target_dsn)
    database = str(cfg.get("database") or "")
    host = cfg["host"]
    port = cfg["port"]
    charset = cfg.get("charset", "utf8mb4")
    query = parsed.query
    if not query:
        query = f"useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&characterEncoding={charset}"
    jdbc = f"jdbc:mysql://{host}:{port}/{database}?{query}"
    return jdbc, str(cfg["user"]), str(cfg["password"])


def run_flyway(target_dsn: str) -> None:
    jdbc, user, password = mysql_dsn_to_jdbc(target_dsn)
    mvnw = BACKEND / ("mvnw.cmd" if os.name == "nt" else "mvnw")
    mvn = str(mvnw) if mvnw.exists() else "mvn"
    cmd = [
        mvn,
        "-q",
        "-pl",
        "taoke-app",
        f"-Dflyway.url={jdbc}",
        f"-Dflyway.user={user}",
        f"-Dflyway.password={password}",
        f"-Dflyway.locations=filesystem:{MIGRATION_DIR}",
        "flyway:migrate",
    ]
    print("[schema] running Flyway migrations")
    subprocess.run(cmd, cwd=BACKEND, check=True)


def latest_flyway_version() -> str:
    versions: list[tuple[tuple[int, ...], str]] = []
    for path in MIGRATION_DIR.glob("V*.sql"):
        raw = path.name.split("__", 1)[0].removeprefix("V")
        if not raw:
            continue
        numeric = tuple(int(part) for part in raw.split("_") if part.isdigit())
        if numeric:
            versions.append((numeric, raw.replace("_", ".")))
    if not versions:
        raise SystemExit("no Flyway migration files found")
    return max(versions, key=lambda item: item[0])[1]


def iter_sql_statements(path: Path):
    text = path.read_text(encoding="utf-8", errors="ignore")
    statement: list[str] = []
    quote: str | None = None
    escape = False
    for char in text:
        statement.append(char)
        if escape:
            escape = False
            continue
        if quote:
            if char == "\\" and quote in {"'", '"'}:
                escape = True
            elif char == quote:
                quote = None
            continue
        if char in {"'", '"', "`"}:
            quote = char
            continue
        if char == ";":
            sql = "".join(statement).strip()
            statement = []
            if sql:
                yield sql
    tail = "".join(statement).strip()
    if tail:
        yield tail


def target_table_count(conn) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_type = 'BASE TABLE'
            """
        )
        return int(cur.fetchone()["cnt"])


def load_schema_sql(target_dsn: str, schema_sql: Path, recreate: bool) -> None:
    if not schema_sql.exists():
        raise SystemExit(f"schema SQL not found: {schema_sql}")
    from data_trans_lib.db import connect_mysql

    print(f"[schema] loading SQL schema {schema_sql}")
    conn = connect_mysql(target_dsn)
    try:
        if not recreate:
            count = target_table_count(conn)
            if count > 0:
                raise SystemExit(
                    "target schema is not empty; use --schema-mode none for an existing schema "
                    "or --recreate-target-schema to rebuild it"
                )
        with conn.cursor() as cur:
            for sql in iter_sql_statements(schema_sql):
                cur.execute(sql)
            cur.execute("DROP TABLE IF EXISTS flyway_schema_history")
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def run_flyway_baseline(target_dsn: str) -> None:
    jdbc, user, password = mysql_dsn_to_jdbc(target_dsn)
    version = latest_flyway_version()
    mvnw = BACKEND / ("mvnw.cmd" if os.name == "nt" else "mvnw")
    mvn = str(mvnw) if mvnw.exists() else "mvn"
    cmd = [
        mvn,
        "-q",
        "-pl",
        "taoke-app",
        f"-Dflyway.url={jdbc}",
        f"-Dflyway.user={user}",
        f"-Dflyway.password={password}",
        f"-Dflyway.locations=filesystem:{MIGRATION_DIR}",
        f"-Dflyway.baselineVersion={version}",
        "-Dflyway.baselineDescription=baseline from data-trans schema sql",
        "flyway:baseline",
    ]
    print(f"[schema] baselining Flyway at version {version}")
    subprocess.run(cmd, cwd=BACKEND, check=True)


KNOWN_GAP_TABLES = {
    "recorded_course_master": ("tk_video", "tk_video_series"),
    "recorded_course_chapters": ("tk_video_series",),
    "trainer_work_experiences": ("tk_member_work",),
    "trainer_books": ("tk_trainer_books",),
    "trainer_exact_category_relations": ("tk_membercate_relation", "tk_membergood_relation", "tk_trade"),
    "institution_legacy_statistics": ("tk_statistics",),
    "video_carts": ("tk_video_cart",),
    "video_orders": ("tk_video_order", "tk_video_order_detail"),
    "video_comments": ("tk_video_comment",),
}


def report_known_gaps(source_conn, args: argparse.Namespace) -> list[str]:
    missing_sections: list[str] = []
    for section, tables in KNOWN_GAP_TABLES.items():
        missing = [table for table in tables if not source_table_available(source_conn, args.legacy_db, table)]
        if missing:
            missing_sections.append(section)
            print(f"[gap] {section}: missing source tables {', '.join(missing)}")
        else:
            print(f"[ok] {section}: source tables available")
    return missing_sections


def source_table_available(source_conn, legacy_db: str, table: str) -> bool:
    return table_exists(source_conn, legacy_db, table)


def runnable_steps(source_conn, args: argparse.Namespace) -> list[Step]:
    steps = build_steps(args.legacy_db, args.include_optional)
    if args.only_step:
        steps = [step for step in steps if step.name == args.only_step]
        if not steps:
            raise SystemExit(f"unknown migration step: {args.only_step}")
    if args.resume_from:
        names = [step.name for step in steps]
        if args.resume_from not in names:
            raise SystemExit(f"unknown resume step: {args.resume_from}")
        steps = steps[names.index(args.resume_from) :]

    result: list[Step] = []
    for step in steps:
        missing = [table for table in step.required_source_tables if not source_table_available(source_conn, args.legacy_db, table)]
        if missing and (not step.optional or args.fail_on_missing_optional):
            raise SystemExit(f"step {step.name} missing required source tables: {', '.join(missing)}")
        if missing:
            note = f" ({step.condition})" if step.condition else ""
            print(f"[skip] {step.name}: missing optional source tables {', '.join(missing)}{note}")
            continue
        result.append(step)
    return result


def run_step(step: Step, args: argparse.Namespace) -> None:
    script = Path(__file__).resolve().parent / step.script
    cmd = [
        sys.executable,
        str(script),
        "--source-dsn",
        args.source_dsn,
        "--target-dsn",
        args.target_dsn,
        "--legacy-db",
        args.legacy_db,
        "--asset-base-url",
        args.asset_base_url,
        "--batch-size",
        str(args.batch_size),
        *step.args,
    ]
    cmd.append("--apply" if args.apply else "--dry-run")
    print(f"[step] {step.name}")
    subprocess.run(cmd, cwd=ROOT, check=True)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    if args.skip_schema:
        args.schema_mode = "none"
    require_args(args)

    if args.create_target_database and args.apply:
        create_target_database_if_needed(args.target_dsn)
    elif args.create_target_database:
        print("[schema] dry-run: target database creation skipped")

    if args.schema_mode == "sql" and args.apply:
        load_schema_sql(args.target_dsn, args.schema_sql, args.recreate_target_schema)
        run_flyway_baseline(args.target_dsn)
    elif args.schema_mode == "flyway" and args.apply:
        run_flyway(args.target_dsn)
    elif args.schema_mode != "none":
        print(f"[schema] dry-run: {args.schema_mode} schema initialization skipped")
    else:
        print("[schema] schema initialization skipped")

    from data_trans_lib.db import connect_mysql

    source_conn = connect_mysql(args.source_dsn)
    try:
        missing_gap_sections = report_known_gaps(source_conn, args)
        if args.fail_on_known_gaps and missing_gap_sections:
            raise SystemExit(f"known source gaps block full current-new parity: {', '.join(missing_gap_sections)}")
        steps = runnable_steps(source_conn, args)
    finally:
        source_conn.close()

    if args.preflight_only:
        print("[done] preflight finished; data migration not executed")
        return

    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"[{mode}] production legacy migration steps={len(steps)} target_db={target_database_name(args.target_dsn)}")
    for step in steps:
        run_step(step, args)

    print("[done] production migration pipeline finished")


if __name__ == "__main__":
    main()
