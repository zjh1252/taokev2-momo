import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script(name):
    path = SCRIPTS / name
    spec = importlib.util.spec_from_file_location(name.replace(".py", ""), path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class VideoAuditScriptTest(unittest.TestCase):
    def test_gap_audit_sections_are_read_only(self):
        module = load_script("_audit_video_migration_gaps.py")

        sections = module.build_gap_queries("taoke")

        self.assertEqual(
            sorted(sections),
            [
                "comments_orphan",
                "orders_paid_missing",
                "packages_missing",
                "suppliers_missing",
                "videos_missing",
            ],
        )
        for sql in sections.values():
            self.assertTrue(sql.strip().upper().startswith("SELECT"))
            self.assertNotIn("INSERT", sql.upper())
            self.assertNotIn("UPDATE", sql.upper())
            self.assertNotIn("DELETE", sql.upper())

    def test_verify_sections_include_legacy_markers(self):
        module = load_script("_audit_video_migration_verify.py")

        sections = module.build_verify_queries("taoke")

        self.assertIn("orders_legacy_imported", sections)
        self.assertIn("[legacy-import]", sections["orders_legacy_imported"])


if __name__ == "__main__":
    unittest.main()
