# data-trans Core Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the core `data-trans` migration scripts named in the approved design so legacy taoke data can be audited, migrated with dry-run first, verified, and rolled back.

**Architecture:** Keep restored scripts as standalone Python entrypoints under `data-trans/scripts/`, backed by a small shared `data_trans_lib` package for DSN parsing, SQL identifier safety, legacy value normalization, statistics, and row mapping. Each script exposes pure mapping/query helpers that are unit-tested without MySQL, while the CLI layer handles real PyMySQL reads and writes only when `--apply` is passed.

**Tech Stack:** Python 3.12, `pymysql`, `pyyaml`, `unittest`, existing `uv` workspace, MySQL schemas `taoke` and target v2 schema.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `.gitignore` | Modify | Track only recovered core scripts, shared library, and tests while keeping `data-trans/output`, logs, backups, and ad-hoc local scripts ignored. |
| `data-trans/scripts/data_trans_lib/__init__.py` | Create | Mark shared helpers as an importable package. |
| `data-trans/scripts/data_trans_lib/db.py` | Create | Parse MySQL DSNs, connect via PyMySQL, inspect columns and tables. |
| `data-trans/scripts/data_trans_lib/ident.py` | Create | Validate and quote SQL identifiers. |
| `data-trans/scripts/data_trans_lib/legacy.py` | Create | Normalize legacy money, timestamps, URLs, IDs, booleans, remarks, and order status mappings. |
| `data-trans/scripts/data_trans_lib/runtime.py` | Create | Common CLI flags, apply/dry-run guard, counters, chunking, and summary output. |
| `data-trans/scripts/run_trainer_fields_backfill.py` | Create | Restore trainer expertise and industry category relation backfill. |
| `data-trans/scripts/_audit_video_migration_gaps.py` | Create | Restore pre-migration video-domain gap audit. |
| `data-trans/scripts/run_video_package_migrate.py` | Create | Restore package labels, groups, and video-package relation migration. |
| `data-trans/scripts/run_video_supplier_migrate.py` | Create | Restore video suppliers, supplier categories, and supplier category video links. |
| `data-trans/scripts/run_video_order_migrate.py` | Create | Restore paid legacy video order, order item, payment, and enrollment migration. |
| `data-trans/scripts/run_video_comment_migrate.py` | Create | Restore video comment migration. |
| `data-trans/scripts/_audit_video_migration_verify.py` | Create | Restore post-migration verification summary. |
| `data-trans/scripts/_rollback_video_migration.py` | Create | Restore explicit-domain rollback for legacy-imported rows. |
| `data-trans/tests/test_data_trans_lib.py` | Create | Unit tests for shared helpers. |
| `data-trans/tests/test_trainer_fields_backfill.py` | Create | Unit tests for trainer category row mapping. |
| `data-trans/tests/test_video_package_migrate.py` | Create | Unit tests for package label, group, and relation mapping. |
| `data-trans/tests/test_video_supplier_migrate.py` | Create | Unit tests for supplier-domain mapping. |
| `data-trans/tests/test_video_order_migrate.py` | Create | Unit tests for order-domain mapping and status gates. |
| `data-trans/tests/test_video_comment_migrate.py` | Create | Unit tests for comment mapping and orphan skip decisions. |
| `data-trans/tests/test_video_audit_and_rollback.py` | Create | Unit tests for audit section keys and rollback SQL ordering. |

---

### Task 1: Track Recovered data-trans Files

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Update ignore rules**

Replace the current `data-trans` block in `.gitignore` with this exact block:

```gitignore
### 数据迁移工具（核心脚本入库，本地产出不入库） ###
data-trans/*
!data-trans/scripts/
!data-trans/tests/

data-trans/scripts/*
!data-trans/scripts/data_trans_lib/
!data-trans/scripts/data_trans_lib/**
!data-trans/scripts/_validate_flyway_migration.py
!data-trans/scripts/run_trainer_fields_backfill.py
!data-trans/scripts/_audit_video_migration_gaps.py
!data-trans/scripts/run_video_package_migrate.py
!data-trans/scripts/run_video_supplier_migrate.py
!data-trans/scripts/run_video_order_migrate.py
!data-trans/scripts/run_video_comment_migrate.py
!data-trans/scripts/_audit_video_migration_verify.py
!data-trans/scripts/_rollback_video_migration.py

data-trans/tests/*
!data-trans/tests/test_*.py

data-trans/output/
data-trans/logs/
data-trans/backup/
data-trans/docs/
```

- [ ] **Step 2: Verify only intended ignored files change visibility**

Run:

```powershell
git status --short --ignored data-trans .gitignore
```

Expected: `.gitignore` is modified; recovered script paths are no longer ignored once created; existing local-only repair scripts remain ignored unless explicitly force-added.

- [ ] **Step 3: Commit**

Run:

```powershell
git add -- .gitignore
git commit -m "chore(data-trans): track core recovery scripts"
```

Expected: commit succeeds with only `.gitignore`.

---

### Task 2: Shared Library, RED Tests

**Files:**
- Create: `data-trans/tests/test_data_trans_lib.py`

- [ ] **Step 1: Write failing tests**

Create `data-trans/tests/test_data_trans_lib.py`:

