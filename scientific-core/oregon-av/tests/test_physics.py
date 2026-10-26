import unittest
from chipu_oregon.physics import (ground_irradiation, pv_electricity_kwh,
    dual_kc_et_mm, root_zone_storage_mm, pumping_energy_kwh)


class PhysicsTests(unittest.TestCase):
    def test_ground_transmission(self):
        self.assertAlmostEqual(ground_irradiation(4, 0.65), 2.6)

    def test_pv_energy(self):
        self.assertAlmostEqual(pv_electricity_kwh(4, 10, .18, .8), 5.76)

    def test_dual_coefficient_identity(self):
        self.assertAlmostEqual(dual_kc_et_mm(4, .85, .15), 4.0)

    def test_stress_reduces_transpiration(self):
        self.assertLess(dual_kc_et_mm(4, .85, .15, .5), dual_kc_et_mm(4, .85, .15))

    def test_root_zone_mass_balance(self):
        self.assertAlmostEqual(root_zone_storage_mm(80, 2, 3, 4, 1), 80)

    def test_pump_energy(self):
        self.assertAlmostEqual(pumping_energy_kwh(1, 15, .5), 0.08175)

    def test_zero_volume(self):
        self.assertEqual(pumping_energy_kwh(0, 15, .5), 0)

    def test_invalid_efficiency(self):
        with self.assertRaises(ValueError):
            pumping_energy_kwh(1, 15, 0)


if __name__ == "__main__":
    unittest.main()
