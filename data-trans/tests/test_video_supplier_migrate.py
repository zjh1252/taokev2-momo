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


if __name__ == "__main__":
    unittest.main()
