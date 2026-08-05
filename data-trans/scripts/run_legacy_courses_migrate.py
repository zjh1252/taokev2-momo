#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
import re
from decimal import Decimal

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import (
    bounded_int,
    clean_required,
    clean_text,
    fallback_datetime,
    first_text,
    legacy_datetime,
    money_or_none,
    score_0_to_5,
)
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_COURSEINFO_TABLE = "taoke.tk_courseinfo"
DEFAULT_SOURCE_COURSEDATA_TABLE = "taoke.tk_coursedata"
DEFAULT_SOURCE_OPEN_COURSE_TABLE = "taoke.tk_course"
DEFAULT_SOURCE_MEMBER_TABLE = "taoke.tk_member"
DEFAULT_SOURCE_CATE_TABLE = "taoke.tk_cate"
DEFAULT_TARGET_TABLE = "courses"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"
DEFAULT_TARGET_INSTITUTION_TABLE = "user_institutions"
DEFAULT_TARGET_CATEGORY_TABLE = "sys_categories"

COURSE_COLUMNS = (
    "id",
    "title",
    "type",
    "publisher_id",
    "publisher_type",
    "category_id",
    "sub_category_id",
    "cover_url",
    "intro",
    "summary",
    "syllabus",
    "material_url",
    "material_text",
    "audience",
    "highlights",
    "duration_days",
    "total_hours",
    "price",
    "original_price",
    "keywords",
    "trainer_id",
    "is_featured",
    "is_free",
    "has_plan",
    "status",
    "reject_reason",
    "sort_order",
    "view_count",
    "enrollment_count",
    "last_enrolled_at",
    "score",
    "published_at",
    "course_open_end_date",
    "is_expire_hide",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_courseinfo/tk_coursedata rows into courses.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-courseinfo-table", default=DEFAULT_SOURCE_COURSEINFO_TABLE)
    parser.add_argument("--source-coursedata-table", default=DEFAULT_SOURCE_COURSEDATA_TABLE)
    parser.add_argument("--source-open-course-table", default=DEFAULT_SOURCE_OPEN_COURSE_TABLE)
    parser.add_argument("--source-member-table", default=DEFAULT_SOURCE_MEMBER_TABLE)
    parser.add_argument("--source-cate-table", default=DEFAULT_SOURCE_CATE_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-trainer-table", default=DEFAULT_TARGET_TRAINER_TABLE)
    parser.add_argument("--target-institution-table", default=DEFAULT_TARGET_INSTITUTION_TABLE)
    parser.add_argument("--target-category-table", default=DEFAULT_TARGET_CATEGORY_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for course migration: {', '.join(missing)}")


def fetch_source_rows(conn, args: argparse.Namespace) -> list[dict]:
    courseinfo = quote_ident(args.source_courseinfo_table)
    coursedata = quote_ident(args.source_coursedata_table)
    open_course = quote_ident(args.source_open_course_table)
    member = quote_ident(args.source_member_table)
    sql = f"""
        SELECT
            ci.id,
            ci.title,
            ci.cid,
            ci.subcid,
            ci.type AS legacy_type,
            ci.toff,
            ci.cdays,
            ci.hour_every_day,
            ci.lecturer,
            ci.organ,
            ci.organid,
            ci.tags,
            ci.isopen,
            ci.states,
            ci.createtime,
            ci.causes,
            ci.mold,
            ci.modified,
            ci.lecturerid,
            ci.lecturerid_type,
            cd.intro AS detail_intro,
            cd.overview AS detail_overview,
            cd.audiences AS detail_audiences,
            cd.income AS detail_income,
            cd.feature AS detail_feature,
            cd.outline AS detail_outline,
            cd.content AS detail_content,
            cd.background AS detail_background,
            cd.abstract AS detail_abstract,
            pm.groupid AS publisher_groupid,
            oc.plan_count,
            oc.first_begin,
            oc.last_finish,
            oc.max_hit,
            oc.max_level,
            oc.max_comments,
            oc.max_isrecommend,
            oc.min_price,
            oc.min_special_price
        FROM {courseinfo} ci
        LEFT JOIN {coursedata} cd ON cd.courseid = ci.id
        LEFT JOIN {member} pm ON pm.id = ci.organid
        LEFT JOIN (
            SELECT
                cid,
                SUM(CASE WHEN type = 1 THEN 1 ELSE 0 END) AS plan_count,
                MIN(CASE WHEN type = 1 AND begin > 0 THEN begin ELSE NULL END) AS first_begin,
                MAX(CASE WHEN type = 1 AND finish > 0 THEN finish ELSE NULL END) AS last_finish,
                MAX(hit) AS max_hit,
                MAX(level) AS max_level,
                MAX(comments) AS max_comments,
                MAX(isrecommend) AS max_isrecommend,
                MIN(CASE WHEN price > 0 THEN price ELSE NULL END) AS min_price,
                MIN(CASE WHEN special_price > 0 THEN special_price ELSE NULL END) AS min_special_price
            FROM {open_course}
            GROUP BY cid
        ) oc ON oc.cid = ci.id
        WHERE ci.id > 0
        ORDER BY ci.id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_target_ids(conn, table: str, column: str = "id") -> set[int]:
    sql = f"SELECT {quote_ident(column)} AS id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def fetch_category_name_by_old_id(conn, table: str) -> dict[int, str]:
    sql = f"""
        SELECT child.id AS id, COALESCE(parent.name, child.name) AS name
        FROM {quote_ident(table)} child
        LEFT JOIN {quote_ident(table)} parent ON parent.id = child.sub
        WHERE child.id > 0
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return {int(row["id"]): str(row["name"] or "").strip() for row in cur.fetchall()}


def fetch_target_course_categories(conn, table: str) -> dict[str, int]:
    sql = f"""
        SELECT id, name
        FROM {quote_ident(table)}
        WHERE type = 'COURSE_CATEGORY'
          AND level = 1
          AND parent_id = 0
          AND name IS NOT NULL
          AND TRIM(name) <> ''
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return {str(row["name"]).strip(): int(row["id"]) for row in cur.fetchall()}


def build_category_lookup(source_conn, target_conn, source_cate_table: str, target_category_table: str) -> dict[int, int]:
    old_name_by_id = fetch_category_name_by_old_id(source_conn, source_cate_table)
    target_id_by_name = fetch_target_course_categories(target_conn, target_category_table)
    return {old_id: target_id_by_name[name] for old_id, name in old_name_by_id.items() if name in target_id_by_name}


def numeric_tokens(value: object) -> list[int]:
    if value is None:
        return []
    return [int(match) for match in re.findall(r"\d+", str(value)) if int(match) > 0]


def first_token(value: object) -> int:
    tokens = numeric_tokens(value)
    return tokens[0] if tokens else 0


def map_course_type(value: object) -> str:
    tokens = set(numeric_tokens(value))
    if 1 in tokens and 2 not in tokens:
        return "OPEN_OFFLINE"
    if 1 in tokens and 2 in tokens:
        return "OPEN_OFFLINE"
    return "INTERNAL"


def map_course_status(row: dict) -> int:
    states = normalize_int(row.get("states"), default=0)
    isopen = normalize_int(row.get("isopen"), default=0)
    if states == -1:
        return 3
    if states == 1 and isopen == 1:
        return 2
    if states == 1:
        return 4
    return 1


def duration_days(row: dict) -> int:
    try:
        cdays = float(row.get("cdays") or 0)
    except (TypeError, ValueError):
        cdays = 0
    if cdays > 0:
        return max(1, math.ceil(cdays))
    return 1


def total_hours(row: dict, days: int) -> Decimal:
    hours_per_day = bounded_int(row.get("hour_every_day"), default=7)
    if hours_per_day <= 0:
        hours_per_day = 7
    return Decimal(days * hours_per_day).quantize(Decimal("0.0"))


def map_publisher_type(row: dict, trainer_ids: set[int], institution_user_ids: set[int]) -> str | None:
    publisher_id = normalize_int(row.get("organid"))
    group_id = normalize_int(row.get("publisher_groupid"))
    if group_id == 3 and publisher_id in institution_user_ids:
        return "INSTITUTION"
    if group_id == 9 and publisher_id in trainer_ids:
        return "TRAINER"
    if publisher_id in institution_user_ids and publisher_id not in trainer_ids:
        return "INSTITUTION"
    if publisher_id in trainer_ids:
        return "TRAINER"
    if publisher_id in institution_user_ids:
        return "INSTITUTION"
    return None


def map_course_category(row: dict, category_lookup: dict[int, int]) -> int:
    for raw in (row.get("cid"), row.get("subcid")):
        category_id = first_token(raw)
        if category_id in category_lookup:
            return category_lookup[category_id]
    return 0


def build_course_row(row: dict, trainer_ids: set[int], institution_user_ids: set[int], category_lookup: dict[int, int]) -> dict:
    course_id = int(row["id"])
    course_type = map_course_type(row.get("legacy_type"))
    publisher_type = map_publisher_type(row, trainer_ids, institution_user_ids)
    publisher_id = normalize_int(row.get("organid"))
    days = duration_days(row)
    created_at = fallback_datetime(row.get("createtime"), row.get("modified"))
    updated_at = legacy_datetime(row.get("modified")) or created_at
    status = map_course_status(row)
    has_plan = 1 if course_type.startswith("OPEN") and normalize_int(row.get("plan_count")) > 0 else 0
    price = money_or_none(row.get("min_special_price")) or money_or_none(row.get("min_price")) or Decimal("0.00")
    original_price = money_or_none(row.get("min_price"), zero_is_none=False) or price
    trainer_id = normalize_int(row.get("lecturerid")) if normalize_int(row.get("lecturerid_type")) == 1 else 0
    if trainer_id not in trainer_ids:
        trainer_id = 0
    return {
        "id": course_id,
        "title": clean_required(row.get("title"), 200) or f"未命名课程{course_id}",
        "type": course_type,
        "publisher_id": publisher_id,
        "publisher_type": publisher_type or "INSTITUTION",
        "category_id": map_course_category(row, category_lookup),
        "sub_category_id": 0,
        "cover_url": "",
        "intro": first_text(row, ("detail_intro", "detail_overview", "detail_content")),
        "summary": clean_text(row.get("detail_abstract"), 500) or "",
        "syllabus": clean_text(row.get("detail_outline")),
        "material_url": None,
        "material_text": None,
        "audience": clean_text(row.get("detail_audiences")),
        "highlights": "\n".join(
            item for item in (
                clean_text(row.get("detail_income")),
                clean_text(row.get("detail_feature")),
            )
            if item
        )
        or None,
        "duration_days": days,
        "total_hours": total_hours(row, days),
        "price": price if course_type.startswith("OPEN") else Decimal("0.00"),
        "original_price": original_price if course_type.startswith("OPEN") else Decimal("0.00"),
        "keywords": clean_required(row.get("tags"), 500),
        "trainer_id": trainer_id,
        "is_featured": 1 if normalize_int(row.get("max_isrecommend")) == 1 else 0,
        "is_free": 1 if price <= 0 else 0,
        "has_plan": has_plan,
        "status": status,
        "reject_reason": clean_required(row.get("causes"), 500) if status == 3 else "",
        "sort_order": 0,
        "view_count": bounded_int(row.get("max_hit"), default=0),
        "enrollment_count": 0,
        "last_enrolled_at": None,
        "score": score_0_to_5(row.get("max_level")) if publisher_type == "INSTITUTION" else Decimal("0.00"),
        "published_at": created_at if status == 2 and course_type.startswith("OPEN") else None,
        "course_open_end_date": legacy_datetime(row.get("last_finish")).date()
        if has_plan and legacy_datetime(row.get("last_finish")) is not None
        else None,
        "is_expire_hide": 1,
        "created_at": created_at,
        "updated_at": updated_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in COURSE_COLUMNS)
    placeholders = ", ".join(["%s"] * len(COURSE_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in COURSE_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args)
    target_user_ids = fetch_target_ids(target_conn, args.target_user_table)
    trainer_ids = fetch_target_ids(target_conn, args.target_trainer_table)
    institution_user_ids = fetch_target_ids(target_conn, args.target_institution_table, column="user_id")
    existing_course_ids = fetch_target_ids(target_conn, args.target_table)
    category_lookup = build_category_lookup(source_conn, target_conn, args.source_cate_table, args.target_category_table)

    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))
    for row in source_rows:
        course_id = normalize_int(row.get("id"))
        publisher_id = normalize_int(row.get("organid"))
        if course_id <= 0:
            stats.skip("invalid_id")
            continue
        if course_id in existing_course_ids:
            stats.skip("existing_course")
            continue
        if publisher_id <= 0 or publisher_id not in target_user_ids:
            stats.skip("missing_publisher_user")
            continue
        publisher_type = map_publisher_type(row, trainer_ids, institution_user_ids)
        if publisher_type is None:
            stats.skip("missing_publisher_profile")
            continue
        existing_course_ids.add(course_id)
        rows.append(build_course_row(row, trainer_ids, institution_user_ids, category_lookup))

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
    print(f"[{mode}] legacy courses migration")
    print_summary("courses", stats)


if __name__ == "__main__":
    main()
