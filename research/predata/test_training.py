import unittest
from .synthetic import generate_bucket_cases
from .training import chronological_benchmark

class TestPipeline(unittest.TestCase):
    def test_reproducibility(self):
        self.assertEqual(generate_bucket_cases(30,42),generate_bucket_cases(30,42))
    def test_conservation(self):
        self.assertTrue(all(abs(r["mass_balance_residual_mm"])<1e-9 for r in generate_bucket_cases()))
    def test_chronological_holdout(self):
        rows=generate_bucket_cases()
        records=[(r["day"],[r["storage_start_mm"],r["precipitation_mm"],
                 r["irrigation_mm"],r["et_demand_mm"]],r["storage_end_mm"]) for r in rows]
        outcome=chronological_benchmark(records)
        self.assertEqual(outcome["train_n"],84)
        self.assertEqual(outcome["test_n"],36)
        self.assertEqual(outcome["validation_status"],"SYNTHETIC_OR_UNVERIFIED_DATA_ONLY")
if __name__=="__main__": unittest.main()
