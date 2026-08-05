#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from decimal import Decimal
from typing import Iterable

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import (
    bounded_int,
    clean_required,
    clean_text,
    fallback_datetime,
    legacy_datetime,
    money_or_none,
    score_0_to_5,
)
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_VIDEO_TABLE = "taoke.tk_video"
DEFAULT_SOURCE_SERIES_TABLE = "taoke.tk_video_series"
DEFAULT_SOURCE_CATE_TABLE = "taoke.tk_cate"
DEFAULT_SOURCE_VIDEO_CATE_RELATION_TABLE = "taoke.tk_videocate_relation"
DEFAULT_TARGET_TABLE = "videos"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_CATEGORY_TABLE = "sys_categories"

VIDEO_COLUMNS = (
    "id",
    "publisher_id",
    "publisher_type",
    "title",
    "cover_url",
    "intro",
    "video_type",
    "video_url",
    "external_url",
    "category_id",
    "sub_category_id",
    "teacher_name",
    "trainer_id",
    "price",
    "company_price",
    "max_purchase_qty",
    "original_price",
    "is_free",
    "cap_count",
    "cap_price",
    "keywords",
    "duration",
    "total_episodes",
    "view_count",
    "enrollment_count",
    "student_count",
    "score",
    "status",
    "reject_reason",
    "sort_order",
    "is_featured",
    "sticky_priority",
    "published_at",
    "pxb_supplier_id",
    "legacy_v_type",
    "created_at",
    "updated_at",
)

HTTP_COVER_HOSTS = (
    "http://www.taoke.com",
    "http://taoke.com",
    "http://cdn-static.taoke.com",
    "http://cdn5-pxb-videos.taoke.com",
    "http://preview.kuanxue.com",
    "http://www.91pxb.com",
    "http://meethr.91pxb.com",
    "http://kuanxue-fsm.oss-cn-hangzhou.aliyuncs.com",
    "http://osscdn-training.ihr360.com",
    "http://ws1.witsharer.com",
)

