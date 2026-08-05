#!/usr/bin/env python3
from __future__ import annotations

import argparse
from decimal import Decimal

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import (
    clean_required,
    clean_text,
    fallback_datetime,
    legacy_date,
    legacy_datetime,
)
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_DEMAND_TABLE = "taoke.tk_demand"
DEFAULT_SOURCE_COMPANY_DEMAND_TABLE = "taoke.tk_company_demand"
DEFAULT_TARGET_TABLE = "demands"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_COURSE_TABLE = "courses"
DEFAULT_TARGET_ENTERPRISE_BUYER_TABLE = "user_enterprise_buyers"

COMPANY_DEMAND_ID_OFFSET = 100_000_000

DEMAND_COLUMNS = (
    "id",
    "demand_no",
    "user_id",
    "enterprise_id",
    "demand_type",
    "title",
    "training_topic",
    "trainee_count",
    "budget_min",
    "budget_max",
    "expected_start_date",
    "format",
    "course_type",
    "intended_trainer",
    "description",
    "source_case_id",
    "source_course_id",
    "contact_name",
    "contact_phone",
    "company_name",
    "contact_email",
    "company_tel",
    "expertise_category_id",
    "expected_proposal_count",
    "source_trainer_id",
    "course_kind",
    "province_id",
    "city_id",
    "district_id",
    "status",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy demand tables into demands.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-demand-table", default=DEFAULT_SOURCE_DEMAND_TABLE)
    parser.add_argument("--source-company-demand-table", default=DEFAULT_SOURCE_COMPANY_DEMAND_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-course-table", default=DEFAULT_TARGET_COURSE_TABLE)
    parser.add_argument("--target-enterprise-buyer-table", default=DEFAULT_TARGET_ENTERPRISE_BUYER_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for demand migration: {', '.join(missing)}")


def fetch_demands(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT
            id, company_id, course_id, course_title, realname, company, mobile,
            createtime, status, userid, type, process_status, cs_status, cs_reason,
            process_reason, province, city, course_time, remark, email
        FROM {quote_ident(table)}
        WHERE id > 0
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_company_demands(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT
            id, company_id, company_name, content, realname, company, mobile,
            createtime, user_id, is_view
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


def fetch_enterprises_by_user(conn, table: str) -> dict[int, int]:
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


def map_status(row: dict) -> int:
    legacy_status = normalize_int(row.get("status"), default=1)
    process_status = normalize_int(row.get("process_status"))
    if legacy_status < 0:
        return 5
    if process_status >= 3:
        return 4
    if process_status == 2:
        return 2
    return 1


def demand_no(prefix: str, value: int) -> str:
    return f"{prefix}{value:08d}"[:32]


def target_user(raw_user_id: object, fallback_user_id: object, target_user_ids: set[int]) -> int | None:
    for value in (raw_user_id, fallback_user_id):
        user_id = normalize_int(value)
        if user_id > 0 and user_id in target_user_ids:
            return user_id
    return None


def build_demand_row(
    row: dict,
    *,
    target_user_ids: set[int],
    target_course_ids: set[int],
    enterprise_id_by_user: dict[int, int],
) -> dict:
    demand_id = normalize_int(row.get("id"))
    user_id = target_user(row.get("userid"), row.get("company_id"), target_user_ids)
    course_id = normalize_int(row.get("course_id"))
    created_at = fallback_datetime(row.get("createtime"))
    description = clean_text(row.get("remark")) or clean_text(row.get("process_reason")) or clean_text(row.get("cs_reason"))
    return {
        "id": demand_id,
        "demand_no": demand_no("XQ", demand_id),
        "user_id": user_id,
        "enterprise_id": enterprise_id_by_user.get(user_id) if user_id else None,
        "demand_type": "INTERNAL_RESERVATION",
        "title": clean_required(row.get("course_title"), 200),
        "training_topic": clean_required(row.get("course_title"), 200),
        "trainee_count": None,
        "budget_min": None,
        "budget_max": None,
        "expected_start_date": legacy_date(row.get("course_time")),
        "format": "OFFLINE",
        "course_type": "INTERNAL",
        "intended_trainer": None,
        "description": description,
        "source_case_id": None,
        "source_course_id": course_id if course_id in target_course_ids else None,
        "contact_name": clean_text(row.get("realname"), 50),
        "contact_phone": clean_text(row.get("mobile"), 30),
        "company_name": clean_text(row.get("company"), 200),
        "contact_email": clean_text(row.get("email"), 100),
        "company_tel": None,
        "expertise_category_id": None,
        "expected_proposal_count": None,
        "source_trainer_id": None,
        "course_kind": "INTERNAL",
        "province_id": normalize_int(row.get("province")) or None,
        "city_id": normalize_int(row.get("city")) or None,
        "district_id": None,
        "status": map_status(row),
        "created_at": created_at,
        "updated_at": legacy_datetime(row.get("createtime")) or created_at,
    }


def build_company_demand_row(
    row: dict,
    *,
    target_user_ids: set[int],
    enterprise_id_by_user: dict[int, int],
) -> dict:
    legacy_id = normalize_int(row.get("id"))
    demand_id = COMPANY_DEMAND_ID_OFFSET + legacy_id
    user_id = target_user(row.get("user_id"), row.get("company_id"), target_user_ids)
    created_at = fallback_datetime(row.get("createtime"))
    content = clean_text(row.get("content"))
    return {
        "id": demand_id,
        "demand_no": demand_no("XQCD", legacy_id),
        "user_id": user_id,
        "enterprise_id": enterprise_id_by_user.get(user_id) if user_id else None,
        "demand_type": "TRAINING",
        "title": clean_required(content, 200),
        "training_topic": clean_required(content, 200),
        "trainee_count": None,
        "budget_min": None,
        "budget_max": None,
        "expected_start_date": None,
        "format": "OFFLINE",
        "course_type": "INTERNAL",
        "intended_trainer": None,
        "description": content,
        "source_case_id": None,
        "source_course_id": None,
        "contact_name": clean_text(row.get("realname"), 50),
        "contact_phone": clean_text(row.get("mobile"), 30),
        "company_name": clean_text(row.get("company"), 200) or clean_text(row.get("company_name"), 200),
        "contact_email": None,
        "company_tel": None,
        "expertise_category_id": None,
        "expected_proposal_count": None,
        "source_trainer_id": None,
        "course_kind": "INTERNAL",
        "province_id": None,
        "city_id": None,
        "district_id": None,
        "status": 2 if normalize_int(row.get("is_view")) == 1 else 1,
        "created_at": created_at,
        "updated_at": created_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in DEMAND_COLUMNS)
    placeholders = ", ".join(["%s"] * len(DEMAND_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in DEMAND_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> dict[str, RunStats]:
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    target_course_ids = fetch_ids(target_conn, args.target_course_table)
    enterprise_id_by_user = fetch_enterprises_by_user(target_conn, args.target_enterprise_buyer_table)
    existing_ids = fetch_existing_ids(target_conn, args.target_table, args.batch_size)

    demand_rows = fetch_demands(source_conn, args.source_demand_table)
    demand_stats = RunStats(scanned=len(demand_rows))
    demand_target_rows: list[dict] = []
    for source_row in demand_rows:
        demand_id = normalize_int(source_row.get("id"))
        if demand_id <= 0:
            demand_stats.skip("invalid_id")
            continue
        if demand_id in existing_ids:
            demand_stats.skip("existing_demand")
            continue
        row = build_demand_row(
            source_row,
            target_user_ids=target_user_ids,
            target_course_ids=target_course_ids,
            enterprise_id_by_user=enterprise_id_by_user,
        )
        existing_ids.add(demand_id)
        demand_target_rows.append(row)

    company_rows = fetch_company_demands(source_conn, args.source_company_demand_table)
    company_stats = RunStats(scanned=len(company_rows))
    company_target_rows: list[dict] = []
    for source_row in company_rows:
        demand_id = COMPANY_DEMAND_ID_OFFSET + normalize_int(source_row.get("id"))
        if demand_id in existing_ids:
            company_stats.skip("existing_demand")
            continue
        row = build_company_demand_row(
            source_row,
            target_user_ids=target_user_ids,
            enterprise_id_by_user=enterprise_id_by_user,
        )
        existing_ids.add(demand_id)
        company_target_rows.append(row)

    demand_stats.inserted = (
        insert_rows(target_conn, args.target_table, demand_target_rows, args.batch_size)
        if apply
        else len(demand_target_rows)
    )
    company_stats.inserted = (
        insert_rows(target_conn, args.target_table, company_target_rows, args.batch_size)
        if apply
        else len(company_target_rows)
    )
    return {"demands": demand_stats, "company_demands": company_stats}


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
    print(f"[{mode}] legacy demands migration")
    for name, stat in stats.items():
        print_summary(name, stat)


if __name__ == "__main__":
    main()
