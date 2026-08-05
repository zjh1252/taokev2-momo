import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script():
    path = SCRIPTS / "_audit_legacy_new_channel_coverage.py"
    spec = importlib.util.spec_from_file_location("_audit_legacy_new_channel_coverage", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class LegacyNewChannelCoverageAuditTest(unittest.TestCase):
    def test_split_insert_values_handles_commas_quotes_and_nulls(self):
        module = load_script()

        values = module.split_insert_values(
            "INSERT INTO `sample` VALUES (1, 'a,b', NULL, 'it\\'s ok', 'line\\\\n');\n"
        )

        self.assertEqual(values, ["1", "a,b", None, "it's ok", "line\\n"])

    def test_coverage_reports_missing_and_extra_samples(self):
        module = load_script()

        result = module.coverage({1, 2, 3}, {2, 3, 4})

        self.assertEqual(result["source"], 3)
        self.assertEqual(result["target"], 3)
        self.assertEqual(result["matched"], 2)
        self.assertEqual(result["missing"], 1)
        self.assertEqual(result["extra"], 1)
        self.assertEqual(result["coverage_percent"], 66.67)
        self.assertEqual(result["missing_sample"], [1])
        self.assertEqual(result["extra_sample"], [4])

    def test_table_row_maps_values_by_columns(self):
        module = load_script()

        row = module.table_row({"users": ["id", "name", "status"]}, "users", ["7", "Ada", "1"])

        self.assertEqual(row, {"id": "7", "name": "Ada", "status": "1"})

    def test_table_matrix_counts_and_flags_uncategorized_tables(self):
        module = load_script()

        with tempfile.TemporaryDirectory() as tmp:
            schema = Path(tmp) / "schema.sql"
            dump = Path(tmp) / "dump.sql"
            schema.write_text(
                "CREATE TABLE `sys_users` (`id` int);\n"
                "CREATE TABLE `unknown_table` (`id` int);\n",
                encoding="utf-8",
            )
            dump.write_text(
                "INSERT INTO `sys_users` VALUES (1);\n"
                "INSERT INTO `sys_users` VALUES (2);\n"
                "INSERT INTO `unknown_table` VALUES (1);\n",
                encoding="utf-8",
            )

            report = module.build_table_matrix(schema, dump, include_row_counts=True)

        rows = {row["table"]: row for row in report["tables"]}
        self.assertEqual(report["schema_table_count"], 2)
        self.assertEqual(rows["sys_users"]["category"], "migrated_from_old")
        self.assertEqual(rows["sys_users"]["target_rows"], 2)
        self.assertEqual(rows["unknown_table"]["category"], "uncategorized")
        self.assertEqual(rows["unknown_table"]["target_rows"], 1)
        self.assertEqual(report["uncategorized"], ["unknown_table"])


if __name__ == "__main__":
    unittest.main()
