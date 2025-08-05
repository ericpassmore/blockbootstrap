import type { MarketData } from '$lib/block';
import { BlockData } from '$lib/block';
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
export interface AnnualReturn {
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
    public results: AnnualReturn[] = [];
    public finalValue: number;
    public startingAmount: number;
    private taxModel: Taxes;
    private treasuryPurchases: AssetReturns = new AssetReturns('treasury10Year', '10 Year Treasury');
    private baaCorpPurchases: AssetReturns = new AssetReturns('baaCorp', 'BAA Corporate Bonds');
    // Note: baaCorpPurchases added to track purchases and reinvest income similarly to treasury10Year


    /**
     * Calculates the portfolio's performance year-over-year based on a starting amount,
     * user-defined allocations, and a historical data block.
     * @param startingAmount The initial investment amount.
     * @param allocations An array defining the portfolio allocation percentages.
     * @param blockNumber The block number associated with the data
     */
    constructor(startingAmount: number, allocations: Allocation[], blockNumber: number) {
        this.startingAmount = startingAmount;
        this.taxModel = new Taxes();
        this.finalValue = 0;
        const block = BlockData.getSeries(blockNumber);
        if (!block || block.length === 0) {
            console.warn(`Historical data for Block ${blockNumber} could not be found. Skipping.`);
            return;
        }

        // Calculate the initial dollar value for each asset based on the starting amount and allocation percentages.
        const assetValues = this._initializeAssetValues(allocations);

        // This variable tracks the total portfolio value, updated annually through the simulation.
        let currentPortfolioValue = startingAmount;

        for (const yearData of block) {
            const startOfYearValue = currentPortfolioValue;
            // series starts at one not zero so adjust down by 1
            const historicalReferenceYear = BlockData.getHistoricalYear(blockNumber, yearData.year)
            const lastYear = historicalReferenceYear - 1;
            let ordinaryIncome = 0;
            let dividendIncome = 0;
            let endOfYearValue = 0;

            // Calculate end-of-year value for each asset based on its return
            for (const assetKey in assetValues) {
                const key = assetKey as keyof typeof assetValues;
                const assetStartValue = assetValues[key];
                const assetReturnPercentage = key in yearData ? (yearData[key as keyof MarketData] as number) : 0;

                // Identify and sum up different types of income for tax purposes
                switch (key) {
                    case 'TBill':
                        ordinaryIncome += assetStartValue * (assetReturnPercentage / 100);
                        break;
                    case 'baaCorp':
                        let thisYearBaaCorpIncome = 0;
                        // to initialize if there are no records
                        // no records, either first time or previous years have negative returns
                        if (!this.baaCorpPurchases.hasRecords()) {
                            this._addBaaCorpPurchase(historicalReferenceYear, assetStartValue);
                        } else {
                            // income from the previous year used to purchase this year's items
                            thisYearBaaCorpIncome = this.baaCorpPurchases.getChangeInValue(lastYear);
                            this._addBaaCorpPurchase(historicalReferenceYear, thisYearBaaCorpIncome);
                        }
                        ordinaryIncome += this.baaCorpPurchases.totalIncome();
                        break;
                    // Note: Updated baaCorp to track historical purchases and reinvest income like treasury10Year
                    case 'treasury10Year':
                        let thisYearTreasuryIncome = 0;
                        // to initialize if there are no records
                        // no records, either first time or previous years have negative returns
                        if (!this.treasuryPurchases.hasRecords()) {
                            this._addTreasuryPurchase(historicalReferenceYear, assetStartValue);
                        } else {
                            // income from the previous year used to purchase this year's items
                            thisYearTreasuryIncome = this.treasuryPurchases.getChangeInValue(lastYear);
                            this._addTreasuryPurchase(historicalReferenceYear, thisYearTreasuryIncome);
                        }
                        ordinaryIncome += this.treasuryPurchases.totalIncome();
                        break;
                    case 'sp500':
                        const dividendYield = yearData.sp500DividendYield || 0;
                        dividendIncome += assetStartValue * (dividendYield / 100);
                        break;
                    case 'usSmallCap':
                        const smallCapDividendYield = yearData.usSmallCapDividendYield || 0;
                        dividendIncome += assetStartValue * (smallCapDividendYield / 100);
                        break;
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

    // New static factory method
    public static async create(
        startingAmount: number,
        allocations: Allocation[],
        blockNumber: number
    ): Promise<ModelReturns> {
        await ConstantRateReturns.init(); // Ensure CSV is loaded
        await BlockData.init();
        return new ModelReturns(startingAmount, allocations, blockNumber);
    }

    private _initializeAssetValues(allocations: Allocation[]): { [key: string]: number } {
        const assetValues: { [key: string]: number } = {};
        // Calculate the initial dollar value for each allocated asset
        for (const asset of allocations) {
            const startValue = (this.startingAmount * asset.value) / 100;
            assetValues[asset.key] = startValue;
        }
        return assetValues;
    }

    private _addTreasuryPurchase(historicalReferenceYear: number, purchaseAmount: number): void {
        const treasuryYield = ConstantRateReturns.getYield(historicalReferenceYear, 'treasury10Year');
        // income is used to purchase new 10yr Treasury
        this.treasuryPurchases.addRecord(
            historicalReferenceYear,
            purchaseAmount,
            treasuryYield
        );
    }

    private _addBaaCorpPurchase(historicalReferenceYear: number, purchaseAmount: number): void {
        const baaCorpYield = ConstantRateReturns.getYield(historicalReferenceYear, 'baaCorp');
        // income is used to purchase new BAA Corporate Bonds
        this.baaCorpPurchases.addRecord(
            historicalReferenceYear,
            purchaseAmount,
            baaCorpYield
        );
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