#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.runtime import add_common_args, ensure_write_mode


VALID_DOMAINS = {"orders", "comments", "packages", "suppliers"}


def parse_domains(raw: str) -> set[str]:
    values = {item.strip() for item in str(raw or "").split(",") if item.strip()}
    if not values:
        raise ValueError("at least one rollback domain is required")
    unknown = values - VALID_DOMAINS
    if unknown:
        raise ValueError(f"unknown rollback domain: {', '.join(sorted(unknown))}")
    return values


def build_order_rollback_sql() -> list[str]:
    marker = "%[legacy-import][video-order]%"
    return [
        f"DELETE FROM video_enrollments WHERE order_id IN (SELECT id FROM orders WHERE remark LIKE '{marker}')",
        f"DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE remark LIKE '{marker}')",
        f"DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE remark LIKE '{marker}')",
        f"DELETE FROM orders WHERE remark LIKE '{marker}'",
    ]


def build_comment_rollback_sql(legacy_db: str) -> list[str]:
    db = quote_ident(legacy_db)
    return [
        f"""
        DELETE vc
        FROM `video_comments` vc
        INNER JOIN {db}.`tk_video_comment` c
          ON vc.video_id = c.vid
         AND vc.created_at = FROM_UNIXTIME(c.createtime)
         AND LEFT(vc.content, 255) = LEFT(c.content, 255)
         AND (
              vc.user_id = COALESCE(c.uid, 0)
              OR (
                    COALESCE(c.uid, 0) > 0
                AND vc.user_id = 0
                AND NOT EXISTS (SELECT 1 FROM `sys_users` u WHERE u.id = c.uid)
              )
         )
        WHERE COALESCE(c.del, 0) = 0
          AND COALESCE(c.sup, 0) = 0
        """,
    ]


def build_package_rollback_sql(legacy_db: str) -> list[str]:
    db = quote_ident(legacy_db)
    return [
        f"""
        DELETE vr
        FROM `video_package_relations` vr
        INNER JOIN {db}.`tk_video_package_relation` r
          ON r.videoId = vr.video_id
         AND r.packageId = vr.package_id
         AND r.topicId = vr.topic_id
         AND r.parentId = vr.parent_id
        """,
        f"""
        DELETE g
        FROM `video_package_groups` g
        LEFT JOIN {db}.`tk_video_topic` t
          ON g.package_id = t.id AND g.topic_id = 0 AND g.parent_id = 0
        LEFT JOIN {db}.`tk_video_topic_item` i
          ON g.package_id = i.topic_id AND g.topic_id = i.id AND g.parent_id = i.item_parent
        WHERE t.id IS NOT NULL OR i.id IS NOT NULL
        """,
        f"""
        DELETE l
        FROM `video_package_labels` l
        INNER JOIN {db}.`tk_video_topic_item` i ON i.id = l.id
        """,
    ]


def build_supplier_rollback_sql(legacy_db: str) -> list[str]:
    db = quote_ident(legacy_db)
    return [
        f"""
        DELETE scv
        FROM `video_supplier_category_videos` scv
        INNER JOIN `video_supplier_categories` c ON c.id = scv.category_id
        INNER JOIN {db}.`tk_video_topic_item` i ON i.id = c.id
        """,
        f"""
        DELETE c
        FROM `video_supplier_categories` c
        INNER JOIN {db}.`tk_video_topic_item` i ON i.id = c.id
        """,
        f"""
        DELETE s
        FROM `video_suppliers` s
        INNER JOIN {db}.`tk_video_topic` t ON t.uid = s.user_id
        WHERE NOT EXISTS (
            SELECT 1
            FROM `video_supplier_categories` c
            WHERE c.supplier_id = s.id
        )
        """,
    ]


def build_rollback_sql(domains: set[str], legacy_db: str) -> list[str]:
    statements = []
    for domain in ("comments", "orders", "suppliers", "packages"):
        if domain not in domains:
            continue
        if domain == "orders":
            statements.extend(build_order_rollback_sql())
        elif domain == "comments":
            statements.extend(build_comment_rollback_sql(legacy_db))
        elif domain == "packages":
            statements.extend(build_package_rollback_sql(legacy_db))
        elif domain == "suppliers":
            statements.extend(build_supplier_rollback_sql(legacy_db))
    return statements


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Rollback explicitly selected legacy video-domain migration rows.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument(
        "--domain",
        required=True,
        help="Comma-separated rollback domains: orders,comments,packages,suppliers.",
    )
    return parser.parse_args(argv)


def require_target_dsn(args: argparse.Namespace) -> None:
    if not args.target_dsn:
        raise SystemExit("missing required DSN argument for video rollback: --target-dsn")


def execute_statements(conn, statements: list[str]) -> int:
    affected = 0
    with conn.cursor() as cur:
        for statement in statements:
            cur.execute(statement)
            affected += cur.rowcount
    return affected


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    apply = ensure_write_mode(args)
    try:
        domains = parse_domains(args.domain)
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    statements = build_rollback_sql(domains, args.legacy_db)
    if not apply:
        print("[DRY-RUN] video migration rollback SQL")
        for statement in statements:
            print(statement.strip())
            print(";")
        return

    require_target_dsn(args)
    from data_trans_lib.db import connect_mysql

    conn = None
    try:
        conn = connect_mysql(args.target_dsn)
        affected = execute_statements(conn, statements)
        conn.commit()
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

    print(f"[APPLY] video migration rollback affected={affected}")


if __name__ == "__main__":
    main()
