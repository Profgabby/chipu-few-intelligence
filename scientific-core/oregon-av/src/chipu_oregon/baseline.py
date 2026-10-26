"""Transparent, illustrative one-day FEW conservation baseline.

IMPORTANT: This is NOT a ray-tracing calculation, pvlib simulation, calibrated
FAO-56 dual-coefficient model, or measured Aurora dataset. It exercises the
interfaces of four future physical model components with declared assumptions.
"""
from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass(frozen=True)
class Inputs:
    # Illustrative values, NOT observations from the Aurora field.
    daily_plane_irradiation_kwh_m2: float = 4.0
    ground_transmission_fraction: float = 0.65
    pv_area_m2: float = 10.0
    pv_efficiency: float = 0.18
    pv_performance_ratio: float = 0.80
    reference_et_mm_day: float = 4.0
    basal_crop_coefficient: float = 0.85
    soil_evaporation_coefficient: float = 0.15
    # Illustrative sensitivity factor, NOT a validated shading-to-ET law.
    shaded_et_multiplier: float = 0.85
    rain_mm_day: float = 0.0
    field_area_m2: float = 100.0
    irrigation_efficiency: float = 0.80
    initial_root_zone_storage_mm: float = 80.0
    target_root_zone_storage_mm: float = 80.0
    total_dynamic_head_m: float = 15.0
    pump_motor_efficiency: float = 0.55


def run(i: Inputs) -> dict:
    if not 0 <= i.ground_transmission_fraction <= 1:
        raise ValueError("ground transmission must be within [0, 1]")
    if not 0 < i.irrigation_efficiency <= 1 or not 0 < i.pump_motor_efficiency <= 1:
        raise ValueError("efficiencies must be within (0, 1]")
    if min(i.field_area_m2, i.pv_area_m2, i.total_dynamic_head_m) < 0:
        raise ValueError("area and head cannot be negative")
    ground_irradiation = i.daily_plane_irradiation_kwh_m2 * i.ground_transmission_fraction
    pv_energy = i.daily_plane_irradiation_kwh_m2 * i.pv_area_m2 * i.pv_efficiency * i.pv_performance_ratio
    et_open = i.reference_et_mm_day * (i.basal_crop_coefficient + i.soil_evaporation_coefficient)
    et_shaded = et_open * i.shaded_et_multiplier
    net_depletion = max(0.0, i.target_root_zone_storage_mm - i.initial_root_zone_storage_mm + et_shaded - i.rain_mm_day)
    gross_irrigation_mm = net_depletion / i.irrigation_efficiency
    irrigation_m3 = gross_irrigation_mm * i.field_area_m2 / 1000.0
    # 1000 kg/m3 * 9.81 m/s2 * volume(m3) * head(m) / efficiency => J
    pump_kwh = (1000.0 * 9.81 * irrigation_m3 * i.total_dynamic_head_m /
                i.pump_motor_efficiency / 3_600_000.0)
    # Accounting identity for the simplified root zone: input is net irrigation
    # (not gross withdrawal); runoff and drainage assumed zero.
    effective_irrigation_mm = gross_irrigation_mm * i.irrigation_efficiency
    ending_storage_mm = i.initial_root_zone_storage_mm + i.rain_mm_day + effective_irrigation_mm - et_shaded
    residual_mm = ending_storage_mm - (i.initial_root_zone_storage_mm + i.rain_mm_day +
                                       effective_irrigation_mm - et_shaded)
    return {
        "classification": "illustrative_synthetic_baseline_not_field_validated",
        "input_assumptions": asdict(i),
        "radiation": {"ground_irradiation_kwh_m2_day": ground_irradiation,
                      "method": "assumed_transmission_NOT_ray_tracing"},
        "photovoltaics": {"electricity_kwh_day": pv_energy,
                          "method": "area_efficiency_performance_ratio_NOT_pvlib"},
        "crop_and_soil_water": {"open_field_et_mm_day": et_open,
                                "illustrative_shaded_et_mm_day": et_shaded,
                                "gross_irrigation_mm_day": gross_irrigation_mm,
                                "ending_root_zone_storage_mm": ending_storage_mm,
                                "balance_residual_mm": residual_mm,
                                "method": "simplified_FAO_coefficients_NOT_calibrated_dual_Kc"},
        "pumping": {"irrigation_volume_m3_day": irrigation_m3,
                    "electricity_kwh_day": pump_kwh,
                    "method": "rho_g_volume_head_over_efficiency"},
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()
    result = run(Inputs())
    encoded = json.dumps(result, indent=2, sort_keys=True)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded + "\n", encoding="utf-8")
    print(encoded)


if __name__ == "__main__":
    main()
