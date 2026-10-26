# CHIPU-FEW Oregon — Agrivoltaic Field Digital Twin v0.1

**Status: scientific-core scaffold with illustrative four-component baseline; NOT an operational or validated digital twin.**

This module is embedded in the existing CHIPU-FEW repository but is independently executable. No frontend, Supabase, telemetry, or production deployment is required.

## Local execution

From `scientific-core/oregon-av`:

```bash
python -m venv .venv
# Activate the virtual environment for your operating system.
python -m pip install -e .
python -m unittest discover -s tests -v
python -m chipu_oregon.baseline --output results/illustrative-baseline.json
```

The initial baseline uses **illustrative values**, not downloaded Aurora observations. It explicitly labels all four simplified calculations. Its only purpose is to establish a testable calculation and output contract:

1. Radiation: assumed ground-transmission fraction (**not ray tracing**).
2. PV: area × irradiation × efficiency × performance ratio (**not pvlib**).
3. Crop and soil water: simplified ET coefficients, storage accounting and irrigation efficiency (**not calibrated FAO-56 dual Kc**).
4. Pumping: hydraulic energy from water volume, total dynamic head and efficiency.

## Scientific upgrade gates

- Obtain authorization and field geometry, soil/crop records, sensor metadata and ownership details for an Oregon research site.
- Create data manifests for each forcing dataset, with dates, coordinates, variables, units, licenses and QC.
- Implement and test `bifacial_radiance` with geometry and spatial irradiance outputs.
- Implement `pvlib` with documented module/inverter/temperature assumptions.
- Implement FAO-56 dual crop coefficients, root-zone water balance and site parameterization.
- Implement pumping with friction losses, pump curve and measured or declared efficiency.
- Add observed-versus-simulated calibration, independent validation, uncertainty and provenance.
- Integrate **versioned outputs only** into the existing CHIPU frontend after scientific review.

## Boundaries

No field-validation claims. No assumed Aurora geometry represented as observed. No synthetic records mislabeled as measurements. Do not merge into main or deploy without review.
