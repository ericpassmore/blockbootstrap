import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import snapshot from '../../../data/sources/damodaran-2025.json';
import inflationSnapshot from '../../../data/sources/bls-inflation-2025.json';
import dividendSnapshot from '../../../data/sources/multpl-sp500-dividend-yield-2025.json';
import equitySnapshot from '../../../data/sources/equity-index-returns-2025.json';
import cryptoSnapshot from '../../../data/sources/coinbase-crypto-returns-2025.json';

const files = [
	'Fifty10YearBlocksFrom1970.csv',
	'nominal_returns_10yr_blocks_1970on.csv',
	'real_returns_10yr_blocks_1970on.csv',
	'risk_free_returns_10yr_blocks_1970on.csv'
] as const;
const unchangedDigests = [
	'52ea6ea045f5f22845f2aa8089ec118a36467c748e14b40f1607118bd5cafa84',
	'c55e30ec37771beb9b0f46fbf476b200b52a38b10ab11b37e9049d2d429c4a63',
	'78ccc3721cae72201bf77889dd88d9a262c07c1fb0bdf86cef7bef180a14e127',
	'a81f31d34e2465b0679f90db179dbfb99e32041480a0bfa55e90ac04470d19d4'
];
const cryptoAssets = ['Bitcoin*', 'Ethereum', 'XRP', 'SOL'];
const allReturns = { ...snapshot.returns, ...equitySnapshot.returns, ...cryptoSnapshot.returns };

function dataset(filename: string) {
	const text = readFileSync(`static/data/${filename}`, 'utf8');
	const lines = text.split(/(?<=\n)/);
	const header = lines[0].trimEnd().split(',');
	const rows = lines
		.slice(1)
		.filter((line) => line.trim())
		.map((line) => {
			const cells = line.trimEnd().split(',');
			const values = Object.fromEntries(header.map((column, index) => [column, cells[index]]));
			const year =
				'calendar year' in values
					? Number(values['calendar year'])
					: 1968 + Number(values.Series) + Number(values.Year);
			return { line, values, year };
		});
	return { header, lines, rows, year2025: rows.filter((row) => row.year === 2025) };
}

