import unittest
from chipu_oregon.baseline import Inputs, run


class BaselineTests(unittest.TestCase):
    def test_four_components_present(self):
        result = run(Inputs())
        for name in ("radiation", "photovoltaics", "crop_and_soil_water", "pumping"):
            self.assertIn(name, result)

    def test_root_zone_balance_closes(self):
        result = run(Inputs())
        self.assertAlmostEqual(result["crop_and_soil_water"]["balance_residual_mm"], 0.0, places=12)
        self.assertAlmostEqual(result["crop_and_soil_water"]["ending_root_zone_storage_mm"], 80.0)

    def test_pump_energy_scales_with_head(self):
        a = run(Inputs(total_dynamic_head_m=10))["pumping"]["electricity_kwh_day"]
        b = run(Inputs(total_dynamic_head_m=20))["pumping"]["electricity_kwh_day"]
        self.assertAlmostEqual(b, 2*a)

    def test_zero_irradiation_zero_pv(self):
        self.assertEqual(run(Inputs(daily_plane_irradiation_kwh_m2=0))["photovoltaics"]["electricity_kwh_day"], 0)

    def test_invalid_efficiency_rejected(self):
        with self.assertRaises(ValueError):
            run(Inputs(irrigation_efficiency=0))


if __name__ == "__main__":
    unittest.main()
