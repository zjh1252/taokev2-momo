#!/usr/bin/env python3
from __future__ import annotations

import argparse
from decimal import Decimal

from data_trans_lib.ident import quote_ident
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary

from run_legacy_courses_migrate import (
    DEFAULT_SOURCE_COURSEINFO_TABLE,
    DEFAULT_SOURCE_COURSEDATA_TABLE,
    DEFAULT_SOURCE_OPEN_COURSE_TABLE,
    DEFAULT_SOURCE_MEMBER_TABLE,
    DEFAULT_TARGET_TABLE,
    fetch_source_rows,
    map_course_prices,
    map_course_type,
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Recompute price/original_price/is_free for INTERNAL courses from legacy tk_course/tk_courseinfo data. "
            "Default is dry-run; pass --apply to write updates."
        ),
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-courseinfo-table", default=DEFAULT_SOURCE_COURSEINFO_TABLE)
    parser.add_argument("--source-coursedata-table", default=DEFAULT_SOURCE_COURSEDATA_TABLE)
    parser.add_argument("--source-open-course-table", default=DEFAULT_SOURCE_OPEN_COURSE_TABLE)
    parser.add_argument("--source-member-table", default=DEFAULT_SOURCE_MEMBER_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for internal course price fixup: {', '.join(missing)}")


def fetch_target_internal_courses(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT id, price, original_price, is_free
        FROM {quote_ident(table)}
        WHERE type = 'INTERNAL'
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def decimal_equal(left: object, right: object) -> bool:
    return Decimal(str(left or 0)).quantize(Decimal("0.01")) == Decimal(str(right or 0)).quantize(Decimal("0.01"))


def build_updates(source_rows: list[dict], target_rows: list[dict]) -> tuple[list[dict], RunStats]:
    source_by_id = {
        int(row["id"]): row
        for row in source_rows
        if map_course_type(row.get("legacy_type")) == "INTERNAL"
    }
    updates: list[dict] = []
    stats = RunStats(scanned=len(target_rows))

    for target in target_rows:
        course_id = int(target["id"])
        source = source_by_id.get(course_id)
        if source is None:
            stats.skip("missing_legacy")
            continue

        price, original_price, is_free = map_course_prices("INTERNAL", source)
        current_price = Decimal(str(target.get("price") or 0))
        current_original_price = Decimal(str(target.get("original_price") or 0))
        current_is_free = int(target.get("is_free") or 0)

        if (
            decimal_equal(current_price, price)
            and decimal_equal(current_original_price, original_price)
            and current_is_free == is_free
        ):
            stats.skip("unchanged")
            continue

        updates.append(
            {
                "id": course_id,
                "price": price,
                "original_price": original_price,
                "is_free": is_free,
            }
        )

    return updates, stats


def apply_updates(conn, table: str, updates: list[dict], batch_size: int) -> int:
    if not updates:
        return 0
    sql = f"""
        UPDATE {quote_ident(table)}
        SET price = %s,
            original_price = %s,
            is_free = %s,
            updated_at = NOW()
        WHERE id = %s
          AND type = 'INTERNAL'
    """
    updated = 0
    with conn.cursor() as cur:
        for batch in chunks(updates, batch_size):
            values = [
                (row["price"], row["original_price"], row["is_free"], row["id"])
                for row in batch
            ]
            cur.executemany(sql, values)
            updated += cur.rowcount
    return updated


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

        source_rows = fetch_source_rows(source_conn, args)
        target_rows = fetch_target_internal_courses(target_conn, args.target_table)
        updates, stats = build_updates(source_rows, target_rows)
        stats.updated = apply_updates(target_conn, args.target_table, updates, args.batch_size) if apply else len(updates)

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
    print(f"[{mode}] internal_courses={stats.scanned} pending_updates={stats.updated}")
    print_summary("internal_course_price_fixup", stats)


if __name__ == "__main__":
    main()
