#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.db import table_exists
from data_trans_lib.ident import quote_ident
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_TARGET_COURSE_TABLE = "courses"
DEFAULT_TARGET_PLAN_TABLE = "course_plans"
DEFAULT_TARGET_INSTITUTION_TABLE = "user_institutions"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"
DEFAULT_TARGET_REVIEW_TABLE = "training_reviews"
DEFAULT_SOURCE_TRUST_TABLE = "tk_member_auth"

PUBLIC_ORG_REGEX = "公司|集团|中心|学院|咨询|有限|工作室|培训|教育|University|Inc|Ltd"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run post data-trans fixups that Flyway backfills cannot apply on an initially empty target DB.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--target-course-table", default=DEFAULT_TARGET_COURSE_TABLE)
    parser.add_argument("--target-plan-table", default=DEFAULT_TARGET_PLAN_TABLE)
    parser.add_argument("--target-institution-table", default=DEFAULT_TARGET_INSTITUTION_TABLE)
    parser.add_argument("--target-trainer-table", default=DEFAULT_TARGET_TRAINER_TABLE)
    parser.add_argument("--target-review-table", default=DEFAULT_TARGET_REVIEW_TABLE)
    parser.add_argument("--source-trust-table", default=DEFAULT_SOURCE_TRUST_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    if not args.target_dsn:
        raise SystemExit("missing required DSN argument for post fixups: --target-dsn")


def target_database(conn) -> str:
    with conn.cursor() as cur:
        cur.execute("SELECT DATABASE() AS db")
        return str(cur.fetchone()["db"])


def source_schema_and_table(args: argparse.Namespace, table: str) -> tuple[str, str]:
    if "." in table:
        schema, table_name = table.split(".", 1)
    else:
        schema, table_name = args.legacy_db, table
    return schema, table_name


def execute_update(conn, sql: str) -> int:
    with conn.cursor() as cur:
        cur.execute(sql)
        return cur.rowcount


def refresh_course_plan_flags(conn, args: argparse.Namespace, apply: bool) -> RunStats:
    sql = f"""
        UPDATE {quote_ident(args.target_course_table)} c
        LEFT JOIN (
            SELECT course_id, COUNT(*) AS cnt, MAX(DATE(end_time)) AS max_end_date
            FROM {quote_ident(args.target_plan_table)}
            GROUP BY course_id
        ) p ON p.course_id = c.id
        SET c.has_plan = CASE WHEN COALESCE(p.cnt, 0) > 0 THEN 1 ELSE 0 END,
            c.course_open_end_date = p.max_end_date,
            c.updated_at = NOW()
        WHERE c.type IN ('OPEN_OFFLINE', 'OPEN_ONLINE')
    """
    affected = execute_update(conn, sql) if apply else 0
    return RunStats(updated=affected if apply else 1)


def refresh_institution_public_flags(conn, args: argparse.Namespace, apply: bool) -> RunStats:
    statements = [
        f"UPDATE {quote_ident(args.target_institution_table)} SET public_list_eligible = 0 WHERE status = 1",
        f"""
        UPDATE {quote_ident(args.target_institution_table)} ui
        SET ui.public_list_eligible = 1
        WHERE ui.status = 1
          AND ui.org_name NOT LIKE '未命名机构%'
          AND (
              COALESCE(ui.org_type, 0) > 0
              OR EXISTS (
                  SELECT 1 FROM {quote_ident(args.target_course_table)} c
                  WHERE c.publisher_id = ui.user_id
                    AND c.publisher_type = 'INSTITUTION'
                    AND c.status = 2
              )
              OR ui.org_name REGEXP '{PUBLIC_ORG_REGEX}'
          )
          AND NOT (
              EXISTS (
                  SELECT 1 FROM {quote_ident(args.target_trainer_table)} ut
                  WHERE ut.user_id = ui.user_id AND ut.status = 2
              )
              AND NOT EXISTS (
                  SELECT 1 FROM {quote_ident(args.target_course_table)} c
                  WHERE c.publisher_id = ui.user_id
                    AND c.publisher_type = 'INSTITUTION'
                    AND c.status = 2
              )
              AND ui.org_name NOT REGEXP '{PUBLIC_ORG_REGEX}'
          )
        """,
        f"UPDATE {quote_ident(args.target_institution_table)} SET public_list_eligible = 0 WHERE status <> 1",
        f"""
        UPDATE {quote_ident(args.target_institution_table)} ui
        SET ui.public_list_eligible = 0
        WHERE ui.status = 1
          AND ui.public_list_eligible = 1
          AND COALESCE(ui.org_type, 0) = 0
          AND NOT EXISTS (
              SELECT 1 FROM {quote_ident(args.target_course_table)} c
              WHERE c.publisher_id = ui.user_id
                AND c.publisher_type = 'INSTITUTION'
                AND c.status = 2
          )
          AND (
              EXISTS (
                  SELECT 1 FROM {quote_ident(args.target_course_table)} c
                  WHERE c.publisher_id = ui.user_id
                    AND c.publisher_type = 'TRAINER'
                    AND c.status = 2
              )
              OR EXISTS (
                  SELECT 1 FROM {quote_ident(args.target_trainer_table)} ut
                  WHERE ut.user_id = ui.user_id
              )
          )
        """,
        f"""
        UPDATE {quote_ident(args.target_institution_table)} ui
        SET ui.status = 2
        WHERE ui.status = 1
          AND ui.public_list_eligible = 0
          AND COALESCE(ui.org_type, 0) = 0
          AND NOT EXISTS (
              SELECT 1 FROM {quote_ident(args.target_course_table)} c
              WHERE c.publisher_id = ui.user_id
                AND c.publisher_type = 'INSTITUTION'
                AND c.status = 2
          )
          AND (
              EXISTS (
                  SELECT 1 FROM {quote_ident(args.target_course_table)} c
                  WHERE c.publisher_id = ui.user_id
                    AND c.publisher_type = 'TRAINER'
                    AND c.status = 2
              )
              OR EXISTS (
                  SELECT 1 FROM {quote_ident(args.target_trainer_table)} ut
                  WHERE ut.user_id = ui.user_id
              )
          )
        """,
    ]
    affected = 0
    if apply:
        for sql in statements:
            affected += execute_update(conn, sql)
    return RunStats(updated=affected if apply else len(statements))


def refresh_trainer_trust(conn, source_conn, args: argparse.Namespace, apply: bool) -> RunStats:
    schema, table_name = source_schema_and_table(args, args.source_trust_table)
    if source_conn is None or not table_exists(source_conn, schema, table_name):
        return RunStats(skipped=1, skip_reasons={"missing_source_trust_table": 1})

    with source_conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT DISTINCT uid
            FROM {quote_ident(schema + '.' + table_name)}
            WHERE uid > 0
              AND (is_xdg = 1 OR isqc = 1)
            """
        )
        trusted_user_ids = [int(row["uid"]) for row in cur.fetchall()]
    if not trusted_user_ids:
        return RunStats(scanned=0, skipped=1, skip_reasons={"no_trusted_trainers": 1})
    if not apply:
        return RunStats(scanned=len(trusted_user_ids), updated=len(trusted_user_ids))

    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(trusted_user_ids, args.batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(
                f"""
                UPDATE {quote_ident(args.target_trainer_table)}
                SET is_trusted = 1,
                    updated_at = NOW()
                WHERE status = 2
                  AND is_trusted = 0
                  AND (id IN ({placeholders}) OR user_id IN ({placeholders}))
                """,
                [*batch, *batch],
            )
            affected += cur.rowcount
    return RunStats(scanned=len(trusted_user_ids), updated=affected)


def refresh_review_scores(conn, args: argparse.Namespace, apply: bool) -> RunStats:
    statements = [
        f"""
        UPDATE {quote_ident(args.target_trainer_table)}
        SET score = 0.00,
            comment_count = 0
        """,
        f"""
        UPDATE {quote_ident(args.target_trainer_table)} t
        JOIN (
            SELECT trainer_user_id,
                   ROUND(AVG(avg_score), 2) AS avg_score,
                   COUNT(*) AS cnt
            FROM {quote_ident(args.target_review_table)}
            WHERE review_scope = 'TRAINER'
              AND status = 1
              AND trainer_user_id IS NOT NULL
            GROUP BY trainer_user_id
        ) r ON r.trainer_user_id = t.user_id
        SET t.score = r.avg_score,
            t.comment_count = r.cnt,
            t.updated_at = NOW()
        """,
        f"""
        UPDATE {quote_ident(args.target_institution_table)}
        SET score = 0.00,
            comment_count = 0
        """,
        f"""
        UPDATE {quote_ident(args.target_institution_table)} i
        JOIN (
            SELECT institution_id,
                   ROUND(AVG(avg_score), 2) AS avg_score,
                   COUNT(*) AS cnt
            FROM {quote_ident(args.target_review_table)}
            WHERE review_scope = 'INSTITUTION'
              AND status = 1
              AND institution_id IS NOT NULL
            GROUP BY institution_id
        ) r ON r.institution_id = i.id
        SET i.score = r.avg_score,
            i.comment_count = r.cnt,
            i.updated_at = NOW()
        """,
    ]
    affected = 0
    if apply:
        for sql in statements:
            affected += execute_update(conn, sql)
    return RunStats(updated=affected if apply else len(statements))


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    apply = ensure_write_mode(args)
    require_dsns(args)

    from data_trans_lib.db import connect_mysql

    target_conn = None
    source_conn = None
    try:
        target_conn = connect_mysql(args.target_dsn)
        source_conn = connect_mysql(args.source_dsn) if args.source_dsn else None
        stats = {
            "course_plan_flags": refresh_course_plan_flags(target_conn, args, apply),
            "institution_public_flags": refresh_institution_public_flags(target_conn, args, apply),
            "review_scores": refresh_review_scores(target_conn, args, apply),
            "trainer_trust": refresh_trainer_trust(target_conn, source_conn, args, apply),
        }
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
    print(f"[{mode}] legacy post-migration fixups")
    for name, stat in stats.items():
        print_summary(name, stat)


if __name__ == "__main__":
    main()
