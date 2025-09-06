import { pgTable } from 'drizzle-orm/pg-core';

export const users = pgTable('users', (columnTypes) => ({
	id: columnTypes.serial('id').primaryKey(),
	email: columnTypes.varchar('email', { length: 255 }).notNull().unique(),
	firstLoginDate: columnTypes.timestamp('first_login_date'),
	lastLoginDate: columnTypes.timestamp('last_login_date'),
	code: columnTypes.integer('code').notNull()
}));

export const cryptoGenesisDates = pgTable('crypto_genesis_dates', (columnTypes) => ({
	symbol: columnTypes.varchar('symbol').primaryKey(),
	genesis_date: columnTypes.date('genesis_date')
}));

/**
 * Table: power_law_fits
 *
 * Stores parameters for the power law equation: y = a × x^b + c
 *
 * Core Parameters:
 * - coefficient_a: Scaling coefficient (multiplier)
 * - exponent_b: Power exponent (determines curve shape)
 * - offset_c: Constant offset term (y-intercept adjustment)
 *
 * Quality Metrics:
 * - r_squared: Coefficient of determination (0-1, higher = better fit)
 * - rmse: Root Mean Square Error (lower = better fit)
 * - sample_size: Number of data points used in the fit (must be > 0)
 *
 * Data Range:
 * - x_min: Minimum x value (days since genesis) in fitted data
 * - x_max: Maximum x value (days since genesis) in fitted data (must be >= x_min)
 *
 * Confidence Intervals (95%):
 * - coefficient_a_ci_lower/upper: Confidence bounds for coefficient a
 * - exponent_b_ci_lower/upper: Confidence bounds for exponent b
 *
 * Audit Fields:
 * - fitted_at: Timestamp when fit was performed
 * - fitted_by: User who performed the fit
 * - notes: Additional notes
 *
 * Constraints valid_sample_size (sample_size > 0) and valid_range (x_max >= x_min)
 * should be enforced at the database level or via migrations.
 */
export const powerLawFits = pgTable('power_law_fits', (columnTypes) => ({
	symbol: columnTypes.varchar('symbol', { length: 50 }).primaryKey(),
	tag: columnTypes.varchar('tag', { length: 100 }),

	// Core power law parameters
	coefficient_a: columnTypes.doublePrecision('coefficient_a').notNull(),
	exponent_b: columnTypes.doublePrecision('exponent_b').notNull(),
	offset_c: columnTypes.doublePrecision('offset_c').notNull().default(0),

	// Model metadata
	r_squared: columnTypes.doublePrecision('r_squared'),
	rmse: columnTypes.doublePrecision('rmse'),
	sample_size: columnTypes.integer('sample_size').notNull(),
	x_min: columnTypes.doublePrecision('x_min'),
	x_max: columnTypes.doublePrecision('x_max'),

	// Confidence intervals (optional)
	coefficient_a_ci_lower: columnTypes.doublePrecision('coefficient_a_ci_lower'),
	coefficient_a_ci_upper: columnTypes.doublePrecision('coefficient_a_ci_upper'),
	exponent_b_ci_lower: columnTypes.doublePrecision('exponent_b_ci_lower'),
	exponent_b_ci_upper: columnTypes.doublePrecision('exponent_b_ci_upper'),

	// Audit fields
	fitted_at: columnTypes.timestamp('fitted_at').defaultNow(),
	fitted_by: columnTypes.varchar('fitted_by', { length: 100 }),
	notes: columnTypes.text('notes')
}));
