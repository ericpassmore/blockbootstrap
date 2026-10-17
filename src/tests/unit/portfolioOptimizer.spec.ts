import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import {
	buildOptimizedPortfolio,
	portfolioStatistics,
	selectPortfolioBlocks
} from '$lib/server/portfolioOptimizer';

const dataPath = `${process.cwd()}/static/data`;
const analysisPath = `${process.cwd()}/data/analysis`;
const csvRows = (path: string) =>
	readFileSync(path, 'utf8')
		.trim()
		.split(/\r?\n/)
		.map((row) => row.split(','));
const [header, ...source] = csvRows(`${dataPath}/nominal_returns_10yr_blocks_1970on.csv`);

afterEach(() => vi.restoreAllMocks());

describe('portfolio covariance data', () => {
	it('all 351 matrices match independent sample covariances, symmetry and reported standard deviations', () => {
		const files = readdirSync(`${analysisPath}`).filter((file) =>
			file.startsWith('variance_covariance_series_')
		);
		expect(files).toHaveLength(351);
		for (const file of files) {
			const tag = file.replace('variance_covariance_series_', '').replace('.csv', '');
			const blocks = tag.split('-').map(Number);
			const observations = source.filter((row) => blocks.includes(Number(row[0])));
			const [matrixHeader, ...matrixRows] = csvRows(`${analysisPath}/${file}`);
			const names = matrixHeader.slice(1);
			const matrix = matrixRows.map((row) => row.slice(1).map(Number));
			const stats = csvRows(`${analysisPath}/nominal_mean_std_series_${tag}.csv`).slice(1);
			expect(observations).toHaveLength(20);
			for (let i = 0; i < names.length; i++) {
				const xs = observations.map((row) => Number(row[header.indexOf(names[i])]));
				for (let j = 0; j < names.length; j++) {
					const ys = observations.map((row) => Number(row[header.indexOf(names[j])]));
					// Pairwise-difference identity independently checks the generator's centered-product calculation.
					let total = 0;
					for (let a = 0; a < xs.length; a++) {
						for (let b = a + 1; b < xs.length; b++) total += (xs[a] - xs[b]) * (ys[a] - ys[b]);
					}
					expect(matrix[i][j], `${file}: ${names[i]} / ${names[j]}`).toBeCloseTo(
						total / (20 * 19),
						12
					);
					expect(matrix[i][j]).toBe(matrix[j][i]);
				}
				const std = Number(stats.find((row) => row[1] === names[i])![3]);
				expect(matrix[i][i]).toBeCloseTo(std * std, 12);
			}
		}
	});

	it.each(['nominal', 'real', 'excess'] as const)(
		'uses matching %s means and covariances',
		(returnType) => {
			const { meanReturns, covMatrix } = portfolioStatistics([19, 45], returnType);
			const stats = csvRows(`${analysisPath}/${returnType}_mean_std_series_19-45.csv`).slice(1);
			for (const [, name, mean, std] of stats) {
				expect(meanReturns[name].mean).toBeCloseTo(Number(mean), 12);
				expect(covMatrix[name][name]).toBeCloseTo(Number(std) ** 2, 12);
			}
			expect(covMatrix['S&P 500 (includes dividends)']['S&P 500 (includes dividends)']).toBeCloseTo(
				Number(stats[0][3]) ** 2,
				12
			);
		}
	);

	it('returns finite allocations satisfying a zero crypto cap', () => {
		const allocation = buildOptimizedPortfolio(0.08, 0, [19, 45], 'real');
		expect(allocation.reduce((sum, asset) => sum + asset.value, 0)).toBeCloseTo(100, 1);
		for (const asset of allocation) {
			expect(Number.isFinite(asset.value)).toBe(true);
			expect(asset.value).toBeGreaterThanOrEqual(-0);
			if (asset.key.startsWith('crypto:')) expect(Math.abs(asset.value)).toBe(0);
		}
	});

	it.each([0, 0.03, 1])(
		'satisfies the budget, target, and %s crypto cap without rounding weights',
		(cap) => {
			const { meanReturns } = portfolioStatistics([19, 45], 'nominal');
			const allocation = buildOptimizedPortfolio(0.08, cap, [19, 45], 'nominal');
			const total = allocation.reduce((sum, asset) => sum + asset.value / 100, 0);
			const achieved = allocation.reduce(
				(sum, asset) => sum + (asset.value / 100) * meanReturns[asset.label].mean,
				0
			);
			const crypto = allocation
				.filter((asset) => asset.key.startsWith('crypto:'))
				.reduce((sum, asset) => sum + asset.value / 100, 0);
			expect(total).toBeCloseTo(1, 10);
			expect(achieved).toBeGreaterThanOrEqual(0.08 - 1e-10);
			expect(crypto).toBeLessThanOrEqual(cap + 1e-10);
			for (const asset of allocation) {
				expect(Number.isFinite(asset.value)).toBe(true);
				expect(asset.value).toBeGreaterThanOrEqual(0);
			}
		}
	);

	it('rejects an infeasible target instead of normalizing an invalid solver result', () => {
		// The highest noncrypto mean in these blocks is Emerging Markets at 16.9695%.
		expect(() => buildOptimizedPortfolio(0.2, 0, [30, 31], 'nominal')).toThrow();
	});
});