```python
import sys
import unittest
from decimal import Decimal
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


class DataTransLibTest(unittest.TestCase):
    def test_safe_ident_quotes_single_and_schema_qualified_names(self):
        from data_trans_lib.ident import quote_ident

        self.assertEqual(quote_ident("courses"), "`courses`")
        self.assertEqual(quote_ident("taoke.tk_video"), "`taoke`.`tk_video`")

    def test_safe_ident_rejects_unsafe_names(self):
        from data_trans_lib.ident import quote_ident

        with self.assertRaises(ValueError):
            quote_ident("videos; DROP TABLE videos")

    def test_parse_mysql_dsn_keeps_credentials_and_charset(self):
        from data_trans_lib.db import parse_mysql_dsn

        cfg = parse_mysql_dsn("mysql://root:root@127.0.0.1:3307/v3test?charset=utf8mb4")

        self.assertEqual(cfg["host"], "127.0.0.1")
        self.assertEqual(cfg["port"], 3307)
        self.assertEqual(cfg["user"], "root")
        self.assertEqual(cfg["password"], "root")
        self.assertEqual(cfg["database"], "v3test")
        self.assertEqual(cfg["charset"], "utf8mb4")

    def test_money_and_id_normalization(self):
        from data_trans_lib.legacy import normalize_int, normalize_money

        self.assertEqual(normalize_money("12.345"), Decimal("12.35"))
        self.assertEqual(normalize_money(1200, cents=True), Decimal("12.00"))
        self.assertEqual(normalize_int(""), 0)
        self.assertEqual(normalize_int("17"), 17)

    def test_legacy_asset_urls(self):
        from data_trans_lib.legacy import normalize_asset_url

        self.assertEqual(normalize_asset_url("", "https://www.taoke.com"), "")
        self.assertEqual(
            normalize_asset_url("attachments/video/a.jpg", "https://www.taoke.com"),
            "https://www.taoke.com/attachments/video/a.jpg",
        )
        self.assertEqual(normalize_asset_url("//cdn.example/a.jpg", "https://www.taoke.com"), "https://cdn.example/a.jpg")

    def test_video_order_status_mapping_defaults_to_paid_only(self):
        from data_trans_lib.legacy import map_video_order_status

        paid = map_video_order_status(3)
        skipped = map_video_order_status(0)

        self.assertEqual(paid.order_status, 1)
        self.assertEqual(paid.payment_status, 1)
        self.assertTrue(paid.create_payment)
        self.assertTrue(paid.create_enrollment)
        self.assertIsNone(skipped)

    def test_legacy_import_remark_is_traceable(self):
        from data_trans_lib.legacy import legacy_import_remark

        self.assertEqual(
            legacy_import_remark("video-order", {"order_code": "A001", "status": 3}),
            "[legacy-import][video-order][order_code=A001][status=3]",
        )


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run RED test**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_data_trans_lib -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'data_trans_lib'`.

---

### Task 3: Shared Library, GREEN Implementation

**Files:**
- Create: `data-trans/scripts/data_trans_lib/__init__.py`
- Create: `data-trans/scripts/data_trans_lib/db.py`
- Create: `data-trans/scripts/data_trans_lib/ident.py`
- Create: `data-trans/scripts/data_trans_lib/legacy.py`
- Create: `data-trans/scripts/data_trans_lib/runtime.py`

- [ ] **Step 1: Implement SQL identifier helper**

Create `data-trans/scripts/data_trans_lib/ident.py`:

```python
from __future__ import annotations

import re


SAFE_IDENT_RE = re.compile(r"^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?$")


def quote_ident(value: str) -> str:
    if not SAFE_IDENT_RE.match(value):
        raise ValueError(f"unsafe SQL identifier: {value}")
    return ".".join(f"`{part}`" for part in value.split("."))
```

- [ ] **Step 2: Implement DB helper**

Create `data-trans/scripts/data_trans_lib/db.py`:

```python
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
        "database": (parsed.path or "/").lstrip("/") or None,
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
```

- [ ] **Step 3: Implement legacy normalization helper**

Create `data-trans/scripts/data_trans_lib/legacy.py`:

```python
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from urllib.parse import urljoin


LEGACY_MARKER = "[legacy-import]"


@dataclass(frozen=True)
class OrderStatusMapping:
    order_status: int
    payment_status: int | None
    enrollment_status: int | None
    create_payment: bool
    create_enrollment: bool


def normalize_int(value: object, default: int = 0) -> int:
    if value is None or value == "":
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def normalize_bool(value: object, default: int = 0) -> int:
    return 1 if normalize_int(value, default) == 1 else 0


def normalize_money(value: object, *, cents: bool = False) -> Decimal:
    if value is None or value == "":
        amount = Decimal("0")
    else:
        amount = Decimal(str(value))
    if cents:
        amount = amount / Decimal("100")
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def normalize_datetime(value: object) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, (int, float)) or str(value).isdigit():
        seconds = int(value)
        if seconds <= 0:
            return None
        return datetime.fromtimestamp(seconds)
    text = str(value).strip()
    for pattern in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, pattern)
        except ValueError:
            pass
    return None


def normalize_asset_url(raw: object, base_url: str) -> str:
    if not isinstance(raw, str):
        return ""
    value = raw.strip()
    if not value:
        return ""
    if value.startswith("//"):
        return "https:" + value
    if value.startswith(("http://", "https://")):
        return value
    return urljoin(base_url.rstrip("/") + "/", value.lstrip("/"))


def map_video_order_status(status: object) -> OrderStatusMapping | None:
    legacy = normalize_int(status, default=-999)
    if legacy == 3:
        return OrderStatusMapping(1, 1, 1, True, True)
    return None


def legacy_import_remark(domain: str, attrs: dict[str, object]) -> str:
    suffix = "".join(f"[{key}={value}]" for key, value in attrs.items())
    return f"{LEGACY_MARKER}[{domain}]{suffix}"
```

- [ ] **Step 4: Implement runtime helper**

Create `data-trans/scripts/data_trans_lib/runtime.py`:

