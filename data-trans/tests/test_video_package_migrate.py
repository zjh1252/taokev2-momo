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

    def test_upsert_sql_updates_migrated_metadata_on_rerun(self):
        module = load_script()

        label_sql = module.label_upsert_sql("video_package_labels")
        group_sql = module.group_upsert_sql("video_package_groups")
        relation_sql = module.relation_upsert_sql("video_package_relations")

        self.assertIn("cover = VALUES(cover)", label_sql)
        self.assertIn("topic_id = VALUES(topic_id)", label_sql)
        self.assertIn("is_open = VALUES(is_open)", group_sql)
        self.assertIn("package_code = VALUES(package_code)", group_sql)
        self.assertIn("parent_id = VALUES(parent_id)", relation_sql)

    def test_relation_rows_skip_missing_video_and_package_group_separately(self):
        module = load_script()
        source_rows = [
            {"videoId": 1001, "packageId": 7, "topicId": 42, "parentId": 0, "is_first": 1, "serial": 8},
            {"videoId": 9999, "packageId": 7, "topicId": 42, "parentId": 0, "is_first": 0, "serial": 9},
            {"videoId": 1002, "packageId": 7, "topicId": 43, "parentId": 0, "is_first": 0, "serial": 10},
        ]

        rows, skipped = module.build_relation_rows(
            source_rows,
            target_video_ids={1001, 1002},
            valid_group_keys={(7, 42, 0)},
        )

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["video_id"], 1001)
        self.assertEqual(skipped, {"missing_target_video": 1, "missing_package_group": 1})

    def test_group_keys_include_topic_headers_and_series_items(self):
        module = load_script()
        topic_rows = [{"id": 7}, {"id": "8"}]
        item_rows = [
            {"topic_id": 7, "id": 42, "item_parent": 0},
            {"topic_id": "7", "id": "43", "item_parent": "42"},
        ]

        keys = module.build_group_keys(topic_rows, item_rows)

        self.assertEqual(keys, {(7, 0, 0), (8, 0, 0), (7, 42, 0), (7, 43, 42)})

    def test_topic_group_cover_uses_asset_base_url(self):
        module = load_script()
        topic = {"id": 7, "topic_name": "Package A", "cover": "attachments/video/topic.jpg"}

        row = module.build_topic_group_row(topic, asset_base_url="https://assets.example.com")

        self.assertEqual(row["cover"], "https://assets.example.com/attachments/video/topic.jpg")


if __name__ == "__main__":
    unittest.main()
