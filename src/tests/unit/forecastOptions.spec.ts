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
