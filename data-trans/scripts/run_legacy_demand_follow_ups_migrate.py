#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import clean_required, clean_text, fallback_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_BID_TABLE = "taoke.tk_bid"
DEFAULT_SOURCE_BID_COMMENT_TABLE = "taoke.tk_bid_comments"
DEFAULT_TARGET_TABLE = "demand_follow_ups"
DEFAULT_TARGET_DEMAND_TABLE = "demands"
DEFAULT_TARGET_USER_TABLE = "sys_users"

BID_COMMENT_ID_OFFSET = 200_000_000

FOLLOW_UP_COLUMNS = (
    "id",
    "demand_id",
    "operator_id",
    "action",
    "content",
    "old_status",
    "new_status",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy bid comments into demand_follow_ups.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-bid-table", default=DEFAULT_SOURCE_BID_TABLE)
    parser.add_argument("--source-bid-comment-table", default=DEFAULT_SOURCE_BID_COMMENT_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-demand-table", default=DEFAULT_TARGET_DEMAND_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for demand follow-up migration: {', '.join(missing)}")


def fetch_bid_demand_ids(conn, table: str) -> dict[int, int]:
    sql = f"SELECT id, tid FROM {quote_ident(table)} WHERE id > 0 AND tid > 0"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {int(row["id"]): int(row["tid"]) for row in cur.fetchall()}


def fetch_bid_comments(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT cid, bid, title, username, uid, content, ctime, ifopen, is_del
        FROM {quote_ident(table)}
        WHERE cid > 0
        ORDER BY cid
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_ids(conn, table: str, column: str = "id") -> set[int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT {quote_ident(column)} AS id FROM {quote_ident(table)}")
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


def build_follow_up_row(row: dict, *, demand_id: int, target_user_ids: set[int]) -> dict:
    legacy_id = normalize_int(row.get("cid"))
    operator_id = normalize_int(row.get("uid"))
    if operator_id <= 0 or operator_id not in target_user_ids:
        operator_id = None
    created_at = fallback_datetime(row.get("ctime"))
    title = clean_text(row.get("title"), 200)
    content = clean_required(row.get("content"), 4000)
    username = clean_text(row.get("username"), 100)
    prefix = f"{title}\n" if title else ""
    suffix = f"\n-- {username}" if username else ""
    visible = normalize_int(row.get("ifopen"), default=1) == 1 and normalize_int(row.get("is_del")) == 0
    return {
        "id": BID_COMMENT_ID_OFFSET + legacy_id,
        "demand_id": demand_id,
        "operator_id": operator_id,
        "action": "CONTACT_RECORD",
        "content": f"{prefix}{content}{suffix}"[:4000],
        "old_status": None,
        "new_status": 2 if visible else 5,
        "created_at": created_at,
        "updated_at": created_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in FOLLOW_UP_COLUMNS)
    placeholders = ", ".join(["%s"] * len(FOLLOW_UP_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in FOLLOW_UP_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    bid_demand_ids = fetch_bid_demand_ids(source_conn, args.source_bid_table)
    target_demand_ids = fetch_ids(target_conn, args.target_demand_table)
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    existing_ids = fetch_existing_ids(target_conn, args.target_table, args.batch_size)
    source_rows = fetch_bid_comments(source_conn, args.source_bid_comment_table)

    stats = RunStats(scanned=len(source_rows))
    target_rows: list[dict] = []
    for source_row in source_rows:
        target_id = BID_COMMENT_ID_OFFSET + normalize_int(source_row.get("cid"))
        if target_id in existing_ids:
            stats.skip("existing_follow_up")
            continue
        demand_id = bid_demand_ids.get(normalize_int(source_row.get("bid")))
        if demand_id not in target_demand_ids:
            stats.skip("missing_demand")
            continue
        target_rows.append(build_follow_up_row(source_row, demand_id=demand_id, target_user_ids=target_user_ids))
        existing_ids.add(target_id)

    stats.inserted = insert_rows(target_conn, args.target_table, target_rows, args.batch_size) if apply else len(target_rows)
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
    print(f"[{mode}] legacy demand follow-ups migration")
    print_summary("demand_follow_ups", stats)


if __name__ == "__main__":
    main()
