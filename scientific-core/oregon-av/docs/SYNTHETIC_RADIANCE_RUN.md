# Synthetic ray-tracing execution — not yet executed

Runner: `python -m chipu_oregon.radiance_synthetic --epw /path/to/input.epw --output results/radiance-synthetic`

Requirements: installed compatible bifacial_radiance Python package, Radiance
`oconv` and `rtrace` executables, and a locally supplied EPW file.
Pin exact versions and retain the EPW checksum and weather provenance.

The runner uses the synthetic geometry manifest, creates a cumulative sky,
module and array scene, compiles an octree, and requests nine front/rear
module irradiance samples. It checks finite nonnegative irradiance and
writes the inputs and outputs into a JSON manifest.

**The runner is an implementation, not a completed ray-tracing experiment.**
No EPW or Radiance binaries were available in the authoring environment;
therefore no irradiance values or run artifacts are claimed.

Critical scientific limitation: front/rear MODULE scans are not
ground-level irradiance maps. Spatial ground sensor grids, sampling
convergence, open-field reference and measured Oregon geometry are
separate acceptance tasks.

API basis: https://bifacial-radiance.readthedocs.io/en/stable/user_guide/introexamples.html
