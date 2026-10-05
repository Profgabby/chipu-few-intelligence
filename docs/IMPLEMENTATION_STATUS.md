# What Is Implemented vs. What Remains Research

## Implemented in source

The repository currently contains working software paths for evidence/provenance management, Twin State construction, water analysis, energy analysis, deterministic prediction, scenario experiments, uncertainty workflows, resource-allocation analysis, forecast-driven and receding-horizon decision logic, assumption-driven economics, scenario-derived resilience, sensor registration/ingestion/health, telemetry/server persistence infrastructure, experiment tracking, model registration, calibration/validation metrics, evidence lineage and research export.

“Implemented” means source code and associated interface/infrastructure exist. It does **not** mean scientifically or operationally validated.

## Implemented but research-stage

The principal scientific/decision models remain research-stage because important parameters and relationships are simplified, heuristic, demonstration-based, assumption-driven, internally checked, or not yet validated against independent field datasets.

This category includes:
- Twin State uncertainty/assimilation logic;
- water requirement calculations;
- energy availability/allocation;
- resource-allocation consequence scoring;
- scenario multipliers;
- forecast-driven control;
- receding-horizon control;
- economics;
- resilience scoring; and
- crop/food consequence representation.

## Demonstration-specific

The forecast engine currently uses deterministic demonstration forcing. Synthetic observations and demonstration farm states/scenarios are present. Agrivoltaic scenario multipliers are explicitly illustrative and are not measured agrivoltaic performance coefficients.

## Infrastructure requiring deployment/configuration

Server telemetry and persistent research-database code require a selected Supabase project, applied migrations and deployment secrets/configuration. Field-sensor software requires actual instruments/gateways and defensible calibration/provenance before it can support field-data claims.

## Remaining scientific work

Priority research work includes:
1. ingesting documented field observations with calibration and provenance;
2. replacing or augmenting demonstration forcing with defensible external/observed forcing;
3. crop/site calibration of water and crop consequence relationships;
4. empirical validation of energy, irrigation and coupled FEW calculations;
5. out-of-sample validation with independent datasets;
6. sensitivity and uncertainty analysis tied to empirical parameter distributions;
7. validation of consequence weights and resilience constructs;
8. comparison against established baselines/models;
9. field evaluation of decision recommendations; and
10. only after appropriate safety/validation work, evaluation of any hardware-in-the-loop or operational control pathway.

## Safe summary

A defensible description today is:

> CHIPU-FEW Intelligence is an implemented research-stage computational decision-support prototype with integrated evidence, Twin State, water, energy, prediction, scenario, control-analysis, economics, resilience, sensor/data and reproducibility infrastructure. Its current scientific models include demonstration and assumption-driven components and should not be represented as field-validated autonomous agricultural management.
