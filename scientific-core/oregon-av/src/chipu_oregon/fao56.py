"""FAO-56 root-zone depletion and stress accounting (Allen et al., 1998).

Ke is supplied externally: this is NOT the complete dual-Kc evaporation model.
"""
from dataclasses import dataclass


def water_stress_coefficient(depletion_mm: float, taw_mm: float, p: float) -> float:
    if taw_mm <= 0 or not 0 <= depletion_mm <= taw_mm or not 0 <= p < 1:
        raise ValueError("Invalid depletion, TAW or readily available fraction")
    raw = p * taw_mm
    return 1.0 if depletion_mm <= raw else max(0.0, (taw_mm - depletion_mm) / (taw_mm - raw))


@dataclass(frozen=True)
class RootZoneDay:
    initial_depletion_mm: float
    taw_mm: float
    p: float
    et0_mm: float
    kcb: float
    ke: float
    rain_mm: float
    net_irrigation_mm: float
    runoff_mm: float = 0.0
    capillary_rise_mm: float = 0.0


def advance(day: RootZoneDay) -> dict:
    if min(day.et0_mm, day.kcb, day.ke, day.rain_mm, day.net_irrigation_mm,
           day.runoff_mm, day.capillary_rise_mm) < 0:
        raise ValueError("Negative flux or coefficient")
    if day.runoff_mm > day.rain_mm + day.net_irrigation_mm:
        raise ValueError("Runoff exceeds inputs")
    ks = water_stress_coefficient(day.initial_depletion_mm, day.taw_mm, day.p)
    etc = (ks * day.kcb + day.ke) * day.et0_mm
    raw_dr = (day.initial_depletion_mm - day.rain_mm - day.net_irrigation_mm
              - day.capillary_rise_mm + day.runoff_mm + etc)
    drainage = max(0.0, -raw_dr)
    ending = raw_dr + drainage
    if ending > day.taw_mm + 1e-9:
        raise ValueError("ET exceeds available root-zone water")
    residual = (ending - day.initial_depletion_mm + day.rain_mm + day.net_irrigation_mm
                + day.capillary_rise_mm - day.runoff_mm - etc - drainage)
    return {"ks": ks, "etc_mm": etc, "ending_depletion_mm": ending,
            "deep_percolation_mm": drainage, "balance_residual_mm": residual,
            "status": "FAO56_stress_root_zone_balance_Ke_external"}
