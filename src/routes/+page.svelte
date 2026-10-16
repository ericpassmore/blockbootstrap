<script lang="ts">
	import type { FormData } from '$lib/types/formData';
	import PortfolioForm from '$lib/component/PortfolioForm.svelte';
	import Instructions from '$lib/component/Instructions.svelte';
	import { forecastLabels, sameSeries } from '$lib/forecastDisplay';

	import { onDestroy, onMount } from 'svelte';
	import { type ChartOptions, Chart } from 'chart.js/auto'; // Simplified import for vanilla Chart.js

	export let form: FormData;
	// need to set false otherwise login break and page rendering stops
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let isLoggedIn = false;

	onMount(() => {
		isLoggedIn = !!localStorage.getItem('token');
	});

	// Handle form submission
	function handleFormSubmit() {
		// Let the form submit naturally to the server action
		// The scrollPastForm will be called after results are received
	}

	// Scroll down automatically
	function scrollPastForm() {
		const formEl = document.getElementById('main-form');
		if (!formEl) return;

		// Measure offset from top to bottom of the form
		const offset = formEl.offsetTop + formEl.offsetHeight;

		// Scroll by that amount smoothly
		window.scrollBy({
			top: offset,
			behavior: 'smooth'
		});
	}

	// A helper to format numbers as US dollars
	const currencyFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	});
	const millionsCurrencyFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	// Format large currency values in millions if exceeding 10,000,000
	function formatLargeCurrency(value: number): string {
		if (value > 10000000) {
			return `${millionsCurrencyFormatter.format(value / 1000000)}M`;
		}
		return currencyFormatter.format(value);
	}

	// helper to align colors from css
	function getCSSVar(name: string) {
		// Read value of a CSS variable (e.g., '--legend-incomplete-color')
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	}

	// --- Chart.js Vanilla Implementation ---
	let canvasElement: HTMLCanvasElement;
	let chartInstance: Chart | null = null;

	function selectChartColor(
		blockNumber: number[],
		medianBlockNum: number[],
		q1BlockNum: number[],
		q3BlockNum: number[]
	) {
		const legendMedian = getCSSVar('--legend-median-color');
		const legendQuartile = getCSSVar('--legend-quartile-color');
		const legendComplete = getCSSVar('--legend-complete-color');

		if (sameSeries(blockNumber, medianBlockNum)) return legendMedian;
		if (sameSeries(blockNumber, q1BlockNum) || sameSeries(blockNumber, q3BlockNum))
			return legendQuartile;
		return legendComplete;
	}

	// This reactive block creates, updates, or destroys the chart
	// based on the availability of form results.
	$: if (form?.success && canvasElement && form.forecasts?.length > 0) {
		const firstForecast = form.forecasts[0];

		const chartData = {
			// Use labels from the first forecast, assuming they are all the same length
			labels: ['Start', ...firstForecast.results.map((r) => r.year)],
			datasets: form.forecasts.map((forecast) => ({
				label: `Blocks ${forecast.blockNumbers.join(', ')}`,
				data: [form.startingAmount, ...forecast.results.map((r) => r.endValue)],
				// series 46 and greater have partial data
				borderColor: selectChartColor(
					forecast.blockNumbers, // Use the first block number for color selection
					form.medianSeries,
					form.q1Series,
					form.q3Series
				),
				borderWidth: 2,
				backgroundColor: 'transparent',
				fill: false, // 'fill: false' is better for comparing multiple lines
				tension: 0.1
			}))
		};

		const chartOptions: ChartOptions<'line'> = {
			responsive: true,
			maintainAspectRatio: true,
			aspectRatio: 1.5,
			plugins: {
				legend: {
					display: false
				}
			},
			scales: {
				y: {
					ticks: {
						callback: (value) => currencyFormatter.format(value as number)
					},
					beginAtZero: true
				}
			}
		};

		if (chartInstance) {
			// If chart already exists, just update its data and options
			chartInstance.data = chartData;
			chartInstance.options = chartOptions;
			chartInstance.update();
		} else {
			// Otherwise, create a new chart instance on our canvas
			chartInstance = new Chart(canvasElement, {
				type: 'line',
				data: chartData,
				options: chartOptions
			});
		}
		scrollPastForm();
	}

	// Ensure the chart instance is destroyed when the component is unmounted to prevent memory leaks
	onDestroy(() => {
		chartInstance?.destroy();
	});
