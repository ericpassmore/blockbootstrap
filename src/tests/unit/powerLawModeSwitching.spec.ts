import { describe, it, expect } from 'vitest';
import { ModelReturns, type Allocation } from '$lib/modelReturns';
import { ForecastOptions } from '$lib/forecastOptions';

describe('Power Law Mode Switching', () => {
	it('should produce different results between power law and historical crypto modes', async () => {
		const allocations: Allocation[] = [{ key: 'crypto:BTC', label: 'Bitcoin', value: 100 }];
		const startingAmount = 100000;
		const blockNumbers = [1];

		// Power law mode
		const optionsPowerLaw = new ForecastOptions();
		optionsPowerLaw.cryptoUseHistoricalPrice = false;

		// Historical price mode
		const optionsHistorical = new ForecastOptions();
		optionsHistorical.cryptoUseHistoricalPrice = true;

		const modelPowerLaw = await ModelReturns.create(
			startingAmount,
			allocations,
			blockNumbers,
			optionsPowerLaw
		);

		const modelHistorical = await ModelReturns.create(
			startingAmount,
			allocations,
			blockNumbers,
			optionsHistorical
		);

		expect(modelPowerLaw.finalValue).not.toBeCloseTo(modelHistorical.finalValue);
	});
});