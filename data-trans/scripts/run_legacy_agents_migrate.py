#!/usr/bin/env python3
from __future__ import annotations

import argparse

from data_trans_lib.ident import quote_ident
from data_trans_lib.legacy import normalize_int
from data_trans_lib.legacy_profile import clean_required, clean_text, fallback_datetime, legacy_datetime
from data_trans_lib.runtime import RunStats, add_common_args, chunks, ensure_write_mode, print_summary


DEFAULT_SOURCE_AGENT_TABLE = "taoke.tk_agent_info"
DEFAULT_SOURCE_BINDING_TABLE = "taoke.tk_agent_trainer"
DEFAULT_TARGET_AGENT_TABLE = "user_agents"
DEFAULT_TARGET_BINDING_TABLE = "user_agent_trainer_bindings"
DEFAULT_TARGET_USER_TABLE = "sys_users"
DEFAULT_TARGET_TRAINER_TABLE = "user_trainers"
DEFAULT_TARGET_ROLE_TABLE = "sys_user_roles"

AGENT_COLUMNS = (
    "id",
    "user_id",
    "real_name",
    "email",
    "bio",
    "specialties",
    "service_city_ids",
    "service_cities",
    "agreement_signed_at",
    "agreement_version",
    "created_at",
    "updated_at",
)
ROLE_COLUMNS = (
    "user_id",
    "role",
    "status",
    "reapplying",
    "approved_at",
    "approved_by",
    "reject_reason",
    "created_at",
    "updated_at",
)
BINDING_COLUMNS = (
    "id",
    "agent_user_id",
    "trainer_user_id",
    "status",
    "confirmed_at",
    "note",
    "created_at",
    "updated_at",
    "reject_reason",
    "initiator_user_id",
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Migrate legacy agent profiles and agent-trainer bindings.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    add_common_args(parser)
    parser.add_argument("--source-agent-table", default=DEFAULT_SOURCE_AGENT_TABLE)
    parser.add_argument("--source-binding-table", default=DEFAULT_SOURCE_BINDING_TABLE)
    parser.add_argument("--target-agent-table", default=DEFAULT_TARGET_AGENT_TABLE)
    parser.add_argument("--target-binding-table", default=DEFAULT_TARGET_BINDING_TABLE)
    parser.add_argument("--target-user-table", default=DEFAULT_TARGET_USER_TABLE)
    parser.add_argument("--target-trainer-table", default=DEFAULT_TARGET_TRAINER_TABLE)
    parser.add_argument("--target-role-table", default=DEFAULT_TARGET_ROLE_TABLE)
    return parser.parse_args(argv)


def require_dsns(args: argparse.Namespace) -> None:
    missing = []
    if not args.source_dsn:
        missing.append("--source-dsn")
    if not args.target_dsn:
        missing.append("--target-dsn")
    if missing:
        raise SystemExit(f"missing required DSN arguments for agent migration: {', '.join(missing)}")


def fetch_agent_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT
            id, uid, show_name, email, intro, signature, cate, subcate, province, city,
            type, parent_id, isopen, createtime, updatetime
        FROM {quote_ident(table)}
        WHERE uid > 0
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_binding_rows(conn, table: str) -> list[dict]:
    sql = f"""
        SELECT id, agent_id, trainer_id, status, sort, createtime, updatetime
        FROM {quote_ident(table)}
        WHERE id > 0
        ORDER BY id
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        return list(cur.fetchall())


def fetch_ids(conn, table: str, column: str = "id") -> set[int]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT {quote_ident(column)} AS id FROM {quote_ident(table)}")
        return {int(row["id"]) for row in cur.fetchall() if int(row["id"]) > 0}


def fetch_existing_agents(conn, table: str, batch_size: int) -> tuple[set[int], set[int]]:
    ids: set[int] = set()
    user_ids: set[int] = set()
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, user_id FROM {quote_ident(table)}")
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            for row in rows:
                ids.add(int(row["id"]))
                user_ids.add(int(row["user_id"]))
    return ids, user_ids


def fetch_existing_roles(conn, table: str, batch_size: int) -> set[tuple[int, str]]:
    keys: set[tuple[int, str]] = set()
    with conn.cursor() as cur:
        cur.execute(f"SELECT user_id, role FROM {quote_ident(table)}")
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            for row in rows:
                keys.add((int(row["user_id"]), str(row["role"])))
    return keys


def fetch_existing_bindings(conn, table: str, batch_size: int) -> tuple[set[int], set[tuple[int, int]]]:
    ids: set[int] = set()
    keys: set[tuple[int, int]] = set()
    with conn.cursor() as cur:
        cur.execute(f"SELECT id, agent_user_id, trainer_user_id FROM {quote_ident(table)}")
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            for row in rows:
                ids.add(int(row["id"]))
                keys.add((int(row["agent_user_id"]), int(row["trainer_user_id"])))
    return ids, keys


def build_agent_row(row: dict) -> dict:
    created_at = fallback_datetime(row.get("createtime"), row.get("updatetime"))
    return {
        "id": normalize_int(row.get("id")) or normalize_int(row.get("uid")),
        "user_id": normalize_int(row.get("uid")),
        "real_name": clean_text(row.get("show_name"), 64),
        "email": clean_text(row.get("email"), 128),
        "bio": clean_text(row.get("intro")),
        "specialties": clean_text(row.get("signature"), 512) or clean_text(row.get("cate"), 512),
        "service_city_ids": ",".join(
            str(value)
            for value in (normalize_int(row.get("province")), normalize_int(row.get("city")))
            if value > 0
        )
        or None,
        "service_cities": None,
        "agreement_signed_at": None,
        "agreement_version": None,
        "created_at": created_at,
        "updated_at": legacy_datetime(row.get("updatetime")) or created_at,
    }


def build_role_row(user_id: int, created_at) -> dict:
    return {
        "user_id": user_id,
        "role": "AGENT",
        "status": 1,
        "reapplying": 0,
        "approved_at": created_at,
        "approved_by": None,
        "reject_reason": None,
        "created_at": created_at,
        "updated_at": created_at,
    }


def map_binding_status(value: object) -> int:
    legacy = normalize_int(value)
    if legacy == 1:
        return 1
    if legacy == 3:
        return 3
    if legacy in {-1, 4}:
        return 4
    return 2


def build_binding_row(row: dict) -> dict:
    created_at = fallback_datetime(row.get("createtime"), row.get("updatetime"))
    updated_at = legacy_datetime(row.get("updatetime")) or created_at
    status = map_binding_status(row.get("status"))
    return {
        "id": normalize_int(row.get("id")),
        "agent_user_id": normalize_int(row.get("agent_id")),
        "trainer_user_id": normalize_int(row.get("trainer_id")),
        "status": status,
        "confirmed_at": updated_at if status == 1 else None,
        "note": clean_required(row.get("sort"), 255) if normalize_int(row.get("sort")) > 0 else None,
        "created_at": created_at,
        "updated_at": updated_at,
        "reject_reason": None,
        "initiator_user_id": normalize_int(row.get("agent_id")) or None,
    }


def insert_rows(conn, table: str, rows: list[dict], columns: tuple[str, ...], batch_size: int) -> int:
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
    target_user_ids = fetch_ids(target_conn, args.target_user_table)
    trainer_user_ids = fetch_ids(target_conn, args.target_trainer_table, "user_id")
    existing_agent_ids, existing_agent_user_ids = fetch_existing_agents(
        target_conn, args.target_agent_table, args.batch_size
    )
    existing_roles = fetch_existing_roles(target_conn, args.target_role_table, args.batch_size)

    agent_rows: list[dict] = []
    role_rows: list[dict] = []
    agent_stats = RunStats()
    for source_row in fetch_agent_rows(source_conn, args.source_agent_table):
        agent_stats.scanned += 1
        user_id = normalize_int(source_row.get("uid"))
        agent_id = normalize_int(source_row.get("id")) or user_id
        if normalize_int(source_row.get("type"), 1) != 1:
            agent_stats.skip("non_personal_agent")
            continue
        if user_id not in target_user_ids:
            agent_stats.skip("missing_user")
            continue
        if agent_id not in existing_agent_ids and user_id not in existing_agent_user_ids:
            agent_row = build_agent_row(source_row)
            existing_agent_ids.add(agent_row["id"])
            existing_agent_user_ids.add(user_id)
            agent_rows.append(agent_row)
        else:
            agent_stats.skip("existing_agent")
        if (user_id, "AGENT") not in existing_roles:
            created_at = fallback_datetime(source_row.get("createtime"), source_row.get("updatetime"))
            existing_roles.add((user_id, "AGENT"))
            role_rows.append(build_role_row(user_id, created_at))

    existing_binding_ids, existing_binding_keys = fetch_existing_bindings(
        target_conn, args.target_binding_table, args.batch_size
    )
    binding_rows: list[dict] = []
    binding_stats = RunStats()
    for source_row in fetch_binding_rows(source_conn, args.source_binding_table):
        binding_stats.scanned += 1
        binding_id = normalize_int(source_row.get("id"))
        agent_user_id = normalize_int(source_row.get("agent_id"))
        trainer_user_id = normalize_int(source_row.get("trainer_id"))
        key = (agent_user_id, trainer_user_id)
        if agent_user_id not in target_user_ids or agent_user_id not in existing_agent_user_ids:
            binding_stats.skip("missing_agent")
            continue
        if trainer_user_id not in trainer_user_ids:
            binding_stats.skip("missing_trainer")
            continue
        if binding_id in existing_binding_ids or key in existing_binding_keys:
            binding_stats.skip("existing_binding")
            continue
        existing_binding_ids.add(binding_id)
        existing_binding_keys.add(key)
        binding_rows.append(build_binding_row(source_row))

    agent_stats.inserted = (
        insert_rows(target_conn, args.target_agent_table, agent_rows, AGENT_COLUMNS, args.batch_size)
        if apply
        else len(agent_rows)
    )
    role_stats = RunStats(scanned=agent_stats.scanned)
    role_stats.inserted = (
        insert_rows(target_conn, args.target_role_table, role_rows, ROLE_COLUMNS, args.batch_size)
        if apply
        else len(role_rows)
    )
    binding_stats.inserted = (
        insert_rows(target_conn, args.target_binding_table, binding_rows, BINDING_COLUMNS, args.batch_size)
        if apply
        else len(binding_rows)
    )
    return {"agents": agent_stats, "agent_roles": role_stats, "agent_trainer_bindings": binding_stats}


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
    print(f"[{mode}] legacy agents migration")
    for name, stat in stats.items():
        print_summary(name, stat)


if __name__ == "__main__":
    main()