```python
from __future__ import annotations

import argparse
import os
from dataclasses import dataclass, field
from typing import Iterable


@dataclass
class RunStats:
    scanned: int = 0
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    skip_reasons: dict[str, int] = field(default_factory=dict)

    def skip(self, reason: str) -> None:
        self.skipped += 1
        self.skip_reasons[reason] = self.skip_reasons.get(reason, 0) + 1


def add_common_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--source-dsn", default=os.getenv("OLD_MYSQL_DSN") or os.getenv("SOURCE_MYSQL_DSN"))
    parser.add_argument("--target-dsn", default=os.getenv("TARGET_MYSQL_DSN") or os.getenv("NEW_MYSQL_DSN"))
    parser.add_argument("--legacy-db", default=os.getenv("LEGACY_MYSQL_DATABASE", "taoke"))
    parser.add_argument("--asset-base-url", default=os.getenv("LEGACY_ASSET_BASE_URL", "https://www.taoke.com"))
    parser.add_argument("--batch-size", type=int, default=500)
    parser.add_argument("--dry-run", action="store_true", default=True)
    parser.add_argument("--apply", action="store_true")


def ensure_write_mode(args: argparse.Namespace) -> bool:
    return bool(getattr(args, "apply", False))


def chunks(items: list, size: int) -> Iterable[list]:
    for index in range(0, len(items), size):
        yield items[index : index + size]


def print_summary(name: str, stats: RunStats) -> None:
    print(f"{name}: scanned={stats.scanned} inserted={stats.inserted} updated={stats.updated} skipped={stats.skipped}")
    for reason, count in sorted(stats.skip_reasons.items()):
        print(f"  skip[{reason}]={count}")
```

- [ ] **Step 5: Create package marker**

Create `data-trans/scripts/data_trans_lib/__init__.py`:

```python
"""Shared helpers for data-trans migration scripts."""
```

