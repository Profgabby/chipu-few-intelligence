# Oregon CHIPU: daily FAO-56 reference ET integration (development gate)

## Input lineage
Original AgriMet station and NASA POWER 2024 archives -> SHA-256 verified raw files -> daily paired CSVs (`MRSO_2024_daily_paired.csv`, `ARAO_2024_daily_paired.csv`) -> **single-source** weather adapter -> FAO-56 daily ET0. The UI currently renders monthly aggregates, not the daily model output.

Each paired CSV requires: `date`, `tmin_c_station`, `tmax_c_station`, `tmean_c_station`, `rh_pct_station`, `wind_m_s_station`, `solar_kwh_m2_day_station` and equivalent `_power` columns. Solar kWh/m²/day is converted to MJ/m²/day by multiplying by 3.6 inside FAO-56 model preparation? **No:** `fao56_daily_et0.py` currently expects `solar_kwh_m2_day` but the ET0 function expects MJ/m²/day. The adapter passes kWh values unchanged, so **do not execute the model for research until the unit conversion is applied**. This gate is documented explicitly to prevent silent physical errors.

## Required authoritative metadata
- Exact station elevation (m, vertical datum and source)
- Wind sensor height and whether `wind_m_s` is 2 m equivalent; adjust using FAO-56 log-wind profile only with documented height
- Station data day boundary, UTC/local time and solar accumulation convention
- Radiation source units, humidity method, station instrument QC

## Daily QA
- Complete 366-day coverage for leap year 2024
- All seven variables finite and in physically reasonable ranges
- Temperature order and wind speed bounds
- No missing-day imputation
- Preserve SHA-256 of input CSV and per-day flags
- Reference ET0 calculation is not crop evapotranspiration, not soil-water balance, and not empirical agrivoltaic validation.

## Development order
1. Confirm authoritative elevation and wind metadata, and correct the explicit radiation unit gate.
2. Run unit tests and daily calculations for station and gridded sources separately.
3. Compare daily ET0 sensitivity to meteorological input source, with uncertainty and data coverage.
4. Integrate the already-developed solar geometry and PV model with verified plane-of-array weather and surveyed array parameters.
5. Implement soil-water and irrigation energy using measured hydraulic parameters, crops, irrigation system design and management.
6. Only after paired field data are available, calibrate and validate AV/open-field treatment effects.
