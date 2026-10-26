"""FAO-56 Chapter 7 dual crop coefficient: daily surface evaporation.

Implements TEW, REW and the two-stage evaporation reduction Kr, assuming
a daily surface-layer water balance with no upward flux from deeper soil.
Reference: Allen et al. (1998), FAO Irrigation and Drainage Paper 56,
Chapter 7, equations 71-77. Ke=min(Kr*(Kcmax-Kcb), few*Kcmax).
The surface wetting fraction and crop cover must be independently specified.
"""
from __future__ import annotations
from dataclasses import dataclass


def total_evaporable_water(theta_fc: float, theta_wp: float, ze_m: float) -> float:
    if not 0 <= theta_wp < theta_fc <= 1 or ze_m <= 0:
        raise ValueError("Invalid soil moisture limits or evaporation depth")
    return 1000 * (theta_fc - .5 * theta_wp) * ze_m


def evaporation_reduction(depletion_mm: float, tew_mm: float, rew_mm: float) -> float:
    if not 0 <= rew_mm < tew_mm or not 0 <= depletion_mm <= tew_mm:
        raise ValueError("Invalid surface depletion or soil parameters")
    return 1.0 if depletion_mm <= rew_mm else (tew_mm - depletion_mm) / (tew_mm - rew_mm)


def evaporation_coefficient(kcb: float, kcmax: float, kr: float, few: float) -> float:
    if not 0 <= kcb <= kcmax or not 0 <= kr <= 1 or not 0 <= few <= 1:
        raise ValueError("Invalid dual crop coefficients")
    return min(kr * (kcmax - kcb), few * kcmax)


@dataclass(frozen=True)
class SurfaceDay:
    initial_depletion_mm: float
    tew_mm: float
    rew_mm: float
    kcb: float
    kcmax: float
    few: float
    et0_mm: float
    precipitation_mm: float
    surface_irrigation_mm: float = 0.0


def advance_surface(day: SurfaceDay) -> dict:
    if min(day.et0_mm, day.precipitation_mm, day.surface_irrigation_mm) < 0:
        raise ValueError("Negative weather or irrigation")
    kr = evaporation_reduction(day.initial_depletion_mm, day.tew_mm, day.rew_mm)
    ke = evaporation_coefficient(day.kcb, day.kcmax, kr, day.few)
    evaporation = ke * day.et0_mm
    # Wetting first fills the surface evaporation layer; excess percolates.
    wetting = day.precipitation_mm + day.surface_irrigation_mm
    after_wetting = max(0., day.initial_depletion_mm - wetting)
    excess_wetting = max(0., wetting - day.initial_depletion_mm)
    potential_depletion = after_wetting + evaporation
    # An impossible daily flux is not silently clipped.
    if potential_depletion > day.tew_mm + 1e-9:
        raise ValueError("Potential soil evaporation exceeds surface water availability")
    ending = potential_depletion
    return {"kr": kr, "ke": ke, "soil_evaporation_mm": evaporation,
            "ending_surface_depletion_mm": ending,
            "excess_surface_wetting_mm": excess_wetting,
            "status": "FAO56_two_stage_simplified_daily_wetting"}
