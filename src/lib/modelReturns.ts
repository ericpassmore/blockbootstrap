import type { MarketData } from '$lib/block';
import { BlockData } from '$lib/block';
import { Taxes } from '$lib/taxes';
import { AssetReturns } from '$lib/assetReturns';
import { ConstantRateReturns } from '$lib/constantRateReturns';
import { ForecastOptions } from '$lib/forecastOptions';

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

export type AssetValues = { [key: string]: number };

/**
 * A class to model portfolio returns over a historical block of data.
 */
export class ModelReturns {
	public results: AnnualReturn[] = [];
	public finalValue: number;
	public startingAmount: number;
	private taxModel: Taxes;
	private assetCostBasis: AssetValues = {};
	private incomeAssetTrackers: Map<string, AssetReturns> = new Map();

	/**
	 * Calculates the portfolio's performance year-over-year based on a starting amount,
	 * user-defined allocations, and a historical data block.
	 * @param startingAmount The initial investment amount.
	 * @param allocations An array defining the portfolio allocation percentages.
	 * @param blockNumber The block number associated with the data
	 */
	constructor(
		startingAmount: number,
		allocations: Allocation[],
		blockNumber: number,
		options: ForecastOptions
	) {
		this.startingAmount = startingAmount;
		this.taxModel = new Taxes();
		this.finalValue = 0;
		this.incomeAssetTrackers.set(
			'treasury10Year',
			new AssetReturns('treasury10Year', '10 Year Treasury')
		);
		this.incomeAssetTrackers.set('baaCorp', new AssetReturns('baaCorp', 'BAA Corporate Bonds'));

		const block = BlockData.getSeries(blockNumber);
		if (!block || block.length === 0) {
			console.warn(`Historical data for Block ${blockNumber} could not be found. Skipping.`);
			return;
		}

		// Calculate the initial dollar value for each asset based on the starting amount and allocation percentages.
		let assetValues: AssetValues = this._initializeAssetValues(allocations);

		// This variable tracks the total portfolio value, updated annually through the simulation.
		let currentPortfolioValue = startingAmount;

		for (const yearData of block) {
			const startOfYearValue = currentPortfolioValue;
			// series starts at one not zero so adjust down by 1
			const historicalReferenceYear = BlockData.getHistoricalYear(blockNumber, yearData.year);
			const lastYear = historicalReferenceYear - 1;
			let ordinaryIncome = 0;
			let dividendIncome = 0;
			let endOfYearValue = 0;
			let capitalGains = 0;
			let goldCapitalGains = 0;

			// Calculate end-of-year value for each asset based on its return
			for (const assetKey in assetValues) {
				const key = assetKey as keyof typeof assetValues;
				const assetStartValue = assetValues[key];
				let assetReturnPercentage =
					key in yearData ? (yearData[key as keyof MarketData] as number) : 0;

				if (options.inflationAdjusted) {
					assetReturnPercentage -= yearData.inflation || 0;
				}

				// Identify and sum up different types of income for tax purposes
				switch (key) {
					case 'TBill':
						ordinaryIncome += assetStartValue * (assetReturnPercentage / 100);
						break;
					case 'baaCorp':
					case 'treasury10Year':
						ordinaryIncome += this._processIncomeAsset(
							key,
							assetStartValue,
							historicalReferenceYear,
							lastYear
						);
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

			if (options.rebalance) {
				const rebalanceResult = this._annualRebalance(assetValues, allocations);
				assetValues = rebalanceResult.assetValues;
				capitalGains = rebalanceResult.capitalGains;
				goldCapitalGains = rebalanceResult.goldCapitalGains;
			} else {
                // not really needed makes me feel better
				capitalGains = 0;
                goldCapitalGains = 0;
			}

			// Calculate taxes on the income generated during the year
			const taxes = this.taxModel.calculateTaxes(
                ordinaryIncome, 
                dividendIncome+capitalGains, 
                goldCapitalGains);

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
			currentPortfolioValue = Object.values(assetValues).reduce((sum, value) => sum + value, 0);
		}
		// Set the final value after the loop has completed.
		this.finalValue = currentPortfolioValue;
	}

	// New static factory method
	public static async create(
		startingAmount: number,
		allocations: Allocation[],
		blockNumber: number,
		options: ForecastOptions
	): Promise<ModelReturns> {
		await ConstantRateReturns.init(); // Ensure CSV is loaded
		await BlockData.init();
		return new ModelReturns(startingAmount, allocations, blockNumber, options);
	}

	private _initializeAssetValues(allocations: Allocation[]): AssetValues {
		const assetValues: AssetValues = {};
		// Calculate the initial dollar value for each allocated asset
		for (const asset of allocations) {
			const startValue = (this.startingAmount * asset.value) / 100;
			assetValues[asset.key] = startValue;
			this.assetCostBasis[asset.key] = startValue;
		}
		return assetValues;
	}

	private _annualRebalance(
		yearEndValues: AssetValues,
		targetAllocations: Allocation[]
	): { capitalGains: number; goldCapitalGains: number; assetValues: AssetValues } {
		const totalPortfolioValue = Object.values(yearEndValues).reduce((sum, value) => sum + value, 0);
		let capitalGains = 0;
		let goldCapitalGains = 0;
		let capitalPool = 0;

		const targetAmounts: AssetValues = {};
		for (const allocation of targetAllocations) {
			targetAmounts[allocation.key] = totalPortfolioValue * (allocation.value / 100);
		}

		// First pass: sell oversized positions and calculate capital gains
		for (const assetKey in yearEndValues) {
			if (yearEndValues[assetKey] > targetAmounts[assetKey]) {
				const amountToSell = yearEndValues[assetKey] - targetAmounts[assetKey];
				const originalCostBasis = this.assetCostBasis[assetKey];
				const proportionalCostBasis = (originalCostBasis / yearEndValues[assetKey]) * amountToSell;
				const gain = amountToSell - proportionalCostBasis;

				if (assetKey === 'gold') {
					goldCapitalGains += gain;
				} else {
					capitalGains += gain;
				}

				this.assetCostBasis[assetKey] -= proportionalCostBasis;
				yearEndValues[assetKey] -= amountToSell;
				capitalPool += amountToSell;
			}
		}

		// Second pass: buy undersized positions
		for (const assetKey in yearEndValues) {
			if (yearEndValues[assetKey] < targetAmounts[assetKey]) {
				const amountNeeded = targetAmounts[assetKey] - yearEndValues[assetKey];
				const amountToBuy = Math.min(amountNeeded, capitalPool);

				yearEndValues[assetKey] += amountToBuy;
				this.assetCostBasis[assetKey] = (this.assetCostBasis[assetKey] || 0) + amountToBuy;
				capitalPool -= amountToBuy;
			}
		}

		// If there is any capital left over after rebalancing, it is allocated to T-Bills.
		if (capitalPool > 0) {
			if (!yearEndValues['TBill']) {
				yearEndValues['TBill'] = 0;
				this.assetCostBasis['TBill'] = 0;
			}
			yearEndValues['TBill'] += capitalPool;
			this.assetCostBasis['TBill'] += capitalPool;
		}

		return { capitalGains, goldCapitalGains, assetValues: yearEndValues };
	}

	private _processIncomeAsset(
		assetKey: keyof MarketData,
		assetStartValue: number,
		historicalReferenceYear: number,
		lastYear: number
	): number {
		const tracker = this.incomeAssetTrackers.get(assetKey);
		if (!tracker) return 0;

		if (!tracker.hasRecords()) {
			this._addIncomeAssetPurchase(tracker, historicalReferenceYear, assetStartValue);
			this.assetCostBasis[assetKey] = assetStartValue;
		} else {
			const income = tracker.getChangeInValue(lastYear);
			this._addIncomeAssetPurchase(tracker, historicalReferenceYear, income);
			this.assetCostBasis[assetKey] += income;
		}
		return tracker.totalIncome();
	}

	private _addIncomeAssetPurchase(
		tracker: AssetReturns,
		historicalReferenceYear: number,
		purchaseAmount: number
	): void {
		const assetYield = ConstantRateReturns.getYield(
			historicalReferenceYear,
			tracker.assetKey as keyof MarketData
		);
		tracker.addRecord(historicalReferenceYear, purchaseAmount, assetYield);
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
