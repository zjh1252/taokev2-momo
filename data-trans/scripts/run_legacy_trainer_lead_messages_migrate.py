#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import clean_required, clean_text, fallback_datetime, join_texts
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TABLE = "taoke.tk_advices"
DEFAULT_TARGET_TABLE = "trainer_lead_messages"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"
DEFAULT_TARGET_COURSE_TABLE = "courses"

LEAD_COLUMNS = (
    "id",
    "trainer_user_id",
    "training_topic",
    "training_goal",
    "contact_name",
    "contact_mobile",
    "company_name",
    "company_phone",
    "province_id",
    "city_id",
    "district_id",
    "training_days",
    "email",
    "remark",
    "user_id",
    "status",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_advices trainer/course inquiries into trainer_lead_messages.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-trainer-table", default=DEFAULT_TARGET_TRAINER_TABLE)
    parser.add_argument("--target-course-table", default=DEFAULT_TARGET_COURSE_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for trainer lead migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT
            id, company_id, company_name, content, realname, company, mobile,
            telephone, createtime, user_id, type, keyid, title, status,
            process_status, cs_status, cs_reason, process_reason, province,
            city, remark, email, isdelete, course_time, nearinfo,
            invalid_reason, invalid_type
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


def fetch_course_publishers(conn, table: str) -> dict[int, int]:
    sql = f"""
        SELECT id, publisher_id
        FROM {quote_ident(table)}
        WHERE publisher_type = 'TRAINER'
          AND publisher_id IS NOT NULL
          AND publisher_id > 0
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return {int(row["id"]): int(row["publisher_id"]) for row in cur.fetchall()}


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


def resolve_trainer_user_id(
    row: dict,
    trainer_user_ids: set[int],
    course_trainer_by_id: dict[int, int],
) -> int | None:
    legacy_type = normalize_int(row.get("type"), default=1)
    course_id = normalize_int(row.get("keyid"))
    if legacy_type != 1:
        trainer_user_id = course_trainer_by_id.get(course_id)
        if trainer_user_id in trainer_user_ids:
            return trainer_user_id
    for key in ("keyid", "company_id"):
        value = normalize_int(row.get(key))
        if value in trainer_user_ids:
            return value
    trainer_user_id = course_trainer_by_id.get(course_id)
    if trainer_user_id in trainer_user_ids:
        return trainer_user_id
    return None


def map_status(row: dict) -> int:
    if normalize_int(row.get("isdelete")) == 1 or normalize_int(row.get("invalid_type")) > 0:
        return 2
    if normalize_int(row.get("process_status")) == 1 or normalize_int(row.get("cs_status")) == 1:
        return 2
    if normalize_int(row.get("status")) == 1:
        return 1
    return 0


def build_lead_row(
    row: dict,
    *,
    trainer_user_id: int,
    target_user_ids: set[int],
) -> dict:
    lead_id = normalize_int(row.get("id"))
    created_at = fallback_datetime(row.get("createtime"))
    submitter_user_id = normalize_int(row.get("user_id"))
    if submitter_user_id <= 0 or submitter_user_id not in target_user_ids:
        submitter_user_id = None
    training_topic = clean_required(row.get("title"), 100) or clean_required(row.get("content"), 100) or "legacy inquiry"
    contact_name = clean_required(row.get("realname"), 50) or "未公开"
    contact_mobile = clean_required(row.get("mobile"), 20) or clean_required(row.get("telephone"), 20) or "未公开"
    company_name = clean_required(row.get("company"), 200) or clean_required(row.get("company_name"), 200) or "未公开"
    remark = join_texts(
        (
            row.get("remark"),
            row.get("nearinfo"),
            row.get("cs_reason"),
            row.get("process_reason"),
            row.get("invalid_reason"),
        ),
        max_length=2000,
    )
    return {
        "id": lead_id,
        "trainer_user_id": trainer_user_id,
        "training_topic": training_topic,
        "training_goal": clean_text(row.get("content")),
        "contact_name": contact_name,
        "contact_mobile": contact_mobile,
        "company_name": company_name,
        "company_phone": clean_text(row.get("telephone"), 20),
        "province_id": normalize_int(row.get("province")) or None,
        "city_id": normalize_int(row.get("city")) or None,
        "district_id": None,
        "training_days": None,
        "email": clean_text(row.get("email"), 100),
        "remark": remark,
        "user_id": submitter_user_id,
        "status": map_status(row),
        "created_at": created_at,
        "updated_at": created_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in LEAD_COLUMNS)
    placeholders = ", ".join(["%s"] * len(LEAD_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in LEAD_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    trainer_user_ids = fetch_ids(target_conn, args.target_trainer_table, "user_id")
    course_trainer_by_id = fetch_course_publishers(target_conn, args.target_course_table)
    existing_ids = fetch_existing_ids(target_conn, args.target_table, args.batch_size)
    source_rows = fetch_source_rows(source_conn, args.source_table)

    stats = RunStats(scanned=len(source_rows))
    target_rows: list[dict] = []
    for source_row in source_rows:
        lead_id = normalize_int(source_row.get("id"))
        if lead_id <= 0:
            stats.skip("invalid_id")
            continue
        if lead_id in existing_ids:
            stats.skip("existing_lead")
            continue
        trainer_user_id = resolve_trainer_user_id(source_row, trainer_user_ids, course_trainer_by_id)
        if trainer_user_id is None:
            stats.skip("missing_trainer_target")
            continue
        target_rows.append(
            build_lead_row(
                source_row,
                trainer_user_id=trainer_user_id,
                target_user_ids=target_user_ids,
            )
        )
        existing_ids.add(lead_id)

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
    print(f"[{mode}] legacy trainer lead messages migration")
    print_summary("trainer_lead_messages", stats)


if __name__ == "__main__":
    main()
