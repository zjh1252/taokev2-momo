#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import fallback_datetime, legacy_datetime, map_role_status
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_MEMBER_TABLE = "taoke.tk_member"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_ROLE_TABLE = "sys_user_roles"

ROLE_BY_GROUP = {
    1: "SUPER_ADMIN",
    3: "INSTITUTION",
    4: "ENTERPRISE_BUYER",
    7: "BUYER",
    9: "TRAINER",
}

ROLE_COLUMNS = (
    "user_id",
    "role",
    "status",
    "reapplying",
    "approved_at",
    "approved_by",
    "reject_reason",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_member groupid values into sys_user_roles.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-member-table", default=DEFAULT_SOURCE_MEMBER_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-role-table", default=DEFAULT_TARGET_ROLE_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for role migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT id, groupid, is_del, regtime, modified
        FROM {quote_ident(table)}
        WHERE id > 0
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_target_user_ids(conn, table: str) -> set[int]:
    sql = f"SELECT id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {int(row["id"]) for row in cur.fetchall()}


def fetch_existing_roles(conn, table: str, batch_size: int) -> set[tuple[int, str]]:
    sql = f"SELECT user_id, role FROM {quote_ident(table)}"
    keys: set[tuple[int, str]] = set()
    with conn.cursor() as cur:
        cur.execute(sql)
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            for row in rows:
                keys.add((int(row["user_id"]), str(row["role"])))
    return keys


def build_role_row(row: dict, role: str) -> dict:
    created_at = fallback_datetime(row.get("regtime"), row.get("modified"))
    return {
        "user_id": int(row["id"]),
        "role": role,
        "status": map_role_status(row.get("is_del")),
        "reapplying": 0,
        "approved_at": None,
        "approved_by": None,
        "reject_reason": None,
        "created_at": created_at,
        "updated_at": legacy_datetime(row.get("modified")) or created_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in ROLE_COLUMNS)
    placeholders = ", ".join(["%s"] * len(ROLE_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in ROLE_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_member_table)
    target_user_ids = fetch_target_user_ids(target_conn, args.target_user_table)
    existing_roles = fetch_existing_roles(target_conn, args.target_role_table, args.batch_size)

    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))
    for row in source_rows:
        user_id = normalize_int(row.get("id"))
        group_id = normalize_int(row.get("groupid"))
        role = ROLE_BY_GROUP.get(group_id)
        if not role:
            stats.skip("unmapped_group")
            continue
        if user_id not in target_user_ids:
            stats.skip("missing_target_user")
            continue
        key = (user_id, role)
        if key in existing_roles:
            stats.skip("existing_role")
            continue
        existing_roles.add(key)
        rows.append(build_role_row(row, role))

    stats.inserted = insert_rows(target_conn, args.target_role_table, rows, args.batch_size) if apply else len(rows)
    return stats


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    apply = ensure_write_mode(args)
    require_dsns(args)

    from data_trans_lib.db import connect_mysql

    source_conn = None
    target_conn = None
    try:
        source_conn = connect_mysql(args.source_dsn)
        target_conn = connect_mysql(args.target_dsn)
        stats = migrate(source_conn, target_conn, args, apply)
        if apply:
            target_conn.commit()
        else:
            target_conn.rollback()
    except Exception:
        if target_conn:
            target_conn.rollback()
        raise
    finally:
        if source_conn:
            source_conn.close()
        if target_conn:
            target_conn.close()

    mode = "APPLY" if apply else "DRY-RUN"
    print(f"[{mode}] legacy roles migration")
    print_summary("roles", stats)


if __name__ == "__main__":
    main()
