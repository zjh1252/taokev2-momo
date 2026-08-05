#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import clean_required, clean_text, fallback_datetime, legacy_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_MEMBER_TABLE = "taoke.tk_member"
DEFAULT_SOURCE_EXT_TABLE = "taoke.tk_member_ext"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_BUYER_TABLE = "user_buyers"
DEFAULT_TARGET_ENTERPRISE_BUYER_TABLE = "user_enterprise_buyers"

BUYER_COLUMNS = ("user_id", "occupation", "learning_tags", "created_at", "updated_at")
ENTERPRISE_BUYER_COLUMNS = (
    "user_id",
    "company_name",
    "industry",
    "company_size",
    "contact_name",
    "contact_phone",
    "post_code",
    "province_id",
    "city_id",
    "district_id",
    "town_id",
    "address",
    "training_tags",
    "id_card_no",
    "id_card_front",
    "id_card_back",
    "real_name_status",
    "real_name_reject_reason",
    "real_name_submitted_at",
    "real_name_audited_at",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy buyer role extension profiles.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-member-table", default=DEFAULT_SOURCE_MEMBER_TABLE)
    parser.add_argument("--source-ext-table", default=DEFAULT_SOURCE_EXT_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-buyer-table", default=DEFAULT_TARGET_BUYER_TABLE)
    parser.add_argument("--target-enterprise-buyer-table", default=DEFAULT_TARGET_ENTERPRISE_BUYER_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for buyer migration: {', '.join(missing)}")


def fetch_source_rows(conn, member_table: str, ext_table: str) -> list[dict]:
    sql = f"""
        SELECT
            m.id, m.groupid, m.realname, m.nickname, m.province, m.city, m.regtime, m.modified,
            e.job, e.mobile, e.tel, e.address, e.postcode, e.industry, e.trade, e.persons,
            e.contact, e.contact_mobile, e.contact_tel, e.contact_email, e.tags, e.company_nature,
            e.registered_address, e.primary_business, e.brand_name
        FROM {quote_ident(member_table)} m
        LEFT JOIN {quote_ident(ext_table)} e ON e.uid = m.id
        WHERE m.id > 0 AND m.groupid IN (4, 7)
        ORDER BY m.id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_user_ids(conn, table: str) -> set[int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {quote_ident(table)}")
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def fetch_existing_user_ids(conn, table: str, batch_size: int) -> set[int]:
    ids: set[int] = set()
    with conn.cursor() as cur:
        cur.execute(f"SELECT user_id FROM {quote_ident(table)}")
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            ids.update(int(row["user_id"]) for row in rows)
    return ids


def build_buyer_row(row: dict) -> dict:
    created_at = fallback_datetime(row.get("regtime"), row.get("modified"))
    return {
        "user_id": normalize_int(row.get("id")),
        "occupation": clean_text(row.get("job"), 64),
        "learning_tags": clean_text(row.get("tags"), 512),
        "created_at": created_at,
        "updated_at": legacy_datetime(row.get("modified")) or created_at,
    }


def company_name(row: dict) -> str | None:
    return (
        clean_text(row.get("brand_name"), 128)
        or clean_text(row.get("primary_business"), 128)
        or clean_text(row.get("registered_address"), 128)
    )


def build_enterprise_buyer_row(row: dict) -> dict:
    created_at = fallback_datetime(row.get("regtime"), row.get("modified"))
    contact_name = clean_text(row.get("contact"), 64) or clean_text(row.get("realname"), 64)
    contact_phone = (
        clean_text(row.get("contact_mobile"), 20)
        or clean_text(row.get("mobile"), 20)
        or clean_text(row.get("contact_tel"), 20)
        or clean_text(row.get("tel"), 20)
    )
    return {
        "user_id": normalize_int(row.get("id")),
        "company_name": company_name(row),
        "industry": clean_text(row.get("industry"), 64) or clean_text(row.get("trade"), 64),
        "company_size": clean_text(row.get("persons"), 32),
        "contact_name": contact_name,
        "contact_phone": contact_phone,
        "post_code": clean_required(row.get("postcode"), 10),
        "province_id": normalize_int(row.get("province")),
        "city_id": normalize_int(row.get("city")),
        "district_id": 0,
        "town_id": 0,
        "address": clean_required(row.get("address"), 200),
        "training_tags": clean_text(row.get("tags"), 512),
        "id_card_no": "",
        "id_card_front": "",
        "id_card_back": "",
        "real_name_status": None,
        "real_name_reject_reason": "",
        "real_name_submitted_at": None,
        "real_name_audited_at": None,
        "created_at": created_at,
        "updated_at": legacy_datetime(row.get("modified")) or created_at,
    }


def insert_rows(conn, table: str, columns: tuple[str, ...], rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    column_sql = ", ".join(quote_ident(column) for column in columns)
    placeholders = ", ".join(["%s"] * len(columns))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({column_sql}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in columns) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> dict[str, RunStats]:
    source_rows = fetch_source_rows(source_conn, args.source_member_table, args.source_ext_table)
    target_user_ids = fetch_user_ids(target_conn, args.target_user_table)
    existing_buyers = fetch_existing_user_ids(target_conn, args.target_buyer_table, args.batch_size)
    existing_enterprises = fetch_existing_user_ids(target_conn, args.target_enterprise_buyer_table, args.batch_size)

    buyer_rows: list[dict] = []
    enterprise_rows: list[dict] = []
    buyer_stats = RunStats()
    enterprise_stats = RunStats()

    for source_row in source_rows:
        user_id = normalize_int(source_row.get("id"))
        group_id = normalize_int(source_row.get("groupid"))
        if group_id == 7:
            buyer_stats.scanned += 1
            if user_id not in target_user_ids:
                buyer_stats.skip("missing_user")
                continue
            if user_id in existing_buyers:
                buyer_stats.skip("existing_buyer")
                continue
            existing_buyers.add(user_id)
            buyer_rows.append(build_buyer_row(source_row))
        elif group_id == 4:
            enterprise_stats.scanned += 1
            if user_id not in target_user_ids:
                enterprise_stats.skip("missing_user")
                continue
            if user_id in existing_enterprises:
                enterprise_stats.skip("existing_enterprise_buyer")
                continue
            existing_enterprises.add(user_id)
            enterprise_rows.append(build_enterprise_buyer_row(source_row))

    buyer_stats.inserted = (
        insert_rows(target_conn, args.target_buyer_table, BUYER_COLUMNS, buyer_rows, args.batch_size)
        if apply
        else len(buyer_rows)
    )
    enterprise_stats.inserted = (
        insert_rows(
            target_conn,
            args.target_enterprise_buyer_table,
            ENTERPRISE_BUYER_COLUMNS,
            enterprise_rows,
            args.batch_size,
        )
        if apply
        else len(enterprise_rows)
    )
    return {"buyers": buyer_stats, "enterprise_buyers": enterprise_stats}


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
    print(f"[{mode}] legacy buyers migration")
    for name, stat in stats.items():
        print_summary(name, stat)


if __name__ == "__main__":
    main()
