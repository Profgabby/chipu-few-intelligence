import unittest
from dataclasses import replace
from chipu_oregon.radiance_geometry import ArrayGeometry


class GeometryTests(unittest.TestCase):
    def test_synthetic_manifest(self):
        m = ArrayGeometry().manifest()
        self.assertIn("not_field_surveyed", m["classification"])
        self.assertEqual(m["geometry"]["number_of_rows"], 3)

    def test_pitch_constraint(self):
        with self.assertRaises(ValueError):
            replace(ArrayGeometry(), row_pitch_m=1).validate()

    def test_invalid_orientation(self):
        with self.assertRaises(ValueError):
            replace(ArrayGeometry(), azimuth_deg=361).validate()
