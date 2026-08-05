#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import clean_required
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_member_provider"
DEFAULT_TARGET_TABLE = "member_provider"
DEFAULT_TARGET_USER_TABLE = "sys_users"

PROVIDER_COLUMNS = ("id", "tkw_id", "tkw_type", "root_company_id", "regtime", "updatetime")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_member_provider rows into member_provider.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for member provider migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT id, tkw_id, tkw_type, root_company_id, regtime, updatetime
            FROM {quote_ident(table)}
            WHERE id > 0
            ORDER BY id
            """
        )
        return list(cur.fetchall())


def fetch_user_ids(conn, table: str) -> set[int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {quote_ident(table)}")
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def fetch_existing(conn, table: str, batch_size: int) -> tuple[set[int], set[int], set[tuple[str, int]]]:
    ids: set[int] = set()
    tkw_ids: set[int] = set()
    partner_keys: set[tuple[str, int]] = set()
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, tkw_id, tkw_type, root_company_id FROM {quote_ident(table)}")
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            for row in rows:
                ids.add(int(row["id"]))
                tkw_ids.add(int(row["tkw_id"]))
                partner_keys.add((str(row["tkw_type"]), int(row["root_company_id"])))
    return ids, tkw_ids, partner_keys


def build_provider_row(row: dict) -> dict:
    return {
        "id": normalize_int(row.get("id")),
        "tkw_id": normalize_int(row.get("tkw_id")),
        "tkw_type": clean_required(row.get("tkw_type"), 32),
        "root_company_id": normalize_int(row.get("root_company_id")),
        "regtime": normalize_int(row.get("regtime")),
        "updatetime": normalize_int(row.get("updatetime")),
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in PROVIDER_COLUMNS)
    placeholders = ", ".join(["%s"] * len(PROVIDER_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in PROVIDER_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_table)
    user_ids = fetch_user_ids(target_conn, args.target_user_table)
    existing_ids, existing_tkw_ids, existing_partner_keys = fetch_existing(target_conn, args.target_table, args.batch_size)
    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))

    for source_row in source_rows:
        row = build_provider_row(source_row)
        partner_key = (row["tkw_type"], row["root_company_id"])
        if row["id"] <= 0 or row["tkw_id"] <= 0:
            stats.skip("invalid_id")
            continue
        if row["tkw_id"] not in user_ids:
            stats.skip("missing_user")
            continue
        if row["id"] in existing_ids or row["tkw_id"] in existing_tkw_ids or partner_key in existing_partner_keys:
            stats.skip("existing_provider")
            continue
        existing_ids.add(row["id"])
        existing_tkw_ids.add(row["tkw_id"])
        existing_partner_keys.add(partner_key)
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
    print(f"[{mode}] legacy member provider migration")
    print_summary("member_provider", stats)


if __name__ == "__main__":
    main()
