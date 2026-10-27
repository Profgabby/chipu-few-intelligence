"""Deterministic contract tests; do not claim live NASA POWER acquisition."""
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from ingest_nasa_power_daily import process, request_url, PARAMETERS

class TestWeatherIngestion(unittest.TestCase):
    def fixture(self, year=2024):
        from datetime import date, timedelta
        days=(date(year+1,1,1)-date(year,1,1)).days
        keys=[(date(year,1,1)+timedelta(days=i)).strftime("%Y%m%d") for i in range(days)]
        defaults={"T2M":10,"T2M_MAX":15,"T2M_MIN":5,"PRECTOTCORR":1,
                  "RH2M":60,"WS2M":2,"ALLSKY_SFC_SW_DWN":3}
        return {"properties":{"parameter":{k:{d:v for d in keys} for k,v in defaults.items()}}}
    def test_366_days_leap_year(self):
        report=process(json.dumps(self.fixture()).encode(),2024)
        self.assertEqual(report["days"],366)
        self.assertTrue(all(v["missing_days"]==0 for v in report["parameters"].values()))
    def test_missing_day_fails(self):
        d=self.fixture()
        d["properties"]["parameter"]["T2M"].pop("20240229")
        with self.assertRaises(ValueError):
            process(json.dumps(d).encode(),2024)
    def test_out_of_bounds_fails(self):
        d=self.fixture()
        d["properties"]["parameter"]["RH2M"]["20240229"]=130
        with self.assertRaises(ValueError):
            process(json.dumps(d).encode(),2024)
    def test_url_has_source_coordinates(self):
        url=request_url(44.63,-121.13,2024)
        self.assertIn("latitude=44.63",url)
        self.assertIn("start=20240101",url)
        self.assertIn("end=20241231",url)
        self.assertEqual(len(PARAMETERS),7)

if __name__=="__main__":
    unittest.main()
