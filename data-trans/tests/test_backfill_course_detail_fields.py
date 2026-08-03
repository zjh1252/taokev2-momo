import importlib.util
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


def load_script():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "backfill_course_detail_fields.py"
    spec = importlib.util.spec_from_file_location("backfill_course_detail_fields", script_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class BackfillCourseDetailFieldsTest(unittest.TestCase):
    def test_default_source_is_legacy_coursedata(self):
        module = load_script()

        with patch.object(sys, "argv", ["backfill_course_detail_fields.py"]):
            args = module.parse_args()

        self.assertEqual(args.source_table, "taoke.tk_coursedata")
        self.assertEqual(args.source_id_column, "courseid")
        self.assertEqual(args.legacy_open_table, "taoke.tk_course")
        self.assertEqual(args.legacy_open_courseinfo_column, "cid")
        self.assertEqual(args.match_mode, "direct")
        self.assertEqual(args.resource_table, "taoke.tk_member_resource")
        self.assertEqual(args.resource_original_table, "taoke.tk_member_resource_original")
        self.assertEqual(args.source_resource_id_column, "file_resource_id")

    def test_target_ids_argument_is_optional(self):
        module = load_script()

        with patch.object(sys, "argv", ["backfill_course_detail_fields.py", "--target-ids", "277424,438831"]):
            args = module.parse_args()

        self.assertEqual(args.target_ids, "277424,438831")

    def test_legacy_coursedata_columns_map_to_v2_course_detail_fields(self):
        module = load_script()
        args = SimpleNamespace(
            intro_columns="intro,overview,content",
            summary_columns="abstract,overview,intro,content",
            syllabus_columns="outline",
            audience_columns="audiences",
            highlights_columns="income,feature",
        )
        source_cols = {
            "courseid",
            "intro",
            "overview",
            "content",
            "abstract",
            "outline",
            "audiences",
            "income",
            "feature",
        }

        columns = module.resolve_source_columns(source_cols, args)

        self.assertEqual(
            columns,
            {
                "intro": ["intro", "overview", "content"],
                "summary": ["abstract", "overview", "intro", "content"],
                "syllabus": ["outline"],
                "audience": ["audiences"],
                "highlights": ["income", "feature"],
            },
        )

    def test_material_url_prefers_legacy_pdf_path_and_normalizes_relative_path(self):
        module = load_script()
        row = {
            "res__pdf_path": "attachments/member_resource/202609/25/438831/course.pdf",
            "res__path": "attachments/member_resource/202609/25/438831/course.docx",
        }

        url = module.first_material_url(row, ["pdf_path", "path"], "https://www.taoke.com")

        self.assertEqual(
            url,
            "https://www.taoke.com/attachments/member_resource/202609/25/438831/course.pdf",
        )

    def test_material_text_prefers_edited_original_text(self):
        module = load_script()
        row = {
            "orig__edit_text": "  人工修订后的课程资料全文  ",
            "orig__text": "原始解析全文",
        }

        text = module.first_material_text(row, ["edit_text", "text", "content"])

        self.assertEqual(text, "人工修订后的课程资料全文")


if __name__ == "__main__":
    unittest.main()
