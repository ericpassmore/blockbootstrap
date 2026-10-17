import { describe, expect, it } from 'vitest';
import { ADDITIONAL_INDEXES, setAdditionalIndexes } from '$lib/portfolioAssets';
import type { Allocation } from '$lib/modelReturns';

const base: Allocation[] = [{ key: 'sp500', label: 'S&P 500', value: 100 }];

describe('additional portfolio indexes', () => {
	it('adds all three indexes at zero without changing the base allocation', () => {
		const result = setAdditionalIndexes(base, true);
		expect(result).toEqual([...base, ...ADDITIONAL_INDEXES]);
		expect(base).toHaveLength(1);
		expect(result.reduce((sum, asset) => sum + asset.value, 0)).toBe(100);
	});

	it('preserves restored index weights and does not duplicate them', () => {
		const restored = [...base, { key: 'nasdaq100', label: 'NASDAQ', value: 20 } as Allocation];
		const result = setAdditionalIndexes(restored, true);
		expect(result.filter((asset) => asset.key === 'nasdaq100')).toEqual([
			{ key: 'nasdaq100', label: 'Nasdaq-100', value: 20 }
		]);
		expect(setAdditionalIndexes(result, true)).toEqual(result);
	});

	it('removes hidden index weights and leaves reallocation to the user', () => {
		const allocations: Allocation[] = [
			{ key: 'sp500', label: 'S&P 500', value: 80 },
			{ key: 'nasdaq100', label: 'Nasdaq-100', value: 20 }
		];
		const result = setAdditionalIndexes(allocations, false);
		expect(result).toEqual([allocations[0]]);
		expect(result.reduce((sum, asset) => sum + asset.value, 0)).toBe(80);
		expect(
			setAdditionalIndexes(result, true).find((asset) => asset.key === 'nasdaq100')?.value
		).toBe(0);
	});
});
