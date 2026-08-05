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


class LegacyTrainingReviewMigrateTest(unittest.TestCase):
    def test_build_review_row_maps_legacy_comment_to_course_review(self):
        module = load_script("run_legacy_training_reviews_migrate.py")

        row = module.build_review_row(
            {
                "id": 1,
                "course_id": 210760,
                "order_id": 0,
                "course_title": "课程演绎及有效控场",
                "to_userid": 276407,
                "from_userid": 527824,
                "c_classmatch": 5,
                "c_teacherlevel": 4,
                "c_service": 3,
                "course_time": 1364918400,
                "appearing_day": "1.5",
                "from_user_company": "泛微",
                "province_name": "北京",
                "city_name": "北京市",
                "address": "北京市",
                "comment": "气场很足",
                "is_del": 0,
                "createtime": 1367167631,
                "updatetime": 1367167631,
                "status": 1,
                "is_show": 1,
                "is_anonymous": 0,
            },
            target_course_ids={210760},
            target_trainer_user_ids={276407},
            institution_id_by_user={},
            target_case_ids=set(),
            asset_base_url="https://www.taoke.com",
        )

        self.assertEqual(row["id"], 1)
        self.assertEqual(row["review_scope"], "COURSE")
        self.assertEqual(row["course_id"], 210760)
        self.assertEqual(row["trainer_user_id"], 276407)
        self.assertEqual(row["avg_score"], Decimal("4.00"))
        self.assertEqual(row["training_date"], date(2013, 4, 2))
        self.assertEqual(row["status"], 1)


class LegacyTrainerCaseMigrateTest(unittest.TestCase):
    def test_case_source_uses_case_chief_flag(self):
        module = load_script("run_legacy_trainer_cases_migrate.py")

        self.assertTrue(module.is_case_source({"is_case_chief": 1}))
        self.assertFalse(module.is_case_source({"is_case_chief": 0, "match_valid": 0, "match_review": 0}))

    def test_build_case_row_preserves_review_id(self):
        module = load_script("run_legacy_trainer_cases_migrate.py")

        row = module.build_case_row(
            {
                "id": 88,
                "to_userid": 276407,
                "course_title": "领导力训练",
                "from_user_company": "客户公司",
                "comment": "效果很好",
                "status": 1,
                "is_show": 1,
                "is_del": 0,
                "course_time": 1364918400,
                "createtime": 1367167631,
                "updatetime": 1367167631,
                "support_num": 9,
            },
            "https://www.taoke.com",
        )

        self.assertEqual(row["id"], 88)
        self.assertEqual(row["trainer_id"], 276407)
        self.assertEqual(row["case_title"], "领导力训练")
        self.assertEqual(row["enterprise_name"], "客户公司")
        self.assertEqual(row["training_date"], date(2013, 4, 2))
        self.assertEqual(row["status"], 1)


class LegacyDemandMigrateTest(unittest.TestCase):
    def test_company_demand_uses_disjoint_id_range(self):
        module = load_script("run_legacy_demands_migrate.py")

        row = module.build_company_demand_row(
            {
                "id": 2,
                "company_id": 554254,
                "company_name": "上海旦辰企业管理有限公司",
                "content": "测试数据",
                "realname": "邓永斌",
                "company": "上海淘课",
                "mobile": "13788937434",
                "createtime": 1352813457,
                "user_id": 0,
                "is_view": 1,
            },
            target_user_ids={554254},
            enterprise_id_by_user={554254: 9},
        )

        self.assertEqual(row["id"], 100000002)
        self.assertEqual(row["demand_no"], "XQCD00000002")
        self.assertEqual(row["user_id"], 554254)
        self.assertEqual(row["enterprise_id"], 9)
        self.assertEqual(row["status"], 2)


class LegacyOrgFindTrainerDemandMigrateTest(unittest.TestCase):
    def test_build_org_find_trainer_demand_uses_offset_and_trainer(self):
        module = load_script("run_legacy_org_find_trainer_demands_migrate.py")

        row = module.build_demand_row(
            {
                "id": 4,
                "uid": 601818,
                "title": "Sales management",
                "trainerid": 601831,
                "trainername": "Zhang",
                "traintime": 1410364800,
                "province": 37,
                "city": 371300,
                "ctime": 1410239964,
                "utime": 1412939398,
                "status": 4,
                "contact_company": "Buyer Co",
                "linkman": "Liu",
                "mobile": "13700000000",
                "tel": "021-11111111",
                "email": "buyer@example.com",
                "remarks": "urgent",
                "trainer_reject_reason": "",
            },
            target_user_ids={601818},
            trainer_user_ids={601831},
            enterprise_id_by_user={601818: 15},
        )

        self.assertEqual(row["id"], 200000004)
        self.assertEqual(row["demand_no"], "XQOFT00000004")
        self.assertEqual(row["user_id"], 601818)
        self.assertEqual(row["enterprise_id"], 15)
        self.assertEqual(row["source_trainer_id"], 601831)
        self.assertEqual(row["status"], 4)


