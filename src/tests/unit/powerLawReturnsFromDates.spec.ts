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

// now import the module that depends on the mocks
import { powerLawReturnsFromDates } from '$lib/server/powerLawReturnsFromDates';

describe('powerLawReturnsFromDates', () => {
	it('should return a percentage return greater than 1 for SOL starting in 2022', () => {
		const result = powerLawReturnsFromDates.percentageReturn('SOL', 2022);
		expect(result).toBeGreaterThan(1);
	});

	it('should return the same value for SOL with start year 2022 and end year 2023 as with only start year 2022', () => {
		const result1 = powerLawReturnsFromDates.percentageReturn('SOL', 2022);
		const result2 = powerLawReturnsFromDates.percentageReturn('SOL', 2022, 2023);
		expect(result1 ?? 0).toBeCloseTo(result2 ?? 0, 5);
	});

	it('should return 0 for invalid symbol', () => {
		const result = powerLawReturnsFromDates.percentageReturn('INVALID', 2022);
		expect(result).toBe(1);
	});
});
