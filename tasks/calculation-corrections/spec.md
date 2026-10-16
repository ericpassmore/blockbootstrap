# Calculation corrections

## Goal reference

- `goals/calculation-corrections/goals.v1.md` (locked by the user's requests to implement the reviewed findings and fix the remaining type checks).

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
