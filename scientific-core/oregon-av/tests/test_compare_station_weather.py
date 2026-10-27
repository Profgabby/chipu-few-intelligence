"""Unit tests use synthetic *test fixtures* only; no empirical claims."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from compare_station_weather import compare, metrics
META={"station_id":"TEST","station_name":"Test fixture","latitude":44.6,
      "longitude":-121.1,"provider":"unit test","source_url":"https://example.org/test",
      "retrieved_utc":"2026-01-01T00:00:00Z","timezone":"America/Los_Angeles",
      "variable_methods":"unit-test-only"}
class ComparisonTests(unittest.TestCase):
    def test_error_metrics(self):
        result=metrics([(4,2),(1,2)])
        self.assertEqual(result["n"],2)
        self.assertAlmostEqual(result["bias"],0.5)
        self.assertAlmostEqual(result["mae"],1.5)
        self.assertAlmostEqual(result["rmse"],(2.5)**0.5)
    def test_date_alignment_and_missing_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            p=root/"power.json"; s=root/"station.csv"
            p.write_text(json.dumps({"properties":{"parameter":{
                "T2M":{"20240101":10,"20240102":20},
                "PRECTOTCORR":{"20240101":1,"20240102":-999},
                "ALLSKY_SFC_SW_DWN":{"20240101":2,"20240102":3}}}}))
            s.write_text("date,tmean_c,precip_mm,solar_kwh_m2_day\n2024-01-02,19,2,3\n2024-01-01,9,1,2\n")
            r=compare(p,s,META)
            self.assertEqual(r["variables"]["tmean_c"]["metrics"]["n"],2)
            self.assertAlmostEqual(r["variables"]["tmean_c"]["metrics"]["bias"],1)
            self.assertEqual(r["variables"]["precip_mm"]["metrics"]["n"],1)
            self.assertEqual(r["variables"]["precip_mm"]["omitted_rows"],1)
    def test_missing_provenance_rejected(self):
        with self.assertRaises(ValueError):
            compare(Path("missing"),Path("missing"),{})
if __name__=="__main__": unittest.main()
