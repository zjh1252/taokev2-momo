#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import fallback_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_COURSE_FAV_TABLE = "taoke.tk_course_fav"
DEFAULT_SOURCE_MEMBER_FAV_TABLE = "taoke.tk_member_fav"
DEFAULT_SOURCE_ATTENTION_TABLE = "taoke.tk_attention"
DEFAULT_SOURCE_COLLECT_TRAINER_CONTACT_TABLE = "taoke.tk_collect_trainer_contact"
DEFAULT_TARGET_TABLE = "user_favorites"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_COURSE_TABLE = "courses"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"
DEFAULT_TARGET_INSTITUTION_TABLE = "user_institutions"

MEMBER_FAV_ID_OFFSET = 100_000_000
ATTENTION_ID_OFFSET = 200_000_000
COLLECT_TRAINER_CONTACT_ID_OFFSET = 300_000_000

FAVORITE_COLUMNS = (
    "id",
    "user_id",
    "target_type",
    "target_id",
    "created_at",
    "updated_at",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy favorites/follows into user_favorites.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-course-fav-table", default=DEFAULT_SOURCE_COURSE_FAV_TABLE)
    parser.add_argument("--source-member-fav-table", default=DEFAULT_SOURCE_MEMBER_FAV_TABLE)
    parser.add_argument("--source-attention-table", default=DEFAULT_SOURCE_ATTENTION_TABLE)
    parser.add_argument("--source-collect-trainer-contact-table", default=DEFAULT_SOURCE_COLLECT_TRAINER_CONTACT_TABLE)
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-course-table", default=DEFAULT_TARGET_COURSE_TABLE)
    parser.add_argument("--target-trainer-table", default=DEFAULT_TARGET_TRAINER_TABLE)
    parser.add_argument("--target-institution-table", default=DEFAULT_TARGET_INSTITUTION_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for favorites migration: {', '.join(missing)}")


def fetch_rows(conn, table: str, columns: str, order_by: str) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT {columns} FROM {quote_ident(table)} ORDER BY {quote_ident(order_by)}")
        return list(cur.fetchall())


def fetch_ids(conn, table: str, column: str = "id") -> set[int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT {quote_ident(column)} AS id FROM {quote_ident(table)}")
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def fetch_institution_ids_by_user(conn, table: str) -> dict[int, int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, user_id FROM {quote_ident(table)} WHERE user_id > 0")
        return {int(row["user_id"]): int(row["id"]) for row in cur.fetchall()}


def fetch_existing(conn, table: str, batch_size: int) -> tuple[set[int], set[tuple[int, str, int]]]:
    ids: set[int] = set()
    keys: set[tuple[int, str, int]] = set()
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, user_id, target_type, target_id FROM {quote_ident(table)}")
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            for row in rows:
                ids.add(int(row["id"]))
                keys.add((int(row["user_id"]), str(row["target_type"]), int(row["target_id"])))
    return ids, keys


def favorite_row(row_id: int, user_id: int, target_type: str, target_id: int, created_raw: object) -> dict:
    created_at = fallback_datetime(created_raw)
    return {
        "id": row_id,
        "user_id": user_id,
        "target_type": target_type,
        "target_id": target_id,
        "created_at": created_at,
        "updated_at": created_at,
    }


def resolve_member_target(
    target_user_id: int,
    trainer_user_ids: set[int],
    institution_id_by_user: dict[int, int],
) -> tuple[str, int] | None:
    if target_user_id in trainer_user_ids:
        return "TRAINER", target_user_id
    institution_id = institution_id_by_user.get(target_user_id)
    if institution_id:
        return "INSTITUTION", institution_id
    return None


def insert_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    columns = ", ".join(quote_ident(column) for column in FAVORITE_COLUMNS)
    placeholders = ", ".join(["%s"] * len(FAVORITE_COLUMNS))
    sql = f"INSERT IGNORE INTO {quote_ident(table)} ({columns}) VALUES ({placeholders})"
    inserted = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [tuple(row[column] for column in FAVORITE_COLUMNS) for row in batch])
            inserted += cur.rowcount
    return inserted


def add_candidate(
    rows: list[dict],
    stats: RunStats,
    existing_ids: set[int],
    existing_keys: set[tuple[int, str, int]],
    row: dict,
) -> None:
    key = (row["user_id"], row["target_type"], row["target_id"])
    if row["id"] in existing_ids or key in existing_keys:
        stats.skip("existing_favorite")
        return
    existing_ids.add(row["id"])
    existing_keys.add(key)
    stats.inserted += 1
    rows.append(row)


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> dict[str, RunStats]:
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    target_course_ids = fetch_ids(target_conn, args.target_course_table)
    trainer_user_ids = fetch_ids(target_conn, args.target_trainer_table, "user_id")
    institution_id_by_user = fetch_institution_ids_by_user(target_conn, args.target_institution_table)
    existing_ids, existing_keys = fetch_existing(target_conn, args.target_table, args.batch_size)

    rows: list[dict] = []
    course_stats = RunStats()
    for source_row in fetch_rows(source_conn, args.source_course_fav_table, "fid, tid, uid, ctime", "fid"):
        course_stats.scanned += 1
        user_id = normalize_int(source_row.get("uid"))
        course_id = normalize_int(source_row.get("tid"))
        if user_id not in target_user_ids:
            course_stats.skip("missing_user")
            continue
        if course_id not in target_course_ids:
            course_stats.skip("missing_course")
            continue
        add_candidate(
            rows,
            course_stats,
            existing_ids,
            existing_keys,
            favorite_row(normalize_int(source_row.get("fid")), user_id, "COURSE", course_id, source_row.get("ctime")),
        )

    member_stats = RunStats()
    for source_row in fetch_rows(source_conn, args.source_member_fav_table, "fid, tid, uid, ctime", "fid"):
        member_stats.scanned += 1
        user_id = normalize_int(source_row.get("uid"))
        target_user_id = normalize_int(source_row.get("tid"))
        target = resolve_member_target(target_user_id, trainer_user_ids, institution_id_by_user)
        if user_id not in target_user_ids:
            member_stats.skip("missing_user")
            continue
        if target is None:
            member_stats.skip("missing_target_member")
            continue
        target_type, target_id = target
        add_candidate(
            rows,
            member_stats,
            existing_ids,
            existing_keys,
            favorite_row(
                MEMBER_FAV_ID_OFFSET + normalize_int(source_row.get("fid")),
                user_id,
                target_type,
                target_id,
                source_row.get("ctime"),
            ),
        )

    attention_stats = RunStats()
    for source_row in fetch_rows(
        source_conn,
        args.source_attention_table,
        "id, uid, attention_uid, attention_time, iscancel",
        "id",
    ):
        attention_stats.scanned += 1
        if normalize_int(source_row.get("iscancel")) == 1:
            attention_stats.skip("cancelled")
            continue
        user_id = normalize_int(source_row.get("uid"))
        target_user_id = normalize_int(source_row.get("attention_uid"))
        target = resolve_member_target(target_user_id, trainer_user_ids, institution_id_by_user)
        if user_id not in target_user_ids:
            attention_stats.skip("missing_user")
            continue
        if target is None:
            attention_stats.skip("missing_target_member")
            continue
        target_type, target_id = target
        add_candidate(
            rows,
            attention_stats,
            existing_ids,
            existing_keys,
            favorite_row(
                ATTENTION_ID_OFFSET + normalize_int(source_row.get("id")),
                user_id,
                target_type,
                target_id,
                source_row.get("attention_time"),
            ),
        )

    collect_stats = RunStats()
    for source_row in fetch_rows(
        source_conn,
        args.source_collect_trainer_contact_table,
        "id, userId, trainerId, createTime",
        "id",
    ):
        collect_stats.scanned += 1
        user_id = normalize_int(source_row.get("userId"))
        trainer_user_id = normalize_int(source_row.get("trainerId"))
        if user_id not in target_user_ids:
            collect_stats.skip("missing_user")
            continue
        if trainer_user_id not in trainer_user_ids:
            collect_stats.skip("missing_trainer")
            continue
        add_candidate(
            rows,
            collect_stats,
            existing_ids,
            existing_keys,
            favorite_row(
                COLLECT_TRAINER_CONTACT_ID_OFFSET + normalize_int(source_row.get("id")),
                user_id,
                "TRAINER",
                trainer_user_id,
                source_row.get("createTime"),
            ),
        )

    if apply:
        insert_rows(target_conn, args.target_table, rows, args.batch_size)
    return {
        "course_favorites": course_stats,
        "member_favorites": member_stats,
        "attentions": attention_stats,
        "collect_trainer_contacts": collect_stats,
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
    print(f"[{mode}] legacy favorites migration")
    for name, stat in stats.items():
        print_summary(name, stat)


if __name__ == "__main__":
    main()
