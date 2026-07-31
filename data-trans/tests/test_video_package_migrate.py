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
