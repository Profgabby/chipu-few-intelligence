# bifacial_radiance execution protocol — scientific acceptance gate

## Status
The Python geometry schema and tests exist. **No bifacial_radiance ray-tracing
run has been executed or verified.** Do not call the geometry a measured
Oregon installation.

## Illustrative fixed-tilt array
WGS84 reference location 45.3 N, -122.75 E (a rounded regional reference,
not an instrument location). Tilt 25 degrees, south azimuth 180 degrees,
module width 1.1 m, module length 2.0 m, lower clearance 1.5 m,
row pitch 6.0 m, four modules per row, three rows, albedo 0.2.
These are invented demonstration values, NOT Aurora field dimensions.

## Required execution procedure
1. Pin and record a supported bifacial_radiance and Radiance version.
2. Verify Radiance executables are available in PATH; run a documented
   library example with matching software versions.
3. Create the module, scene, weather sky, octree and sensor scans using
   documented bifacial_radiance API calls for the pinned version.
4. Use weather data with verified timestamps and irradiance components;
   do not substitute daily energy for hourly irradiance.
5. Export module irradiance and spatial ground irradiance with units,
   sensor positions, ray counts, and complete scene geometry.
6. Perform convergence checks on sensor density and sampling.
7. Compare an unshaded reference with the modeled array under identical
   forcing. Retain a run manifest and hash every exported file.
8. Only after passing this protocol replace synthetic geometry with
   surveyed field dimensions and independently validate against sensors.

## Scientific interpretation
A successful synthetic scene run is a numerical integration check, not
evidence of crop yield, water saving, PV field accuracy or field validation.
