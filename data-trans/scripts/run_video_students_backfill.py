#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_TARGET_ENROLLMENT_TABLE = "video_enrollments"
DEFAULT_TARGET_STUDENT_TABLE = "video_students"
DEFAULT_TARGET_VIDEO_TABLE = "videos"
DEFAULT_TARGET_USER_TABLE = "sys_users"

STUDENT_COLUMNS = (
    "video_id",
    "user_id",
    "enrollment_id",
    "last_chapter_id",
    "progress",
    "completed_chapters",
    "total_watch_time",
    "started_at",
    "last_watched_at",
    "is_completed",
    "completed_at",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Backfill video_students from active video_enrollments.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--target-enrollment-table", default=DEFAULT_TARGET_ENROLLMENT_TABLE)
    parser.add_argument("--target-student-table", default=DEFAULT_TARGET_STUDENT_TABLE)
    parser.add_argument("--target-video-table", default=DEFAULT_TARGET_VIDEO_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    return parser.parse_args(argv)


def require_target_dsn(args: argparse.Namespace) -> None:
    if not args.target_dsn:
        raise SystemExit("missing required DSN arguments for video student backfill: --target-dsn")


def fetch_active_enrollments(conn, args: argparse.Namespace) -> list[dict]:
    enrollments = quote_ident(args.target_enrollment_table)
    videos = quote_ident(args.target_video_table)
    users = quote_ident(args.target_user_table)
    sql = f"""
        SELECT e.*
        FROM {enrollments} e
        INNER JOIN {videos} v ON v.id = e.video_id
        INNER JOIN {users} u ON u.id = e.user_id
        WHERE e.status = 1
        ORDER BY e.id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_existing_keys(conn, table: str, batch_size: int) -> set[tuple[int, int]]:
    sql = f"SELECT video_id, user_id FROM {quote_ident(table)}"
    keys: set[tuple[int, int]] = set()
    with conn.cursor() as cur:
        cur.execute(sql)
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            for row in rows:
                keys.add((normalize_int(row.get("video_id")), normalize_int(row.get("user_id"))))
    return keys


def build_student_row(enrollment: dict) -> dict:
    created_at = enrollment.get("created_at") or enrollment.get("enrolled_at") or datetime.now()
    updated_at = enrollment.get("updated_at") or created_at
    return {
        "video_id": normalize_int(enrollment.get("video_id")),
        "user_id": normalize_int(enrollment.get("user_id")),
        "enrollment_id": normalize_int(enrollment.get("id")),
        "last_chapter_id": 0,
        "progress": 0,
        "completed_chapters": 0,
        "total_watch_time": 0,
        "started_at": None,
        "last_watched_at": None,
        "is_completed": 0,
        "completed_at": None,
        "created_at": created_at,
        "updated_at": updated_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in STUDENT_COLUMNS)
    placeholders = ", ".join(["%s"] * len(STUDENT_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in STUDENT_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    enrollments = fetch_active_enrollments(target_conn, args)
    existing_keys = fetch_existing_keys(target_conn, args.target_student_table, args.batch_size)

    rows: list[dict] = []
    stats = RunStats(scanned=len(enrollments))
    for enrollment in enrollments:
        row = build_student_row(enrollment)
        key = (row["video_id"], row["user_id"])
        if key in existing_keys:
            stats.skip("existing_student")
            continue
        if row["video_id"] <= 0 or row["user_id"] <= 0 or row["enrollment_id"] <= 0:
            stats.skip("invalid_enrollment")
            continue
        existing_keys.add(key)
        rows.append(row)

    stats.inserted = insert_rows(target_conn, args.target_student_table, rows, args.batch_size) if apply else len(rows)
    return stats


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    apply = ensure_write_mode(args)
    require_target_dsn(args)

    from data_trans_lib.db import connect_mysql

    target_conn = None
    try:
        target_conn = connect_mysql(args.target_dsn)
        stats = migrate(target_conn, args, apply)
        if apply:
            target_conn.commit()
        else:
            target_conn.rollback()
    except Exception:
        if target_conn:
            target_conn.rollback()
        raise
    finally:
        if target_conn:
            target_conn.close()

    mode = "APPLY" if apply else "DRY-RUN"
    print(f"[{mode}] video students backfill")
    print_summary("video_students", stats)


if __name__ == "__main__":
    main()
