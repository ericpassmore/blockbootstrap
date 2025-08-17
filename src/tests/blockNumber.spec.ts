import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../../src/routes/api/block/[blockNumber]/+server';
import blockResponse from './data/block_response.json';
import * as blockModule from '../../src/lib/block';

describe('GET /api/block/[blockNumber]', () => {
	const mockBlockNumber = 1;

	beforeEach(() => {
		// Mock BlockData.init to resolve immediately
		vi.spyOn(blockModule.BlockData, 'init').mockResolvedValue();

		// Mock BlockData.getSeries to return the mock block data
		vi.spyOn(blockModule.BlockData, 'getSeries').mockReturnValue(blockResponse.block);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns the block data for the given block number', async () => {
		const params = { blockNumber: String(mockBlockNumber) };
		const response = await GET({ params } as any);

		expect(response).toBeInstanceOf(Response);
		expect(response.headers.get('Content-Type')).toBe('application/json');

		const json = await response.json();
		expect(json).toEqual({ block: blockResponse.block });
	});

	it('calls BlockData.init and BlockData.getSeries with correct parameters', async () => {
		const initSpy = vi.spyOn(blockModule.BlockData, 'init');
		const getSeriesSpy = vi.spyOn(blockModule.BlockData, 'getSeries');

		const params = { blockNumber: String(mockBlockNumber) };
		await GET({ params } as any);

		expect(initSpy).toHaveBeenCalled();
		expect(getSeriesSpy).toHaveBeenCalledWith(mockBlockNumber);
	});

	it('returns 10 rows and all expected fields exist in each row', async () => {
		const params = { blockNumber: String(mockBlockNumber) };
		const response = await GET({ params } as any);
		const json = await response.json();

		expect(json.block).toHaveLength(10);

		const expectedFields = [
			'year',
			'sp500',
			'usSmallCap',
			'TBill',
			'treasury10Year',
			'baaCorp',
			'realEstate',
			'gold',
			'inflation',
			'sp500DividendYield',
			'usSmallCapDividendYield',
			'bitcoin',
			'internationalEquity',
			'emergingMarkets',
			'nasdaq100'
		];

		for (const row of json.block) {
			for (const field of expectedFields) {
				expect(row).toHaveProperty(field);
			}
		}
	});
});
