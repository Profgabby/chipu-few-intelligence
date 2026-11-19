"""Independent Oregon research API. No main CHIPU-FEW dependencies."""
from __future__ import annotations

from dataclasses import asdict, replace
import csv
import io
from fastapi import UploadFile, File, Form
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
        for row in reader:
            if len(output) >= 3660:
                raise ValueError("Maximum 3660 daily rows")
            day = row["date"].strip()
            if not day or day in dates:
                raise ValueError("Date missing or duplicated")
            dates.add(day)
            forcing = {key: float(row[key]) for key in ("irradiation_kwh_m2", "et0_mm", "rain_mm")}
            if any(not __import__("math").isfinite(value) or value < 0 for value in forcing.values()):
                raise ValueError("Forcing values must be finite and nonnegative")
            scenario = replace(Scenario(), **forcing, panel_area_m2=panel_area_m2,
                pv_efficiency=pv_efficiency, pv_performance_ratio=pv_performance_ratio,
                soil_initial_mm=soil)
            result = simulate(scenario)
            soil = result["water"]["soil_final_mm"]
            output.append({"date": day, **result})
        if not output:
            raise ValueError("CSV has no rows")
    except (UnicodeError, ValueError, KeyError, TypeError) as exc:
        raise HTTPException(422, detail=str(exc)) from exc
    return {"rows": len(output), "daily": output, "model": "chipu_oregon.coupled.simulate",
            "source_filename": file.filename}
