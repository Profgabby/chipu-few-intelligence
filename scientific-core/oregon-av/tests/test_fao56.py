import unittest
from chipu_oregon.fao56 import water_stress_coefficient, RootZoneDay, advance

class FAO56Tests(unittest.TestCase):
    def test_stress(self):
        self.assertAlmostEqual(water_stress_coefficient(70, 100, .4), .5)

    def test_no_stress(self):
        self.assertEqual(water_stress_coefficient(40, 100, .4), 1)

    def test_balance(self):
        result = advance(RootZoneDay(40, 100, .5, 4, .85, .15, 2, 3))
        self.assertAlmostEqual(result["ending_depletion_mm"], 39)
        self.assertAlmostEqual(result["balance_residual_mm"], 0)

    def test_drainage(self):
        result = advance(RootZoneDay(2, 100, .5, 0, .85, .15, 10, 0))
        self.assertAlmostEqual(result["deep_percolation_mm"], 8)

if __name__ == "__main__":
    unittest.main()
