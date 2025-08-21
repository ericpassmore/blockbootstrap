import { describe, it, expect, vi, beforeEach } from 'vitest';

import { setupPolygonServiceMock } from '../mocks/polygonServiceMock';
// Global environment variable mocks for all tests
vi.mock('$env/static/private', () => ({
	POLYGON_API_KEY: 'test-polygon-api-key-12345'
	// Add other private environment variables here
}));
setupPolygonServiceMock();
import { GET } from '../../routes/api/quote/[ticker]/+server';

describe('GET /api/quote/[ticker]', () => {
	it('returns 3 or more data rows and metadata.ticker is MSFT for valid request', async () => {
		const url = new URL('http://localhost:5173/api/quote/msft?from=2025-07-20&to=2025-08-17');
		const params = { ticker: 'msft' };

		const response = await GET({ url, params } as any);
		const body = await response.json();

		expect(body.success).toBe(true);
		expect(body.data.length).toBeGreaterThanOrEqual(3);
		expect(body.metadata.ticker).toBe('MSFT');
	});

	it('returns 400 error for malformed date parameters', async () => {
		const url = new URL('http://localhost:5173/api/quote/msft?from="2025-07-20"&to="2025-08-17"');
		const params = { ticker: 'msft' };

		const response = await GET({ url, params } as any);
		expect(response.status).toBe(400);

		const body = await response.json();
		expect(body.success).toBe(false);
	});
});
