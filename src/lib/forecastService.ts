import { BlockData } from '$lib/block';
import { ModelReturns, type Allocation } from '$lib/modelReturns';
import { ForecastOptions } from '$lib/forecastOptions';

interface PercentileResult {
	value: number;
	seriesNumbers: number[];
}

export interface Forecast {
	blockNumbers: number[]; // Changed from blockNumber to blockNumbers
	results: any[]; // YearlyReturn[]
	taxes: number;
	finalValue: number;
	cagr: number;
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

	constructor(startingAmount: number, forecasts: Forecast[], statistics: StatisticsResult) {
		this.startingAmount = startingAmount;

		this.median = statistics.medianResult.value;
		this.medianSeries = statistics.medianResult.seriesNumbers;
		this.q1 = statistics.q1Result.value;
		this.q1Series = statistics.q1Result.seriesNumbers;
		this.q3 = statistics.q3Result.value;
		this.q3Series = statistics.q3Result.seriesNumbers;

		this.averageCAGR = this.simpleArithmaticMean(forecasts.map((f) => f.cagr));
		this.finalValueStdDev = this.standardDeviation(forecasts.map((f) => f.finalValue));

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

		return new ForecastService(startingAmount, allForecasts, statistics);
	}

	private async buildAllForecasts(
		allocations: Allocation[],
		options: ForecastOptions
	): Promise<Forecast[]> {
		const allForecasts: Forecast[] = [];
		await BlockData.init();
		const excludeIncompleteBlocks = true;
		const numberOfBlocks = BlockData.getAllData(excludeIncompleteBlocks).size;
		let blockCombinations: number[][] = [];

		if (options.returnWindow === 10) {
			for (let i = 1; i <= numberOfBlocks; i++) {
				blockCombinations.push([i]);
			}
		} else if (options.returnWindow === 20) {
			for (let i = 1; i <= numberOfBlocks; i++) {
				for (let j = i + 1; j <= numberOfBlocks; j++) {
					blockCombinations.push([i, j]);
				}
			}
		} else if (options.returnWindow === 30) {
			for (let i = 1; i <= numberOfBlocks; i++) {
				for (let j = i + 1; j <= numberOfBlocks; j++) {
					for (let k = j + 1; k <= numberOfBlocks; k++) {
						blockCombinations.push([i, j, k]);
					}
				}
			}
		}
		for (const blockNumbers of blockCombinations) {
			const model = await ModelReturns.create(
				this.startingAmount,
				allocations,
				blockNumbers,
				options
			);
			const currentYear = new Date().getFullYear();
			let taxes = 0;
			for (const result of model.results) {
				result.year = result.year + currentYear;
				taxes += result.taxes;
			}
			allForecasts.push({
				blockNumbers: blockNumbers,
				results: model.results,
				taxes: taxes,
				finalValue: model.finalValue,
				cagr: model.calculateCAGR() * 100
			});
		}
		return allForecasts;
	}

	private arraysEqual(a: number[], b: number[]): boolean {
		if (a.length !== b.length) return false;
		return a.every((val, i) => val === b[i]);
	}

	private calculateStatistics(allForecasts: Forecast[]): StatisticsResult {
		const sortedForecasts = [...allForecasts].sort((a, b) => a.finalValue - b.finalValue);
		const medianResult = this.getPercentileWithSeries(sortedForecasts, 0.5);
		const q1Result = this.getPercentileWithSeries(sortedForecasts, 0.25);
		const q3Result = this.getPercentileWithSeries(sortedForecasts, 0.75);
		return { medianResult, q1Result, q3Result };
	}

	private getPercentileWithSeries(
		sortedForecasts: Forecast[],
		percentile: number
	): PercentileResult {
		const pos = (sortedForecasts.length - 1) * percentile;
		const index = Math.round(pos);
		const result = sortedForecasts[index];
		return { value: result.finalValue, seriesNumbers: result.blockNumbers };
	}

	private simpleArithmaticMean(values: number[]): number {
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

	private reorderForecasts(allForecasts: Forecast[], statistics: StatisticsResult): Forecast[] {
		const specialSeriesNumbers = new Set([
			statistics.q1Result.seriesNumbers,
			statistics.medianResult.seriesNumbers,
			statistics.q3Result.seriesNumbers
		]);
		const regularForecasts = allForecasts.filter(
			(f) => ![...specialSeriesNumbers].some((special) => this.arraysEqual(f.blockNumbers, special))
		);
		const q1Forecast = allForecasts.find((f) =>
			this.arraysEqual(f.blockNumbers, statistics.q1Result.seriesNumbers)
		);
		const medianForecast = allForecasts.find((f) =>
			this.arraysEqual(f.blockNumbers, statistics.medianResult.seriesNumbers)
		);
		const q3Forecast = allForecasts.find((f) =>
			this.arraysEqual(f.blockNumbers, statistics.q3Result.seriesNumbers)
		);
		const appendedSeries = new Set();
		const firstForecasts: Forecast[] = [];

		if (q1Forecast) {
			firstForecasts.push(q1Forecast);
			appendedSeries.add(q1Forecast.blockNumbers[0]);
		}
		if (medianForecast && !appendedSeries.has(medianForecast.blockNumbers[0])) {
			firstForecasts.push(medianForecast);
			appendedSeries.add(medianForecast.blockNumbers[0]);
		}
		if (q3Forecast && !appendedSeries.has(q3Forecast.blockNumbers[0])) {
			firstForecasts.push(q3Forecast);
		}
		let finalRegularForecasts = regularForecasts;

		// Thin forecasts if there are more than 50 regular forecasts
		if (regularForecasts.length > 50) {
			const sortedRegularForecasts = [...regularForecasts].sort(
				(a, b) => a.finalValue - b.finalValue
			);
			const interval = Math.floor(sortedRegularForecasts.length / (50 - firstForecasts.length)); // Adjust target count for already included special forecasts
			finalRegularForecasts = [];
			for (let i = 0; i < sortedRegularForecasts.length; i += interval) {
				if (finalRegularForecasts.length < 50 - firstForecasts.length) {
					finalRegularForecasts.push(sortedRegularForecasts[i]);
				} else {
					break;
				}
			}
		}

		return [...firstForecasts, ...finalRegularForecasts];
	}
}
