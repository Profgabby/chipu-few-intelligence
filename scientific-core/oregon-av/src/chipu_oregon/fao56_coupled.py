"""Daily two-reservoir FAO-56 bookkeeping, without double-counting evaporation.

Root-zone depletion accounts for total ETc = transpiration + soil evaporation.
The surface-layer ledger tracks soil evaporation ONLY as a diagnostic subset
of root-zone ET. Surface storage is nested within the root-zone, not an
additional water reservoir; never sum the two storage balances.
Simplifications: wetting before evaporation; no separate surface runoff,
surface irrigation wetted fraction must be specified externally.
"""
from dataclasses import dataclass
from .fao56 import RootZoneDay, advance
from .fao56_evaporation import SurfaceDay, advance_surface


@dataclass(frozen=True)
class CoupledDay:
    initial_root_depletion_mm: float
    taw_mm: float
    readily_available_fraction: float
    initial_surface_depletion_mm: float
    tew_mm: float
    rew_mm: float
    et0_mm: float
    kcb: float
    kcmax: float
    exposed_wetted_fraction: float
    rain_mm: float
    net_irrigation_mm: float
    surface_irrigation_mm: float = 0.0
    runoff_mm: float = 0.0
    capillary_rise_mm: float = 0.0


def advance_coupled(day: CoupledDay) -> dict:
    if day.surface_irrigation_mm > day.net_irrigation_mm:
        raise ValueError("Surface wetting cannot exceed net irrigation")
    if day.runoff_mm > day.rain_mm + day.net_irrigation_mm:
        raise ValueError("Runoff exceeds water inputs")
    # Wetting for evaporation layer uses infiltrating rain; runoff removed.
    infiltrating_rain = max(0.0, day.rain_mm - day.runoff_mm)
    surface = advance_surface(SurfaceDay(
        day.initial_surface_depletion_mm, day.tew_mm, day.rew_mm,
        day.kcb, day.kcmax, day.exposed_wetted_fraction,
        day.et0_mm, infiltrating_rain, day.surface_irrigation_mm))
    root = advance(RootZoneDay(
        day.initial_root_depletion_mm, day.taw_mm, day.readily_available_fraction,
        day.et0_mm, day.kcb, surface["ke"], day.rain_mm,
        day.net_irrigation_mm, day.runoff_mm, day.capillary_rise_mm))
    transpiration = root["ks"] * day.kcb * day.et0_mm
    evaporation = surface["soil_evaporation_mm"]
    if abs(root["etc_mm"] - transpiration - evaporation) > 1e-9:
        raise AssertionError("ET component identity failed")
    return {"root_zone": root, "surface_layer": surface,
            "transpiration_mm": transpiration, "soil_evaporation_mm": evaporation,
            "total_et_mm": root["etc_mm"],
            "conservation_residual_mm": root["balance_residual_mm"],
            "accounting": "surface_layer_is_nested_not_additive",
            "classification": "method_development_not_field_validated"}
