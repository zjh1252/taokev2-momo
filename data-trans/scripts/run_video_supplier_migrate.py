#!/usr/bin/env python3
from __future__ import annotations

import argparse
from typing import Iterable

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int, normalize_money
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_TOPIC_TABLE = "taoke.tk_video_topic"
DEFAULT_SOURCE_ITEM_TABLE = "taoke.tk_video_topic_item"
DEFAULT_SOURCE_RELATION_TABLE = "taoke.tk_video_package_relation"
DEFAULT_SOURCE_MEMBER_TABLE = "taoke.tk_member"
DEFAULT_TARGET_SUPPLIER_TABLE = "video_suppliers"
DEFAULT_TARGET_CATEGORY_TABLE = "video_supplier_categories"
DEFAULT_TARGET_CATEGORY_VIDEO_TABLE = "video_supplier_category_videos"
DEFAULT_TARGET_VIDEO_TABLE = "videos"

SUPPLIER_COLUMNS = ("user_id", "company_name", "member_type", "enabled")
CATEGORY_COLUMNS = (
    "id",
    "supplier_id",
    "parent_id",
    "name",
    "sort_order",
    "total_price",
    "discount_rate",
    "enabled",
)
CATEGORY_VIDEO_COLUMNS = ("supplier_id", "category_id", "video_id", "sort_order")
CATEGORY_COLLISION_COLUMNS = CATEGORY_COLUMNS


def build_supplier_row(topic: dict, member: dict) -> dict:
    company_name = str(member.get("company") or member.get("username") or topic.get("topic_name") or "").strip()
    return {
        "user_id": normalize_int(topic.get("uid")),
        "company_name": company_name,
        "member_type": "TRAINING_ORG",
        "enabled": 1,
    }


def build_supplier_category_row(supplier_id: int, item: dict, asset_base_url: str) -> dict:
    return {
        "supplier_id": supplier_id,
        "parent_id": normalize_int(item.get("item_parent")),
        "name": str(item.get("item_name") or "").strip(),
        "sort_order": normalize_int(item.get("item_index")),
        "total_price": normalize_money(item.get("price")),
        "discount_rate": normalize_money(item.get("discount"), cents=False)
        if item.get("discount") not in (None, "")
        else normalize_money(100),
        "enabled": 0 if normalize_int(item.get("disabled")) == 1 else 1,
    }


