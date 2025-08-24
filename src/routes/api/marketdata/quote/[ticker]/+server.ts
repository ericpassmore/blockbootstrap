import { json } from '@sveltejs/kit';
import { POLYGON_API_KEY } from '$env/static/private';
import { PolygonService } from '$lib/polygon.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, params }) => {
	// Fix: Correct parameter extraction
	const { ticker } = params;
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');

	// Validate required parameters
	if (!ticker) {
		return json(
			{
				success: false,
				error: 'Missing required parameter: ticker'
			},
			{ status: 400 }
		);
	}

	if (!from || !to) {
		return json(
			{
				success: false,
				error: 'Missing required parameters: from and to dates (format: YYYY-MM-DD)'
			},
			{ status: 400 }
		);
	}

	// Validate API key
	if (!POLYGON_API_KEY) {
		console.error('Missing POLYGON_API_KEY environment variable');
		return json(
			{
				success: false,
				error: 'Service temporarily unavailable'
			},
			{ status: 503 }
		);
	}

	// Validate date formats
	if (!PolygonService.isValidDate(from) || !PolygonService.isValidDate(to)) {
		return json(
			{
				success: false,
				error: 'Invalid date format. Use YYYY-MM-DD format'
			},
			{ status: 400 }
		);
	}

	// Validate date range
	if (!PolygonService.isValidDateRange(from, to)) {
		return json(
			{
				success: false,
				error: 'Invalid date range. "from" must be before "to" and within reasonable limits'
			},
			{ status: 400 }
		);
	}

	// Validate ticker format (basic validation)
	const tickerRegex = /^[A-Za-z]{1,5}$/;
	if (!tickerRegex.test(ticker)) {
		return json(
			{
				success: false,
				error: 'Invalid ticker format. Must be 1-5 letters only'
			},
			{ status: 400 }
		);
	}

	const polygonService = new PolygonService(POLYGON_API_KEY);

	try {
		const weeklyData = await polygonService.getWeeklyAssetData(ticker.toUpperCase(), from, to);

		// Check if we got any data
		if (!weeklyData || weeklyData.length === 0) {
			return json(
				{
					success: false,
					error: `No data found for ticker "${ticker.toUpperCase()}" in the specified date range`
				},
				{ status: 404 }
			);
		}

		return json(
			{
				success: true,
				data: weeklyData,
				metadata: {
					ticker: ticker.toUpperCase(),
					from,
					to,
					count: weeklyData.length
				}
			},
			{
				headers: {
					// Add caching headers for better performance
					'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
					'Content-Type': 'application/json'
				}
			}
		);
	} catch (error) {
		console.error('API error for ticker:', ticker, error);

		// Handle specific error types
		if (error instanceof Error) {
			// Handle rate limiting
			if (error.message.includes('rate limit') || error.message.includes('429')) {
				return json(
					{
						success: false,
						error: 'API rate limit exceeded. Please try again later.'
					},
					{
						status: 429,
						headers: {
							'Retry-After': '60' // Suggest retry after 60 seconds
						}
					}
				);
			}

			// Handle not found/invalid ticker
			if (error.message.includes('404') || error.message.includes('not found')) {
				return json(
					{
						success: false,
						error: `Ticker "${ticker.toUpperCase()}" not found`
					},
					{ status: 404 }
				);
			}

			// Handle authentication errors
			if (error.message.includes('401') || error.message.includes('unauthorized')) {
				console.error('Polygon API authentication failed');
				return json(
					{
						success: false,
						error: 'Service temporarily unavailable'
					},
					{ status: 503 }
				);
			}

			// Handle timeout errors
			if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
				return json(
					{
						success: false,
						error: 'Request timeout. Please try again.'
					},
					{ status: 504 }
				);
			}
		}

		// Generic server error for unhandled cases
		return json(
			{
				success: false,
				error: 'Internal server error occurred while fetching data'
			},
			{ status: 500 }
		);
	}
};
