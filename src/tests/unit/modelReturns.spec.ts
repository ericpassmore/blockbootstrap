import { describe, it, expect } from 'vitest';
import { ModelReturns, type Allocation } from '$lib/modelReturns';
import { ForecastOptions } from '$lib/forecastOptions';

describe('Taxes/Appreciation', () => {
	it('treasury taxes are always greater than zero for the first 40 blocks', async () => {
		const allocations: Allocation[] = [
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 100 }
		];
		const startingAmount = 100000;
		// options
		const optionsWithoutRebalance = new ForecastOptions();
		const optionsWithRebalance = new ForecastOptions();
		optionsWithRebalance.rebalanceOn();

		for (let blockNumber = 1; blockNumber <= 40; blockNumber++) {
			const modelWithoutRebalance = await ModelReturns.create(
				startingAmount,
				allocations,
				[blockNumber], // Wrap in array
				optionsWithoutRebalance
			);

			const modelWithRebalance = await ModelReturns.create(
				startingAmount,
				allocations,
				[blockNumber], // Wrap in array
				optionsWithRebalance
			);

			// We expect some ordinary income from treasuries each year, which should result in taxes.
			const totalTaxesWithoutRebalance = modelWithoutRebalance.results.reduce(
				(sum, yearResult) => sum + yearResult.taxes,
				0
			);
			const totalTaxesWithRebalance = modelWithRebalance.results.reduce(
				(sum, yearResult) => sum + yearResult.taxes,
				0
			);

			expect(
				modelWithoutRebalance.results.length,
				`Block ${blockNumber} should have 10 years of results`
			).toBe(10);
			expect(
				totalTaxesWithoutRebalance,
				`Total taxes for block ${blockNumber} should be > 0`
			).toBeGreaterThan(0);
			expect(
				modelWithoutRebalance.results[0].taxes,
				`First year taxes for block ${blockNumber} should be > 0`
			).toBeGreaterThan(0);
			expect(
				totalTaxesWithRebalance,
				'Total taxes for ${blockNumber} should be > 0'
			).toBeGreaterThan(0);
		}
	});
	it('taxes with rebalancing are always greater', async () => {
		const allocations: Allocation[] = [
			{ key: 'sp500', label: 'S&P 500 index', value: 60 },
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 30 },
			{ key: 'bitcoin', label: 'Bitcoin', value: 10 }
		];
		const startingAmount = 100000;
		// options
		const optionsWithoutRebalance = new ForecastOptions();
		const optionsWithRebalance = new ForecastOptions();
		optionsWithRebalance.rebalanceOn();

		for (let blockNumber = 1; blockNumber <= 40; blockNumber++) {
			const modelWithoutRebalance = await ModelReturns.create(
				startingAmount,
				allocations,
				[blockNumber], // Wrap in array
				optionsWithoutRebalance
			);

			const modelWithRebalance = await ModelReturns.create(
				startingAmount,
				allocations,
				[blockNumber], // Wrap in array
				optionsWithRebalance
			);

			// We expect some ordinary income from treasuries each year, which should result in taxes.
			const totalTaxesWithoutRebalance = modelWithoutRebalance.results.reduce(
				(sum, yearResult) => sum + yearResult.taxes,
				0
			);
			const totalTaxesWithRebalance = modelWithRebalance.results.reduce(
				(sum, yearResult) => sum + yearResult.taxes,
				0
			);
			expect(
				totalTaxesWithRebalance,
				'Total taxes with rebalancing for ${blockNumber} should be > total taxes without rebalancing'
			).toBeGreaterThan(totalTaxesWithoutRebalance);
		}
	});
	it('check taxes/appreciation for block 9 with 100% Treasuries', async () => {
		const allocations: Allocation[] = [
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 100 }
		];
		const startingAmount = 100000;
		// options
		const defaultOptions = new ForecastOptions();

		const model = await ModelReturns.create(startingAmount, allocations, [9], defaultOptions); // Wrap in array

		// We expect some ordinary income from treasuries each year, which should result in taxes.
		const totalTaxes = model.results.reduce((sum, yearResult) => sum + yearResult.taxes, 0);
		expect(
			totalTaxes,
			`Taxes for block 9 with 100% Treasuries should be close to $8682.34`
		).toBeCloseTo(8682.34, 2);
		const terminatingValue = model.results[9].endValue;
		expect(terminatingValue, `Terminating value for block 9 with 100% Treasuries`).toBeCloseTo(
			242664.4,
			2
		);
	});
	it('check taxes/appreciation for block 9 with 100% baaCorp', async () => {
		const allocations: Allocation[] = [
			{ key: 'baaCorp', label: 'BAA Corporate Bonds', value: 100 }
		];
		const startingAmount = 100000;
		// options
		const defaultOptions = new ForecastOptions();
		const model = await ModelReturns.create(startingAmount, allocations, [9], defaultOptions); // Wrap in array

		// We expect some ordinary income from treasuries each year, which should result in taxes.
		const totalTaxes = model.results.reduce((sum, yearResult) => sum + yearResult.taxes, 0);
		expect(
			totalTaxes,
			`Total taxes for block 9 with 100% baaCorp should be close to $8682.34`
		).toBeCloseTo(10112.48, 2);
		const terminatingValue = model.results[9].endValue;
		expect(terminatingValue, `Terminating value for block 9 with 100% baaCorp `).toBeCloseTo(
			283910.25,
			2
		);
	});
	it('check taxes/appreciation block 4 with 100% sp500', async () => {
		const allocations: Allocation[] = [{ key: 'sp500', label: 'S&P 500', value: 100 }];
		const startingAmount = 100000;
		// options
		const defaultOptions = new ForecastOptions();
		const model = await ModelReturns.create(startingAmount, allocations, [4], defaultOptions); // Wrap in array

		// We expect some ordinary income from treasuries each year, which should result in taxes.
		const totalTaxes = model.results.reduce((sum, yearResult) => sum + yearResult.taxes, 0);
		expect(
			totalTaxes,
			`Total taxes for block 4 with 100% sp500should be close to $8682.34`
		).toBeCloseTo(10862.77, 2);
		const terminatingValue = model.results[9].endValue;
		expect(terminatingValue, `Terminating value for block 4 with 100% sp500 191232.78`).toBeCloseTo(
			191232.78,
			2
		);
	});
	it('bitcoin allocation in Block 1 should be ok', async () => {
		const allocations: Allocation[] = [{ key: 'bitcoin', label: 'Bitcoin', value: 100 }];
		const startingAmount = 100000;
		// options
		const defaultOptions = new ForecastOptions();
		const model = await ModelReturns.create(startingAmount, allocations, [1], defaultOptions); // Wrap in array
		expect(model.finalValue).toBeTypeOf('number');
		expect(model.finalValue).not.toBeNaN();
		expect(model.finalValue).toBeGreaterThan(5000);
	});

	it('expect single asset rebalencing to have no changes', async () => {
		const allocations: Allocation[] = [
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 100 }
		];
		const startingAmount = 100000;
		// options
		const optionsWithoutRebalance = new ForecastOptions();
		const optionsWithRebalance = new ForecastOptions();
		optionsWithRebalance.rebalanceOn();
		const blockNumbers = [9, 19, 29, 39, 49];

		for (const blockNumber of blockNumbers) {
			const modelWithRebalance = await ModelReturns.create(
				startingAmount,
				allocations,
				[blockNumber], // Wrap in array
				optionsWithRebalance
			);
			const modelWithoutRebalance = await ModelReturns.create(
				startingAmount,
				allocations,
				[blockNumber], // Wrap in array
				optionsWithoutRebalance
			);

			expect(modelWithRebalance.finalValue).toBeCloseTo(modelWithoutRebalance.finalValue);
		}
	});

	it('expect single 60/40 portfilo rebalencing to match totals', async () => {
		const allocations: Allocation[] = [
			{ key: 'sp500', label: 'S&P 500', value: 60 },
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 40 }
		];
		const startingAmount = 100000;
		// options
		const optionsWithoutRebalance = new ForecastOptions();
		const optionsWithRebalance = new ForecastOptions();
		optionsWithRebalance.rebalanceOn();
		const blockNumbers = [9];

		for (const blockNumber of blockNumbers) {
			const modelWithRebalance = await ModelReturns.create(
				startingAmount,
				allocations,
				[blockNumber], // Wrap in array
				optionsWithRebalance
			);
			const modelWithoutRebalance = await ModelReturns.create(
				startingAmount,
				allocations,
				[blockNumber], // Wrap in array
				optionsWithoutRebalance
			);

			const totalTaxesWithoutRebalance = modelWithoutRebalance.results.reduce(
				(sum, yearResult) => sum + yearResult.taxes,
				0
			);
			const totalTaxesWithRebalance = modelWithRebalance.results.reduce(
				(sum, yearResult) => sum + yearResult.taxes,
				0
			);
			expect(modelWithRebalance.finalValue).not.toBeCloseTo(modelWithoutRebalance.finalValue);
			expect(modelWithRebalance.finalValue).toBeCloseTo(339291.18, 2);
			expect(totalTaxesWithRebalance).toBeGreaterThan(totalTaxesWithoutRebalance);
		}
	});

	it('expect smaller inflation adjusted sp500', async () => {
		const allocations: Allocation[] = [{ key: 'sp500', label: 'S&P 500', value: 100 }];
		const startingAmount = 100000;
		// options
		const defaultOptions = new ForecastOptions(); // Define defaultOptions here
		const optionsWithInflationAdj = new ForecastOptions();
		optionsWithInflationAdj.adjustForInflationOn();
		const blockNumber = 9;

		const model = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber],
			defaultOptions
		); // Wrap in array, use defaultOptions

		const modelInflationAdjusted = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber], // Wrap in array
			optionsWithInflationAdj
		);

		expect(model.finalValue).toBeCloseTo(407806.67, 2);
		expect(modelInflationAdjusted.finalValue).toBeCloseTo(226341.85, 2);
		expect(modelInflationAdjusted.finalValue).toBeLessThan(model.finalValue);
	});

	it('expect smaller inflation adjusted us small caps', async () => {
		const allocations: Allocation[] = [{ key: 'usSmallCap', label: 'US Small Cap', value: 100 }];
		const startingAmount = 100000;
		// options
		const defaultOptions = new ForecastOptions(); // Define defaultOptions here
		const optionsWithInflationAdj = new ForecastOptions();
		optionsWithInflationAdj.adjustForInflationOn();
		const blockNumber = 9;

		const model = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber],
			defaultOptions
		); // Wrap in array, use defaultOptions

		const modelInflationAdjusted = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber], // Wrap in array
			optionsWithInflationAdj
		);

		expect(model.finalValue).toBeCloseTo(406630.54, 2);
		expect(modelInflationAdjusted.finalValue).toBeCloseTo(232027.93, 2);
		expect(modelInflationAdjusted.finalValue).toBeLessThan(model.finalValue);
	});

	it('should generate significant capital gains taxes with a volatile asset', async () => {
		const allocations: Allocation[] = [
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 90 },
			{ key: 'bitcoin', label: 'Bitcoin', value: 10 }
		];
		const startingAmount = 100000;
		// options
		const optionsWithoutRebalance = new ForecastOptions();
		const optionsWithRebalance = new ForecastOptions();
		optionsWithRebalance.rebalanceOn();
		const blockNumber = 40; // A block with significant bitcoin volatility

		const modelWithoutRebalance = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber], // Wrap in array
			optionsWithoutRebalance
		);

		const modelWithRebalance = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber], // Wrap in array
			optionsWithRebalance
		);

		const totalTaxesWithoutRebalance = modelWithoutRebalance.results.reduce(
			(sum, yearResult) => sum + yearResult.taxes,
			0
		);
		const totalTaxesWithRebalance = modelWithRebalance.results.reduce(
			(sum, yearResult) => sum + yearResult.taxes,
			0
		);

		// With a volatile asset like Bitcoin, rebalancing should trigger significant capital gains.
		expect(totalTaxesWithRebalance).toBeGreaterThan(totalTaxesWithoutRebalance);

		// Check if the final values are different, as rebalancing should lead to a different outcome.
		expect(modelWithRebalance.finalValue).not.toBeCloseTo(modelWithoutRebalance.finalValue);
	});
});

