export interface PercentileSeries {
	q1Series: number[];
	medianSeries: number[];
	q3Series: number[];
}

export function sameSeries(left: number[], right: number[]): boolean {
	return left.length === right.length && left.every((block, index) => block === right[index]);
}

/** One path can represent multiple percentiles when few scenarios are available. */
export function forecastLabels(blocks: number[], percentiles: PercentileSeries): string[] {
	const labels: string[] = [];
	if (sameSeries(blocks, percentiles.q1Series)) labels.push('Conservative estimate');
	if (sameSeries(blocks, percentiles.medianSeries)) labels.push('Median estimate');
	if (sameSeries(blocks, percentiles.q3Series)) labels.push('Optimistic estimate');
	return labels;
}
