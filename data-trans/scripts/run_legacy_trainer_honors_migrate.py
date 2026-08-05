#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import asset_url, clean_required, clean_text, fallback_datetime, legacy_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_member_honor"
DEFAULT_TARGET_TABLE = "trainer_honors"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"

HONOR_COLUMNS = (
    "id",
    "trainer_id",
    "honor_name",
    "honor_image",
    "issuing_authority",
    "issued_at",
    "description",
    "sort_order",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_member_honor rows into trainer_honors.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-trainer-table", default=DEFAULT_TARGET_TRAINER_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for trainer honor migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT id, uid, title, cover, thumb, details, hits, is_status, createtime, updatetime, disabled
        FROM {quote_ident(table)}
        WHERE id > 0
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_ids(conn, table: str) -> set[int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {quote_ident(table)}")
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def fetch_existing_ids(conn, table: str, batch_size: int) -> set[int]:
    result: set[int] = set()
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {quote_ident(table)}")
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            result.update(int(row["id"]) for row in rows)
    return result


def build_honor_row(row: dict, asset_base_url: str) -> dict:
    created_at = fallback_datetime(row.get("createtime"), row.get("updatetime"))
    return {
        "id": normalize_int(row.get("id")),
        "trainer_id": normalize_int(row.get("uid")),
        "honor_name": clean_required(row.get("title"), 200) or "legacy honor",
        "honor_image": asset_url(row.get("cover"), asset_base_url) or asset_url(row.get("thumb"), asset_base_url) or "",
        "issuing_authority": "",
        "issued_at": None,
        "description": clean_text(row.get("details")),
        "sort_order": normalize_int(row.get("hits")) or normalize_int(row.get("id")),
        "created_at": created_at,
        "updated_at": legacy_datetime(row.get("updatetime")) or created_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in HONOR_COLUMNS)
    placeholders = ", ".join(["%s"] * len(HONOR_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in HONOR_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_table)
    trainer_ids = fetch_ids(target_conn, args.target_trainer_table)
    existing_ids = fetch_existing_ids(target_conn, args.target_table, args.batch_size)
    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))

    for source_row in source_rows:
        honor_id = normalize_int(source_row.get("id"))
        trainer_id = normalize_int(source_row.get("uid"))
        if honor_id <= 0:
            stats.skip("invalid_id")
            continue
        if honor_id in existing_ids:
            stats.skip("existing_honor")
            continue
        if trainer_id not in trainer_ids:
            stats.skip("missing_trainer")
            continue
        if normalize_int(source_row.get("disabled")) == 1 or normalize_int(source_row.get("is_status"), 1) <= 0:
            stats.skip("disabled_honor")
            continue
        existing_ids.add(honor_id)
        rows.append(build_honor_row(source_row, args.asset_base_url))

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
    print(f"[{mode}] legacy trainer honors migration")
    print_summary("trainer_honors", stats)


if __name__ == "__main__":
    main()