describe('verified 2025 return update', () => {
	it('matches the existing equity benchmark return conventions', () => {
		expect(equitySnapshot.returns).toEqual({
			'International Stocks': '31.89',
			'Emerging Markets': '34.36',
			'NASDAQ 100': '20.17'
		});
		expect(equitySnapshot.sources['International Stocks'].return_type).toBe('gross total return');
		expect(equitySnapshot.sources['Emerging Markets'].return_type).toBe('gross total return');
		expect(equitySnapshot.sources['NASDAQ 100'].return_type).toBe('price return');
	});

	it('derives observed crypto returns from consistent UTC year-end USD closes', () => {
		expect(cryptoSnapshot.returns).toEqual({
			'Bitcoin*': '-6.27',
			Ethereum: '-10.91',
			XRP: '-11.56',
			SOL: '-34.09'
		});
		expect(cryptoSnapshot.quote_currency).toBe('USD');
		for (const [symbol, column] of Object.entries({
			BTC: 'Bitcoin*',
			ETH: 'Ethereum',
			XRP: 'XRP',
			SOL: 'SOL'
		}) as [keyof typeof cryptoSnapshot.assets, keyof typeof cryptoSnapshot.returns][]) {
			const prices = cryptoSnapshot.assets[symbol];
			const expected = (
				(Number(prices['2025'].close_usd) / Number(prices['2024'].close_usd) - 1) *
				100
			).toFixed(2);
			expect(cryptoSnapshot.returns[column]).toBe(expected);
			for (const [year, timestamp] of [
				[2024, 1735603200],
				[2025, 1767139200]
			] as const) {
				const observation = prices[year];
				expect(observation.timestamp).toBe(timestamp);
				expect(observation.candle[4]).toBe(observation.close_usd);
				expect(observation.last_minute_verification.close_usd).toBe(observation.close_usd);
				expect(observation.last_minute_verification.timestamp).toBe(timestamp + 86340);
			}
		}
	});

	it('pins the Multpl year-end dividend yield and source', () => {
		expect(dividendSnapshot).toMatchObject({
			year: 2025,
			url: 'https://www.multpl.com/s-p-500-dividend-yield/table/by-year',
			observation_date: '2025-12-31',
			units: 'percent',
			dividend_yield: '1.15'
		});
	});

	it('pins BLS all-items inflation as the December-to-December change', () => {
		expect(inflationSnapshot).toMatchObject({
			year: 2025,
			url: 'https://www.bls.gov/opub/ted/2026/consumer-price-index-2025-in-review.htm',
			inflation: '2.7',
			units: 'percent',
			period_start: '2024-12',
			period_end: '2025-12',
			seasonally_adjusted: false
		});
	});

	it('pins the supplied seven-asset percent snapshot and source', () => {
		expect(snapshot.year).toBe(2025);
		expect(snapshot.units).toBe('percent');
		expect(snapshot.url).toBe(
			'https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html'
		);
		expect(snapshot.returns).toEqual({
			'S&P 500 (includes dividends)': '17.78',
			'US Small cap (bottom decile)': '16.53',
			'3-month T.Bill': '4.21',
			'US T. Bond (10-year)': '7.80',
			'Baa Corporate Bond': '6.96',
			'Real Estate': '1.58',
			'Gold*': '66.22'
		});
	});

	it.each(files)(
		'updates all four overlapping 2025 copies in %s while preserving every other row byte for byte',
		(filename) => {
			const { lines, rows, year2025 } = dataset(filename);
			expect(rows).toHaveLength(500);
			expect(year2025.map(({ values }) => [values.Series, values.Year])).toEqual([
				['47', '10'],
				['48', '9'],
				['49', '8'],
				['50', '7']
			]);
			const untouched =
				lines[0] +
				rows
					.filter((row) => row.year !== 2025)
					.map((row) => row.line)
					.join('');
			expect(createHash('sha256').update(untouched).digest('hex')).toBe(
				unchangedDigests[files.indexOf(filename)]
			);
		}
	);

	it('uses observed returns in percent and decimal units in all four 2025 copies', () => {
		const legacy = dataset(files[0]).year2025;
		const nominal = dataset(files[1]).year2025;
		for (let index = 0; index < 4; index++) {
			expect(legacy[index].values.inflation).toBe('2.70%');
			expect(nominal[index].values.inflation).toBe('0.0270');
			expect(legacy[index].values['SP500 Dividend Yield']).toBe('1.15%');
			expect(nominal[index].values['SP500 Dividend Yield']).toBe('0.0115');
			for (const [asset, value] of Object.entries(allReturns)) {
				expect(legacy[index].values[asset]).toBe(`${value}%`);
				expect(nominal[index].values[asset]).toBe((Number(value) / 100).toFixed(4));
			}
			for (const asset of cryptoAssets)
				expect(Number(nominal[index].values[asset])).toBeLessThan(0);
		}
	});

	it('recalculates all 14 real returns with 2.7% inflation', () => {
		const nominal = dataset(files[1]).year2025;
		const real = dataset(files[2]).year2025;
		for (let index = 0; index < 4; index++) {
			for (const asset of Object.keys(allReturns)) {
				const expected = ((1 + Number(nominal[index].values[asset])) / 1.027 - 1).toFixed(4);
				expect(real[index].values[asset]).toBe(expected);
			}
			for (const asset of ['inflation', 'SP500 Dividend Yield'])
				expect(real[index].values[asset]).toBe('');
		}
		// Independent examples: ratio adjustment, not subtraction of 2.7 percentage points.
		expect(real[0].values['S&P 500 (includes dividends)']).toBe('0.1468');
		expect(real[0].values['Real Estate']).toBe('-0.0109');
		expect(real[0].values['3-month T.Bill']).toBe('0.0147');
	});

	it('computes all 14 excess returns from observed nominal values', () => {
		const nominal = dataset(files[1]).year2025;
		const excess = dataset(files[3]).year2025;
		const riskFree = Number(snapshot.returns['3-month T.Bill']) / 100;
		for (let index = 0; index < 4; index++) {
			for (const asset of Object.keys(allReturns)) {
				const expected = ((1 + Number(nominal[index].values[asset])) / (1 + riskFree) - 1).toFixed(
					4
				);
				expect(excess[index].values[asset]).toBe(expected);
			}
			for (const asset of ['inflation', 'SP500 Dividend Yield'])
				expect(excess[index].values[asset]).toBe('');
		}
	});

	it('is reproducible offline and idempotent without rewriting any files', () => {
		const output = execFileSync(
			'python3',
			[
				'-B',
				'-c',
				[
					'import json, runpy',
					"module = runpy.run_path('scripts/update-2025-returns.py')",
					"root = module['ROOT']",
					"files = module['FILES']",
					"source = json.loads((root / 'data/sources/damodaran-2025.json').read_text())",
					"inflation = json.loads((root / 'data/sources/bls-inflation-2025.json').read_text())",
					"dividend = json.loads((root / 'data/sources/multpl-sp500-dividend-yield-2025.json').read_text())",
					"equity = json.loads((root / 'data/sources/equity-index-returns-2025.json').read_text())",
					"crypto = json.loads((root / 'data/sources/coinbase-crypto-returns-2025.json').read_text())",
					"contents = {name: (root / 'static/data' / name).read_bytes().decode('utf-8') for name in files}",
					"once, first_changes = module['update_contents'](contents, source, inflation, dividend, equity, crypto)",
					"twice, second_changes = module['update_contents'](once, source, inflation, dividend, equity, crypto)",
					'assert contents == once == twice',
					'assert not any(first_changes.values()) and not any(second_changes.values())',
					"print('offline idempotency verified')"
				].join('\n')
			],
			{ encoding: 'utf8' }
		);
		expect(output.trim()).toBe('offline idempotency verified');
	});
});
