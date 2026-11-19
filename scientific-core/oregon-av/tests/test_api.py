"""Smoke tests for the isolated Oregon Python API."""
import unittest
from fastapi.testclient import TestClient
from api.main import app

class TestOregonAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.json()["validated"])

    def test_models(self):
        r = self.client.get("/models")
        self.assertEqual(r.status_code, 200)
        self.assertIn("illustrative-coupled-few", r.json()["models"])

    def test_coupled_default(self):
        r = self.client.post("/simulate/coupled", json={})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["classification"], "synthetic_scenario_not_field_validated")
        self.assertIn("water", r.json())
        self.assertIn("pumping", r.json())

    def test_daily_csv_carries_water_state_and_summarizes(self):
        csv_data = (
            "date,irradiation_kwh_m2,et0_mm,rain_mm\\n"
            "2024-06-01,6.2,4.1,0\\n"
            "2024-06-02,6.0,3.8,1.5\\n"
        )
        response = self.client.post(
            "/simulate/dataset",
            files={"file": ("daily.csv", csv_data, "text/csv")},
            data={"panel_area_m2": "26.4", "pv_efficiency": "0.20", "pv_performance_ratio": "0.85"},
        )
        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertEqual(data["rows"], 2)
        self.assertAlmostEqual(
            data["daily"][1]["parameters"]["soil_initial_mm"],
            data["daily"][0]["water"]["ending_storage_mm"],
        )
        self.assertAlmostEqual(
            data["summary"]["pv_electricity_kwh"],
            sum(day["pv_electricity_kwh"] for day in data["daily"]),
        )

    def test_reject_unsorted_dates(self):
        csv_data = (
            "date,irradiation_kwh_m2,et0_mm,rain_mm\\n"
            "2024-06-02,6.0,3.8,0\\n"
            "2024-06-01,6.2,4.1,0\\n"
        )
        response = self.client.post("/simulate/dataset", files={"file": ("daily.csv", csv_data, "text/csv")})
        self.assertEqual(response.status_code, 422)

    def test_reject_invalid(self):
        r = self.client.post("/simulate/coupled", json={"ground_transmission": 1.5})
        self.assertEqual(r.status_code, 422)

if __name__ == "__main__":
    unittest.main()
