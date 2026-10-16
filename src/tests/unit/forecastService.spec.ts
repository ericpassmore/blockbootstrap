import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlockData } from '$lib/block';
import { ConstantRateReturns } from '$lib/constantRateReturns';
import { ForecastOptions } from '$lib/forecastOptions';
import { ForecastService, type Forecast, type StatisticsResult } from '$lib/forecastService';
import { ModelReturns, type Allocation } from '$lib/modelReturns';
import { forecastLabels, sameSeries } from '$lib/forecastDisplay';

const records = vi.hoisted(() => ({ summaries: 0, details: 0, summaryRows: 0, detailRows: 0 }));
vi.mock('$lib/modelReturns', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/modelReturns')>();
	return {
		...actual,
		ModelReturns: class extends actual.ModelReturns {
			constructor(...args: ConstructorParameters<typeof actual.ModelReturns>) {
				super(...args);
				if (args[4] === false) {
					records.summaries++;
					records.summaryRows += this.results.length;
				} else {
					records.details++;
					records.detailRows += this.results.length;
				}
			}
		}
	};
});

const allocations: Allocation[] = [
	{ key: 'sp500', label: 'S&P 500', value: 60 },
	{ key: 'treasury10Year', label: 'Treasury', value: 40 }
];

beforeAll(async () => {
	await Promise.all([BlockData.init(), ConstantRateReturns.init()]);
});
beforeEach(() => {
	Object.assign(records, { summaries: 0, details: 0, summaryRows: 0, detailRows: 0 });
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
	vi.stubGlobal(
		'fetch',
		vi.fn(() => {
			throw new Error('Unexpected network access');
		})
	);
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('local-data forecast aggregation', () => {
	it('calculates all 15,180 scenarios but materializes only 50 detailed thirty-year paths', async () => {
		const options = new ForecastOptions(false, false, 30, true);
		const service = await ForecastService.create(100000, allocations, options);
		expect(service.scenarioCount).toBe(15180);
		expect(service.forecasts).toHaveLength(50);
		expect(records).toEqual({ summaries: 15180, details: 50, summaryRows: 0, detailRows: 1500 });
		expect(new Set(service.forecasts.map((forecast) => forecast.blockNumbers.join(','))).size).toBe(
			50
		);
		for (const blocks of [service.q1Series, service.medianSeries, service.q3Series]) {
			expect(service.forecasts.some((forecast) => sameSeries(forecast.blockNumbers, blocks))).toBe(
				true
			);
		}
		for (const forecast of service.forecasts) {
			const detailed = new ModelReturns(100000, allocations, forecast.blockNumbers, options);
			expect(forecast.finalValue).toBe(detailed.finalValue);
			expect(forecast.taxes).toBe(detailed.totalTaxes);
			expect(forecast.cagr).toBe(detailed.calculateCAGR() * 100);
			expect(forecast.results.at(-1)?.endValue).toBe(forecast.finalValue);
			expect(forecast.results.map((row) => row.year)).toEqual(
				Array.from({ length: 30 }, (_, index) => 2027 + index)
			);
		}
	});

	it('computes percentiles, mean CAGR and standard deviation over every scenario before thinning', async () => {
		const expected: { blocks: number[]; value: number; cagr: number }[] = [];
		for (let first = 1; first <= 46; first++) {
			for (let second = first + 1; second <= 46; second++) {
				const rows = [first, second].flatMap((block) => BlockData.getSeries(block)!);
				const value = allocations.reduce(
					(total, asset) =>
						total +
						rows.reduce(
							(amount, row) => amount * (1 + row[asset.key] / 100),
							(100000 * asset.value) / 100
						),
					0
				);
				expected.push({
					blocks: [first, second],
					value,
					cagr: ((value / 100000) ** (1 / 20) - 1) * 100
				});
			}
		}
		expected.sort((left, right) => left.value - right.value);
		const service = await ForecastService.create(
			100000,
			allocations,
			new ForecastOptions(false, false, 20, true)
		);
		const mean = expected.reduce((total, scenario) => total + scenario.value, 0) / expected.length;
		const std = Math.sqrt(
			expected.reduce((total, scenario) => total + (scenario.value - mean) ** 2, 0) /
				expected.length
		);
		expect(service.scenarioCount).toBe(expected.length);
		expect(service.averageCAGR).toBeCloseTo(
			expected.reduce((total, scenario) => total + scenario.cagr, 0) / expected.length,
			10
		);
		expect(service.finalValueStdDev).toBeCloseTo(std, 6);
		for (const [fraction, value, blocks] of [
			[0.25, service.q1, service.q1Series],
			[0.5, service.median, service.medianSeries],
			[0.75, service.q3, service.q3Series]
		] as const) {
			const scenario = expected[Math.round((expected.length - 1) * fraction)];
			expect(value).toBeCloseTo(scenario.value, 6);
			expect(blocks).toEqual(scenario.blocks);
		}
	});

	it('uses actual eligible IDs for emerging markets, ignoring zero-weight unsupported history', async () => {
		const service = await ForecastService.create(
			10000,
			[
				{ key: 'emergingMarkets', label: 'EM', value: 100 },
				{ key: 'nasdaq100', label: 'NASDAQ', value: 0 }
			],
			new ForecastOptions()
		);
		expect(service.scenarioCount).toBe(28);
		expect(
			service.forecasts.map((forecast) => forecast.blockNumbers[0]).sort((a, b) => a - b)
		).toEqual(Array.from({ length: 28 }, (_, index) => index + 19));
		const unrestricted = await ForecastService.create(
			10000,
			[
				{ key: 'sp500', label: 'S&P', value: 100 },
				{ key: 'emergingMarkets', label: 'EM', value: 0 },
				{ key: 'crypto:BTC', label: 'BTC', value: 0 }
			],
			new ForecastOptions()
		);
		expect(unrestricted.scenarioCount).toBe(46);
	});

	it('reports insufficient eligible history without calculating empty percentiles', async () => {
		vi.spyOn(BlockData, 'getEligibleBlockNumbers').mockReturnValue([19]);
		await expect(
			ForecastService.create(10000, allocations, new ForecastOptions(false, false, 20))
		).rejects.toThrow('Not enough complete historical blocks');
	});
});

describe('percentile path selection and display', () => {
	const paths: Forecast[] = [
		[1, 2],
		[1, 3],
		[1, 4],
		[2, 3]
	].map((blocks, index) => ({
		blockNumbers: blocks,
		finalValue: index + 1,
		taxes: 0,
		cagr: 0,
		results: []
	}));
	const statistics: StatisticsResult = {
		q1Result: { value: 1, seriesNumbers: [1, 2] },
		medianResult: { value: 2, seriesNumbers: [1, 3] },
		q3Result: { value: 3, seriesNumbers: [1, 4] }
	};
	it('keeps percentile paths that share the first block and labels their full identities', () => {
		const service = new ForecastService(1, paths, statistics);
		expect(service.forecasts.map((forecast) => forecast.blockNumbers)).toEqual(
			paths.map((forecast) => forecast.blockNumbers)
		);
		const series = {
			q1Series: service.q1Series,
			medianSeries: service.medianSeries,
			q3Series: service.q3Series
		};
		expect(paths.map((forecast) => forecastLabels(forecast.blockNumbers, series))).toEqual([
			['Conservative estimate'],
			['Median estimate'],
			['Optimistic estimate'],
			[]
		]);
		expect(forecastLabels([1], series)).toEqual([]);
	});
	it('shows all applicable labels when a single path represents every percentile', () => {
		const percentile = { value: 1, seriesNumbers: [1, 2] };
		const service = new ForecastService(1, [paths[0]], {
			q1Result: percentile,
			medianResult: percentile,
			q3Result: percentile
		});
		expect(service.forecasts).toHaveLength(1);
		expect(forecastLabels([1, 2], service)).toEqual([
			'Conservative estimate',
			'Median estimate',
			'Optimistic estimate'
		]);
	});
});
