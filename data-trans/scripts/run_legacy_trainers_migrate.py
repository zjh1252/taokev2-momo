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
    join_texts,
    legacy_datetime,
    map_review_status,
    map_trainer_status,
    money_or_none,
    score_0_to_5,
)
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_MEMBER_TABLE = "taoke.tk_member"
DEFAULT_SOURCE_EXT_TABLE = "taoke.tk_member_ext"
DEFAULT_SOURCE_AUTHINFO_TABLE = "taoke.tk_member_authinfo"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_TABLE = "user_trainers"

TRAINER_COLUMNS = (
    "id",
    "user_id",
    "name",
    "teaching_name",
    "avatar",
    "gender",
    "phone",
    "email",
    "post_code",
    "province_id",
    "city_id",
    "district_id",
    "town_id",
    "address",
    "id_card_no",
    "id_card_front",
    "id_card_back",
    "real_name_status",
    "real_name_reject_reason",
    "real_name_submitted_at",
    "real_name_audited_at",
    "certification_files",
    "honor_files",
    "professional_status",
    "professional_reject_reason",
    "professional_submitted_at",
    "professional_audited_at",
    "title",
    "bio",
    "one_line_intro",
    "intro",
    "background",
    "partial_clients",
    "good_at",
    "teaching_style",
    "quote_min",
    "quote_max",
    "quote_unit",
    "quote_remark",
    "taoke_price",
    "taoke_commission",
    "agreement_signed_at",
    "agreement_version",
    "resume_url",
    "background_image",
    "cert_level",
    "status",
    "reject_reason",
    "is_signed",
    "is_trusted",
    "is_recommended",
    "has_copyright_course",
    "exposure_weight",
    "sort_order",
    "score",
    "view_count",
    "consultation_count",
    "comment_count",
    "draft_expired_at",
    "approved_at",
    "specialties",
    "expertise_tags",
    "experience_years",
    "teaching_years",
    "qualification_level",
    "service_city_ids",
    "created_at",
    "updated_at",
    "trainer_code",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_member(groupid=9) rows into user_trainers.",
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
        raise SystemExit(f"missing required DSN arguments for trainer migration: {', '.join(missing)}")


def fetch_source_rows(conn, member_table: str, ext_table: str, authinfo_table: str) -> list[dict]:
    member = quote_ident(member_table)
    ext = quote_ident(ext_table)
    authinfo = quote_ident(authinfo_table)
    sql = f"""
        SELECT
            m.id,
            m.username,
            m.gender,
            m.realname,
            m.nickname,
            m.cid,
            m.province,
            m.city,
            m.email,
            m.icon,
            m.intro,
            m.companyintro,
            m.goodat,
            m.state,
            m.isapprove,
            m.approveinfo,
            m.regtime,
            m.modified,
            m.clicknum,
            m.commentnum,
            m.isrec,
            m.issign,
            m.score,
            m.is_del,
            m.public_mobile,
            e.mobile AS ext_mobile,
            e.address AS ext_address,
            e.postcode AS ext_postcode,
            e.customer AS ext_customer,
            e.price AS ext_price,
            e.price_lowest AS ext_price_lowest,
            e.price_medium AS ext_price_medium,
            e.price_taoke AS ext_price_taoke,
            e.lowest_price_taoke AS ext_lowest_price_taoke,
            e.job AS ext_job,
            e.WorkYear AS ext_work_year,
            e.space_pic AS ext_space_pic,
            e.trainer_name AS ext_trainer_name,
            e.teaching_experience AS ext_teaching_experience,
            e.qualification_certificate AS ext_qualification_certificate,
            e.accented AS ext_accented,
            e.demands_city AS ext_demands_city,
            e.tags AS ext_tags,
            e.credential AS ext_credential,
            e.style AS ext_style,
            e.customer_word AS ext_customer_word,
            e.classic_case AS ext_classic_case,
            e.topic AS ext_topic,
            e.intro_bak AS ext_intro_bak,
            ai.IDcode AS auth_id_code,
            ai.IDpic1 AS auth_id_front,
            ai.IDpic2 AS auth_id_back,
            ai.ctime AS auth_ctime,
            ai.isapprove AS auth_isapprove,
            ai.reason AS auth_reason
        FROM {member} m
        LEFT JOIN {ext} e ON e.uid = m.id
        LEFT JOIN (
            SELECT uid, MAX(id) AS latest_id
            FROM {authinfo}
            WHERE type IN ('ID', 'identity', 'trainer')
              AND (
                  TRIM(IFNULL(IDcode, '')) <> ''
                  OR TRIM(IFNULL(IDpic1, '')) <> ''
                  OR TRIM(IFNULL(IDpic2, '')) <> ''
              )
            GROUP BY uid
        ) pick_auth ON pick_auth.uid = m.id
        LEFT JOIN {authinfo} ai ON ai.id = pick_auth.latest_id
        WHERE m.groupid = 9
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


def auth_has_identity(row: dict) -> bool:
    return any(clean_text(row.get(key)) for key in ("auth_id_code", "auth_id_front", "auth_id_back"))


def build_trainer_row(row: dict, asset_base_url: str) -> dict:
    trainer_id = int(row["id"])
    created_at = fallback_datetime(row.get("regtime"), row.get("modified"))
    updated_at = legacy_datetime(row.get("modified")) or created_at
    status = map_trainer_status(row.get("isapprove"), row.get("is_del"))
    real_name_status = map_review_status(row.get("auth_isapprove")) if auth_has_identity(row) else None
    auth_time = legacy_datetime(row.get("auth_ctime")) if auth_has_identity(row) else None
    professional_text = clean_text(row.get("ext_qualification_certificate"), zero_is_blank=True)
    intro = join_texts((row.get("intro"), row.get("ext_classic_case"))) or clean_text(row.get("ext_intro_bak"), zero_is_blank=True)
    return {
        "id": trainer_id,
        "user_id": trainer_id,
        "name": first_text(row, ("realname", "nickname", "username"), 100, none_if_blank=False),
        "teaching_name": first_text(row, ("ext_trainer_name", "realname", "nickname", "username"), 64, none_if_blank=False),
        "avatar": asset_url(row.get("icon"), asset_base_url) or asset_url(row.get("ext_space_pic"), asset_base_url),
        "gender": bounded_int(row.get("gender"), default=0, maximum=2),
        "phone": clean_text(row.get("ext_mobile"), 20),
        "email": clean_required(row.get("email"), 200),
        "post_code": clean_required(row.get("ext_postcode"), 10),
        "province_id": bounded_int(row.get("province"), default=0),
        "city_id": bounded_int(row.get("city"), default=0),
        "district_id": 0,
        "town_id": 0,
        "address": clean_required(row.get("ext_address"), 200),
        "id_card_no": clean_required(row.get("auth_id_code"), 32),
        "id_card_front": asset_url(row.get("auth_id_front"), asset_base_url) or "",
        "id_card_back": asset_url(row.get("auth_id_back"), asset_base_url) or "",
        "real_name_status": real_name_status,
        "real_name_reject_reason": clean_required(row.get("auth_reason"), 255) if real_name_status == 3 else "",
        "real_name_submitted_at": auth_time,
        "real_name_audited_at": auth_time if real_name_status in {2, 3} else None,
        "certification_files": None,
        "honor_files": None,
        "professional_status": 1 if professional_text else None,
        "professional_reject_reason": "",
        "professional_submitted_at": None,
        "professional_audited_at": None,
        "title": first_text(row, ("ext_job", "ext_accented"), 64, zero_is_blank=True),
        "bio": professional_text or clean_text(row.get("ext_credential"), zero_is_blank=True),
        "one_line_intro": first_text(row, ("ext_accented", "ext_job"), 255, zero_is_blank=True),
        "intro": intro,
        "background": clean_text(row.get("companyintro"), zero_is_blank=True),
        "partial_clients": join_texts((row.get("ext_customer"), row.get("ext_customer_word"))),
        "good_at": first_text(row, ("goodat", "ext_topic"), zero_is_blank=True),
        "teaching_style": clean_required(row.get("ext_style"), 500),
        "quote_min": money_or_none(row.get("ext_price_lowest")),
        "quote_max": money_or_none(row.get("ext_price_medium")) or money_or_none(row.get("ext_price")),
        "quote_unit": "天",
        "quote_remark": "",
        "taoke_price": money_or_none(row.get("ext_price_taoke")),
        "taoke_commission": money_or_none(row.get("ext_lowest_price_taoke")),
        "agreement_signed_at": None,
        "agreement_version": None,
        "resume_url": None,
        "background_image": "",
        "cert_level": 0,
        "status": status,
        "reject_reason": clean_required(row.get("approveinfo"), 500) if status == 3 else "",
        "is_signed": 1 if normalize_int(row.get("issign")) == 1 else 0,
        "is_trusted": 0,
        "is_recommended": 1 if normalize_int(row.get("isrec")) == 1 else 0,
        "has_copyright_course": 0,
        "exposure_weight": 0,
        "sort_order": 0,
        "score": score_0_to_5(row.get("score")),
        "view_count": bounded_int(row.get("clicknum"), default=0),
        "consultation_count": 0,
        "comment_count": bounded_int(row.get("commentnum"), default=0),
        "draft_expired_at": None,
        "approved_at": None,
        "specialties": clean_text(row.get("cid"), 512, zero_is_blank=True),
        "expertise_tags": first_text(row, ("ext_tags", "goodat"), 500, zero_is_blank=True) or "",
        "experience_years": bounded_int(row.get("ext_work_year"), default=0) or None,
        "teaching_years": bounded_int(row.get("ext_teaching_experience"), default=0),
        "qualification_level": 0,
        "service_city_ids": clean_text(row.get("ext_demands_city"), 512, zero_is_blank=True),
        "created_at": created_at,
        "updated_at": updated_at,
        "trainer_code": None,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in TRAINER_COLUMNS)
    placeholders = ", ".join(["%s"] * len(TRAINER_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in TRAINER_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args.source_member_table, args.source_ext_table, args.source_authinfo_table)
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    existing_ids = fetch_ids(target_conn, args.target_table)

    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))
    for row in source_rows:
        trainer_id = normalize_int(row.get("id"))
        if trainer_id <= 0:
            stats.skip("invalid_id")
            continue
        if trainer_id not in target_user_ids:
            stats.skip("missing_target_user")
            continue
        if trainer_id in existing_ids:
            stats.skip("existing_trainer")
            continue
        existing_ids.add(trainer_id)
        rows.append(build_trainer_row(row, args.asset_base_url))

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
    print(f"[{mode}] legacy trainers migration")
    print_summary("trainers", stats)


if __name__ == "__main__":
    main()
