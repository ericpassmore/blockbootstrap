import type { RequestHandler } from './$types';
import { BlockData, type MarketData } from '$lib/block';

export const GET: RequestHandler = async ({ params }) => {
	const blockNumber = Number(params.blockNumber);

	await BlockData.init();
	const block: MarketData[] = BlockData.getSeries(blockNumber) as MarketData[];

	return new Response(JSON.stringify({ block: block }), {
		headers: { 'Content-Type': 'application/json' }
	});
};
