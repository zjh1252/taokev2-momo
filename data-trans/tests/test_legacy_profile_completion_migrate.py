import importlib.util
import sys
import unittest
from datetime import date, datetime
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


class LegacyTrainerProfileCompletionMigrateTest(unittest.TestCase):
    def test_work_row_maps_legacy_certification_status_and_file(self):
        module = load_script("run_legacy_trainer_work_experiences_migrate.py")

        row = module.build_work_row(
            {
                "wk_id": 1,
                "uid": 963781,
                "wk_startdate": "2014-08-11",
                "wk_enddate": "2018-07-03",
                "wk_company": "Acme Training",
                "wk_position": "Director",
                "wk_caimg": "/attachments/member/vwork/2018/07/a.jpg",
                "status": 1,
                "wk_approvetime": 1531381289,
                "wk_approvememo": "",
                "createtime": "2018-07-03 08:43:40",
                "updatetime": "2018-07-12 07:41:29",
            },
            "https://www.taoke.com",
        )

        self.assertEqual(row["trainer_id"], 963781)
        self.assertEqual(row["company_name"], "Acme Training")
        self.assertEqual(row["start_date"], date(2014, 8, 11))
        self.assertEqual(row["end_date"], date(2018, 7, 3))
        self.assertEqual(row["status"], 2)
        self.assertEqual(row["proof_file"], "https://www.taoke.com/attachments/member/vwork/2018/07/a.jpg")
        self.assertIsInstance(row["audited_at"], datetime)

    def test_book_row_matches_current_legacy_book_shape(self):
        module = load_script("run_legacy_trainer_books_migrate.py")

        row = module.build_book_row(
            {
                "id": 15,
                "title": "OEC Management",
                "cover": "attachments/book/201502/origin/20150206142440_740.jpg",
                "thumb": "attachments/book/201502/20150206142440_740.jpg",
                "press": "China Economy Press",
                "pubdate": "2005-05-01",
                "linkurl": "http://example.com/book",
                "details": "",
                "uid": 582332,
                "realname": "Yang",
                "createtime": 1423203881,
                "updatetime": 1423203881,
            }
        )

        self.assertEqual(row["trainer_id"], 582332)
        self.assertEqual(row["title"], "OEC Management")
        self.assertIsNone(row["author_name"])
        self.assertEqual(row["cover_url"], "attachments/book/201502/origin/20150206142440_740.jpg")
        self.assertEqual(row["publisher"], "China Economy Press")
        self.assertEqual(row["publish_date"], date(2005, 5, 1))
        self.assertIsNone(row["description"])
        self.assertEqual(row["buy_url"], "http://example.com/book")
        self.assertEqual(row["sort_order"], 15)
        self.assertEqual(row["status"], 1)

    def test_book_row_falls_back_to_legacy_book_number_for_blank_title(self):
        module = load_script("run_legacy_trainer_books_migrate.py")

        row = module.build_book_row(
            {
                "id": 382,
                "title": None,
                "cover": "attachments/member_resource/202408/10/102/images/a.png",
                "thumb": "",
                "press": None,
                "pubdate": None,
                "linkurl": "",
                "details": "",
                "uid": 1129197,
                "createtime": 1723302177,
                "updatetime": 1723302444,
            }
        )

        self.assertEqual(row["title"], module.UNTITLED_BOOK_PREFIX + "382")
        self.assertEqual(row["publisher"], "")
        self.assertEqual(row["sort_order"], 0)


class LegacyVideoAdjacencyCompletionMigrateTest(unittest.TestCase):
    def test_video_cart_row_maps_legacy_cart_to_video_product(self):
        module = load_script("run_legacy_video_carts_migrate.py")

        row = module.build_cart_row(
            {
                "id": 14,
                "uid": 777649,
                "video_id": 13117,
                "video_title": "Structured Thinking",
                "video_price": "30.00",
                "concurrency": 3,
                "createtime": 1478757142,
            }
        )

        self.assertEqual(row["user_id"], 777649)
        self.assertEqual(row["product_type"], "VIDEO_COURSE")
        self.assertEqual(row["product_id"], 13117)
        self.assertEqual(row["product_title"], "Structured Thinking")
        self.assertEqual(row["product_cover"], "")
        self.assertEqual(row["price"], Decimal("30.00"))
        self.assertEqual(row["quantity"], 1)
        self.assertEqual(row["created_at"], datetime(2016, 11, 10, 5, 52, 22))

    def test_video_student_row_derives_from_active_enrollment(self):
        module = load_script("run_video_students_backfill.py")

        row = module.build_student_row(
            {
                "id": 35562,
                "video_id": 19226,
                "user_id": 1142199,
                "created_at": datetime(2026, 6, 10, 17, 32, 53),
                "updated_at": datetime(2026, 6, 10, 17, 32, 53),
            }
        )

        self.assertEqual(row["video_id"], 19226)
        self.assertEqual(row["user_id"], 1142199)
        self.assertEqual(row["enrollment_id"], 35562)
        self.assertEqual(row["progress"], 0)
        self.assertEqual(row["completed_chapters"], 0)
        self.assertIsNone(row["last_watched_at"])


class ProductionMigrationCompletionPipelineTest(unittest.TestCase):
    def test_build_steps_includes_completion_tables_in_order(self):
        module = load_script("run_production_migration.py")

        names = [step.name for step in module.build_steps("taoke", include_optional=False)]

        for name in (
            "trainer_work_experiences",
            "trainer_books",
            "video_carts",
            "video_students",
        ):
            self.assertIn(name, names)
        self.assertLess(names.index("trainers"), names.index("trainer_work_experiences"))
        self.assertLess(names.index("trainers"), names.index("trainer_books"))
        self.assertLess(names.index("videos"), names.index("video_carts"))
        self.assertLess(names.index("video_orders"), names.index("video_students"))


if __name__ == "__main__":
    unittest.main()
