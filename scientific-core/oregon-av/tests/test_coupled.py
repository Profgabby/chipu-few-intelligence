import unittest
from dataclasses import replace
from chipu_oregon.coupled import Scenario, simulate


class CoupledTests(unittest.TestCase):
    def test_four_component_outputs(self):
        r = simulate(Scenario())
        self.assertIn("ground_irradiation_kwh_m2", r)
        self.assertIn("pv_electricity_kwh", r)
        self.assertIn("water", r)
        self.assertIn("pumping", r)

    def test_balance(self):
        self.assertAlmostEqual(simulate(Scenario())["water"]["mass_balance_residual_mm"], 0)

    def test_pipe_length_affects_energy_not_pv(self):
        s = Scenario()
        a, b = simulate(s), simulate(replace(s, pipe_length_m=200))
        self.assertGreater(b["pumping"]["electricity_kwh"], a["pumping"]["electricity_kwh"])
        self.assertEqual(a["pv_electricity_kwh"], b["pv_electricity_kwh"])

    def test_shade_et_factor_affects_water_not_pv(self):
        s = Scenario()
        a, b = simulate(s), simulate(replace(s, shade_et_factor=.7))
        self.assertLess(b["water"]["et_mm"], a["water"]["et_mm"])
        self.assertEqual(a["pv_electricity_kwh"], b["pv_electricity_kwh"])


if __name__ == "__main__":
    unittest.main()
