# Forecast forcing contract — pre-data stage

## Scope
`runForecast({initialStateId,horizonHours,stepHours,forcing})` accepts an optional ordered `ForecastForcing[]`. When omitted, deterministic demonstration weather remains the default.

## Temporal conventions
- Exactly one record per forecast lead, including lead 0.
- `leadHours` starts at zero and increments by `stepHours`.
- `precipitationMm` is precipitation **within the preceding forecast step**, not cumulative precipitation.
- `referenceEtMm` is ETo **rate in mm/hour** for the current step, used as `ETo_rate * stepHours * Kc`.
- `shortwaveRadiation` is W/m²; `pvPower` is modeled instantaneous kW.
- At lead 0, precipitation and ETo are not applied to storage.
- A 24-hour Water Intelligence calculation sums all steps with 0 < leadHours <= 24.

## Scientific caveats
- Water forecast still uses a heuristic volumetric-water-content update; no Richards equation or depth-resolved soil transport.
- `pumpingEnergy = irrigationRequirement * 0.34` remains a demonstration multiplier with unresolved physical units. Do not treat as calibrated energy.
- Battery SOC transition uses simplified coefficients; no audited electrical conservation yet.
- PV forecast relies on an assumed initial PV power and fixed reference radiation, not a site-specific PV model.
- `lower*` and `upper*` bands are not calibrated prediction intervals.
- The manual forcing input is a code API, not yet a weather-file importer or UI.
- Legacy forecast runs in IndexedDB may use older semantics. Model version and provenance must be checked before aggregation.

## Required next acceptance work
1. Execute Python unittest and npm build on CI; collect job logs and commit SHA.
2. Implement invariant tests for precipitation accumulation, lead-zero behavior and horizon alignment.
3. Replace forecast soil moisture with a depth-aware bucket in mm or a verified HYDRUS adapter.
4. Replace pumping-energy demonstration multiplier with pump head/flow/efficiency or measured kW × runtime.
5. Add battery energy ledger with charge/discharge efficiency and SOC limits.
6. Create weather forcing import with source, timestamp, time zone, units and QC.
7. Add versioned prediction response with training/validation status and model registry.