</script>

<div class="form-container">
	<h1>Create Your Portfolio</h1>
	<Instructions />

	<!-- Use the extracted PortfolioForm component -->
	<PortfolioForm {form} onSubmit={handleFormSubmit} />

	<!-- Results Section: This will only render when the form action returns data -->
	{#if form?.success}
		<div class="results-container">
			<h3>Your Results</h3>
			<p>Here’s a summary of your allocation and projections based on the inputs above:</p>
			<div class="summary">
				<p><strong>Starting Amt:</strong> {formatLargeCurrency(form.startingAmount)}</p>
				<p><strong>Likley Est:</strong> {formatLargeCurrency(form.median)}</p>
				<p><strong>Conservative Est:</strong> {formatLargeCurrency(form.q1)}</p>
				<p><strong>Optimistic Est:</strong> {formatLargeCurrency(form.q3)}</p>
				<p>
					<strong>Average Annual Growth Rate:</strong>
					{form?.averageCAGR != null ? form.averageCAGR.toFixed(2) : '0.00'}%
					<em>across all scenarios</em>
				</p>
				<p>
					<strong>Expected fluctuation in returns:</strong>
					{formatLargeCurrency(form.finalValueStdDev)}
				</p>
			</div>
			<p class="disclaimer">
				Likely is Median. Conservative is 1st Quartile. Optimistic is 3rd Quartile.
			</p>
			<div class="chart-container">
				<h3>Portfolio Growth Over Time</h3>
				<div id="customLegend">
					<div class="legend-item">
						<span class="legend-box complete"></span>
						<span>Complete Results</span>
					</div>
					<div class="legend-item">
						<span class="legend-line incomplete"></span>
						<span>Incomplete Results</span>
					</div>
					<div class="legend-item">
						<span class="legend-line quartile"></span>
						<span>First and Third Quartile Results</span>
					</div>
					<div class="legend-item">
						<span class="legend-line median"></span>
						<span>Median Results</span>
					</div>
				</div>
				<canvas bind:this={canvasElement}></canvas>
			</div>
			<table>
				<thead>
					<tr>
						<th>Bock Series</th>
						<th>End Value</th>
						<th>Taxes (nominal)</th>
						<th>CAGR</th>
					</tr>
				</thead>
				<tbody>
					{#each form.forecasts as blockResult (blockResult.blockNumbers.join('-'))}
						<tr
							class:q1-row={sameSeries(blockResult.blockNumbers, form.q1Series)}
							class:median-row={sameSeries(blockResult.blockNumbers, form.medianSeries)}
							class:q3-row={sameSeries(blockResult.blockNumbers, form.q3Series)}
						>
							<td>
								{blockResult.blockNumbers.join(', ')}
								{#each forecastLabels(blockResult.blockNumbers, form) as label (label)}
									<span class="label-tooltip" title={label}>
										<span class="material-symbols-outlined">info</span>
										<small>{label}</small>
									</span>
								{/each}
							</td>
							<td>{currencyFormatter.format(blockResult.finalValue)}</td>
							<td>{currencyFormatter.format(blockResult.taxes)}</td>
							<td class:positive={blockResult.cagr >= 0} class:negative={blockResult.cagr < 0}>
								{blockResult.cagr.toFixed(2)}%
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else if form?.error}
		<p class="form-error"><strong>Error:</strong> {form.error}</p>
	{/if}
</div>
