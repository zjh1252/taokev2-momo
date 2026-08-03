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
