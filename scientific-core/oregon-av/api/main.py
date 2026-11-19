"""Independent Oregon research API. No main CHIPU-FEW dependencies."""
from __future__ import annotations

from dataclasses import asdict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from chipu_oregon.coupled import Scenario, simulate

app = FastAPI(title="CHIPU-FEW Oregon Scientific API", version="0.1.0")
# Local development origin only; configure deployment origins explicitly later.
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["GET", "POST"], allow_headers=["Content-Type"])

class ScenarioInput(BaseModel):
    irradiation_kwh_m2: float = Field(default=4.0, ge=0)
    ground_transmission: float = Field(default=0.65, ge=0, le=1)
    panel_area_m2: float = Field(default=10, ge=0)
    pv_efficiency: float = Field(default=0.18, ge=0, le=1)
    pv_performance_ratio: float = Field(default=0.8, ge=0, le=1)
    et0_mm: float = Field(default=4, ge=0)
    kcb: float = Field(default=0.85, ge=0)
    ke: float = Field(default=0.15, ge=0)
    shade_et_factor: float = Field(default=0.85, ge=0, le=1)
    rain_mm: float = Field(default=0, ge=0)
    soil_initial_mm: float = Field(default=80, ge=0)
    soil_field_capacity_mm: float = Field(default=100, gt=0)
    gross_irrigation_mm: float = Field(default=5, ge=0)
    irrigation_efficiency: float = Field(default=0.8, gt=0, le=1)
    field_area_m2: float = Field(default=100, gt=0)
    flow_m3_s: float = Field(default=0.001, gt=0)
    static_head_m: float = Field(default=10, ge=0)
    pipe_length_m: float = Field(default=100, ge=0)
    pipe_diameter_m: float = Field(default=0.05, gt=0)
    pump_efficiency: float = Field(default=0.6, gt=0, le=1)

@app.get("/health")
def health():
    return {"status": "ok", "service": "oregon-python-scientific-core", "validated": False}

@app.get("/models")
def models():
    return {"models": ["illustrative-coupled-few"], "classification": "synthetic_scenario_not_field_validated", "default_parameters": asdict(Scenario())}

@app.post("/simulate/coupled")
def simulate_coupled(request: ScenarioInput):
    try:
        return simulate(Scenario(**request.model_dump()))
    except (ValueError, ZeroDivisionError, OverflowError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
