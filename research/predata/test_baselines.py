import unittest
from .physics import water_step, crop_et_mm, pump_energy_kwh, pv_energy_kwh
from .statistics import metrics, monte_carlo_pump

class TestPredata(unittest.TestCase):
    def test_conservation(self):
        x=water_step(50,10,20,5,60)
        self.assertAlmostEqual(x.storage_mm,60)
        self.assertAlmostEqual(x.drainage_mm,15)
        self.assertAlmostEqual(x.residual_mm,0)
    def test_dry_soil(self):
        x=water_step(1,0,0,5,60)
        self.assertEqual(x.unmet_et_mm,4)
        self.assertEqual(x.storage_mm,0)
    def test_et(self):
        self.assertAlmostEqual(crop_et_mm(4,0.8),3.2)
    def test_pump(self):
        self.assertAlmostEqual(pump_energy_kwh(10,20,0.5),1.09,places=2)
    def test_pv(self):
        self.assertAlmostEqual(pv_energy_kwh(5,10,0.2,0.8),8)
    def test_metrics(self):
        self.assertEqual(metrics([1,2],[2,3])["bias"],1)
    def test_seeded_uncertainty(self):
        self.assertEqual(monte_carlo_pump(10,20,0.4,0.8,n=30),
                         monte_carlo_pump(10,20,0.4,0.8,n=30))
    def test_bad_efficiency(self):
        with self.assertRaises(ValueError): pump_energy_kwh(1,1,0)
if __name__=="__main__": unittest.main()
