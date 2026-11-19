"""Time-resolved irradiance and SVF numerical checks."""
import unittest
import numpy as np
from chipu_oregon.radiance_geometry import ArrayGeometry
from chipu_oregon.time_resolved_radiation import (
    sky_directions, sky_view_factor, integrate_ground_radiation)

class TestTimeResolvedRadiation(unittest.TestCase):
    def test_sky_quadrature_unit_norm(self):
        vectors=sky_directions(8,24)
        self.assertEqual(vectors.shape,(192,3))
        np.testing.assert_allclose(np.linalg.norm(vectors,axis=1),1,atol=1e-12)

    def test_unobstructed_sky(self):
        points=np.array([[0.,0.,0.]])
        triangles=np.empty((0,3,3))
        self.assertAlmostEqual(float(sky_view_factor(points,triangles)[0]),1.0)

    def test_energy_closure_without_panels_at_night(self):
        geometry=ArrayGeometry()
        result=integrate_ground_radiation(geometry,[{
            "solar_elevation_deg":-10,"solar_azimuth_deg":180,
            "dni_w_m2":0,"dhi_w_m2":0,"ghi_w_m2":0,"interval_hours":1
        }],grid_spacing_m=2,n_mu=2,n_az=4)
        self.assertEqual(result["ground_open_kwh_m2"],0)
        self.assertEqual(result["ground_av_kwh_m2_mean"],0)

    def test_irradiance_closure_rejects_inconsistent_components(self):
        with self.assertRaises(ValueError):
            integrate_ground_radiation(ArrayGeometry(),[{
                "solar_elevation_deg":45,"solar_azimuth_deg":180,
                "dni_w_m2":800,"dhi_w_m2":100,"ghi_w_m2":100,
                "interval_hours":1
            }],grid_spacing_m=2,n_mu=2,n_az=4)

if __name__=="__main__":
    unittest.main()
