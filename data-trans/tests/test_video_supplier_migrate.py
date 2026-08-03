import importlib.util
import sys
import unittest
from decimal import Decimal
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


class FakeCursor:
    def __init__(self, rows):
        self.rows = rows
        self.sql = ""
        self.params = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, sql, params=None):
        self.sql = sql
        self.params = params

    def fetchall(self):
        return self.rows


class FakeConnection:
    def __init__(self, rows):
        self.cursor_obj = FakeCursor(rows)

    def cursor(self):
        return self.cursor_obj


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

    def test_fetch_members_uses_legacy_member_id(self):
        module = load_script()
        conn = FakeConnection([{"id": 88, "company": "Acme Training"}])

        members = module.fetch_members_by_user_id(conn, "taoke.tk_member", [88], batch_size=500)

        self.assertIn("WHERE `id` IN", conn.cursor_obj.sql)
        self.assertNotIn("WHERE `uid` IN", conn.cursor_obj.sql)
        self.assertEqual(members[88]["company"], "Acme Training")

    def test_category_collision_guard_allows_rerun_and_flags_different_rows(self):
        module = load_script()
        desired = [
            {
                "id": 42,
                "supplier_id": 3,
                "parent_id": 0,
                "name": "Sales Series",
                "sort_order": 9,
                "total_price": Decimal("199.00"),
                "discount_rate": Decimal("100.00"),
                "enabled": 1,
            }
        ]

        self.assertEqual(module.detect_category_id_collisions(desired, desired), [])

        existing = [dict(desired[0], supplier_id=4, name="Manual Category")]

        self.assertEqual(module.detect_category_id_collisions(existing, desired), [42])

    def test_category_video_rows_validate_group_keys_and_target_videos(self):
        module = load_script()
        category_meta_by_id = {
            42: {"supplier_id": 3, "package_id": 7, "parent_id": 0, "enabled": 1},
        }
        relations = [
            {"videoId": 1001, "packageId": 7, "topicId": 42, "parentId": 0, "serial": 1},
            {"videoId": 1002, "packageId": 7, "topicId": 99, "parentId": 0, "serial": 2},
            {"videoId": 1003, "packageId": 8, "topicId": 42, "parentId": 0, "serial": 3},
            {"videoId": 1004, "packageId": 7, "topicId": 42, "parentId": 0, "serial": 4},
        ]

        rows, skipped = module.build_category_video_rows(
            relations,
            category_meta_by_id,
            target_video_ids={1001, 1002, 1003},
        )

        self.assertEqual(rows, [{"supplier_id": 3, "category_id": 42, "video_id": 1001, "sort_order": 1}])
        self.assertEqual(
            skipped,
            {
                "missing_category": 1,
                "package_group_mismatch": 1,
                "missing_target_video": 1,
            },
        )

    def test_category_rows_skip_child_when_parent_is_not_active(self):
        module = load_script()
        item_rows = [
            {"id": 42, "topic_id": 7, "item_parent": 0, "item_name": "Root", "item_index": 1},
            {"id": 43, "topic_id": 7, "item_parent": 99, "item_name": "Broken Child", "item_index": 2},
        ]

        rows, skipped = module.build_category_rows(
            item_rows,
            topic_user_ids={7: 88},
            supplier_ids_by_user_id={88: 3},
            asset_base_url="https://www.taoke.com",
        )

        self.assertEqual([row["id"] for row in rows], [42])
        self.assertEqual(skipped, {"missing_parent_category": 1})

    def test_migrate_filters_disabled_topics_and_items(self):
        module = load_script()
        fetch_calls = []

        def fake_fetch_all(conn, table, order_by, where=""):
            fetch_calls.append((table, where))
            return []

        module.fetch_all = fake_fetch_all
        module.fetch_members_by_user_id = lambda conn, table, user_ids, batch_size: {}
        module.fetch_target_video_ids = lambda conn, table: set()
        args = type(
            "Args",
            (),
            {
                "source_topic_table": "topics",
                "source_item_table": "items",
                "source_relation_table": "relations",
                "source_member_table": "members",
                "target_supplier_table": "suppliers",
                "target_category_table": "categories",
                "target_category_video_table": "category_videos",
                "target_video_table": "videos",
                "asset_base_url": "https://www.taoke.com",
                "batch_size": 500,
            },
        )()

        module.migrate(object(), object(), args, apply=False)

        self.assertIn(("topics", "COALESCE(`disabled`, 0) = 0"), fetch_calls)
        self.assertIn(("items", "COALESCE(`disabled`, 0) = 0"), fetch_calls)


if __name__ == "__main__":
    unittest.main()
