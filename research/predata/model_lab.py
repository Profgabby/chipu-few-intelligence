"""Model Laboratory scientific configuration contract.

No geometry or crop-response coefficients are inferred from model IDs.
Every registered design uses the same equations, with explicitly supplied inputs.
"""
from dataclasses import dataclass
from math import isfinite
from .physics import water_step, crop_et_mm, pump_energy_kwh, pv_energy_kwh

MODEL_IDS = tuple(f"{prefix}{i:02d}" for prefix in ("SS", "MS", "CS", "RT") for i in range(1, 6))
OPEN_FIELD = "OPEN_FIELD"

@dataclass(frozen=True)
class ModelInputs:
    model_id: str
    solar_irradiation_kwh_m2: float
    transmitted_fraction: float
    eto_mm: float
    kc: float
    rainfall_mm: float
    starting_storage_mm: float
    rootzone_capacity_mm: float
    irrigation_mm: float
    pv_area_m2: float
    pv_efficiency: float
    pv_performance_ratio: float
    irrigated_area_m2: float
    pump_head_m: float
    pump_efficiency: float

def simulate(inputs: ModelInputs):
    if inputs.model_id not in (*MODEL_IDS, OPEN_FIELD):
        raise ValueError("Unrecognized Model Laboratory ID")
    if not (isfinite(inputs.transmitted_fraction) and 0 <= inputs.transmitted_fraction <= 1):
        raise ValueError("Transmitted radiation fraction must be between 0 and 1")
    if not (isfinite(inputs.irrigated_area_m2) and inputs.irrigated_area_m2 > 0):
        raise ValueError("Irrigated area must be positive")
    if inputs.model_id == OPEN_FIELD and inputs.pv_area_m2 != 0:
        raise ValueError("Open-field control must not include on-site agrivoltaic PV")
    # ETo is externally supplied for the particular microclimate; shading does
    # not automatically scale ETo. Doing so would invent a crop-response model.
    et = crop_et_mm(inputs.eto_mm, inputs.kc)
    water = water_step(inputs.starting_storage_mm, inputs.rainfall_mm,
                       inputs.irrigation_mm, et, inputs.rootzone_capacity_mm)
    volume = inputs.irrigation_mm * inputs.irrigated_area_m2 / 1000
    energy = pump_energy_kwh(volume, inputs.pump_head_m, inputs.pump_efficiency)
    pv = pv_energy_kwh(inputs.solar_irradiation_kwh_m2, inputs.pv_area_m2,
                       inputs.pv_efficiency, inputs.pv_performance_ratio)
    return {
        "model_id":inputs.model_id,
        "source_type":"USER_SUPPLIED_INPUTS",
        "validation_status":"NOT_FIELD_VALIDATED",
        "transmitted_irradiation_kwh_m2":inputs.solar_irradiation_kwh_m2*inputs.transmitted_fraction,
        "crop_et_mm":et,
        "rootzone_storage_mm":water.storage_mm,
        "rootzone_drainage_mm":water.drainage_mm,
        "unmet_et_mm":water.unmet_et_mm,
        "water_balance_residual_mm":water.residual_mm,
        "pumping_energy_kwh":energy,
        "pv_energy_kwh":pv,
        "net_pv_minus_pumping_kwh":pv-energy,
    }

def paired_comparison(open_field: ModelInputs, agrivoltaic: ModelInputs):
    if open_field.model_id != OPEN_FIELD or agrivoltaic.model_id == OPEN_FIELD:
        raise ValueError("Expected open-field control and agrivoltaic treatment")
    if open_field.irrigated_area_m2 != agrivoltaic.irrigated_area_m2:
        raise ValueError("Paired comparison requires equal irrigated area")
    control=simulate(open_field)
    treatment=simulate(agrivoltaic)
    return {
        "control":control,"treatment":treatment,
        "delta_pumping_kwh":treatment["pumping_energy_kwh"]-control["pumping_energy_kwh"],
        "delta_et_mm":treatment["crop_et_mm"]-control["crop_et_mm"],
        "delta_rootzone_storage_mm":treatment["rootzone_storage_mm"]-control["rootzone_storage_mm"],
        "status":"SCENARIO_COMPARISON_NOT_CAUSAL_EVIDENCE"
    }
