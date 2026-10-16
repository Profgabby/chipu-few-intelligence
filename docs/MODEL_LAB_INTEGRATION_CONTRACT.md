# Model Laboratory integration contract — v0.1 research

## Architecture decision
All model designs use a shared water/energy/scenario scientific engine. Model geometry and microclimate are inputs, not separate hardcoded governing equations.

The **proposed** ID family is SS01–SS05, MS01–MS05, CS01–CS05, RT01–RT05 (20 configurations), plus OPEN_FIELD. This research registry is not yet confirmed as matching the application's existing Model Laboratory catalogue. The actual application catalogue must be reconciled before wiring UI selectors.

## Required per-model parameter provenance
- PV area, module efficiency, performance ratio, row geometry and tracker configuration
- Ground-cover ratio, panel clearance, orientation, tilt, spacing and transmitted radiation
- Crop, phenology, Kc, effective root depth, soil hydraulic parameters and irrigation efficiency
- Weather forcing with units and timestamps; AV and open-field microclimate forcing must be explicitly supplied or derived by a validated shading/microclimate method
- Pump head, flow or water volume, electrical efficiency, and battery constraints
- Source type: measured, externally modeled, manually entered or synthetic

## Modules used for every design
1. Water: explicit root-zone mass balance; later HYDRUS profile adapter.
2. Energy: physical pump and PV equations with consistent units.
3. Statistics: reproducible metrics and chronological splits.
4. Benchmarks: seeded synthetic tests; no fabricated field observations.
5. Scenario comparison: paired open-field versus AV, identical area and aligned forcing.
6. Reporting: include model ID, input provenance, parameter versions, equations, warnings and uncertainty status.

## Current code integration
`research/predata/model_lab.py` provides a pure, offline scientific baseline for all proposed IDs, paired comparison and validation. It is **not** connected to the browser Model Laboratory, persistence, HYDRUS output importer, or historical weather ingestion. Those remain release-blocking integration tasks.

## Scientific restrictions
No fixed shading coefficient, crop-yield gain, evapotranspiration reduction or PV increase is assigned merely from an AV design ID. Model-specific performance must follow actual geometry, forcing, calibration or explicitly labeled assumptions.

## Release gates
- Verify actual Model Laboratory catalogue and map stable IDs.
- Connect user-selected model to a versioned prediction request and result.
- Add weather/HYDRUS import adapters and unit/QC checks.
- Add browser workflow, storage, export and permission tests.
- Run CI and archive passing evidence for the exact release commit.
- No production merge without review and authorization.
