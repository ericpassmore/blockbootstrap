// src/routes/+page.server.ts
import { POLYGON_API_KEY } from '$env/static/private';
import { PolygonService } from '$lib/polygon.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { ticker } = params;

	// Validate ticker parameter
	if (!ticker || typeof ticker !== 'string') {
		throw error(400, 'Invalid ticker parameter');
	}

	// Validate API key exists
	if (!POLYGON_API_KEY) {
		throw error(500, 'Missing Polygon API key');
	}

	const polygonService = new PolygonService(POLYGON_API_KEY);

	// Get data for the last 30 days (corrected date logic)
	const now = new Date();
	const to = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // four days ago
	const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

	const toStr = to.toISOString().split('T')[0];
	const fromStr = from.toISOString().split('T')[0];
	try {
		const weeklyData = await polygonService.getWeeklyAssetData(
			ticker.toUpperCase(),
			fromStr,
			toStr
		);
		return {
			ticker: ticker.toUpperCase(),
			weeklyData,
			dateRange: {
				from: fromStr,
				to: toStr
			},
			success: true
		};
	} catch (err) {
		console.error('Failed to load data for ticker:', ticker, err);
		// Handle specific error types if needed
		if (err instanceof Error) {
			if (err.message.includes('404') || err.message.includes('not found')) {
				throw error(404, `Ticker "${ticker}" not found`);
			}
			if (err.message.includes('rate limit')) {
				throw error(429, 'API rate limit exceeded. Please try again later.');
			}
		}

		// For development/debugging, you might want to return error info
		// For production, consider throwing a generic error instead
		throw error(500, 'Failed to fetch market data');
	}
};
