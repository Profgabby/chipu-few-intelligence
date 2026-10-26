import unittest

try:
    import pandas as pd
    import pvlib
except ImportError:
    pd = None
    pvlib = None

from chipu_oregon.pvlib_engine import calculate_pv_dc


@unittest.skipUnless(pd is not None and pvlib is not None, "pvlib and pandas optional")
class PVLibIntegrationTests(unittest.TestCase):
    def test_nighttime_dc_is_zero(self):
        index = pd.date_range("2024-06-01 00:00", periods=1, freq="h", tz="America/Los_Angeles")
        weather = pd.DataFrame({"ghi": [0.], "dni": [0.], "dhi": [0.],
                                "temp_air": [15.], "wind_speed": [1.]}, index=index)
        result = calculate_pv_dc(weather, 45.3, -122.75, 25, 180, 1000)
        self.assertAlmostEqual(float(result["dc_power_w"].iloc[0]), 0.0, places=6)

    def test_naive_timestamps_rejected(self):
        index = pd.date_range("2024-06-01", periods=1)
        weather = pd.DataFrame({"ghi": [0.], "dni": [0.], "dhi": [0.],
                                "temp_air": [15.], "wind_speed": [1.]}, index=index)
        with self.assertRaises(ValueError):
            calculate_pv_dc(weather, 45.3, -122.75, 25, 180, 1000)
