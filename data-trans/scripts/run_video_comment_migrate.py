#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_datetime, normalize_int
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_COMMENT_TABLE = "taoke.tk_video_comment"
DEFAULT_SOURCE_MEMBER_TABLE = "taoke.tk_member"
DEFAULT_TARGET_COMMENT_TABLE = "video_comments"
DEFAULT_TARGET_VIDEO_TABLE = "videos"
DEFAULT_TARGET_USER_TABLE = "sys_users"

COMMENT_COLUMNS = (
    "video_id",
    "user_id",
    "user_name",
    "content",
    "rating",
    "audit_status",
    "reject_reason",
    "visible",
    "created_at",
    "updated_at",
)


def first_present(row: dict, keys: tuple[str, ...]):
    for key in keys:
        if key in row and row.get(key) not in (None, ""):
            return row.get(key)
    return None


def clamp_text(value: object, length: int) -> str:
    return str(value or "").strip()[:length]


def comment_video_id(row: dict) -> int:
    return normalize_int(first_present(row, ("vid", "video_id", "videoId")))


def comment_user_id(row: dict) -> int:
    return normalize_int(first_present(row, ("uid", "user_id", "userId")))


def clamp_rating(value: object) -> int:
    rating = normalize_int(value, default=5)
    return min(5, max(1, rating))


def comment_content(row: dict) -> str:
    content = str(first_present(row, ("content", "comment", "comment_text", "commentText")) or "").strip()
    extra = str(first_present(row, ("subconent", "subcontent", "append_content", "appendContent")) or "").strip()
    if content and extra:
        return f"{content}\n\n{extra}"
    return content or extra


def comment_audit_state(row: dict) -> tuple[int, int]:
    if normalize_int(row.get("del")) == 1:
        return 0, 2
    raw_isopen = first_present(row, ("isopen", "is_open", "visible", "audit_status", "auditStatus"))
    if raw_isopen is None:
        return 1, 1
    isopen = normalize_int(raw_isopen, default=0)
    if isopen == 1:
        return 1, 1
    if isopen < 0 or isopen == 2:
        return 0, 2
    return 0, 0


def build_comment_row(row: dict, member: dict | None = None) -> dict:
    member = member or {}
    created_at = normalize_datetime(first_present(row, ("createtime", "created_at", "create_time", "createdAt"))) or datetime.now()
    visible, audit_status = comment_audit_state(row)
    user_name = first_present(
        row,
        ("uname", "username", "nickname", "user_name", "userName"),
    )
    if user_name is None:
        user_name = first_present(member, ("nickname", "username", "realname", "real_name", "name"))
    return {
        "video_id": comment_video_id(row),
        "user_id": comment_user_id(row),
        "user_name": clamp_text(user_name, 100),
        "content": comment_content(row),
        "rating": clamp_rating(first_present(row, ("level", "star", "rating", "score"))),
        "audit_status": audit_status,
        "reject_reason": clamp_text(first_present(row, ("reject_reason", "rejectReason", "causes", "reason")), 500),
        "visible": visible,
        "created_at": created_at,
        "updated_at": created_at,
    }


