# Establish Goals

## Status

- Task name: calculation-corrections
- Iteration: v6
- State: locked

## Request

- Fix the calculation errors and inefficiencies identified in the codebase review, starting with high-priority issues; add regression tests using local data. Approved by the user's explicit follow-up request on 2026-10-16. The user subsequently authorized fixing the remaining repository type checks: “Lets fix the type checks”.

## Blocking ambiguity

- Resolved by the user: update only the seven assets supplied by Damodaran; do not source the remaining 2025 inputs.

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

9. Apply only the seven supplied Damodaran 2025 returns consistently across overlapping blocks, preserving earlier observations and nominal crypto projections; represent unavailable inputs explicitly and prevent partial data from becoming zero observations.

10. Apply the user-supplied BLS 2025 inflation value of 2.7% consistently and derive real returns for available nominal values, preserving missing unsupported returns and prior history; update local-data regression tests and forecast expectations.

11. Record and apply the user-supplied Multpl year-end 2025 S&P dividend yield of 1.15%, update reproducible generation and tests, and admit the now-supported 2025 S&P forecast block without adding dividends to total returns.

12. Source and apply the remaining seven observed 2025 returns using matching equity benchmarks and consistent USD crypto year-end closes, recalculate derivatives, enable complete 2025 optimization, and verify local-data regressions.

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

- [G10] User authorization: “Apply the 2.7% inflation value to the 2025 data, recalculate the real returns, and update the tests.” All four legacy 2025 CPI cells read 2.70% and nominal CPI cells read 0.0270. All available 2025 real returns equal (1 + nominal) / 1.027 - 1 rounded to four decimal places, including preserved nominal crypto projections. Missing asset/dividend values remain unknown; supported real forecasts now include block 47 while S&P forecasts still require dividends. Non-2025 rows, nominal asset returns, excess returns, and analysis references remain unchanged. Offline reproduction, regression tests, types, targeted lint/formatting, build and deployment checks pass.

- [G11] User provided the Multpl annual dividend yield URL and value 1.15. Verified December 31, 2025 observation is recorded with percent units and source URL; all four legacy dividend inputs read 1.15% and nominal inputs read 0.0115. Real/excess data, nominal total returns, prior history, and crypto projections are unchanged. Actual-data tests verify S&P eligibility and nominal dividend taxes in nominal and real forecasts; missing-input guards remain tested with fixtures. Pinned unit/type/lint/format/build/deployment checks pass.

- [G12] User authorization: “Can you find reliable sources for the remaining 2025 returns and update the data and tests?” Source ledgers identify MSCI EAFE/EM gross USD and Nasdaq-100 price conventions, Coinbase USD UTC year-end prices, raw closing-price evidence and rounding. All four 2025 copies contain all 14 observed returns; 2025 synthetic crypto values are replaced, and real/excess returns are recalculated. Non-2025 rows and existing reference analyses remain unchanged. Global/historical crypto forecasts use these observations; power-law overrides remain intact; complete block 47 is available to builder ranges ending in 2025. Offline reproduction, independent statistics/solver tests, unit/types/lint/format/build/deployment checks pass. Small-cap dividend assumption and prior-year crypto projections remain explicitly outside this update.

## Next action

- Implement the user-approved fixes and tests.
