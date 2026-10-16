import unittest
from dataclasses import replace
from .model_lab import MODEL_IDS, OPEN_FIELD, ModelInputs, simulate, paired_comparison

def example(model_id):
    return ModelInputs(model_id=model_id,solar_irradiation_kwh_m2=5,
        transmitted_fraction=0.7 if model_id!=OPEN_FIELD else 1.,
        eto_mm=4,kc=0.85,rainfall_mm=0,starting_storage_mm=50,
        rootzone_capacity_mm=100,irrigation_mm=6,pv_area_m2=0 if model_id==OPEN_FIELD else 20,
        pv_efficiency=0.2,pv_performance_ratio=0.8,irrigated_area_m2=100,
        pump_head_m=12,pump_efficiency=0.6)

class ModelLabTests(unittest.TestCase):
    def test_every_model_uses_same_balance(self):
        self.assertEqual(len(MODEL_IDS),20)
        for model_id in MODEL_IDS:
            with self.subTest(model_id=model_id):
                r=simulate(example(model_id))
                self.assertAlmostEqual(r["water_balance_residual_mm"],0,places=10)
                self.assertGreaterEqual(r["pv_energy_kwh"],0)
    def test_control_has_no_pv(self):
        self.assertEqual(simulate(example(OPEN_FIELD))["pv_energy_kwh"],0)
    def test_paired_comparison(self):
        for model_id in MODEL_IDS:
            with self.subTest(model_id=model_id):
                r=paired_comparison(example(OPEN_FIELD),example(model_id))
                self.assertEqual(r["status"],"SCENARIO_COMPARISON_NOT_CAUSAL_EVIDENCE")
    def test_unknown_model_rejected(self):
        with self.assertRaises(ValueError):simulate(replace(example("SS01"),model_id="UNKNOWN"))
    def test_invalid_shading_rejected(self):
        with self.assertRaises(ValueError):simulate(replace(example("SS01"),transmitted_fraction=1.2))
    def test_no_fabricated_open_field_pv(self):
        with self.assertRaises(ValueError):simulate(replace(example(OPEN_FIELD),pv_area_m2=10))

if __name__=="__main__":unittest.main()
