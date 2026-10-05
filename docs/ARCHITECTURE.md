# CHIPU-FEW Intelligence — Research Architecture

## Purpose

CHIPU-FEW Intelligence is a research-stage computational decision-support architecture for interconnected agricultural food, water, energy, context, prediction, scenario, control, economics, and resilience analysis.

## Logical architecture

```text
FIELD / RESEARCH EVIDENCE
  measured | manual | synthetic | modeled | predicted | derived
                         |
                         v
              Observation + Provenance Layer
                         |
                         v
                 Twin State Engine
        quality | freshness | uncertainty | lineage
                         |
          +--------------+--------------+
          |                             |
          v                             v
 Water Intelligence              Energy Intelligence
 irrigation need                 PV/battery availability
 volume/runtime                  agricultural load allocation
 pumping-energy linkage          water-energy intensity
          |                             |
          +--------------+--------------+
                         |
                         v
                 Prediction Layer
        deterministic demonstration forcing
        water-energy state propagation
        lead-dependent uncertainty
                         |
                         v
                 Scenario Laboratory
       transparent perturbations + reproducibility
                         |
                         v
               Decision / Control Layer
 consequence-aware allocation | forecast-driven analysis
             receding-horizon research logic
                         |
              +----------+----------+
              |                     |
              v                     v
         Economics              Resilience
      assumption-driven       scenario-derived
      NPV/payback/costs       continuity/vulnerability
              |                     |
              +----------+----------+
                         |
                         v
             Decision Evidence + Export
       experiment registry | model versions | lineage
```

## Data and evidence boundary

Browser-local IndexedDB stores support observations, Twin States, forecasts, scenarios, experiments and several analytical records. A server-side research persistence path also exists through Netlify functions and Supabase/PostgreSQL migrations. The server layer is deployable infrastructure, but it is not considered active merely because the code/schema exists.

## Domain interpretation

### Food / crop
Food and crop consequences are represented across the demonstration farm state, forecast crop-water demand, allocation crop-risk/food-loss indices, scenario perturbations, and resilience assessment. The repository does not currently contain a standalone field-validated crop-growth/yield model.

### Water
The Water Intelligence engine calculates root-zone deficit, crop-water demand contribution, effective precipitation, irrigation requirement, volume, runtime and pumping-energy linkage.

### Energy
The Energy Intelligence engine estimates available PV/battery energy and allocates energy to pumping, cooling, processing and other critical loads under explicit priorities.

### Prediction
The forecast engine propagates state using deterministic demonstration forcing and simplified process relationships. It is architectural research code, not a validated forecasting service.

### Control
Control is implemented as research-stage allocation and predictive decision logic. It evaluates modeled strategies and state updates; it does not actuate field hardware and must not be represented as autonomous farm control.

### Economics and resilience
Economics uses explicit entered assumptions. Resilience is a transparent composite indicator derived from scenario/control outputs. Neither should be represented as independently validated outcome prediction.

## Persistence and compatibility

Legacy `CropSmart`, `cropsmart-*`, and `cs_*` names remain in internal database names, tables, migrations, historical documents and compatibility contracts where changing them would impair reproducibility or persisted-data compatibility. They document lineage rather than current product identity.