- [ ] **Step 6: Run GREEN test**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_data_trans_lib -v
```

Expected: PASS, 7 tests.

- [ ] **Step 7: Commit**

Run:

```powershell
git add data-trans/scripts/data_trans_lib data-trans/tests/test_data_trans_lib.py
git commit -m "feat(data-trans): add shared migration helpers"
```

Expected: commit succeeds with shared helpers and tests.

---

### Task 4: Trainer Category Backfill

**Files:**
- Create: `data-trans/tests/test_trainer_fields_backfill.py`
- Create: `data-trans/scripts/run_trainer_fields_backfill.py`

- [ ] **Step 1: Write failing test**

Create `data-trans/tests/test_trainer_fields_backfill.py`:

```python
import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script():
    path = SCRIPTS / "run_trainer_fields_backfill.py"
    spec = importlib.util.spec_from_file_location("run_trainer_fields_backfill", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class TrainerFieldsBackfillTest(unittest.TestCase):
    def test_relation_rows_map_old_names_to_target_categories(self):
        module = load_script()
        trainers = {101, 102}
        source_rows = [
            {"uid": 101, "cid": 11, "subcid": 12, "priority": 2, "name": "Leadership"},
            {"uid": 102, "cid": 13, "subcid": 0, "priority": 1, "name": "Finance"},
            {"uid": 999, "cid": 14, "subcid": 0, "priority": 1, "name": "Missing trainer"},
        ]
        category_by_name = {"Leadership": 501, "Finance": 502}

        rows, skipped = module.build_category_relation_rows(source_rows, trainers, category_by_name)

        self.assertEqual(
            rows,
            [
                {"trainer_id": 101, "category_id": 501, "sort_order": 2},
                {"trainer_id": 102, "category_id": 502, "sort_order": 1},
            ],
        )
        self.assertEqual(skipped, {"missing_trainer": 1})


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run RED test**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_trainer_fields_backfill -v
```

Expected: FAIL because `run_trainer_fields_backfill.py` does not exist.

- [ ] **Step 3: Implement pure mapping and CLI defaults**

Create `data-trans/scripts/run_trainer_fields_backfill.py` with these public functions and arguments:

```python
def build_category_relation_rows(source_rows: list[dict], trainer_ids: set[int], category_by_name: dict[str, int]):
    rows = []
    skipped = {}
    for row in source_rows:
        trainer_id = int(row.get("uid") or 0)
        if trainer_id not in trainer_ids:
            skipped["missing_trainer"] = skipped.get("missing_trainer", 0) + 1
            continue
        name = str(row.get("name") or "").strip()
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
```

CLI defaults:

```text
--source-cate-relation-table taoke.tk_membercate_relation
--source-industry-relation-table taoke.tk_membergood_relation
--source-cate-table taoke.tk_cate
--source-trade-table taoke.tk_trade
--target-trainer-table user_trainers
--target-category-table sys_categories
--target-expertise-table trainer_expertise_categories
--target-industry-table trainer_industry_categories
```

Write relation rows with `INSERT IGNORE INTO target_table (trainer_id, category_id, sort_order, created_at, updated_at) VALUES (%s, %s, %s, NOW(), NOW())`.

- [ ] **Step 4: Run GREEN test and help check**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_trainer_fields_backfill -v
uv run python data-trans/scripts/run_trainer_fields_backfill.py --help
```

Expected: unittest PASS; help prints the default table flags and `--apply`.

- [ ] **Step 5: Commit**

Run:

```powershell
git add data-trans/scripts/run_trainer_fields_backfill.py data-trans/tests/test_trainer_fields_backfill.py
git commit -m "feat(data-trans): restore trainer category backfill"
```

Expected: commit succeeds with only trainer script and test.

---

### Task 5: Video Package Migration

**Files:**
- Create: `data-trans/tests/test_video_package_migrate.py`
- Create: `data-trans/scripts/run_video_package_migrate.py`

- [ ] **Step 1: Write failing test**

Create `data-trans/tests/test_video_package_migrate.py`:

```python
import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script():
    path = SCRIPTS / "run_video_package_migrate.py"
    spec = importlib.util.spec_from_file_location("run_video_package_migrate", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class VideoPackageMigrateTest(unittest.TestCase):
    def test_topic_item_builds_label_and_series_group(self):
        module = load_script()
        item = {
            "id": 42,
            "topic_id": 7,
            "item_parent": 0,
            "item_name": "Sales Series",
            "item_index": 3,
            "type": 1,
            "serial_index": 2,
            "price": "99",
            "company_price": "299",
            "package": "PXB-SALES",
            "descr": "desc",
            "cover": "attachments/video/c.jpg",
            "disabled": 0,
        }

        label = module.build_label_row(item, "https://www.taoke.com")
        group = module.build_series_group_row(item, video_count=5, asset_base_url="https://www.taoke.com")

        self.assertEqual(label["id"], 42)
        self.assertEqual(label["name"], "Sales Series")
        self.assertEqual(group["package_id"], 7)
        self.assertEqual(group["topic_id"], 42)
        self.assertEqual(group["parent_id"], 0)
        self.assertEqual(group["video_count"], 5)
        self.assertEqual(group["cover"], "https://www.taoke.com/attachments/video/c.jpg")

    def test_relation_row_uses_legacy_package_keys(self):
        module = load_script()
        relation = {"videoId": 1001, "packageId": 7, "topicId": 42, "parentId": 0, "is_first": 1, "serial": 8}

        row = module.build_relation_row(relation)

        self.assertEqual(row["video_id"], 1001)
        self.assertEqual(row["package_id"], 7)
        self.assertEqual(row["topic_id"], 42)
        self.assertEqual(row["parent_id"], 0)
        self.assertEqual(row["is_primary"], 1)
        self.assertEqual(row["sort_order"], 8)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run RED test**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_package_migrate -v
```

Expected: FAIL because `run_video_package_migrate.py` does not exist.

- [ ] **Step 3: Implement script**

Create `data-trans/scripts/run_video_package_migrate.py` with these public functions and field rules:

```python
def build_label_row(item: dict, asset_base_url: str) -> dict:
    return {
        "id": normalize_int(item.get("id")),
        "name": str(item.get("item_name") or item.get("name") or "").strip(),
        "topic_id": normalize_int(item.get("topic_id")),
        "item_parent": normalize_int(item.get("item_parent")),
        "item_index": normalize_int(item.get("item_index")),
        "type": normalize_int(item.get("type")),
        "serial_index": normalize_int(item.get("serial_index")),
        "price": normalize_int(item.get("price")),
        "company_price": normalize_money(item.get("company_price")),
        "disabled": normalize_int(item.get("disabled")),
        "topic_name": str(item.get("topic_name") or "").strip(),
        "package_code": str(item.get("package") or item.get("package_code") or "").strip(),
        "descr": item.get("descr"),
        "cover": normalize_asset_url(item.get("cover"), asset_base_url),
    }


def build_topic_group_row(topic: dict) -> dict:
    return {
        "package_id": normalize_int(topic.get("id")),
        "topic_id": 0,
        "parent_id": 0,
        "name": str(topic.get("topic_name") or "").strip(),
        "price": normalize_money(topic.get("price")),
        "company_price": normalize_money(topic.get("company_price") or topic.get("rebate_price")),
        "max_purchase_qty": normalize_int(topic.get("max_purchase_qty"), 20),
        "video_count": 0,
        "type": 0,
        "serial_index": 0,
        "item_index": 0,
        "package_code": str(topic.get("package") or "").strip(),
        "descr": topic.get("descr"),
        "cover": normalize_asset_url(topic.get("cover"), "https://www.taoke.com"),
        "is_open": normalize_int(topic.get("is_open"), 1),
    }


def build_series_group_row(item: dict, video_count: int, asset_base_url: str) -> dict:
    label = build_label_row(item, asset_base_url)
    return {
        "package_id": label["topic_id"],
        "topic_id": label["id"],
        "parent_id": label["item_parent"],
        "name": label["name"],
        "price": normalize_money(item.get("price")),
        "company_price": label["company_price"],
        "max_purchase_qty": normalize_int(item.get("max_purchase_qty"), 20),
        "video_count": video_count,
        "type": label["type"],
        "serial_index": label["serial_index"],
        "item_index": label["item_index"],
        "package_code": label["package_code"],
        "descr": label["descr"],
        "cover": label["cover"],
        "is_open": 1,
    }


def build_relation_row(relation: dict) -> dict:
    return {
        "video_id": normalize_int(relation.get("videoId")),
        "package_id": normalize_int(relation.get("packageId")),
        "topic_id": normalize_int(relation.get("topicId")),
        "parent_id": normalize_int(relation.get("parentId")),
        "is_primary": normalize_int(relation.get("is_first")),
        "sort_order": normalize_int(relation.get("serial")),
    }
```

Use these source table defaults:

```text
--source-topic-table taoke.tk_video_topic
--source-item-table taoke.tk_video_topic_item
--source-relation-table taoke.tk_video_package_relation
--target-label-table video_package_labels
--target-group-table video_package_groups
--target-relation-table video_package_relations
--target-video-table videos
```

Write strategy:

```sql
INSERT INTO video_package_labels
  (id, name, topic_id, item_parent, item_index, type, serial_index, price, company_price,
   disabled, topic_name, package_code, descr, cover, created_at, updated_at)
VALUES
  (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  updated_at = NOW()
```

```sql
INSERT INTO video_package_groups
  (package_id, topic_id, parent_id, name, price, company_price, max_purchase_qty,
   video_count, type, serial_index, item_index, package_code, descr, cover, is_open,
   created_at, updated_at)
VALUES
  (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  price = VALUES(price),
  company_price = VALUES(company_price),
  video_count = VALUES(video_count),
  updated_at = NOW()
```

```sql
INSERT INTO video_package_relations
  (video_id, package_id, topic_id, parent_id, is_primary, sort_order, created_at, updated_at)
VALUES
  (%s, %s, %s, %s, %s, %s, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  is_primary = VALUES(is_primary),
  sort_order = VALUES(sort_order),
  updated_at = NOW()
```

- [ ] **Step 4: Run GREEN test and help check**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_package_migrate -v
uv run python data-trans/scripts/run_video_package_migrate.py --help
```

Expected: unittest PASS; help prints source/target table flags and `--apply`.

- [ ] **Step 5: Commit**

Run:

```powershell
git add data-trans/scripts/run_video_package_migrate.py data-trans/tests/test_video_package_migrate.py
git commit -m "feat(data-trans): restore video package migration"
```

Expected: commit succeeds with only package script and test.

---

### Task 6: Video Supplier Migration

**Files:**
- Create: `data-trans/tests/test_video_supplier_migrate.py`
- Create: `data-trans/scripts/run_video_supplier_migrate.py`

- [ ] **Step 1: Write failing test**

Create `data-trans/tests/test_video_supplier_migrate.py`:

```python
import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script():
    path = SCRIPTS / "run_video_supplier_migrate.py"
    spec = importlib.util.spec_from_file_location("run_video_supplier_migrate", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class VideoSupplierMigrateTest(unittest.TestCase):
    def test_supplier_row_prefers_company_name_then_username(self):
        module = load_script()
        topic = {"uid": 88, "topic_name": "Package A"}
        member = {"company": "Acme Training", "username": "acme"}

        row = module.build_supplier_row(topic, member)

        self.assertEqual(row["user_id"], 88)
        self.assertEqual(row["company_name"], "Acme Training")
        self.assertEqual(row["member_type"], "TRAINING_ORG")
        self.assertEqual(row["enabled"], 1)

    def test_category_video_row_preserves_sort_order(self):
        module = load_script()

        row = module.build_category_video_row(supplier_id=3, category_id=42, relation={"videoId": 1001, "serial": 9})

        self.assertEqual(row, {"supplier_id": 3, "category_id": 42, "video_id": 1001, "sort_order": 9})


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run RED test**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_supplier_migrate -v
```

Expected: FAIL because `run_video_supplier_migrate.py` does not exist.

- [ ] **Step 3: Implement script**

Create `data-trans/scripts/run_video_supplier_migrate.py` with these public functions and field rules:

```python
def build_supplier_row(topic: dict, member: dict) -> dict:
    company_name = str(member.get("company") or member.get("username") or topic.get("topic_name") or "").strip()
    return {
        "user_id": normalize_int(topic.get("uid")),
        "company_name": company_name,
        "member_type": "TRAINING_ORG",
        "enabled": 1,
    }


def build_supplier_category_row(supplier_id: int, item: dict, asset_base_url: str) -> dict:
    return {
        "supplier_id": supplier_id,
        "parent_id": normalize_int(item.get("item_parent")),
        "name": str(item.get("item_name") or "").strip(),
        "sort_order": normalize_int(item.get("item_index")),
        "total_price": normalize_money(item.get("price")),
        "discount_rate": normalize_money(item.get("discount"), cents=False) if item.get("discount") not in (None, "") else normalize_money(100),
        "enabled": 0 if normalize_int(item.get("disabled")) == 1 else 1,
    }


def build_category_video_row(supplier_id: int, category_id: int, relation: dict) -> dict:
    return {
        "supplier_id": supplier_id,
        "category_id": category_id,
        "video_id": normalize_int(relation.get("videoId")),
        "sort_order": normalize_int(relation.get("serial")),
    }
```

Use these source table defaults:

```text
--source-topic-table taoke.tk_video_topic
--source-item-table taoke.tk_video_topic_item
--source-relation-table taoke.tk_video_package_relation
--source-member-table taoke.tk_member
--target-supplier-table video_suppliers
--target-category-table video_supplier_categories
--target-category-video-table video_supplier_category_videos
```

Use `INSERT INTO video_suppliers (user_id, company_name, member_type, enabled, created_at, updated_at) VALUES (%s, %s, %s, %s, NOW(), NOW()) ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), enabled = VALUES(enabled), updated_at = NOW()` for `video_suppliers` on `uk_video_suppliers_user`; use `INSERT IGNORE INTO video_supplier_category_videos (supplier_id, category_id, video_id, sort_order, created_at, updated_at) VALUES (%s, %s, %s, %s, NOW(), NOW())` for `video_supplier_category_videos` on `uk_supplier_category_video`.

- [ ] **Step 4: Run GREEN test and help check**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_supplier_migrate -v
uv run python data-trans/scripts/run_video_supplier_migrate.py --help
```

Expected: unittest PASS; help prints supplier table flags and `--apply`.

- [ ] **Step 5: Commit**

Run:

```powershell
git add data-trans/scripts/run_video_supplier_migrate.py data-trans/tests/test_video_supplier_migrate.py
git commit -m "feat(data-trans): restore video supplier migration"
```

Expected: commit succeeds with only supplier script and test.

---

### Task 7: Video Order Migration

**Files:**
- Create: `data-trans/tests/test_video_order_migrate.py`
- Create: `data-trans/scripts/run_video_order_migrate.py`

- [ ] **Step 1: Write failing test**

Create `data-trans/tests/test_video_order_migrate.py`:

```python
import importlib.util
import sys
import unittest
from decimal import Decimal
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script():
    path = SCRIPTS / "run_video_order_migrate.py"
    spec = importlib.util.spec_from_file_location("run_video_order_migrate", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class VideoOrderMigrateTest(unittest.TestCase):
    def test_paid_order_builds_order_item_payment_and_enrollment(self):
        module = load_script()
        order = {
            "id": 1,
            "order_code": "O100",
            "uid": 88,
            "total": "120.00",
            "status": 3,
            "createtime": 1700000000,
            "paytime": 1700000100,
            "endtime": 0,
        }
        detail = {
            "video_id": 2001,
            "video_title": "Course A",
            "video_price": "120.00",
            "concurrency": 2,
            "v_type": 1,
        }

        bundle = module.build_paid_order_bundle(order, [detail])

        self.assertEqual(bundle.order["order_no"], "O100")
        self.assertEqual(bundle.order["status"], 1)
        self.assertEqual(bundle.order["pay_amount"], Decimal("120.00"))
        self.assertEqual(bundle.items[0]["product_type"], "VIDEO_COURSE")
        self.assertEqual(bundle.payment["status"], 1)
        self.assertEqual(bundle.enrollments[0]["video_id"], 2001)
        self.assertEqual(bundle.enrollments[0]["status"], 1)

    def test_unpaid_order_is_skipped_by_default(self):
        module = load_script()

        self.assertIsNone(module.build_paid_order_bundle({"status": 0}, []))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run RED test**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_order_migrate -v
```

Expected: FAIL because `run_video_order_migrate.py` does not exist.

- [ ] **Step 3: Implement script**

Create `data-trans/scripts/run_video_order_migrate.py` with public API:

```python
from dataclasses import dataclass


@dataclass
class OrderBundle:
    order: dict
    items: list[dict]
    payment: dict | None
    enrollments: list[dict]


def product_type_for_detail(detail: dict) -> str:
    return "VIDEO_PACKAGE" if str(detail.get("v_type") or "").upper() in {"2", "PACKAGE"} else "VIDEO_COURSE"


def build_paid_order_bundle(order: dict, details: list[dict]) -> OrderBundle | None:
    mapping = map_video_order_status(order.get("status"))
    if mapping is None:
        return None
    order_no = str(order.get("order_code") or "").strip()
    total = normalize_money(order.get("total"))
    paid_at = normalize_datetime(order.get("paytime"))
    created_at = normalize_datetime(order.get("createtime")) or datetime.now()
    order_row = {
        "order_no": order_no,
        "user_id": normalize_int(order.get("uid")),
        "total_amount": total,
        "pay_amount": total,
        "status": mapping.order_status,
        "remark": legacy_import_remark("video-order", {"order_code": order_no, "status": order.get("status")}),
        "paid_at": paid_at,
        "expired_at": normalize_datetime(order.get("endtime")),
        "legacy_status": normalize_int(order.get("status")),
        "created_at": created_at,
        "updated_at": created_at,
    }
    item_rows = [
        {
            "product_type": product_type_for_detail(detail),
            "product_id": normalize_int(detail.get("video_id")),
            "product_title": str(detail.get("video_title") or "").strip(),
            "product_cover": "",
            "price": normalize_money(detail.get("video_price")),
            "quantity": 1,
            "subtotal": normalize_money(detail.get("video_price")),
            "created_at": created_at,
            "updated_at": created_at,
        }
        for detail in details
    ]
    payment_row = {
        "payment_no": ("LV" + order_no)[0:32],
        "order_no": order_no,
        "user_id": order_row["user_id"],
        "amount": total,
        "method": "MOCK",
        "status": mapping.payment_status,
        "trade_no": str(order.get("trade_code") or ""),
        "paid_at": paid_at,
        "created_at": created_at,
        "updated_at": created_at,
    }
    enrollment_rows = [
        {
            "video_id": normalize_int(detail.get("video_id")),
            "user_id": order_row["user_id"],
            "price_paid": normalize_money(detail.get("video_price")),
            "enrolled_at": paid_at or created_at,
            "expired_at": normalize_datetime(order.get("endtime")),
            "status": mapping.enrollment_status,
            "created_at": created_at,
            "updated_at": created_at,
        }
        for detail in details
    ]
    return OrderBundle(order_row, item_rows, payment_row, enrollment_rows)
```

Use these source table defaults:

```text
--source-order-table taoke.tk_video_order
--source-detail-table taoke.tk_video_order_detail
--source-basic-table taoke.video_order_basic
--target-order-table orders
--target-item-table order_items
--target-payment-table payments
--target-enrollment-table video_enrollments
--target-video-table videos
--target-user-table sys_users
```

Required write behavior:

```text
orders.order_no = legacy order_code
orders.status = 1 for legacy status=3
orders.legacy_status = legacy status
orders.remark = [legacy-import][video-order][order_code=<order_code>][status=<legacy_status>]
order_items.product_type = VIDEO_COURSE or VIDEO_PACKAGE
payments.payment_no = "LV" + order_no truncated to 30 characters when needed
video_enrollments unique gate = (video_id, user_id)
```

- [ ] **Step 4: Run GREEN test and help check**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_order_migrate -v
uv run python data-trans/scripts/run_video_order_migrate.py --help
```

Expected: unittest PASS; help prints order table flags, `--only-status 3`, and `--apply`.

- [ ] **Step 5: Commit**

Run:

```powershell
git add data-trans/scripts/run_video_order_migrate.py data-trans/tests/test_video_order_migrate.py
git commit -m "feat(data-trans): restore video order migration"
```

Expected: commit succeeds with only order script and test.

---

### Task 8: Video Comment Migration

**Files:**
- Create: `data-trans/tests/test_video_comment_migrate.py`
- Create: `data-trans/scripts/run_video_comment_migrate.py`

- [ ] **Step 1: Write failing test**

Create `data-trans/tests/test_video_comment_migrate.py`:

```python
import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script():
    path = SCRIPTS / "run_video_comment_migrate.py"
    spec = importlib.util.spec_from_file_location("run_video_comment_migrate", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class VideoCommentMigrateTest(unittest.TestCase):
    def test_comment_row_clamps_rating_and_sets_audit_status(self):
        module = load_script()
        row = {"vid": 1001, "uid": 88, "username": "alice", "content": "good", "star": 9, "del": 0, "createtime": 1700000000}

        mapped = module.build_comment_row(row)

        self.assertEqual(mapped["video_id"], 1001)
        self.assertEqual(mapped["user_id"], 88)
        self.assertEqual(mapped["user_name"], "alice")
        self.assertEqual(mapped["rating"], 5)
        self.assertEqual(mapped["visible"], 1)
        self.assertEqual(mapped["audit_status"], 1)

    def test_orphan_comment_is_skipped(self):
        module = load_script()

        reason = module.comment_skip_reason({"vid": 0, "uid": 88}, existing_video_ids={1001}, existing_user_ids={88})

        self.assertEqual(reason, "missing_video")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run RED test**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_comment_migrate -v
```

Expected: FAIL because `run_video_comment_migrate.py` does not exist.

- [ ] **Step 3: Implement script**

Create `data-trans/scripts/run_video_comment_migrate.py` with these public functions and field rules:

```python
def clamp_rating(value: object) -> int:
    rating = normalize_int(value, default=5)
    return min(5, max(1, rating))


def build_comment_row(row: dict) -> dict:
    created_at = normalize_datetime(row.get("createtime")) or datetime.now()
    visible = 0 if normalize_int(row.get("del")) == 1 else 1
    return {
        "video_id": normalize_int(row.get("vid")),
        "user_id": normalize_int(row.get("uid")),
        "user_name": str(row.get("username") or row.get("nickname") or "").strip(),
        "content": str(row.get("content") or "").strip(),
        "rating": clamp_rating(row.get("star") or row.get("rating")),
        "audit_status": 1 if visible == 1 else 2,
        "reject_reason": "",
        "visible": visible,
        "created_at": created_at,
        "updated_at": created_at,
    }


def comment_skip_reason(row: dict, existing_video_ids: set[int], existing_user_ids: set[int]) -> str | None:
    video_id = normalize_int(row.get("vid"))
    user_id = normalize_int(row.get("uid"))
    if video_id <= 0 or video_id not in existing_video_ids:
        return "missing_video"
    if user_id > 0 and user_id not in existing_user_ids:
        return "missing_user"
    if not str(row.get("content") or "").strip():
        return "empty_content"
    return None
```

Use these source table defaults:

```text
--source-comment-table taoke.tk_video_comment
--source-member-table taoke.tk_member
--target-comment-table video_comments
--target-video-table videos
--target-user-table sys_users
```

Use idempotency check:

```sql
SELECT id FROM video_comments
WHERE video_id = %s AND user_id = %s AND created_at = %s AND LEFT(content, 255) = LEFT(%s, 255)
LIMIT 1
```

- [ ] **Step 4: Run GREEN test and help check**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_comment_migrate -v
uv run python data-trans/scripts/run_video_comment_migrate.py --help
```

Expected: unittest PASS; help prints comment table flags and `--apply`.

- [ ] **Step 5: Commit**

Run:

```powershell
git add data-trans/scripts/run_video_comment_migrate.py data-trans/tests/test_video_comment_migrate.py
git commit -m "feat(data-trans): restore video comment migration"
```

Expected: commit succeeds with only comment script and test.

---

### Task 9: Video Audit and Verification Scripts

**Files:**
- Create: `data-trans/tests/test_video_audit_and_rollback.py`
- Create: `data-trans/scripts/_audit_video_migration_gaps.py`
- Create: `data-trans/scripts/_audit_video_migration_verify.py`

- [ ] **Step 1: Write failing tests for audit section definitions**

Create the audit part of `data-trans/tests/test_video_audit_and_rollback.py`:

```python
import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script(name):
    path = SCRIPTS / name
    spec = importlib.util.spec_from_file_location(name.replace(".py", ""), path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class VideoAuditScriptTest(unittest.TestCase):
    def test_gap_audit_sections_are_read_only(self):
        module = load_script("_audit_video_migration_gaps.py")

        sections = module.build_gap_queries("taoke")

        self.assertEqual(
            sorted(sections),
            [
                "comments_orphan",
                "orders_paid_missing",
                "packages_missing",
                "suppliers_missing",
                "videos_missing",
            ],
        )
        for sql in sections.values():
            self.assertNotIn("INSERT", sql.upper())
            self.assertNotIn("UPDATE", sql.upper())
            self.assertNotIn("DELETE", sql.upper())

    def test_verify_sections_include_legacy_markers(self):
        module = load_script("_audit_video_migration_verify.py")

        sections = module.build_verify_queries("taoke")

        self.assertIn("orders_legacy_imported", sections)
        self.assertIn("[legacy-import]", sections["orders_legacy_imported"])
```

- [ ] **Step 2: Run RED tests**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_audit_and_rollback.VideoAuditScriptTest -v
```

Expected: FAIL because audit scripts do not exist.

- [ ] **Step 3: Implement gap audit**

Create `_audit_video_migration_gaps.py` with:

```python
def build_gap_queries(legacy_db: str) -> dict[str, str]:
    db = quote_ident(legacy_db)
    return {
        "videos_missing": f"SELECT COUNT(*) AS count FROM {db}.`tk_video` lv LEFT JOIN videos v ON v.id = lv.id WHERE v.id IS NULL",
        "packages_missing": f"SELECT COUNT(*) AS count FROM {db}.`tk_video_package_relation` r LEFT JOIN video_package_relations vr ON vr.video_id = r.videoId AND vr.package_id = r.packageId AND vr.topic_id = r.topicId WHERE vr.id IS NULL",
        "suppliers_missing": "SELECT COUNT(*) AS count FROM video_package_groups g LEFT JOIN video_suppliers s ON s.user_id > 0 WHERE s.id IS NULL",
        "orders_paid_missing": f"SELECT COUNT(*) AS count FROM {db}.`tk_video_order` o LEFT JOIN orders no ON no.order_no = o.order_code WHERE o.status = 3 AND no.id IS NULL",
        "comments_orphan": f"SELECT COUNT(*) AS count FROM {db}.`tk_video_comment` c LEFT JOIN videos v ON v.id = c.vid LEFT JOIN sys_users u ON u.id = c.uid WHERE c.del = 0 AND c.vid > 0 AND (v.id IS NULL OR u.id IS NULL)",
    }
```

CLI output:

```text
section=<name> count=<count>
```

- [ ] **Step 4: Implement verify audit**

Create `_audit_video_migration_verify.py` with:

```python
def build_verify_queries(legacy_db: str) -> dict[str, str]:
    db = quote_ident(legacy_db)
    return {
        "orders_legacy_imported": "SELECT COUNT(*) AS count FROM orders WHERE remark LIKE '%[legacy-import][video-order]%'",
        "payments_for_legacy_orders": "SELECT COUNT(*) AS count FROM payments p INNER JOIN orders o ON o.id = p.order_id WHERE o.remark LIKE '%[legacy-import][video-order]%'",
        "enrollments_for_legacy_orders": "SELECT COUNT(*) AS count FROM video_enrollments e INNER JOIN orders o ON o.id = e.order_id WHERE o.remark LIKE '%[legacy-import][video-order]%'",
        "package_relations": f"SELECT COUNT(*) AS count FROM video_package_relations vr INNER JOIN {db}.`tk_video_package_relation` r ON r.videoId = vr.video_id AND r.packageId = vr.package_id AND r.topicId = vr.topic_id",
        "visible_comments": "SELECT COUNT(*) AS count FROM video_comments WHERE visible = 1 AND audit_status = 1",
    }
```

Return nonzero only when a query execution raises or an explicit `--require-zero-gaps` section reports a positive count.

- [ ] **Step 5: Run GREEN tests and help checks**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_audit_and_rollback.VideoAuditScriptTest -v
uv run python data-trans/scripts/_audit_video_migration_gaps.py --help
uv run python data-trans/scripts/_audit_video_migration_verify.py --help
```

Expected: unittest PASS; both scripts print `--legacy-db` and `--target-dsn`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add data-trans/scripts/_audit_video_migration_gaps.py data-trans/scripts/_audit_video_migration_verify.py data-trans/tests/test_video_audit_and_rollback.py
git commit -m "feat(data-trans): restore video migration audits"
```

Expected: commit succeeds with audit scripts and tests.

---

### Task 10: Rollback Script

**Files:**
- Modify: `data-trans/tests/test_video_audit_and_rollback.py`
- Create: `data-trans/scripts/_rollback_video_migration.py`

- [ ] **Step 1: Add failing rollback test**

Append this test class to `data-trans/tests/test_video_audit_and_rollback.py`:

```python
class VideoRollbackScriptTest(unittest.TestCase):
    def test_order_rollback_sql_deletes_children_before_orders(self):
        module = load_script("_rollback_video_migration.py")

        statements = module.build_order_rollback_sql()

        self.assertEqual(
            [statement.split()[2] for statement in statements],
            ["video_enrollments", "payments", "order_items", "orders"],
        )
        self.assertIn("[legacy-import][video-order]", statements[-1])

    def test_packages_domain_requires_explicit_domain(self):
        module = load_script("_rollback_video_migration.py")

        self.assertEqual(module.parse_domains("orders,comments"), {"orders", "comments"})
        with self.assertRaises(ValueError):
            module.parse_domains("")
```

- [ ] **Step 2: Run RED test**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_audit_and_rollback.VideoRollbackScriptTest -v
```

Expected: FAIL because `_rollback_video_migration.py` does not exist.

- [ ] **Step 3: Implement rollback script**

Create `data-trans/scripts/_rollback_video_migration.py` with public functions:

```python
VALID_DOMAINS = {"orders", "comments", "packages", "suppliers"}


def parse_domains(raw: str) -> set[str]:
    values = {item.strip() for item in raw.split(",") if item.strip()}
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
```

CLI requirements:

```text
--domain orders,comments,packages,suppliers
--dry-run default
--apply required for DELETE
```

Use delete order:

```text
orders: video_enrollments -> payments -> order_items -> orders
comments: only rows matching legacy source heuristic selected by existing legacy comment table join
packages: video_package_relations -> video_package_groups -> video_package_labels
suppliers: video_supplier_category_videos -> video_supplier_categories -> video_suppliers
```

- [ ] **Step 4: Run GREEN test and help check**

Run:

```powershell
uv run python -m unittest data-trans.tests.test_video_audit_and_rollback.VideoRollbackScriptTest -v
uv run python data-trans/scripts/_rollback_video_migration.py --help
```

Expected: unittest PASS; help prints `--domain`, `--dry-run`, and `--apply`.

- [ ] **Step 5: Commit**

Run:

```powershell
git add data-trans/scripts/_rollback_video_migration.py data-trans/tests/test_video_audit_and_rollback.py
git commit -m "feat(data-trans): restore legacy rollback script"
```

Expected: commit succeeds with rollback script and updated tests.

---

### Task 11: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run all Python tests**

Run:

```powershell
uv run python -m unittest discover -s data-trans/tests -p "test_*.py" -v
```

Expected: all tests PASS.

- [ ] **Step 2: Run all restored script help commands**

Run:

```powershell
uv run python data-trans/scripts/run_trainer_fields_backfill.py --help
uv run python data-trans/scripts/_audit_video_migration_gaps.py --help
uv run python data-trans/scripts/run_video_package_migrate.py --help
uv run python data-trans/scripts/run_video_supplier_migrate.py --help
uv run python data-trans/scripts/run_video_order_migrate.py --help
uv run python data-trans/scripts/run_video_comment_migrate.py --help
uv run python data-trans/scripts/_audit_video_migration_verify.py --help
uv run python data-trans/scripts/_rollback_video_migration.py --help
```

Expected: every command exits 0 and shows `--dry-run` or an audit-only description.

- [ ] **Step 3: Confirm ignored outputs remain ignored**

Run:

```powershell
git status --short --ignored data-trans
```

Expected: recovered scripts and tests are tracked or staged; `data-trans/output/`, `data-trans/logs/`, and local repair scripts remain ignored unless already tracked intentionally.

- [ ] **Step 4: Final commit if verification required small fixes**

Run only when Step 1 or Step 2 required follow-up edits:

```powershell
git add data-trans .gitignore
git commit -m "fix(data-trans): polish recovered migration scripts"
```

Expected: commit succeeds only if files changed after previous commits.
