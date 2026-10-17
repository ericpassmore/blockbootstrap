import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const csv = readFileSync('static/data/Fifty10YearBlocksFrom1970.csv', 'utf8');
const yieldsCsv = readFileSync('static/data/MarketYields.csv', 'utf8');

function withYearValues(year: number, replacements: Record<string, string>): string {
	const [header, ...lines] = csv.trim().split(/\r?\n/);
	const headers = header.split(',');
	return [
		header,
		...lines.map((line) => {
			const values = line.split(',');
			if (1968 + Number(values[0]) + Number(values[1]) === year) {
				for (const [key, value] of Object.entries(replacements))
					values[headers.indexOf(key)] = value;
			}
			return values.join(',');
		})
	].join('\n');
}

beforeEach(() => {
	vi.resetModules();
	vi.doUnmock('../../../static/data/Fifty10YearBlocksFrom1970.csv?raw');
	vi.doUnmock('../../../static/data/MarketYields.csv?raw');
});

afterEach(() => vi.unstubAllGlobals());

describe('local historical data loading', () => {
	it('initializes concurrent callers once without network access or duplicated years', async () => {
		const fetch = vi.fn(() => {
			throw new Error('Unexpected network access');
		});
		vi.stubGlobal('fetch', fetch);
		const { BlockData } = await import('../../lib/block');
		await Promise.all(Array.from({ length: 20 }, () => BlockData.init()));
		expect(fetch).not.toHaveBeenCalled();
		expect(BlockData.getAllData().size).toBe(50);
		expect(BlockData.getAllData(true).size).toBe(47);
		for (const block of BlockData.getAllData().values()) {
			expect(block.map((row) => row.year)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		}
	});

	it('maps actual SOL and XRP observations to the correct assets', async () => {
		const { BlockData } = await import('../../lib/block');
		await BlockData.init('TEST');
		const year2021 = BlockData.getSeries(46)![6];
		expect(year2021['crypto:SOL']).toBe(2241);
		expect(year2021['crypto:XRP']).toBe(26);
	});

	it('treats unavailable crypto history as flat nominal returns', async () => {
		const { BlockData } = await import('../../lib/block');
		await BlockData.init();
		for (const key of ['crypto:BTC', 'crypto:ETH', 'crypto:XRP', 'crypto:SOL'] as const) {
			const finalValue = BlockData.getSeries(1)!.reduce(
				(value, row) => value * (1 + row[key] / 100),
				10000
			);
			expect(finalValue).toBe(10000);
		}
	});

	it('restricts blocks to observations for selected noncrypto assets', async () => {
		const { BlockData } = await import('../../lib/block');
		await BlockData.init();
		const all = Array.from({ length: 47 }, (_, index) => index + 1);
		expect(BlockData.getEligibleBlockNumbers(['sp500'])).toEqual(all);
		expect(BlockData.getEligibleBlockNumbers(['crypto:SOL', 'sp500'])).toEqual(all);
		expect(BlockData.getEligibleBlockNumbers(['internationalEquity'])).toEqual(all);
		expect(BlockData.getEligibleBlockNumbers(['nasdaq100'])).toEqual(all.slice(16));
		expect(BlockData.getEligibleBlockNumbers(['emergingMarkets'])).toEqual(all.slice(18));
		expect(BlockData.getEligibleBlockNumbers(['emergingMarkets', 'nasdaq100'])).toEqual(
			all.slice(18)
		);
	});

	it('maps sourced 2025 global and crypto returns consistently across all four overlapping copies', async () => {
		const { BlockData } = await import('../../lib/block');
		await BlockData.init();
		for (const [block, index] of [
			[47, 9],
			[48, 8],
			[49, 7],
			[50, 6]
		]) {
			const row = BlockData.getSeries(block)![index];
			expect(row.internationalEquity).toBe(31.89);
			expect(row.emergingMarkets).toBe(34.36);
			expect(row.nasdaq100).toBe(20.17);
			expect(row['crypto:BTC']).toBe(-6.27);
			expect(row['crypto:ETH']).toBe(-10.91);
			expect(row['crypto:XRP']).toBe(-11.56);
			expect(row['crypto:SOL']).toBe(-34.09);
		}
		for (const key of ['internationalEquity', 'emergingMarkets', 'nasdaq100'] as const) {
			expect(BlockData.hasMissingData(47, key)).toBe(false);
		}
		expect(BlockData.getIncompleteBlocks()).toEqual([48, 49, 50]);
	});

	it('loads known 2025 returns, CPI and dividend yield without marking them missing', async () => {
		const { BlockData } = await import('../../lib/block');
		await BlockData.init();
		expect(BlockData.getSeries(47)![9].TBill).toBe(4.21);
		expect(BlockData.getSeries(47)![9].inflation).toBe(2.7);
		expect(BlockData.getSeries(47)![9].sp500DividendYield).toBe(1.15);
		expect(BlockData.getIncompleteBlocks()).toEqual([48, 49, 50]);
		expect(BlockData.hasMissingData(47, 'TBill')).toBe(false);
		expect(BlockData.hasMissingData(47, 'sp500')).toBe(false);
		expect(BlockData.hasMissingData(47, 'inflation')).toBe(false);
		expect(BlockData.hasMissingData(47, 'sp500DividendYield')).toBe(false);
		expect(BlockData.getEligibleBlockNumbers(['TBill'])).toContain(47);
		expect(BlockData.getEligibleBlockNumbers(['TBill', 'inflation'])).toContain(47);
		expect(BlockData.getEligibleBlockNumbers(['sp500', 'sp500DividendYield'])).toContain(47);
	});

	it('requires a dividend observation for stock tax estimates while retaining known stock returns', async () => {
		vi.doMock('../../../static/data/Fifty10YearBlocksFrom1970.csv?raw', () => ({
			default: withYearValues(2025, { 'SP500 Dividend Yield': '#N/A' })
		}));
		const { BlockData } = await import('../../lib/block');
		await BlockData.init();
		expect(BlockData.hasMissingData(47, 'sp500DividendYield')).toBe(true);
		expect(BlockData.getEligibleBlockNumbers(['sp500'])).toContain(47);
		expect(BlockData.getEligibleBlockNumbers(['sp500', 'sp500DividendYield'])).not.toContain(47);
	});

	it('excludes unknown CPI without discarding observed nominal returns', async () => {
		vi.doMock('../../../static/data/Fifty10YearBlocksFrom1970.csv?raw', () => ({
			default: withYearValues(2025, { inflation: '#N/A' })
		}));
		const { BlockData } = await import('../../lib/block');
		await BlockData.init();
		expect(BlockData.hasMissingData(47, 'inflation')).toBe(true);
		expect(BlockData.getEligibleBlockNumbers(['TBill'])).toContain(47);
		expect(BlockData.getEligibleBlockNumbers(['TBill', 'inflation'])).not.toContain(47);
	});

	it('accepts observed zero auxiliary values instead of confusing them with missing data', async () => {
		vi.doMock('../../../static/data/Fifty10YearBlocksFrom1970.csv?raw', () => ({
			default: withYearValues(2025, { inflation: '0%', 'SP500 Dividend Yield': '0%' })
		}));
		const { BlockData } = await import('../../lib/block');
		await BlockData.init();
		expect(BlockData.hasMissingData(47, 'inflation')).toBe(false);
		expect(BlockData.hasMissingData(47, 'sp500DividendYield')).toBe(false);
		expect(
			BlockData.getEligibleBlockNumbers(['sp500', 'inflation', 'sp500DividendYield'])
		).toContain(47);
	});

	it('requires an observed return rather than auxiliary inputs to complete a year', async () => {
		const headers = csv.split('\n')[0].split(',');
		const unavailable = Object.fromEntries(headers.slice(2).map((header) => [header, '#N/A']));
		vi.doMock('../../../static/data/Fifty10YearBlocksFrom1970.csv?raw', () => ({
			default: withYearValues(2025, {
				...unavailable,
				inflation: '0%',
				'SP500 Dividend Yield': '0%'
			})
		}));
		const { BlockData } = await import('../../lib/block');
		await BlockData.init();
		expect(BlockData.getIncompleteBlocks()).toContain(47);
	});

	it('accepts a genuine zero return in a partially observed year', async () => {
		const headers = csv.split('\n')[0].split(',');
		const unavailable = Object.fromEntries(headers.slice(2).map((header) => [header, '#N/A']));
		vi.doMock('../../../static/data/Fifty10YearBlocksFrom1970.csv?raw', () => ({
			default: withYearValues(2025, { ...unavailable, '3-month T.Bill': '0%' })
		}));
		const { BlockData } = await import('../../lib/block');
		await BlockData.init();
		expect(BlockData.getIncompleteBlocks()).not.toContain(47);
		expect(BlockData.hasMissingData(47, 'TBill')).toBe(false);
		expect(BlockData.getEligibleBlockNumbers(['TBill'])).toContain(47);
	});

	it('keeps known annual observations consistent in every overlapping block', () => {
		const [header, ...lines] = csv.trim().split(/\r?\n/);
		const rows = lines.map((line) => line.split(','));
		for (const asset of ['Emerging Markets', 'NASDAQ 100']) {
			const column = header.split(',').indexOf(asset);
			const byYear = new Map<number, string[]>();
			for (const row of rows) {
				const year = 1968 + Number(row[0]) + Number(row[1]);
				byYear.set(year, [...(byYear.get(year) ?? []), row[column]]);
			}
			for (const values of byYear.values()) {
				const known = values.find((value) => value !== '' && value !== '#N/A');
				if (known !== undefined) expect(values.every((value) => value === known)).toBe(true);
			}
		}
	});

	it('rejects malformed data atomically and allows retry after a failed load', async () => {
		let source = csv + '\nmalformed,row';
		vi.doMock('../../../static/data/Fifty10YearBlocksFrom1970.csv?raw', () => ({
			get default() {
				return source;
			}
		}));
		const { BlockData } = await import('../../lib/block');
		await expect(BlockData.init()).rejects.toThrow('Malformed market data row');
		expect(BlockData.getAllData().size).toBe(0);
		source = csv;
		await BlockData.init();
		expect(BlockData.getAllData().size).toBe(50);
		expect(BlockData.getSeries(1)).toHaveLength(10);
	});

	it('validates headers instead of silently loading a mislabeled asset', async () => {
		vi.doMock('../../../static/data/Fifty10YearBlocksFrom1970.csv?raw', () => ({
			default: csv.replace(',XRP,SOL', ',SOL,SOL')
		}));
		const { BlockData } = await import('../../lib/block');
		await expect(BlockData.init()).rejects.toThrow('Missing or duplicate market data column');
		expect(BlockData.getAllData().size).toBe(0);
	});
});

describe('local yield loading', () => {
	it('shares concurrent initialization and loads the actual local yields without network access', async () => {
		const fetch = vi.fn(() => {
			throw new Error('Unexpected network access');
		});
		vi.stubGlobal('fetch', fetch);
		const { ConstantRateReturns } = await import('../../lib/constantRateReturns');
		await Promise.all(Array.from({ length: 20 }, () => ConstantRateReturns.init()));
		expect(fetch).not.toHaveBeenCalled();
		expect(ConstantRateReturns.getYears()).toHaveLength(56);
		expect(ConstantRateReturns.getYield(1970, 'treasury10Year')).toBe(7.79);
		expect(ConstantRateReturns.getYield(2025, 'treasury10Year')).toBe(4.63);
	});

	it('does not expose partially parsed yields and can retry a failed load', async () => {
		let source = yieldsCsv + '\nmalformed,row';
		vi.doMock('../../../static/data/MarketYields.csv?raw', () => ({
			get default() {
				return source;
			}
		}));
		const { ConstantRateReturns } = await import('../../lib/constantRateReturns');
		await expect(ConstantRateReturns.init()).rejects.toThrow(
			'Invalid or duplicate market yields row'
		);
		expect(ConstantRateReturns.getYears()).toEqual([]);
		source = yieldsCsv;
		await ConstantRateReturns.init();
		expect(ConstantRateReturns.getYears()).toHaveLength(56);
	});
});
