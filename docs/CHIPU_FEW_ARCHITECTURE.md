# CHIPU-FEW Intelligence Architecture

**Product:** CHIPU-FEW Intelligence  
**Descriptor:** Integrated Predictive Decision Systems for Food–Energy–Water Management

## Decision architecture

```text
People + Place
      ↓
Food ↔ Energy ↔ Water
      ↓
Twin
      ↓
Predict
      ↓
Control
      ↓
Economics + Resilience
      ↓
Decision Support
      ↓
Action / Observation
      ↘ Twin
```

The ten modules are coordinated views over shared scientific state and services. They are not ten independent applications.

## Current feature mapping

| Legacy/current capability | CHIPU-FEW module | Implementation status |
|---|---|---|
| Twin State / Farm Digital Twin | Twin | Existing engines preserved and routed through `/app/twin` plus legacy routes |
| Forecast engine / Uncertainty Explorer | Predict | Forecast engine exposed at `/app/predict`; uncertainty remains a research tool |
| Crop & Harvest / Food Loss & Storage | Food | Existing views preserved; `/app/food` provides module entry point |
| Energy Intelligence | Energy | Existing engine preserved at `/app/energy` |
| Water Intelligence | Water | Existing engine preserved at `/app/water` |
| Stakeholder/adoption context | People | First-class module foundation; no production stakeholder records fabricated |
| Farm/site/agrivoltaic context | Place | First-class module foundation; existing farm/comparison views retained |
| Resource Allocation | Control | Existing consequence-aware engine preserved at `/app/control` and legacy routes |
| Economic/TEA | Economics | First-class module foundation; no production TEA result fabricated |
| Scenario Laboratory | Resilience | Existing scenario engine preserved at `/app/resilience`; uncertainty tools remain available |

## Cross-cutting research utilities

Data & Provenance, Field Data & Sensors, Telemetry, Experiment Registry, Research Export, Models & Methods, and Model Calibration remain shared platform capabilities rather than being duplicated inside scientific modules.

## Backward compatibility

The following legacy identifiers intentionally remain:

- `CropSmartWorkspace` component and other code identifiers whose renaming provides no user benefit
- `cropsmart-*` browser IndexedDB names, event names and cached identifiers
- `cs_*` PostgreSQL production tables
- `CROPSMART_RESEARCH_ADMIN_KEY` and existing server headers/contracts
- repository name and historical release documentation
- Supabase migration history

These identifiers are implementation contracts or historical references. Renaming them is deferred until dependency-safe migration can be demonstrated.

## Scientific capability rule

A module route does not imply that an advanced scientific model exists. Foundation modules show evidence-safe empty states such as "No stakeholder data available", "Add site data", and "Economic model not yet configured" until documented data and models are connected.
