<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Allocation } from '$lib/modelReturns';
	let target: number = 8;
	let cryptoLimit: number = 3;
	let isSubmitting = false;
	let allocations: Allocation[] | null = null;

	let startYear: number = 1988;
	let endYear: number = 2024;
	let returnType: 'nominal' | 'real' = 'nominal';
</script>

<div>
	<h1>Portfolio Builder</h1>
	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ result }) => {
				isSubmitting = false;
				if (result.type === 'success' && result.data) {
					allocations = result.data.data as Allocation[];
				}
			};
		}}
	>
		<div class="form-group allocation-item">
			<label for="target-range">Target Number (1-20):</label>
			<input
				type="range"
				id="target-range"
				name="target"
				min="1"
				max="20"
				bind:value={target}
				required
				style="max-width: 50%;"
			/>
			<input type="number" id="target-number" min="1" max="20" bind:value={target} required />
		</div>

		<div class="form-group allocation-item">
			<label for="cryptoLimit-range">Crypto Limit (0-100):</label>
			<input
				type="range"
				id="cryptoLimit-range"
				name="cryptoLimit"
				min="0"
				max="100"
				bind:value={cryptoLimit}
				required
				style="max-width: 50%;"
			/>
			<input
				type="number"
				id="cryptoLimit-number"
				min="0"
				max="100"
				bind:value={cryptoLimit}
				required
			/>
		</div>

		<div class="form-group allocation-item">
			<label for="startYear-range">Start Year:</label>
			<input
				type="range"
				id="startYear-range"
				name="startYear"
				min="1988"
				max="2024"
				bind:value={startYear}
				required
				style="max-width: 50%;"
				on:input={() => {
					if (startYear > endYear) {
						endYear = startYear;
					}
				}}
			/>
			<input
				type="number"
				id="startYear-number"
				name="startYear"
				min="1988"
				max="2024"
				bind:value={startYear}
				required
				on:input={() => {
					if (startYear > endYear) {
						endYear = startYear;
					}
				}}
			/>
		</div>
		{#if startYear > 2013}
			<p style="color: var(--error-foreground-color); font-weight: bold;">
				must start before 2014 to accommodate 10 year blocks
			</p>
		{/if}

		<div class="form-group allocation-item">
			<label for="endYear-range">End Year:</label>
			<input
				type="range"
				id="endYear-range"
				name="endYear"
				min="1988"
				max="2024"
				bind:value={endYear}
				required
				style="max-width: 50%;"
				on:input={() => {
					if (endYear < startYear) {
						startYear = endYear;
					}
				}}
			/>
			<input
				type="number"
				id="endYear-number"
				name="endYear"
				min="1988"
				max="2024"
				bind:value={endYear}
				required
				on:input={() => {
					if (endYear < startYear) {
						startYear = endYear;
					}
				}}
			/>
		</div>

		<div class="form-group allocation-item">
			<fieldset>
				<legend>Return Type</legend>
				<label>
					<input
						type="radio"
						name="returnType"
						bind:group={returnType}
						value="nominal"
					/>
					Nominal
				</label>
				<label>
					<input
						type="radio"
						name="returnType"
						bind:group={returnType}
						value="real"
					/>
					Inflation Adjusted
				</label>
			</fieldset>
		</div>

		<button type="submit" disabled={isSubmitting}>
			{isSubmitting ? 'Building...' : 'Build Portfolio'}
		</button>
	</form>

	{#if allocations}
		<div>
			<h2>Portfolio Allocation</h2>
			<div>
				{#each allocations as item (item.key)}
					<div
						style="display: flex; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.25rem;"
					>
						<span>{item.label}</span>
						<span>{item.value}%</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
