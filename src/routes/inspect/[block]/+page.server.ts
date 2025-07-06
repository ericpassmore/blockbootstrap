import { blockData, type MarketData } from '$lib/block';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return { block: blockData.getSeries(parseInt(params.block)) as MarketData[] };
};