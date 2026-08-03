#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.runtime import add_common_args


def build_gap_queries(legacy_db: str) -> dict[str, str]:
    db = quote_ident(legacy_db)
    return {
        "videos_missing": f"""
            SELECT COUNT(*) AS count
            FROM {db}.`tk_video` lv
            LEFT JOIN `videos` v ON v.id = lv.id
            WHERE COALESCE(lv.del, 0) = 0
              AND v.id IS NULL
        """,
        "packages_missing": f"""
            SELECT COUNT(*) AS count
            FROM {db}.`tk_video_package_relation` r
            LEFT JOIN `video_package_relations` vr
              ON vr.video_id = r.videoId
             AND vr.package_id = r.packageId
             AND vr.topic_id = r.topicId
             AND vr.parent_id = r.parentId
            WHERE vr.id IS NULL
        """,
        "suppliers_missing": f"""
            SELECT COUNT(*) AS count
            FROM {db}.`tk_video_topic` t
            LEFT JOIN `video_suppliers` s ON s.user_id = t.uid
            WHERE COALESCE(t.disabled, 0) = 0
              AND COALESCE(t.uid, 0) > 0
              AND s.id IS NULL
        """,
        "orders_paid_missing": f"""
            SELECT COUNT(*) AS count
            FROM {db}.`tk_video_order` o
            LEFT JOIN `orders` no ON no.order_no = o.order_code
            WHERE o.status = 3
              AND no.id IS NULL
        """,
        "comments_orphan": f"""
            SELECT COUNT(*) AS count
            FROM {db}.`tk_video_comment` c
            LEFT JOIN `videos` v ON v.id = c.vid
            LEFT JOIN `sys_users` u ON u.id = c.uid
            WHERE COALESCE(c.del, 0) = 0
              AND COALESCE(c.sup, 0) = 0
              AND COALESCE(c.vid, 0) > 0
              AND (v.id IS NULL OR (COALESCE(c.uid, 0) > 0 AND u.id IS NULL))
        """,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit missing legacy video-domain rows before running data-trans migrations.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument(
        "--require-zero-gaps",
        action="store_true",
        help="Exit with non-zero status when any gap section returns a positive count.",
    )
    return parser.parse_args(argv)


def require_target_dsn(args: argparse.Namespace) -> None:
    if not args.target_dsn:
        raise SystemExit("missing required DSN argument for video gap audit: --target-dsn")


def run_count_queries(conn, queries: dict[str, str]) -> dict[str, int]:
    counts = {}
    with conn.cursor() as cur:
        for name, sql in queries.items():
            cur.execute(sql)
            row = cur.fetchone() or {}
            counts[name] = int(row.get("count") or row.get("COUNT(*)") or 0)
    return counts


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    require_target_dsn(args)

    from data_trans_lib.db import connect_mysql

    conn = None
    try:
        conn = connect_mysql(args.target_dsn)
        counts = run_count_queries(conn, build_gap_queries(args.legacy_db))
    finally:
        if conn:
            conn.close()

    has_gap = False
    for name in sorted(counts):
        count = counts[name]
        has_gap = has_gap or count > 0
        print(f"section={name} count={count}")
    if args.require_zero_gaps and has_gap:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
