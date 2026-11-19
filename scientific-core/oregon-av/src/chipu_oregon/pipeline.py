"""Configurable Oregon FEW run with explicit scientific model selections."""
from dataclasses import dataclass, asdict
from datetime import datetime
from hashlib import sha256
import json
from .radiance_geometry import ArrayGeometry
from .fao56 import RootZoneDay, advance
from .hydraulics import pump_operating_point

@dataclass(frozen=True)
class Site:
    latitude_deg: float
    longitude_deg: float
    timezone: str = "America/Los_Angeles"

@dataclass(frozen=True)
class CropSoil:
    taw_mm: float
    initial_depletion_mm: float
    readily_available_fraction: float
    basal_kcb: float
    soil_ke: float

@dataclass(frozen=True)
class Irrigation:
    field_area_m2: float
    application_efficiency: float
    flow_m3_s: float
    static_head_m: float
    pipe_length_m: float
    pipe_diameter_m: float
    pump_efficiency: float

@dataclass(frozen=True)
class PV:
    pdc0_w: float
    tilt_deg: float
    azimuth_deg: float
    albedo: float = 0.2

def run_daily(site: Site, crop: CropSoil, irrigation: Irrigation, pv: PV, records: list[dict]) -> dict:
    """Use observed hourly irradiance for pvlib and daily ET0 for FAO-56.

    Each record contains date, et0_mm, rain_mm, gross_irrigation_mm,
    and hourly_weather (list of timestamp, ghi, dni, dhi, temp_air, wind_speed).
    """
    import pandas as pd
    from .pvlib_engine import calculate_pv_dc
    if not records:
        raise ValueError("At least one daily record required")
    if not 0 < irrigation.application_efficiency <= 1:
        raise ValueError("Invalid irrigation efficiency")
    if not 0 < irrigation.field_area_m2 or not 0 < crop.taw_mm:
        raise ValueError("Invalid soil or field area")
    if not 0 <= crop.initial_depletion_mm <= crop.taw_mm:
        raise ValueError("Initial depletion outside root-zone capacity")
    depletion = crop.initial_depletion_mm
    results = []
    last_date = None
    for record in records:
        day = datetime.strptime(record["date"], "%Y-%m-%d").date()
        if last_date is not None and day <= last_date:
            raise ValueError("Dates must increase")
        last_date = day
        samples = record["hourly_weather"]
        if not samples:
            raise ValueError("Hourly weather required for pvlib")
        frame = pd.DataFrame(samples)
        frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True)
        frame = frame.set_index("timestamp").sort_index()
        dc = calculate_pv_dc(frame, site.latitude_deg, site.longitude_deg,
                             pv.tilt_deg, pv.azimuth_deg, pv.pdc0_w, albedo=pv.albedo)
        if len(dc) < 2:
            raise ValueError("At least two hourly observations required")
        hours = dc.index.to_series().diff().dt.total_seconds().div(3600)
        if hours.iloc[1:].le(0).any() or hours.iloc[1:].gt(1.5).any():
            raise ValueError("Hourly timestamps must be regular, maximum gap 1.5 h")
        # Interval-ending convention; first sample does not represent an elapsed interval.
        pv_kwh = float((dc["dc_power_w"].iloc[1:] * hours.iloc[1:]).sum() / 1000)
        gross = float(record["gross_irrigation_mm"])
        root = advance(RootZoneDay(
            initial_depletion_mm=depletion, taw_mm=crop.taw_mm,
            p=crop.readily_available_fraction, et0_mm=float(record["et0_mm"]),
            kcb=crop.basal_kcb, ke=crop.soil_ke, rain_mm=float(record["rain_mm"]),
            net_irrigation_mm=gross * irrigation.application_efficiency))
        depletion = root["ending_depletion_mm"]
        pump = pump_operating_point(gross * irrigation.field_area_m2 / 1000,
            irrigation.flow_m3_s, irrigation.static_head_m, irrigation.pipe_length_m,
            irrigation.pipe_diameter_m, irrigation.pump_efficiency)
        results.append({"date": record["date"], "pv_dc_kwh": pv_kwh,
                        "crop_water": root, "pumping": pump})
    config = {"site": asdict(site), "crop_soil": asdict(crop),
              "irrigation": asdict(irrigation), "pv": asdict(pv)}
    fingerprint = sha256(json.dumps({"config": config, "records": records},
                                    sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return {"run_id": fingerprint[:20], "input_sha256": fingerprint,
            "configuration": config, "days": results,
            "summary": {"pv_dc_kwh": sum(x["pv_dc_kwh"] for x in results),
                        "pumping_kwh": sum(x["pumping"]["electricity_kwh"] for x in results),
                        "crop_et_mm": sum(x["crop_water"]["etc_mm"] for x in results),
                        "final_depletion_mm": depletion},
            "model_versions": {"pv": "pvlib.PVWatts_DC", "water": "FAO56_root_zone",
                               "pumping": "Darcy_Weisbach"}}
