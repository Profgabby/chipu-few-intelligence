# Oregon weather-backed dashboard: scientific release boundary

This feature branch's `/oregon-digital-twin` view is backed by **real 2024 meteorological data**, not synthetic observations. Source inputs were supplied as user-uploaded ZIP archives:
- `oregon-agrimet-2024-original.zip`: original USBR AgriMet station archive records for MRSO (Madras) and ARAO (Aurora)
- `oregon-nasa-power-source-data.zip`: original NASA POWER daily gridded estimates and SHA-256 manifest
- `oregon_2024_power_agrimet_comparison.zip`: daily date-aligned source comparison, metrics and methodological notes

The checked-in `src/data/oregonWeather2024.json` is a **monthly aggregation** of the paired daily comparison, not a replacement for the raw archives. The uploaded source ZIPs and 366-day paired CSVs are not yet committed as versioned, publicly downloadable research artifacts. To reproduce this dashboard exactly, preserve those three source archives separately and archive them with permanent identifiers and checksums.

## UI and calculation
- Region selector: Central Oregon (MRSO) / Willamette Valley (ARAO).
- Data selector: AgriMet station observation / NASA POWER gridded estimate.
- Monthly temperature, precipitation, global horizontal irradiation, humidity and wind speed. Precipitation is monthly total; other variables are monthly means.
- Monthly error statistics are **unweighted monthly-aggregate metrics**, not the independent **daily paired** error statistics previously reported.
- Exploratory energy screening: `annual GHI (kWh/m²) × user-specified PV area (m²) × assumed conversion efficiency × assumed derate`. This is a screening proxy only; horizontal irradiation is not plane-of-array irradiance. It does not represent a calibrated electrical PV model or agrivoltaic shading simulation.
- UI data are **static 2024 research records** bundled into the application; selecting a region/source recomputes displays. There is no live weather API subscription or automatic 2025–2026 update.

## Non-negotiable limitations
- MRSO 2024-03-20 precipitation was negative and excluded; March precipitation station total is incomplete.
- NASA POWER radiation source unit MJ/m²/day was converted to kWh/m²/day by dividing by 3.6 before source comparison.
- Daily observation time windows, station representativeness and instrument flags are not fully reconciled.
- Station vs grid differences are **input-source evaluation**, not model validation.
- **No** site-specific FAO-56 ET₀, crop production, soil-water balance, irrigation-energy, calibrated PV, ray-traced shade, or treatment/control response is yet connected. Do not label the exploratory energy result as a validated simulation.
- No observed agrivoltaic array geometry or site survey is included. The user must supply geometry and parameter provenance before advancing to coupled simulations.

## Next engineering gates
1. Version and serve the complete daily datasets and their original SHA-256 manifests from a durable research data store.
2. Implement daily weather adapters with documented unit/time harmonization and independently test each transformation.
3. Add a meteorological acceptance report with monthly/daily error metrics, station coverage, outliers and observational day alignment.
4. Implement FAO-56 Penman–Monteith using validated daily input variables and site elevation; verify against published benchmarks before allowing field-facing claims.
5. Add surveyed array geometry, PV module specifications, measured crop/soil and irrigation records, then run physically coupled AV/open-field scenarios.
