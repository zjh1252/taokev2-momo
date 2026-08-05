#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import bounded_int, clean_required, clean_text, fallback_datetime, legacy_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary
from run_legacy_videos_migrate import normalize_cover_url, normalize_play_url


DEFAULT_SOURCE_SERIES_TABLE = "taoke.tk_video_series"
DEFAULT_TARGET_VIDEO_TABLE = "videos"
DEFAULT_TARGET_SERIES_TABLE = "video_series"
DEFAULT_TARGET_CHAPTER_TABLE = "video_chapters"

SERIES_COLUMNS = (
    "id",
    "video_id",
    "title",
    "description",
    "cover_url",
    "sort_order",
    "created_at",
    "updated_at",
)

CHAPTER_COLUMNS = (
    "video_id",
    "series_id",
    "title",
    "description",
    "video_url",
    "cover_url",
    "duration",
    "file_size",
    "sort_order",
    "is_preview",
    "pxb_supplier_id",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy tk_video_series rows into video_series and video_chapters.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-series-table", default=DEFAULT_SOURCE_SERIES_TABLE)
    parser.add_argument("--target-video-table", default=DEFAULT_TARGET_VIDEO_TABLE)
    parser.add_argument("--target-series-table", default=DEFAULT_TARGET_SERIES_TABLE)
    parser.add_argument("--target-chapter-table", default=DEFAULT_TARGET_CHAPTER_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for legacy video series/chapter migration: {', '.join(missing)}")


def fetch_source_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT *
        FROM {quote_ident(table)}
        WHERE id > 0 AND video_id > 0
        ORDER BY video_id, sortorder, id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_target_video_ids(conn, table: str) -> set[int]:
    sql = f"SELECT id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {normalize_int(row.get("id")) for row in cur.fetchall() if normalize_int(row.get("id")) > 0}


def fetch_existing_series_ids(conn, table: str) -> set[int]:
    sql = f"SELECT id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {normalize_int(row.get("id")) for row in cur.fetchall() if normalize_int(row.get("id")) > 0}


def fetch_existing_chapter_keys(conn, table: str) -> set[tuple[int, int, str]]:
    sql = f"""
        SELECT video_id, sort_order, title
        FROM {quote_ident(table)}
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return {
            (
                normalize_int(row.get("video_id")),
                normalize_int(row.get("sort_order")),
                str(row.get("title") or "").strip(),
            )
            for row in cur.fetchall()
        }


def build_series_row(row: dict, asset_base_url: str) -> dict:
    created_at = fallback_datetime(row.get("createtime"), row.get("updatetime"))
    updated_at = legacy_datetime(row.get("updatetime")) or created_at
    return {
        "id": normalize_int(row.get("id")),
        "video_id": normalize_int(row.get("video_id")),
        "title": clean_required(row.get("title"), 200) or "未命名系列",
        "description": clean_text(row.get("description")),
        "cover_url": normalize_cover_url(row.get("pic"), asset_base_url),
        "sort_order": bounded_int(row.get("sortorder"), default=0),
        "created_at": created_at,
        "updated_at": updated_at,
    }


def build_chapter_row(row: dict, asset_base_url: str) -> dict:
    created_at = fallback_datetime(row.get("createtime"), row.get("updatetime"))
    updated_at = legacy_datetime(row.get("updatetime")) or created_at
    return {
        "video_id": normalize_int(row.get("video_id")),
        "series_id": 0,
        "title": clean_required(row.get("title"), 200) or "小节",
        "description": clean_text(row.get("description")),
        "video_url": normalize_play_url(row.get("url"), asset_base_url),
        "cover_url": normalize_cover_url(row.get("pic"), asset_base_url),
        "duration": bounded_int(row.get("duration"), default=0),
        "file_size": bounded_int(row.get("online_size"), default=0),
        "sort_order": bounded_int(row.get("sortorder"), default=0),
        "is_preview": 1 if normalize_int(row.get("preview")) == 1 else 0,
        "pxb_supplier_id": 0,
        "created_at": created_at,
        "updated_at": updated_at,
    }


def chapter_key(row: dict) -> tuple[int, int, str]:
    return (
        normalize_int(row.get("video_id")),
        normalize_int(row.get("sort_order")),
        str(row.get("title") or "").strip(),
    )


def insert_series_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in SERIES_COLUMNS)
    placeholders = ", ".join(["%s"] * len(SERIES_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in SERIES_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def insert_chapter_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in CHAPTER_COLUMNS)
    placeholders = ", ".join(["%s"] * len(CHAPTER_COLUMNS))
    sql = f"INSERT INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in CHAPTER_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> dict[str, RunStats]:
    source_rows = fetch_source_rows(source_conn, args.source_series_table)
    target_video_ids = fetch_target_video_ids(target_conn, args.target_video_table)
    existing_series_ids = fetch_existing_series_ids(target_conn, args.target_series_table)
    existing_chapter_keys = fetch_existing_chapter_keys(target_conn, args.target_chapter_table)

    series_rows: list[dict] = []
    chapter_rows: list[dict] = []
    series_stats = RunStats(scanned=len(source_rows))
    chapter_stats = RunStats(scanned=len(source_rows))
    for source in source_rows:
        source_id = normalize_int(source.get("id"))
        video_id = normalize_int(source.get("video_id"))
        if video_id not in target_video_ids:
            series_stats.skip("missing_target_video")
            chapter_stats.skip("missing_target_video")
            continue
        if source_id <= 0:
            series_stats.skip("invalid_id")
        elif source_id in existing_series_ids:
            series_stats.skip("existing_series")
        else:
            series_rows.append(build_series_row(source, args.asset_base_url))
            existing_series_ids.add(source_id)

        chapter_row = build_chapter_row(source, args.asset_base_url)
        key = chapter_key(chapter_row)
        if key in existing_chapter_keys:
            chapter_stats.skip("existing_chapter")
            continue
        chapter_rows.append(chapter_row)
        existing_chapter_keys.add(key)

    series_stats.inserted = (
        insert_series_rows(target_conn, args.target_series_table, series_rows, args.batch_size)
        if apply
        else len(series_rows)
    )
    chapter_stats.inserted = (
        insert_chapter_rows(target_conn, args.target_chapter_table, chapter_rows, args.batch_size)
        if apply
        else len(chapter_rows)
    )
    return {"video_series": series_stats, "video_chapters": chapter_stats}


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
    print(f"[{mode}] legacy video series/chapter migration")
    for name in ("video_series", "video_chapters"):
        print_summary(name, stats[name])


if __name__ == "__main__":
    main()
