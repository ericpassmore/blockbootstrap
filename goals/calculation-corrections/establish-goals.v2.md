# Establish Goals

## Status

- Task name: calculation-corrections
- Iteration: v2
- State: locked

## Request

- Fix the calculation errors and inefficiencies identified in the codebase review, starting with high-priority issues; add regression tests using local data. Approved by the user's explicit follow-up request on 2026-10-16. The user subsequently authorized fixing the remaining repository type checks: “Lets fix the type checks”.

## Blocking ambiguity

- None. The reviewed findings define the scope.

## Assumptions

- Preserve the existing pre-tax growth model and simplified tax rates; report taxes separately in nominal dollars. Preserve existing distinct chronological block combinations; this task repairs their calculations, not the sampling methodology.

## Goals

1. Correct covariance data and local optimizer integration, including return-type consistency and crypto cap validation.
2. Correct concurrent historical initialization, crypto column mapping, missing-data eligibility, and overlapping observations.
3. Preserve holdings and cost bases across blocks and use continuous crypto projection years.
4. Correct coupon reinvestment/trades, dividend basis, and nominal-income taxation under inflation adjustment.
5. Preserve and correctly label percentile paths while retaining detailed records only for displayed forecasts.
6. Add offline regression tests against local data and run unit, type, formatting/lint, and build checks proportionate to the changes.
7. Resolve the remaining type diagnostics in test fixtures/mocks, browser response handling, analytics types, the AI-assistant effect, and quote-route data types without suppressing the checker.
8. Stop deploying precomputed analysis CSVs while retaining local reference data and validation; preserve every runtime CSV and verify the final Vercel artifact.

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

## Next action

- Implement the user-approved fixes and tests.
