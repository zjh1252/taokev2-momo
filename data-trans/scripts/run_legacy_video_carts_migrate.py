#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int, normalize_money
from data_trans_lib.legacy_profile import clean_required, fallback_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_video_cart"
DEFAULT_TARGET_TABLE = "carts"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_VIDEO_TABLE = "videos"

CART_COLUMNS = (
    "user_id",
    "product_type",
    "product_id",
    "product_title",
    "product_cover",
    "price",
    "quantity",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_video_cart rows into carts.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-video-table", default=DEFAULT_TARGET_VIDEO_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for video cart migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT *
        FROM {quote_ident(table)}
        WHERE uid > 0
          AND video_id > 0
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_ids(conn, table: str, column: str = "id") -> set[int]:
    sql = f"SELECT {quote_ident(column)} AS id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {normalize_int(row.get("id")) for row in cur.fetchall() if normalize_int(row.get("id")) > 0}


def fetch_existing_keys(conn, table: str, batch_size: int) -> set[tuple[int, str, int]]:
    sql = f"SELECT user_id, product_type, product_id FROM {quote_ident(table)}"
    keys: set[tuple[int, str, int]] = set()
    with conn.cursor() as cur:
        cur.execute(sql)
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            for row in rows:
                keys.add(
                    (
                        normalize_int(row.get("user_id")),
                        str(row.get("product_type") or "").strip(),
                        normalize_int(row.get("product_id")),
                    )
                )
    return keys


def build_cart_row(row: dict) -> dict:
    created_at = fallback_datetime(row.get("createtime"))
    return {
        "user_id": normalize_int(row.get("uid")),
        "product_type": "VIDEO_COURSE",
        "product_id": normalize_int(row.get("video_id")),
        "product_title": clean_required(row.get("video_title"), 200),
        "product_cover": "",
        "price": normalize_money(row.get("video_price")),
        "quantity": 1,
        "created_at": created_at,
        "updated_at": created_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in CART_COLUMNS)
    placeholders = ", ".join(["%s"] * len(CART_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in CART_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_table)
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    target_video_ids = fetch_ids(target_conn, args.target_video_table)
    existing_keys = fetch_existing_keys(target_conn, args.target_table, args.batch_size)

    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))
    for source_row in source_rows:
        cart_row = build_cart_row(source_row)
        if cart_row["user_id"] not in target_user_ids:
            stats.skip("missing_user")
            continue
        if cart_row["product_id"] not in target_video_ids:
            stats.skip("missing_video")
            continue
        key = (cart_row["user_id"], cart_row["product_type"], cart_row["product_id"])
        if key in existing_keys:
            stats.skip("existing_cart")
            continue
        existing_keys.add(key)
        rows.append(cart_row)

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
    print(f"[{mode}] legacy video carts migration")
    print_summary("carts", stats)


if __name__ == "__main__":
    main()
