import { blockData } from '$lib/block';
import { ModelReturns, type Allocation } from '$lib/modelReturns';

interface PercentileResult {
	value: number;
	seriesNumber: number;
}

interface Forecast {
	blockNumber: number;
	results: any[]; // YearlyReturn[]
	taxes: number;
	finalValue: number;
	cagr: number;
}

/**
 * A service class to run a full portfolio forecast across all historical blocks,
 * calculate summary statistics, and prepare the results for display.
 */
export class ForecastService {
	public forecasts: Forecast[];
	public startingAmount: number;
	public median: number;
	public medianSeries: number;
	public q1: number;
	public q1Series: number;
	public q3: number;
	public q3Series: number;
    public averageCAGR: number;

	constructor(startingAmount: number, allocations: Allocation[]) {
		this.startingAmount = startingAmount;

		const allForecasts = this.buildAllForecasts(allocations);
		const statistics = this.calculateStatistics(allForecasts);

		this.median = statistics.medianResult.value;
		this.medianSeries = statistics.medianResult.seriesNumber;
		this.q1 = statistics.q1Result.value;
		this.q1Series = statistics.q1Result.seriesNumber;
		this.q3 = statistics.q3Result.value;
		this.q3Series = statistics.q3Result.seriesNumber;

        this.averageCAGR = this.simpleArithmaticMean(allForecasts.map(f => f.cagr));

		this.forecasts = this.reorderForecasts(allForecasts, statistics);
	}

	private buildAllForecasts(allocations: Allocation[]): Forecast[] {
		const allForecasts: Forecast[] = [];
		const numberOfBlocks = blockData.getAllData().size;

		for (let i = 1; i <= numberOfBlocks; i++) {
			const model = new ModelReturns(this.startingAmount, allocations, i);
			const currentYear = new Date().getFullYear();
			let taxes = 0;
			for (const result of model.results) {
				result.year = result.year + currentYear;
				taxes += result.taxes;
			}
			allForecasts.push({
				blockNumber: i,
				results: model.results,
				taxes: taxes,
				finalValue: model.finalValue,
				cagr: model.calculateCAGR() * 100
			});
		}
		return allForecasts;
	}

	private calculateStatistics(allForecasts: Forecast[]) {
		const sortedForecasts = [...allForecasts].sort((a, b) => a.finalValue - b.finalValue);
		const medianResult = this.getPercentileWithSeries(sortedForecasts, 0.5);
		const q1Result = this.getPercentileWithSeries(sortedForecasts, 0.25);
		const q3Result = this.getPercentileWithSeries(sortedForecasts, 0.75);
		return { medianResult, q1Result, q3Result };
	}

	private getPercentileWithSeries(sortedForecasts: Forecast[], percentile: number): PercentileResult {
		const pos = (sortedForecasts.length - 1) * percentile;
		const index = Math.round(pos);
		const result = sortedForecasts[index];
		return { value: result.finalValue, seriesNumber: result.blockNumber };
	}

    private simpleArithmaticMean(values: number[]): number {
		const sum = values.reduce((acc, val) => acc + val, 0);
		return sum / values.length
    }

	private reorderForecasts(allForecasts: Forecast[], statistics: ReturnType<typeof this.calculateStatistics>): Forecast[] {
		const specialSeriesNumbers = new Set([statistics.q1Result.seriesNumber, statistics.medianResult.seriesNumber, statistics.q3Result.seriesNumber]);
		const regularForecasts = allForecasts.filter((f) => !specialSeriesNumbers.has(f.blockNumber));
		const q1Forecast = allForecasts.find((f) => f.blockNumber === statistics.q1Result.seriesNumber);
		const medianForecast = allForecasts.find((f) => f.blockNumber === statistics.medianResult.seriesNumber);
		const q3Forecast = allForecasts.find((f) => f.blockNumber === statistics.q3Result.seriesNumber);
		const appendedSeries = new Set();
        const firstForecasts: Forecast[] = [];

		if (q1Forecast) { firstForecasts.push(q1Forecast); appendedSeries.add(q1Forecast.blockNumber); }
		if (medianForecast && !appendedSeries.has(medianForecast.blockNumber)) { firstForecasts.push(medianForecast); appendedSeries.add(medianForecast.blockNumber); }
		if (q3Forecast && !appendedSeries.has(q3Forecast.blockNumber)) { firstForecasts.push(q3Forecast); }
		return [...firstForecasts, ...regularForecasts];
	}
}