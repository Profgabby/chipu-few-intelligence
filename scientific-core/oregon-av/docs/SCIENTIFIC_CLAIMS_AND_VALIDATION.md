# Scientific claims, falsifiable tests and Oregon validation gates

## Dissertation research question

How do agrivoltaic array geometry and local weather conditions change the
coupled trade-offs among ground irradiance, PV generation, crop-water demand,
irrigation requirements, and pumping energy relative to an open-field reference?

## Model hierarchy and evidence levels

1. **Unit benchmark**: transparent dimensional equations; unit tests only.
2. **Component model**: independently tested ray tracing, pvlib PV conversion,
   full FAO-56 dual-Kc calculations and hydraulic network/pump curve.
3. **Coupled research model**: documented transfer of irradiance and microclimate
   effects to ET, soil-water balance and pumping; conservation diagnostics.
4. **Site-calibrated model**: parameters estimated from authorized Oregon
   observations, with documented objective function and identifiability.
5. **Independently validated twin**: predictions tested against held-out
   field observations, uncertainty coverage and bias reported.

Current work is at level 1, with partial components at level 2. Do not claim
that unit-test success proves a field-validated digital twin.

## Required empirical observations

- Site: permission, GPS/reference grid, panel dimensions, row pitch, height,
  tilt, orientation, module/inverter nameplate and power time series.
- Radiation: global/diffuse weather forcing, spatial ground irradiance under
  panels and in open-field controls, timestamp and sensor calibration.
- Crop and water: crop identity, planting and harvest dates, canopy stages,
  soil texture and hydraulic parameters, soil moisture by depth, rain,
  irrigation amounts, and ideally ET/microclimate measurements.
- Hydraulics: irrigation system layout, pipe lengths/diameters, flow,
  static/dynamic head, pump efficiency/curve and metered electricity.
- Data governance: instrument custodian, owner, license, permitted use,
  QA/QC and missing-data policy.

## Falsifiable hypotheses (not findings)

H1: A site-calibrated shading model predicts spatial irradiance under
the existing array with smaller held-out error than a uniform-transmission
baseline.

H2: A coupled crop-water model predicts observed root-zone soil-water
dynamics more accurately than an otherwise equivalent open-field forcing
baseline when the site has a measurable shading signal.

H3: Alternative geometry scenarios reveal an electricity-versus-irrigation
trade-off whose direction and magnitude are sensitive to weather, crop stage,
and parameter uncertainty.

## Evaluation protocol

Predefine temporal holdout and avoid leakage between calibration and
validation. Report bias, MAE, RMSE, residual autocorrelation, and prediction
interval coverage where justified. Compare against open-field and simplified
benchmarks. Report failed hypotheses and uncertainty without cherry-picking.
Maintain an immutable run manifest (code commit, input checksums, parameters,
units, execution environment, timestamps) for every scientific result.

## No-go conditions

No field access: report simulation study, not validated field twin.
No observed PV: PV component is a simulation, not field validated.
No observed pump operation: hydraulic energy is a scenario calculation.
No irradiance/soil observations: coupled site validation is incomplete.
No independent holdout: do not claim predictive validation.
