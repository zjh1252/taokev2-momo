#!/usr/bin/env python3
from __future__ import annotations

import argparse
from collections import defaultdict
from typing import Iterable

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_asset_url, normalize_int, normalize_money
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TOPIC_TABLE = "taoke.tk_video_topic"
DEFAULT_SOURCE_ITEM_TABLE = "taoke.tk_video_topic_item"
DEFAULT_SOURCE_RELATION_TABLE = "taoke.tk_video_package_relation"
DEFAULT_TARGET_LABEL_TABLE = "video_package_labels"
DEFAULT_TARGET_GROUP_TABLE = "video_package_groups"
DEFAULT_TARGET_RELATION_TABLE = "video_package_relations"
DEFAULT_TARGET_VIDEO_TABLE = "videos"

LABEL_COLUMNS = (
    "id",
    "name",
    "topic_id",
    "item_parent",
    "item_index",
    "type",
    "serial_index",
    "price",
    "company_price",
    "disabled",
    "topic_name",
    "package_code",
    "descr",
    "cover",
)
GROUP_COLUMNS = (
    "package_id",
    "topic_id",
    "parent_id",
    "name",
    "price",
    "company_price",
    "max_purchase_qty",
    "video_count",
    "type",
    "serial_index",
    "item_index",
    "package_code",
    "descr",
    "cover",
    "is_open",
)
RELATION_COLUMNS = (
    "video_id",
    "package_id",
    "topic_id",
    "parent_id",
    "is_primary",
    "sort_order",
)


def build_label_row(item: dict, asset_base_url: str) -> dict:
    return {
        "id": normalize_int(item.get("id")),
        "name": str(item.get("item_name") or item.get("name") or "").strip(),
        "topic_id": normalize_int(item.get("topic_id")),
        "item_parent": normalize_int(item.get("item_parent")),
        "item_index": normalize_int(item.get("item_index")),
        "type": normalize_int(item.get("type")),
        "serial_index": normalize_int(item.get("serial_index")),
        "price": normalize_int(item.get("price")),
        "company_price": normalize_money(item.get("company_price")),
        "disabled": normalize_int(item.get("disabled")),
        "topic_name": str(item.get("topic_name") or "").strip(),
        "package_code": str(item.get("package") or item.get("package_code") or "").strip(),
        "descr": item.get("descr"),
        "cover": normalize_asset_url(item.get("cover"), asset_base_url),
    }


def build_topic_group_row(topic: dict) -> dict:
    return {
        "package_id": normalize_int(topic.get("id")),
        "topic_id": 0,
        "parent_id": 0,
        "name": str(topic.get("topic_name") or "").strip(),
        "price": normalize_money(topic.get("price")),
        "company_price": normalize_money(topic.get("company_price") or topic.get("rebate_price")),
        "max_purchase_qty": normalize_int(topic.get("max_purchase_qty"), 20),
        "video_count": 0,
        "type": 0,
        "serial_index": 0,
        "item_index": 0,
        "package_code": str(topic.get("package") or "").strip(),
        "descr": topic.get("descr"),
        "cover": normalize_asset_url(topic.get("cover"), "https://www.taoke.com"),
        "is_open": normalize_int(topic.get("is_open"), 1),
    }


def build_series_group_row(item: dict, video_count: int, asset_base_url: str) -> dict:
    label = build_label_row(item, asset_base_url)
    return {
        "package_id": label["topic_id"],
        "topic_id": label["id"],
        "parent_id": label["item_parent"],
        "name": label["name"],
        "price": normalize_money(item.get("price")),
        "company_price": label["company_price"],
        "max_purchase_qty": normalize_int(item.get("max_purchase_qty"), 20),
        "video_count": video_count,
        "type": label["type"],
        "serial_index": label["serial_index"],
        "item_index": label["item_index"],
        "package_code": label["package_code"],
        "descr": label["descr"],
        "cover": label["cover"],
        "is_open": 1,
    }


