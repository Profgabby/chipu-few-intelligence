# CHIPU-FEW Source-Level Capability Audit

**Audit purpose:** distinguish capabilities present in the repository from research-stage, partially operational, planned, or scientifically unvalidated claims.

## Evidence classification

| Area | Repository evidence | Classification | Qualification |
|---|---|---|---|
| Observation/provenance | observation store, variable registry, QC/provenance separation | Implemented research infrastructure | Presence of infrastructure does not prove measured field data exist |
| Twin State | state engine with state history, uncertainty, freshness and lineage | Implemented research prototype | Scientific validity depends on input evidence and model assumptions |
| Water | water-intelligence engine | Implemented research calculation | Uses state/forecast inputs and documented fallback assumptions; not a field prescription |
| Energy | energy-intelligence engine | Implemented research calculation | Simplified PV/battery/load allocation; not operational dispatch |
| Prediction | forecast engine | Implemented demonstration model | Deterministic demonstration forcing; not field-validated forecasting |
| Scenario analysis | scenario laboratory and experiment registry | Implemented research workflow | Outcomes inherit assumptions and evidence limitations |
| Uncertainty | uncertainty/ensemble and forecast uncertainty logic | Implemented research workflow | Simplified uncertainty representation; not a validated probabilistic forecast |
| Control | resource allocation, forecast-driven control, receding-horizon control | Implemented research-stage decision logic | Not field-validated autonomous control |
| Economics | economics engine | Implemented assumption-driven calculation | Results depend on user inputs; not an investment recommendation |
| Resilience | resilience engine | Implemented research-stage indicator | Composite index is not independently validated |
| Sensors | field-sensor integration, calibration metadata, CSV ingestion and health logic | Implemented software infrastructure | Does not establish physical field deployment |
| Telemetry/database | Netlify telemetry functions and Supabase/PostgreSQL schema | Deployable infrastructure | Requires project configuration; schema existence does not establish active production ingestion |
| Calibration/validation | paired-data metrics and promotion criteria | Implemented tooling | Numerical criteria do not constitute scientific validation |
| Research evidence | experiment registry, evidence graph, research export | Implemented research infrastructure | Supports traceability/reproducibility, not external validation |

## Development-history evidence

The repository history documents a progressive research build:

- **2026-09-02:** reproducible dependency/build/deployment baseline.
- **2026-09-04:** observation/provenance engine, Twin State, forecast, Water Intelligence, Energy Intelligence, resource allocation, scenario laboratory, uncertainty, experiment registry, and research export.
- **2026-09-05:** scientific-model registry and calibration/validation workspace.
- **2026-09-09:** field-sensor integration, telemetry ingestion, authenticated server functions, and persistent research-database infrastructure.
- **2026-09-11:** migration of the active interface to CHIPU-FEW Intelligence, persistent People/Place domains, Economics, Resilience, integrated command center, and cross-module decision-evidence graph.
- **2026-09-14:** forecast-trajectory-driven control and receding-horizon predictive-control research modules.

## Claims that should not be made from this repository alone

The repository does **not** by itself support claims of:

- field validation;
- statistically demonstrated agricultural benefit;
- autonomous farm operation;
- commercial deployment;
- validated resilience measurement;
- operational irrigation prescriptions;
- validated weather/crop/hydrologic forecasting;
- active physical sensor deployment merely because ingestion infrastructure exists; or
- measured production data where records are labeled synthetic, modeled, predicted, estimated, or derived.

## Naming and lineage decision

The canonical research identity is **CHIPU-FEW Intelligence**. The repository is the continuing development history of the earlier **CropSmart Research Digital Twin**. Historical identifiers should remain where required for compatibility and reproducibility. Public documentation should state the evolution explicitly rather than implying that CHIPU-FEW existed under its current name from the repository's first commit.
