#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.runtime import add_common_args


def build_verify_queries(legacy_db: str) -> dict[str, str]:
    db = quote_ident(legacy_db)
    return {
        "videos_imported": f"""
            SELECT COUNT(*) AS count
            FROM `videos` v
            INNER JOIN {db}.`tk_video` lv ON lv.id = v.id
            WHERE COALESCE(lv.del, 0) = 0
        """,
        "package_relations": f"""
            SELECT COUNT(*) AS count
            FROM `video_package_relations` vr
            INNER JOIN {db}.`tk_video_package_relation` r
              ON r.videoId = vr.video_id
             AND r.packageId = vr.package_id
             AND r.topicId = vr.topic_id
             AND r.parentId = vr.parent_id
        """,
        "suppliers_imported": f"""
            SELECT COUNT(*) AS count
            FROM `video_suppliers` s
            INNER JOIN {db}.`tk_video_topic` t ON t.uid = s.user_id
            WHERE COALESCE(t.disabled, 0) = 0
        """,
        "orders_legacy_imported": """
            SELECT COUNT(*) AS count
            FROM `orders`
            WHERE remark LIKE '%[legacy-import][video-order]%'
        """,
        "items_for_legacy_orders": """
            SELECT COUNT(*) AS count
            FROM `order_items` i
            INNER JOIN `orders` o ON o.id = i.order_id
            WHERE o.remark LIKE '%[legacy-import][video-order]%'
        """,
        "payments_for_legacy_orders": """
            SELECT COUNT(*) AS count
            FROM `payments` p
            INNER JOIN `orders` o ON o.id = p.order_id
            WHERE o.remark LIKE '%[legacy-import][video-order]%'
        """,
        "enrollments_for_legacy_orders": """
            SELECT COUNT(*) AS count
            FROM `video_enrollments` e
            INNER JOIN `orders` o ON o.id = e.order_id
            WHERE o.remark LIKE '%[legacy-import][video-order]%'
        """,
        "comments_matching_legacy": f"""
            SELECT COUNT(*) AS count
            FROM {db}.`tk_video_comment` c
            INNER JOIN `video_comments` vc
              ON vc.video_id = c.vid
             AND vc.user_id = IF(COALESCE(c.uid, 0) > 0, c.uid, 0)
             AND vc.created_at = FROM_UNIXTIME(c.createtime)
             AND LEFT(vc.content, 255) = LEFT(c.content, 255)
            WHERE COALESCE(c.del, 0) = 0
              AND COALESCE(c.sup, 0) = 0
        """,
        "visible_comments": """
            SELECT COUNT(*) AS count
            FROM `video_comments`
            WHERE visible = 1
              AND audit_status = 1
        """,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verify restored video-domain data-trans migration results.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument(
        "--require-nonzero",
        action="append",
        default=[],
        metavar="SECTION",
        help="Exit with non-zero status when the named verification section returns zero.",
    )
    return parser.parse_args(argv)


def require_target_dsn(args: argparse.Namespace) -> None:
    if not args.target_dsn:
        raise SystemExit("missing required DSN argument for video migration verify audit: --target-dsn")


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
    queries = build_verify_queries(args.legacy_db)
    unknown = set(args.require_nonzero) - set(queries)
    if unknown:
        raise SystemExit(f"unknown verification section: {', '.join(sorted(unknown))}")

    from data_trans_lib.db import connect_mysql

    conn = None
    try:
        conn = connect_mysql(args.target_dsn)
        counts = run_count_queries(conn, queries)
    finally:
        if conn:
            conn.close()

    for name in sorted(counts):
        print(f"section={name} count={counts[name]}")
    failed = [name for name in args.require_nonzero if counts.get(name, 0) == 0]
    if failed:
        raise SystemExit(f"verification section returned zero: {', '.join(failed)}")


if __name__ == "__main__":
    main()
