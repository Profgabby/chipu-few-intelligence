# Evidence, Provenance, Quality and Scientific Claims

## Evidence classes

CHIPU-FEW separates evidence origin from analytical output. Repository code recognizes records such as measured/manual observations and synthetic, modeled, predicted or derived evidence. These categories must not be collapsed in publications, demonstrations or screenshots.

## Source modes

The observation and Twin State layers distinguish:
- **OBSERVED** — measured or manual records accepted by the observation layer.
- **COMPUTATIONAL** — modeled, predicted or derived records.
- **SYNTHETIC** — explicit demonstration records.
- **ALL** — retrieval mode only; it does not make unlike evidence scientifically equivalent.

## Quality and freshness

Observation records carry quality semantics. Twin State construction adds variable-specific freshness thresholds, age, uncertainty ranges and assimilation weights. A record being accepted by software does not establish instrument accuracy, site representativeness or scientific validity.

## Lineage

Downstream analytical products retain identifiers linking Twin State, forecasts, water/energy analyses, scenario runs, model/parameter versions and experiment records. The research-export layer can assemble these into a machine-readable evidence package.

## Claim discipline

Use:
- “implemented research prototype” for working code paths;
- “demonstration model” where deterministic/synthetic assumptions dominate;
- “deployable infrastructure” for server/schema code requiring configuration;
- “research-stage indicator” for unvalidated composite indices;
- “calibration/validation tooling” for software that computes performance metrics.

Do not use repository evidence alone to claim:
- field validation;
- independent validation;
- statistically demonstrated agronomic benefit;
- active sensor deployment;
- autonomous control;
- operational irrigation prescriptions;
- commercial readiness;
- causal effects; or
- measured production data when provenance is synthetic, modeled, predicted, estimated or derived.

## Validation boundary

The calibration/validation workspace can calculate MAE, RMSE, bias, R² and normalized RMSE and evaluate configured promotion criteria. The engine itself explicitly states that numerical criteria do not automatically establish scientific validation. Dataset provenance, independence, representativeness, residual behavior and applicability boundaries require scientific review.
