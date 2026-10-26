# Synthetic ray-tracing execution protocol — pending actual execution

Command:
`python -m chipu_oregon.radiance_synthetic --epw /absolute/path/input.epw --output results/radiance-synthetic`

Requirements: compatible bifacial_radiance Python installation; Radiance
`oconv` and `rtrace`; a locally supplied, licensed EPW file.
Pin and record exact library and Radiance versions.

## Outputs requested
- Nine front/rear module scan points.
- 31 ground-level sample points over a row pitch via groundAnalysis.
- Synthetic geometry manifest, weather EPW SHA-256, library version,
  and ground/module irradiance arrays.

## Acceptance criteria
1. Complete execution with process exit code zero.
2. Actual saved JSON manifest, full stdout/stderr and input EPW checksum.
3. Check spatial ground scan coordinates and orientations from generated
   Radiance scan definitions, not only sample count.
4. All values finite and nonnegative; compare open-field reference under
   identical forcing; ensure ground shading pattern is physically plausible.
5. Repeat with 61 ground samples to evaluate convergence of pitch-average
   ground irradiance. Set tolerance before examining results.
6. Independently review geometry, scene files, radiance units and model version.
7. Retain environment lock, command line, source SHA and hashes of outputs.

## Limits
This implementation has NOT been run in a Radiance-enabled environment.
No ground irradiance, shade fraction, PV production or crop effects are
claimed as simulation results. Cumulative-sky irradiance arrays must not
be interpreted as instantaneous irradiance without verifying units and
temporal aggregation for the chosen sky-generation method.

Reference:
https://bifacial-radiance.readthedocs.io/en/latest/generated/bifacial_radiance.AnalysisObj.groundAnalysis.html
