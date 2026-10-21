"""Cross-design conservation and missing-date regression fixtures for the shared equations."""
import unittest
from .physics import water_step, crop_et_mm, pump_energy_kwh, pv_energy_kwh

MODEL_IDS=tuple(f"{p}{i:02d}" for p in ("SS","MS","CS") for i in range(1,6))

def daily_case(model_id, dates=("2026-07-01","2026-07-02","2026-07-03")):
    if model_id not in MODEL_IDS: raise ValueError("Unknown design")
    if not dates: raise ValueError("Missing forcing")
    from datetime import date
    parsed=[date.fromisoformat(d) for d in dates]
    if any((b-a).days!=1 for a,b in zip(parsed,parsed[1:])):
        raise ValueError("Missing or repeated daily forcing")
    storage=60.
    points=[]
    for day in dates:
        eto=4.
        et=crop_et_mm(eto,.85)
        rain=0.
        irrigation=max(0.,75-(storage+rain-et))
        step=water_step(storage,rain,irrigation,et,120.)
        pump=pump_energy_kwh(irrigation*10000/1000/.8,30,.6)
        pv=pv_energy_kwh(5.,1000.,.2,.8)
        points.append((day,step.residual_mm,step.storage_mm,pump,pv))
        storage=step.storage_mm
    return points

class DailyContractTests(unittest.TestCase):
    def test_all_15_models_reproducible_and_conservative(self):
        self.assertEqual(len(MODEL_IDS),15)
        for mid in MODEL_IDS:
            with self.subTest(mid=mid):
                a=daily_case(mid);b=daily_case(mid)
                self.assertEqual(a,b)
                self.assertTrue(all(abs(p[1])<1e-9 for p in a))
                self.assertTrue(all(p[3]>=0 and p[4]>=0 for p in a))
    def test_missing_day_rejected(self):
        with self.assertRaises(ValueError):
            daily_case("SS01",("2026-07-01","2026-07-03"))
    def test_duplicate_day_rejected(self):
        with self.assertRaises(ValueError):
            daily_case("MS02",("2026-07-01","2026-07-01"))
    def test_matched_comparison(self):
        left=daily_case("SS01")
        right=daily_case("CS05")
        self.assertEqual([x[0] for x in left],[x[0] for x in right])
    def test_invalid_model_rejected(self):
        with self.assertRaises(ValueError):daily_case("RT01")
