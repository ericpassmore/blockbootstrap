// src/lib/types.ts
export interface PolygonAggregateResponse {
	ticker: string;
	queryCount: number;
	resultsCount: number;
	adjusted: boolean;
	results: PolygonBar[];
	status: string;
	request_id: string;
	count: number;
}

export interface PolygonBar {
	v: number; // Volume
	vw: number; // Volume weighted average price
	o: number; // Open price
	c: number; // Close price
	h: number; // High price
	l: number; // Low price
	t: number; // Timestamp
	n: number; // Number of transactions
}

export interface WeeklyData {
	date: string;
	close: number;
	volume: number;
	timestamp: number;
}

// src/lib/polygon.ts
const POLYGON_BASE_URL = 'https://api.polygon.io';

export class PolygonService {
	private apiKey: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	/**
	 * Fetch weekly aggregates for BTC/USD
	 * @param from Start date (YYYY-MM-DD format)
	 * @param to End date (YYYY-MM-DD format)
	 * @returns Promise with weekly data
	 */
	async getWeeklyAssetData(ticker: string, from: string, to: string): Promise<WeeklyData[]> {
		//ticker = 'X:BTCUSD';
		const multiplier = 1;
		const timespan = 'week';

		const url = `${POLYGON_BASE_URL}/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}`;

		const params = new URLSearchParams({
			adjusted: 'true',
			sort: 'asc',
			limit: '5000',
			apikey: this.apiKey
		});

		try {
			const response = await fetch(`${url}?${params}`);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: PolygonAggregateResponse = await response.json();

			if (data.status !== 'OK') {
				throw new Error(`API error: ${data.status}`);
			}

			return data.results.map((bar) => ({
				date: new Date(bar.t).toISOString().split('T')[0],
				close: bar.c,
				volume: bar.v,
				timestamp: bar.t
			}));
		} catch (error) {
			console.error('Error fetching market data:', error);
			throw error;
		}
	}
	// Date validation helper
	static isValidDate(dateString: string): boolean {
		const date = new Date(dateString);
		return date instanceof Date && !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
	}

	// Date range validation helper
	static isValidDateRange(from: string, to: string): boolean {
		const fromDate = new Date(from);
		const toDate = new Date(to);

		// Check if 'from' is before 'to'
		if (fromDate >= toDate) {
			return false;
		}

		// Optional: Check if date range is reasonable (not too far in the past/future)
		const now = new Date();
		const maxPastDays = 365 * 2; // 2 years
		const minDate = new Date(now.getTime() - maxPastDays * 24 * 60 * 60 * 1000);

		return fromDate >= minDate && toDate <= now;
	}
}
