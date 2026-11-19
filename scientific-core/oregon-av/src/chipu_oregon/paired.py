"""Paired open-field / agrivoltaic runs on identical daily weather forcing.

A geometric solar-beam shade model computes a ground transmission factor from
array pitch, module length, tilt, azimuth, clearance, and solar position.
This is a geometric screening model, not a 3D ray tracer or diffuse-light solver.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, replace
from datetime import date
from hashlib import sha256
import json
import math
from .coupled import Scenario, simulate
from .radiance_geometry import ArrayGeometry

@dataclass(frozen=True)
class DailyForcing:
    date: str
    irradiation_kwh_m2: float
    et0_mm: float
    rain_mm: float
    solar_zenith_deg: float
    solar_azimuth_deg: float
    diffuse_fraction: float = 0.2

def ground_transmission(geometry: ArrayGeometry, forcing: DailyForcing) -> dict:
    """Projected direct-beam shade of a repeating tilted row; diffuse unshaded.

    Solar azimuth clockwise from north. Geometry module_length is slope length.
    Row-normal orientation is the module-facing azimuth. Transmission is a
    representative instantaneous solar-position approximation, not daily ray tracing.
    """
    geometry.validate()
    if not 0 <= forcing.diffuse_fraction <= 1:
        raise ValueError("Diffuse fraction outside [0,1]")
    if not 0 <= forcing.solar_zenith_deg <= 180 or not 0 <= forcing.solar_azimuth_deg < 360:
        raise ValueError("Invalid solar angles")
    if forcing.solar_zenith_deg >= 90:
        return {"beam_transmission": 1.0, "global_transmission": 1.0,
                "shade_fraction": 0.0}
    tilt = math.radians(geometry.tilt_deg)
    zenith = math.radians(forcing.solar_zenith_deg)
    az_diff = math.radians(forcing.solar_azimuth_deg - geometry.azimuth_deg)
    # Horizontal beam displacement of module top relative to bottom along row normal.
    # Elevation at bottom/top: clearance, clearance + module_length*sin(tilt).
    # A projected ground shadow spans the two endpoint shadow positions.
    beam_shift_per_height = math.tan(zenith) * math.cos(az_diff)
    bottom_shadow = -geometry.module_clearance_m * beam_shift_per_height
    top_shadow = geometry.module_length_m * math.cos(tilt) - (
        geometry.module_clearance_m + geometry.module_length_m * math.sin(tilt)
    ) * beam_shift_per_height
    width = abs(top_shadow - bottom_shadow)
    shade_fraction = min(1.0, max(0.0, width / geometry.row_pitch_m))
    beam_transmission = 1.0 - shade_fraction
    global_transmission = forcing.diffuse_fraction + (
        1.0 - forcing.diffuse_fraction
    ) * beam_transmission
    return {"beam_transmission": beam_transmission,
            "global_transmission": global_transmission,
            "shade_fraction": shade_fraction}

def paired_run(geometry: ArrayGeometry, base: Scenario,
               records: list[DailyForcing], av_et_multiplier: float = 1.0,\n               shading_mode: str = "projected", grid_spacing_m: float = 0.25,\n               radiation_records: list[dict] | None = None) -> dict:
    """Compare open field and AV with matched forcing and independent water states.

    av_et_multiplier is an explicit user-supplied crop/microclimate assumption,
    not derived from geometric shade. Defaults to no ET adjustment.
    """
    geometry.validate()
    if not records or not 0 <= av_et_multiplier <= 1:
        raise ValueError("Records required and ET multiplier must be in [0,1]")
    open_storage = av_storage = base.soil_initial_mm
    days = []
    previous = None
    for forcing in records:
        current = date.fromisoformat(forcing.date)
        if previous is not None and current <= previous:
            raise ValueError("Forcing dates must increase")
        previous = current
        if min(forcing.irradiation_kwh_m2, forcing.et0_mm, forcing.rain_mm) < 0:
            raise ValueError("Negative weather forcing")
        if shading_mode == "raytraced":\n            from .notebook_raytracing import raytraced_transmission\n            shade = raytraced_transmission(geometry, forcing, grid_spacing_m=grid_spacing_m)\n        else:\n            shade = ground_transmission(geometry, forcing)
        common = dict(irradiation_kwh_m2=forcing.irradiation_kwh_m2,
                      et0_mm=forcing.et0_mm, rain_mm=forcing.rain_mm)
        open_s = replace(base, **common, soil_initial_mm=open_storage,
                         ground_transmission=1.0, shade_et_factor=1.0,
                         panel_area_m2=0.0)
        av_s = replace(base, **common, soil_initial_mm=av_storage,
                       ground_transmission=shade["global_transmission"],
                       shade_et_factor=av_et_multiplier)
        open_result = simulate(open_s)
        av_result = simulate(av_s)
        open_storage = open_result["water"]["ending_storage_mm"]
        av_storage = av_result["water"]["ending_storage_mm"]
        days.append({"date": forcing.date, "shading": shade,
                     "open_field": open_result, "agrivoltaic": av_result,
                     "delta_et_mm": av_result["water"]["et_mm"] - open_result["water"]["et_mm"],
                     "delta_pv_kwh": av_result["pv_electricity_kwh"] - open_result["pv_electricity_kwh"]})
    summary = {
        "open_field_et_mm": sum(d["open_field"]["water"]["et_mm"] for d in days),
        "agrivoltaic_et_mm": sum(d["agrivoltaic"]["water"]["et_mm"] for d in days),
        "open_field_pumping_kwh": sum(d["open_field"]["pumping"]["electricity_kwh"] for d in days),
        "agrivoltaic_pumping_kwh": sum(d["agrivoltaic"]["pumping"]["electricity_kwh"] for d in days),
        "agrivoltaic_pv_kwh": sum(d["agrivoltaic"]["pv_electricity_kwh"] for d in days),
        "open_field_final_storage_mm": open_storage,
        "agrivoltaic_final_storage_mm": av_storage,
    }
    summary["delta_et_mm"] = summary["agrivoltaic_et_mm"] - summary["open_field_et_mm"]\n    radiation = None\n    if radiation_records is not None:\n        from .time_resolved_radiation import integrate_ground_radiation\n        radiation = integrate_ground_radiation(geometry, radiation_records,\n                                               grid_spacing_m=grid_spacing_m)\n        summary["ground_open_radiation_kwh_m2"] = radiation["ground_open_kwh_m2"]\n        summary["ground_av_radiation_kwh_m2"] = radiation["ground_av_kwh_m2_mean"]
    payload = {"geometry": asdict(geometry), "scenario": asdict(base),
               "forcing": [asdict(d) for d in records], "av_et_multiplier": av_et_multiplier,\n               "shading_mode": shading_mode, "grid_spacing_m": grid_spacing_m,\n               "radiation_records": radiation_records}
    digest = sha256(json.dumps(payload, sort_keys=True, allow_nan=False).encode()).hexdigest()
    return {"run_id": digest[:20], "input_sha256": digest, "summary": summary,
            "daily": days, "radiation": radiation, "geometry": asdict(geometry),
            "model": "paired_geometry_coupled_v1", "shading_mode": shading_mode}
