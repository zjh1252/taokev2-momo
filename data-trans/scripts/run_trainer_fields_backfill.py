#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_CATE_RELATION_TABLE = "taoke.tk_membercate_relation"
DEFAULT_SOURCE_INDUSTRY_RELATION_TABLE = "taoke.tk_membergood_relation"
DEFAULT_SOURCE_CATE_TABLE = "taoke.tk_cate"
DEFAULT_SOURCE_TRADE_TABLE = "taoke.tk_trade"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"
DEFAULT_TARGET_CATEGORY_TABLE = "sys_categories"
DEFAULT_TARGET_EXPERTISE_TABLE = "trainer_expertise_categories"
DEFAULT_TARGET_INDUSTRY_TABLE = "trainer_industry_categories"

EXPERTISE_TYPE = "TRAINER_EXPERTISE"
INDUSTRY_TYPE = "TRAINER_INDUSTRY"


def build_category_lookup(rows: list[dict]) -> tuple[dict[str, int], set[str]]:
    category_by_name: dict[str, int] = {}
    seen_ids_by_name: dict[str, set[int]] = {}
    ambiguous: set[str] = set()
    for row in rows:
        name = str(row.get("name") or "").strip()
        if not name:
            continue
        category_id = int(row.get("id") or 0)
        if not category_id:
            continue
        seen_ids = seen_ids_by_name.setdefault(name, set())
        seen_ids.add(category_id)
        if len(seen_ids) > 1:
            ambiguous.add(name)
            category_by_name.pop(name, None)
        elif name not in ambiguous:
            category_by_name[name] = category_id
    return category_by_name, ambiguous


def build_category_relation_rows(
    source_rows: list[dict],
    trainer_ids: set[int],
    category_by_name: dict[str, int],
    ambiguous_category_names: set[str] | None = None,
):
    ambiguous_category_names = ambiguous_category_names or set()
    rows = []
    skipped = {}
    for row in source_rows:
        trainer_id = int(row.get("uid") or 0)
        if trainer_id not in trainer_ids:
            skipped["missing_trainer"] = skipped.get("missing_trainer", 0) + 1
            continue
        name = str(row.get("name") or "").strip()
        if name in ambiguous_category_names:
            skipped["ambiguous_category"] = skipped.get("ambiguous_category", 0) + 1
            continue
        category_id = category_by_name.get(name)
        if not category_id:
            skipped["missing_category"] = skipped.get("missing_category", 0) + 1
            continue
        rows.append(
            {
                "trainer_id": trainer_id,
                "category_id": int(category_id),
                "sort_order": int(row.get("priority") or 0),
            }
        )
    return rows, skipped


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Backfill trainer expertise and industry category relations from legacy taoke tables.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument(
        "--source-cate-relation-table",
        default=DEFAULT_SOURCE_CATE_RELATION_TABLE,
        help="Legacy trainer expertise relation table.",
    )
    parser.add_argument(
        "--source-industry-relation-table",
        default=DEFAULT_SOURCE_INDUSTRY_RELATION_TABLE,
        help="Legacy trainer industry relation table.",
    )
    parser.add_argument(
        "--source-cate-table",
        default=DEFAULT_SOURCE_CATE_TABLE,
        help="Legacy expertise category lookup table.",
    )
    parser.add_argument(
        "--source-trade-table",
        default=DEFAULT_SOURCE_TRADE_TABLE,
        help="Legacy industry category lookup table.",
    )
    parser.add_argument(
        "--target-trainer-table",
        default=DEFAULT_TARGET_TRAINER_TABLE,
        help="Target trainer table.",
    )
    parser.add_argument(
        "--target-category-table",
        default=DEFAULT_TARGET_CATEGORY_TABLE,
        help="Target unified category table.",
    )
    parser.add_argument(
        "--target-expertise-table",
        default=DEFAULT_TARGET_EXPERTISE_TABLE,
        help="Target trainer expertise relation table.",
    )
    parser.add_argument(
        "--target-industry-table",
        default=DEFAULT_TARGET_INDUSTRY_TABLE,
        help="Target trainer industry relation table.",
    )
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for backfill: {', '.join(missing)}")


def fetch_trainer_ids(conn, table: str) -> set[int]:
    sql = f"SELECT id FROM {quote_ident(table)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return {int(row["id"]) for row in cur.fetchall()}