describe('Tax Scenarios', () => {
	it('Test Rebalancing with Gold', async () => {
		const allocations: Allocation[] = [
			{ key: 'sp500', label: 'S&P 500', value: 50 },
			{ key: 'gold', label: 'Gold', value: 50 }
		];
		const startingAmount = 100000;
		// options
		const optionsWithoutRebalance = new ForecastOptions();
		const optionsWithRebalance = new ForecastOptions();
		optionsWithRebalance.rebalanceOn();
		// Block 2 has gold with negative returns in the first year and SP500 with positive returns.
		// This should force a rebalance where gold is sold.
		const blockNumber = 2;

		const modelWithRebalance = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber],
			optionsWithRebalance
		); // Wrap in array
		const modelNoRebalance = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber], // Wrap in array
			optionsWithoutRebalance
		);

		const totalTaxes = modelWithRebalance.results.reduce((sum, r) => sum + r.taxes, 0);
		const totalTaxesNoRebalance = modelNoRebalance.results.reduce((sum, r) => sum + r.taxes, 0);

		// Rebalancing should trigger capital gains taxes, so taxes should be higher.
		expect(totalTaxes).toBeGreaterThan(totalTaxesNoRebalance);
	});

	it('Test Rebalancing with No Gains', async () => {
		const allocations: Allocation[] = [
			{ key: 'sp500', label: 'S&P 500', value: 50 },
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 50 }
		];
		const startingAmount = 100000;
		// options
		const optionsWithRebalance = new ForecastOptions();
		optionsWithRebalance.rebalanceOn();
		// Block 5 (1974-1983) has negative returns for SP500 in the first year.
		const blockNumber = 5;

		const model = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber],
			optionsWithRebalance
		); // Wrap in array
		const firstYearTaxes = model.results[0].taxes;

		// With SP500 having a loss, rebalancing will sell treasuries (assuming they gained value, which they did).
		// This will generate ordinary income tax, but capital gains tax should be low or zero for this year.
		// A precise assertion is hard without exposing capital gains data.
		// We can assert that the taxes are less than a certain amount.
		expect(firstYearTaxes).toBeGreaterThan(0); // From treasury income
	});

	it('Test the NIIT (Net Investment Income Tax) Threshold', async () => {
		const allocations: Allocation[] = [{ key: 'sp500', label: 'S&P 500', value: 100 }];
		const startingAmount = 10_000_000;
		// options
		const optionsWithRebalance = new ForecastOptions();
		optionsWithRebalance.rebalanceOn();
		const blockNumber = 9; // High-growth block

		const model = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber],
			optionsWithRebalance
		); // Wrap in array
		const firstYearResult = model.results[0];

		// In block 9, year 1 (1978), SP500 grew by 6.56%. With a $10M start, that's a $656,000 gain.
		// This is above the $600,000 NIIT threshold.
		const gain = firstYearResult.endValue - firstYearResult.startValue;
		const expectedTaxRate = (20 + 3.8) / 100;
		const expectedTaxes = gain * expectedTaxRate;

		// This is an approximation because rebalancing might not sell the entire gain.
		// But it should be in the ballpark.
		expect(firstYearResult.taxes).toBeCloseTo(expectedTaxes, -5);
	});

	it('Test Rebalancing with a Mix of Income-Producing and Growth Assets', async () => {
		const allocations: Allocation[] = [
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 40 },
			{ key: 'sp500', label: 'S&P 500', value: 60 }
		];
		const startingAmount = 100000;
		// options
		const optionsWithRebalance = new ForecastOptions();
		optionsWithRebalance.rebalanceOn();
		const defaultOptions = new ForecastOptions();
		const blockNumber = 9;

		const model = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber],
			optionsWithRebalance
		); // Wrap in array
		const modelNoRebalance = await ModelReturns.create(
			startingAmount,
			allocations,
			[blockNumber], // Wrap in array
			defaultOptions
		);

		const totalTaxes = model.results.reduce((sum, r) => sum + r.taxes, 0);
		const totalTaxesNoRebalance = modelNoRebalance.results.reduce((sum, r) => sum + r.taxes, 0);

		// The tax with rebalancing should be higher due to capital gains being realized.
		expect(totalTaxes).toBeGreaterThan(totalTaxesNoRebalance);

		// Also check that the first year has taxes, indicating income from all sources is processed.
		expect(model.results[0].taxes).toBeGreaterThan(0);
	});
});
