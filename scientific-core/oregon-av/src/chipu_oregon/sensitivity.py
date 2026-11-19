"""Deterministic paired scenario sweeps for Oregon agrivoltaic research."""
from dataclasses import asdict, replace
from itertools import product
from .coupled import Scenario
from .paired import DailyForcing, paired_run
from .radiance_geometry import ArrayGeometry

ALLOWED = {
    "tilt_deg": "geometry", "row_pitch_m": "geometry",
    "module_clearance_m": "geometry", "azimuth_deg": "geometry",
    "gross_irrigation_mm": "scenario", "pv_efficiency": "scenario",
    "shade_et_factor": "et_multiplier",
}

def sweep(geometry: ArrayGeometry, scenario: Scenario,
          records: list[DailyForcing], factors: dict[str, list[float]],
          max_runs: int = 1000) -> dict:
    """Full-factorial sensitivity design, all runs use identical weather records."""
    if not factors or any(k not in ALLOWED or not v for k,v in factors.items()):
        raise ValueError("Unknown or empty sensitivity factor")
    names = sorted(factors)
    total = 1
    for key in names:
        total *= len(factors[key])
    if total > max_runs or max_runs < 1:
        raise ValueError("Scenario sweep exceeds configured run limit")
    runs = []
    for values in product(*(factors[key] for key in names)):
        g, s, et = geometry, scenario, 1.0
        settings = dict(zip(names, values))
        for key, value in settings.items():
            if ALLOWED[key] == "geometry":
                g = replace(g, **{key: value})
            elif ALLOWED[key] == "scenario":
                s = replace(s, **{key: value})
            else:
                et = value
        result = paired_run(g, s, records, av_et_multiplier=et)
        runs.append({"factors": settings, "run_id": result["run_id"],
                     "summary": result["summary"]})
    return {"factor_names": names, "run_count": len(runs),
            "runs": runs, "method": "full_factorial_paired_weather"}
