"""Parser contract tests use explicitly artificial records, not real AgriMet data."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from parse_agrimet_archive import parse
class ArchiveParserTests(unittest.TestCase):
    def test_conversion_and_missing_values(self):
        raw=b"BEGIN DATA\nDATE,MRSO MM,MRSO PP,MRSO SR,MRSO UA\n20240101,50,1,100,10\n20240102,55,-999,120,12\nEND DATA\n"
        rows=parse(raw,"MRSO")
        self.assertEqual(len(rows),2)
        self.assertAlmostEqual(rows[0]["tmean_c"],10)
        self.assertAlmostEqual(rows[0]["precip_mm"],25.4)
        self.assertAlmostEqual(rows[0]["solar_kwh_m2_day"],1.16222222,places=6)
        self.assertAlmostEqual(rows[0]["wind_m_s"],4.4704)
        self.assertEqual(rows[1]["precip_mm"],"")
    def test_unrecognized_format_rejected(self):
        with self.assertRaises(ValueError):parse(b"<html>server error</html>","MRSO")
    def test_duplicate_dates_rejected(self):
        raw=b"BEGIN DATA\nDATE,MRSO MM\n20240101,50\n20240101,50\nEND DATA\n"
        with self.assertRaises(ValueError):parse(raw,"MRSO")
    def test_unexpected_columns_rejected(self):
        raw=b"BEGIN DATA\nDATE,MRSO MM\n20240101,50,99\nEND DATA\n"
        with self.assertRaises(ValueError):parse(raw,"MRSO")
if __name__=="__main__":unittest.main()
