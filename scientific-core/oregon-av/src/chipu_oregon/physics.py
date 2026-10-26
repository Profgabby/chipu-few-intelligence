"""Transparent physical component functions; research-stage, uncalibrated.

These do not implement bifacial_radiance or pvlib. They are independently
testable conservation and unit benchmarks to validate future integrations.
"""
from __future__ import annotations


def ground_irradiation(incident_kwh_m2: float, transmission: float) -> float:
    """Illustrative transmission baseline, not ray tracing."""
    if incident_kwh_m2 < 0 or not 0 <= transmission <= 1:
        raise ValueError("Invalid irradiation or transmission")
    return incident_kwh_m2 * transmission


def pv_electricity_kwh(irradiation_kwh_m2: float, area_m2: float,
                       module_efficiency: float, performance_ratio: float) -> float:
    """Simple PV benchmark; replace with pvlib module/inverter calculations."""
    if min(irradiation_kwh_m2, area_m2) < 0 or not (0 <= module_efficiency <= 1 and 0 <= performance_ratio <= 1):
        raise ValueError("Invalid PV inputs")
    return irradiation_kwh_m2 * area_m2 * module_efficiency * performance_ratio


def dual_kc_et_mm(et0_mm: float, kcb: float, ke: float, ks: float = 1.0) -> float:
    """FAO-56 dual-coefficient identity: ETc=(Ks*Kcb+Ke)*ET0.

    Coefficients must be independently determined; this does not calculate
    the FAO-56 soil evaporation reduction, stress coefficient, or Kcmax.
    """
    if min(et0_mm, kcb, ke) < 0 or not 0 <= ks <= 1:
        raise ValueError("Invalid ET inputs")
    return (ks * kcb + ke) * et0_mm


def root_zone_storage_mm(initial_mm: float, rain_mm: float, net_irrigation_mm: float,
                         et_mm: float, drainage_mm: float = 0.0,
                         runoff_mm: float = 0.0, capillary_rise_mm: float = 0.0) -> float:
    """One-step storage balance. No clipping: caller must inspect feasibility."""
    if min(initial_mm, rain_mm, net_irrigation_mm, et_mm, drainage_mm, runoff_mm, capillary_rise_mm) < 0:
        raise ValueError("Water fluxes/storage must be nonnegative")
    return initial_mm + rain_mm + net_irrigation_mm + capillary_rise_mm - et_mm - drainage_mm - runoff_mm


def pumping_energy_kwh(volume_m3: float, head_m: float, efficiency: float) -> float:
    """rho*g*V*H/eta in kWh; constant efficiency and head assumed."""
    if volume_m3 < 0 or head_m < 0 or not 0 < efficiency <= 1:
        raise ValueError("Invalid hydraulic inputs")
    return 1000 * 9.81 * volume_m3 * head_m / efficiency / 3_600_000
