-- Table for storing power law equation parameters
-- Power law form: y = a * x^b or y = a * x^b + c (depending on model variant)

CREATE TABLE power_law_fits (
    symbol VARCHAR(50) PRIMARY KEY,
    tag VARCHAR(100),

    -- Core power law parameters
    coefficient_a DOUBLE PRECISION NOT NULL,  -- scaling coefficient
    exponent_b DOUBLE PRECISION NOT NULL,     -- power exponent
    offset_c DOUBLE PRECISION DEFAULT 0.0,    -- optional offset term

    -- Model metadata
    r_squared DOUBLE PRECISION,               -- goodness of fit
    rmse DOUBLE PRECISION,                    -- root mean square error
    sample_size INTEGER,                      -- number of data points used
    x_min DOUBLE PRECISION,                   -- minimum x value in fit range
    x_max DOUBLE PRECISION,                   -- maximum x value in fit range

    -- Confidence intervals (optional)
    coefficient_a_ci_lower DOUBLE PRECISION,
    coefficient_a_ci_upper DOUBLE PRECISION,
    exponent_b_ci_lower DOUBLE PRECISION,
    exponent_b_ci_upper DOUBLE PRECISION,

    -- Audit fields
    fitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fitted_by VARCHAR(100),
    notes TEXT,

    -- Constraints
    CONSTRAINT valid_sample_size CHECK (sample_size > 0),
    CONSTRAINT valid_range CHECK (x_max >= x_min)
);


-- Table for storing cryptocurrency genesis dates
-- Tracks launch dates for cryptocurrencies with symbol as primary key

CREATE TABLE crypto_genesis_dates (
    symbol VARCHAR(50) PRIMARY KEY,
    genesis_date DATE NOT NULL
);

INSERT INTO crypto_genesis_dates (symbol, genesis_date) VALUES
  ('BTC','2020-03-20' ),
  ('ETH', '2020-03-20'),
  ('XRP', '2020-03-20'),
  ('SOL', '2020-03-20');

INSERT INTO power_law_fits (
  symbol, tag, coefficient_a, exponent_b, offset_c, r_squared, rmse, sample_size, x_min, x_max,
  coefficient_a_ci_lower, coefficient_a_ci_upper, exponent_b_ci_lower, exponent_b_ci_upper,
  fitted_at, fitted_by, notes
) VALUES
  (
    'BTC', 'power_law_fit', 0.0002443997509827031, 2.5950759049301566, 22741.000597606293, 0.9764434444372686,
    16002.979380273933, 69, 12, 4669,
    -6.0927753173835265e-05, 0.0005497272551392415, 2.446173139954171, 2.7439786699061424,
    '2025-08-23 21:16:18.481001', 'testing_data', NULL
  );
