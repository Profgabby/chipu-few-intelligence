import unittest
from dataclasses import replace
from chipu_oregon.fao56_coupled import CoupledDay, advance_coupled


class CoupledFAOTests(unittest.TestCase):
    def setUp(self):
        self.day = CoupledDay(40, 100, .5, 5, 20, 8, 4, .8, 1.2, .5, 2, 3, 3)

    def test_et_is_transpiration_plus_evaporation(self):
        result = advance_coupled(self.day)
        self.assertAlmostEqual(result["total_et_mm"],
                               result["transpiration_mm"] + result["soil_evaporation_mm"])

    def test_single_root_zone_balance(self):
        result = advance_coupled(self.day)
        self.assertAlmostEqual(result["conservation_residual_mm"], 0, places=10)

    def test_surface_is_nested(self):
        result = advance_coupled(self.day)
        self.assertEqual(result["accounting"], "surface_layer_is_nested_not_additive")

    def test_more_rain_reduces_depletion(self):
        a = advance_coupled(self.day)
        b = advance_coupled(replace(self.day, rain_mm=4))
        self.assertLess(b["root_zone"]["ending_depletion_mm"],
                        a["root_zone"]["ending_depletion_mm"])

    def test_surface_irrigation_bound(self):
        with self.assertRaises(ValueError):
            advance_coupled(replace(self.day, surface_irrigation_mm=4))
