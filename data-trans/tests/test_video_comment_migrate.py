import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script():
    path = SCRIPTS / "run_video_comment_migrate.py"
    spec = importlib.util.spec_from_file_location("run_video_comment_migrate", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class VideoCommentMigrateTest(unittest.TestCase):
    def test_comment_row_clamps_rating_and_sets_audit_status(self):
        module = load_script()
        row = {
            "vid": 1001,
            "uid": 88,
            "username": "alice",
            "content": "good",
            "star": 9,
            "del": 0,
            "createtime": 1700000000,
        }

        mapped = module.build_comment_row(row)

        self.assertEqual(mapped["video_id"], 1001)
        self.assertEqual(mapped["user_id"], 88)
        self.assertEqual(mapped["user_name"], "alice")
        self.assertEqual(mapped["content"], "good")
        self.assertEqual(mapped["rating"], 5)
        self.assertEqual(mapped["visible"], 1)
        self.assertEqual(mapped["audit_status"], 1)

    def test_rejected_comment_is_hidden_and_rejected(self):
        module = load_script()

        mapped = module.build_comment_row({"vid": 1001, "uid": 88, "level": 0, "content": "bad", "isopen": -1})

        self.assertEqual(mapped["rating"], 1)
        self.assertEqual(mapped["visible"], 0)
        self.assertEqual(mapped["audit_status"], 2)

    def test_orphan_comment_is_skipped(self):
        module = load_script()

        reason = module.comment_skip_reason({"vid": 0, "uid": 88}, existing_video_ids={1001}, existing_user_ids={88})

        self.assertEqual(reason, "missing_video")

    def test_existing_comment_probe_uses_content_prefix(self):
        module = load_script()

        sql = module.existing_comment_probe_sql("video_comments")

        self.assertIn("LEFT(content, 255) = LEFT(%s, 255)", sql)
        self.assertIn("LIMIT 1", sql)


if __name__ == "__main__":
    unittest.main()
