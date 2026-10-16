# HYDRUS-1D 4.17.0140 authentic native-file validation gate

Status: **BLOCKED — genuine native project files not yet supplied**.

## Required evidence
Export a disposable atmospheric-boundary project from the user's installed HYDRUS-1D 4.17.0140. Preserve the original, unedited `ATMOSPH.IN` together with `SELECTOR.IN`, the project units, upper/lower boundary selections, and the root-water-uptake configuration. Remove personal paths if necessary; do not change record values or headers.

## Verification sequence
1. Record the installed version (4.17.0140) and the native file's exact bytes and checksum.
2. Identify the number and ordering of header lines, switches, time unit, length unit, atmospheric record count and all columns from the native file.
3. Cross-check the project boundary flags and root-uptake options with SELECTOR.IN and the HYDRUS manual.
4. Confirm sign conventions, whether the precipitation column represents rainfall plus surface irrigation, and treatment of evaporation, transpiration and critical pressure heads.
5. Test at least one atmospheric case with and without root uptake in the installed solver; preserve the solver outputs and water-balance report.
6. Only then allow an exporter to render a complete ATMOSPH.IN; parse the result back, compare with the verified template, and execute it in HYDRUS.
7. Repeat for at least two upland crops using distinct root-depth/uptake settings; handle flooded rice separately.

## Existing verified software gates
- 24 synthetic multi-crop tests.
- 6 atmospheric record-format tests.
- 4 atmospheric manifest-mapper tests.
These are software-level tests, **not native solver validation**.

## Fail-closed rule
Never infer missing HYDRUS header switches, hCritA or other auxiliary parameters from crop identity or generic defaults. The exporter must remain disabled when the authentic template, model boundary flags, or version-specific semantics are unknown.

## Fixture handling
Place approved, non-sensitive original fixtures under `test/fixtures/hydrus-417/` with a source note and checksum. Do not check in proprietary installation binaries or private project paths.
