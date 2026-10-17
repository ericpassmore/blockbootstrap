# Calculation corrections

## Goal reference

- `goals/calculation-corrections/goals.v7.md` (locked by the user's requests to implement the reviewed findings, fix type checks, stop deploying precomputed analysis CSVs, and update only the seven supplied 2025 asset returns).

## Scope

### In scope

- Review findings affecting local data, portfolio accounting, optimizer constraints/units, percentile display, and retained simulation memory; regression tests and reproducible data generation. Follow-up: reported type diagnostics in analytics typing, AI-assistant reactivity/effects, quote-route data types, API fixtures/mocks, and browser response handling.

### Out of scope

- Deployment, commits, sampling-method redesign, tax schedule changes, authentication/database refactoring.

## Approach

- Disjoint data-loader, portfolio-accounting, and optimizer work owned by separate agents. Parent owns forecast aggregation, display, integration, and final checks. Underlying holdings/tax accounting remain nominal; inflation changes portfolio presentation and taxes stay explicitly nominal.

## Verification commands

- Formatting: `./node_modules/.bin/prettier --check goals/calculation-corrections/establish-goals.v0.md goals/calculation-corrections/goals.v0.md package-lock.json package.json scripts/repair-legacy-block-data.mjs src/lib/assetReturns.ts src/lib/block.ts src/lib/constantRateReturns.ts src/lib/forecastDisplay.ts src/lib/forecastService.ts src/lib/modelReturns.ts src/lib/server/portfolioOptimizer.ts src/lib/server/powerLawReturnsFromDates.ts src/lib/server/quadprog.d.ts src/routes/+page.svelte src/routes/builder/+page.server.ts src/routes/builder/+page.svelte src/routes/methodology/+page.svelte src/tests/unit/blockData.spec.ts src/tests/unit/builderAction.spec.ts src/tests/unit/data.spec.ts src/tests/unit/forecastService.spec.ts src/tests/unit/modelReturns.regressions.spec.ts src/tests/unit/modelReturns.spec.ts src/tests/unit/portfolioOptimizer.spec.ts src/tests/unit/powerLawReturnsFromDates.spec.ts static/DATA_DESCRIPTION.md tasks/calculation-corrections/spec.md`
- Lint: `./node_modules/.bin/eslint scripts/repair-legacy-block-data.mjs src/lib/assetReturns.ts src/lib/block.ts src/lib/constantRateReturns.ts src/lib/forecastDisplay.ts src/lib/forecastService.ts src/lib/modelReturns.ts src/lib/server/portfolioOptimizer.ts src/lib/server/powerLawReturnsFromDates.ts src/lib/server/quadprog.d.ts src/routes/+page.svelte src/routes/builder/+page.server.ts src/routes/builder/+page.svelte src/routes/methodology/+page.svelte src/tests/unit/blockData.spec.ts src/tests/unit/builderAction.spec.ts src/tests/unit/data.spec.ts src/tests/unit/forecastService.spec.ts src/tests/unit/modelReturns.regressions.spec.ts src/tests/unit/modelReturns.spec.ts src/tests/unit/portfolioOptimizer.spec.ts src/tests/unit/powerLawReturnsFromDates.spec.ts`
- Types: `npm run check`
- Build: `PATH=/Users/eric/.nvm/versions/node/v22.18.0/bin:$PATH npm run build` (installed Node 22; the existing Vercel adapter does not support the default Node 24 host).
- Tests: `npm run test:unit` (local unit tests only; API/e2e/database suites require independent services and are outside the unit command).

## Delivery

- Delivered: all reviewed calculation/data errors fixed; 351 covariance matrices regenerated and independently audited; 90 known historical observations reconciled; optimizer now enforces budget, target, and crypto constraints with matching return-type covariance; local loaders are concurrent-safe; holdings/basis, coupons, dividends, inflation/taxes, continuous crypto years, and percentile display are corrected; summary-only simulation materializes at most 50 detailed paths. Added 55 regression tests (88 unit tests total).
- Exceptions: None. The follow-up resolves the nine baseline type errors and the AI-assistant reactivity warning; tax policy and distinct chronological sampling remain unchanged.
- Deferred work: None
- Dirty-worktree decision: continue in current checkout; initially only unrelated untracked foo.env existed. Leave it untouched and unread.

## Quality gate results

- Lint: PASS for every changed TypeScript/Svelte/JavaScript source, test, and script file. Formatting: PASS for changed source, tests, JSON, and documentation.
- Build: PASS under installed Node 22 with adapter packaging; client/server compilation also succeeded under Node 24, whose adapter packaging is unsupported.
- Tests: PASS, `npm run test:unit`: 88 tests / 12 files. Includes independent pairwise covariance audit of all 68,796 matrix cells, all source diagonals, solver target/cap/infeasibility tests, accounting fixtures, and full-population forecast statistics. Thirty-year run creates 15,180 summaries and only 1,500 annual rows across 50 detailed paths. Observed isolated heap ~81 MB after the change versus ~234 MB before.
- Code review: independent read-only review found no actionable introduced errors, confidence 0.95. See code-review.md.
- Types: PASS, `npm run check` reports 0 errors and 0 warnings after the follow-up corrections.
- Clean merge: not applicable; no commit, branch merge, or pull request requested.
- Data repair/generation: idempotent; all regenerated covariance files byte-identical on rerun.
- Git whitespace: `git diff --check` passes.
- Initial ENOSPC blocker resolved after the user freed disk space; remaining work completed.

## Type-check follow-up

- User authorization: “Lets fix the type checks”. Goals v1 records the expanded scope.
- Delivered: completed missing crypto fields in the API fixture; typed the mock constructor's static methods with Object.assign; used the navigation response returned by Puppeteer instead of callback-mutated variables; declared optional analytics window API; corrected quote-route PageData import and optional error access; made the textarea reference reactive and the Svelte effect synchronous.
- Check: `npm run check` — PASS, 0 errors and 0 warnings.
- Unit tests: `npm run test:unit` — PASS, 88 tests.
- API tests: `ENVIRONMENT=TEST ./node_modules/.bin/vitest run --project server src/tests/api/blockNumber.spec.ts src/tests/api/quote.spec.ts` — PASS, 5 tests.
- Browser tests: `ENVIRONMENT=TEST ./node_modules/.bin/vitest run --project server src/tests/e2e/static-pages.spec.ts src/tests/e2e/userguide.spec.ts` against a temporary local development server — PASS, 3 tests. Server stopped afterward.
- Lint: `./node_modules/.bin/eslint src/app.d.ts src/routes/ai-assistant/+page.svelte 'src/routes/quote/[ticker]/+page.svelte' src/tests/api/blockNumber.spec.ts src/tests/mocks/polygonServiceMock.ts src/tests/e2e/static-pages.spec.ts src/tests/e2e/userguide.spec.ts` — PASS.
- Formatting: `./node_modules/.bin/prettier --check src/app.d.ts src/routes/ai-assistant/+page.svelte 'src/routes/quote/[ticker]/+page.svelte' src/tests/api/blockNumber.spec.ts src/tests/mocks/polygonServiceMock.ts src/tests/e2e/static-pages.spec.ts src/tests/e2e/userguide.spec.ts src/tests/data/block_response.json` — PASS.
- Production build: Node 22 build verified again after the UI type corrections.

## Analysis deployment follow-up

- User approved stopping deployment of precomputed analysis CSVs. Runtime calculation code has no remaining references to them; only offline tests and regeneration use them.
- Moved all 1,405 reference CSVs from `static/data/analysis/` to repository-only `data/analysis/`. SHA-256 checks before/after relocation confirmed every file is unchanged.
- Updated the covariance generation script and validation tests to use the new directory. `.vercelignore` excludes the offline directory and stale `.svelte-kit` artifacts from ordinary CLI uploads. Moving outside `static` also excludes the files from Git-based builds and fresh prebuilt deployment artifacts.
- Added `npm run check:deployment` to assert the final `.vercel/output` contains no precomputed analysis CSVs and contains unchanged copies of all five runtime CSVs. Existing deployments are unaffected until the rebuilt code is deployed.
- Validation: Node 22 production build PASS; `npm run check:deployment` PASS; `npm run test:unit` 88/88 PASS; `npm run check` 0 errors/0 warnings; changed-source ESLint and Prettier PASS; `git diff --check` PASS. Regeneration at the new location is byte-identical.
- Commands: `PATH=/Users/eric/.nvm/versions/node/v22.18.0/bin:$PATH npm run build`; `npm run check:deployment`; `npm run test:unit`; `npm run check`; `python3 scripts/regenerate_covariance.py`; `./node_modules/.bin/eslint src/tests/unit/portfolioOptimizer.spec.ts scripts/check-deployment-data.mjs`; `./node_modules/.bin/prettier --check package.json src/tests/unit/portfolioOptimizer.spec.ts static/DATA_DESCRIPTION.md scripts/check-deployment-data.mjs`.

## Partial 2025 data update

- Authorization: update 2025 using Damodaran, restricted by the user's explicit reply “Update only the supplied assets”.
- Recorded the official January 5, 2026 snapshot in `data/sources/damodaran-2025.json` and supplied an offline, idempotent updater: `scripts/update-2025-returns.py`.
- Applied all seven annual total returns in each of four overlapping 2025 rows, with percentage-point legacy units and decimal nominal units. All non-2025 rows, nominal crypto projections, coupon yields, and precomputed reference analyses remain unchanged.
- Unknown 2025 inputs remain explicit missing values; real returns are unavailable without CPI. Excess returns use the existing ratio convention and updated 4.21% T-bill denominator, including derived excess crypto projections.
- Nominal forecasts can use block 47 only when all required inputs are known. Real forecasts need CPI; S&P forecasts need dividend yield for tax estimates. Future blocks 48–50 remain incomplete. Full-asset optimization remains capped at 2024 and rejects partial observations instead of coercing blanks to zero.
- Added 27 regression tests (115 total), including local-data source values, units, overlapping copies, exact preservation hashes, excess arithmetic, missing-data eligibility, T-bill growth/taxes, missing auxiliary inputs, and optimizer rejection.
- Verification: `npm run test:unit` PASS (115/115); `npm run check` PASS (0 errors/0 warnings); Node 22 production build PASS; `npm run check:deployment` PASS (all five runtime CSVs, no analysis CSVs); `python3 scripts/update-2025-returns.py --check` PASS; targeted ESLint and Prettier PASS; `git diff --check` PASS.
- Pinned lint: `./node_modules/.bin/eslint src/lib/block.ts src/lib/modelReturns.ts src/lib/forecastService.ts src/lib/server/portfolioOptimizer.ts src/tests/unit/blockData.spec.ts src/tests/unit/data.spec.ts src/tests/unit/forecastService.spec.ts src/tests/unit/modelReturns.regressions.spec.ts src/tests/unit/portfolioOptimizer.spec.ts src/tests/unit/returns2025.spec.ts`.
- Pinned formatting: `./node_modules/.bin/prettier --check src/lib/block.ts src/lib/forecastService.ts src/lib/modelReturns.ts src/lib/server/portfolioOptimizer.ts src/tests/unit/blockData.spec.ts src/tests/unit/data.spec.ts src/tests/unit/forecastService.spec.ts src/tests/unit/modelReturns.regressions.spec.ts src/tests/unit/portfolioOptimizer.spec.ts src/tests/unit/returns2025.spec.ts data/sources/damodaran-2025.json static/DATA_DESCRIPTION.md`.
- Deployment and commits were not requested; this update is ready in the working tree.

## 2025 inflation application

- User explicitly authorized applying the recorded BLS 2.7% December-to-December CPI-U change, recalculating real returns, and updating tests.
- Continue in the current checkout with the prior approved 2025 update uncommitted. Parent owns updater, source metadata, CSV edits and source/arithmetic tests; forecast agent owns disjoint loader/forecast/accounting regression tests. Preserve existing changes.
- Scope: 2025 legacy/nominal CPI and available real returns, reproducible updater, source documentation, actual-data and missing-input regression tests. No new asset sources, dividend estimate, historical revisions, commits or deployment.
- Validation commands: `npm run test:unit`; `npm run check`; `python3 scripts/update-2025-returns.py --check`; `PATH=/Users/eric/.nvm/versions/node/v22.18.0/bin:$PATH npm run build`; `npm run check:deployment`; targeted ESLint/Prettier commands above; `git diff --check`.

- Delivered: applied 2.70% legacy / 0.0270 nominal CPI to each of four 2025 rows and derived 44 real-return cells with `(1 + nominal) / 1.027 - 1`, rounded to four decimal places. The seven observed asset returns and existing nominal crypto projections are adjusted; unsupported assets and auxiliary real columns remain blank. Excess returns are byte-identical to the pre-inflation update.
- Reproduction evidence: updated regression tests first failed on missing CPI/real values (3 failures, 7 passes), then passed after updating the offline transform. Source metadata and documentation now reflect applied CPI. Non-2025 byte hashes and exact nominal crypto strings remain pinned.
- Forecast tests now admit supported real portfolios to block 47, verify actual bill growth by 1.0421 / 1.027, nominal tax consistency, cumulative inflation adjustment and summary/detail agreement. Mocked missing-CPI rejection remains tested. S&P still requires unavailable dividend yield; the full-asset builder remains capped at 2024.
- Results: `npm run test:unit` PASS (120 tests / 13 files); `npm run check` PASS (0 errors / 0 warnings); targeted ESLint and Prettier PASS; Node 22 production build PASS; `npm run check:deployment` PASS; offline updater `--check` PASS; `git diff --check` PASS.
- Independent read-only review found no actionable regressions, checking all 44 derived values with exact rational arithmetic, only 52 authorized changed cells from the prior update, preserved history/projections/unknowns, and idempotency.

## 2025 S&P dividend yield application

- User supplied the Multpl yearly table and 1.15 value as the 2025 dividend source. Verified the December 31, 2025 row is 1.15%; apply as the existing model's dividend input and record that it is a year-end trailing-dividend/price yield.
- Parent owns source/updater/data/documentation/arithmetic tests; forecast agent owns the three disjoint loader/forecast/accounting test files. Continue in the current checkout and preserve all previously approved changes.
- Scope: four legacy and four nominal 2025 dividend cells, reproducible offline source, forecast population/tax tests. Preserve nominal total returns, real/excess returns, prior history and unrelated missing assets. Keep optimizer's full-asset 2024 cap.
- Validation: same pinned unit, type, Node 22 build, deployment-data, targeted ESLint/Prettier, updater --check and whitespace commands as the inflation follow-up.

- Delivered: source snapshot records Multpl's December 31, 2025 trailing dividend/price yield of 1.15%; all four legacy cells read 1.15%, all four nominal cells read 0.0115. Only eight cells changed from the pre-dividend update; real/excess files are byte-identical and total returns/CPI/crypto/history are preserved.
- Updated data tests failed first on missing dividend input (2 failures / 9 passes), then passed after the offline update. Regeneration and --check are idempotent.
- S&P nominal and real forecasts now include block 47. Updated population tests independently cover 1,081 twenty-year scenarios and 16,215 thirty-year scenarios, retaining only 50 detailed paths. Actual 2025 tests verify existing 20% dividend-tax treatment, no total-return double counting, real inflation adjustment and consistent nominal tax totals. Missing dividend guards remain fixture-tested.
- Updated the legacy database-project forecast test's stale exclusion of block 47 and corrected its nested-array membership assertion; future blocks 48–50 remain excluded.
- Results: all 125 unit tests PASS; type checks PASS (0 errors / 0 warnings); targeted ESLint and Prettier PASS; Node 22 build PASS; deployment-data check PASS; source updater --check PASS; whitespace check PASS. Independent read-only review found no actionable regressions and reproduced exactly eight authorized cell changes.

- Legacy forecast check: `ENVIRONMENT=TEST ./node_modules/.bin/vitest run --project db-tests src/tests/db/forecasts.spec.ts -t 'uses 47 complete blocks'` PASS (1 selected test; 5 intentionally skipped). The first attempt used the server project, which excludes this directory; corrected to db-tests without configuration changes.

## Remaining 2025 returns

- User authorized finding reliable sources and applying the remaining seven 2025 asset returns with tests. Parent owns source ledgers/updater/data/optimizer/UI/integration tests/docs; bounded read-only source research is delegated; forecast agent owns only loader and forecast-service test edits.
- Match existing conventions inferred from historical observations: MSCI EAFE gross USD 31.89%, MSCI Emerging Markets gross USD 34.36%, Nasdaq-100 NDX price return 20.17%. Preserve earlier observations, including a one-basis-point EM 2018 difference in current source publication.
- Crypto uses Coinbase Exchange USD spot UTC daily closing prices from December 31, 2024 to December 31, 2025, verified against final 23:59 UTC minute closes. Normalize percent returns to two decimals for legacy and decimal returns to four decimals; include raw prices, endpoint URLs, dates and methodology in the offline ledger. Exclude staking rewards/fees. Replace only 2025 nominal projections with observed returns, then recalculate real/excess rows.
- Enable the complete 2025 block in the existing builder range controls and optimizer; preserve 1988 minimum and eleven-year span. No analysis regeneration is needed because reference pairs contain no 2025 observations. Preserve pre-existing approved working-tree changes and all non-2025 rows.
- Small-cap dividend yield remains the existing 1.5% assumption; older nominal crypto values retain their existing projection provenance. No deployment or commit requested.
- Validation: pinned unit/type/Node 22 build/deployment/updater/lint/format/whitespace commands above, plus focused missing-source and optimizer-2025 regression tests.

- Delivered: two new offline source ledgers record primary MSCI/Nasdaq 2025 returns and Coinbase USD daily/minute candle evidence. All seven returns are applied to every 2025 occurrence, with legacy percent and nominal decimal units; real/excess values are regenerated. Exactly 112 cells changed from the prior completed dividend update (28 per CSV); all other cells/line endings are preserved. Non-2025 SHA-256 preservation tests pass; precomputed analyses are unchanged.
- Matched variants: EAFE gross USD 31.89%, EM gross USD 34.36%, NDX price 20.17%. Coinbase UTC year-end price returns normalize to BTC -6.27%, ETH -10.91%, XRP -11.56%, SOL -34.09%. Raw daily closes agree with 23:59 UTC minute closes for both boundaries; prices and exact pre-rounding percentages are preserved in the ledger.
- Updated the reproducible updater to read five source snapshots, populate all fourteen observed 2025 returns, and replace 2025 synthetic crypto observations. Earlier crypto projections remain unchanged and are documented explicitly.
- Builder default and range limits now end in 2025. Complete block 47 statistics are independently verified for all fourteen means and covariance cells in nominal, real and excess modes; solver constraints are verified with the new block. Missing observations remain rejected through mocked data fixtures, and 2026 remains outside the supported range.
- Forecast data tests verify International 47 eligible blocks, EM 29, Nasdaq 31, four-copy asset mapping, actual crypto nominal/real compounding, and unchanged power-law override behavior. Small-cap dividend remains the existing assumption.
- Regression evidence: before updating data the source/arithmetic suite failed 4 tests; before enabling the optimizer year cap its new range test failed. All pass after integration. A strict JavaScript numeric equality in the units test was corrected to compare exact four-decimal strings because binary division of 20.17 / 100 differs in its last floating-point bit.
- Final validation: `npm run test:unit` PASS (141 tests / 13 files); `npm run check` PASS (0 errors / 0 warnings); targeted ESLint/Prettier PASS; Node 22 production build PASS; `npm run check:deployment` PASS (all five runtime CSVs and no analysis CSVs); `python3 scripts/update-2025-returns.py --check` PASS; `git diff --check` PASS.
- Targeted lint command: `./node_modules/.bin/eslint src/lib/server/portfolioOptimizer.ts src/routes/builder/+page.svelte src/tests/unit/returns2025.spec.ts src/tests/unit/portfolioOptimizer.spec.ts src/tests/unit/builderAction.spec.ts src/tests/unit/modelReturns.regressions.spec.ts src/tests/unit/blockData.spec.ts src/tests/unit/forecastService.spec.ts`.
- Targeted format command: `./node_modules/.bin/prettier --check data/sources/equity-index-returns-2025.json data/sources/coinbase-crypto-returns-2025.json data/sources/damodaran-2025.json src/tests/unit/returns2025.spec.ts src/tests/unit/portfolioOptimizer.spec.ts src/tests/unit/builderAction.spec.ts src/tests/unit/modelReturns.regressions.spec.ts src/lib/server/portfolioOptimizer.ts src/routes/builder/+page.svelte static/DATA_DESCRIPTION.md src/tests/unit/blockData.spec.ts src/tests/unit/forecastService.spec.ts`.
- Independent read-only data and optimizer reviews found no actionable regressions. Source research and primary document verification support the benchmark variants; data review confirmed exact raw-price arithmetic and scope, while optimizer review independently confirmed complete blocks 19–47 for all three return types.

## Additional-index selector toggle

- User authorized an opt-in toggle above the portfolio selector, adding International stocks, Emerging markets and Nasdaq-100 while restricting enabled forecasts to block 19 onward (1988).
- Default disabled preserves block 01 onward. Enabling appends zero-weight indexes and preserves base weights; disabling removes the additional weights without redistributing them, allowing the existing total validation to request reallocation. Enabled mode restricts history even when all three index weights are zero. State is returned by the server after submissions.
- Parent owns UI and allocation normalization helper/tests/browser verification. Forecast agent owns forecast option/service/action/type and disjoint backend tests. Preserve all existing uncommitted approved data and calculation work.
- Scope: main portfolio selector/forecast flow only; no data changes, optimizer redesign, sampling changes, commits or deployment.
- Validation: meaningful local-data scenario count/boundary tests, normalization/action tests, interactive UI checks, existing unit/type/lint/format/build/deployment commands.

- Delivered: accessible opt-in switch above the main portfolio selector; enabled mode adds three zero-weight index controls, displays the 1988/block-19 boundary and preserves existing base weights. Disabling removes hidden index weights without silent redistribution. Numeric allocation controls now have accessible labels.
- The shared normalization helper is used in UI initialization/toggle transitions and server handling before total validation. The action round-trips the boolean without changing the existing four-item options tuple. ForecastOptions defaults disabled and ForecastService applies the block-19 minimum independently of selected weights.
- Browser tests verify visibility, zero defaults, boundary explanation, hidden-weight removal/invalid total, enabled form serialization and restored submission state. Local-data tests verify enabled nominal/real scenario populations 29/406/3,654 versus default 47/1,081/16,215, including zero-weight extra indexes.
- Fixed the existing unexercised browser project's missing Svelte-plugin inheritance with `extends: true` in the client project. Initial browser run could not bind localhost under sandbox, so authorized local browser verification ran with elevated localhost/Chromium permissions. A subsequent compiler failure identified the missing inheritance; one whitespace-sensitive text assertion was corrected, and all browser tests then passed. No product behavior was changed to satisfy that assertion.
- Results: `npm run test:unit` PASS (155 tests / 15 files); `ENVIRONMENT=TEST ./node_modules/.bin/vitest run --project client --browser.headless src/lib/component/PortfolioForm.svelte.spec.ts` PASS (3 Chromium tests); `npm run check` PASS (0 errors / 0 warnings); Node 22 build PASS; `npm run check:deployment` PASS; changed-file ESLint/Prettier PASS; `git diff --check` PASS.
- Pinned lint command: `./node_modules/.bin/eslint src/lib/portfolioAssets.ts src/lib/component/PortfolioForm.svelte src/lib/component/PortfolioForm.svelte.spec.ts src/lib/forecastOptions.ts src/lib/forecastService.ts src/lib/types/formData.ts src/routes/+page.server.ts src/tests/unit/portfolioAssets.spec.ts src/tests/unit/forecastAction.spec.ts src/tests/unit/forecastOptions.spec.ts src/tests/unit/forecastService.spec.ts vitest.config.ts`.
- Pinned formatting uses `./node_modules/.bin/prettier --check` with the same file list. Source datasets and existing reference matrices are unchanged by this selector follow-up.
- Independent read-only review found no actionable toggle regressions. Existing allocation validation, tax/math behavior, constructor defaults and response option tuple remain compatible.
