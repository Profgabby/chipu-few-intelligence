"""Independent Oregon research API. No main CHIPU-FEW dependencies."""
from __future__ import annotations

from dataclasses import asdict, replace
import csv
import io
import math
import os
from datetime import date
from fastapi import UploadFile, File, Form
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from chipu_oregon.coupled import Scenario, simulate
from chipu_oregon.pipeline import Site, CropSoil, Irrigation, PV, run_daily
from chipu_oregon.paired import DailyForcing, paired_run
from chipu_oregon.radiance_geometry import ArrayGeometry
from chipu_oregon.registry import save_run, list_runs
from pathlib import Path

app = FastAPI(title="CHIPU-FEW Oregon Scientific API", version="0.1.0")
# Local development origin only; configure deployment origins explicitly later.
app.add_middleware(CORSMiddleware, allow_origins=[origin.strip() for origin in os.getenv("OREGON_ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origin.strip()], allow_methods=["GET", "POST"], allow_headers=["Content-Type"])

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

@app.post("/simulate/dataset")
async def simulate_dataset(
    file: UploadFile = File(...),
    panel_area_m2: float = Form(26.4),
    pv_efficiency: float = Form(0.20),
    pv_performance_ratio: float = Form(0.85),
):
    """Run the existing coupled Python model against uploaded daily forcing.
    
    Expected CSV: date,irradiation_kwh_m2,et0_mm,rain_mm
    Files are processed in memory, not saved to a server.
    """
    if not 0 < panel_area_m2 <= 100000 or not 0 < pv_efficiency <= 1 or not 0 < pv_performance_ratio <= 1:
        raise HTTPException(422, "Invalid PV configuration")
    raw = await file.read(10_000_001)
    if len(raw) > 10_000_000:
        raise HTTPException(413, "CSV exceeds 10 MB")
    try:
        reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig")))
        required = {"date", "irradiation_kwh_m2", "et0_mm", "rain_mm"}
        if not required.issubset(set(reader.fieldnames or [])):
            raise ValueError("Required CSV columns: date, irradiation_kwh_m2, et0_mm, rain_mm")
        output = []
        soil = Scenario().soil_initial_mm
        dates = set()
        previous_date = None
        for row in reader:
            if len(output) >= 3660:
                raise ValueError("Maximum 3660 daily rows")
            day = row["date"].strip()
            parsed_day = date.fromisoformat(day)
            if day in dates or (previous_date is not None and parsed_day <= previous_date):
                raise ValueError("Dates must be unique and strictly increasing")
            previous_date = parsed_day
            dates.add(day)
            forcing = {key: float(row[key]) for key in ("irradiation_kwh_m2", "et0_mm", "rain_mm")}
            if any(not math.isfinite(value) or value < 0 for value in forcing.values()):
                raise ValueError("Forcing values must be finite and nonnegative")
            scenario = replace(Scenario(), **forcing, panel_area_m2=panel_area_m2,
                pv_efficiency=pv_efficiency, pv_performance_ratio=pv_performance_ratio,
                soil_initial_mm=soil)
            result = simulate(scenario)
            soil = result["water"]["ending_storage_mm"]
            output.append({"date": day, **result})
        if not output:
            raise ValueError("CSV has no rows")
    except (UnicodeError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(422, detail=str(exc)) from exc
    summary = {
        "pv_electricity_kwh": sum(day["pv_electricity_kwh"] for day in output),
        "pumping_electricity_kwh": sum(day["pumping"]["electricity_kwh"] for day in output),
        "evapotranspiration_mm": sum(day["water"]["et_mm"] for day in output),
        "drainage_mm": sum(day["water"]["drainage_mm"] for day in output),
        "final_soil_storage_mm": soil,
        "max_abs_water_balance_residual_mm": max(abs(day["water"]["mass_balance_residual_mm"]) for day in output),
    }
    return {"rows": len(output), "summary": summary, "daily": output, "model": "chipu_oregon.coupled.simulate",
            "source_filename": file.filename}

class ResearchRunInput(BaseModel):
    site: dict
    crop_soil: dict
    irrigation: dict
    pv: dict
    records: list[dict] = Field(min_length=1, max_length=3660)

@app.post("/runs/research")
def research_run(request: ResearchRunInput):
    """Execute Python PVWatts DC, FAO-56 root-zone, and hydraulic models."""
    try:
        return run_daily(
            Site(**request.site), CropSoil(**request.crop_soil),
            Irrigation(**request.irrigation), PV(**request.pv), request.records)
    except (ValueError, TypeError, KeyError, ZeroDivisionError, OverflowError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

class PairedInput(BaseModel):
    geometry: dict
    scenario: ScenarioInput
    records: list[dict] = Field(min_length=1, max_length=3660)
    av_et_multiplier: float = Field(default=1.0, ge=0, le=1)
    save_local: bool = False
    label: str = Field(default="", max_length=120)

@app.post("/runs/paired")
def run_paired(request: PairedInput):
    """Execute matched Oregon open-field/AV runs using Python geometry and FEW modules."""
    try:
        result = paired_run(ArrayGeometry(**request.geometry),
            Scenario(**request.scenario.model_dump()),
            [DailyForcing(**row) for row in request.records],
            av_et_multiplier=request.av_et_multiplier)
        if request.save_local:
            root = os.getenv("OREGON_LOCAL_RUN_DIR")
            if not root:
                raise HTTPException(409, "Local run registry is not configured")
            result["registry"] = save_run(root, result, label=request.label)
        return result
    except (ValueError, TypeError, KeyError, ZeroDivisionError, OverflowError) as exc:
        raise HTTPException(422, detail=str(exc)) from exc

@app.get("/runs/local")
def local_runs():
    root = os.getenv("OREGON_LOCAL_RUN_DIR")
    if not root:
        raise HTTPException(409, "Local run registry is not configured")
    return {"runs": list_runs(root)}
