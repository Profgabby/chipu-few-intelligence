"""Notebook-derived ray-tracing regression checks."""
import unittest
import numpy as np
from chipu_oregon.notebook_raytracing import (
    ray_triangle_intersection, trace_ground_shadows, build_array_triangles,
    raytraced_transmission,
)
from chipu_oregon.radiance_geometry import ArrayGeometry
from chipu_oregon.paired import DailyForcing, paired_run
from chipu_oregon.coupled import Scenario

class TestNotebookRayTracing(unittest.TestCase):
    def test_intersection_and_shade(self):
        tri = np.array([[[0,0,2],[1,0,2],[0,1,2]]],dtype=float)
        self.assertAlmostEqual(ray_triangle_intersection(
            np.array([.2,.2,0]),np.array([0,0,1]),tri[0]),2.0)
        self.assertEqual(trace_ground_shadows(
            np.array([[.2,.2,0],[2,2,0]]),np.array([0,0,1]),tri).tolist(),
            [True,False])

    def test_panel_geometry(self):
        geometry=ArrayGeometry()
        triangles=build_array_triangles(geometry)
        self.assertEqual(triangles.shape,(24,3,3))

    def test_paired_raytraced(self):
        geometry=ArrayGeometry()
        forcing=DailyForcing("2024-06-01",6.0,4.0,0,30,180,.2)
        result=paired_run(geometry,Scenario(),[forcing],
                          shading_mode="raytraced",grid_spacing_m=1)
        self.assertEqual(result["shading_mode"],"raytraced")
        shade=result["daily"][0]["shading"]
        self.assertGreaterEqual(shade["global_transmission"],0)
        self.assertLessEqual(shade["global_transmission"],1)

if __name__=="__main__":
    unittest.main()
