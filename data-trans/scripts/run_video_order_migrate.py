#!/usr/bin/env python3
from __future__ import annotations

import argparse
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import (
    legacy_import_remark,
    map_video_order_status,
    normalize_datetime,
    normalize_int,
    normalize_money,
)
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_ORDER_TABLE = "taoke.tk_video_order"
DEFAULT_SOURCE_DETAIL_TABLE = "taoke.tk_video_order_detail"
DEFAULT_SOURCE_BASIC_TABLE = "taoke.video_order_basic"
DEFAULT_TARGET_ORDER_TABLE = "orders"
DEFAULT_TARGET_ITEM_TABLE = "order_items"
DEFAULT_TARGET_PAYMENT_TABLE = "payments"
DEFAULT_TARGET_ENROLLMENT_TABLE = "video_enrollments"
DEFAULT_TARGET_VIDEO_TABLE = "videos"
DEFAULT_TARGET_USER_TABLE = "sys_users"

LEGACY_VIDEO_ORDER_MARKER = "[legacy-import][video-order]"

ORDER_COLUMNS = (
    "order_no",
    "user_id",
    "total_amount",
    "pay_amount",
    "status",
    "remark",
    "paid_at",
    "expired_at",
    "legacy_status",
    "created_at",
    "updated_at",
)
ITEM_COLUMNS = (
    "order_id",
    "product_type",
    "product_id",
    "product_title",
    "product_cover",
    "price",
    "quantity",
    "subtotal",
    "created_at",
    "updated_at",
)
PAYMENT_COLUMNS = (
    "payment_no",
    "order_id",
    "order_no",
    "user_id",
    "amount",
    "method",
    "status",
    "trade_no",
    "paid_at",
    "created_at",
    "updated_at",
)
ENROLLMENT_COLUMNS = (
    "video_id",
    "user_id",
    "order_id",
    "price_paid",
    "enrolled_at",
    "expired_at",
    "status",
    "created_at",
    "updated_at",
)

DETAIL_ID_COLUMNS = ("order_id", "video_order_id", "oid", "orderid", "orderId")
DETAIL_CODE_COLUMNS = ("order_code", "orderCode", "order_no", "orderno")


@dataclass
class OrderBundle:
    order: dict
    items: list[dict]
    payment: dict | None
    enrollments: list[dict]


def first_present(row: dict, keys: tuple[str, ...]):
    for key in keys:
        if key in row and row.get(key) not in (None, ""):
            return row.get(key)
    return None


def order_code_for(order: dict) -> str:
    return str(first_present(order, ("order_code", "orderCode", "order_no")) or "").strip()


def source_order_key(order: dict) -> int | str:
    legacy_id = normalize_int(order.get("id"))
    return legacy_id if legacy_id > 0 else order_code_for(order)


def detail_video_id(detail: dict) -> int:
    return normalize_int(first_present(detail, ("video_id", "videoId", "vid")))


def normalize_order_row(order: dict) -> dict:
    row = dict(order)
    row["order_code"] = order_code_for(order)
    row["uid"] = first_present(order, ("uid", "user_id", "userId"))
    row["total"] = first_present(order, ("total", "pay_amount", "amount"))
    row["status"] = first_present(order, ("status", "legacy_status"))
    row["createtime"] = first_present(order, ("createtime", "created_at", "create_time", "createdAt"))
    row["paytime"] = first_present(order, ("paytime", "paid_at", "pay_at", "paidAt"))
    row["endtime"] = first_present(order, ("endtime", "expired_at", "valid_until", "validUntil"))
    row["trade_code"] = first_present(order, ("trade_code", "trade_no", "transaction_id"))
    return row


def normalize_detail_row(detail: dict) -> dict:
    return {
        "video_id": detail_video_id(detail),
        "video_title": str(
            first_present(detail, ("video_title", "videoTitle", "video_name", "title", "name")) or ""
        ).strip(),
        "video_price": first_present(detail, ("video_price", "videoPrice", "price", "amount", "subtotal")),
        "concurrency": first_present(detail, ("concurrency",)),
        "v_type": first_present(detail, ("v_type", "vType", "product_type", "productType", "type")),
    }


def product_type_for_detail(detail: dict) -> str:
    return "VIDEO_PACKAGE" if str(detail.get("v_type") or "").upper() in {"2", "PACKAGE"} else "VIDEO_COURSE"


