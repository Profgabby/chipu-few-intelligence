# CropSmart Research Digital Twin v0.2.0

## Research Demonstrator Baseline

Version 0.2.0 establishes the first reproducible public research-demonstrator baseline for CropSmart™ Research Digital Twin.

This release preserves the current observation-informed interface for water, energy, crop, agrivoltaic, uncertainty, scenario, postharvest, and resource-allocation exploration while formalizing the software environment used to build it.

## Reproducibility baseline

- Direct npm dependencies are fixed to the exact versions resolved in a clean GitHub Actions environment.
- `package-lock.json` records the complete dependency graph and integrity metadata.
- Node.js is pinned to 24.19.0 for CI and repository runtime guidance.
- CI installs dependencies with `npm ci` and verifies the TypeScript + Vite production build before merge.
- GitHub remains the source of truth and Netlify deploys production from `main`.

## Research-integrity status

CropSmart v0.2.0 is a research demonstrator. Its current public workspace uses deterministic synthetic observations and modeled, estimated, predicted, and derived outputs where explicitly labeled. This release does not claim field validation, statistical significance, autonomous farm control, commercial deployment, or proven agricultural benefit.

No scientific equations, assumptions, application routes, provenance semantics, synthetic demonstration values, or decision logic are changed by the reproducibility work in this release.

## Verified direct dependency versions

- @vitejs/plugin-react 6.1.1
- lucide-react 1.39.0
- react 19.2.8
- react-dom 19.2.8
- react-router-dom 7.18.3
- typescript 7.0.2
- vite 8.2.2
- @types/react 19.2.18
- @types/react-dom 19.2.5

## Release purpose

This baseline creates a stable reference point for subsequent CropSmart research development. Future scientific modules, persistent observations, model revisions, and data-engine work can now be compared against a versioned and reproducible software state.
