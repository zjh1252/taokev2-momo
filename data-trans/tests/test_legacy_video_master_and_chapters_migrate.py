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


class LegacyVideoMasterMigrateTest(unittest.TestCase):
    def test_build_video_row_maps_series_video_to_current_shape(self):
        module = load_script("run_legacy_videos_migrate.py")

        row = module.build_video_row(
            {
                "id": 6579,
                "uid": 731313,
                "title": "FineReport",
                "pic": "/attachments/video/cover.jpg",
                "intro": "intro",
                "url": "",
                "subcid": "626,,",
                "teacher": "Teacher",
                "video_price": "500",
                "company_price": "0",
                "tag": "报表,工具",
                "duration": "0",
                "legacy_series_count": "8",
                "view": "12",
                "score": "4.8",
                "isapprove": "1",
                "video_status": "1",
                "del": "0",
                "types": "1",
                "external_link": "0",
                "sort": "3",
                "v_type": "2",
                "createtime": "1440125379",
            },
            category_lookup={626: 205},
            relation_category_ids={},
            fallback_category_id=224,
            asset_base_url="https://www.taoke.com",
        )

        self.assertEqual(row["id"], 6579)
        self.assertEqual(row["publisher_type"], "TRAINER")
        self.assertEqual(row["trainer_id"], 731313)
        self.assertEqual(row["video_type"], "SERIES")
        self.assertEqual(row["category_id"], 205)
        self.assertEqual(row["price"], Decimal("500.00"))
        self.assertEqual(row["company_price"], Decimal("10000.00"))
        self.assertEqual(row["max_purchase_qty"], 0)
        self.assertEqual(row["original_price"], Decimal("500.00"))
        self.assertEqual(row["total_episodes"], 8)
        self.assertEqual(row["status"], 2)
        self.assertEqual(row["published_at"], datetime(2015, 8, 21, 2, 49, 39))

    def test_external_video_keeps_external_url_and_down_status(self):
        module = load_script("run_legacy_videos_migrate.py")

        row = module.build_video_row(
            {
                "id": 11,
                "uid": 533722,
                "title": "External",
                "pic": "/attachments/video/20120711151642_535.jpg",
                "intro": "",
                "url": "http://player.youku.com/player.php/sid/X/v.swf",
                "video_price": "0",
                "company_price": "0",
                "tag": "1",
                "duration": "660",
                "legacy_series_count": "0",
                "view": "1540",
                "score": "0",
                "isapprove": "1",
                "video_status": "1",
                "del": "1",
                "types": "0",
                "external_link": "1",
                "v_type": "2",
                "createtime": "1341991002",
            },
            category_lookup={},
            relation_category_ids={},
            fallback_category_id=224,
            asset_base_url="https://www.taoke.com",
        )

        self.assertEqual(row["video_type"], "EXTERNAL")
        self.assertEqual(row["video_url"], "")
        self.assertEqual(row["external_url"], "http://player.youku.com/player.php/sid/X/v.swf")
        self.assertEqual(row["cover_url"], "https://www.taoke.com/attachments/video/20120711151642_535.jpg")
        self.assertEqual(row["status"], 4)
        self.assertEqual(row["is_free"], 1)
        self.assertIsNotNone(row["published_at"])

    def test_play_url_normalization_matches_flyway_rules_for_md5(self):
        module = load_script("run_legacy_videos_migrate.py")

        url = module.normalize_play_url("d16ae025c94a266d58c8faf0558bb7b2", "https://www.taoke.com")

        self.assertEqual(url, "https://cdn5-pxb-videos.taoke.com/taoke/old-videos/videos/d16ae025c94a266d58c8faf0558bb7b2.mp4")


class LegacyVideoSeriesChapterMigrateTest(unittest.TestCase):
    def test_series_and_chapter_rows_map_legacy_series_row(self):
        module = load_script("run_legacy_video_series_chapters_migrate.py")
        source = {
            "id": 132,
            "video_id": 6579,
            "title": "",
            "description": "",
            "sortorder": 1,
            "url": None,
            "pic": None,
            "duration": 0,
            "preview": 0,
            "online_size": 0,
            "createtime": 1440125379,
            "updatetime": 1440125379,
        }

        series = module.build_series_row(source, "https://www.taoke.com")
        chapter = module.build_chapter_row(source, "https://www.taoke.com")

        self.assertEqual(series["id"], 132)
        self.assertEqual(series["title"], "未命名系列")
        self.assertEqual(chapter["title"], "小节")
        self.assertEqual(chapter["series_id"], 0)
        self.assertEqual(chapter["sort_order"], 1)

    def test_chapter_row_normalizes_legacy_md5_video_url(self):
        module = load_script("run_legacy_video_series_chapters_migrate.py")

        chapter = module.build_chapter_row(
            {
                "video_id": 6579,
                "title": "快速入门",
                "description": "desc",
                "sortorder": 2,
                "url": "d16ae025c94a266d58c8faf0558bb7b2",
                "pic": "",
                "duration": 543,
                "preview": 1,
                "online_size": 10946590,
                "createtime": 1440125379,
            },
            "https://www.taoke.com",
        )

        self.assertEqual(chapter["video_url"], "https://cdn5-pxb-videos.taoke.com/taoke/old-videos/videos/d16ae025c94a266d58c8faf0558bb7b2.mp4")
        self.assertEqual(chapter["is_preview"], 1)
        self.assertEqual(chapter["file_size"], 10946590)


if __name__ == "__main__":
    unittest.main()
