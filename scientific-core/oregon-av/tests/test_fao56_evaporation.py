import unittest
from chipu_oregon.fao56_evaporation import (
    total_evaporable_water, evaporation_reduction, evaporation_coefficient,
    SurfaceDay, advance_surface)


class EvaporationTests(unittest.TestCase):
    def test_tew_formula(self):
        self.assertAlmostEqual(total_evaporable_water(.30, .15, .10), 22.5)

    def test_stage_one(self):
        self.assertEqual(evaporation_reduction(5, 20, 8), 1)

    def test_stage_two(self):
        self.assertAlmostEqual(evaporation_reduction(14, 20, 8), .5)

    def test_exposed_wetted_fraction_limit(self):
        self.assertAlmostEqual(evaporation_coefficient(.8, 1.2, 1, .1), .12)

    def test_surface_wetting(self):
        result = advance_surface(SurfaceDay(10, 20, 8, .8, 1.2, .5, 4, 5))
        self.assertGreaterEqual(result["ending_surface_depletion_mm"], 0)
        self.assertLessEqual(result["ending_surface_depletion_mm"], 20)

    def test_unphysical_evaporation_rejected(self):
        with self.assertRaises(ValueError):
            advance_surface(SurfaceDay(19, 20, 8, 0, 1, 1, 100, 0))
