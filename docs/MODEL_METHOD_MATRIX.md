# CHIPU-FEW Model and Method Matrix

| Capability | Primary implementation | Method represented | Current status | Validation / claim boundary |
|---|---|---|---|---|
| Observation evidence | `observation-store.ts` | Controlled variables, provenance, QC, persistence, CSV/manual ingestion | Implemented research infrastructure | Accepted data are not automatically scientifically validated |
| Twin State | `state-engine.ts` | Latest eligible evidence, freshness, heuristic uncertainty, assimilation weighting | Research model | Internal check; not an independently validated state estimator |
| Water | `water-intelligence-engine.ts` | Root-zone deficit + crop-water demand − effective precipitation; irrigation efficiency; runtime and pump-energy linkage | Research model | Not crop/site calibrated; not an irrigation prescription |
| Energy | `energy-intelligence-engine.ts` | PV/battery availability and prioritized load allocation | Research model | Simplified energy balance; not electrical dispatch/control |
| Prediction | `forecast-engine.ts` | Deterministic forcing + simplified water-energy state propagation + uncertainty expansion | Demonstration model | Not calibrated/field validated; intervals are not calibrated confidence intervals |
| Resource allocation | `resource-allocation-engine.ts` | Weighted agricultural consequence scoring across competing loads | Research decision model | Weights and risk indices require empirical/decision validation |
| Scenario laboratory | `scenario-laboratory-engine.ts` | Explicit perturbation multipliers + strategy comparison + reproducibility key | Implemented research workflow | Scenario multipliers are assumptions, not measured response coefficients |
| Forecast control | `forecast-control-engine.ts` | Full-trajectory strategy evaluation | Research-stage predictive decision analysis | Not autonomous field control |
| Receding-horizon control | `receding-horizon-control-engine.ts` | Moving lookahead, current-step modeled action, modeled state update | Research-stage predictive controller | Not field-validated autonomous operation |
| Economics | `economics-engine.ts` | CAPEX/OPEX, benefits, NPV, lifecycle cost, simple/discounted payback | Implemented assumption-driven model | Depends on entered assumptions; not investment advice |
| Resilience | `resilience-engine.ts` | Weighted water/energy/food/critical-load continuity and vulnerability | Research-stage indicator | Composite weights/index not independently validated |
| Sensors | `field-sensor-integration-engine.ts` | Registry, calibration metadata, observed-data ingestion, health/staleness checks | Implemented software infrastructure | Does not prove physical deployment |
| Telemetry/database | Netlify functions + Supabase migrations | Authenticated telemetry/research records and PostgreSQL persistence | Deployable infrastructure | Requires configured deployment; code does not prove active ingestion |
| Calibration/validation | `model-calibration-validation-engine.ts` | MAE, RMSE, bias, R², NRMSE and review-gate criteria | Implemented tooling | Passing criteria does not equal scientific validation |
| Research evidence | experiment registry + research export + evidence graph | Model/parameter versions, lineage, assumptions and machine-readable evidence | Implemented research infrastructure | Traceability/reproducibility are distinct from external validation |
| Food/crop representation | farm state + forecast/scenario/allocation/resilience layers | Crop-water demand, crop-risk and food-loss consequence representation | Distributed research representation | No standalone validated crop-growth/yield engine is established by current source |
