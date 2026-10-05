# CHIPU-FEW Intelligence

**Integrated Food–Energy–Water Decision Framework for Agricultural Systems**

CHIPU-FEW Intelligence is a research-stage computational decision-support prototype for studying interconnected food, water, energy, land, and operational decisions in agricultural systems. It integrates evidence-aware system state estimation, simplified predictive modeling, water and energy analysis, scenario comparison, research-stage control logic, economic assumptions, and resilience indicators.

## Research lineage

CHIPU-FEW Intelligence evolved from the **CropSmart Research Digital Twin** prototype. The existing repository and commit history are intentionally preserved because they document that development pathway. Legacy `CropSmart`, `cropsmart-*`, and `cs_*` identifiers remain where changing them could break persistence, migrations, historical releases, or reproducibility.

The current architecture organizes that earlier work into a broader food–energy–water decision framework:

```text
Observations + Context
        ↓
   Twin State
        ↓
Food ↔ Water ↔ Energy
        ↓
Prediction + Uncertainty
        ↓
Scenarios + Decision/Control Analysis
        ↓
Economics + Resilience
        ↓
Decision Evidence
```

## Implemented research capabilities

- **Evidence and provenance** — persistent observations with explicit source/provenance and quality-control semantics.
- **Twin State** — observation-informed state estimation with uncertainty, freshness, lineage, and state history.
- **Water Intelligence** — root-zone water deficit, crop-water demand, irrigation requirement, irrigation volume, runtime, and pumping-energy calculations.
- **Energy Intelligence** — modeled PV/battery availability and prioritized agricultural load allocation, including pumping and other loads.
- **Prediction** — state-initialized deterministic demonstration trajectories for soil water, tank level, PV power, battery state, crop-water demand, irrigation, and pumping energy, with simplified uncertainty expansion.
- **Scenario analysis** — reproducible comparison of water, energy, environmental, equipment, and management constraints.
- **Decision/control research** — consequence-aware resource allocation, forecast-trajectory analysis, and receding-horizon research logic.
- **Economics** — assumption-driven CAPEX/OPEX, benefits, NPV, lifecycle cost, and payback calculations.
- **Resilience** — transparent scenario-derived continuity, vulnerability, and resilience indicators.
- **Sensors and data** — field-sensor registry, calibration metadata, CSV observation ingestion, sensor-health checks, telemetry/server-function infrastructure, and persistent research-database schema.
- **Research reproducibility** — experiment registry, model/version tracking, calibration/validation workspace, evidence graph, and research export functions.

## Research status and limitations

This repository is a **research demonstrator**, not a validated farm-management product.

- Demonstration datasets and generated observations are explicitly labeled synthetic, modeled, estimated, predicted, or derived.
- The current forecast engine uses deterministic demonstration forcing and simplified water–energy propagation; it is not a field-validated weather, crop, or hydrologic forecasting system.
- Water and energy outputs depend on available state observations and documented assumptions or fallback values and are not field prescriptions.
- Economics outputs depend on user-entered assumptions and are not investment recommendations.
- The resilience index is a transparent research-stage indicator and has not been independently validated as a resilience metric.
- Sensor-ingestion and server/database infrastructure do not, by themselves, establish field deployment or measured-data availability.
- Forecast-driven and receding-horizon control modules are research-stage decision analyses and **do not represent field-validated autonomous control**.
- Calibration/validation tooling computes standard performance metrics, but passing software criteria does not establish scientific validation; dataset provenance, representativeness, residual behavior, and applicability still require scientific review.

## Intended research use

The prototype is intended to support investigation of how agricultural decision frameworks can jointly represent water requirements, pumping energy, renewable-energy availability, crop/food consequences, operational constraints, uncertainty, economic assumptions, and resilience under alternative management scenarios.

Agrivoltaics can serve as one application environment for this broader framework, but the architecture is designed around transferable food–energy–water decision methods rather than a single technology or farm configuration.

## Research documentation

For source-level scope, methods and claim boundaries, see:

- [Research architecture](docs/ARCHITECTURE.md)
- [Source-level capability audit](docs/CHIPU_FEW_SOURCE_AUDIT.md)
- [Evidence and provenance](docs/EVIDENCE_AND_PROVENANCE.md)
- [Model and method matrix](docs/MODEL_METHOD_MATRIX.md)
- [Implemented vs. research-stage status](docs/IMPLEMENTATION_STATUS.md)
- [CropSmart → CHIPU-FEW evolution](docs/CROPSMART_TO_CHIPU_FEW_EVOLUTION.md)
- [Screenshot and demonstration evidence guide](docs/SCREENSHOTS.md)

## Development

```bash
npm install
npm run dev
npm run build
```

The repository includes browser-local scientific stores, React/TypeScript research interfaces, Netlify server functions, and Supabase/PostgreSQL migration infrastructure. Deployment of server persistence requires explicit project configuration and credentials as documented under `docs/`.

## Repository evolution

Historical CropSmart releases, commits, scientific engines, routes, and persistence contracts are retained to preserve a truthful and reproducible development record. CHIPU-FEW is an evolution of that work, not a replacement history.
