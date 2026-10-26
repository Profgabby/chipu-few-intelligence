# Oregon field input and geometry protocol — proposed, NOT observed

Primary candidate: Oregon State University North Willamette Research and Extension Center (Aurora). This is a candidate study site, not an assertion of authorized access.

## Mandatory geometry before any ray-tracing run

Record measured latitude, longitude, elevation, array azimuth and tilt,
module length and width, module height above ground, row pitch, number of
modules per row, row count, tracking or fixed-rack status, terrain slope,
ground albedo and module optical properties. Record measurement date,
instrument, uncertainty and site owner's permission.

## Weather forcing

Use timestamped GHI, DNI, DHI, air temperature, wind speed, rainfall,
relative humidity and reference ET0 (or inputs to calculate it).
Maintain local timezone with DST and preserve raw source timestamps.
Never silently combine daily and hourly variables or mix energy (Wh/m2)
with irradiance (W/m2). Check physical consistency of irradiance inputs.
Store raw files separately from derived data, with checksums and licensing.

## Model coupling

Ray tracing: spatial ground irradiance and module irradiance.
PV: convert panel irradiance to DC/AC power using pvlib and specified equipment.
Crop water: calculate ET0 and FAO-56 dual crop coefficients with measured
or defensibly parameterized microclimate effects; compute root-zone storage.
Hydraulics: convert irrigation demand to runtime and energy using
measured network geometry and pump efficiency/curve.

## Model comparison and evaluation

Evaluate the existing array against an open-field reference using identical
weather periods and documented crop management. For calibration/validation,
split data by time or experimental unit, not random adjacent hourly samples.
Report MAE, RMSE, mean bias, missing data, residual plots, and uncertainty
interval coverage. Benchmark against simpler non-spatial models.

## Radiation engine acceptance gate

A documented bifacial_radiance installation must reproduce a known library
example with recorded version, input geometry, simulation seed if applicable,
ray count, sensor placement, units, and exported irradiance fields.
Compare under-array irradiance against measured sensors. No claims of
bifacial_radiance integration until this execution is evidenced.

## Publication gate

Preserve exact environment lock, input checksums, site consent,
experiment manifest, source commit and calibration/validation split.
A passing software test is not evidence of empirical accuracy.
