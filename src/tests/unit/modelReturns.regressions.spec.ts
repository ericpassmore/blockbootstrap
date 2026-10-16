import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BlockData, type MarketData } from '$lib/block';
import { ConstantRateReturns } from '$lib/constantRateReturns';
import { ForecastOptions } from '$lib/forecastOptions';
import { ModelReturns, type Allocation } from '$lib/modelReturns';
import { powerLawReturnsFromDates } from '$lib/server/powerLawReturnsFromDates';
import { Taxes } from '$lib/taxes';

const allocation = (key: Allocation['key'], value = 100): Allocation => ({
	key,
	value,
	label: key
});
const year = (index: number, returns: Partial<MarketData> = {}): MarketData => ({
	year: index,
	sp500: 0,
	usSmallCap: 0,
	TBill: 0,
	treasury10Year: 0,
	baaCorp: 0,
	realEstate: 0,
	gold: 0,
	inflation: 0,
	sp500DividendYield: 0,
	usSmallCapDividendYield: 0,
	'crypto:BTC': 0,
	'crypto:ETH': 0,
	'crypto:SOL': 0,
	'crypto:XRP': 0,
	internationalEquity: 0,
	emergingMarkets: 0,
	nasdaq100: 0,
	...returns
});
const fixture = (blocks: MarketData[][], yieldPercent = 0) => {
	vi.spyOn(BlockData, 'getSeries').mockImplementation((block) => blocks[block - 1]);
	vi.spyOn(ConstantRateReturns, 'getYield').mockReturnValue(yieldPercent);
};