def build_relation_row(relation: dict) -> dict:
    return {
        "video_id": normalize_int(relation.get("videoId")),
        "package_id": normalize_int(relation.get("packageId")),
        "topic_id": normalize_int(relation.get("topicId")),
        "parent_id": normalize_int(relation.get("parentId")),
        "is_primary": normalize_int(relation.get("is_first")),
        "sort_order": normalize_int(relation.get("serial")),
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy video package topics, series labels, and relations.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-topic-table", default=DEFAULT_SOURCE_TOPIC_TABLE)
    parser.add_argument("--source-item-table", default=DEFAULT_SOURCE_ITEM_TABLE)
    parser.add_argument("--source-relation-table", default=DEFAULT_SOURCE_RELATION_TABLE)
    parser.add_argument("--target-label-table", default=DEFAULT_TARGET_LABEL_TABLE)
    parser.add_argument("--target-group-table", default=DEFAULT_TARGET_GROUP_TABLE)
    parser.add_argument("--target-relation-table", default=DEFAULT_TARGET_RELATION_TABLE)
    parser.add_argument("--target-video-table", default=DEFAULT_TARGET_VIDEO_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for video package migration: {', '.join(missing)}")


def fetch_all(conn, table: str, order_by: Iterable[str], where: str = "") -> list[dict]:
    table_name = quote_ident(table)
    order_clause = ", ".join(quote_ident(column) for column in order_by)
    where_clause = f"WHERE {where}" if where else ""
    sql = f"SELECT * FROM {table_name} {where_clause} ORDER BY {order_clause}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_target_video_ids(conn, table: str) -> set[int]:
    sql = f"SELECT id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {normalize_int(row.get("id")) for row in cur.fetchall()}


def build_relation_rows(
    source_rows: list[dict],
    target_video_ids: set[int],
) -> tuple[list[dict], dict[str, int]]:
    rows = []
    skipped: dict[str, int] = {}
    for source in source_rows:
        row = build_relation_row(source)
        if row["video_id"] <= 0:
            skipped["invalid_video_id"] = skipped.get("invalid_video_id", 0) + 1
            continue
        if row["video_id"] not in target_video_ids:
            skipped["missing_target_video"] = skipped.get("missing_target_video", 0) + 1
            continue
        rows.append(row)
    return rows, skipped


def build_video_count_maps(relation_rows: list[dict]) -> tuple[dict[tuple[int, int, int], int], dict[int, int]]:
    group_videos: dict[tuple[int, int, int], set[int]] = defaultdict(set)
    package_videos: dict[int, set[int]] = defaultdict(set)
    for row in relation_rows:
        video_id = row["video_id"]
        package_id = row["package_id"]
        group_key = (package_id, row["topic_id"], row["parent_id"])
        group_videos[group_key].add(video_id)
        package_videos[package_id].add(video_id)
    return (
        {key: len(video_ids) for key, video_ids in group_videos.items()},
        {package_id: len(video_ids) for package_id, video_ids in package_videos.items()},
    )


def build_group_rows(
    topic_rows: list[dict],
    item_rows: list[dict],
    relation_rows: list[dict],
    asset_base_url: str,
) -> list[dict]:
    group_counts, package_counts = build_video_count_maps(relation_rows)
    rows = []
    for topic in topic_rows:
        row = build_topic_group_row(topic)
        row["video_count"] = package_counts.get(row["package_id"], 0)
        rows.append(row)
    for item in item_rows:
        package_id = normalize_int(item.get("topic_id"))
        topic_id = normalize_int(item.get("id"))
        parent_id = normalize_int(item.get("item_parent"))
        rows.append(
            build_series_group_row(
                item,
                video_count=group_counts.get((package_id, topic_id, parent_id), 0),
                asset_base_url=asset_base_url,
            )
        )
    return rows


def row_values(row: dict, columns: tuple[str, ...]) -> tuple:
    return tuple(row[column] for column in columns)


def insert_label_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    sql = f"""
        INSERT INTO {quote_ident(table)}
          (id, name, topic_id, item_parent, item_index, type, serial_index, price, company_price,
           disabled, topic_name, package_code, descr, cover, created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          updated_at = NOW()
    """
    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [row_values(row, LABEL_COLUMNS) for row in batch])
            affected += cur.rowcount
    return affected


def insert_group_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    sql = f"""
        INSERT INTO {quote_ident(table)}
          (package_id, topic_id, parent_id, name, price, company_price, max_purchase_qty,
           video_count, type, serial_index, item_index, package_code, descr, cover, is_open,
           created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          price = VALUES(price),
          company_price = VALUES(company_price),
          video_count = VALUES(video_count),
          updated_at = NOW()
    """
    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [row_values(row, GROUP_COLUMNS) for row in batch])
            affected += cur.rowcount
    return affected


def insert_relation_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    sql = f"""
        INSERT INTO {quote_ident(table)}
          (video_id, package_id, topic_id, parent_id, is_primary, sort_order, created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          is_primary = VALUES(is_primary),
          sort_order = VALUES(sort_order),
          updated_at = NOW()
    """
    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [row_values(row, RELATION_COLUMNS) for row in batch])
            affected += cur.rowcount
    return affected


def make_stats(scanned: int, rows: list[dict], skipped: dict[str, int] | None = None, affected: int | None = None) -> RunStats:
    skipped = skipped or {}
    return RunStats(
        scanned=scanned,
        inserted=len(rows) if affected is None else affected,
        skipped=sum(skipped.values()),
        skip_reasons=skipped,
    )


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> dict[str, RunStats]:
    target_video_ids = fetch_target_video_ids(target_conn, args.target_video_table)
    topic_rows = fetch_all(
        source_conn,
        args.source_topic_table,
        order_by=("id",),
        where="COALESCE(`disabled`, 0) = 0",
    )
    item_rows = fetch_all(
        source_conn,
        args.source_item_table,
        order_by=("topic_id", "item_parent", "item_index", "id"),
        where="COALESCE(`disabled`, 0) = 0",
    )
    source_relation_rows = fetch_all(
        source_conn,
        args.source_relation_table,
        order_by=("packageId", "topicId", "parentId", "serial", "videoId"),
    )

    relation_rows, relation_skipped = build_relation_rows(source_relation_rows, target_video_ids)
    label_rows = [build_label_row(item, args.asset_base_url) for item in item_rows]
    group_rows = build_group_rows(topic_rows, item_rows, relation_rows, args.asset_base_url)

    if apply:
        label_affected = insert_label_rows(target_conn, args.target_label_table, label_rows, args.batch_size)
        group_affected = insert_group_rows(target_conn, args.target_group_table, group_rows, args.batch_size)
        relation_affected = insert_relation_rows(target_conn, args.target_relation_table, relation_rows, args.batch_size)
    else:
        label_affected = None
        group_affected = None
        relation_affected = None

    return {
        "labels": make_stats(len(item_rows), label_rows, affected=label_affected),
        "groups": make_stats(len(topic_rows) + len(item_rows), group_rows, affected=group_affected),
        "relations": make_stats(
            len(source_relation_rows),
            relation_rows,
            skipped=relation_skipped,
            affected=relation_affected,
        ),
    }


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
    print(f"[{mode}] video package migration")
    for name in ("labels", "groups", "relations"):
        print_summary(name, stats[name])


if __name__ == "__main__":
    main()