def comment_skip_reason(row: dict, existing_video_ids: set[int], existing_user_ids: set[int] | None = None) -> str | None:
    video_id = comment_video_id(row)
    if video_id <= 0 or video_id not in existing_video_ids:
        return "missing_video"
    if normalize_int(row.get("del")) == 1:
        return "deleted"
    if normalize_int(row.get("sup")) != 0:
        return "supplier_reply"
    if not comment_content(row):
        return "empty_content"
    return None


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy video comments into video_comments.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-comment-table", default=DEFAULT_SOURCE_COMMENT_TABLE)
    parser.add_argument("--source-member-table", default=DEFAULT_SOURCE_MEMBER_TABLE)
    parser.add_argument("--target-comment-table", default=DEFAULT_TARGET_COMMENT_TABLE)
    parser.add_argument("--target-video-table", default=DEFAULT_TARGET_VIDEO_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for video comment migration: {', '.join(missing)}")


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


def fetch_source_comments(conn, table: str) -> list[dict]:
    columns = table_columns(conn, table)
    if not columns:
        return []
    where = []
    if "del" in columns:
        where.append("COALESCE(`del`, 0) = 0")
    if "sup" in columns:
        where.append("COALESCE(`sup`, 0) = 0")
    where_clause = "WHERE " + " AND ".join(where) if where else ""
    order_column = resolve_column(columns, ("id", "createtime", "created_at")) or sorted(columns)[0]
    sql = f"SELECT * FROM {quote_ident(table)} {where_clause} ORDER BY {quote_ident(order_column)}"
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_members_by_id(conn, table: str, user_ids: list[int], batch_size: int) -> dict[int, dict]:
    user_ids = sorted({normalize_int(value) for value in user_ids if normalize_int(value) > 0})
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


def fetch_existing_ids(conn, table: str, ids: list[int], batch_size: int) -> set[int]:
    ids = sorted({normalize_int(value) for value in ids if normalize_int(value) > 0})
    if not ids:
        return set()
    table_name = quote_ident(table)
    found = set()
    with conn.cursor() as cur:
        for batch in chunks(ids, batch_size):
            placeholders = ", ".join(["%s"] * len(batch))
            cur.execute(f"SELECT id FROM {table_name} WHERE id IN ({placeholders})", batch)
            found.update(normalize_int(row.get("id")) for row in cur.fetchall())
    return {value for value in found if value > 0}


def add_skip(skipped: dict[str, int], reason: str) -> None:
    skipped[reason] = skipped.get(reason, 0) + 1


def build_comment_rows(
    source_rows: list[dict],
    members_by_user_id: dict[int, dict],
    target_video_ids: set[int],
    target_user_ids: set[int],
) -> tuple[list[dict], dict[str, int], int]:
    rows = []
    skipped: dict[str, int] = {}
    anonymized_users = 0
    seen_keys: set[tuple] = set()
    for source in source_rows:
        reason = comment_skip_reason(source, target_video_ids, target_user_ids)
        if reason:
            add_skip(skipped, reason)
            continue
        user_id = comment_user_id(source)
        row = build_comment_row(source, members_by_user_id.get(user_id))
        if row["user_id"] > 0 and row["user_id"] not in target_user_ids:
            row["user_id"] = 0
            anonymized_users += 1
        key = (row["video_id"], row["user_id"], row["created_at"], row["content"][:255])
        if key in seen_keys:
            add_skip(skipped, "duplicate_source_comment")
            continue
        seen_keys.add(key)
        rows.append(row)
    return rows, skipped, anonymized_users


def existing_comment_probe_sql(table: str) -> str:
    return f"""
        SELECT id FROM {quote_ident(table)}
        WHERE video_id = %s
          AND user_id = %s
          AND created_at = %s
          AND LEFT(content, 255) = LEFT(%s, 255)
        LIMIT 1
    """


def filter_existing_comments(conn, table: str, rows: list[dict]) -> tuple[list[dict], int]:
    if not rows:
        return [], 0
    sql = existing_comment_probe_sql(table)
    filtered = []
    duplicates = 0
    with conn.cursor() as cur:
        for row in rows:
            cur.execute(sql, (row["video_id"], row["user_id"], row["created_at"], row["content"]))
            if cur.fetchone():
                duplicates += 1
                continue
            filtered.append(row)
    return filtered, duplicates


def comment_insert_sql(table: str) -> str:
    return f"""
        INSERT INTO {quote_ident(table)}
          (video_id, user_id, user_name, content, rating, audit_status, reject_reason, visible, created_at, updated_at)
        VALUES
          (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """


def row_values(row: dict, columns: tuple[str, ...]) -> tuple:
    return tuple(row[column] for column in columns)


def insert_comment_rows(conn, table: str, rows: list[dict], batch_size: int) -> int:
    if not rows:
        return 0
    sql = comment_insert_sql(table)
    affected = 0
    with conn.cursor() as cur:
        for batch in chunks(rows, batch_size):
            cur.executemany(sql, [row_values(row, COMMENT_COLUMNS) for row in batch])
            affected += cur.rowcount
    return affected


def migrate(source_conn, target_conn, args: argparse.Namespace, apply: bool) -> dict[str, RunStats]:
    source_rows = fetch_source_comments(source_conn, args.source_comment_table)
    source_video_ids = sorted({comment_video_id(row) for row in source_rows if comment_video_id(row) > 0})
    source_user_ids = sorted({comment_user_id(row) for row in source_rows if comment_user_id(row) > 0})
    target_video_ids = fetch_existing_ids(target_conn, args.target_video_table, source_video_ids, args.batch_size)
    target_user_ids = fetch_existing_ids(target_conn, args.target_user_table, source_user_ids, args.batch_size)
    members_by_user_id = fetch_members_by_id(source_conn, args.source_member_table, source_user_ids, args.batch_size)

    rows, skipped, anonymized_users = build_comment_rows(
        source_rows,
        members_by_user_id,
        target_video_ids,
        target_user_ids,
    )
    rows, duplicate_target_count = filter_existing_comments(target_conn, args.target_comment_table, rows)
    if duplicate_target_count:
        skipped["duplicate_target_comment"] = skipped.get("duplicate_target_comment", 0) + duplicate_target_count

    affected = insert_comment_rows(target_conn, args.target_comment_table, rows, args.batch_size) if apply else None
    return {
        "comments": RunStats(
            scanned=len(source_rows),
            inserted=len(rows) if affected is None else affected,
            updated=anonymized_users,
            skipped=sum(skipped.values()),
            skip_reasons=skipped,
        )
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
    print(f"[{mode}] video comment migration")
    print_summary("comments", stats["comments"])


if __name__ == "__main__":
    main()
