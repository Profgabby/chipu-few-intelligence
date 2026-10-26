"""Daily FAO-56-inspired crop-water accounting and explicit mass balance.

Kcb, Ke, Ks, ET0, runoff, drainage and capillary rise are INPUTS. This module
does not yet calculate FAO-56 evaporation stages, Kcmax, or a site-calibrated
soil-water stress coefficient. Irrigation is a declared management decision.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict


@dataclass(frozen=True)
class WaterDay:
    et0_mm: float
    basal_kcb: float
    soil_ke: float
    stress_ks: float
    precipitation_mm: float
    gross_irrigation_mm: float
    application_efficiency: float
    initial_storage_mm: float
    field_capacity_storage_mm: float
    runoff_mm: float = 0.0
    capillary_rise_mm: float = 0.0


def step(day: WaterDay) -> dict:
    if min(day.et0_mm, day.basal_kcb, day.soil_ke, day.precipitation_mm,
           day.gross_irrigation_mm, day.initial_storage_mm, day.field_capacity_storage_mm,
           day.runoff_mm, day.capillary_rise_mm) < 0:
        raise ValueError("Negative flux, coefficient, or storage")
    if not 0 <= day.stress_ks <= 1 or not 0 < day.application_efficiency <= 1:
        raise ValueError("Invalid coefficients")
    if day.runoff_mm > day.precipitation_mm + day.gross_irrigation_mm:
        raise ValueError("Runoff exceeds surface water inputs")
    et_mm = (day.stress_ks * day.basal_kcb + day.soil_ke) * day.et0_mm
    net_irrigation_mm = day.gross_irrigation_mm * day.application_efficiency
    available = (day.initial_storage_mm + day.precipitation_mm + net_irrigation_mm
                 + day.capillary_rise_mm - day.runoff_mm)
    if et_mm > available + 1e-10:
        raise ValueError("Specified ET exceeds available water; revise stress/flux assumptions")
    storage_before_drainage = available - et_mm
    drainage = max(0.0, storage_before_drainage - day.field_capacity_storage_mm)
    ending = storage_before_drainage - drainage
    residual = (day.initial_storage_mm + day.precipitation_mm + net_irrigation_mm
                + day.capillary_rise_mm - day.runoff_mm - et_mm - drainage - ending)
    return {"inputs": asdict(day), "et_mm": et_mm,
            "net_irrigation_mm": net_irrigation_mm, "drainage_mm": drainage,
            "ending_storage_mm": ending, "mass_balance_residual_mm": residual,
            "status": "coefficient_driven_balance_not_site_calibrated"}
