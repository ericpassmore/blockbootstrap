import type { powerLawCalParams } from '$lib/server/powerLawFormula';

export const powerLawFormulaMock = {
	getPowerLawCalParams(symbol: string): {
		core: powerLawCalParams | undefined;
		lowerBound: powerLawCalParams | undefined;
		upperBound: powerLawCalParams | undefined;
	} {
		if (symbol === 'SOL') {
			const core: powerLawCalParams = {
				coefficient_a: 2.0207982973876115e-7,
				exponent_b: 2.703111530476079,
				offset_c: 36.97426161118382
			};
			return { core, lowerBound: core, upperBound: core };
		} else if (symbol === 'BTC') {
			const core: powerLawCalParams = {
				coefficient_a: 1.23456789e-7,
				exponent_b: 2.12345678,
				offset_c: 30.12345678
			};
			return { core, lowerBound: core, upperBound: core };
		}
		return { core: undefined, lowerBound: undefined, upperBound: undefined };
	}
};
