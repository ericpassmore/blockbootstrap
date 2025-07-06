import { blockData, type MarketData } from '$lib/block';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const block: MarketData[] = blockData.getSeries(parseInt(params.block)) as MarketData[];
	return { block: block, blockNumber: parseInt(params.block,10) || 0 };
};