def build_paid_order_bundle(order: dict, details: list[dict]) -> OrderBundle | None:
    status = first_present(order, ("status", "legacy_status"))
    mapping = map_video_order_status(status)
    if mapping is None:
        return None
    order_no = order_code_for(order)
    total = normalize_money(first_present(order, ("total", "pay_amount", "amount")))
    paid_at = normalize_datetime(first_present(order, ("paytime", "paid_at", "pay_at", "paidAt")))
    created_at = normalize_datetime(first_present(order, ("createtime", "created_at", "create_time", "createdAt"))) or datetime.now()
    expired_at = normalize_datetime(first_present(order, ("endtime", "expired_at", "valid_until", "validUntil")))
    legacy_status = normalize_int(status)
    user_id = normalize_int(first_present(order, ("uid", "user_id", "userId")))
    order_row = {
        "order_no": order_no,
        "user_id": user_id,
        "total_amount": total,
        "pay_amount": total,
        "status": mapping.order_status,
        "remark": legacy_import_remark("video-order", {"order_code": order_no, "status": status}),
        "paid_at": paid_at,
        "expired_at": expired_at,
        "legacy_status": legacy_status,
        "created_at": created_at,
        "updated_at": created_at,
    }
    item_rows = [
        {
            "product_type": product_type_for_detail(detail),
            "product_id": normalize_int(detail.get("video_id")),
            "product_title": str(detail.get("video_title") or "").strip(),
            "product_cover": "",
            "price": normalize_money(detail.get("video_price")),
            "quantity": 1,
            "subtotal": normalize_money(detail.get("video_price")),
            "created_at": created_at,
            "updated_at": created_at,
        }
        for detail in details
    ]
    payment_row = (
        {
            "payment_no": ("LV" + order_no)[0:30],
            "order_no": order_no,
            "user_id": order_row["user_id"],
            "amount": total,
            "method": "MOCK",
            "status": mapping.payment_status,
            "trade_no": str(first_present(order, ("trade_code", "trade_no", "transaction_id")) or ""),
            "paid_at": paid_at,
            "created_at": created_at,
            "updated_at": created_at,
        }
        if mapping.create_payment
        else None
    )
    enrollment_rows = [
        {
            "video_id": normalize_int(detail.get("video_id")),
            "user_id": order_row["user_id"],
            "price_paid": normalize_money(detail.get("video_price")),
            "enrolled_at": paid_at or created_at,
            "expired_at": expired_at,
            "status": mapping.enrollment_status,
            "created_at": created_at,
            "updated_at": created_at,
        }
        for detail in details
        if mapping.create_enrollment
    ]
    return OrderBundle(order_row, item_rows, payment_row, enrollment_rows)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate paid legacy video orders into orders, payments, items, and video enrollments.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-order-table", default=DEFAULT_SOURCE_ORDER_TABLE)
    parser.add_argument("--source-detail-table", default=DEFAULT_SOURCE_DETAIL_TABLE)
    parser.add_argument("--source-basic-table", default=DEFAULT_SOURCE_BASIC_TABLE)
    parser.add_argument("--target-order-table", default=DEFAULT_TARGET_ORDER_TABLE)
    parser.add_argument("--target-item-table", default=DEFAULT_TARGET_ITEM_TABLE)
    parser.add_argument("--target-payment-table", default=DEFAULT_TARGET_PAYMENT_TABLE)
    parser.add_argument("--target-enrollment-table", default=DEFAULT_TARGET_ENROLLMENT_TABLE)
    parser.add_argument("--target-video-table", default=DEFAULT_TARGET_VIDEO_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--only-status", type=int, default=3, metavar="3")
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for video order migration: {', '.join(missing)}")


def table_columns(conn, table: str) -> set[str]:
    from data_trans_lib.db import existing_columns

    return existing_columns(conn, table)


def resolve_column(columns: set[str], candidates: tuple[str, ...]) -> str | None:
    lower = {column.lower(): column for column in columns}
    for candidate in candidates:
        if candidate in columns:
            return candidate
        match = lower.get(candidate.lower())
        if match:
            return match
    return None


def fetch_source_orders(conn, table: str, only_status: int) -> list[dict]:
    columns = table_columns(conn, table)
    status_column = resolve_column(columns, ("status",)) or "status"
    order_column = resolve_column(columns, ("id", "order_code", "order_no")) or "id"
    sql = f"""
        SELECT *
        FROM {quote_ident(table)}
        WHERE {quote_ident(status_column)} = %s
        ORDER BY {quote_ident(order_column)}
    """
    with conn.cursor() as cur:
        cur.execute(sql, (only_status,))
        return list(cur.fetchall())


def build_order_lookups(order_rows: list[dict]) -> tuple[dict[int, int | str], dict[str, int | str]]:
    by_id = {}
    by_code = {}
    for order in order_rows:
        key = source_order_key(order)
        legacy_id = normalize_int(order.get("id"))
        if legacy_id > 0:
            by_id[legacy_id] = key
        order_code = order_code_for(order)
        if order_code:
            by_code[order_code] = key
    return by_id, by_code


def fetch_rows_by_values(conn, table: str, key_column: str, values: list, batch_size: int, order_columns: list[str]) -> list[dict]:
    if not values:
        return []
    rows = []
    table_name = quote_ident(table)
    order_clause = ", ".join(quote_ident(column) for column in order_columns)
    with conn.cursor() as cur:
        for batch in chunks(values, batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(
                f"SELECT * FROM {table_name} WHERE {quote_ident(key_column)} IN ({placeholders}) ORDER BY {order_clause}",
                batch,
            )
            rows.extend(cur.fetchall())
    return list(rows)


def fetch_details_by_order(conn, table: str, order_rows: list[dict], batch_size: int) -> dict[int | str, list[dict]]:
    columns = table_columns(conn, table)
    if not columns:
        return {}
    by_id, by_code = build_order_lookups(order_rows)
    relation_column = resolve_column(columns, DETAIL_ID_COLUMNS)
    relation_is_id = relation_column is not None
    relation_lookup: dict = by_id
    relation_values = sorted(by_id)
    if relation_column is None:
        relation_column = resolve_column(columns, DETAIL_CODE_COLUMNS)
        relation_lookup = by_code
        relation_values = sorted(by_code)
    if relation_column is None or not relation_values:
        return {}

    order_columns = [relation_column]
    id_column = resolve_column(columns, ("id",))
    if id_column and id_column != relation_column:
        order_columns.append(id_column)
    source_rows = fetch_rows_by_values(conn, table, relation_column, relation_values, batch_size, order_columns)
    details_by_order: dict[int | str, list[dict]] = defaultdict(list)
    for detail in source_rows:
        raw_value = detail.get(relation_column)
        lookup_value = normalize_int(raw_value) if relation_is_id else str(raw_value or "").strip()
        order_key = relation_lookup.get(lookup_value)
        if order_key is not None:
            details_by_order[order_key].append(detail)
    return dict(details_by_order)


def detail_dedupe_key(detail: dict) -> tuple:
    normalized = normalize_detail_row(detail)
    return (
        normalized["video_id"],
        product_type_for_detail(normalized),
        normalized["video_title"],
        str(normalized.get("video_price") or ""),
    )


def merge_detail_groups(*groups: dict[int | str, list[dict]]) -> dict[int | str, list[dict]]:
    merged: dict[int | str, list[dict]] = defaultdict(list)
    seen_by_order: dict[int | str, set[tuple]] = defaultdict(set)
    for group in groups:
        for order_key, details in group.items():
            for detail in details:
                dedupe_key = detail_dedupe_key(detail)
                if dedupe_key in seen_by_order[order_key]:
                    continue
                seen_by_order[order_key].add(dedupe_key)
                merged[order_key].append(detail)
    return dict(merged)


def collect_candidate_video_ids(details_by_order: dict[int | str, list[dict]]) -> list[int]:
    video_ids = {
        detail_video_id(detail)
        for details in details_by_order.values()
        for detail in details
        if detail_video_id(detail) > 0
    }
    return sorted(video_ids)


def fetch_existing_ids(conn, table: str, ids: list[int], batch_size: int, id_column: str = "id") -> set[int]:
    ids = sorted({normalize_int(value) for value in ids if normalize_int(value) > 0})
    if not ids:
        return set()
    table_name = quote_ident(table)
    found = set()
    with conn.cursor() as cur:
        for batch in chunks(ids, batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(f"SELECT {quote_ident(id_column)} AS id FROM {table_name} WHERE {quote_ident(id_column)} IN ({placeholders})", batch)
            found.update(normalize_int(row.get("id")) for row in cur.fetchall())
    return {value for value in found if value > 0}


def add_skip(skipped: dict[str, int], reason: str) -> None:
    skipped[reason] = skipped.get(reason, 0) + 1


def build_migration_bundles(
    order_rows: list[dict],
    details_by_order: dict[int | str, list[dict]],
    target_user_ids: set[int],
    target_video_ids: set[int],
) -> tuple[list[OrderBundle], dict[str, int], dict[str, int]]:
    bundles = []
    order_skipped: dict[str, int] = {}
    detail_skipped: dict[str, int] = {}
    seen_order_nos: set[str] = set()

    for source_order in order_rows:
        order = normalize_order_row(source_order)
        order_no = order_code_for(order)
        if not order_no:
            add_skip(order_skipped, "invalid_order_no")
            continue
        if len(order_no) > 32:
            add_skip(order_skipped, "order_no_too_long")
            continue
        if order_no in seen_order_nos:
            add_skip(order_skipped, "duplicate_order_no")
            continue
        seen_order_nos.add(order_no)

        if map_video_order_status(order.get("status")) is None:
            add_skip(order_skipped, "unsupported_status")
            continue
        user_id = normalize_int(order.get("uid"))
        if user_id <= 0:
            add_skip(order_skipped, "invalid_user_id")
            continue
        if user_id not in target_user_ids:
            add_skip(order_skipped, "missing_target_user")
            continue

        raw_details = details_by_order.get(source_order_key(source_order), [])
        if not raw_details:
            add_skip(order_skipped, "missing_detail")
            continue

        details = []
        for raw_detail in raw_details:
            detail = normalize_detail_row(raw_detail)
            video_id = normalize_int(detail.get("video_id"))
            if video_id <= 0:
                add_skip(detail_skipped, "invalid_video_id")
                continue
            if video_id not in target_video_ids:
                add_skip(detail_skipped, "missing_target_video")
                continue
            details.append(detail)
        if not details:
            add_skip(order_skipped, "no_valid_detail")
            continue

        bundle = build_paid_order_bundle(order, details)
        if bundle is None:
            add_skip(order_skipped, "unsupported_status")
            continue
        bundles.append(bundle)
    return bundles, order_skipped, detail_skipped


def fetch_existing_orders(conn, table: str, order_nos: list[str], batch_size: int) -> dict[str, dict]:
    order_nos = sorted({order_no for order_no in order_nos if order_no})
    if not order_nos:
        return {}
    table_name = quote_ident(table)
    rows_by_no = {}
    with conn.cursor() as cur:
        for batch in chunks(order_nos, batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(
                f"SELECT id, order_no, remark FROM {table_name} WHERE order_no IN ({placeholders})",
                batch,
            )
            for row in cur.fetchall():
                rows_by_no[str(row.get("order_no") or "")] = row
    return rows_by_no


def filter_order_collisions(
    bundles: list[OrderBundle],
    existing_orders: dict[str, dict],
) -> tuple[list[OrderBundle], dict[str, int]]:
    filtered = []
    skipped: dict[str, int] = {}
    for bundle in bundles:
        order_no = bundle.order["order_no"]
        existing = existing_orders.get(order_no)
        if existing and LEGACY_VIDEO_ORDER_MARKER not in str(existing.get("remark") or ""):
            add_skip(skipped, "order_no_collision")
            continue
        filtered.append(bundle)
    return filtered, skipped


def row_values(row: dict, columns: tuple[str, ...]) -> tuple:
    return tuple(row[column] for column in columns)


def order_upsert_sql(table: str) -> str:
    return f"""
        INSERT INTO {quote_ident(table)}
          (order_no, user_id, total_amount, pay_amount, status, remark, paid_at, expired_at,
           legacy_status, created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
          user_id = VALUES(user_id),
          total_amount = VALUES(total_amount),
          pay_amount = VALUES(pay_amount),
          status = VALUES(status),
          remark = VALUES(remark),
          paid_at = VALUES(paid_at),
          expired_at = VALUES(expired_at),
          legacy_status = VALUES(legacy_status),
          updated_at = VALUES(updated_at)
    """


def order_item_insert_sql(table: str) -> str:
    return f"""
        INSERT INTO {quote_ident(table)}
          (order_id, product_type, product_id, product_title, product_cover, price, quantity,
           subtotal, created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """


def payment_upsert_sql(table: str) -> str:
    return f"""
        INSERT INTO {quote_ident(table)}
          (payment_no, order_id, order_no, user_id, amount, method, status, trade_no, paid_at,
           created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
          order_id = VALUES(order_id),
          order_no = VALUES(order_no),
          user_id = VALUES(user_id),
          amount = VALUES(amount),
          method = VALUES(method),
          status = VALUES(status),
          trade_no = VALUES(trade_no),
          paid_at = VALUES(paid_at),
          updated_at = VALUES(updated_at)
    """


def enrollment_upsert_sql(table: str) -> str:
    return f"""
        INSERT INTO {quote_ident(table)}
          (video_id, user_id, order_id, price_paid, enrolled_at, expired_at, status,
           created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
          order_id = IF(order_id = 0 OR order_id = VALUES(order_id), VALUES(order_id), order_id),
          price_paid = IF(order_id = 0 OR order_id = VALUES(order_id), VALUES(price_paid), price_paid),
          enrolled_at = IF(order_id = 0 OR order_id = VALUES(order_id), VALUES(enrolled_at), enrolled_at),
          expired_at = IF(order_id = 0 OR order_id = VALUES(order_id), VALUES(expired_at), expired_at),
          status = IF(order_id = 0 OR order_id = VALUES(order_id), VALUES(status), status),
          updated_at = VALUES(updated_at)
    """


def upsert_order_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    sql = order_upsert_sql(table)
    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [row_values(row, ORDER_COLUMNS) for row in batch])
            affected += cur.rowcount
    return affected


def fetch_order_ids_by_no(conn, table: str, order_nos: list[str], batch_size: int) -> dict[str, int]:
    order_nos = sorted({order_no for order_no in order_nos if order_no})
    if not order_nos:
        return {}
    table_name = quote_ident(table)
    ids = {}
    with conn.cursor() as cur:
        for batch in chunks(order_nos, batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(f"SELECT id, order_no FROM {table_name} WHERE order_no IN ({placeholders})", batch)
            for row in cur.fetchall():
                ids[str(row.get("order_no") or "")] = normalize_int(row.get("id"))
    return {order_no: order_id for order_no, order_id in ids.items() if order_id > 0}


def delete_order_items(conn, table: str, order_ids: list[int], batch_size: int) -> int:
    order_ids = sorted({normalize_int(order_id) for order_id in order_ids if normalize_int(order_id) > 0})
    if not order_ids:
        return 0
    table_name = quote_ident(table)
    deleted = 0
    with conn.cursor() as cur:
        for batch in chunks(order_ids, batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(f"DELETE FROM {table_name} WHERE order_id IN ({placeholders})", batch)
            deleted += cur.rowcount
    return deleted


def insert_rows(conn, table: str, rows: list[dict], columns: tuple[str, ...], sql_builder, batch_size: int) -> int:
    if not rows:
        return 0
    sql = sql_builder(table)
    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [row_values(row, columns) for row in batch])
            affected += cur.rowcount
    return affected


def materialize_child_rows(
    bundles: list[OrderBundle],
    order_ids_by_no: dict[str, int],
) -> tuple[list[dict], list[dict], list[dict], int]:
    item_rows = []
    payment_rows = []
    enrollment_rows = []
    missing_order_ids = 0
    for bundle in bundles:
        order_id = order_ids_by_no.get(bundle.order["order_no"])
        if not order_id:
            missing_order_ids += 1
            continue
        for item in bundle.items:
            row = dict(item)
            row["order_id"] = order_id
            item_rows.append(row)
        if bundle.payment is not None:
            payment = dict(bundle.payment)
            payment["order_id"] = order_id
            payment_rows.append(payment)
        for enrollment in bundle.enrollments:
            row = dict(enrollment)
            row["order_id"] = order_id
            enrollment_rows.append(row)
    return item_rows, payment_rows, enrollment_rows, missing_order_ids


def count_bundle_rows(bundles: list[OrderBundle]) -> tuple[int, int, int]:
    return (
        sum(len(bundle.items) for bundle in bundles),
        sum(1 for bundle in bundles if bundle.payment is not None),
        sum(len(bundle.enrollments) for bundle in bundles),
    )


def make_stats(scanned: int, rows: int, skipped: dict[str, int] | None = None, affected: int | None = None) -> RunStats:
    skipped = skipped or {}
    return RunStats(
        scanned=scanned,
        inserted=rows if affected is None else affected,
        skipped=sum(skipped.values()),
        skip_reasons=skipped,
    )


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> dict[str, RunStats]:
    order_rows = fetch_source_orders(source_conn, args.source_order_table, args.only_status)
    detail_rows = fetch_details_by_order(source_conn, args.source_detail_table, order_rows, args.batch_size)
    basic_rows = fetch_details_by_order(source_conn, args.source_basic_table, order_rows, args.batch_size)
    details_by_order = merge_detail_groups(detail_rows, basic_rows)

    source_user_ids = sorted({
        normalize_int(first_present(order, ("uid", "user_id", "userId")))
        for order in order_rows
        if normalize_int(first_present(order, ("uid", "user_id", "userId"))) > 0
    })
    target_user_ids = fetch_existing_ids(target_conn, args.target_user_table, source_user_ids, args.batch_size)
    target_video_ids = fetch_existing_ids(
        target_conn,
        args.target_video_table,
        collect_candidate_video_ids(details_by_order),
        args.batch_size,
    )

    bundles, order_skipped, detail_skipped = build_migration_bundles(
        order_rows,
        details_by_order,
        target_user_ids,
        target_video_ids,
    )
    existing_orders = fetch_existing_orders(
        target_conn,
        args.target_order_table,
        [bundle.order["order_no"] for bundle in bundles],
        args.batch_size,
    )
    bundles, collision_skipped = filter_order_collisions(bundles, existing_orders)
    for reason, count in collision_skipped.items():
        order_skipped[reason] = order_skipped.get(reason, 0) + count

    dry_item_count, dry_payment_count, dry_enrollment_count = count_bundle_rows(bundles)
    if apply:
        order_affected = upsert_order_rows(
            target_conn,
            args.target_order_table,
            [bundle.order for bundle in bundles],
            args.batch_size,
        )
        order_ids_by_no = fetch_order_ids_by_no(
            target_conn,
            args.target_order_table,
            [bundle.order["order_no"] for bundle in bundles],
            args.batch_size,
        )
        item_rows, payment_rows, enrollment_rows, missing_order_ids = materialize_child_rows(bundles, order_ids_by_no)
        if missing_order_ids:
            order_skipped["missing_target_order_id"] = order_skipped.get("missing_target_order_id", 0) + missing_order_ids
        delete_order_items(target_conn, args.target_item_table, list(order_ids_by_no.values()), args.batch_size)
        item_affected = insert_rows(
            target_conn,
            args.target_item_table,
            item_rows,
            ITEM_COLUMNS,
            order_item_insert_sql,
            args.batch_size,
        )
        payment_affected = insert_rows(
            target_conn,
            args.target_payment_table,
            payment_rows,
            PAYMENT_COLUMNS,
            payment_upsert_sql,
            args.batch_size,
        )
        enrollment_affected = insert_rows(
            target_conn,
            args.target_enrollment_table,
            enrollment_rows,
            ENROLLMENT_COLUMNS,
            enrollment_upsert_sql,
            args.batch_size,
        )
        item_count = len(item_rows)
        payment_count = len(payment_rows)
        enrollment_count = len(enrollment_rows)
    else:
        order_affected = None
        item_affected = None
        payment_affected = None
        enrollment_affected = None
        item_count = dry_item_count
        payment_count = dry_payment_count
        enrollment_count = dry_enrollment_count

    return {
        "orders": make_stats(len(order_rows), len(bundles), skipped=order_skipped, affected=order_affected),
        "items": make_stats(dry_item_count, item_count, skipped=detail_skipped, affected=item_affected),
        "payments": make_stats(dry_payment_count, payment_count, affected=payment_affected),
        "enrollments": make_stats(dry_enrollment_count, enrollment_count, affected=enrollment_affected),
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
    print(f"[{mode}] video order migration")
    for name in ("orders", "items", "payments", "enrollments"):
        print_summary(name, stats[name])


if __name__ == "__main__":
    main()