HTTP_PLAY_HOSTS = (
    "http://www.taoke.com",
    "http://taoke.com",
    "http://cdn5-pxb-videos.taoke.com",
    "http://preview.kuanxue.com",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_video rows into videos.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-video-table", default=DEFAULT_SOURCE_VIDEO_TABLE)
    parser.add_argument("--source-series-table", default=DEFAULT_SOURCE_SERIES_TABLE)
    parser.add_argument("--source-cate-table", default=DEFAULT_SOURCE_CATE_TABLE)
    parser.add_argument("--source-video-cate-relation-table", default=DEFAULT_SOURCE_VIDEO_CATE_RELATION_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-category-table", default=DEFAULT_TARGET_CATEGORY_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for legacy video migration: {', '.join(missing)}")


def normalize_cover_url(value: object, base_url: str) -> str:
    text = clean_text(value, none_if_blank=False) or ""
    text = text.strip()
    if not text:
        return ""
    if re.fullmatch(r"[0-9A-Fa-f]+-[0-9]+", text):
        return f"https://preview.kuanxue.com/fsm/{text}"
    if text.startswith("taoke/covers/"):
        return f"https://cdn5-pxb-videos.taoke.com/{text}"
    if text.startswith("taoke/upload/"):
        return f"https://preview.kuanxue.com/fsm/{text}"
    if text.startswith("/attachments/"):
        return f"{base_url.rstrip('/')}{text}"
    if text.startswith("attachments/"):
        return f"{base_url.rstrip('/')}/{text}"
    if text.startswith(HTTP_COVER_HOSTS):
        text = text.replace("http://", "https://", 1)
    return text.replace("//data/", "/data/")


def normalize_play_url(value: object, base_url: str) -> str:
    text = clean_text(value, none_if_blank=False) or ""
    text = text.strip()
    if not text:
        return ""
    if text.startswith(("taoke/", "videos/")):
        return f"https://cdn5-pxb-videos.taoke.com/{text}"
    if re.fullmatch(r"[0-9A-Fa-f]+-[0-9]+", text):
        return f"https://preview.kuanxue.com/fsm/{text}"
    if text.startswith("taoke/upload/"):
        return f"https://preview.kuanxue.com/fsm/{text}"
    if re.fullmatch(r"[a-f0-9]{32}", text):
        return f"https://cdn5-pxb-videos.taoke.com/taoke/old-videos/videos/{text}.mp4"
    if text.startswith("/attachments/"):
        return f"{base_url.rstrip('/')}{text}"
    if text.startswith("attachments/"):
        return f"{base_url.rstrip('/')}/{text}"
    if text.startswith(HTTP_PLAY_HOSTS):
        return text.replace("http://", "https://", 1)
    return text


def fetch_source_rows(conn, args: argparse.Namespace) -> list[dict]:
    video = quote_ident(args.source_video_table)
    series = quote_ident(args.source_series_table)
    sql = f"""
        SELECT
            v.*,
            COALESCE(sc.series_count, 0) AS legacy_series_count
        FROM {video} v
        LEFT JOIN (
            SELECT video_id, COUNT(*) AS series_count
            FROM {series}
            GROUP BY video_id
        ) sc ON sc.video_id = v.id
        WHERE v.id > 0
        ORDER BY v.id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_ids(conn, table: str, column: str = "id") -> set[int]:
    sql = f"SELECT {quote_ident(column)} AS id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {normalize_int(row.get("id")) for row in cur.fetchall() if normalize_int(row.get("id")) > 0}


def fetch_category_name_by_old_id(conn, table: str) -> dict[int, str]:
    sql = f"""
        SELECT child.id AS id, COALESCE(parent.name, child.name) AS name
        FROM {quote_ident(table)} child
        LEFT JOIN {quote_ident(table)} parent ON parent.id = child.sub
        WHERE child.id > 0
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return {normalize_int(row.get("id")): str(row.get("name") or "").strip() for row in cur.fetchall()}


def fetch_target_video_categories(conn, table: str) -> tuple[dict[str, int], int]:
    sql = f"""
        SELECT id, name
        FROM {quote_ident(table)}
        WHERE type = 'VIDEO_COURSE'
          AND level = 1
          AND parent_id = 0
          AND name IS NOT NULL
          AND TRIM(name) <> ''
        ORDER BY id
    """
    by_name: dict[str, int] = {}
    other_id = 0
    with conn.cursor() as cur:
        cur.execute(sql)
        for row in cur.fetchall():
            category_id = normalize_int(row.get("id"))
            name = str(row.get("name") or "").strip()
            by_name.setdefault(name, category_id)
            if name == "其它" and other_id == 0:
                other_id = category_id
    return by_name, other_id


def build_category_lookup(source_conn, target_conn, source_cate_table: str, target_category_table: str) -> tuple[dict[int, int], int]:
    old_name_by_id = fetch_category_name_by_old_id(source_conn, source_cate_table)
    target_id_by_name, other_id = fetch_target_video_categories(target_conn, target_category_table)
    return ({old_id: target_id_by_name[name] for old_id, name in old_name_by_id.items() if name in target_id_by_name}, other_id)


def fetch_relation_category_ids(conn, table: str) -> dict[int, list[int]]:
    sql = f"""
        SELECT vid, cateid
        FROM {quote_ident(table)}
        WHERE vid > 0 AND cateid > 0
        ORDER BY vid, cateid
    """
    result: dict[int, list[int]] = {}
    with conn.cursor() as cur:
        cur.execute(sql)
        for row in cur.fetchall():
            video_id = normalize_int(row.get("vid"))
            cate_id = normalize_int(row.get("cateid"))
            if video_id > 0 and cate_id > 0:
                result.setdefault(video_id, []).append(cate_id)
    return result


def numeric_tokens(value: object) -> list[int]:
    if value is None:
        return []
    return [int(match) for match in re.findall(r"\d+", str(value)) if int(match) > 0]


def map_video_category(row: dict, category_lookup: dict[int, int], relation_category_ids: dict[int, list[int]], other_id: int) -> int:
    for old_id in numeric_tokens(row.get("subcid")):
        if old_id in category_lookup:
            return category_lookup[old_id]
    video_id = normalize_int(row.get("id"))
    for old_id in relation_category_ids.get(video_id, []):
        if old_id in category_lookup:
            return category_lookup[old_id]
    return other_id


def map_video_status(row: dict) -> int:
    if normalize_int(row.get("del")) == 1:
        return 4
    approved = normalize_int(row.get("isapprove"), default=0)
    if approved == -1:
        return 3
    if approved == 1 and normalize_int(row.get("video_status"), default=1) == 1:
        return 2
    return 1


def map_video_type(row: dict) -> str:
    if normalize_int(row.get("external_link")) == 1:
        return "EXTERNAL"
    if normalize_int(row.get("types")) == 1 and normalize_int(row.get("del")) == 0:
        return "SERIES"
    return "SINGLE"


def map_purchase_prices(row: dict) -> tuple[Decimal, Decimal, Decimal, int, int]:
    price = money_or_none(row.get("video_price"), zero_is_none=False) or Decimal("0.00")
    legacy_company_price = money_or_none(row.get("company_price"), zero_is_none=False) or Decimal("0.00")
    if legacy_company_price > 0:
        return price, legacy_company_price, legacy_company_price, 20, 0 if price > 0 else 1
    if price > 0:
        return price, (price * Decimal("20")).quantize(Decimal("0.01")), price, 0, 0
    return Decimal("0.00"), Decimal("0.00"), Decimal("0.00"), 0, 1


def map_total_episodes(row: dict) -> int:
    if normalize_int(row.get("types")) == 1 and normalize_int(row.get("del")) == 0:
        return max(1, normalize_int(row.get("legacy_series_count"), 0))
    return 1


def build_video_row(
    row: dict,
    category_lookup: dict[int, int],
    relation_category_ids: dict[int, list[int]],
    fallback_category_id: int,
    asset_base_url: str,
) -> dict:
    video_id = normalize_int(row.get("id"))
    publisher_id = normalize_int(row.get("uid"))
    created_at = fallback_datetime(row.get("createtime"))
    updated_at = legacy_datetime(row.get("updatetime")) or created_at
    status = map_video_status(row)
    video_type = map_video_type(row)
    raw_url = clean_required(row.get("url"), 500)
    price, company_price, original_price, max_purchase_qty, is_free = map_purchase_prices(row)
    return {
        "id": video_id,
        "publisher_id": publisher_id,
        "publisher_type": "TRAINER",
        "title": clean_required(row.get("title"), 200) or f"未命名录播课{video_id}",
        "cover_url": normalize_cover_url(row.get("pic"), asset_base_url),
        "intro": clean_text(row.get("intro")),
        "video_type": video_type,
        "video_url": "" if video_type == "EXTERNAL" else normalize_play_url(raw_url, asset_base_url),
        "external_url": raw_url if video_type == "EXTERNAL" else "",
        "category_id": map_video_category(row, category_lookup, relation_category_ids, fallback_category_id),
        "sub_category_id": 0,
        "teacher_name": clean_required(row.get("teacher"), 100),
        "trainer_id": publisher_id,
        "price": price,
        "company_price": company_price,
        "max_purchase_qty": max_purchase_qty,
        "original_price": original_price,
        "is_free": is_free,
        "cap_count": 0,
        "cap_price": None,
        "keywords": clean_required(row.get("tag"), 500),
        "duration": bounded_int(row.get("duration"), default=0),
        "total_episodes": map_total_episodes(row),
        "view_count": bounded_int(row.get("view"), default=0),
        "enrollment_count": 0,
        "student_count": 0,
        "score": score_0_to_5(row.get("score")),
        "status": status,
        "reject_reason": clean_required(row.get("approveinfo"), 500) if status == 3 else "",
        "sort_order": bounded_int(row.get("sort"), default=0),
        "is_featured": 0,
        "sticky_priority": 0,
        "published_at": created_at if normalize_int(row.get("isapprove"), default=0) == 1 else None,
        "pxb_supplier_id": 0,
        "legacy_v_type": bounded_int(row.get("v_type"), default=0),
        "created_at": created_at,
        "updated_at": updated_at,
    }


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in VIDEO_COLUMNS)
    placeholders = ", ".join(["%s"] * len(VIDEO_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in VIDEO_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    source_rows = fetch_source_rows(source_conn, args)
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    existing_video_ids = fetch_ids(target_conn, args.target_table)
    category_lookup, fallback_category_id = build_category_lookup(
        source_conn,
        target_conn,
        args.source_cate_table,
        args.target_category_table,
    )
    relation_category_ids = fetch_relation_category_ids(source_conn, args.source_video_cate_relation_table)

    rows: list[dict] = []
    stats = RunStats(scanned=len(source_rows))
    for row in source_rows:
        video_id = normalize_int(row.get("id"))
        publisher_id = normalize_int(row.get("uid"))
        if video_id <= 0:
            stats.skip("invalid_id")
            continue
        if video_id in existing_video_ids:
            stats.skip("existing_video")
            continue
        if publisher_id <= 0 or publisher_id not in target_user_ids:
            stats.skip("missing_publisher_user")
            continue
        rows.append(build_video_row(row, category_lookup, relation_category_ids, fallback_category_id, args.asset_base_url))
        existing_video_ids.add(video_id)

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
    print(f"[{mode}] legacy videos migration")
    print_summary("videos", stats)


if __name__ == "__main__":
    main()
