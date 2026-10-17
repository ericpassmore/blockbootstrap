import { solveQP } from 'quadprog';
import { objectiveMatrix } from 'blockbootstrapagent/dist/objective.js';
import type { Allocation } from '$lib/modelReturns';
import nominalCsv from '../../../static/data/nominal_returns_10yr_blocks_1970on.csv?raw';
import realCsv from '../../../static/data/real_returns_10yr_blocks_1970on.csv?raw';
import excessCsv from '../../../static/data/risk_free_returns_10yr_blocks_1970on.csv?raw';

export type ReturnType = 'nominal' | 'real' | 'excess';

// Use the same order for statistics, constraints, and returned allocations.
const assets = [
	'S&P 500 (includes dividends)',
	'US Small cap (bottom decile)',
	'US T. Bond (10-year)',
	'Baa Corporate Bond',
	'Real Estate',
	'Gold*',
	'3-month T.Bill',
	'Bitcoin*',
	'International Stocks',
	'Emerging Markets',
	'NASDAQ 100',
	'Ethereum',
	'XRP',
	'SOL'
];

const assetKeys: Allocation['key'][] = [
	'sp500',
	'usSmallCap',
	'treasury10Year',
	'baaCorp',
	'realEstate',
	'gold',
	'TBill',
	'crypto:BTC',
	'internationalEquity',
	'emergingMarkets',
	'nasdaq100',
	'crypto:ETH',
	'crypto:XRP',
	'crypto:SOL'
];

interface Observation {
	year: number;
	returns: number[];
}

const sources = { nominal: nominalCsv, real: realCsv, excess: excessCsv };
const cache = new Map<ReturnType, Map<number, Observation[]>>();

function observations(returnType: ReturnType): Map<number, Observation[]> {
	const cached = cache.get(returnType);
	if (cached) return cached;
	const [header, ...lines] = sources[returnType].trim().split(/\r?\n/);
	const columns = header.split(',');
	const indices = assets.map((asset) => columns.indexOf(asset));
	const blocks = new Map<number, Observation[]>();
	for (const line of lines) {
		const cells = line.split(',');
		const series = Number(cells[columns.indexOf('Series')]);
		const year = Number(cells[columns.indexOf('calendar year')]);
		const returns = indices.map((index) => {
			const raw = cells[index]?.trim();
			// Missing observations must not become valid zero returns. Partial years can
			// coexist with older complete blocks without making the whole source unreadable.
			if (raw === '' || raw === '#N/A') return NaN;
			const value = Number(raw);
			if (!Number.isFinite(value)) throw new Error('Invalid portfolio return data');
			return value;
		});
		const block = blocks.get(series) ?? [];
		block.push({ year, returns });
		blocks.set(series, block);
	}
	cache.set(returnType, blocks);
	return blocks;
}

export function selectPortfolioBlocks(startYear = 1988, endYear = 2025): [number, number] {
	if (
		!Number.isInteger(startYear) ||
		!Number.isInteger(endYear) ||
		startYear < 1988 ||
		endYear > 2025 ||
		startYear > endYear
	) {
		throw new Error('Years must be integers between 1988 and 2025');
	}
	const eligible = [...observations('nominal')]
		.filter(
			([, rows]) =>
				rows.length === 10 &&
				rows.every(
					(row) =>
						row.year >= startYear && row.year <= endYear && row.returns.every(Number.isFinite)
				)
		)
		.map(([series]) => series);
	if (eligible.length < 2) {
		throw new Error('Select at least 11 years to include two distinct 10-year blocks');
	}
	const first = eligible.splice(Math.floor(Math.random() * eligible.length), 1)[0];
	const second = eligible[Math.floor(Math.random() * eligible.length)];
	return first < second ? [first, second] : [second, first];
}

