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

The current dependency declarations use `latest`. Do not guess or manually invent fixed versions. Dependency pinning should be completed only after a verified install produces a trustworthy lockfile. Once a lockfile is committed, CI should switch from `npm install` to `npm ci` for reproducible builds.
