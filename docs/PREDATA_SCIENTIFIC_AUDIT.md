# CHIPU-FEW scientific audit — incremental checkpoint

Status: source-reviewed, not field-validated; CI and integration tests require independent confirmation.

## Existing engines
| Engine | Current method | Priority scientific gap |
|---|---|---|
| Forecast | fixed deterministic diurnal forcing, crop ET multiplier 0.78, assumed irrigation/pumping conversion, linear lead-time uncertainty | real meteorological forcing, explicit units and conservation, calibrated uncertainty |
| Water | soil-water deficit using hardcoded effective depth 120 mm; ET fallback 4.8 mm; assumed efficiency 0.9; observed flow/power if available | parameterized soil depth, forcing time alignment, robust missing-data behavior |
| Energy | trapezoidal PV forecast integration; battery reserve approximation; fixed cooling/processing demand | battery conversion losses, timestep consistency, validated PV model and load profiles |
| State | latest eligible evidence with heuristic weighting | observation error model and time-aware assimilation |
| Scenarios/control | assumed perturbations and weighted decision logic | parameter identification and out-of-sample policy evaluation |

## Changes on this branch
- Python water, ET, pumping and PV reference calculations; statistical diagnostics and parameter-sensitivity Monte Carlo.
- TypeScript equivalents exposed as pure library functions.
- Water and Energy Intelligence call shared measured-power integration and reject invalid user settings.
- Seeded synthetic bucket generator and chronological ridge-regression benchmark are **offline research tools**, not connected to browser inference.
- GitHub Actions configured for Python tests and TypeScript build.

## Blocking scientific questions
1. What are the units and effective root depth of `soil_water_rootzone`? Current water deficit assumes volumetric content and 120 mm effective depth; soil profile calibration is required.
2. Are `forecast.points[].pvPower` values instantaneous kW, and do timestamps cover the complete horizon? Otherwise trapezoidal kWh integration can misrepresent energy.
3. Is `forecast.points[].forcing.precipitationMm` per step or cumulative? The current Water Intelligence selects a 24-hour point, not necessarily a 24-hour total.
4. Are pump power and water flow synchronous measurements? Mixing stale sensor values biases intensity.
5. How are site/crop/season split boundaries enforced to prevent leakage?

## Acceptance gates
- Python unittest pass in GitHub Actions.
- TypeScript production build pass.
- Regressions for energy conservation, missing data, zero/invalid inputs and forecast horizon.
- Synthetic data never displayed as field-validated or calibrated coverage.
- Field-data schema, unit conversion, provenance and temporal split reviewed.
- No merge to main before checks and review.
