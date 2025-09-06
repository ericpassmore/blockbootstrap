<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Allocation } from '$lib/modelReturns';
	let target: number = 8;
	let cryptoLimit: number = 3;
	let isSubmitting = false;
	let allocations: Allocation[] | null = null;
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