def fetch_category_lookup(conn, table: str, category_type: str) -> tuple[dict[str, int], set[str]]:
    sql = f"""
        SELECT id, name
        FROM {quote_ident(table)}
        WHERE type = %s
          AND name IS NOT NULL
          AND TRIM(name) <> ''
        ORDER BY level, sort_order, id
    """
    with conn.cursor() as cur:
        cur.execute(sql, (category_type,))
        rows = cur.fetchall()

    return build_category_lookup(list(rows))


def fetch_source_relation_rows(conn, relation_table: str, taxonomy_table: str) -> list[dict]:
    relation = quote_ident(relation_table)
    taxonomy = quote_ident(taxonomy_table)
    sql = f"""
        SELECT
            r.uid AS uid,
            r.cid AS cid,
            r.subcid AS subcid,
            COALESCE(r.priority, 0) AS priority,
            COALESCE(NULLIF(TRIM(child.name), ''), NULLIF(TRIM(parent.name), '')) AS name
        FROM {relation} r
        LEFT JOIN {taxonomy} child
          ON child.id = CASE WHEN COALESCE(r.subcid, 0) > 0 THEN r.subcid ELSE r.cid END
        LEFT JOIN {taxonomy} parent
          ON parent.id = r.cid
        WHERE r.uid IS NOT NULL
        ORDER BY r.uid, COALESCE(r.priority, 0), r.cid, r.subcid
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def insert_relation_rows(conn, target_table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    sql = (
        f"INSERT IGNORE INTO {quote_ident(target_table)} "
        "(trainer_id, category_id, sort_order, created_at, updated_at) "
        "VALUES (%s, %s, %s, NOW(), NOW())"
    )
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            values = [(row["trainer_id"], row["category_id"], row["sort_order"]) for row in batch]
            cur.executemany(sql, values)
            inserted += cur.rowcount
    return inserted


def build_stats(source_rows: list[dict], skipped: dict[str, int], inserted: int) -> RunStats:
    return RunStats(
        scanned=len(source_rows),
        inserted=inserted,
        skipped=sum(skipped.values()),
        skip_reasons=skipped,
    )


def run_relation_backfill(
    source_conn,
    target_conn,
    source_relation_table: str,
    source_taxonomy_table: str,
    target_relation_table: str,
    trainer_ids: set[int],
    category_by_name: dict[str, int],
    ambiguous_category_names: set[str],
    apply: bool,
    batch_size: int,
) -> RunStats:
    source_rows = fetch_source_relation_rows(source_conn, source_relation_table, source_taxonomy_table)
    relation_rows, skipped = build_category_relation_rows(
        source_rows,
        trainer_ids,
        category_by_name,
        ambiguous_category_names,
    )
    inserted = (
        insert_relation_rows(target_conn, target_relation_table, relation_rows, batch_size)
        if apply
        else len(relation_rows)
    )
    return build_stats(source_rows, skipped, inserted)


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
        trainer_ids = fetch_trainer_ids(target_conn, args.target_trainer_table)
        expertise_categories, ambiguous_expertise = fetch_category_lookup(
            target_conn,
            args.target_category_table,
            EXPERTISE_TYPE,
        )
        industry_categories, ambiguous_industry = fetch_category_lookup(
            target_conn,
            args.target_category_table,
            INDUSTRY_TYPE,
        )

        expertise_stats = run_relation_backfill(
            source_conn,
            target_conn,
            args.source_cate_relation_table,
            args.source_cate_table,
            args.target_expertise_table,
            trainer_ids,
            expertise_categories,
            ambiguous_expertise,
            apply,
            args.batch_size,
        )
        industry_stats = run_relation_backfill(
            source_conn,
            target_conn,
            args.source_industry_relation_table,
            args.source_trade_table,
            args.target_industry_table,
            trainer_ids,
            industry_categories,
            ambiguous_industry,
            apply,
            args.batch_size,
        )

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
    print(
        f"[{mode}] trainers={len(trainer_ids)} "
        f"expertise_categories={len(expertise_categories)} "
        f"expertise_ambiguous={len(ambiguous_expertise)} "
        f"industry_categories={len(industry_categories)} "
        f"industry_ambiguous={len(ambiguous_industry)}"
    )
    print_summary("expertise", expertise_stats)
    print_summary("industry", industry_stats)


if __name__ == "__main__":
    main()
