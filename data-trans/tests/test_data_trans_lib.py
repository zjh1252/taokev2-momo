import sys
import unittest
from decimal import Decimal
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


class DataTransLibTest(unittest.TestCase):
    def test_safe_ident_quotes_single_and_schema_qualified_names(self):
        from data_trans_lib.ident import quote_ident

        self.assertEqual(quote_ident("courses"), "`courses`")
        self.assertEqual(quote_ident("taoke.tk_video"), "`taoke`.`tk_video`")

    def test_safe_ident_rejects_unsafe_names(self):
        from data_trans_lib.ident import quote_ident

        with self.assertRaises(ValueError):
            quote_ident("videos; DROP TABLE videos")

    def test_parse_mysql_dsn_keeps_credentials_and_charset(self):
        from data_trans_lib.db import parse_mysql_dsn

        cfg = parse_mysql_dsn("mysql://root:root@127.0.0.1:3307/v3test?charset=utf8mb4")

        self.assertEqual(cfg["host"], "127.0.0.1")
        self.assertEqual(cfg["port"], 3307)
        self.assertEqual(cfg["user"], "root")
        self.assertEqual(cfg["password"], "root")
        self.assertEqual(cfg["database"], "v3test")
        self.assertEqual(cfg["charset"], "utf8mb4")

    def test_money_and_id_normalization(self):
        from data_trans_lib.legacy import normalize_int, normalize_money

        self.assertEqual(normalize_money("12.345"), Decimal("12.35"))
        self.assertEqual(normalize_money(1200, cents=True), Decimal("12.00"))
        self.assertEqual(normalize_int(""), 0)
        self.assertEqual(normalize_int("17"), 17)

    def test_legacy_asset_urls(self):
        from data_trans_lib.legacy import normalize_asset_url

        self.assertEqual(normalize_asset_url("", "https://www.taoke.com"), "")
        self.assertEqual(
            normalize_asset_url("attachments/video/a.jpg", "https://www.taoke.com"),
            "https://www.taoke.com/attachments/video/a.jpg",
        )
        self.assertEqual(normalize_asset_url("//cdn.example/a.jpg", "https://www.taoke.com"), "https://cdn.example/a.jpg")

    def test_video_order_status_mapping_defaults_to_paid_only(self):
        from data_trans_lib.legacy import map_video_order_status

        paid = map_video_order_status(3)
        skipped = map_video_order_status(0)

        self.assertEqual(paid.order_status, 1)
        self.assertEqual(paid.payment_status, 1)
        self.assertTrue(paid.create_payment)
        self.assertTrue(paid.create_enrollment)
        self.assertIsNone(skipped)

    def test_legacy_import_remark_is_traceable(self):
        from data_trans_lib.legacy import legacy_import_remark

        self.assertEqual(
            legacy_import_remark("video-order", {"order_code": "A001", "status": 3}),
            "[legacy-import][video-order][order_code=A001][status=3]",
        )


if __name__ == "__main__":
    unittest.main()
