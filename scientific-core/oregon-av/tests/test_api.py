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

    def test_reject_invalid(self):
        r = self.client.post("/simulate/coupled", json={"ground_transmission": 1.5})
        self.assertEqual(r.status_code, 422)

if __name__ == "__main__":
    unittest.main()
