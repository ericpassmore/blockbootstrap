import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/portfolioOptimizer', () => ({
	buildOptimizedPortfolio: vi.fn(() => []),
	selectPortfolioBlocks: vi.fn(() => [19, 45])
}));

import { buildOptimizedPortfolio, selectPortfolioBlocks } from '$lib/server/portfolioOptimizer';
import { actions } from '../../routes/builder/+page.server';

async function submit(overrides: Record<string, string> = {}) {
	const body = new FormData();
	for (const [key, value] of Object.entries({
		target: '8',
		cryptoLimit: '3',
		startYear: '1988',
		endYear: '2024',
		returnType: 'nominal',
		...overrides
	}))
		body.set(key, value);
	return actions.default({
		request: new Request('http://localhost/builder', { method: 'POST', body })
	} as Parameters<typeof actions.default>[0]);
}

beforeEach(() => vi.clearAllMocks());

describe('builder action constraints', () => {
	it('passes the newly complete 2025 end year through to block selection', async () => {
		await submit({ startYear: '2015', endYear: '2025' });
		expect(selectPortfolioBlocks).toHaveBeenCalledWith(2015, 2025);
	});
	it.each([0, 3, 20, 21, 100])(
		'passes the selected %s%% crypto limit to optimization',
		async (limit) => {
			await submit({ cryptoLimit: String(limit) });
			expect(buildOptimizedPortfolio).toHaveBeenCalledWith(0.08, limit / 100, [19, 45], 'nominal');
		}
	);

	it.each(['-1', '101', 'NaN', 'Infinity', ''])(
		'rejects invalid crypto limit %s',
		async (limit) => {
			expect(await submit({ cryptoLimit: limit })).toMatchObject({ status: 400 });
			expect(buildOptimizedPortfolio).not.toHaveBeenCalled();
		}
	);

	it('retains fractional target and crypto percentages', async () => {
		await submit({ target: '8.25', cryptoLimit: '2.75', returnType: 'real' });
		expect(buildOptimizedPortfolio).toHaveBeenCalledWith(0.0825, 0.0275, [19, 45], 'real');
	});

	it('reports unsupported date ranges as invalid input', async () => {
		vi.mocked(selectPortfolioBlocks).mockImplementationOnce(() => {
			throw new Error('Select at least 11 years');
		});
		expect(await submit({ startYear: '2020' })).toMatchObject({
			status: 400,
			data: { error: 'Select at least 11 years' }
		});
		expect(buildOptimizedPortfolio).not.toHaveBeenCalled();
	});
});
