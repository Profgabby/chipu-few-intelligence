# Oregon CHIPU: daily FAO-56 reference ET integration (development gate)

## Input lineage
Original AgriMet station and NASA POWER 2024 archives -> SHA-256 verified raw files -> daily paired CSVs (`MRSO_2024_daily_paired.csv`, `ARAO_2024_daily_paired.csv`) -> **single-source** weather adapter -> FAO-56 daily ET0. The UI currently renders monthly aggregates, not the daily model output.

Each paired CSV requires: `date`, `tmin_c_station`, `tmax_c_station`, `tmean_c_station`, `rh_pct_station`, `wind_m_s_station`, `solar_kwh_m2_day_station` and equivalent `_power` columns. Solar radiation enters as kWh/m²/day and is explicitly multiplied by 3.6 inside `fao56_daily_et0.py` before FAO-56 radiation calculations in MJ/m²/day. The conversion is covered by regression inputs; independent published-benchmark verification is still required.

## Required authoritative metadata
- Station elevations verified from USBR station pages: MRSO 743.71 ft = 226.68 m; ARAO 42.67 ft = 13.01 m. These are station, not proposed field-site, elevations. See `data_sources/agrimet_station_fao56_metadata.json`.
- Wind sensor height in 2024 is **not station-specifically verified**. USBR reports a network change from 2 m to 3 m in 2012, but this is not proof of the 2024 height at MRSO or ARAO. The ET0 function now applies FAO-56 Eq. 47 to convert a **documented** wind height to 2 m; it refuses missing height metadata.
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
1. Confirm authoritative elevation and wind metadata, and independently verify the radiation-unit conversion against a published reference case.
2. Run unit tests and daily calculations for station and gridded sources separately.
3. Compare daily ET0 sensitivity to meteorological input source, with uncertainty and data coverage.
4. Integrate the already-developed solar geometry and PV model with verified plane-of-array weather and surveyed array parameters.
5. Implement soil-water and irrigation energy using measured hydraulic parameters, crops, irrigation system design and management.
6. Only after paired field data are available, calibrate and validate AV/open-field treatment effects.