describe('portfolio block selection', () => {
	it.each(['nominal', 'real', 'excess'] as const)(
		'calculates complete 2025 %s statistics from all 14 observed returns',
		(returnType) => {
			const { meanReturns, covMatrix } = portfolioStatistics([19, 47], returnType);
			const filename = {
				nominal: 'nominal_returns',
				real: 'real_returns',
				excess: 'risk_free_returns'
			}[returnType];
			const [columns, ...data] = csvRows(`${dataPath}/${filename}_10yr_blocks_1970on.csv`);
			const rows = data.filter((row) => [19, 47].includes(Number(row[0])));
			expect(rows).toHaveLength(20);
			expect(Object.keys(meanReturns)).toHaveLength(14);
			for (const name of Object.keys(meanReturns)) {
				const xs = rows.map((row) => Number(row[columns.indexOf(name)]));
				expect(meanReturns[name].mean).toBeCloseTo(xs.reduce((sum, x) => sum + x, 0) / 20, 12);
				for (const other of Object.keys(meanReturns)) {
					const ys = rows.map((row) => Number(row[columns.indexOf(other)]));
					let sum = 0;
					for (let a = 0; a < 20; a++)
						for (let b = a + 1; b < 20; b++) sum += (xs[a] - xs[b]) * (ys[a] - ys[b]);
					expect(covMatrix[name][other]).toBeCloseTo(sum / (20 * 19), 12);
				}
			}
			const portfolio = buildOptimizedPortfolio(0.08, 0.03, [19, 47], returnType);
			expect(portfolio.reduce((sum, asset) => sum + asset.value / 100, 0)).toBeCloseTo(1, 10);
			expect(
				portfolio.reduce(
					(sum, asset) => sum + (asset.value / 100) * meanReturns[asset.label].mean,
					0
				)
			).toBeGreaterThanOrEqual(0.08 - 1e-10);
			expect(
				portfolio
					.filter((asset) => asset.key.startsWith('crypto:'))
					.reduce((sum, asset) => sum + asset.value / 100, 0)
			).toBeLessThanOrEqual(0.03 + 1e-10);
		}
	);
	it.each(['nominal', 'real', 'excess'] as const)(
		'rejects a missing %s observation rather than treating a blank as zero',
		async (returnType) => {
			const filename = {
				nominal: 'nominal_returns',
				real: 'real_returns',
				excess: 'risk_free_returns'
			}[returnType];
			const sourcePath = `../../../static/data/${filename}_10yr_blocks_1970on.csv?raw`;
			const rows = csvRows(`${dataPath}/${filename}_10yr_blocks_1970on.csv`);
			const row = rows.find((row) => row[0] === '47' && row[1] === '10')!;
			row[rows[0].indexOf('Gold*')] = '';
			vi.resetModules();
			vi.doMock(sourcePath, () => ({ default: rows.map((row) => row.join(',')).join('\n') }));
			try {
				const fresh = await import('$lib/server/portfolioOptimizer');
				expect(() => fresh.portfolioStatistics([19, 47], returnType)).toThrow(
					'Incomplete portfolio observations'
				);
			} finally {
				vi.doUnmock(sourcePath);
			}
		}
	);
	it('includes the complete 2016–2025 block in selected and default ranges', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.999999);
		expect(selectPortfolioBlocks(2015, 2025)).toEqual([46, 47]);
		expect(selectPortfolioBlocks()).toContain(47);
	});
	it('includes complete blocks ending in the requested final year', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		expect(selectPortfolioBlocks(2014, 2024)).toEqual([45, 46]);
	});
	it.each([
		[2020, 2024],
		[1988, 1997],
		[2024, 1988],
		[1987, 2024],
		[1988, 2026],
		[1988.5, 2024],
		[NaN, 2024]
	])('rejects unsupported range %s–%s', (start, end) => {
		expect(() => selectPortfolioBlocks(start, end)).toThrow();
	});
});
