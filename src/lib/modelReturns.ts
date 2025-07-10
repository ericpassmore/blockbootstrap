import type { MarketData } from '$lib/block';
import { blockData, MarketDataService } from '$lib/block';
import { Taxes } from '$lib/taxes';
import { AssetReturns } from '$lib/assetReturns';
import { ConstantRateReturns } from '$lib/constantRateReturns';

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
    taxes: number;
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
    private taxModel: Taxes;
    private treasuryPurchases: AssetReturns = new AssetReturns('treasury10Year', '10 Year Treasury');
    // Using static methods from ConstantRateReturns directly


    /**
     * Calculates the portfolio's performance year-over-year based on a starting amount,
     * user-defined allocations, and a historical data block.
     * @param startingAmount The initial investment amount.
     * @param allocations An array defining the portfolio allocation percentages.
     * @param blockData An array of historical market data for the simulation period.
     * @param blockNumber The block number associated with the data
     */
    constructor(startingAmount: number, allocations: Allocation[], blockNumber: number) {
        this.startingAmount = startingAmount;
        this.taxModel = new Taxes();
        this.finalValue = 0;
        const block = blockData.getSeries(blockNumber);
		if (!block || block.length === 0) {
			console.warn(`Historical data for Block ${blockNumber} could not be found. Skipping.`);
            return;
		}

        // This object will hold the current dollar value of each asset.
        // It's initialized with the starting allocation and then updated each year.
        const assetValues: { [key: string]: number } = {};
        const epochStartYear = blockData.getHistoricalYear(blockNumber, 0);


        // Calculate the initial dollar value for each allocated asset
        for (const asset of allocations) {
            const startValue = (this.startingAmount * asset.value) / 100;
            assetValues[asset.key] = startValue;
            if (asset.key === 'treasury10Year') {
                // initalize our treasure purchase history with our starting values 
                this.treasuryPurchases.addRecord(
                    epochStartYear,
                    startValue,
                    ConstantRateReturns.getYield(epochStartYear)
                )
            }
            this.initialAllocation[asset.key] = startValue;
        }

        let currentPortfolioValue = startingAmount

        for (const yearData of block) {
            const startOfYearValue = currentPortfolioValue;
            // series starts at one not zero so adjust down by 1
            const historicalReferenceYear = yearData.year - 1 + epochStartYear;
            let ordinaryIncome = 0;
            let dividendIncome = 0;
            let endOfYearValue = 0;

            // Calculate end-of-year value for each asset based on its return
            for (const assetKey in assetValues) {
                const key = assetKey as keyof typeof assetValues;
                const assetStartValue = assetValues[key];
                const assetReturnPercentage = key in yearData ? (yearData[key as keyof MarketData] as number) : 0;

                // Identify and sum up different types of income for tax purposes
                if (key === 'TBill' || key === 'baaCorp') {
                    ordinaryIncome += assetStartValue * (assetReturnPercentage / 100);
                } else if (key === 'treasury10Year') {
                    // income is sum of all treasuries purchased 
                    const thisYearTreasuryIncome = this.treasuryPurchases.totalIncome()
                    const treasuryYield = ConstantRateReturns.getYield(historicalReferenceYear)
                    // income is used to purchase new 10yr Teasury
                    this.treasuryPurchases.addRecord(
                        historicalReferenceYear,
                        thisYearTreasuryIncome,
                        treasuryYield
                    )
                    ordinaryIncome += thisYearTreasuryIncome;
                } else if (key === 'sp500') {
                    const dividendYield = yearData.sp500DividendYield || 0;
                    dividendIncome += assetStartValue * (dividendYield / 100);
                }

                const valueAfterReturn = assetStartValue * (1 + assetReturnPercentage / 100);
                assetValues[key] = valueAfterReturn;
                endOfYearValue += valueAfterReturn;
            }

            // Calculate taxes on the income generated during the year
            const taxes = this.taxModel.calculateTaxes(ordinaryIncome, dividendIncome, 0);

            // Subtract taxes from the portfolio value to get the true end-of-year value
            const growth = endOfYearValue - startOfYearValue;

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
                taxes: taxes,
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