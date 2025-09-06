import { cryptoAssetClass } from './cryptoAssetClass';
import { powerLawFormula } from './powerLawFormula';

export class powerLawReturnsFromDates {
	// Calculate percentage return between two dates using power law formula and genesis date
	public static percentageReturn(
		symbol: string,
		startYear: number,
		endYear?: number
	): number | undefined {
		const genesisDate = cryptoAssetClass.getGenesisDate(symbol);
		if (!genesisDate) return 1;

		const powerLawParams = powerLawFormula.getPowerLawCalParams(symbol);
		if (!powerLawParams.core) return 1;

		// Helper to calculate days since genesis to Dec 31 of given year
		function daysSinceGenesis(year: number): number {
			const dec31 = new Date(year, 11, 31);
			if (!genesisDate) return 0;
			const diff = dec31.getTime() - genesisDate.getTime();
			return diff / (1000 * 60 * 60 * 24);
		}

		const startDays = daysSinceGenesis(startYear);
		const endYearVal = endYear ?? startYear + 1;
		const endDays = daysSinceGenesis(endYearVal);

		// Power law price calculation: a * (days^b) + c
		const startPrice =
			powerLawParams.core.coefficient_a * Math.pow(startDays, powerLawParams.core.exponent_b) +
			powerLawParams.core.offset_c;
		const endPrice =
			powerLawParams.core.coefficient_a * Math.pow(endDays, powerLawParams.core.exponent_b) +
			powerLawParams.core.offset_c;

		if (startPrice === 0) return 1;

		const percentage = ((endPrice - startPrice) / startPrice) * 100;
		return percentage;
	}
}