class LegacyTrainerLeadMessageMigrateTest(unittest.TestCase):
    def test_build_lead_row_maps_legacy_advice_to_trainer_message(self):
        module = load_script("run_legacy_trainer_lead_messages_migrate.py")

        row = module.build_lead_row(
            {
                "id": 7,
                "title": "trainer page inquiry",
                "content": "Need leadership training",
                "realname": "Alice",
                "company": "ACME",
                "company_name": "Trainer Name",
                "mobile": "13800000000",
                "telephone": "021-12345678",
                "createtime": 1370377063,
                "user_id": 527824,
                "status": 1,
                "process_status": 0,
                "cs_status": 0,
                "province": 31,
                "city": 310000,
                "email": "a@example.com",
            },
            trainer_user_id=276407,
            target_user_ids={527824},
        )

        self.assertEqual(row["id"], 7)
        self.assertEqual(row["trainer_user_id"], 276407)
        self.assertEqual(row["training_topic"], "trainer page inquiry")
        self.assertEqual(row["training_goal"], "Need leadership training")
        self.assertEqual(row["contact_name"], "Alice")
        self.assertEqual(row["company_name"], "ACME")
        self.assertEqual(row["user_id"], 527824)
        self.assertEqual(row["status"], 1)

    def test_resolve_trainer_can_use_course_publisher(self):
        module = load_script("run_legacy_trainer_lead_messages_migrate.py")

        trainer_user_id = module.resolve_trainer_user_id(
            {"keyid": 210760, "company_id": 0},
            trainer_user_ids={276407},
            course_trainer_by_id={210760: 276407},
        )

        self.assertEqual(trainer_user_id, 276407)


class LegacyDemandFollowUpMigrateTest(unittest.TestCase):
    def test_build_follow_up_row_uses_disjoint_id_range(self):
        module = load_script("run_legacy_demand_follow_ups_migrate.py")

        row = module.build_follow_up_row(
            {
                "cid": 12,
                "title": "Need details",
                "username": "buyer",
                "uid": 527824,
                "content": "Please send the proposal",
                "ctime": 1330923990,
                "ifopen": 1,
                "is_del": 0,
            },
            demand_id=88,
            target_user_ids={527824},
        )

        self.assertEqual(row["id"], 200000012)
        self.assertEqual(row["demand_id"], 88)
        self.assertEqual(row["operator_id"], 527824)
        self.assertEqual(row["action"], "CONTACT_RECORD")
        self.assertIn("Please send the proposal", row["content"])
        self.assertEqual(row["new_status"], 2)


class LegacyProductionPipelineGapTest(unittest.TestCase):
    def test_production_steps_include_recovered_business_gaps(self):
        module = load_script("run_production_migration.py")

        names = [step.name for step in module.build_steps("taoke", include_optional=False)]

        for name in (
            "buyers",
            "trainer_honors",
            "trainer_work_experiences",
            "trainer_books",
            "trainer_cases",
            "trainer_lead_messages",
            "training_reviews",
            "demands",
            "org_find_trainer_demands",
            "demand_follow_ups",
            "course_orders",
            "course_enrollments",
            "favorites",
            "member_provider",
            "videos",
            "video_series_chapters",
            "video_carts",
            "video_orders",
            "video_students",
            "video_comments",
            "video_suppliers",
            "video_packages",
        ):
            self.assertIn(name, names)
        self.assertLess(names.index("trainer_cases"), names.index("training_reviews"))
        self.assertLess(names.index("demands"), names.index("demand_follow_ups"))
        self.assertLess(names.index("org_find_trainer_demands"), names.index("demand_follow_ups"))
        self.assertLess(names.index("videos"), names.index("video_series_chapters"))
        self.assertLess(names.index("videos"), names.index("video_carts"))
        self.assertLess(names.index("videos"), names.index("video_orders"))
        self.assertLess(names.index("video_orders"), names.index("video_students"))
        self.assertLess(names.index("videos"), names.index("video_comments"))
        self.assertLess(names.index("videos"), names.index("video_suppliers"))
        self.assertLess(names.index("videos"), names.index("video_packages"))
        self.assertLess(names.index("training_reviews"), names.index("post_fixups"))

    def test_production_step_scripts_exist(self):
        module = load_script("run_production_migration.py")

        missing = [
            step.script
            for step in module.build_steps("taoke", include_optional=False)
            if not (SCRIPTS / step.script).exists()
        ]

        self.assertEqual(missing, [])

    def test_schema_mode_defaults_to_flyway(self):
        module = load_script("run_production_migration.py")

        args = module.parse_args([])

        self.assertEqual(args.schema_mode, "flyway")
        self.assertTrue(str(args.schema_sql).endswith("data-trans\\v3test.sql") or str(args.schema_sql).endswith("data-trans/v3test.sql"))


if __name__ == "__main__":
    unittest.main()
