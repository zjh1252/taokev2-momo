#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import (
    asset_url,
    clean_required,
    clean_text,
    fallback_datetime,
    join_texts,
    legacy_date,
    legacy_datetime,
)
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_comment_course"
DEFAULT_TARGET_TABLE = "user_trainer_cases"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"

CASE_COLUMNS = (
    "id",
    "trainer_id",
    "case_title",
    "enterprise_name",
    "industry",
    "training_topic",
    "keyword",
    "training_effect",
    "trainee_count",
    "province_id",
    "city_id",
    "district_id",
    "town_id",
    "training_address",
    "training_date",
    "training_end_date",
    "description",
    "cover_image",
    "view_count",
    "auto_extracted",
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
        description="Build trainer cases from legacy high-quality tk_comment_course rows.",
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
        raise SystemExit(f"missing required DSN arguments for trainer case migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT
            id, to_userid, course_id, course_title, from_user_company, show_user_company,
            province, city, area, address, comment, explain, add_comment, is_del,
            is_show, status, reason, support_num, review_userid, review_time, case_id,
            createtime, updatetime, course_time, picurl, thumbpicurl,
            is_case_chief, match_valid, match_review, bid_title
        FROM {quote_ident(table)}
        WHERE id > 0
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_trainer_ids(conn, table: str) -> set[int]:
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


def is_case_source(row: dict) -> bool:
    if normalize_int(row.get("is_case_chief")) == 1:
        return True
    if normalize_int(row.get("match_valid")) == 1 or normalize_int(row.get("match_review")) == 1:
        return True
    return normalize_int(row.get("case_id")) > 0


def map_case_status(row: dict) -> int:
    if normalize_int(row.get("is_del")) == 1 or normalize_int(row.get("is_show"), 1) == 0:
        return 2
    return 1 if normalize_int(row.get("status")) == 1 else 0


def build_case_row(row: dict, asset_base_url: str) -> dict:
    case_id = normalize_int(row.get("id"))
    created_at = fallback_datetime(row.get("createtime"), row.get("updatetime"))
    updated_at = legacy_datetime(row.get("updatetime")) or created_at
    status = map_case_status(row)
    reviewed_at = legacy_datetime(row.get("review_time")) if status == 1 else None
    if reviewed_at is None and status == 1:
        reviewed_at = updated_at
    title = clean_text(row.get("bid_title"), 200) or clean_text(row.get("course_title"), 200) or f"legacy case {case_id}"
    enterprise = (
        clean_text(row.get("show_user_company"), 200)
        or clean_text(row.get("from_user_company"), 200)
        or "legacy enterprise"
    )
    cover = asset_url(row.get("picurl"), asset_base_url) or asset_url(row.get("thumbpicurl"), asset_base_url) or ""
    return {
        "id": case_id,
        "trainer_id": normalize_int(row.get("to_userid")),
        "case_title": clean_required(title, 200),
        "enterprise_name": clean_required(enterprise, 200),
        "industry": "",
        "training_topic": clean_required(row.get("course_title"), 200),
        "keyword": None,
        "training_effect": clean_text(row.get("comment")),
        "trainee_count": None,
        "province_id": normalize_int(row.get("province")) or None,
        "city_id": normalize_int(row.get("city")) or None,
        "district_id": normalize_int(row.get("area")) or None,
        "town_id": None,
        "training_address": clean_text(row.get("address"), 255),
        "training_date": legacy_date(row.get("course_time")),
        "training_end_date": None,
        "description": join_texts(
            (row.get("comment"), row.get("explain"), row.get("add_comment")),
            separator="\n\n",
        ),
        "cover_image": cover,
        "view_count": normalize_int(row.get("support_num")),
        "auto_extracted": 1,
        "sort_order": normalize_int(row.get("support_num")),
        "status": status,
        "reject_reason": clean_required(row.get("reason"), 500),
        "reviewer_id": normalize_int(row.get("review_userid")) or None,
        "reviewed_at": reviewed_at,
        "created_at": created_at,
        "updated_at": updated_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in CASE_COLUMNS)
    placeholders = ", ".join(["%s"] * len(CASE_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in CASE_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_table)
    trainer_ids = fetch_trainer_ids(target_conn, args.target_trainer_table)
    existing_ids = fetch_existing_ids(target_conn, args.target_table, args.batch_size)
    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))

    for source_row in source_rows:
        case_id = normalize_int(source_row.get("id"))
        if case_id <= 0:
            stats.skip("invalid_id")
            continue
        if case_id in existing_ids:
            stats.skip("existing_case")
            continue
        if not is_case_source(source_row):
            stats.skip("not_case_source")
            continue
        trainer_id = normalize_int(source_row.get("to_userid"))
        if trainer_id not in trainer_ids:
            stats.skip("missing_trainer")
            continue
        row = build_case_row(source_row, args.asset_base_url)
        existing_ids.add(case_id)
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
    print(f"[{mode}] legacy trainer cases migration")
    print_summary("trainer_cases", stats)


if __name__ == "__main__":
    main()
