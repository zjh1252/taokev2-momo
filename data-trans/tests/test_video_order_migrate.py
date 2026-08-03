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
