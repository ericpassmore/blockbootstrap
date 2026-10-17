# Data Description for Portfolio Construction

This document describes the data contained in the following files:

- `data/nominal_returns_10yr_blocks_1970on.csv`
- `data/real_returns_10yr_blocks_1970on.csv`
- `data/risk_free_returns_10yr_blocks_1970on.csv`
- `data/analysis/variance_covariance_series_*.csv`
- `data/analysis/mean_std_series_*.csv`
- `data/analysis/variance_covariance_series_latest.csv`
- `data/analysis/mean_std_series_latest.csv`

## Naming Conventions and File Series

The application bundles the runtime return and yield CSVs under `static/data` for calculations. Portfolio optimization computes means and sample covariance from the same selected return type (nominal, real, or excess); it does not read the precomputed analysis files.

Precomputed covariance and mean/std files live in the repository's `data/analysis/` directory, outside the public `static/` directory. They remain available for local validation and regeneration, and `.vercelignore` excludes them from CLI uploads. Fresh SvelteKit/Vercel builds do not include them as static assets; the former `/data/analysis/` download URLs are no longer provided by new deployments. Rebuild before deploying prebuilt output so it reflects this change.

To regenerate all nominal covariance matrices from their source blocks, run `python3 scripts/regenerate_covariance.py`. To reconcile missing EM/NASDAQ observations that already exist in another overlapping legacy block, run `node scripts/repair-legacy-block-data.mjs`. The unit suite independently checks the matrices against source observations and checks annual consistency across overlapping legacy blocks.

### Complete 2025 return update

