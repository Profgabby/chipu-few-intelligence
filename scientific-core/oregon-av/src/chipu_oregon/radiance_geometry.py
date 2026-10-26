"""Geometry validation for an illustrative fixed-tilt agrivoltaic array.

All dimensions are explicitly synthetic; NOT surveyed Oregon geometry.
"""
from dataclasses import dataclass, asdict
import json
from pathlib import Path


@dataclass(frozen=True)
class ArrayGeometry:
    latitude_deg: float = 45.3
    longitude_deg: float = -122.75
    tilt_deg: float = 25.0
    azimuth_deg: float = 180.0
    module_width_m: float = 1.1
    module_length_m: float = 2.0
    module_clearance_m: float = 1.5
    row_pitch_m: float = 6.0
    modules_per_row: int = 4
    number_of_rows: int = 3
    ground_albedo: float = 0.2

    def validate(self) -> None:
        if not (-90 <= self.latitude_deg <= 90 and -180 <= self.longitude_deg <= 180):
            raise ValueError("Invalid location")
        if not (0 <= self.tilt_deg <= 90 and 0 <= self.azimuth_deg < 360):
            raise ValueError("Invalid orientation")
        if min(self.module_width_m, self.module_length_m, self.module_clearance_m,
               self.row_pitch_m) <= 0:
            raise ValueError("Nonpositive geometry")
        if self.modules_per_row < 1 or self.number_of_rows < 1:
            raise ValueError("Nonpositive module/row count")
        if not 0 <= self.ground_albedo <= 1:
            raise ValueError("Invalid albedo")
        if self.row_pitch_m <= self.module_length_m:
            raise ValueError("Row pitch must exceed module length for this illustrative configuration")

    def manifest(self) -> dict:
        self.validate()
        return {"classification": "illustrative_geometry_not_field_surveyed",
                "coordinate_reference": "WGS84",
                "geometry": asdict(self),
                "geometry_convention": "azimuth clockwise from north; fixed tilt from horizontal",
                "provenance": "synthetic engineering example; not observed Oregon array"}


def write_manifest(path: str) -> None:
    result = ArrayGeometry().manifest()
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
