import type { MarketData } from '$lib/block';
import { BlockData } from '$lib/block';
import { Taxes } from '$lib/taxes';
import { AssetReturns } from '$lib/assetReturns';
import { ConstantRateReturns } from '$lib/constantRateReturns';
import { ForecastOptions } from '$lib/forecastOptions';
import { powerLawReturnsFromDates } from './server/powerLawReturnsFromDates';
type IncomeAssetKey = Extract<keyof MarketData, 'treasury10Year' | 'baaCorp'>;

/**
 * Defines the structure for a user's portfolio allocation.
 * The `key` is type-safe and must correspond to an asset in the MarketData interface.
 */
export interface Allocation {
	key: keyof Omit<
		MarketData,
		'year' | 'inflation' | 'sp500DividendYield' | 'usSmallCapDividendYield'
	>;
	label: string;
	value: number; // The percentage allocation
}

export interface CryptoAllocation {
	symbol: string;
	fullName: string;
	allocationPercent: number;
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
		blockNumbers: number[],
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

		let currentPortfolioValue = startingAmount;
		let currentYearOffset = 0;
		let blockNumberIdx = 0;

		for (const blockNumber of blockNumbers) {
			const block = BlockData.getSeries(blockNumber);
			if (!block || block.length === 0) {
				console.warn(`Historical data for Block ${blockNumber} could not be found. Skipping.`);
				continue;
			}

			let assetValues: AssetValues = this._initializeAssetValues(
				allocations,
				currentPortfolioValue
			);

			for (const yearData of block) {
				const startOfYearValue = currentPortfolioValue;
				const historicalReferenceYear = BlockData.getHistoricalYear(blockNumber, yearData.year);
				const lastYear = historicalReferenceYear - 1;
				let ordinaryIncome = 0;
				let dividendIncome = 0;
				let endOfYearValue = 0;
				let capitalGains = 0;
				let goldCapitalGains = 0;

				for (const assetKey in assetValues) {
					const key = assetKey as keyof typeof assetValues;
					const assetStartValue = assetValues[key];
					let assetReturnPercentage =
						typeof key === 'string' && key in yearData
							? (yearData[key as keyof MarketData] as number)
							: 0;

					// if not cryptoUseHistoricalPrice we switch to powerlaw
					// this will update and overwrite  the assetReturnPercentage
					if (
						typeof key === 'string' &&
						key.startsWith('crypto:') &&
						!options.cryptoUseHistoricalPrice
					) {
						// Use power law returns for crypto assets if option is false
						assetReturnPercentage = this._cryptoPowerLawReturns(key, blockNumberIdx, yearData.year);
					}
					if (options.inflationAdjusted) {
						const inflation = yearData.inflation || 0;
						// exact formula: (1 + nominal) / (1 + inflation) - 1
						assetReturnPercentage =
							((1 + assetReturnPercentage / 100) / (1 + inflation / 100) - 1) * 100;
					}

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
							dividendIncome += assetStartValue * ((yearData.sp500DividendYield || 0) / 100);
							break;
						case 'usSmallCap':
							dividendIncome += assetStartValue * ((yearData.usSmallCapDividendYield || 0) / 100);
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
					capitalGains = 0;
					goldCapitalGains = 0;
				}

				const taxes = this.taxModel.calculateTaxes(
					ordinaryIncome,
					dividendIncome + capitalGains,
					goldCapitalGains
				);

				const growth = endOfYearValue - startOfYearValue;

				const endOfYearPercentageAllocations: Allocation[] = allocations.map((asset) => ({
					...asset,
					value: endOfYearValue > 0 ? (assetValues[asset.key] / endOfYearValue) * 100 : 0
				}));

				this.results.push({
					year: yearData.year + currentYearOffset, // Adjust year for concatenated blocks
					startValue: startOfYearValue,
					endValue: endOfYearValue,
					growth: growth,
					taxes: taxes,
					percentageAllocations: endOfYearPercentageAllocations
				});

				currentPortfolioValue = Object.values(assetValues).reduce((sum, value) => sum + value, 0);
			}
			currentYearOffset += block.length; // Increment year offset for next block
			blockNumberIdx++; // Increment to track position in the array of blocks
		}
		this.finalValue = currentPortfolioValue;
	}

	public static async create(
		startingAmount: number,
		allocations: Allocation[],
		blockNumbers: number[],
		options: ForecastOptions
	): Promise<ModelReturns> {
		await ConstantRateReturns.init();
		await BlockData.init();
		return new ModelReturns(startingAmount, allocations, blockNumbers, options);
	}

	/**
	 * Calculates the weighted power law return for a set of cryptocurrency allocations
	 * based on the current year adjusted by block number and year index.
	 *
	 * Uses the `powerLawReturnsFromDates` utility to get the percentage return for each crypto symbol.
	 * If no return is found, defaults to 1 (100% return).
	 *
	 * @param assetName - Name of the asset.
	 * @param blockNumber - The block number offset used to adjust the year for return calculation.
	 * @param yearIndex - The year index within the block to adjust the year for return calculation.
	 * @returns The return for this asset
	 */
	private _cryptoPowerLawReturns(
		assetName: string,
		blockNumber: number,
		yearIndex: number
	): number {
		const symbol = assetName.replace('crypto:', '').toUpperCase();
		const powerLawReturn = powerLawReturnsFromDates.percentageReturn(
			symbol,
			new Date().getFullYear() + blockNumber + yearIndex
		);
		return powerLawReturn === undefined ? 0 : powerLawReturn;
	}

	private _initializeAssetValues(
		allocations: Allocation[],
		currentPortfolioValue: number
	): AssetValues {
		const assetValues: AssetValues = {};
		for (const asset of allocations) {
			const startValue = (currentPortfolioValue * asset.value) / 100;
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
		assetKey: IncomeAssetKey,
		assetStartValue: number,
		historicalReferenceYear: number,
		lastYear: number
	): number {
		const tracker = this.incomeAssetTrackers.get(assetKey);
		if (!tracker) return 0; // Should not happen with correct setup

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
			tracker.assetKey as IncomeAssetKey
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
