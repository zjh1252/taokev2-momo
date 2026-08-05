from __future__ import annotations

from urllib.parse import parse_qs, unquote, urlparse

import pymysql
from pymysql.cursors import DictCursor


def parse_mysql_dsn(dsn: str) -> dict[str, object]:
    parsed = urlparse(dsn)
    if parsed.scheme not in {"mysql", "mysql+pymysql"}:
        raise ValueError(f"unsupported MySQL DSN scheme: {parsed.scheme}")
    query = parse_qs(parsed.query)
    return {
        "host": parsed.hostname or "127.0.0.1",
        "port": parsed.port or 3306,
        "user": unquote(parsed.username or ""),
        "password": unquote(parsed.password or ""),
        "database": unquote((parsed.path or "/").lstrip("/")) or None,
        "charset": query.get("charset", ["utf8mb4"])[0],
    }


def connect_mysql(dsn: str):
    cfg = parse_mysql_dsn(dsn)
    return pymysql.connect(**cfg, cursorclass=DictCursor, autocommit=False)


def table_exists(conn, schema: str, table_name: str) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM information_schema.tables
            WHERE table_schema = %s AND table_name = %s
            """,
            (schema, table_name),
        )
        return int(cur.fetchone()["cnt"]) > 0


def existing_columns(conn, table: str) -> set[str]:
    if "." in table:
        schema, table_name = table.split(".", 1)
    else:
        with conn.cursor() as cur:
            cur.execute("SELECT DATABASE() AS db")
            schema = cur.fetchone()["db"]
        table_name = table
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = %s AND table_name = %s
            """,
            (schema, table_name),
        )
        return {row["column_name"] for row in cur.fetchall()}
