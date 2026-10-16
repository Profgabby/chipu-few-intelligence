# CHIPU-FEW pre-data scientific foundation (experimental)

Independent Python research module, not wired to the production UI or telemetry. Run from repository root:

```bash
python -m unittest discover -s research -p 'test_*.py' -t .
```

## Model scope
- Physics: daily bucket water balance, FAO-56 crop coefficient ET from supplied ETo, constant-head pump energy, daily PV energy.
- Statistics: error metrics and seeded Monte Carlo sensitivity for pump efficiency.
- No trained ML models, weather forcing integration, HYDRUS coupling, real-world uncertainty coverage, autonomous control or field validation.

## Next milestones
1. M1: audit all existing TypeScript engines, input units, defaults, physical invariants and state transition tests.
2. M2: implement parameter inference, residual diagnostics, sensitivity, confidence/credible interval definitions and time-series holdout tests.
3. M3: build versioned feature schemas, temporal split, training/inference interfaces, baseline regression and gradient-boosting experiments.
4. M4: synthetic benchmark scenarios with immutable seeds, parameter distributions, provenance and adversarial cases.
5. M5: compare physics, statistical, ML-only and residual-hybrid models on identical splits, preventing leakage.
6. M6: integrate with backend via versioned API after tests, data provenance checks, review and explicit approval.

## Scientific controls
Every output must carry model_version, forcing_source, source_type (synthetic/observed/reanalysis), assumptions, units and validation_status. Synthetic training must never be labeled field-validated. The bucket model is deliberately not HYDRUS-1D; it has no unsaturated-flow solution. PV performance ratio is assumed, not estimated. Monte Carlo percentiles represent parameter assumption sensitivity, not predictive coverage.

Reference: FAO-56 crop coefficient method, https://www.fao.org/4/x0490e/x0490e0a.htm .