export function portfolioStatistics(blockNumbers: [number, number], returnType: ReturnType) {
	const blocks = observations(returnType);
	const rows = blockNumbers.flatMap((number) => {
		const block = blocks.get(number);
		if (!block || block.length !== 10) throw new Error('Missing portfolio block');
		if (block.some((row) => row.returns.some((value) => !Number.isFinite(value)))) {
			throw new Error('Incomplete portfolio observations for the selected return type');
		}
		return block;
	});
	const means = assets.map(
		(_, i) => rows.reduce((sum, row) => sum + row.returns[i], 0) / rows.length
	);
	const covMatrix = Object.fromEntries(
		assets.map((asset, i) => [
			asset,
			Object.fromEntries(
				assets.map((other, j) => [
					other,
					rows.reduce(
						(sum, row) => sum + (row.returns[i] - means[i]) * (row.returns[j] - means[j]),
						0
					) /
						(rows.length - 1)
				])
			)
		])
	);
	const meanReturns = Object.fromEntries(
		assets.map((asset, i) => [asset, { mean: means[i], std: Math.sqrt(covMatrix[asset][asset]) }])
	);
	return { meanReturns, covMatrix };
}

export function buildOptimizedPortfolio(
	target: number,
	cryptoLimit: number,
	blocks: [number, number],
	returnType: ReturnType = 'nominal'
): Allocation[] {
	if (
		!Number.isFinite(target) ||
		!Number.isFinite(cryptoLimit) ||
		cryptoLimit < 0 ||
		cryptoLimit > 1
	) {
		throw new Error('Invalid portfolio constraints');
	}
	const { meanReturns, covMatrix } = portfolioStatistics(blocks, returnType);
	const n = assets.length;
	if (objectiveMatrix.kind !== 'simple') throw new Error('Unsupported portfolio objective');
	const { DMat, dvec } = objectiveMatrix.fn(covMatrix);
	// quadprog uses one-based indexing for BOTH variables and constraints.
	// Keep column zero and bvec[0] unused, otherwise the budget is discarded.
	const Amat = Array.from({ length: n + 1 }, () => [0]);
	const bvec = [0];
	const addConstraint = (coefficients: number[], bound: number) => {
		Amat[0].push(0);
		for (let i = 0; i < n; i++) Amat[i + 1].push(coefficients[i]);
		bvec.push(bound);
	};
	addConstraint(
		assets.map(() => 1),
		1
	);
	for (let i = 0; i < n; i++)
		addConstraint(
			assets.map((_, j) => (i === j ? 1 : 0)),
			0
		);
	addConstraint(
		assets.map((asset) => meanReturns[asset].mean),
		target
	);
	addConstraint(
		assetKeys.map((key) => (key.startsWith('crypto:') ? -1 : 0)),
		-cryptoLimit
	);
	const result = solveQP(DMat, dvec, Amat, bvec, 1);
	if (result.message || !result.solution) {
		throw new Error(result.message || 'Failed to solve portfolio constraints');
	}
	const weights = result.solution.slice(1, n + 1);
	const tolerance = 1e-8;
	const total = weights.reduce((sum, weight) => sum + weight, 0);
	const achieved = weights.reduce(
		(sum, weight, i) => sum + weight * meanReturns[assets[i]].mean,
		0
	);
	const crypto = weights.reduce(
		(sum, weight, i) => sum + (assetKeys[i].startsWith('crypto:') ? weight : 0),
		0
	);
	if (
		weights.length !== n ||
		weights.some((weight) => !Number.isFinite(weight) || weight < -tolerance) ||
		Math.abs(total - 1) > tolerance ||
		achieved < target - tolerance ||
		crypto > cryptoLimit + tolerance
	) {
		throw new Error('Optimizer returned a portfolio that violates its constraints');
	}
	// Keep full precision: rounding weights here can violate a binding return/cap.
	return assets.map((label, i) => ({
		key: assetKeys[i],
		label,
		value: (Math.abs(weights[i]) < 1e-12 ? 0 : weights[i]) * 100
	}));
}
