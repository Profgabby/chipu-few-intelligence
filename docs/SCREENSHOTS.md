# Screenshot and Demonstration Evidence Guide

Screenshots should document implemented interfaces without converting demonstration outputs into validation claims.

## Recommended evidence set

1. **Integrated command center** — show the cross-module FEW workflow and research context.
2. **Twin State** — show evidence mode, component quality/freshness, uncertainty and lineage.
3. **Water Intelligence** — show irrigation requirement/runtime/pumping-energy calculations together with warnings.
4. **Energy Intelligence** — show available energy, agricultural loads, allocations and warnings.
5. **Prediction** — show the forecast trajectory while keeping deterministic-demonstration and synthetic-evidence warnings visible.
6. **Scenario Laboratory** — show one baseline and one perturbed scenario with assumption notes.
7. **Control** — show strategy comparison/receding-horizon evidence with the research-stage/non-autonomous limitation visible.
8. **Economics** — show explicit assumptions alongside NPV/payback outputs.
9. **Resilience** — show continuity/vulnerability results with the unvalidated-composite-index note visible.
10. **Field Data / Sensors** — show registry, calibration metadata and health status; do not imply physical deployment unless documented field hardware/data exist.
11. **Models & Methods / Validation** — show model status, calibration status, validation status and applicability boundaries.
12. **Evidence graph / Research export** — show traceability from evidence to downstream analytical products.

## Screenshot rules

- Never crop out provenance, evidence-mode, warning or limitation labels when those labels qualify the result.
- Prefer screenshots containing IDs/model versions/lineage where readable.
- Do not caption synthetic outputs as observations or results from a real farm.
- Do not caption software infrastructure as deployed field infrastructure without deployment evidence.
- Keep historical CropSmart screenshots, if used, explicitly labeled as earlier-stage development evidence.
- Store future repository screenshots under `docs/images/` with descriptive filenames and a short provenance note in the pull request or commit that adds them.

## Current repository limitation

This guide defines the evidence set and claim discipline. Actual screenshots should be captured from a verified running build so that the images correspond to the committed source and current interface state. Placeholder or fabricated screenshots should not be used.
