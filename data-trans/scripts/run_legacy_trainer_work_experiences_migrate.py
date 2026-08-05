#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import asset_url, clean_required, clean_text, fallback_datetime, legacy_date, legacy_datetime, map_review_status
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_member_work"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"
DEFAULT_TARGET_TABLE = "trainer_work_experiences"

WORK_COLUMNS = (
    "trainer_id",
    "company_name",
    "position",
    "start_date",
    "end_date",
    "job_description",
    "proof_file",
    "status",
    "reject_reason",
    "audited_at",
    "sort_order",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_member_work rows into trainer_work_experiences.",
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
        raise SystemExit(f"missing required DSN arguments for trainer work migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT *
        FROM {quote_ident(table)}
        WHERE uid > 0
          AND is_deleted = 0
        ORDER BY uid, wk_id
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
    sql = f"SELECT trainer_id, company_name, position, start_date FROM {quote_ident(table)}"
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
                        str(row.get("company_name") or "").strip(),
                        str(row.get("position") or "").strip(),
                        row.get("start_date"),
                    )
                )
    return keys


def build_work_row(row: dict, asset_base_url: str) -> dict:
    created_at = fallback_datetime(row.get("createtime"), row.get("updatetime"))
    status = map_review_status(row.get("status")) or 1
    return {
        "trainer_id": normalize_int(row.get("uid")),
        "company_name": clean_required(row.get("wk_company"), 200),
        "position": clean_required(row.get("wk_position"), 100),
        "start_date": legacy_date(row.get("wk_startdate")),
        "end_date": legacy_date(row.get("wk_enddate")),
        "job_description": None,
        "proof_file": asset_url(row.get("wk_caimg"), asset_base_url) or "",
        "status": status,
        "reject_reason": clean_required(row.get("wk_approvememo"), 255) if status == 3 else "",
        "audited_at": legacy_datetime(row.get("wk_approvetime")) if status in {2, 3} else None,
        "sort_order": normalize_int(row.get("wk_id")),
        "created_at": created_at,
        "updated_at": legacy_datetime(row.get("updatetime")) or created_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in WORK_COLUMNS)
    placeholders = ", ".join(["%s"] * len(WORK_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in WORK_COLUMNS) for row in batch])
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
        work_row = build_work_row(source_row, args.asset_base_url)
        if not clean_text(work_row["company_name"]):
            stats.skip("blank_company")
            continue
        if work_row["start_date"] is None:
            stats.skip("blank_start_date")
            continue
        key = (
            work_row["trainer_id"],
            work_row["company_name"].strip(),
            work_row["position"].strip(),
            work_row["start_date"],
        )
        if key in existing_keys:
            stats.skip("existing_work")
            continue
        existing_keys.add(key)
        rows.append(work_row)

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
    print(f"[{mode}] legacy trainer work experiences migration")
    print_summary("trainer_work_experiences", stats)


if __name__ == "__main__":
    main()
