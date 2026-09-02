# CropSmart Development Workflow

The `main` branch is the production source of truth for the CropSmart Research Digital Twin deployed through Netlify.

## Change workflow

1. Create a short-lived feature or maintenance branch from `main`.
2. Make and review changes on that branch.
3. Open a pull request into `main`.
4. Require the CropSmart Build Verification workflow to complete successfully before merging.
5. Merge only reviewed changes that preserve the research-demonstration labeling and provenance semantics.
6. Netlify deploys the updated `main` branch after merge.

## Research-integrity guardrails

The current public application is a research demonstrator. Synthetic, modeled, estimated, predicted, derived, and measured values must remain explicitly distinguishable in the interface and source. Do not describe synthetic demonstration outputs as field observations, validated performance, operational deployment, or proven benefits.

Changes to equations, scientific assumptions, provenance classes, uncertainty handling, scenario logic, or decision rules should be documented in the pull request and tied to a versioned model or methods update.

## Dependency policy

Direct npm dependencies are pinned to the exact versions resolved and verified in a clean GitHub Actions environment. The committed `package-lock.json` is the authoritative dependency graph for reproducible installs. CI uses `npm ci` and a pinned Node.js runtime rather than resolving moving `latest` declarations.

Dependency updates should be made deliberately on a maintenance branch, regenerate `package-lock.json`, pass the complete production build, and be reviewed in a pull request before reaching `main`. Do not manually alter lockfile resolution data without regenerating and verifying the dependency graph.
