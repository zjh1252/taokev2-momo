#!/usr/bin/env python3
from __future__ import annotations

import argparse
from decimal import Decimal

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import fallback_datetime, legacy_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_course_signup"
DEFAULT_TARGET_TABLE = "course_enrollments"
DEFAULT_TARGET_COURSE_TABLE = "courses"
DEFAULT_TARGET_USER_TABLE = "sys_users"

SIGNUP_ID_OFFSET = 100_000_000

ENROLLMENT_COLUMNS = (
    "id",
    "course_id",
    "user_id",
    "order_id",
    "price_paid",
    "enrolled_at",
    "expired_at",
    "status",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_course_signup rows into course_enrollments.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-course-table", default=DEFAULT_TARGET_COURSE_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for course enrollment migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT id, course_id, courseinfo_id, signup_id, signup_begin_time,
                   signup_end_time, createtime, updatetime, disabled
            FROM {quote_ident(table)}
            WHERE id > 0
            ORDER BY id
            """
        )
        return list(cur.fetchall())


def fetch_ids(conn, table: str) -> set[int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {quote_ident(table)}")
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def fetch_existing_ids(conn, table: str, batch_size: int) -> set[int]:
    ids: set[int] = set()
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {quote_ident(table)}")
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            ids.update(int(row["id"]) for row in rows)
    return ids


def build_enrollment_row(row: dict) -> dict:
    created_at = fallback_datetime(row.get("createtime"), row.get("signup_begin_time"), row.get("updatetime"))
    return {
        "id": SIGNUP_ID_OFFSET + normalize_int(row.get("id")),
        "course_id": normalize_int(row.get("courseinfo_id")) or normalize_int(row.get("course_id")),
        "user_id": normalize_int(row.get("signup_id")),
        "order_id": 0,
        "price_paid": Decimal("0.00"),
        "enrolled_at": legacy_datetime(row.get("signup_begin_time")) or created_at,
        "expired_at": legacy_datetime(row.get("signup_end_time")),
        "status": 0 if normalize_int(row.get("disabled")) == 1 else 1,
        "created_at": created_at,
        "updated_at": legacy_datetime(row.get("updatetime")) or created_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in ENROLLMENT_COLUMNS)
    placeholders = ", ".join(["%s"] * len(ENROLLMENT_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in ENROLLMENT_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_table)
    target_course_ids = fetch_ids(target_conn, args.target_course_table)
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    existing_ids = fetch_existing_ids(target_conn, args.target_table, args.batch_size)
    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))

    for source_row in source_rows:
        row = build_enrollment_row(source_row)
        if row["id"] in existing_ids:
            stats.skip("existing_enrollment")
            continue
        if row["course_id"] not in target_course_ids:
            stats.skip("missing_course")
            continue
        if row["user_id"] not in target_user_ids:
            stats.skip("missing_user")
            continue
        existing_ids.add(row["id"])
        rows.append(row)

    stats.inserted = insert_rows(target_conn, args.target_table, rows, args.batch_size) if apply else len(rows)
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
    print(f"[{mode}] legacy course enrollments migration")
    print_summary("course_enrollments", stats)


if __name__ == "__main__":
    main()
