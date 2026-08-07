#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import (
    asset_url,
    bounded_int,
    clean_required,
    clean_text,
    fallback_datetime,
    first_text,
    legacy_datetime,
    map_user_status,
)
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_MEMBER_TABLE = "taoke.tk_member"
DEFAULT_SOURCE_EXT_TABLE = "taoke.tk_member_ext"
DEFAULT_TARGET_TABLE = "sys_users"

USER_COLUMNS = (
    "id",
    "uc_uid",
    "username",
    "phone",
    "email",
    "password_hash",
    "nickname",
    "real_name",
    "avatar_url",
    "study_tags",
    "gender",
    "post_code",
    "province_id",
    "city_id",
    "district_id",
    "town_id",
    "address",
    "status",
    "freeze_reason",
    "last_login_at",
    "last_login_ip",
    "reg_origin",
    "source",
    "created_at",
    "updated_at",
    "user_source",
    "old_user",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_member rows into sys_users.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-member-table", default=DEFAULT_SOURCE_MEMBER_TABLE)
    parser.add_argument("--source-ext-table", default=DEFAULT_SOURCE_EXT_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for user migration: {', '.join(missing)}")


def fetch_source_rows(conn, member_table: str, ext_table: str) -> list[dict]:
    member = quote_ident(member_table)
    ext = quote_ident(ext_table)
    sql = f"""
        SELECT
            m.id,
            m.username,
            m.password,
            m.gender,
            m.realname,
            m.nickname,
            m.province,
            m.city,
            m.email,
            m.icon,
            m.state,
            m.approveinfo,
            m.regtime,
            m.logintime,
            m.modified,
            m.is_del,
            m.reg_origin,
            m.cdbid,
            e.mobile AS ext_mobile,
            e.address AS ext_address,
            e.postcode AS ext_postcode
        FROM {member} m
        LEFT JOIN {ext} e ON e.uid = m.id
        WHERE m.id > 0
        ORDER BY m.id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_existing_uniques(conn, table: str, batch_size: int) -> dict[str, set]:
    uniques = {"ids": set(), "usernames": set(), "phones": set(), "emails": set(), "uc_uids": set()}
    sql = f"SELECT id, username, phone, email, uc_uid FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            for row in rows:
                uniques["ids"].add(int(row["id"]))
                add_unique(uniques["usernames"], row.get("username"))
                add_unique(uniques["phones"], row.get("phone"))
                add_unique(uniques["emails"], row.get("email"))
                if row.get("uc_uid") is not None:
                    uniques["uc_uids"].add(int(row["uc_uid"]))
    return uniques


def add_unique(values: set[str], value: object) -> None:
    text = clean_text(value)
    if text:
        values.add(text.lower())


def claim_unique_text(value: object, used: set[str], max_length: int) -> str | None:
    text = clean_text(value, max_length)
    if not text:
        return None
    key = text.lower()
    if key in used:
        return None
    used.add(key)
    return text


def claim_username(value: object, user_id: int, used: set[str]) -> str:
    base = clean_text(value, 32) or f"legacy_{user_id}"
    key = base.lower()
    if key not in used:
        used.add(key)
        return base
    suffix = f"_{user_id}"
    candidate = f"{base[: 32 - len(suffix)]}{suffix}"
    used.add(candidate.lower())
    return candidate


def claim_email(value: object, user_id: int, used: set[str]) -> str | None:
    email = clean_text(value, 128)
    if not email or "@" not in email:
        return None
    key = email.lower()
    if key not in used:
        used.add(key)
        return email
    local, domain = email.split("@", 1)
    candidate = f"{user_id}_{local}@{domain}"
    if len(candidate) > 128:
        return None
    used.add(candidate.lower())
    return candidate


def claim_uc_uid(value: object, used: set[int]) -> int | None:
    uc_uid = normalize_int(value)
    if uc_uid <= 0 or uc_uid in used:
        return None
    used.add(uc_uid)
    return uc_uid


def build_user_row(row: dict, uniques: dict[str, set], asset_base_url: str) -> dict:
    user_id = int(row["id"])
    created_at = fallback_datetime(row.get("regtime"), row.get("modified"))
    updated_at = legacy_datetime(row.get("modified")) or created_at
    status = map_user_status(row.get("is_del"), row.get("state"))
    return {
        "id": user_id,
        "uc_uid": claim_uc_uid(row.get("cdbid"), uniques["uc_uids"]),
        "username": claim_username(row.get("username"), user_id, uniques["usernames"]),
        "phone": claim_unique_text(row.get("ext_mobile"), uniques["phones"], 20),
        "email": claim_email(row.get("email"), user_id, uniques["emails"]),
        "password_hash": clean_text(row.get("password"), 255),
        "nickname": first_text(row, ("nickname", "realname", "username"), 64),
        "real_name": clean_text(row.get("realname"), 64),
        "avatar_url": asset_url(row.get("icon"), asset_base_url),
        "study_tags": "",
        "gender": bounded_int(row.get("gender"), default=0, maximum=2),
        "post_code": clean_required(row.get("ext_postcode"), 10),
        "province_id": bounded_int(row.get("province"), default=0),
        "city_id": bounded_int(row.get("city"), default=0),
        "district_id": 0,
        "town_id": 0,
        "address": clean_required(row.get("ext_address"), 200),
        "status": status,
        "freeze_reason": clean_text(row.get("approveinfo"), 255) if status != 1 else "",
        "last_login_at": legacy_datetime(row.get("logintime")),
        "last_login_ip": None,
        "reg_origin": bounded_int(row.get("reg_origin"), default=1),
        "source": "old",
        "created_at": created_at,
        "updated_at": updated_at,
        "user_source": 2,
        "old_user": 1,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in USER_COLUMNS)
    placeholders = ", ".join(["%s"] * len(USER_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in USER_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_member_table, args.source_ext_table)
    uniques = fetch_existing_uniques(target_conn, args.target_table, args.batch_size)

    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))
    for row in source_rows:
        user_id = normalize_int(row.get("id"))
        if user_id <= 0:
            stats.skip("invalid_id")
            continue
        if user_id in uniques["ids"]:
            stats.skip("existing_user")
            continue
        uniques["ids"].add(user_id)
        rows.append(build_user_row(row, uniques, args.asset_base_url))

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
    print(f"[{mode}] legacy users migration")
    print_summary("users", stats)


if __name__ == "__main__":
    main()
