# Oregon scientific pipeline

The `POST /runs/research` endpoint executes `chipu_oregon.pipeline.run_daily`.

## Required request fields

- `site`: latitude_deg, longitude_deg, timezone
- `crop_soil`: taw_mm, initial_depletion_mm, readily_available_fraction, basal_kcb, soil_ke
- `irrigation`: field_area_m2, application_efficiency, flow_m3_s, static_head_m, pipe_length_m, pipe_diameter_m, pump_efficiency
- `pv`: pdc0_w, tilt_deg, azimuth_deg, optional albedo
- `records`: chronologically ordered daily entries with date, et0_mm, rain_mm, gross_irrigation_mm, hourly_weather

Each hourly weather entry requires timestamp (ISO-8601 UTC), ghi, dni, dhi (W/m²), temp_air (°C), wind_speed (m/s). Time-index intervals are integrated to obtain DC kWh. The first power sample is excluded from the interval integral.

## Model provenance and boundaries

The PV module uses pvlib plane-of-array irradiance, SAPM cell temperature and PVWatts DC. It does not yet include inverter AC or shading geometry. The crop-water module uses FAO-56 root-zone depletion with externally supplied basal crop coefficient and soil evaporation coefficient. Hydraulics uses Darcy-Weisbach and fixed pump efficiency. All model choices must remain explicit in published outputs.

## Reproducibility

`input_sha256` hashes canonical JSON of the supplied configuration and weather records. The first 20 characters form `run_id`. This identifies inputs, **not** code version. A future run registry must additionally record Git commit, Python and dependency versions, and output hashes. For now, the endpoint returns results without persisting uploaded data.

## Privacy

Do not upload unpublished field datasets to a public cloud endpoint. Run the Python API locally or on an approved OSU-controlled environment for sensitive records.

## Next engineering gates

- Integrate spatial shading/ray tracing and array geometry into the pipeline.
- Add measured irrigation schedules, soil profiles and crop phenology as structured inputs.
- Create a local run registry with code SHA, input/output hashes, and export endpoints.
- Implement paired open-field/AV runs and sensitivity ensembles.
- Isolate the Oregon frontend in its own repository and Vercel project; point it at a separately hosted Python API.
- Run CI and numerical regression tests before enabling production use.
