# Milestone 1 — Oregon-wide data foundation

## Scope and scientific boundary
The software architecture must support all Oregon coordinates, with Central Oregon and the Willamette Valley prioritized for research evaluation. The two reference areas (Madras/Jefferson County and Aurora/North Willamette) are **candidate regional anchors, not confirmed instrumented field sites**. Selection does not imply representativeness, surveyed PV geometry, or access to field observations.

## Current implementation
- Versioned machine-readable source registry at `data_sources/oregon_registry_v01.json`.
- Explicit source types and variable names; all sources initially `registered_not_ingested`.
- Provenance contract: source/version/date, coverage, resolution, units, time zone, checksum, QA flags and transformations.
- Offline structural check at `scripts/validate_oregon_registry.py`.

## Non-negotiable ingestion gates
1. Confirm access terms, product versions, station/grid coverage, native resolution and date range for each source.
2. Download immutable raw data and record SHA-256; never substitute the synthetic EPW fixture.
3. Validate coordinates, CRS, calendar, time zones, leap years, missing data, units and physically impossible values.
4. Preserve raw, QC and model-ready versions with reproducible transformation manifests.
5. Quantify spatial/temporal support and document uncertainty; distinguish station observations from gridded/satellite estimates.
6. Do not label SSURGO map-unit estimates as measured soil hydraulic parameters, nor OpenET field-scale ET as within-array measurements.
7. Use independent benchmarks and observed data for numerical verification and empirical evaluation; track those as separate gates.

## Next engineering action
Implement one source adapter and a reproducible ingestion test using a small genuine source file with its license, acquisition metadata and checksum. A registered URL is not a completed data integration.
