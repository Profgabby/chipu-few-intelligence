"""FAO-56 (Allen et al. 1998) Chapter 4, Example 17 (Bangkok, April).

Intermediate values below are PUBLISHED rounded values, not synthetic data.
Reference result: ET0 = 5.72 mm/day. Because source intermediates are
rounded, acceptance tolerance is 0.03 mm/day.
"""
import unittest
from chipu_oregon.fao56_reference import reference_et_mm_day


class PublishedFAOExample17(unittest.TestCase):
    def test_bangkok_april_example17(self):
        et0 = reference_et_mm_day(
            delta_kpa_c=.246,
            net_radiation_mj_m2_day=14.33,
            soil_heat_flux_mj_m2_day=.14,
            gamma_kpa_c=.0674,
            mean_air_temp_c=30.2,
            wind_2m_m_s=2.,
            es_kpa=4.42,
            ea_kpa=2.85)
        self.assertAlmostEqual(et0, 5.72, delta=.03)

    def test_nonphysical_humidity_rejected(self):
        with self.assertRaises(ValueError):
            reference_et_mm_day(.246, 14.33, .14, .0674, 30.2, 2., 2.0, 3.0)
