<script context="module" lang="ts">
	import type { FormData } from '$lib/types/formData';

	export interface PortfolioFormProps {
		form: FormData;
		onSubmit: (event: Event) => void;
	}
</script>

<script lang="ts">
	export let form: FormData;
	export let onSubmit: (event: Event) => void;

	let rebalance = form?.options?.[0] || false;
	let inflationAdjusted = form?.options?.[1] || false;
	let returnWindow = form?.options?.[2] || 10;
	let cryptousehistoricalprices = form?.options?.[3] || false;

	let startingAmount: number = form?.startingAmount || 10000;
	let startingAmountFormatted: string = startingAmount.toLocaleString('en-US');

	function formatNumberWithCommas(value: number): string {
		return value.toLocaleString('en-US');
	}

	function parseNumberFromFormatted(value: string): number {
		const numericString = value.replace(/,/g, '');
		const parsed = parseInt(numericString, 10);
		return isNaN(parsed) ? 0 : parsed;
	}

	function onStartingAmountInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const rawValue = input.value;
		const cleanedValue = rawValue.replace(/[^\d,]/g, '');
		const numericValue = parseNumberFromFormatted(cleanedValue);
		startingAmount = numericValue;
		startingAmountFormatted = formatNumberWithCommas(numericValue);
	}

	let allocations = form?.allocations || [
		{ key: 'sp500', label: 'S&P 500', value: 45 },
		{ key: 'usSmallCap', label: 'US Small Cap', value: 10 },
		{ key: 'TBill', label: 'T-Bill', value: 0 },
		{ key: 'treasury10Year', label: '10-Year Treasury', value: 10 },
		{ key: 'baaCorp', label: 'BAA Corporate Bond', value: 10 },
		{ key: 'realEstate', label: 'Real Estate', value: 20 },
		{ key: 'gold', label: 'Gold', value: 5 },
		{ key: 'crypto:BTC', label: 'Bitcoin', value: 0 }
	];

	$: totalAllocation = allocations.reduce(
		(sum: number, asset: { value: number }) => sum + asset.value,
		0
	);
	$: isInvalid = totalAllocation !== 100;
</script>

<form method="POST" id="main-form" action="?/runForecast" on:submit={onSubmit}>
	<div class="form-group starting-amount-group">
		<label for="startingAmount">Starting Investment ($)</label>
		<input
			type="text"
			id="startingAmount"
			value={startingAmountFormatted}
			on:input={onStartingAmountInput}
			min="1"
		/>
		<input type="hidden" name="startingAmount" value={startingAmount} />
	</div>

	<h2>Asset Allocation (%)</h2>

	{#each allocations as asset (asset.key)}
		<div class="form-group allocation-item">
			<label for="{asset.key}-range">{asset.label}</label>
			<input type="range" id="{asset.key}-range" bind:value={asset.value} min="0" max="100" />
			<input type="number" id="{asset.key}-number" bind:value={asset.value} min="0" max="100" />
		</div>
	{/each}

	<input type="hidden" name="allocations" value={JSON.stringify(allocations)} />
	<input type="hidden" name="returnWindow" value={returnWindow} />

	<div class="total-summary" class:invalid={isInvalid}>
		<strong>Total Allocation: {totalAllocation}%</strong>
		{#if isInvalid}
			<span class="error-message"> (Must be 100%)</span>
		{/if}
	</div>

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
			<div class="checkbox-item">
				<div class="checkbox-label-row">
					<label for="returnWindow">Years</label>
					<div class="radio-group">
						<input
							type="radio"
							id="returnWindow10"
							name="returnWindow"
							value={10}
							bind:group={returnWindow}
						/>
						<label for="returnWindow10">10</label>
						<input
							type="radio"
							id="returnWindow20"
							name="returnWindow"
							value={20}
							bind:group={returnWindow}
						/>
						<label for="returnWindow20">20</label>
						<input
							type="radio"
							id="returnWindow30"
							name="returnWindow"
							value={30}
							bind:group={returnWindow}
						/>
						<label for="returnWindow30">30</label>
					</div>
				</div>
				<small class="tooltip">length of forecast</small>
			</div>
			<div class="checkbox-item">
				<div class="checkbox-label-row">
					<input
						type="checkbox"
						id="cryptousehistoricalprices"
						name="cryptousehistoricalprices"
						bind:checked={cryptousehistoricalprices}
					/>
					<label for="cryptousehistoricalprices">Crypto Use Real Data</label>
				</div>
				<small class="tooltip">switches to historical prices for crypto</small>
			</div>
		</div>
	</div>

	<button type="submit" disabled={isInvalid}>Run Forecast</button>
</form>
