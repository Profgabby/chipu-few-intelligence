"""Physics regression checks only: artificial values are software test fixtures."""
import csv
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from fao56_daily_et0 import calculate,et0_day

class DailyET0Tests(unittest.TestCase):
    def test_reference_et_positive_and_finite(self):
        result=et0_day(date(2024,7,15),12,27,20,55,2,6.1,44.68,700)
        self.assertTrue(0<result<12)
    def test_solar_radiation_increases_et(self):
        args=(date(2024,7,15),12,27,20,55,2)
        self.assertGreater(et0_day(*args,7,44.68,700),et0_day(*args,4,44.68,700))
    def test_humidity_reduces_et(self):
        args=(date(2024,7,15),12,27,20)
        self.assertGreater(et0_day(*args,30,2,6.1,44.68,700),et0_day(*args,80,2,6.1,44.68,700))
    def test_bad_temperature_rejected(self):
        with self.assertRaises(ValueError):
            et0_day(date(2024,1,1),20,10,15,50,2,4,45,100)
    def test_unverified_wind_height_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"weather.csv"
            path.write_text("date,tmin_c,tmax_c,tmean_c,rh_pct,wind_m_s,solar_kwh_m2_day\n2024-01-01,0,10,5,60,2,3\n")
            with self.assertRaises(ValueError):
                calculate(path,44.68,700,10,2024)
    def test_missing_days_are_flagged_not_imputed(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"weather.csv"
            path.write_text("date,tmin_c,tmax_c,tmean_c,rh_pct,wind_m_s,solar_kwh_m2_day\n2024-01-01,0,10,5,60,2,3\n")
            result=calculate(path,44.68,700,2,2024)
            self.assertEqual(result["status"],"review_required")
            self.assertEqual(result["valid_days"],1)
            self.assertEqual(result["expected_days"],366)
if __name__=="__main__":unittest.main()
