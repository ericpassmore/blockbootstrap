import { describe, it, expect, vi } from 'vitest';
import { ForecastOptions } from '$lib/forecastOptions';
import { cryptoAssetClassMock } from '../mocks/cryptoAssetClassMock';
import { powerLawFormulaMock } from '../mocks/powerLawFormulaMock';

// mock *before* importing the module under test
vi.mock('$lib/server/cryptoAssetClass', () => ({
	cryptoAssetClass: cryptoAssetClassMock
}));
vi.mock('$lib/server/powerLawFormula', () => ({
	powerLawFormula: powerLawFormulaMock
}));

import { ModelReturns, type Allocation } from '$lib/modelReturns';

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
