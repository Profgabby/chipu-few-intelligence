import unittest
from chipu_oregon.water import WaterDay, step
from chipu_oregon.hydraulics import pipe_head_loss_m, pump_operating_point


class CoupledComponentTests(unittest.TestCase):
    def test_water_mass_balance(self):
        r = step(WaterDay(4, .85, .15, 1, 0, 5, .8, 80, 90))
        self.assertAlmostEqual(r["ending_storage_mm"], 80)
        self.assertAlmostEqual(r["mass_balance_residual_mm"], 0)

    def test_drainage_at_capacity(self):
        r = step(WaterDay(0, 0, 0, 1, 10, 0, .8, 90, 90))
        self.assertAlmostEqual(r["drainage_mm"], 10)
        self.assertAlmostEqual(r["ending_storage_mm"], 90)

    def test_impossible_et_rejected(self):
        with self.assertRaises(ValueError):
            step(WaterDay(10, 1, 0, 1, 0, 0, 1, 1, 90))

    def test_friction_increases_with_length(self):
        a = pipe_head_loss_m(.001, 10, .05)
        b = pipe_head_loss_m(.001, 20, .05)
        self.assertAlmostEqual(b, 2 * a)

    def test_pumping_more_than_static_only(self):
        r = pump_operating_point(1, .001, 10, 100, .05, .6)
        self.assertGreater(r["total_dynamic_head_m"], 10)
        self.assertGreater(r["electricity_kwh"], 0)

    def test_zero_flow_has_no_pipe_loss(self):
        self.assertEqual(pipe_head_loss_m(0, 100, .05), 0)


if __name__ == "__main__":
    unittest.main()
