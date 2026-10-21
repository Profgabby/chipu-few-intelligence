# Daily Model Laboratory contract (development)

Actual gallery: 15 models SS01–SS05, MS01–MS05, CS01–CS05. The same daily water and energy equations accept all 15 IDs.

## Inputs
- Date: contiguous UTC calendar dates YYYY-MM-DD
- precipitationMm: mm/day
- etoMm: mm/day
- irradiationKwhM2: daily PV plane-of-array irradiation, kWh/m²/day
- cropCoefficient: dimensionless, supplied
- transmittedFraction: dimensionless, supplied, 0–1 (used only for reported ground-level transmitted irradiation)
- initialStorageMm, capacityMm, targetStorageMm: root-zone water depth in mm
- irrigatedAreaM2, pvAreaM2: m²
- pumpHeadM: m; pumpEfficiency: 0–1
- pvModuleEfficiency, performanceRatio: 0–1
- irrigationEfficiency: 0–1

## Model behavior
- Water mass balance uses a bucket with actual ET limited by available water; excess is labeled drainage.
- Irrigation is determined from a storage target after daily rainfall and ET demand.
- Pumping electricity uses gross applied water volume and total dynamic head.
- PV energy uses supplied plane-of-array irradiation, panel area and efficiencies.
- No shading reduction in ET is invented from model ID. A microclimate-derived ETo must be provided for each scenario.
- Water residual is returned per day; no calibration/field validation claim.
- Pairwise comparison requires identical daily date coverage and distinct registered models.

## Integration status
Implemented as pure TypeScript functions:
- src/lib/av-timeseries-engine.ts
- src/lib/av-timeseries-statistics.ts

Not yet wired to the Model Laboratory UI, weather/HYDRUS import, Python model training, Supabase persistence or research export. Existing annual screening remains the UI default. No test execution has been verified.

## Scientific limitations
This is a screening-grade root-zone bucket, not Richards-equation physics. Precipitation interception, surface runoff, soil-layer hydraulic gradients, crop stress and battery SOC are not yet represented. Ground transmitted irradiation is an input-derived diagnostic, not a geometry-based shading simulation. PV module temperature and clipping are omitted. These are explicit research limitations and release gates.
