"""Pure, unit-explicit pre-data scientific baselines. No field validation claimed."""
from dataclasses import dataclass

@dataclass(frozen=True)
class WaterStep:
    storage_mm: float
    runoff_mm: float
    drainage_mm: float
    unmet_et_mm: float
    residual_mm: float

def water_step(storage_mm: float, precipitation_mm: float, irrigation_mm: float,
               et_demand_mm: float, capacity_mm: float) -> WaterStep:
    """Daily root-zone bucket; negative fluxes are invalid; water cannot disappear."""
    values = (storage_mm, precipitation_mm, irrigation_mm, et_demand_mm, capacity_mm)
    if any(not (0 <= x < float("inf")) for x in values) or storage_mm > capacity_mm:
        raise ValueError("Finite nonnegative inputs required; initial storage <= capacity")
    available = storage_mm + precipitation_mm + irrigation_mm
    actual_et = min(available, et_demand_mm)
    remaining = available - actual_et
    drainage = max(0., remaining - capacity_mm)
    final = remaining - drainage
    residual = storage_mm + precipitation_mm + irrigation_mm - actual_et - drainage - final
    return WaterStep(final, 0., drainage, et_demand_mm - actual_et, residual)

def crop_et_mm(eto_mm: float, kc: float) -> float:
    if not (0 <= eto_mm < float("inf") and 0 <= kc < float("inf")):
        raise ValueError("ETo and Kc must be finite nonnegative")
    return eto_mm * kc

def pump_energy_kwh(volume_m3: float, head_m: float, efficiency: float) -> float:
    """Hydraulic electrical energy; constant head and aggregate efficiency."""
    if not (0 <= volume_m3 < float("inf") and 0 <= head_m < float("inf") and 0 < efficiency <= 1):
        raise ValueError("Invalid pump inputs")
    return 1000 * 9.81 * volume_m3 * head_m / efficiency / 3_600_000

def pv_energy_kwh(irradiation_kwh_m2: float, area_m2: float, efficiency: float,
                  performance_ratio: float = 1.) -> float:
    """Daily DC-equivalent PV estimate; shading/temperature via assumed PR."""
    if not (0 <= irradiation_kwh_m2 < float("inf") and 0 <= area_m2 < float("inf")
            and 0 <= efficiency <= 1 and 0 <= performance_ratio <= 1):
        raise ValueError("Invalid PV inputs")
    return irradiation_kwh_m2 * area_m2 * efficiency * performance_ratio
