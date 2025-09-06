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
