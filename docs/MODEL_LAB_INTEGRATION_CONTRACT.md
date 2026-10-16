# Model Laboratory integration contract — v0.1 research

## Architecture decision
All model designs use a shared water/energy/scenario scientific engine. Model geometry and microclimate are inputs, not separate hardcoded governing equations.

The **verified application catalogue** in `src/lib/avModelLaboratory.ts` has 15 models: SS01–SS05, MS01–MS05, CS01–CS05. RT01–RT05 are not present in the live catalogue. The separate Python research registry includes five proposed RT configurations; they are NOT selectable in the UI and must not be counted as integrated. OPEN_FIELD is an analytical comparison baseline, not an AV gallery card.

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
`research/predata/model_lab.py` provides a pure, offline scientific baseline for all proposed IDs, paired comparison and validation. The browser Model Laboratory now invokes a TypeScript versioned screening adapter (`src/lib/versioned-av-prediction.ts`) for each selected registered design. The Python scientific module is **not** connected to the browser runtime, persistence, HYDRUS output importer, or historical weather ingestion. Those remain release-blocking integration tasks.

## Scientific restrictions
No fixed shading coefficient, crop-yield gain, evapotranspiration reduction or PV increase is assigned merely from an AV design ID. Model-specific performance must follow actual geometry, forcing, calibration or explicitly labeled assumptions.

## Release gates
- Verified: actual 15-model catalogue and stable IDs. Reconcile Python registry before promoting it as a backend.
- Connect user-selected model to a versioned prediction request and result.
- Add weather/HYDRUS import adapters and unit/QC checks.
- Add browser workflow, storage, export and permission tests.
- Run CI and archive passing evidence for the exact release commit.
- No production merge without review and authorization.
