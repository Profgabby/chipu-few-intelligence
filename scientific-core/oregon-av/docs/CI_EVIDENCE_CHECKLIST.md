# Reproducible execution evidence gate

**No passing GitHub Actions run has yet been verified through the available
GitHub connector.** The connector's commit workflow lookup only includes
pull-request-triggered runs; an empty result cannot prove no push run exists.

Required evidence before scientific acceptance:
1. Successful workflow job URL and commit SHA from GitHub Actions.
2. All unit and integration test names, counts, skips and exit status.
3. Exact Python and scientific-library versions.
4. Archived illustrative-baseline.json and SHA-256 checksum.
5. Independent rerun with identical inputs producing identical JSON bytes.
6. Report of any model-specific reference benchmark and tolerances.
7. Documented assumptions, parameter provenance and validation split.

Do not describe tests as passing merely because they are committed.
Do not describe equation identity tests as independently published example
replications. Do not describe synthetic simulations as Oregon observations.
