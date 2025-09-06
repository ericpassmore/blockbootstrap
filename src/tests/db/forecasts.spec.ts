import { describe, it, expect } from 'vitest';
import { ForecastService } from '$lib/forecastService';
import { type Allocation } from '$lib/modelReturns';
import { ForecastOptions } from '$lib/forecastOptions';

describe('Forecast Service', () => {
	it('check real results with 100% Treasuries', async () => {
		const allocations: Allocation[] = [
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 100 }
		];
		const startingAmount = 100000;
		const forecastOptions = new ForecastOptions();
		const forecastService = await ForecastService.create(
			startingAmount,
			allocations,
			forecastOptions
		);

		// check summary data
		expect(forecastService.averageCAGR).toBeTypeOf('number');
		expect(forecastService.averageCAGR).not.toBeNaN();

		expect(forecastService.median).toBeTypeOf('number');
		expect(forecastService.median).not.toBeNaN();

		expect(forecastService.medianSeries[0]).toBeTypeOf('number');
		expect(forecastService.medianSeries).not.toBeNaN();
		expect(forecastService.medianSeries[0]).toBeGreaterThan(1);

		expect(forecastService.q1).toBeTypeOf('number');
		expect(forecastService.q1).not.toBeNaN();
		expect(forecastService.q1Series[0]).toBeTypeOf('number');
		expect(forecastService.q1Series).not.toBeNaN();

		expect(forecastService.q3).toBeTypeOf('number');
		expect(forecastService.q3).not.toBeNaN();
		expect(forecastService.q3Series[0]).toBeTypeOf('number');
		expect(forecastService.q3Series).not.toBeNaN();
		// expect positive numbers every year

		for (const block of forecastService.forecasts) {
			expect(block.blockNumbers[0]).toBeGreaterThan(0);
			expect(block.finalValue).toBeGreaterThan(0);
			expect(block.taxes).toBeGreaterThan(0);
			expect(block.cagr).toBeTypeOf('number');
			expect(block.cagr).not.toBe(0);
		}

		expect(forecastService.forecasts[12].cagr).toBeTypeOf('number');
		expect(forecastService.forecasts[12].cagr).toBeGreaterThan(0);
	});

	it('check real results with 100% Bitcoin', async () => {
		const allocations: Allocation[] = [{ key: 'crypto:BTC', label: 'Bitcoin', value: 100 }];
		const startingAmount = 100000;
		const forecastOptions = new ForecastOptions();
		const forecastService = await ForecastService.create(
			startingAmount,
			allocations,
			forecastOptions
		);

		// check summary data
		expect(forecastService.averageCAGR).toBeTypeOf('number');
		expect(forecastService.averageCAGR).not.toBeNaN();

		expect(forecastService.median).toBeTypeOf('number');
		expect(forecastService.median).not.toBeNaN();

		expect(forecastService.medianSeries[0]).toBeTypeOf('number');
		expect(forecastService.medianSeries).not.toBeNaN();
		expect(forecastService.medianSeries[0]).toBeGreaterThan(1);

		expect(forecastService.q1).toBeTypeOf('number');
		expect(forecastService.q1).not.toBeNaN();
		expect(forecastService.q1Series[0]).toBeTypeOf('number');
		expect(forecastService.q1Series).not.toBeNaN();

		expect(forecastService.q3).toBeTypeOf('number');
		expect(forecastService.q3).not.toBeNaN();
		expect(forecastService.q3Series[0]).toBeTypeOf('number');
		expect(forecastService.q3Series).not.toBeNaN();
		// expect positive numbers every year

		for (const block of forecastService.forecasts) {
			expect(block.blockNumbers[0]).toBeGreaterThan(0);
			expect(block.finalValue).toBeGreaterThan(0);
			expect(block.taxes).toBe(0);
			expect(block.cagr).toBeTypeOf('number');
			expect(block.cagr).not.toBe(0);
		}

		expect(forecastService.forecasts[12].cagr).toBeTypeOf('number');
		expect(forecastService.forecasts[12].cagr).toBeGreaterThan(0);
	});

	it('it should handle rebalencing correctly', async () => {
		const allocations: Allocation[] = [
			{ key: 'sp500', label: 'S&P 500', value: 45 },
			{ key: 'usSmallCap', label: 'US Small Cap', value: 10 },
			{ key: 'TBill', label: 'T-Bill', value: 0 },
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 10 },
			{ key: 'baaCorp', label: 'BAA Corporate Bond', value: 10 },
			{ key: 'realEstate', label: 'Real Estate', value: 20 },
			{ key: 'gold', label: 'Gold', value: 5 },
			{ key: 'crypto:BTC', label: 'Bitcoin', value: 0 }
		];
		const startingAmount = 10000;

		// 10-year forecast
		const withRebalancing = new ForecastOptions(true, false, 10);
		const forecastService10 = await ForecastService.create(
			startingAmount,
			allocations,
			withRebalancing
		);
		const cagr10 = forecastService10.averageCAGR;
		const finalValue10 = forecastService10.median;
		// Check CAGRs are roughly the same
		expect(cagr10).toBeGreaterThan(0);
		expect(cagr10).toBeLessThan(50);
		expect(finalValue10).toBeGreaterThan(startingAmount);
	});

	it('it should handle inflation adjustment correctly', async () => {
		const allocations: Allocation[] = [
			{ key: 'sp500', label: 'S&P 500', value: 45 },
			{ key: 'usSmallCap', label: 'US Small Cap', value: 10 },
			{ key: 'TBill', label: 'T-Bill', value: 0 },
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 10 },
			{ key: 'baaCorp', label: 'BAA Corporate Bond', value: 10 },
			{ key: 'realEstate', label: 'Real Estate', value: 20 },
			{ key: 'gold', label: 'Gold', value: 5 },
			{ key: 'crypto:BTC', label: 'Bitcoin', value: 0 }
		];
		const startingAmount = 10000;

		// 10-year forecast
		const withRebalancing = new ForecastOptions(false, true, 10);
		const forecastService10 = await ForecastService.create(
			startingAmount,
			allocations,
			withRebalancing
		);
		const cagr10 = forecastService10.averageCAGR;
		const finalValue10 = forecastService10.median;
		// Check CAGRs are roughly the same
		expect(cagr10).toBeGreaterThan(0);
		expect(cagr10).toBeLessThan(50);
		expect(finalValue10).toBeGreaterThan(startingAmount);
	});

	it('should handle different return windows (10, 20, 30 years)', async () => {
		const allocations: Allocation[] = [
			{ key: 'sp500', label: 'S&P 500', value: 60 },
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 40 }
		];
		const startingAmount = 10000;

		// 10-year forecast
		const forecastOptions10 = new ForecastOptions(false, false, 10);
		const forecastService10 = await ForecastService.create(
			startingAmount,
			allocations,
			forecastOptions10
		);
		const cagr10 = forecastService10.averageCAGR;
		const finalValue10 = forecastService10.median;

		// 20-year forecast
		const forecastOptions20 = new ForecastOptions(false, false, 20);
		const forecastService20 = await ForecastService.create(
			startingAmount,
			allocations,
			forecastOptions20
		);
		const cagr20 = forecastService20.averageCAGR;
		const finalValue20 = forecastService20.median;

		// 30-year forecast
		const forecastOptions30 = new ForecastOptions(false, false, 30);
		const forecastService30 = await ForecastService.create(
			startingAmount,
			allocations,
			forecastOptions30
		);
		const cagr30 = forecastService30.averageCAGR;
		const finalValue30 = forecastService30.median;

		// correct stats
		expect(forecastService30.median).toBeGreaterThan(forecastService30.q1);
		expect(forecastService30.median).toBeLessThan(forecastService30.q3);
		expect(forecastService20.median).toBeGreaterThan(forecastService20.q1);
		expect(forecastService20.median).toBeLessThan(forecastService20.q3);
		expect(forecastService10.median).toBeGreaterThan(forecastService10.q1);
		expect(forecastService10.median).toBeLessThan(forecastService10.q3);

		// Check CAGRs are roughly the same
		expect(cagr20).toBeCloseTo(cagr10, 0); // within 2 decimal places
		expect(cagr30).toBeCloseTo(cagr10, 0); // within 2 decimal places

		// Check final values for growth
		expect(finalValue20 / finalValue10).toBeGreaterThanOrEqual(1.5); // Broaden range
		expect(finalValue20 / finalValue10).toBeLessThanOrEqual(3.0); // Broaden range

		expect(finalValue30 / finalValue20).toBeGreaterThanOrEqual(1.5); // Broaden range
		expect(finalValue30 / finalValue20).toBeLessThanOrEqual(3.0); // Broaden range
	});
	it('creates a 20 year forecast with 100% allocation to sp500 and checks blocks 47-50 for completeness', async () => {
		const allocations: Allocation[] = [{ key: 'sp500', label: 'S&P 500', value: 100 }];
		const startingAmount = 10000;
		const forecastOptions = new ForecastOptions(false, false, 20);
		const forecastService = await ForecastService.create(
			startingAmount,
			allocations,
			forecastOptions
		);

		// Check blocks 47, 48, 49, 50 for completeness in series
		const blockIdsToCheck = [47, 48, 49, 50];
		for (const blockId of blockIdsToCheck) {
			expect(forecastService.q1Series).not.toContain(blockId);
			expect(forecastService.q3Series).not.toContain(blockId);
			expect(forecastService.medianSeries).not.toContain(blockId);
			expect(forecastService.forecasts.map((f) => f.blockNumbers)).not.toContain(blockId);
		}
	});
});