The seven 2025 annual total returns from [Damodaran's January 5, 2026 update](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html) are recorded in `data/sources/damodaran-2025.json`: S&P 500 17.78%, small caps 16.53%, T-bills 4.21%, 10-year Treasuries 7.80%, Baa corporate bonds 6.96%, real estate 1.58%, and gold 66.22%.

These returns are applied consistently to all four occurrences of 2025 in blocks 47–50. Earlier observations are unchanged. Inflation, S&P dividend yield and the remaining seven asset returns are supplied by the sources below. `MarketYields.csv` is unchanged: bond coupon yields are different inputs from annual total returns.

The remaining equity returns are recorded in `data/sources/equity-index-returns-2025.json`: **31.89%** for [MSCI EAFE gross USD](https://www.msci.com/documents/10199/255599/msci-eafe.pdf), **34.36%** for [MSCI Emerging Markets gross USD](https://www.msci.com/documents/10199/255599/msci-emerging-markets-index-gross.pdf), and **20.17%** for [Nasdaq-100 NDX price returns](https://indexes.nasdaq.com/docs/NDXE%20Performance%20Update_Dec%202025.pdf). These benchmark mappings are inferred from matching historical sequences. The Nasdaq column retains its existing price-return convention, rather than switching to XNDX total returns of 21.02%. Prior years are preserved, including the existing 2018 EM value of -14.25%, which differs by one basis point from the current MSCI factsheet.

Observed crypto returns are recorded in `data/sources/coinbase-crypto-returns-2025.json`: **BTC -6.27%**, **ETH -10.91%**, **XRP -11.56%**, and **SOL -34.09%**. They are calculated as `(2025 close / 2024 close - 1) * 100` from Coinbase Exchange USD spot markets using the last trade in the December 31 UTC daily bucket for each year. The ledger preserves endpoint URLs, raw daily candles, prices, timestamps and independent final-minute close checks. [Coinbase's candle documentation](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles) defines bucket times and closing prices. These are single-exchange price returns, excluding staking rewards and fees, normalized to two decimal places in percent units. They replace 2025 synthetic crypto projections in all four copies. Non-2025 crypto projections in the nominal/real/excess files remain unchanged; this update does not make those earlier values observed history.

The separately supplied 2025 inflation source is the U.S. Bureau of Labor Statistics article [Consumer Price Index: 2025 in review](https://www.bls.gov/opub/ted/2026/consumer-price-index-2025-in-review.htm), published January 21, 2026. Its CPI-U **All items** value is **2.7%**, measuring the change from December 2024 to December 2025, not seasonally adjusted. This is a December-to-December change, not an annual-average change. The source and value are recorded in `data/sources/bls-inflation-2025.json` and applied to all four 2025 inflation observations: `2.70%` in the legacy CSV and `0.0270` in the nominal CSV.

The separately supplied 2025 S&P 500 dividend yield is **1.15%** from [Multpl's yearly table](https://www.multpl.com/s-p-500-dividend-yield/table/by-year), observed December 31, 2025. This is a year-end trailing 12-month dividend-per-share/price yield, used as the existing annual tax model's dividend input. The source and value are recorded in `data/sources/multpl-sp500-dividend-yield-2025.json` and applied to all four 2025 copies: `1.15%` in the legacy CSV and `0.0115` in the nominal CSV. S&P total returns already include dividends; the yield is not added to those returns.

The nominal CSV uses decimal returns; the legacy block CSV uses percentage points. All fourteen 2025 excess returns are derived as `(1 + nominal) / (1 + T-bill return) - 1`, rounded to four decimal places. All fourteen real 2025 returns are derived as `(1 + nominal) / 1.027 - 1`, rounded to four decimal places. The auxiliary inflation/dividend columns in the real and excess files remain blank by convention. Run `python3 scripts/update-2025-returns.py` to reproduce the return, inflation and dividend update from all five offline source snapshots, or add `--check` to verify it without writing files.

Nominal and inflation-adjusted forecasts can use the 2016–2025 block for all supported assets. Historical crypto mode consumes the observed crypto returns; power-law mode continues to override them with its projections. Future blocks 48–50 remain incomplete. The full-asset portfolio builder now allows ranges ending in 2025 and calculates matching nominal, real or excess statistics directly from the selected observations. Existing precomputed analysis pairs cover blocks 19–45 and contain no 2025 observations, so this update does not change their statistics. The model's small-cap dividend yield remains the existing fixed 1.5% assumption, not a sourced 2025 observation.

- The files `nominal_returns_10yr_blocks_1970on.csv`, `real_returns_10yr_blocks_1970on.csv`, and `risk_free_returns_10yr_blocks_1970on.csv` contain return data for various asset classes, spanning from 1970 onwards, organized in 10-year blocks. These represent nominal returns, real returns, and risk-free returns respectively.
- The `variance_covariance_series_*.csv` files represent batches of variance-covariance matrices for different series of assets. Each file covers a batch of series, indicated by the suffix (e.g., `1_10` covers series 1 to 10).
- The `mean_std_series_*.csv` files contain batches of mean returns and standard deviations for the same series of assets as the variance-covariance files, also broken into batches by series number.

Both the variance-covariance and mean/std series files are split into batches to manage large datasets, with each batch covering a subset of series.

In addition to the batch files described above, the following files provide the most recent data starting from 2019 for variance-covariance matrices and mean/std statistics:

- `variance_covariance_series_latest.csv`: This file contains the most recent data starting from 2019 for variance-covariance matrices of all asset series. It represents the up-to-date covariance information, combining or superseding the batch files for ease of use in portfolio risk assessment.

- `mean_std_series_latest.csv`: This file contains the most recent data starting from 2019 for mean returns and standard deviations of all asset series. It provides the current summary statistics of asset returns, facilitating streamlined portfolio construction and analysis.

These "latest" files are intended to simplify access to the most recent data without needing to reference multiple batch files.

---

## File Descriptions

### 1. `nominal_returns_10yr_blocks_1970on.csv`

This file contains nominal return data for multiple asset classes and financial instruments, organized by series and year.

**Columns:**

- `Series`: Identifier for the series or batch.
- `Year`: Year index within the series.
- `calendar year`: Actual calendar year.
- Asset columns (e.g., `S&P 500 (includes dividends)`, `US Small cap (bottom decile)`, `3-month T.Bill`, `US T. Bond (10-year)`, `Baa Corporate Bond`, `Real Estate`, `Gold*`, `Bitcoin*`, `International Stocks`, `Emerging Markets`, `NASDAQ 100`, `Ethereum`, `XRP`, `SOL`): Nominal returns for each asset.
- `inflation`: Inflation rate for the period.
- `SP500 Dividend Yield`: Dividend yield for the S&P 500.

**Purpose:**

This dataset provides nominal returns for a wide range of assets over multiple decades. It is used as foundational data for portfolio construction, allowing analysis of asset returns and inflation effects.

---

### 2. `real_returns_10yr_blocks_1970on.csv`

This file contains real return data (inflation-adjusted) for the same set of assets and periods as the nominal returns file.

**Columns:**

- Same as in the nominal returns file, but values represent real returns adjusted for inflation.

**Purpose:**

This dataset provides inflation-adjusted returns, useful for understanding the true purchasing power growth of assets over time.

---

### 3. `risk_free_returns_10yr_blocks_1970on.csv`

This file contains risk-free return data for the same assets and periods.

**Columns:**

- Same as in the nominal and real returns files, but values represent risk-free returns.

**Purpose:**

This dataset provides risk-free return benchmarks, essential for calculating excess returns and risk-adjusted performance metrics.

---

### 4. `variance_covariance_series_*.csv`

These files contain variance-covariance matrices for batches of asset series.

**Structure:**

- The first few lines include a header indicating the series batch (e.g., "Series 1 Variance-Covariance Matrix").
- The matrix is square, with rows and columns labeled by asset names.
- Each cell contains the covariance between the corresponding pair of assets.

**Assets included:**

- Common financial assets such as `S&P 500 (includes dividends)`, `US Small cap (bottom decile)`, `US T. Bond (10-year)`, `Baa Corporate Bond`, `Real Estate`, `Gold*`, `SP500 Dividend Yield`, `Bitcoin*`, `International Stocks`, `Emerging Markets`, `NASDAQ 100`, `Ethereum`, `XRP`, `SOL`.

**Purpose:**

These matrices provide the covariance between asset returns, essential for portfolio risk assessment and optimization. The batch structure allows handling large datasets by splitting into manageable series groups.

---

### 5. `mean_std_series_*.csv`

These files contain mean returns and standard deviations for batches of asset series.

**Columns:**

- `Series`: Series or batch identifier.
- `Asset`: Name of the asset.
- `Mean Return`: Average return of the asset over the series period.
- `Std Deviation`: Standard deviation (volatility) of the asset returns.

**Assets included:**

- Same as in the variance-covariance files.

**Purpose:**

This data provides summary statistics of asset returns, useful for portfolio construction to understand expected returns and risk (volatility) of each asset in the series.

---

## Summary

- The data is organized into three main return files (`nominal_returns_10yr_blocks_1970on.csv`, `real_returns_10yr_blocks_1970on.csv`, and `risk_free_returns_10yr_blocks_1970on.csv`), each providing different return perspectives (nominal, real, risk-free) across multiple assets and time periods.
- The data is also organized into two main series of files (`variance_covariance_series_*.csv` and `mean_std_series_*.csv`), each split into batches by series number for scalability.
- The `variance_covariance_series_latest.csv` and `mean_std_series_latest.csv` files provide the most recent data starting from 2019 for variance-covariance matrices and mean/std statistics, simplifying access to the latest information.
- Together, these datasets support comprehensive portfolio construction by providing return data, risk (volatility), and covariance information for a broad set of financial assets.
