import type { MarketData } from './block';
import { Taxes } from '$lib/taxes';

/**
 * Defines the structure for a user's portfolio allocation.
 * The `key` is type-safe and must correspond to an asset in the MarketData interface.
 */
export interface Allocation {
	key: keyof Omit<MarketData, 'year' | 'inflation' | 'sp500DividendYield'>;
	label: string;
	value: number; // The percentage allocation
}

/**
 * Defines the structure for a single year's calculated portfolio return.
 */
export interface YearlyReturn {
	year: number;
	startValue: number;
	endValue: number;
	growth: number;
    capitalGains: number;
    taxes: number
	percentageAllocations: Allocation[];
}

/**
 * A class to model portfolio returns over a historical block of data.
 */
export class ModelReturns {
	public results: YearlyReturn[] = [];
	public finalValue: number;
	public startingAmount: number;
    public initialAllocation: { [key: string]: number } = {};

	/**
	 * Calculates the portfolio's performance year-over-year based on a starting amount,
	 * user-defined allocations, and a historical data block.
	 * @param startingAmount The initial investment amount.
	 * @param allocations An array defining the portfolio allocation percentages.
	 * @param blockData An array of historical market data for the simulation period.
	 */
	constructor(startingAmount: number, allocations: Allocation[], blockData: MarketData[]) {
		this.startingAmount = startingAmount;
        this.finalValue = 0;

        // This object will hold the current dollar value of each asset.
		// It's initialized with the starting allocation and then updated each year.
		const assetValues: { [key: string]: number } = {};

        // Calculate the initial dollar value for each allocated asset
		for (const asset of allocations) {
			const startValue = (this.startingAmount * asset.value) / 100;
			assetValues[asset.key] = startValue;
			this.initialAllocation[asset.key] = startValue;
		}

        let currentPortfolioValue = startingAmount

		for (const yearData of blockData) {
			const startOfYearValue = currentPortfolioValue;
            let capitalGains = 0;
            let endOfYearValue = 0;

			// Calculate end-of-year value for each asset based on its return
			for (const assetKey in assetValues) {
				const key = assetKey as keyof typeof assetValues;
				const assetStartValue = assetValues[key];

				const assetReturnPercentage = key in yearData ? (yearData[key as keyof MarketData] as number) : 0;
				const valueAfterReturn = assetStartValue * (1 + assetReturnPercentage / 100);
				assetValues[key] = valueAfterReturn;
				endOfYearValue += valueAfterReturn;

				// Separately calculate and track capital gains from dividends for sp500
				if (key === 'sp500') {
					const dividendYield = yearData.sp500DividendYield || 0;
					capitalGains += assetStartValue * (dividendYield / 100);
				}
			}

			const growth = endOfYearValue - startOfYearValue;
            const totalReturnPercentage = startOfYearValue > 0 ? (growth / startOfYearValue) * 100 : 0;

            // Calculate the new percentage allocation for each asset at year-end
			const endOfYearPercentageAllocations: Allocation[] = allocations.map((asset) => ({
				...asset,
				value: endOfYearValue > 0 ? (assetValues[asset.key] / endOfYearValue) * 100 : 0
			}));

			this.results.push({
				year: yearData.year,
				startValue: startOfYearValue,
				endValue: endOfYearValue,
				growth: growth,
                capitalGains: capitalGains,
                taxes: new Taxes().calculateTaxes(0, capitalGains, 0),
                percentageAllocations: endOfYearPercentageAllocations
			});

			// This is the fix: update the portfolio value for the next year's calculation.
			currentPortfolioValue = endOfYearValue;
		}
		// Set the final value after the loop has completed.
		this.finalValue = currentPortfolioValue;
	}

    public calculateCAGR(): number {
		if (this.startingAmount <= 0 || this.results.length === 0) {
			return 0; // Cannot calculate CAGR under these conditions.
		}
		// If the final value is negative, CAGR is not mathematically well-defined for real numbers.
		// We can return the total simple return as a reasonable fallback.
		if (this.finalValue < 0) {
			return (this.finalValue - this.startingAmount) / this.startingAmount;
		}

		return Math.pow(this.finalValue / this.startingAmount, 1 / this.results.length) - 1;
	}
}