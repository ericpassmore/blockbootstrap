import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Allocation } from '$lib/modelReturns';

vi.mock('$lib/server/db', () => ({ db: {} }));
vi.mock('$lib/user', () => ({ User: vi.fn() }));
vi.mock('$lib/forecastService', () => ({ ForecastService: { create: vi.fn() } }));

import { ForecastService } from '$lib/forecastService';
import { User } from '$lib/user';
import { actions } from '../../routes/+page.server';

const stocks = (value = 100): Allocation => ({ key: 'sp500', label: 'Stocks', value });
const international = (value: number): Allocation => ({
	key: 'internationalEquity',
	label: 'International',
	value
});

async function submit(allocations: Allocation[], toggle?: string) {
	const body = new FormData();
	body.set('startingAmount', '1000');
	body.set('allocations', JSON.stringify(allocations));
	body.set('rebalance', 'on');
	body.set('inflationAdjusted', 'on');
	body.set('returnWindow', '20');
	body.set('cryptousehistoricalprices', 'on');
	if (toggle !== undefined) body.set('includeMoreIndexes', toggle);
	return actions.runForecast({
		request: new Request('http://localhost/?/runForecast', { method: 'POST', body })
	} as Parameters<typeof actions.runForecast>[0]);
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(ForecastService.create).mockResolvedValue({
		forecasts: [],
		startingAmount: 1000,
		median: 2000,
		medianSeries: [19, 20],
		q1: 1500,
		q1Series: [19, 21],
		q3: 2500,
		q3Series: [19, 22],
		averageCAGR: 4,
		finalValueStdDev: 100
	} as unknown as ForecastService);
});

describe('forecast action additional-index toggle', () => {
	it.each([undefined, 'on'])(
		'round-trips the toggle %s while preserving the four existing option values',
		async (toggle) => {
			const enabled = toggle === 'on';
			const result = await submit([stocks()], toggle);
			expect(result).toMatchObject({
				success: true,
				includeMoreIndexes: enabled,
				options: [true, true, 20, true]
			});
			const [startingAmount, allocations, options] = vi.mocked(ForecastService.create).mock
				.calls[0];
			expect(startingAmount).toBe(1000);
			expect(options.includeMoreIndexes).toBe(enabled);
			expect(options.returnWindow).toBe(20);
			expect(options.inflationAdjusted).toBe(true);
			expect(allocations.map((asset) => [asset.key, asset.value])).toEqual(
				enabled
					? [
							['sp500', 100],
							['internationalEquity', 0],
							['emergingMarkets', 0],
							['nasdaq100', 0]
						]
					: [['sp500', 100]]
			);
			expect(User).not.toHaveBeenCalled();
		}
	);

	it('preserves submitted additional-index weights when the toggle is enabled', async () => {
		const allocations: Allocation[] = [
			stocks(60),
			international(20),
			{ key: 'emergingMarkets', label: 'Emerging', value: 10 },
			{ key: 'nasdaq100', label: 'NASDAQ', value: 10 }
		];
		const result = await submit(allocations, 'on');
		expect(result).toMatchObject({ success: true, includeMoreIndexes: true });
		expect(
			vi.mocked(ForecastService.create).mock.calls[0][1].map((asset) => [asset.key, asset.value])
		).toEqual(allocations.map((asset) => [asset.key, asset.value]));
	});

	it('rejects an insufficient visible allocation after stripping hidden index weights', async () => {
		const result = await submit([stocks(80), international(20)]);
		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Total allocation must be 100%.', includeMoreIndexes: false }
		});
		expect(ForecastService.create).not.toHaveBeenCalled();
	});

	it('validates the visible allocation rather than counting hidden submitted weights', async () => {
		const result = await submit([stocks(100), international(20)]);
		expect(result).toMatchObject({
			success: true,
			allocations: [stocks(100)],
			includeMoreIndexes: false
		});
		expect(vi.mocked(ForecastService.create).mock.calls[0][1]).toEqual([stocks(100)]);
	});

	it('treats a non-on checkbox value as disabled', async () => {
		const result = await submit([stocks(), international(25)], 'false');
		expect(result).toMatchObject({
			success: true,
			allocations: [stocks()],
			includeMoreIndexes: false
		});
		expect(vi.mocked(ForecastService.create).mock.calls[0][2].includeMoreIndexes).toBe(false);
	});
});
