import importlib.util
import sys
import unittest
from datetime import datetime
from decimal import Decimal
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script(name: str):
    path = SCRIPTS / name
    spec = importlib.util.spec_from_file_location(path.stem, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class LegacyCourseMasterMigrateTest(unittest.TestCase):
    def test_course_row_maps_courseinfo_to_current_courses_shape(self):
        module = load_script("run_legacy_courses_migrate.py")

        row = module.build_course_row(
            {
                "id": 4257,
                "title": "ISO 9000内审员培训",
                "cid": "512",
                "subcid": None,
                "legacy_type": "2",
                "toff": "24",
                "cdays": "4.0",
                "hour_every_day": "7",
                "organid": "30794",
                "tags": "ISO9000,内审员培训",
                "isopen": "1",
                "states": "1",
                "createtime": "1072713600",
                "causes": None,
                "modified": None,
                "lecturerid": "0",
                "lecturerid_type": "0",
                "detail_intro": None,
                "detail_overview": None,
                "detail_audiences": "学生与在职人员",
                "detail_income": "课程收益",
                "detail_feature": None,
                "detail_outline": "ISO 9000内审员",
                "detail_content": "",
                "detail_abstract": None,
                "publisher_groupid": "3",
                "plan_count": "0",
                "last_finish": None,
                "max_hit": "5107",
                "max_level": "3",
                "max_comments": "0",
                "max_isrecommend": "0",
                "min_price": None,
                "min_special_price": None,
            },
            trainer_ids=set(),
            institution_user_ids={30794},
            category_lookup={512: 186},
        )

        self.assertEqual(row["id"], 4257)
        self.assertEqual(row["type"], "INTERNAL")
        self.assertEqual(row["publisher_id"], 30794)
        self.assertEqual(row["publisher_type"], "INSTITUTION")
        self.assertEqual(row["category_id"], 186)
        self.assertEqual(row["duration_days"], 4)
        self.assertEqual(row["total_hours"], Decimal("28.0"))
        self.assertEqual(row["price"], Decimal("0.00"))
        self.assertEqual(row["is_free"], 1)
        self.assertEqual(row["status"], 2)
        self.assertEqual(row["view_count"], 5107)
        self.assertEqual(row["score"], Decimal("3.00"))
        self.assertEqual(row["created_at"], datetime(2003, 12, 29, 16, 0, 0))

    def test_course_row_uses_trainer_publisher_when_member_group_is_trainer(self):
        module = load_script("run_legacy_courses_migrate.py")

        publisher_type = module.map_publisher_type(
            {"organid": "30802", "publisher_groupid": "9"},
            trainer_ids={30802},
            institution_user_ids={30802},
        )

        self.assertEqual(publisher_type, "TRAINER")


class ProductionMigrationPipelineTest(unittest.TestCase):
    def test_build_steps_includes_core_course_master_before_plans(self):
        module = load_script("run_production_migration.py")

        names = [step.name for step in module.build_steps("taoke", include_optional=False)]

        self.assertIn("courses", names)
        self.assertIn("videos", names)
        self.assertIn("video_series_chapters", names)
        self.assertIn("video_packages", names)
        self.assertLess(names.index("courses"), names.index("course_plans"))
        self.assertLess(names.index("institutions"), names.index("courses"))
        self.assertLess(names.index("videos"), names.index("video_series_chapters"))
        self.assertLess(names.index("videos"), names.index("video_packages"))

    def test_build_steps_can_include_optional_video_adjacency(self):
        module = load_script("run_production_migration.py")

        names = [step.name for step in module.build_steps("taoke", include_optional=True)]

        self.assertIn("trainer_category_relations", names)
        self.assertIn("video_suppliers", names)
        self.assertIn("video_packages", names)


if __name__ == "__main__":
    unittest.main()
