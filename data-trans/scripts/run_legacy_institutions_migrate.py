#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import (
    asset_url,
    bounded_int,
    clean_required,
    clean_text,
    fallback_datetime,
    first_text,
    legacy_date,
    legacy_datetime,
    map_institution_status,
    map_review_status,
    money_or_none,
    score_0_to_5,
)
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_MEMBER_TABLE = "taoke.tk_member"
DEFAULT_SOURCE_EXT_TABLE = "taoke.tk_member_ext"
DEFAULT_SOURCE_AUTHINFO_TABLE = "taoke.tk_member_authinfo"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_TABLE = "user_institutions"

PUBLIC_ORG_KEYWORDS = ("公司", "集团", "中心", "学院", "咨询", "有限", "工作室", "培训", "教育", "University", "Inc", "Ltd")
UNIVERSITY_KEYWORDS = ("大学", "高校")

INSTITUTION_COLUMNS = (
    "id",
    "user_id",
    "legacy_role_id",
    "org_name",
    "org_type",
    "company_nature",
    "website",
    "company_size",
    "annual_revenue",
    "registered_capital",
    "max_commission_rate",
    "payment_methods",
    "has_copyright_course",
    "bank_card_no",
    "bank_name",
    "bank_branch",
    "license_doc_url",
    "company_info_status",
    "company_info_reject_reason",
    "company_info_submitted_at",
    "company_info_audited_at",
    "license_no",
    "legal_representative",
    "established_at",
    "bio",
    "homepage_config",
    "contact_name",
    "contact_phone",
    "show_contact",
    "post_code",
    "province_id",
    "city_id",
    "district_id",
    "town_id",
    "address",
    "specialties",
    "industries",
    "has_venue",
    "has_experts",
    "score",
    "view_count",
    "comment_count",
    "open_course_count",
    "inner_course_count",
    "logo_url",
    "banner_url",
    "is_certified",
    "is_recommended",
    "sort_order",
    "status",
    "public_list_eligible",
    "client_cases",
    "success_cases",
    "agreement_signed_at",
    "agreement_version",
    "created_at",
    "updated_at",
    "association",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_member(groupid=3) rows into user_institutions.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-member-table", default=DEFAULT_SOURCE_MEMBER_TABLE)
    parser.add_argument("--source-ext-table", default=DEFAULT_SOURCE_EXT_TABLE)
    parser.add_argument("--source-authinfo-table", default=DEFAULT_SOURCE_AUTHINFO_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for institution migration: {', '.join(missing)}")


def fetch_source_rows(conn, member_table: str, ext_table: str, authinfo_table: str) -> list[dict]:
    member = quote_ident(member_table)
    ext = quote_ident(ext_table)
    authinfo = quote_ident(authinfo_table)
    sql = f"""
        SELECT
            m.id,
            m.username,
            m.realname,
            m.nickname,
            m.cid,
            m.trade,
            m.province,
            m.city,
            m.company,
            m.company_simple,
            m.icon,
            m.intro,
            m.companyintro,
            m.goodat,
            m.isapprove,
            m.approveinfo,
            m.regtime,
            m.modified,
            m.openingnum,
            m.trainingnum,
            m.clicknum,
            m.commentnum,
            m.isrec,
            m.iscontact,
            m.roleid,
            m.is_del,
            e.mobile AS ext_mobile,
            e.tel AS ext_tel,
            e.address AS ext_address,
            e.postcode AS ext_postcode,
            e.website AS ext_website,
            e.persons AS ext_persons,
            e.workforce AS ext_workforce,
            e.turnover AS ext_turnover,
            e.company_nature AS ext_company_nature,
            e.corporate_representative AS ext_corporate_representative,
            e.establishment AS ext_establishment,
            e.registered_capital AS ext_registered_capital,
            e.registered_address AS ext_registered_address,
            e.primary_business AS ext_primary_business,
            e.public_class_commission_ratio AS ext_public_class_commission_ratio,
            e.org_demands_payment_mode AS ext_org_demands_payment_mode,
            e.copyright_status AS ext_copyright_status,
            e.yard_status AS ext_yard_status,
            e.primary_trainer_status AS ext_primary_trainer_status,
            e.contact AS ext_contact,
            e.contact_mobile AS ext_contact_mobile,
            e.bank_account AS ext_bank_account,
            e.bank_name AS ext_bank_name,
            e.bank_branch AS ext_bank_branch,
            e.client_base AS ext_client_base,
            e.companyLogo AS ext_company_logo,
            e.classic_case AS ext_classic_case,
            ai.organcode AS auth_license_no,
            ai.legal AS auth_legal,
            ai.licensepic AS auth_license_pic,
            ai.ctime AS auth_ctime,
            ai.isapprove AS auth_isapprove,
            ai.reason AS auth_reason
        FROM {member} m
        LEFT JOIN {ext} e ON e.uid = m.id
        LEFT JOIN (
            SELECT uid, MAX(id) AS latest_id
            FROM {authinfo}
            WHERE TRIM(IFNULL(organcode, '')) <> ''
               OR TRIM(IFNULL(licensepic, '')) <> ''
               OR TRIM(IFNULL(company, '')) <> ''
               OR TRIM(IFNULL(legal, '')) <> ''
            GROUP BY uid
        ) pick_auth ON pick_auth.uid = m.id
        LEFT JOIN {authinfo} ai ON ai.id = pick_auth.latest_id
        WHERE m.groupid = 3
          AND m.id > 0
        ORDER BY m.id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_ids(conn, table: str, column: str = "id") -> set[int]:
    sql = f"SELECT {quote_ident(column)} AS id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def auth_has_company_info(row: dict) -> bool:
    return any(clean_text(row.get(key)) for key in ("auth_license_no", "auth_legal", "auth_license_pic"))


def payment_methods_json(value: object) -> str | None:
    text = clean_text(value, zero_is_blank=True)
    if not text:
        return None
    return json.dumps([text], ensure_ascii=False)


def org_type_for_name(org_name: str) -> int:
    return 1 if any(keyword in org_name for keyword in UNIVERSITY_KEYWORDS) else 0


def public_list_eligible(row: dict, org_name: str, status: int, org_type: int) -> int:
    if status != 1 or org_name.startswith("未命名机构"):
        return 0
    has_courses = normalize_int(row.get("openingnum")) > 0 or normalize_int(row.get("trainingnum")) > 0
    has_keyword = any(keyword in org_name for keyword in PUBLIC_ORG_KEYWORDS)
    return 1 if org_type > 0 or has_courses or has_keyword else 0


def build_institution_row(row: dict, asset_base_url: str) -> dict:
    institution_id = int(row["id"])
    created_at = fallback_datetime(row.get("regtime"), row.get("modified"))
    updated_at = legacy_datetime(row.get("modified")) or created_at
    org_name = first_text(row, ("company", "company_simple", "realname", "nickname", "username"), 128, none_if_blank=False)
    org_type = org_type_for_name(org_name)
    status = map_institution_status(row.get("isapprove"), row.get("is_del"))
    company_status = map_review_status(row.get("auth_isapprove")) if auth_has_company_info(row) else None
    company_time = legacy_datetime(row.get("auth_ctime")) if auth_has_company_info(row) else None
    return {
        "id": institution_id,
        "user_id": institution_id,
        "legacy_role_id": bounded_int(row.get("roleid"), default=0),
        "org_name": org_name,
        "org_type": org_type,
        "company_nature": clean_required(row.get("ext_company_nature"), 32),
        "website": clean_required(row.get("ext_website"), 255),
        "company_size": first_text(row, ("ext_persons", "ext_workforce"), 32, none_if_blank=False, zero_is_blank=True),
        "annual_revenue": clean_required(row.get("ext_turnover"), 64),
        "registered_capital": clean_required(row.get("ext_registered_capital"), 64),
        "max_commission_rate": money_or_none(row.get("ext_public_class_commission_ratio")),
        "payment_methods": payment_methods_json(row.get("ext_org_demands_payment_mode")),
        "has_copyright_course": 1 if normalize_int(row.get("ext_copyright_status")) == 1 else 0,
        "bank_card_no": clean_required(row.get("ext_bank_account"), 64),
        "bank_name": clean_required(row.get("ext_bank_name"), 128),
        "bank_branch": clean_required(row.get("ext_bank_branch"), 128),
        "license_doc_url": asset_url(row.get("auth_license_pic"), asset_base_url) or "",
        "company_info_status": company_status,
        "company_info_reject_reason": clean_required(row.get("auth_reason"), 255) if company_status == 3 else "",
        "company_info_submitted_at": company_time,
        "company_info_audited_at": company_time if company_status in {2, 3} else None,
        "license_no": first_text(row, ("auth_license_no",), 64),
        "legal_representative": first_text(row, ("auth_legal", "ext_corporate_representative"), 64),
        "established_at": legacy_date(row.get("ext_establishment")),
        "bio": first_text(row, ("companyintro", "intro", "ext_primary_business")),
        "homepage_config": None,
        "contact_name": first_text(row, ("ext_contact", "realname", "nickname"), 64),
        "contact_phone": first_text(row, ("ext_contact_mobile", "ext_mobile", "ext_tel"), 20),
        "show_contact": 1 if normalize_int(row.get("iscontact")) == 1 else 0,
        "post_code": clean_required(row.get("ext_postcode"), 10),
        "province_id": bounded_int(row.get("province"), default=0),
        "city_id": bounded_int(row.get("city"), default=0),
        "district_id": 0,
        "town_id": 0,
        "address": first_text(row, ("ext_address", "ext_registered_address"), 200, none_if_blank=False),
        "specialties": clean_text(row.get("cid"), 512, zero_is_blank=True),
        "industries": first_text(row, ("trade",), 512, zero_is_blank=True),
        "has_venue": 1 if normalize_int(row.get("ext_yard_status")) == 1 else 0,
        "has_experts": 1 if normalize_int(row.get("ext_primary_trainer_status")) == 1 else 0,
        "score": score_0_to_5(row.get("score")),
        "view_count": bounded_int(row.get("clicknum"), default=0),
        "comment_count": bounded_int(row.get("commentnum"), default=0),
        "open_course_count": bounded_int(row.get("openingnum"), default=0),
        "inner_course_count": bounded_int(row.get("trainingnum"), default=0),
        "logo_url": asset_url(row.get("ext_company_logo"), asset_base_url) or asset_url(row.get("icon"), asset_base_url),
        "banner_url": None,
        "is_certified": 1 if company_status == 2 or normalize_int(row.get("isapprove")) == 1 else 0,
        "is_recommended": 1 if normalize_int(row.get("isrec")) == 1 else 0,
        "sort_order": 0,
        "status": status,
        "public_list_eligible": public_list_eligible(row, org_name, status, org_type),
        "client_cases": first_text(row, ("ext_client_base", "goodat")),
        "success_cases": clean_text(row.get("ext_classic_case"), zero_is_blank=True),
        "agreement_signed_at": None,
        "agreement_version": None,
        "created_at": created_at,
        "updated_at": updated_at,
        "association": 1 if "协会" in org_name else 0,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in INSTITUTION_COLUMNS)
    placeholders = ", ".join(["%s"] * len(INSTITUTION_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in INSTITUTION_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_member_table, args.source_ext_table, args.source_authinfo_table)
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    existing_ids = fetch_ids(target_conn, args.target_table)

    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))
    for row in source_rows:
        institution_id = normalize_int(row.get("id"))
        if institution_id <= 0:
            stats.skip("invalid_id")
            continue
        if institution_id not in target_user_ids:
            stats.skip("missing_target_user")
            continue
        if institution_id in existing_ids:
            stats.skip("existing_institution")
            continue
        existing_ids.add(institution_id)
        rows.append(build_institution_row(row, args.asset_base_url))

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
    print(f"[{mode}] legacy institutions migration")
    print_summary("institutions", stats)


if __name__ == "__main__":
    main()
