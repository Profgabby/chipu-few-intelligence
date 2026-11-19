"""Regression tests for paired runs, geometric shading and local registry."""
import tempfile
import unittest
from pathlib import Path
from chipu_oregon.coupled import Scenario
from chipu_oregon.paired import DailyForcing, ground_transmission, paired_run
from chipu_oregon.radiance_geometry import ArrayGeometry
from chipu_oregon.registry import save_run, list_runs

class TestPaired(unittest.TestCase):
    def setUp(self):
        self.geometry = ArrayGeometry()
        self.forcing = [
            DailyForcing("2024-06-01", 6.0, 4.0, 0, 30, 180, 0.2),
            DailyForcing("2024-06-02", 5.5, 3.5, 1, 35, 195, 0.3),
        ]

    def test_transmission_is_bounded(self):
        result = ground_transmission(self.geometry, self.forcing[0])
        self.assertGreaterEqual(result["global_transmission"], 0)
        self.assertLessEqual(result["global_transmission"], 1)

    def test_paired_forcing_and_water_state(self):
        result = paired_run(self.geometry, Scenario(), self.forcing, 0.9)
        self.assertEqual(len(result["daily"]), 2)
        first, second = result["daily"]
        for treatment in ("open_field", "agrivoltaic"):
            self.assertAlmostEqual(
                second[treatment]["parameters"]["soil_initial_mm"],
                first[treatment]["water"]["ending_storage_mm"])
        self.assertAlmostEqual(result["summary"]["delta_et_mm"],
            result["summary"]["agrivoltaic_et_mm"] - result["summary"]["open_field_et_mm"])

    def test_reproducible_id_and_local_registry(self):
        a = paired_run(self.geometry, Scenario(), self.forcing)
        b = paired_run(self.geometry, Scenario(), self.forcing)
        self.assertEqual(a["run_id"], b["run_id"])
        with tempfile.TemporaryDirectory() as temp:
            record = save_run(temp, a, label="paired baseline")
            self.assertTrue(Path(record["path"]).exists())
            self.assertEqual(len(list_runs(temp)), 1)
            self.assertEqual(save_run(temp, a)["run_id"], a["run_id"])

    def test_unsorted_dates_rejected(self):
        with self.assertRaises(ValueError):
            paired_run(self.geometry, Scenario(), list(reversed(self.forcing)))

if __name__ == "__main__":
    unittest.main()
