import { BlockData, type MarketData } from '$lib/block';
import { ModelReturns, type Allocation, type AnnualReturn } from '$lib/modelReturns';
import { ForecastOptions } from '$lib/forecastOptions';
import { ConstantRateReturns } from '$lib/constantRateReturns';

interface PercentileResult {
	value: number;
	seriesNumbers: number[];
}

interface ForecastSummary {
	blockNumbers: number[]; // Changed from blockNumber to blockNumbers
	taxes: number;
	finalValue: number;
	cagr: number;
}

export interface Forecast extends ForecastSummary {
	results: AnnualReturn[];
}

export interface StatisticsResult {
	medianResult: PercentileResult;
	q1Result: PercentileResult;
	q3Result: PercentileResult;
}

/**
 * A service class to run a full portfolio forecast across all historical blocks,
 * calculate summary statistics, and prepare the results for display.
 */
export class ForecastService {
	public forecasts: Forecast[];
	public startingAmount: number;
	public median: number;
	public medianSeries: number[];
	public q1: number;
	public q1Series: number[];
	public q3: number;
	public q3Series: number[];
	public averageCAGR: number;
	public finalValueStdDev: number;
	public scenarioCount: number;

	constructor(
		startingAmount: number,
		forecasts: Forecast[],
		statistics: StatisticsResult,
		summaries: ForecastSummary[] = forecasts
	) {
		this.startingAmount = startingAmount;

		this.median = statistics.medianResult.value;
		this.medianSeries = statistics.medianResult.seriesNumbers;
		this.q1 = statistics.q1Result.value;
		this.q1Series = statistics.q1Result.seriesNumbers;
		this.q3 = statistics.q3Result.value;
		this.q3Series = statistics.q3Result.seriesNumbers;

		this.averageCAGR = this.simpleArithmaticMean(summaries.map((f) => f.cagr));
		this.finalValueStdDev = this.standardDeviation(summaries.map((f) => f.finalValue));
		this.scenarioCount = summaries.length;

		this.forecasts = this.reorderForecasts(forecasts, statistics);
	}

	// NEW factory method to get around async issues
	public static async create(
		startingAmount: number,
		allocations: Allocation[],
		options: ForecastOptions
	): Promise<ForecastService> {
		const instance = new ForecastService(startingAmount, [], {
			medianResult: { value: 0, seriesNumbers: [0] },
			q1Result: { value: 0, seriesNumbers: [0] },
			q3Result: { value: 0, seriesNumbers: [0] }
		});

		const allForecasts = await instance.buildAllForecasts(allocations, options);
		const statistics = instance.calculateStatistics(allForecasts);
		const currentYear = new Date().getFullYear();
		const displayed = instance
			.reorderForecasts(allForecasts, statistics)
			.map((summary): Forecast => {
				const model = new ModelReturns(startingAmount, allocations, summary.blockNumbers, options);
				for (const result of model.results) result.year += currentYear;
				return { ...summary, results: model.results };
			});

		return new ForecastService(startingAmount, displayed, statistics, allForecasts);
	}

	private async buildAllForecasts(
		allocations: Allocation[],
		options: ForecastOptions
	): Promise<ForecastSummary[]> {
		const allForecasts: ForecastSummary[] = [];
		await Promise.all([BlockData.init(), ConstantRateReturns.init()]);
		if (
			!options.cryptoUseHistoricalPrice &&
			allocations.some((asset) => asset.value > 0 && asset.key.startsWith('crypto:'))
		) {
			const [{ db }, { cryptoAssetClass }, { powerLawFormula }] = await Promise.all([
				import('$lib/server/db'),
				import('$lib/server/cryptoAssetClass'),
				import('$lib/server/powerLawFormula')
			]);
			await Promise.all([cryptoAssetClass.loadAssets(db), powerLawFormula.loadFits(db)]);
		}
		const requiredData: (keyof MarketData)[] = allocations
			.filter((asset) => asset.value > 0)
			.map((asset) => asset.key);
		if (options.inflationAdjusted) requiredData.push('inflation');
		if (requiredData.includes('sp500')) requiredData.push('sp500DividendYield');
		const eligibleBlocks = BlockData.getEligibleBlockNumbers(requiredData).filter(
			(block) => !options.includeMoreIndexes || block >= 19
		);
		const blocksPerForecast = options.returnWindow / 10;
		if (eligibleBlocks.length < blocksPerForecast) {
			throw new Error('Not enough complete historical blocks for the selected assets and window.');
		}
		for (const blockNumbers of this.blockCombinations(eligibleBlocks, blocksPerForecast)) {
			const model = new ModelReturns(
				this.startingAmount,
				allocations,
				blockNumbers,
				options,
				false
			);
			allForecasts.push({
				blockNumbers: blockNumbers,
				taxes: model.totalTaxes,
				finalValue: model.finalValue,
				cagr: model.calculateCAGR() * 100
			});
		}
		return allForecasts;
	}

	/** Yield existing chronological combinations without retaining the entire combination list. */
	private *blockCombinations(
		blocks: number[],
		count: number,
		start = 0,
		prefix: number[] = []
	): Generator<number[]> {
		if (count === 0) {
			yield prefix;
			return;
		}
		for (let index = start; index <= blocks.length - count; index++) {
			yield* this.blockCombinations(blocks, count - 1, index + 1, [...prefix, blocks[index]]);
		}
	}

	private calculateStatistics(allForecasts: ForecastSummary[]): StatisticsResult {
		const sortedForecasts = [...allForecasts].sort((a, b) => a.finalValue - b.finalValue);
		const medianResult = this.getPercentileWithSeries(sortedForecasts, 0.5);
		const q1Result = this.getPercentileWithSeries(sortedForecasts, 0.25);
		const q3Result = this.getPercentileWithSeries(sortedForecasts, 0.75);
		return { medianResult, q1Result, q3Result };
	}

	private getPercentileWithSeries(
		sortedForecasts: ForecastSummary[],
		percentile: number
	): PercentileResult {
		const pos = (sortedForecasts.length - 1) * percentile;
		const index = Math.round(pos);
		const result = sortedForecasts[index];
		return { value: result.finalValue, seriesNumbers: result.blockNumbers };
	}

	private simpleArithmaticMean(values: number[]): number {
		if (values.length === 0) return 0;
		const sum = values.reduce((acc, val) => acc + val, 0);
		return sum / values.length;
	}

	private standardDeviation(values: number[]): number {
		const n = values.length;
		if (n === 0) return 0;
		const mean = this.simpleArithmaticMean(values);
		const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
		return Math.sqrt(variance);
	}

	private reorderForecasts<T extends ForecastSummary>(
		allForecasts: T[],
		statistics: StatisticsResult
	): T[] {
		const key = (blocks: number[]) => blocks.join(',');
		const remaining = new Map(
			allForecasts.map((forecast) => [key(forecast.blockNumbers), forecast])
		);
		const selected: T[] = [];
		for (const result of [statistics.q1Result, statistics.medianResult, statistics.q3Result]) {
			const sequence = key(result.seriesNumbers);
			const forecast = remaining.get(sequence);
			if (forecast) {
				selected.push(forecast);
				remaining.delete(sequence);
			}
		}
		const regular = [...remaining.values()].sort((a, b) => a.finalValue - b.finalValue);
		const available = 50 - selected.length;
		if (regular.length <= available) return [...selected, ...regular];
		for (let index = 0; index < available; index++) {
			selected.push(regular[Math.round((index * (regular.length - 1)) / (available - 1))]);
		}
		return selected;
	}
}
