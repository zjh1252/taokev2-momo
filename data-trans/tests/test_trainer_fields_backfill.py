import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))


def load_script():
    path = SCRIPTS / "run_trainer_fields_backfill.py"
    spec = importlib.util.spec_from_file_location("run_trainer_fields_backfill", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class TrainerFieldsBackfillTest(unittest.TestCase):
    def test_relation_rows_map_old_names_to_target_categories(self):
        module = load_script()
        trainers = {101, 102}
        source_rows = [
            {"uid": 101, "cid": 11, "subcid": 12, "priority": 2, "name": "Leadership"},
            {"uid": 102, "cid": 13, "subcid": 0, "priority": 1, "name": "Finance"},
            {"uid": 999, "cid": 14, "subcid": 0, "priority": 1, "name": "Missing trainer"},
        ]
        category_by_name = {"Leadership": 501, "Finance": 502}

        rows, skipped = module.build_category_relation_rows(source_rows, trainers, category_by_name)

        self.assertEqual(
            rows,
            [
                {"trainer_id": 101, "category_id": 501, "sort_order": 2},
                {"trainer_id": 102, "category_id": 502, "sort_order": 1},
            ],
        )
        self.assertEqual(skipped, {"missing_trainer": 1})


if __name__ == "__main__":
    unittest.main()
