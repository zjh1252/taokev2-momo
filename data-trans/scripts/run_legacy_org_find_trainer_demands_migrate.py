#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import clean_required, clean_text, fallback_datetime, join_texts, legacy_date, legacy_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_demand_org_find_trainer"
DEFAULT_SOURCE_CONTACT_TABLE = "taoke.tk_demand_org_find_trainer_contact"
DEFAULT_SOURCE_EXT_TABLE = "taoke.tk_demand_org_find_trainer_ext"
DEFAULT_TARGET_TABLE = "demands"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"
DEFAULT_TARGET_ENTERPRISE_BUYER_TABLE = "user_enterprise_buyers"

ORG_FIND_TRAINER_ID_OFFSET = 200_000_000

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
        description="Migrate legacy organization-find-trainer demands into demands.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--source-contact-table", default=DEFAULT_SOURCE_CONTACT_TABLE)
    parser.add_argument("--source-ext-table", default=DEFAULT_SOURCE_EXT_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-trainer-table", default=DEFAULT_TARGET_TRAINER_TABLE)
    parser.add_argument("--target-enterprise-buyer-table", default=DEFAULT_TARGET_ENTERPRISE_BUYER_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for org-find-trainer demand migration: {', '.join(missing)}")


def fetch_source_rows(conn, args: argparse.Namespace) -> list[dict]:
    source = quote_ident(args.source_table)
    contact = quote_ident(args.source_contact_table)
    ext = quote_ident(args.source_ext_table)
    sql = f"""
        SELECT
            d.id,
            d.uid,
            d.title,
            d.trainerid,
            d.trainername,
            d.traintime,
            d.province,
            d.city,
            d.req_handler_id,
            d.ctime,
            d.utime,
            d.totrainer,
            d.status,
            c.company AS contact_company,
            c.linkman,
            c.mobile,
            c.tel,
            c.email,
            e.remarks,
            e.cs_op_remarks,
            e.cs_reject_reason,
            e.trainer_reject_reason
        FROM {source} d
        LEFT JOIN {contact} c ON c.oftid = d.id
        LEFT JOIN {ext} e ON e.oftid = d.id
        WHERE d.id > 0
        ORDER BY d.id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_ids(conn, table: str, column: str = "id") -> set[int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT {quote_ident(column)} AS id FROM {quote_ident(table)}")
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


def map_status(value: object) -> int:
    legacy_status = normalize_int(value, default=1)
    if legacy_status in {2, 5, 6}:
        return 5
    if legacy_status == 4:
        return 4
    if legacy_status in {3, 7}:
        return 2
    return 1


def demand_no(legacy_id: int) -> str:
    return f"XQOFT{legacy_id:08d}"[:32]


def build_demand_row(
    row: dict,
    *,
    target_user_ids: set[int],
    trainer_user_ids: set[int],
    enterprise_id_by_user: dict[int, int],
) -> dict:
    legacy_id = normalize_int(row.get("id"))
    target_id = ORG_FIND_TRAINER_ID_OFFSET + legacy_id
    user_id = normalize_int(row.get("uid"))
    if user_id <= 0 or user_id not in target_user_ids:
        user_id = None
    trainer_user_id = normalize_int(row.get("trainerid"))
    if trainer_user_id <= 0 or trainer_user_id not in trainer_user_ids:
        trainer_user_id = None
    created_at = fallback_datetime(row.get("ctime"))
    updated_at = legacy_datetime(row.get("utime")) or created_at
    title = clean_required(row.get("title"), 200) or f"legacy org find trainer {legacy_id}"
    description = join_texts(
        (
            row.get("remarks"),
            row.get("cs_op_remarks"),
            row.get("cs_reject_reason"),
            row.get("trainer_reject_reason"),
        )
    )
    return {
        "id": target_id,
        "demand_no": demand_no(legacy_id),
        "user_id": user_id,
        "enterprise_id": enterprise_id_by_user.get(user_id) if user_id else None,
        "demand_type": "TRAINING",
        "title": title,
        "training_topic": title,
        "trainee_count": None,
        "budget_min": None,
        "budget_max": None,
        "expected_start_date": legacy_date(row.get("traintime")),
        "format": "OFFLINE",
        "course_type": "INTERNAL",
        "intended_trainer": clean_text(row.get("trainername"), 100),
        "description": description,
        "source_case_id": None,
        "source_course_id": None,
        "contact_name": clean_text(row.get("linkman"), 50),
        "contact_phone": clean_text(row.get("mobile"), 30),
        "company_name": clean_text(row.get("contact_company"), 200),
        "contact_email": clean_text(row.get("email"), 100),
        "company_tel": clean_text(row.get("tel"), 30),
        "expertise_category_id": None,
        "expected_proposal_count": None,
        "source_trainer_id": trainer_user_id,
        "course_kind": "INTERNAL",
        "province_id": normalize_int(row.get("province")) or None,
        "city_id": normalize_int(row.get("city")) or None,
        "district_id": None,
        "status": map_status(row.get("status")),
        "created_at": created_at,
        "updated_at": updated_at,
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


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    trainer_user_ids = fetch_ids(target_conn, args.target_trainer_table, "user_id")
    enterprise_id_by_user = fetch_enterprises_by_user(target_conn, args.target_enterprise_buyer_table)
    existing_ids = fetch_existing_ids(target_conn, args.target_table, args.batch_size)
    source_rows = fetch_source_rows(source_conn, args)

    stats = RunStats(scanned=len(source_rows))
    target_rows: list[dict] = []
    for source_row in source_rows:
        target_id = ORG_FIND_TRAINER_ID_OFFSET + normalize_int(source_row.get("id"))
        if target_id in existing_ids:
            stats.skip("existing_demand")
            continue
        target_rows.append(
            build_demand_row(
                source_row,
                target_user_ids=target_user_ids,
                trainer_user_ids=trainer_user_ids,
                enterprise_id_by_user=enterprise_id_by_user,
            )
        )
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
    print(f"[{mode}] legacy org-find-trainer demands migration")
    print_summary("org_find_trainer_demands", stats)


if __name__ == "__main__":
    main()
