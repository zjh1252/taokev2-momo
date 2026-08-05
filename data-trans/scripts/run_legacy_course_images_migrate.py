#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime, timezone

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_asset_url
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_course_pic"
DEFAULT_TARGET_TABLE = "course_images"
DEFAULT_TARGET_COURSE_TABLE = "courses"
LEGACY_TIMESTAMP_TZ = timezone.utc

IMAGE_COLUMNS = (
    "id",
    "course_id",
    "image_url",
    "thumbnail_url",
    "image_type",
    "sort_order",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy course images into course_images.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-course-table", default=DEFAULT_TARGET_COURSE_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for course image migration: {', '.join(missing)}")


def fetch_all(conn, table: str, order_by: tuple[str, ...], where: str = "") -> list[dict]:
    table_name = quote_ident(table)
    order_clause = ", ".join(quote_ident(column) for column in order_by)
    where_clause = f"WHERE {where}" if where else ""
    sql = f"SELECT * FROM {table_name} {where_clause} ORDER BY {order_clause}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_target_course_ids(conn, table: str) -> set[int]:
    sql = f"SELECT id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def utc_from_legacy_ts(value: object) -> datetime:
    try:
        ts = int(value or 0)
    except (TypeError, ValueError):
        ts = 0
    if ts <= 0:
        return datetime.now(LEGACY_TIMESTAMP_TZ).replace(tzinfo=None)
    return datetime.fromtimestamp(ts, LEGACY_TIMESTAMP_TZ).replace(tzinfo=None)


def build_image_row(row: dict, asset_base_url: str) -> dict:
    created_at = utc_from_legacy_ts(row.get("up_time"))
    image_url = normalize_asset_url(row.get("pic"), asset_base_url)
    return {
        "id": int(row.get("id") or 0),
        "course_id": int(row.get("cid") or 0),
        "image_url": image_url,
        "thumbnail_url": "",
        "image_type": "DETAIL",
        "sort_order": 0,
        "created_at": created_at,
        "updated_at": created_at,
    }


def build_target_key(row: dict) -> tuple[int, str]:
    return (int(row.get("course_id") or 0), str(row.get("image_url") or ""))


def fetch_existing_keys(conn, table: str, course_ids: set[int], batch_size: int) -> set[tuple[int, str]]:
    if not course_ids:
        return set()
    table_name = quote_ident(table)
    rows: set[tuple[int, str]] = set()
    course_ids_list = sorted(course_ids)
    with conn.cursor() as cur:
        for batch in chunks(course_ids_list, batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(
                f"SELECT course_id, image_url FROM {table_name} WHERE course_id IN ({placeholders})",
                batch,
            )
            for row in cur.fetchall():
                rows.add((int(row.get("course_id") or 0), str(row.get("image_url") or "")))
    return rows


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    sql = f"""
        INSERT INTO {quote_ident(table)}
          (id, course_id, image_url, thumbnail_url, image_type, sort_order, created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
          course_id = VALUES(course_id),
          image_url = VALUES(image_url),
          thumbnail_url = VALUES(thumbnail_url),
          image_type = VALUES(image_type),
          sort_order = VALUES(sort_order),
          updated_at = VALUES(updated_at)
    """
    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in IMAGE_COLUMNS) for row in batch])
            affected += cur.rowcount
    return affected


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_all(source_conn, args.source_table, order_by=("id",))
    target_course_ids = fetch_target_course_ids(target_conn, args.target_course_table)
    existing_keys = fetch_existing_keys(target_conn, args.target_table, target_course_ids, args.batch_size)

    rows: list[dict] = []
    skipped: dict[str, int] = {}
    for row in source_rows:
        course_id = int(row.get("cid") or 0)
        if course_id <= 0:
            skipped["invalid_course_id"] = skipped.get("invalid_course_id", 0) + 1
            continue
        if course_id not in target_course_ids:
            skipped["missing_target_course"] = skipped.get("missing_target_course", 0) + 1
            continue
        image_row = build_image_row(row, args.asset_base_url)
        if not image_row["image_url"]:
            skipped["empty_image_url"] = skipped.get("empty_image_url", 0) + 1
            continue
        if build_target_key(image_row) in existing_keys:
            skipped["existing_image"] = skipped.get("existing_image", 0) + 1
            continue
        rows.append(image_row)

    affected = insert_rows(target_conn, args.target_table, rows, args.batch_size) if apply else len(rows)
    return RunStats(
        scanned=len(source_rows),
        inserted=affected,
        skipped=sum(skipped.values()),
        skip_reasons=skipped,
    )


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
    print(f"[{mode}] course images migration")
    print_summary("images", stats)


if __name__ == "__main__":
    main()
