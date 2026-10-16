# Geometry Registry v0.1

All 20 geometries are illustrative, not measured, manufacturer-certified or field-validated. SS, MS, CS and RT have five records each. The RT family is not yet executable in the web Model Laboratory.

The registry validates pitch, projected overlap, GCR, clearance, angle ranges, module count, efficiencies and STC nominal capacity. Its solar, shading, radiation and PV functions are preliminary screening equations; they do not represent validated 3D ray tracing, tracking, bifacial irradiance, canopy microclimate or HYDRUS coupling. Crop ETo remains externally specified, not inferred from shading.

## Proposed database tables (not deployed)

- av_designs: immutable design identifiers and family
- geometry_revisions: versioned dimensions, archetype and evidence class
- pv_component_specs: module and inverter specification references
- crop_layouts: crop spacing and irrigation arrangement
- site_configurations: coordinates and forcing references
- simulation_runs: input snapshots, geometry revision, engine version, forcing provenance and results
- parameter_evidence: source, evidence class and uncertainty per parameter

Before database migration, review existing authentication, database schemas and row-level security. Do not equate browser-local profiles with server-persisted research records.

## Required next acceptance tests

Test 20 geometry records; invalid pitch, overlap, angle, efficiency and capacity rejection; solar position against reference ephemerides; direct/diffuse radiation conservation; PV output and temperature response; independent crop ETo; site forcing completeness and units; browser acceptance; reproducible run manifests. None of these checks establishes field validation. Do not merge to main or deploy production before the gates pass.
