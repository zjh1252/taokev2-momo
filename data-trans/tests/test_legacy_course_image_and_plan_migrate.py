import importlib.util
import sys
import unittest
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


class LegacyCourseImageAndPlanMigrateTest(unittest.TestCase):
    def test_course_image_row_normalizes_url(self):
        module = load_script("run_legacy_course_images_migrate.py")

        row = module.build_image_row({"id": 13, "cid": 4257, "pic": "attachments/course/4257/a.jpg", "up_time": 0}, "https://www.taoke.com")

        self.assertEqual(row["id"], 13)
        self.assertEqual(row["course_id"], 4257)
        self.assertEqual(row["image_url"], "https://www.taoke.com/attachments/course/4257/a.jpg")
        self.assertEqual(row["image_type"], "DETAIL")

    def test_course_plan_row_uses_legacy_course_id_as_sort_order(self):
        module = load_script("run_legacy_course_plans_migrate.py")

        row = module.build_plan_row(
            {
                "id": 81,
                "cid": 4257,
                "begin": 0,
                "finish": 0,
                "province": 9,
                "city": 9,
                "address": "",
                "modified": 1720000000,
            }
        )

        self.assertEqual(row["course_id"], 4257)
        self.assertEqual(row["sort_order"], 81)
        self.assertEqual(row["province_id"], 9)
        self.assertEqual(row["city_id"], 9)
        self.assertEqual(row["online_url"], "")


if __name__ == "__main__":
    unittest.main()
