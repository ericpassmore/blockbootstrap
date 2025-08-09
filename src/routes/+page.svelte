<script lang="ts">
	import type { PageData } from './$types';
	import { type Allocation } from '$lib/modelReturns';
	import { type Forecast } from '$lib/forecastService';

	// This prop will receive the data returned from our server-side form action
	// entend to include client side
	interface FormData extends PageData {
		success: boolean;
		forecasts: Forecast[];
		startingAmount: number;
		allocations: Allocation[];
		median: number;
		medianSeries: number;
		q1: number;
		q1Series: number;
		q3: number;
		q3Series: number;
		averageCAGR: number;
		error: string;
	}

	import { onDestroy, onMount } from 'svelte';
	import { type ChartOptions, Chart } from 'chart.js/auto'; // Simplified import for vanilla Chart.js

	export let form: FormData;
	let isLoggedIn = false;
	let rebalance = false;
	let inflationAdjusted = false;

	onMount(() => {
		isLoggedIn = !!localStorage.getItem('token');
	});
	let startingAmount: number = form?.startingAmount || 10000;
	// Define the asset classes for allocation
	let allocations = form?.allocations || [
		{ key: 'sp500', label: 'S&P 500', value: 45 },
		{ key: 'usSmallCap', label: 'US Small Cap', value: 10 },
		{ key: 'TBill', label: 'T-Bill', value: 0 },
		{ key: 'treasury10Year', label: '10-Year Treasury', value: 10 },
		{ key: 'baaCorp', label: 'BAA Corporate Bond', value: 10 },
		{ key: 'realEstate', label: 'Real Estate', value: 20 },
		{ key: 'gold', label: 'Gold', value: 5 },
		{ key: 'bitcoin', label: 'Bitcoin', value: 0 }
	];

	// Reactive calculation for the total allocation
	$: totalAllocation = allocations.reduce((sum, asset) => sum + asset.value, 0);
	$: isInvalid = totalAllocation !== 100;

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

	// helper to align colors from css
	function getCSSVar(name: string) {
		// Read value of a CSS variable (e.g., '--legend-incomplete-color')
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	}

	// --- Chart.js Vanilla Implementation ---
	let canvasElement: HTMLCanvasElement;
	let chartInstance: Chart | null = null;

	function selectChartColor(
		blockNumber: number,
		medianBlockNum: number,
		q1BlockNum: number,
		q3BlockNum: number
	) {
		const legendIncomplete = getCSSVar('--legend-incomplete-color');
		const legendMedian = getCSSVar('--legend-median-color');
		const legendQuartile = getCSSVar('--legend-quartile-color');
		const legendComplete = getCSSVar('--legend-complete-color');

		if (blockNumber > 46) {
			return legendIncomplete;
		}
		if (blockNumber === medianBlockNum) {
			return legendMedian;
		}
		if (blockNumber === q1BlockNum || blockNumber === q3BlockNum) {
			return legendQuartile;
		}
		return legendComplete;
	}

	// This reactive block creates, updates, or destroys the chart
	// based on the availability of form results.
	$: if (form?.success && canvasElement) {
		const chartData = {
			// Use labels from the first forecast, assuming they are all the same length
			labels: ['Start', ...form.forecasts[0].results.map((r) => r.year)],
			datasets: form.forecasts.map((forecast, index) => ({
				label: `Block ${forecast.blockNumber}`,
				data: [form.startingAmount, ...forecast.results.map((r) => r.endValue)],
				// series 46 and greater have partial data
				borderColor: selectChartColor(
					forecast.blockNumber,
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
	<div class="instructions">
		<p>
			Define your starting investment and allocate funds across different asset classes. The total
			must equal 100%.
		</p>
		<p class="disclaimer">
			⚠ Any information presented is intended purely for illustrative or entertainment purposes and
			should not be construed as financial advice.
		</p>
	</div>

	<!-- This form now submits data to the 'runForecast' action on the server -->
	<form method="POST" id="main-form" action="?/runForecast">
		<div class="form-group starting-amount-group">
			<label for="startingAmount">Starting Investment ($)</label>
			<input
				type="number"
				id="startingAmount"
				name="startingAmount"
				bind:value={startingAmount}
				min="1"
			/>
		</div>

		<h2>Asset Allocation (%)</h2>

		{#each allocations as asset (asset.key)}
			<div class="form-group allocation-item">
				<label for="{asset.key}-range">{asset.label}</label>
				<input type="range" id="{asset.key}-range" bind:value={asset.value} min="0" max="100" />
				<input type="number" id="{asset.key}-number" bind:value={asset.value} min="0" max="100" />
			</div>
		{/each}

		<!-- Hidden inputs to pass complex data to the server -->
		<input type="hidden" name="allocations" value={JSON.stringify(allocations)} />

		<div class="total-summary" class:invalid={isInvalid}>
			<strong>Total Allocation: {totalAllocation}%</strong>
			{#if isInvalid}
				<span class="error-message"> (Must be 100%)</span>
			{/if}
		</div>

		{#if isLoggedIn}
			<div class="info-block advanced-options">
				<h3>Advanced Options</h3>
				<div class="checkbox-container">
					<div class="checkbox-item">
						<div class="checkbox-label-row">
							<input type="checkbox" id="rebalance" name="rebalance" bind:checked={rebalance} />
							<label for="rebalance">Rebalance</label>
						</div>
						<small class="tooltip">annual reallocation</small>
					</div>
					<div class="checkbox-item">
						<div class="checkbox-label-row">
							<input
								type="checkbox"
								id="inflationAdjusted"
								name="inflationAdjusted"
								bind:checked={inflationAdjusted}
							/>
							<label for="inflationAdjusted">Inflation Adjusted</label>
						</div>
						<small class="tooltip">adjust returns by inflation</small>
					</div>
				</div>
			</div>
		{/if}

		<button type="submit" disabled={isInvalid}>Run Forecast</button>
	</form>

	<!-- Results Section: This will only render when the form action returns data -->
	{#if form?.success}
		<div class="results-container">
			<h3>Your Results</h3>
			<p>Here’s a summary of your allocation and projections based on the inputs above:</p>
			<div class="summary">
				<p><strong>Starting Amt:</strong> {currencyFormatter.format(form.startingAmount)}</p>
				<p><strong>Projected Est:</strong> {currencyFormatter.format(form.median)}</p>
				<p><strong>Conservative Est:</strong> {currencyFormatter.format(form.q1)}</p>
				<p><strong>Top Est:</strong> {currencyFormatter.format(form.q3)}</p>
				<p>
					<strong>Simple Avg CAGR:</strong>
					{form.averageCAGR.toFixed(2)}% <em>across all scenarios</em>
				</p>
			</div>
			<p class="disclaimer">
				Projected is Median. Conservative is 1st Quartile. Top is 3rd Quartile
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
						<th>Taxes</th>
						<th>CAGR</th>
					</tr>
				</thead>
				<tbody>
					{#each form.forecasts as blockResult}
						<tr>
							<td>{blockResult.blockNumber}</td>
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
