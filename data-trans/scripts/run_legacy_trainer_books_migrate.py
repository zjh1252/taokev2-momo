#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import clean_required, clean_text, fallback_datetime, legacy_date, legacy_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_trainer_books"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"
DEFAULT_TARGET_TABLE = "user_trainer_books"
UNTITLED_BOOK_PREFIX = "\u8457\u4f5c#"

BOOK_COLUMNS = (
    "trainer_id",
    "submitter_user_id",
    "title",
    "author_name",
    "cover_url",
    "publisher",
    "publish_date",
    "description",
    "buy_url",
    "sort_order",
    "status",
    "reject_reason",
    "reviewer_id",
    "reviewed_at",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_trainer_books rows into user_trainer_books.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--target-trainer-table", default=DEFAULT_TARGET_TRAINER_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for trainer book migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT *
        FROM {quote_ident(table)}
        WHERE uid > 0
          AND disabled = 0
          AND is_status = 1
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_trainer_ids(conn, table: str) -> set[int]:
    sql = f"SELECT id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {normalize_int(row.get("id")) for row in cur.fetchall() if normalize_int(row.get("id")) > 0}


def fetch_existing_keys(conn, table: str, batch_size: int) -> set[tuple[int, str, str, object]]:
    sql = f"SELECT trainer_id, title, publisher, publish_date FROM {quote_ident(table)}"
    keys: set[tuple[int, str, str, object]] = set()
    with conn.cursor() as cur:
        cur.execute(sql)
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            for row in rows:
                keys.add(
                    (
                        normalize_int(row.get("trainer_id")),
                        str(row.get("title") or "").strip(),
                        str(row.get("publisher") or "").strip(),
                        row.get("publish_date"),
                    )
                )
    return keys


def build_book_row(row: dict) -> dict:
    created_at = fallback_datetime(row.get("createtime"), row.get("updatetime"))
    legacy_id = normalize_int(row.get("id"))
    source_title = clean_required(row.get("title"), 200)
    title = source_title or f"{UNTITLED_BOOK_PREFIX}{legacy_id}"
    return {
        "trainer_id": normalize_int(row.get("uid")),
        "submitter_user_id": None,
        "title": title,
        "author_name": None,
        "cover_url": clean_required(row.get("cover"), 500) or clean_required(row.get("thumb"), 500) or None,
        "publisher": clean_required(row.get("press"), 200),
        "publish_date": legacy_date(row.get("pubdate")),
        "description": clean_text(row.get("details"), 1000),
        "buy_url": clean_text(row.get("linkurl"), 500),
        "sort_order": legacy_id if source_title else 0,
        "status": 1,
        "reject_reason": None,
        "reviewer_id": None,
        "reviewed_at": None,
        "created_at": created_at,
        "updated_at": legacy_datetime(row.get("updatetime")) or created_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in BOOK_COLUMNS)
    placeholders = ", ".join(["%s"] * len(BOOK_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in BOOK_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_table)
    trainer_ids = fetch_trainer_ids(target_conn, args.target_trainer_table)
    existing_keys = fetch_existing_keys(target_conn, args.target_table, args.batch_size)

    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))
    for source_row in source_rows:
        trainer_id = normalize_int(source_row.get("uid"))
        if trainer_id not in trainer_ids:
            stats.skip("missing_trainer")
            continue
        book_row = build_book_row(source_row)
        key = (
            book_row["trainer_id"],
            book_row["title"].strip(),
            str(book_row["publisher"] or "").strip(),
            book_row["publish_date"],
        )
        if key in existing_keys:
            stats.skip("existing_book")
            continue
        existing_keys.add(key)
        rows.append(book_row)

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
    print(f"[{mode}] legacy trainer books migration")
    print_summary("user_trainer_books", stats)


if __name__ == "__main__":
    main()
