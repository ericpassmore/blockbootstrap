import { describe, it, expect, vi } from 'vitest';
import { cryptoAssetClassMock } from '../mocks/cryptoAssetClassMock';
import { powerLawFormulaMock } from '../mocks/powerLawFormulaMock';

// mock *before* importing the module under test
vi.mock('$lib/server/cryptoAssetClass', () => ({
	cryptoAssetClass: cryptoAssetClassMock
}));
vi.mock('$lib/server/powerLawFormula', () => ({
	powerLawFormula: powerLawFormulaMock
}));

import { ForecastOptions } from '$lib/forecastOptions';

describe('ForecastOptions Crypto Settings', () => {
	it('defaults the additional-index toggle off without changing the original constructor arguments', () => {
		const options = new ForecastOptions(true, true, 30, true);
		expect(options.includeMoreIndexes).toBe(false);
		expect(options.rebalance).toBe(true);
		expect(options.inflationAdjusted).toBe(true);
		expect(options.returnWindow).toBe(30);
		expect(options.cryptoUseHistoricalPrice).toBe(true);
	});

	it('accepts the additional-index toggle as its fifth constructor argument', () => {
		const options = new ForecastOptions(false, false, 10, true, true);
		expect(options.includeMoreIndexes).toBe(true);
		expect(options.cryptoUseHistoricalPrice).toBe(true);
	});
	it('should default cryptoUseHistoricalPrice to false', () => {
		const options = new ForecastOptions();
		expect(options.cryptoUseHistoricalPrice).toBe(false);
	});

	it('should set cryptoUseHistoricalPrice to false with cryptoPowerLawPrediction()', () => {
		const options = new ForecastOptions();
		options.cryptoPowerLawPrediction();
		expect(options.cryptoUseHistoricalPrice).toBe(false);
	});

	it('should set cryptoUseHistoricalPrice to true with cryptoHistoricalPricing()', () => {
		const options = new ForecastOptions();
		options.cryptoHistoricalPricing();
		expect(options.cryptoUseHistoricalPrice).toBe(true);
	});
});
