import unittest
from chipu_oregon.radiance_geometry import ArrayGeometry


class SyntheticRadianceContract(unittest.TestCase):
    def test_scene_has_nonzero_module_count(self):
        g = ArrayGeometry()
        g.validate()
        self.assertEqual(g.modules_per_row * g.number_of_rows, 12)

    def test_geometry_provenance(self):
        self.assertEqual(ArrayGeometry().manifest()["classification"],
                         "illustrative_geometry_not_field_surveyed")
