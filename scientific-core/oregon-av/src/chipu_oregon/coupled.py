"""Versioned illustrative FEW coupling, not an Oregon field validation.

Inputs deliberately separate unmeasured assumed shading/ET factors from
measured observations. Do not use scenario outputs as empirical findings.
"""
from __future__ import annotations
from dataclasses import asdict, dataclass
from .physics import ground_irradiation, pv_electricity_kwh
from .water import WaterDay, step
from .hydraulics import pump_operating_point


@dataclass(frozen=True)
class Scenario:
    irradiation_kwh_m2: float = 4.0
    ground_transmission: float = .65
    panel_area_m2: float = 10.0
    pv_efficiency: float = .18
    pv_performance_ratio: float = .8
    et0_mm: float = 4.0
    kcb: float = .85
    ke: float = .15
    shade_et_factor: float = .85
    rain_mm: float = 0.0
    soil_initial_mm: float = 80.0
    soil_field_capacity_mm: float = 100.0
    gross_irrigation_mm: float = 5.0
    irrigation_efficiency: float = .8
    field_area_m2: float = 100.0
    flow_m3_s: float = .001
    static_head_m: float = 10.0
    pipe_length_m: float = 100.0
    pipe_diameter_m: float = .05
    pump_efficiency: float = .6


def simulate(s: Scenario) -> dict:
    if not 0 <= s.shade_et_factor <= 1 or s.field_area_m2 < 0:
        raise ValueError("Invalid scenario")
    ground = ground_irradiation(s.irradiation_kwh_m2, s.ground_transmission)
    pv = pv_electricity_kwh(s.irradiation_kwh_m2, s.panel_area_m2,
                            s.pv_efficiency, s.pv_performance_ratio)
    # This is a synthetic perturbation to ET0, NOT a mechanistic microclimate
    # coupling. It must be replaced by measured/modelled meteorological forcing.
    water = step(WaterDay(s.et0_mm * s.shade_et_factor, s.kcb, s.ke, 1,
                          s.rain_mm, s.gross_irrigation_mm,
                          s.irrigation_efficiency, s.soil_initial_mm,
                          s.soil_field_capacity_mm))
    irrigation_m3 = s.gross_irrigation_mm * s.field_area_m2 / 1000
    pump = pump_operating_point(irrigation_m3, s.flow_m3_s, s.static_head_m,
                                s.pipe_length_m, s.pipe_diameter_m,
                                s.pump_efficiency)
    return {"classification": "synthetic_scenario_not_field_validated",
            "parameters": asdict(s),
            "ground_irradiation_kwh_m2": ground,
            "pv_electricity_kwh": pv,
            "water": water, "pumping": pump,
            "pv_minus_pumping_kwh": pv - pump["electricity_kwh"],
            "scientific_limitations": [
                "uniform transmission, not spatial ray tracing",
                "constant PV efficiency, not pvlib",
                "assumed ET0 shade factor, not observed microclimate",
                "user-specified irrigation, not optimized irrigation scheduling",
                "constant pump efficiency, not pump curve"
            ]}
