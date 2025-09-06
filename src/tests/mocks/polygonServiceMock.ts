import msftQuote from '../data/msft_quote.json';
import { vi } from 'vitest';

export const getWeeklyAssetDataMock = vi.fn((ticker: string, from: string, to: string) => {
	if (ticker.toUpperCase() === 'MSFT' && from === '2025-07-20' && to === '2025-08-17') {
		return Promise.resolve(msftQuote.data); // return just .data, not whole JSON
	}
	return Promise.resolve([]);
});

// Build a constructor mock
const PolygonServiceMock = vi.fn(() => ({
	getWeeklyAssetData: getWeeklyAssetDataMock
}));

// Attach static methods
PolygonServiceMock.isValidDate = (date: string) => {
	const d = new Date(date);
	return d instanceof Date && !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(date);
};
PolygonServiceMock.isValidDateRange = (from: string, to: string) => {
	const fromDate = new Date(from);
	const toDate = new Date(to);
	if (fromDate >= toDate) return false;
	const now = new Date();
	const maxPastDays = 365 * 2;
	const minDate = new Date(now.getTime() - maxPastDays * 86400000);
	return fromDate >= minDate && toDate <= now;
};

export function setupPolygonServiceMock() {
	vi.mock('../../lib/polygon', () => ({
		PolygonService: PolygonServiceMock
	}));
}
