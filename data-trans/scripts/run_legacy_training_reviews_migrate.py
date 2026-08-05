#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from decimal import Decimal, ROUND_HALF_UP

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import (
    asset_url,
    bounded_int,
    clean_required,
    clean_text,
    fallback_datetime,
    legacy_date,
    legacy_datetime,
)
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_comment_course"
DEFAULT_TARGET_TABLE = "training_reviews"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_COURSE_TABLE = "courses"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"
DEFAULT_TARGET_INSTITUTION_TABLE = "user_institutions"
DEFAULT_TARGET_CASE_TABLE = "user_trainer_cases"

REVIEW_COLUMNS = (
    "id",
    "review_scope",
    "course_id",
    "trainer_user_id",
    "institution_id",
    "case_id",
    "order_id",
    "expert_name",
    "training_date",
    "course_days",
    "course_title",
    "client_company",
    "training_location",
    "rating_content",
    "rating_teaching",
    "rating_service",
    "avg_score",
    "comment_text",
    "photo_urls",
    "submitter_name",
    "submitter_contact",
    "user_id",
    "status",
    "reject_reason",
    "reviewed_by",
    "reviewed_at",
    "anonymous",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_comment_course rows into training_reviews.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-course-table", default=DEFAULT_TARGET_COURSE_TABLE)
    parser.add_argument("--target-trainer-table", default=DEFAULT_TARGET_TRAINER_TABLE)
    parser.add_argument("--target-institution-table", default=DEFAULT_TARGET_INSTITUTION_TABLE)
    parser.add_argument("--target-case-table", default=DEFAULT_TARGET_CASE_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for review migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT
            id, course_id, order_id, course_title, to_userid, from_userid,
            c_classmatch, c_teacherlevel, c_service, course_time, appearing_day,
            from_user_company, show_user_company, province_name, city_name, address, area_name,
            comment, is_del, createtime, updatetime, status, reason, is_show, is_anonymous,
            picurl, thumbpicurl, lecturer, stu_tel, stu_contact, from_user_realname,
            review_userid, review_time, is_case_chief, case_id
        FROM {quote_ident(table)}
        WHERE id > 0
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_ids(conn, table: str, column: str = "id") -> set[int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT {quote_ident(column)} AS id FROM {quote_ident(table)}")
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def fetch_institution_ids_by_user(conn, table: str) -> dict[int, int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, user_id FROM {quote_ident(table)} WHERE user_id > 0")
        return {int(row["user_id"]): int(row["id"]) for row in cur.fetchall()}


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


def rating(value: object) -> int:
    return bounded_int(value, default=0, minimum=0, maximum=5)


def avg_score(*values: int) -> Decimal:
    non_zero = [value for value in values if value > 0]
    if not non_zero:
        return Decimal("0.00")
    score = Decimal(sum(non_zero)) / Decimal(len(non_zero))
    return score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def map_status(row: dict) -> int:
    if normalize_int(row.get("is_del")) == 1 or normalize_int(row.get("is_show"), 1) == 0:
        return 2
    legacy_status = normalize_int(row.get("status"), default=0)
    if legacy_status == 1:
        return 1
    if legacy_status < 0:
        return -1
    return 0


def photo_urls(row: dict, asset_base_url: str) -> str | None:
    urls = []
    for key in ("picurl", "thumbpicurl"):
        url = asset_url(row.get(key), asset_base_url)
        if url and url not in urls:
            urls.append(url)
    return json.dumps(urls, ensure_ascii=False) if urls else None


def location_text(row: dict) -> str | None:
    parts = [
        clean_text(row.get("province_name"), 50),
        clean_text(row.get("city_name"), 50),
        clean_text(row.get("area_name"), 50),
        clean_text(row.get("address"), 150),
    ]
    text = "".join(part for part in parts if part)
    return text[:200] if text else None


def build_review_row(
    row: dict,
    *,
    target_course_ids: set[int],
    target_trainer_user_ids: set[int],
    institution_id_by_user: dict[int, int],
    target_case_ids: set[int],
    asset_base_url: str,
) -> dict:
    review_id = normalize_int(row.get("id"))
    old_course_id = normalize_int(row.get("course_id"))
    course_id = old_course_id if old_course_id in target_course_ids else None
    to_user_id = normalize_int(row.get("to_userid"))
    institution_id = institution_id_by_user.get(to_user_id)
    trainer_user_id = to_user_id if to_user_id in target_trainer_user_ids else None

    if course_id is not None:
        review_scope = "COURSE"
    elif institution_id is not None:
        review_scope = "INSTITUTION"
    elif trainer_user_id is not None:
        review_scope = "TRAINER"
    else:
        review_scope = "COURSE"

    source_case_id = normalize_int(row.get("case_id"))
    case_id = source_case_id if source_case_id in target_case_ids else None
    if case_id is None and normalize_int(row.get("is_case_chief")) == 1 and review_id in target_case_ids:
        case_id = review_id

    rating_content = rating(row.get("c_classmatch"))
    rating_teaching = rating(row.get("c_teacherlevel"))
    rating_service = rating(row.get("c_service"))
    created_at = fallback_datetime(row.get("createtime"), row.get("updatetime"))
    updated_at = legacy_datetime(row.get("updatetime")) or created_at
    status = map_status(row)
    reviewed_at = legacy_datetime(row.get("review_time")) if status in {1, -1} else None
    if reviewed_at is None and status in {1, -1}:
        reviewed_at = updated_at

    return {
        "id": review_id,
        "review_scope": review_scope,
        "course_id": course_id,
        "trainer_user_id": trainer_user_id,
        "institution_id": institution_id,
        "case_id": case_id,
        "order_id": normalize_int(row.get("order_id")) or None,
        "expert_name": clean_text(row.get("lecturer"), 100),
        "training_date": legacy_date(row.get("course_time")),
        "course_days": Decimal(str(row.get("appearing_day") or "0")).quantize(Decimal("0.1")),
        "course_title": clean_text(row.get("course_title"), 200),
        "client_company": clean_text(row.get("show_user_company"), 200)
        or clean_text(row.get("from_user_company"), 200),
        "training_location": location_text(row),
        "rating_content": rating_content,
        "rating_teaching": rating_teaching,
        "rating_service": rating_service,
        "avg_score": avg_score(rating_content, rating_teaching, rating_service),
        "comment_text": clean_required(row.get("comment"), 65535) or "legacy review",
        "photo_urls": photo_urls(row, asset_base_url),
        "submitter_name": clean_text(row.get("from_user_realname"), 50),
        "submitter_contact": clean_text(row.get("stu_tel"), 50) or clean_text(row.get("stu_contact"), 50),
        "user_id": normalize_int(row.get("from_userid")),
        "status": status,
        "reject_reason": clean_text(row.get("reason"), 500),
        "reviewed_by": normalize_int(row.get("review_userid")) or None,
        "reviewed_at": reviewed_at,
        "anonymous": 1 if normalize_int(row.get("is_anonymous")) == 1 else 0,
        "created_at": created_at,
        "updated_at": updated_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in REVIEW_COLUMNS)
    placeholders = ", ".join(["%s"] * len(REVIEW_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in REVIEW_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_table)
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    target_course_ids = fetch_ids(target_conn, args.target_course_table)
    target_trainer_user_ids = fetch_ids(target_conn, args.target_trainer_table, "user_id")
    institution_id_by_user = fetch_institution_ids_by_user(target_conn, args.target_institution_table)
    target_case_ids = fetch_ids(target_conn, args.target_case_table)
    existing_ids = fetch_existing_ids(target_conn, args.target_table, args.batch_size)

    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))
    for source_row in source_rows:
        review_id = normalize_int(source_row.get("id"))
        if review_id <= 0:
            stats.skip("invalid_id")
            continue
        if review_id in existing_ids:
            stats.skip("existing_review")
            continue
        user_id = normalize_int(source_row.get("from_userid"))
        if user_id <= 0 or user_id not in target_user_ids:
            stats.skip("missing_submitter")
            continue
        row = build_review_row(
            source_row,
            target_course_ids=target_course_ids,
            target_trainer_user_ids=target_trainer_user_ids,
            institution_id_by_user=institution_id_by_user,
            target_case_ids=target_case_ids,
            asset_base_url=args.asset_base_url,
        )
        if not row["course_id"] and not row["trainer_user_id"] and not row["institution_id"] and not row["case_id"]:
            stats.skip("missing_target")
            continue
        existing_ids.add(review_id)
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
    print(f"[{mode}] legacy training reviews migration")
    print_summary("training_reviews", stats)


if __name__ == "__main__":
    main()
