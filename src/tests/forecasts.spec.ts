import { describe, it, expect } from 'vitest';
import { ForecastService } from '$lib/forecastService';
import { type Allocation } from '$lib/modelReturns';

describe('Forecast Service', () => {
	it('check real results with 100% Treasuries', async () => {
		const allocations: Allocation[] = [
			{ key: 'treasury10Year', label: '10-Year Treasury', value: 100 }
		];
		const startingAmount = 100000;
		const forecastService = await ForecastService.create(startingAmount, allocations);

		// check summary data
		expect(forecastService.averageCAGR).toBeTypeOf('number');
		expect(forecastService.averageCAGR).not.toBeNaN();

		expect(forecastService.median).toBeTypeOf('number');
		expect(forecastService.median).not.toBeNaN();

		expect(forecastService.medianSeries).toBeTypeOf('number');
		expect(forecastService.medianSeries).not.toBeNaN();
		expect(forecastService.medianSeries).toBeGreaterThan(1);

		expect(forecastService.q1).toBeTypeOf('number');
		expect(forecastService.q1).not.toBeNaN();
		expect(forecastService.q1Series).toBeTypeOf('number');
		expect(forecastService.q1Series).not.toBeNaN();

		expect(forecastService.q3).toBeTypeOf('number');
		expect(forecastService.q3).not.toBeNaN();
		expect(forecastService.q3Series).toBeTypeOf('number');
		expect(forecastService.q3Series).not.toBeNaN();
		// expect positive numbers every year

		for (const block of forecastService.forecasts) {
			expect(block.blockNumber).toBeGreaterThan(0);
			expect(block.finalValue).toBeGreaterThan(0);
			expect(block.taxes).toBeGreaterThan(0);
			expect(block.cagr).toBeTypeOf('number');
			expect(block.cagr).not.toBe(0);
		}

		expect(forecastService.forecasts[12].cagr).toBeTypeOf('number');
		expect(forecastService.forecasts[12].cagr).toBeGreaterThan(0);
	});
	it('check real results with 100% Bitcoin', async () => {
		const allocations: Allocation[] = [{ key: 'bitcoin', label: 'Bitcoin', value: 100 }];
		const startingAmount = 100000;
		const forecastService = await ForecastService.create(startingAmount, allocations);

		// check summary data
		expect(forecastService.averageCAGR).toBeTypeOf('number');
		expect(forecastService.averageCAGR).not.toBeNaN();

		expect(forecastService.median).toBeTypeOf('number');
		expect(forecastService.median).not.toBeNaN();

		expect(forecastService.medianSeries).toBeTypeOf('number');
		expect(forecastService.medianSeries).not.toBeNaN();
		expect(forecastService.medianSeries).toBeGreaterThan(1);

		expect(forecastService.q1).toBeTypeOf('number');
		expect(forecastService.q1).not.toBeNaN();
		expect(forecastService.q1Series).toBeTypeOf('number');
		expect(forecastService.q1Series).not.toBeNaN();

		expect(forecastService.q3).toBeTypeOf('number');
		expect(forecastService.q3).not.toBeNaN();
		expect(forecastService.q3Series).toBeTypeOf('number');
		expect(forecastService.q3Series).not.toBeNaN();
		// expect positive numbers every year

		for (const block of forecastService.forecasts) {
			expect(block.blockNumber).toBeGreaterThan(0);
			expect(block.finalValue).toBeGreaterThan(0);
			expect(block.taxes).toBe(0);
			expect(block.cagr).toBeTypeOf('number');
			expect(block.cagr).not.toBe(0);
		}

		expect(forecastService.forecasts[12].cagr).toBeTypeOf('number');
		expect(forecastService.forecasts[12].cagr).toBeGreaterThan(0);
	});
});
