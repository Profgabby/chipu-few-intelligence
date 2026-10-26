# GitHub Actions artifact review — 2026-10-26

## Evidence scope

User-provided screenshot displays green successful workflow icons for Oregon Scientific Core
run #27 (commit d1a6c14ac45bf7d774ac20a0530e0ab2754bb88a) and preceding runs.
User-provided archive `oregon-illustrative-baseline.zip` was inspected separately.
This record is an artifact inspection, not an independent GitHub API job-log audit.

## Artifact inventory

- `results/illustrative-baseline.json` (1335 bytes)
- `results/illustrative-baseline.sha256`
- `results-dependencies.txt`

SHA-256 calculated from JSON bytes:
`51572c0c622ebaa00bb9d2071a93321bb60d9de62afe5aedb5eb275e6d665019`

Matches the archived .sha256 manifest.

Dependency record includes pvlib 0.16.1, pandas 2.3.3, numpy 2.4.6,
scipy 1.17.1, and editable project dependency referencing commit d1a6c14.

## Synthetic baseline outputs (not observations)

- Ground irradiation: 2.6 kWh/m2/day (assumed transmission)
- PV output: 5.76 kWh/day (constant-efficiency approximation, NOT pvlib)
- Open-field ET: 4.0 mm/day
- Illustrative shaded ET: 3.4 mm/day (assumed multiplier)
- Gross irrigation: 4.25 mm/day
- Pumping electricity: 0.03158522727272727 kWh/day
- Root-zone balance residual: 0.0 mm (algebraic accounting identity)

## Limits

The screenshot does not expose the unit-test names, number, skips or logs.
The archive contains no complete test log or published FAO-56 benchmark comparison.
pvlib being installed does not prove that its adapter was executed successfully.
A checksum match verifies archive internal integrity, not field accuracy.
No bifacial_radiance simulation was executed as part of this evidence.
Do not use these synthetic outputs as empirical Oregon findings.
