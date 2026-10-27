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

## Initial genuine meteorological acquisition (2024)
A reproducible NASA POWER adapter is now committed at `scripts/ingest_nasa_power_daily.py`, with a GitHub Actions job `.github/workflows/oregon-weather-ingest.yml`. The job is configured to acquire **actual externally sourced NASA POWER daily data** for two candidate reference coordinates: Madras (44.63 N, 121.13 W) and Aurora (45.22 N, 122.75 W). These are geographic sampling points, **not confirmed agrivoltaic installations**. Requested year: 2024 (366 days). Parameters: T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M, WS2M, ALLSKY_SFC_SW_DWN.

**Scientific classification:** NASA POWER is an environmental gridded data product, not on-site instrument observations. The source product must be checked against Oregon stations and native product metadata. Daily mean shortwave energy cannot substitute for hourly DNI/DHI in detailed Radiance forcing.

**Evidence gate:** A committed adapter or a green workflow is not proof that raw data were ingested. Before the dashboard reports real-data coverage, inspect the Actions artifact `oregon-nasa-power-source-data`, verify both raw JSON files against manifest SHA-256 hashes, inspect missing-data flags, and document the actual source metadata and date coverage. The CI artifact is retained for 90 days; permanent scientific archiving requires an additional repository/data-store policy.

**Known limitations:** The current QA checks day completeness, missing values and broad physical bounds. It does not yet detect cross-variable inconsistencies, source grid-cell duplication, temporal autocorrelation anomalies or discrepancies with independent AgriMet observations. No scientific model is connected to these inputs yet.
