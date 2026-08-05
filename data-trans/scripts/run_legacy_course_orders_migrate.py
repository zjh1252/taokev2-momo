#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
from decimal import Decimal

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import legacy_import_remark, normalize_int, normalize_money
from data_trans_lib.legacy_profile import clean_required, clean_text, fallback_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_ORDER_TABLE = "taoke.tk_course_order"
DEFAULT_SOURCE_ITEM_TABLE = "taoke.tk_course_order_course"
DEFAULT_SOURCE_PAY_TABLE = "taoke.tk_course_order_pay"
DEFAULT_TARGET_ORDER_TABLE = "orders"
DEFAULT_TARGET_ITEM_TABLE = "order_items"
DEFAULT_TARGET_PAYMENT_TABLE = "payments"
DEFAULT_TARGET_ENROLLMENT_TABLE = "course_enrollments"
DEFAULT_TARGET_COURSE_TABLE = "courses"
DEFAULT_TARGET_USER_TABLE = "sys_users"

ORDER_COLUMNS = (
    "id",
    "order_no",
    "user_id",
    "total_amount",
    "pay_amount",
    "status",
    "remark",
    "paid_at",
    "expired_at",
    "buyer_viewed_at",
    "buyer_viewed_status",
    "created_at",
    "updated_at",
    "pxb_root_id",
    "pxb_kefu",
    "pxb_remarks",
    "concurrency",
    "copy_root_id",
    "order_subject",
    "valid_from",
    "valid_until",
    "legacy_status",
)
ITEM_COLUMNS = (
    "id",
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
    "id",
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
    "id",
    "course_id",
    "user_id",
    "order_id",
    "price_paid",
    "enrolled_at",
    "expired_at",
    "status",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy public-course orders into order tables.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-order-table", default=DEFAULT_SOURCE_ORDER_TABLE)
    parser.add_argument("--source-item-table", default=DEFAULT_SOURCE_ITEM_TABLE)
    parser.add_argument("--source-pay-table", default=DEFAULT_SOURCE_PAY_TABLE)
    parser.add_argument("--target-order-table", default=DEFAULT_TARGET_ORDER_TABLE)
    parser.add_argument("--target-item-table", default=DEFAULT_TARGET_ITEM_TABLE)
    parser.add_argument("--target-payment-table", default=DEFAULT_TARGET_PAYMENT_TABLE)
    parser.add_argument("--target-enrollment-table", default=DEFAULT_TARGET_ENROLLMENT_TABLE)
    parser.add_argument("--target-course-table", default=DEFAULT_TARGET_COURSE_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for course order migration: {', '.join(missing)}")


def fetch_orders(conn, order_table: str, pay_table: str) -> list[dict]:
    sql = f"""
        SELECT
            o.id, o.order_code, o.createtime, o.message,
            p.id AS pay_id, p.userid, p.realname, p.mobile, p.company, p.pay_type, p.pay_form,
            p.trade_code, p.total, p.earnest
        FROM {quote_ident(order_table)} o
        LEFT JOIN {quote_ident(pay_table)} p ON p.order_id = o.id
        WHERE o.id > 0
        ORDER BY o.id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_items(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT id, order_id, course_id, course_title, course_price, course_num, course_status
        FROM {quote_ident(table)}
        WHERE id > 0
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_user_ids(conn, table: str) -> set[int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {quote_ident(table)}")
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def fetch_course_types(conn, table: str) -> dict[int, str]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, type FROM {quote_ident(table)}")
        return {int(row["id"]): str(row["type"]) for row in cur.fetchall()}


def fetch_existing_ids(conn, table: str, batch_size: int) -> set[int]:
    result: set[int] = set()
    with conn.cursor() as cur:
        cur.execute(f"SELECT id FROM {quote_ident(table)}")
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            result.update(int(row["id"]) for row in rows)
    return result


def fetch_existing_order_numbers(conn, table: str, batch_size: int) -> set[str]:
    result: set[str] = set()
    with conn.cursor() as cur:
        cur.execute(f"SELECT order_no FROM {quote_ident(table)}")
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            result.update(str(row["order_no"]) for row in rows)
    return result


def payment_no(order_no: str) -> str:
    raw = f"LCOPAY{order_no}"
    if len(raw) <= 32:
        return raw
    digest = hashlib.sha1(raw.encode("utf-8")).hexdigest()[:8]
    return f"{raw[:23]}{digest}"


def product_type(course_type: str) -> str:
    return "INTERNAL_COURSE" if course_type == "INTERNAL" else "OPEN_COURSE"


def build_order_row(row: dict, total: Decimal) -> dict:
    order_id = normalize_int(row.get("id"))
    order_no = clean_required(row.get("order_code"), 32) or f"LCO{order_id:08d}"
    created_at = fallback_datetime(row.get("createtime"))
    paid = total > Decimal("0.00") and normalize_int(row.get("pay_id")) > 0
    return {
        "id": order_id,
        "order_no": order_no,
        "user_id": normalize_int(row.get("userid")),
        "total_amount": total,
        "pay_amount": total,
        "status": 1 if paid else 0,
        "remark": legacy_import_remark("course-order", {"id": order_id}),
        "paid_at": created_at if paid else None,
        "expired_at": None,
        "buyer_viewed_at": None,
        "buyer_viewed_status": None,
        "created_at": created_at,
        "updated_at": created_at,
        "pxb_root_id": 0,
        "pxb_kefu": "",
        "pxb_remarks": clean_required(row.get("message"), 500),
        "concurrency": 1,
        "copy_root_id": 0,
        "order_subject": "",
        "valid_from": None,
        "valid_until": None,
        "legacy_status": normalize_int(row.get("pay_form")),
    }


def build_item_row(row: dict, course_type_value: str, created_at) -> dict:
    quantity = max(normalize_int(row.get("course_num"), 1), 1)
    price = normalize_money(row.get("course_price"))
    return {
        "id": normalize_int(row.get("id")),
        "order_id": normalize_int(row.get("order_id")),
        "product_type": product_type(course_type_value),
        "product_id": normalize_int(row.get("course_id")),
        "product_title": clean_required(row.get("course_title"), 200),
        "product_cover": "",
        "price": price,
        "quantity": quantity,
        "subtotal": (price * Decimal(quantity)).quantize(Decimal("0.01")),
        "created_at": created_at,
        "updated_at": created_at,
    }


def build_payment_row(row: dict, order_no: str, amount: Decimal, created_at) -> dict:
    return {
        "id": normalize_int(row.get("pay_id")),
        "payment_no": payment_no(order_no),
        "order_id": normalize_int(row.get("id")),
        "order_no": order_no,
        "user_id": normalize_int(row.get("userid")),
        "amount": amount,
        "method": "MOCK",
        "status": 1,
        "trade_no": clean_required(row.get("trade_code"), 100),
        "paid_at": created_at,
        "created_at": created_at,
        "updated_at": created_at,
    }


def build_enrollment_row(item: dict, user_id: int, created_at) -> dict:
    return {
        "id": normalize_int(item.get("id")),
        "course_id": normalize_int(item.get("course_id")),
        "user_id": user_id,
        "order_id": normalize_int(item.get("order_id")),
        "price_paid": normalize_money(item.get("course_price")),
        "enrolled_at": created_at,
        "expired_at": None,
        "status": 1,
        "created_at": created_at,
        "updated_at": created_at,
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
    target_user_ids = fetch_user_ids(target_conn, args.target_user_table)
    course_types = fetch_course_types(target_conn, args.target_course_table)
    existing_order_ids = fetch_existing_ids(target_conn, args.target_order_table, args.batch_size)
    existing_order_numbers = fetch_existing_order_numbers(target_conn, args.target_order_table, args.batch_size)
    existing_item_ids = fetch_existing_ids(target_conn, args.target_item_table, args.batch_size)
    existing_payment_ids = fetch_existing_ids(target_conn, args.target_payment_table, args.batch_size)
    existing_enrollment_ids = fetch_existing_ids(target_conn, args.target_enrollment_table, args.batch_size)

    items_by_order: dict[int, list[dict]] = {}
    for item in fetch_items(source_conn, args.source_item_table):
        items_by_order.setdefault(normalize_int(item.get("order_id")), []).append(item)

    order_rows: list[dict] = []
    item_rows: list[dict] = []
    payment_rows: list[dict] = []
    enrollment_rows: list[dict] = []
    order_stats = RunStats()
    item_stats = RunStats()
    payment_stats = RunStats()
    enrollment_stats = RunStats()

    for source_order in fetch_orders(source_conn, args.source_order_table, args.source_pay_table):
        order_stats.scanned += 1
        order_id = normalize_int(source_order.get("id"))
        order_no = clean_required(source_order.get("order_code"), 32) or f"LCO{order_id:08d}"
        user_id = normalize_int(source_order.get("userid"))
        source_items = items_by_order.get(order_id, [])
        total = normalize_money(source_order.get("total"))
        if total <= Decimal("0.00"):
            total = sum((normalize_money(item.get("course_price")) for item in source_items), Decimal("0.00"))
        if order_id in existing_order_ids or order_no in existing_order_numbers:
            order_stats.skip("existing_order")
            continue
        if user_id not in target_user_ids:
            order_stats.skip("missing_user")
            continue
        if not source_items:
            order_stats.skip("missing_items")
            continue
        order_row = build_order_row(source_order, total)
        created_at = order_row["created_at"]
        valid_items = []
        for source_item in source_items:
            item_stats.scanned += 1
            item_id = normalize_int(source_item.get("id"))
            course_id = normalize_int(source_item.get("course_id"))
            if item_id in existing_item_ids:
                item_stats.skip("existing_item")
                continue
            if course_id not in course_types:
                item_stats.skip("missing_course")
                continue
            valid_items.append(source_item)
        if not valid_items:
            order_stats.skip("no_valid_items")
            continue
        existing_order_ids.add(order_id)
        existing_order_numbers.add(order_no)
        order_rows.append(order_row)
        for source_item in valid_items:
            item_id = normalize_int(source_item.get("id"))
            existing_item_ids.add(item_id)
            item_rows.append(build_item_row(source_item, course_types[normalize_int(source_item.get("course_id"))], created_at))
            enrollment_stats.scanned += 1
            if item_id not in existing_enrollment_ids and order_row["status"] == 1:
                existing_enrollment_ids.add(item_id)
                enrollment_rows.append(build_enrollment_row(source_item, user_id, created_at))
        pay_id = normalize_int(source_order.get("pay_id"))
        if pay_id > 0 and pay_id not in existing_payment_ids and order_row["status"] == 1:
            payment_stats.scanned += 1
            existing_payment_ids.add(pay_id)
            payment_rows.append(build_payment_row(source_order, order_no, total, created_at))

    order_stats.inserted = (
        insert_rows(target_conn, args.target_order_table, ORDER_COLUMNS, order_rows, args.batch_size)
        if apply
        else len(order_rows)
    )
    item_stats.inserted = (
        insert_rows(target_conn, args.target_item_table, ITEM_COLUMNS, item_rows, args.batch_size)
        if apply
        else len(item_rows)
    )
    payment_stats.inserted = (
        insert_rows(target_conn, args.target_payment_table, PAYMENT_COLUMNS, payment_rows, args.batch_size)
        if apply
        else len(payment_rows)
    )
    enrollment_stats.inserted = (
        insert_rows(target_conn, args.target_enrollment_table, ENROLLMENT_COLUMNS, enrollment_rows, args.batch_size)
        if apply
        else len(enrollment_rows)
    )
    return {
        "orders": order_stats,
        "order_items": item_stats,
        "payments": payment_stats,
        "course_enrollments": enrollment_stats,
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
    print(f"[{mode}] legacy course orders migration")
    for name, stat in stats.items():
        print_summary(name, stat)


if __name__ == "__main__":
    main()
