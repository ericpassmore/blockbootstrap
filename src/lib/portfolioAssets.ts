import type { Allocation } from '$lib/modelReturns';

export const ADDITIONAL_INDEXES: readonly Allocation[] = [
	{ key: 'internationalEquity', label: 'International stocks', value: 0 },
	{ key: 'emergingMarkets', label: 'Emerging markets', value: 0 },
	{ key: 'nasdaq100', label: 'Nasdaq-100', value: 0 }
];

const additionalKeys = new Set(ADDITIONAL_INDEXES.map((asset) => asset.key));

/** Hidden indexes must not contribute to the allocation total or submitted forecast. */
export function setAdditionalIndexes(allocations: Allocation[], enabled: boolean): Allocation[] {
	const base = allocations.filter((asset) => !additionalKeys.has(asset.key));
	if (!enabled) return base;
	return [
		...base,
		...ADDITIONAL_INDEXES.map((asset) => ({
			...asset,
			value: allocations.find((existing) => existing.key === asset.key)?.value ?? 0
		}))
	];
}
