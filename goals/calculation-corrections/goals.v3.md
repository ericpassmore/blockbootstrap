# Goals Extract

- Task name: calculation-corrections
- Iteration: v3
- State: locked

## Goals

1. Correct covariance data and local optimizer integration, including return-type consistency and crypto cap validation.
2. Correct concurrent historical initialization, crypto column mapping, missing-data eligibility, and overlapping observations.
3. Preserve holdings and cost bases across blocks and use continuous crypto projection years.
4. Correct coupon reinvestment/trades, dividend basis, and nominal-income taxation under inflation adjustment.
5. Preserve and correctly label percentile paths while retaining detailed records only for displayed forecasts.
6. Add offline regression tests against local data and run unit, type, formatting/lint, and build checks proportionate to the changes.
7. Resolve the remaining type diagnostics in test fixtures/mocks, browser response handling, analytics types, the AI-assistant effect, and quote-route data types without suppressing the checker.
8. Stop deploying precomputed analysis CSVs while retaining local reference data and validation; preserve every runtime CSV and verify the final Vercel artifact.

9. Apply only the seven supplied Damodaran 2025 returns consistently across overlapping blocks, preserving earlier observations and nominal crypto projections; represent unavailable inputs explicitly and prevent partial data from becoming zero observations.

## Non-goals

- No deployment, commits, external messages, tax-policy overhaul, or unrelated authentication/database refactoring. Preserve pre-existing untracked foo.env without reading or changing it.

## Success criteria

- [G1] All precomputed nominal covariance matrices match independent source calculations; builder constraints and real covariance are tested.
- [G2] Concurrent initialization produces exactly ten rows per block; SOL/XRP, flat missing crypto, noncrypto eligibility, and overlapping observations are tested locally.
- [G3] Uninterrupted asset compounding matches local data across multiple blocks; thirty projected annual intervals are consecutive.
- [G4] Independent coupon, rebalance, basis, and inflation/tax arithmetic fixtures pass.
- [G5] Summary and detailed simulation agree; all percentile paths survive, table labels use full sequence identity, and at most fifty detailed paths are materialized.
- [G6] Pinned checks run with results and any pre-existing limitations recorded in tasks/calculation-corrections/spec.md.
- [G7] `npm run check` reports zero errors and warnings; affected API/browser tests and the existing unit suite pass, with formatting/lint and production compilation verified.
- [G8] User authorization: “If the optimizer calculates covariance directly now, can we stop deploying the precomputed analysis CSV files?” All 1,405 reference files remain byte-identical outside static assets; Vercel uploads exclude them; a fresh build and `npm run check:deployment` verify zero analysis CSVs and five unchanged runtime CSVs. Unit tests, type checks, and regeneration still pass.

- [G9] User authorization: “Using this data can you update our data for 2025” and “Update only the supplied assets”. All four 2025 copies match the seven official returns with correct units; unavailable CPI prevents real-return derivation, missing CPI/dividend inputs exclude affected forecasts, and incomplete blocks cannot enter the full-asset optimizer. Offline regression tests pin unchanged non-2025 rows and nominal crypto projections; source snapshot and idempotent updater are included. Unit tests, types, targeted lint/formatting, production build, and deployment-data checks pass.
