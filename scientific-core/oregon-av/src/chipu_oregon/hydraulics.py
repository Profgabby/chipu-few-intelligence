"""Auditable irrigation hydraulics using SI units.

Steady incompressible pipe flow, Darcy-Weisbach friction and Swamee-Jain
turbulent approximation. Not a pump curve or transient hydraulic solver.
"""
from __future__ import annotations
from math import log10, pi


def pipe_head_loss_m(flow_m3_s: float, length_m: float, diameter_m: float,
                     roughness_m: float = 1.5e-6, nu_m2_s: float = 1.004e-6) -> float:
    if flow_m3_s < 0 or length_m < 0 or diameter_m <= 0 or roughness_m < 0 or nu_m2_s <= 0:
        raise ValueError("Invalid hydraulic parameters")
    if flow_m3_s == 0 or length_m == 0:
        return 0.0
    velocity = 4 * flow_m3_s / (pi * diameter_m**2)
    reynolds = velocity * diameter_m / nu_m2_s
    if reynolds < 2300:
        friction = 64 / reynolds
    elif reynolds >= 4000:
        friction = 0.25 / log10(roughness_m / (3.7 * diameter_m) + 5.74 / reynolds**0.9)**2
    else:
        raise ValueError("Transitional Reynolds regime requires a justified friction model")
    return friction * (length_m / diameter_m) * velocity**2 / (2 * 9.81)


def pump_operating_point(volume_m3: float, flow_m3_s: float, static_head_m: float,
                         length_m: float, diameter_m: float, efficiency: float,
                         minor_loss_k: float = 0.0) -> dict:
    if volume_m3 < 0 or flow_m3_s <= 0 or static_head_m < 0 or minor_loss_k < 0 or not 0 < efficiency <= 1:
        raise ValueError("Invalid pumping inputs")
    velocity = 4 * flow_m3_s / (pi * diameter_m**2)
    friction_m = pipe_head_loss_m(flow_m3_s, length_m, diameter_m)
    minor_m = minor_loss_k * velocity**2 / (2 * 9.81)
    total_head = static_head_m + friction_m + minor_m
    duration_h = volume_m3 / flow_m3_s / 3600
    electricity_kwh = 1000 * 9.81 * volume_m3 * total_head / efficiency / 3_600_000
    return {"total_dynamic_head_m": total_head, "friction_head_m": friction_m,
            "minor_loss_head_m": minor_m, "runtime_h": duration_h,
            "electricity_kwh": electricity_kwh,
            "status": "steady_state_scenario_not_pump_curve_validated"}