beforeAll(async () => {
	await BlockData.init('TEST');
	await ConstantRateReturns.init('TEST');
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('portfolio accounting regressions', () => {
	it('holds each asset uninterrupted across real CSV blocks when rebalancing is off', () => {
		const blocks = [9, 19];
		const allocations = [allocation('sp500', 60), allocation('treasury10Year', 40)];
		const expected = allocations.reduce((total, asset) => {
			const compound = blocks
				.flatMap((block) => BlockData.getSeries(block)!)
				.reduce((value, row) => value * (1 + row[asset.key] / 100), (100000 * asset.value) / 100);
			return total + compound;
		}, 0);
		const model = new ModelReturns(100000, allocations, blocks, new ForecastOptions());
		expect(model.finalValue).toBeCloseTo(expected, 6);
		expect(model.results[10].startValue).toBe(model.results[9].endValue);
	});

	it('carries the tax basis through a block boundary', () => {
		const allocations = [allocation('sp500', 50), allocation('gold', 50)];
		fixture([[year(1, { sp500: 20 }), year(2, { sp500: 20 })]]);
		const uninterrupted = new ModelReturns(100000, allocations, [1], new ForecastOptions(true));
		fixture([[year(1, { sp500: 20 })], [year(1, { sp500: 20 })]]);
		const stitched = new ModelReturns(100000, allocations, [1, 2], new ForecastOptions(true));
		expect(stitched.totalTaxes).toBeCloseTo(uninterrupted.totalTaxes, 8);
		expect(stitched.results[1].taxes).toBeCloseTo(336.1111111111111, 8);
	});

	it.each(['treasury10Year', 'baaCorp'] as const)('reinvests all coupon income for %s', (key) => {
		fixture([[year(1, { [key]: 10 }), year(2, { [key]: 10 }), year(3, { [key]: 10 })]], 10);
		const model = new ModelReturns(100000, [allocation(key)], [1], new ForecastOptions());
		expect(model.results.map((result) => result.taxes)).toEqual([1000, 1100, 1210]);
		expect(model.finalValue).toBeCloseTo(133100, 8);
	});

	it.each([
		{ stockReturn: 100, expectedIncome: 7750 },
		{ stockReturn: 0, expectedIncome: 5250 }
	])(
		'updates coupon income after bond purchases or sales: $expectedIncome',
		({ stockReturn, expectedIncome }) => {
			fixture(
				[[year(1, { sp500: stockReturn, treasury10Year: 10 }), year(2, { treasury10Year: 10 })]],
				10
			);
			const taxes = vi.spyOn(Taxes.prototype, 'calculateTaxes');
			new ModelReturns(
				100000,
				[allocation('sp500', 50), allocation('treasury10Year', 50)],
				[1],
				new ForecastOptions(true)
			);
			expect(taxes.mock.calls[1][0]).toBeCloseTo(expectedIncome, 8);
		}
	);

	it('does not count reinvested dividends again as capital gains', () => {
		fixture([[year(1, { sp500: 20, sp500DividendYield: 10 })]]);
		const model = new ModelReturns(
			100000,
			[allocation('sp500', 50), allocation('treasury10Year', 50)],
			[1],
			new ForecastOptions(true)
		);
		expect(model.results[0].taxes).toBeCloseTo(1083.3333333333333, 8);
		expect(model.finalValue).toBe(110000);
	});

	it('adds reinvested bill interest to basis before selling bills', () => {
		fixture([[year(1, { TBill: 10 })]]);
		const model = new ModelReturns(
			100000,
			[allocation('TBill', 50), allocation('sp500', 50)],
			[1],
			new ForecastOptions(true)
		);
		expect(model.results[0].taxes).toBeCloseTo(500, 8);
	});

	it('keeps nominal taxes unchanged when displaying purchasing power', () => {
		fixture([[year(1, { TBill: 3, inflation: 5 }), year(2, { TBill: 3, inflation: 5 })]]);
		const allocations = [allocation('TBill')];
		const nominal = new ModelReturns(100000, allocations, [1], new ForecastOptions());
		const real = new ModelReturns(100000, allocations, [1], new ForecastOptions(false, true));
		expect(real.results.map((row) => row.taxes)).toEqual(nominal.results.map((row) => row.taxes));
		expect(real.results[0].taxes).toBe(300);
		expect(real.finalValue).toBeCloseTo(nominal.finalValue / 1.05 ** 2, 8);
		expect(real.results[1].startValue).toBe(real.results[0].endValue);
		expect(real.results[1].growth).toBe(real.results[1].endValue - real.results[1].startValue);
	});

	it('has identical summary results without retaining annual records', () => {
		fixture([
			[
				year(1, { sp500: 20, sp500DividendYield: 5, inflation: 4 }),
				year(2, { sp500: -10, inflation: 3 })
			]
		]);
		const allocations = [allocation('sp500', 50), allocation('TBill', 50)];
		const options = new ForecastOptions(true, true);
		const detailed = new ModelReturns(100000, allocations, [1], options);
		const summary = new ModelReturns(100000, allocations, [1], options, false);
		expect(summary.results).toEqual([]);
		expect(summary.yearsElapsed).toBe(2);
		expect(summary.finalValue).toBe(detailed.finalValue);
		expect(summary.totalTaxes).toBe(detailed.results.reduce((total, row) => total + row.taxes, 0));
		expect(summary.calculateCAGR()).toBe(detailed.calculateCAGR());
	});

	it('advances crypto projections through 30 contiguous future years', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
		fixture(
			Array.from({ length: 3 }, () => Array.from({ length: 10 }, (_, index) => year(index + 1)))
		);
		const returns = vi.spyOn(powerLawReturnsFromDates, 'percentageReturn').mockReturnValue(10);
		const model = new ModelReturns(
			100000,
			[allocation('crypto:BTC')],
			[1, 2, 3],
			new ForecastOptions()
		);
		expect(returns.mock.calls.map((call) => call[1])).toEqual(
			Array.from({ length: 30 }, (_, index) => 2026 + index)
		);
		expect(model.results.map((row) => row.year)).toEqual(
			Array.from({ length: 30 }, (_, index) => index + 1)
		);
		expect(model.finalValue).toBeCloseTo(100000 * 1.1 ** 30, 6);
	});
});