def build_category_video_row(supplier_id: int, category_id: int, relation: dict) -> dict:
    return {
        "supplier_id": supplier_id,
        "category_id": category_id,
        "video_id": normalize_int(relation.get("videoId")),
        "sort_order": normalize_int(relation.get("serial")),
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy video supplier, supplier category, and category-video relation data.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-topic-table", default=DEFAULT_SOURCE_TOPIC_TABLE)
    parser.add_argument("--source-item-table", default=DEFAULT_SOURCE_ITEM_TABLE)
    parser.add_argument("--source-relation-table", default=DEFAULT_SOURCE_RELATION_TABLE)
    parser.add_argument("--source-member-table", default=DEFAULT_SOURCE_MEMBER_TABLE)
    parser.add_argument("--target-supplier-table", default=DEFAULT_TARGET_SUPPLIER_TABLE)
    parser.add_argument("--target-category-table", default=DEFAULT_TARGET_CATEGORY_TABLE)
    parser.add_argument("--target-category-video-table", default=DEFAULT_TARGET_CATEGORY_VIDEO_TABLE)
    parser.add_argument("--target-video-table", default=DEFAULT_TARGET_VIDEO_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for video supplier migration: {', '.join(missing)}")


def fetch_all(conn, table: str, order_by: Iterable[str], where: str = "") -> list[dict]:
    table_name = quote_ident(table)
    order_clause = ", ".join(quote_ident(column) for column in order_by)
    where_clause = f"WHERE {where}" if where else ""
    sql = f"SELECT * FROM {table_name} {where_clause} ORDER BY {order_clause}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_members_by_user_id(conn, table: str, user_ids: list[int], batch_size: int) -> dict[int, dict]:
    if not user_ids:
        return {}
    table_name = quote_ident(table)
    members: dict[int, dict] = {}
    with conn.cursor() as cur:
        for batch in chunks(user_ids, batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(f"SELECT * FROM {table_name} WHERE `id` IN ({placeholders})", batch)
            for row in cur.fetchall():
                user_id = normalize_int(row.get("id"))
                if user_id > 0:
                    members[user_id] = row
    return members


def fetch_supplier_ids_by_user_id(conn, table: str, user_ids: list[int], batch_size: int) -> dict[int, int]:
    if not user_ids:
        return {}
    table_name = quote_ident(table)
    supplier_ids: dict[int, int] = {}
    with conn.cursor() as cur:
        for batch in chunks(user_ids, batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(f"SELECT id, user_id FROM {table_name} WHERE user_id IN ({placeholders})", batch)
            for row in cur.fetchall():
                user_id = normalize_int(row.get("user_id"))
                supplier_id = normalize_int(row.get("id"))
                if user_id > 0 and supplier_id > 0:
                    supplier_ids[user_id] = supplier_id
    return supplier_ids


def fetch_target_video_ids(conn, table: str) -> set[int]:
    sql = f"SELECT id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {normalize_int(row.get("id")) for row in cur.fetchall() if normalize_int(row.get("id")) > 0}


def fetch_existing_category_rows_by_id(conn, table: str, ids: list[int], batch_size: int) -> list[dict]:
    category_ids = sorted({normalize_int(category_id) for category_id in ids if normalize_int(category_id) > 0})
    if not category_ids:
        return []
    table_name = quote_ident(table)
    rows = []
    with conn.cursor() as cur:
        for batch in chunks(category_ids, batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(
                f"""
                SELECT id, supplier_id, parent_id, name, sort_order, total_price, discount_rate, enabled
                FROM {table_name}
                WHERE id IN ({placeholders})
                """,
                batch,
            )
            rows.extend(cur.fetchall())
    return list(rows)


def category_collision_value(row: dict, column: str):
    if column in {"id", "supplier_id", "parent_id", "sort_order", "enabled"}:
        return normalize_int(row.get(column))
    if column in {"total_price", "discount_rate"}:
        return normalize_money(row.get(column))
    if column == "name":
        return str(row.get(column) or "").strip()
    return row.get(column)


def detect_category_id_collisions(existing_rows: list[dict], desired_rows: list[dict]) -> list[int]:
    desired_by_id = {normalize_int(row.get("id")): row for row in desired_rows if normalize_int(row.get("id")) > 0}
    collisions = []
    for existing in existing_rows:
        category_id = normalize_int(existing.get("id"))
        desired = desired_by_id.get(category_id)
        if desired is None:
            continue
        existing_key = tuple(category_collision_value(existing, column) for column in CATEGORY_COLLISION_COLUMNS)
        desired_key = tuple(category_collision_value(desired, column) for column in CATEGORY_COLLISION_COLUMNS)
        if existing_key != desired_key:
            collisions.append(category_id)
    return sorted(set(collisions))


def build_supplier_rows(topic_rows: list[dict], members_by_user_id: dict[int, dict]) -> tuple[list[dict], dict[str, int]]:
    rows_by_user_id: dict[int, dict] = {}
    skipped: dict[str, int] = {}
    for topic in topic_rows:
        user_id = normalize_int(topic.get("uid"))
        if user_id <= 0:
            skipped["invalid_user_id"] = skipped.get("invalid_user_id", 0) + 1
            continue
        row = build_supplier_row(topic, members_by_user_id.get(user_id, {}))
        existing = rows_by_user_id.get(user_id)
        if existing is None:
            rows_by_user_id[user_id] = row
            continue
        skipped["duplicate_user_id"] = skipped.get("duplicate_user_id", 0) + 1
        if not existing["company_name"] and row["company_name"]:
            rows_by_user_id[user_id] = row
    return list(rows_by_user_id.values()), skipped


def build_topic_user_id_map(topic_rows: list[dict]) -> dict[int, int]:
    mapping = {}
    for topic in topic_rows:
        topic_id = normalize_int(topic.get("id"))
        user_id = normalize_int(topic.get("uid"))
        if topic_id > 0 and user_id > 0:
            mapping[topic_id] = user_id
    return mapping


def build_category_rows(
    item_rows: list[dict],
    topic_user_ids: dict[int, int],
    supplier_ids_by_user_id: dict[int, int],
    asset_base_url: str,
) -> tuple[list[dict], dict[str, int]]:
    rows = []
    skipped: dict[str, int] = {}
    active_item_meta = {}
    for item in item_rows:
        category_id = normalize_int(item.get("id"))
        topic_id = normalize_int(item.get("topic_id"))
        user_id = topic_user_ids.get(topic_id)
        supplier_id = supplier_ids_by_user_id.get(user_id or 0)
        if category_id > 0 and topic_id > 0 and supplier_id:
            active_item_meta[category_id] = {
                "topic_id": topic_id,
                "supplier_id": supplier_id,
                "parent_id": normalize_int(item.get("item_parent")),
            }

    def has_active_parent_chain(category_id: int) -> bool:
        current = active_item_meta.get(category_id)
        if not current:
            return False
        parent_id = current["parent_id"]
        visited = {category_id}
        while parent_id > 0:
            if parent_id in visited:
                return False
            visited.add(parent_id)
            parent = active_item_meta.get(parent_id)
            if (
                not parent
                or parent["topic_id"] != current["topic_id"]
                or parent["supplier_id"] != current["supplier_id"]
            ):
                return False
            parent_id = parent["parent_id"]
        return True

    for item in item_rows:
        category_id = normalize_int(item.get("id"))
        if category_id <= 0:
            skipped["invalid_category_id"] = skipped.get("invalid_category_id", 0) + 1
            continue
        topic_id = normalize_int(item.get("topic_id"))
        user_id = topic_user_ids.get(topic_id)
        supplier_id = supplier_ids_by_user_id.get(user_id or 0)
        if not supplier_id:
            skipped["missing_supplier"] = skipped.get("missing_supplier", 0) + 1
            continue
        parent_id = normalize_int(item.get("item_parent"))
        if parent_id > 0 and not has_active_parent_chain(category_id):
            skipped["missing_parent_category"] = skipped.get("missing_parent_category", 0) + 1
            continue
        row = build_supplier_category_row(supplier_id, item, asset_base_url)
        row["id"] = category_id
        rows.append(row)
    return rows, skipped


def build_category_meta_by_id(category_rows: list[dict], item_rows: list[dict]) -> dict[int, dict]:
    item_by_id = {normalize_int(item.get("id")): item for item in item_rows if normalize_int(item.get("id")) > 0}
    meta_by_id = {}
    for row in category_rows:
        category_id = normalize_int(row.get("id"))
        if category_id <= 0:
            continue
        item = item_by_id.get(category_id, {})
        meta_by_id[category_id] = {
            "supplier_id": normalize_int(row.get("supplier_id")),
            "package_id": normalize_int(item.get("topic_id")),
            "parent_id": normalize_int(row.get("parent_id")),
            "enabled": normalize_int(row.get("enabled"), 1),
        }
    return meta_by_id


def resolve_relation_category_id(relation: dict) -> int:
    for key in ("topicId", "categoryId", "category_id", "topic_id"):
        category_id = normalize_int(relation.get(key))
        if category_id > 0:
            return category_id
    return 0


def build_category_video_rows(
    relation_rows: list[dict],
    category_meta_by_id: dict[int, dict],
    target_video_ids: set[int] | None = None,
) -> tuple[list[dict], dict[str, int]]:
    rows = []
    skipped: dict[str, int] = {}
    for relation in relation_rows:
        category_id = resolve_relation_category_id(relation)
        if category_id <= 0:
            skipped["invalid_category_id"] = skipped.get("invalid_category_id", 0) + 1
            continue
        category_meta = category_meta_by_id.get(category_id)
        if not category_meta or normalize_int(category_meta.get("enabled"), 1) != 1:
            skipped["missing_category"] = skipped.get("missing_category", 0) + 1
            continue
        package_id = normalize_int(relation.get("packageId"))
        parent_id = normalize_int(relation.get("parentId"))
        if (
            package_id != normalize_int(category_meta.get("package_id"))
            or parent_id != normalize_int(category_meta.get("parent_id"))
        ):
            skipped["package_group_mismatch"] = skipped.get("package_group_mismatch", 0) + 1
            continue
        supplier_id = normalize_int(category_meta.get("supplier_id"))
        row = build_category_video_row(supplier_id, category_id, relation)
        if row["video_id"] <= 0:
            skipped["invalid_video_id"] = skipped.get("invalid_video_id", 0) + 1
            continue
        if target_video_ids is not None and row["video_id"] not in target_video_ids:
            skipped["missing_target_video"] = skipped.get("missing_target_video", 0) + 1
            continue
        rows.append(row)
    return rows, skipped


def row_values(row: dict, columns: tuple[str, ...]) -> tuple:
    return tuple(row[column] for column in columns)


def supplier_upsert_sql(table: str) -> str:
    return f"""
        INSERT INTO {quote_ident(table)}
          (user_id, company_name, member_type, enabled, created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          company_name = VALUES(company_name),
          enabled = VALUES(enabled),
          updated_at = NOW()
    """


def category_upsert_sql(table: str) -> str:
    return f"""
        INSERT INTO {quote_ident(table)}
          (id, supplier_id, parent_id, name, sort_order, total_price, discount_rate, enabled,
           created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          supplier_id = VALUES(supplier_id),
          parent_id = VALUES(parent_id),
          name = VALUES(name),
          sort_order = VALUES(sort_order),
          total_price = VALUES(total_price),
          discount_rate = VALUES(discount_rate),
          enabled = VALUES(enabled),
          updated_at = NOW()
    """


def category_video_insert_sql(table: str) -> str:
    return f"""
        INSERT IGNORE INTO {quote_ident(table)}
          (supplier_id, category_id, video_id, sort_order, created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, NOW(), NOW())
    """


def insert_supplier_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    sql = supplier_upsert_sql(table)
    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [row_values(row, SUPPLIER_COLUMNS) for row in batch])
            affected += cur.rowcount
    return affected


def insert_category_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    sql = category_upsert_sql(table)
    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [row_values(row, CATEGORY_COLUMNS) for row in batch])
            affected += cur.rowcount
    return affected


def insert_category_video_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    sql = category_video_insert_sql(table)
    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [row_values(row, CATEGORY_VIDEO_COLUMNS) for row in batch])
            affected += cur.rowcount
    return affected


def make_stats(scanned: int, rows: list[dict], skipped: dict[str, int] | None = None, affected: int | None = None):
    skipped = skipped or {}
    return RunStats(
        scanned=scanned,
        inserted=len(rows) if affected is None else affected,
        skipped=sum(skipped.values()),
        skip_reasons=skipped,
    )


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> dict[str, RunStats]:
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
    target_video_ids = fetch_target_video_ids(target_conn, args.target_video_table)

    user_ids = sorted({normalize_int(topic.get("uid")) for topic in topic_rows if normalize_int(topic.get("uid")) > 0})
    members_by_user_id = fetch_members_by_user_id(source_conn, args.source_member_table, user_ids, args.batch_size)
    supplier_rows, supplier_skipped = build_supplier_rows(topic_rows, members_by_user_id)

    supplier_affected = None
    if apply:
        supplier_affected = insert_supplier_rows(target_conn, args.target_supplier_table, supplier_rows, args.batch_size)
        supplier_ids_by_user_id = fetch_supplier_ids_by_user_id(
            target_conn,
            args.target_supplier_table,
            [row["user_id"] for row in supplier_rows],
            args.batch_size,
        )
    else:
        supplier_ids_by_user_id = {row["user_id"]: row["user_id"] for row in supplier_rows}

    topic_user_ids = build_topic_user_id_map(topic_rows)
    category_rows, category_skipped = build_category_rows(
        item_rows,
        topic_user_ids,
        supplier_ids_by_user_id,
        args.asset_base_url,
    )
    category_meta_by_id = build_category_meta_by_id(category_rows, item_rows)
    category_video_rows, category_video_skipped = build_category_video_rows(
        source_relation_rows,
        category_meta_by_id,
        target_video_ids=target_video_ids,
    )

    if apply:
        existing_category_rows = fetch_existing_category_rows_by_id(
            target_conn,
            args.target_category_table,
            [row["id"] for row in category_rows],
            args.batch_size,
        )
        category_collisions = detect_category_id_collisions(existing_category_rows, category_rows)
        if category_collisions:
            preview = ", ".join(str(category_id) for category_id in category_collisions[:20])
            suffix = "" if len(category_collisions) <= 20 else f" ... ({len(category_collisions)} total)"
            raise RuntimeError(f"video supplier category id collision detected: {preview}{suffix}")
        category_affected = insert_category_rows(target_conn, args.target_category_table, category_rows, args.batch_size)
        category_video_affected = insert_category_video_rows(
            target_conn,
            args.target_category_video_table,
            category_video_rows,
            args.batch_size,
        )
    else:
        category_affected = None
        category_video_affected = None

    return {
        "suppliers": make_stats(
            len(topic_rows),
            supplier_rows,
            skipped=supplier_skipped,
            affected=supplier_affected,
        ),
        "categories": make_stats(
            len(item_rows),
            category_rows,
            skipped=category_skipped,
            affected=category_affected,
        ),
        "category_videos": make_stats(
            len(source_relation_rows),
            category_video_rows,
            skipped=category_video_skipped,
            affected=category_video_affected,
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
    print(f"[{mode}] video supplier migration")
    for name in ("suppliers", "categories", "category_videos"):
        print_summary(name, stats[name])


if __name__ == "__main__":
    main()
