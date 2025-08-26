import { describe, it, expect } from 'vitest';
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