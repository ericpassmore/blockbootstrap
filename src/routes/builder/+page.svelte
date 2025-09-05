<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Allocation } from '$lib/modelReturns';
	let target: number = 1;
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
		<label for="target"> Target Number (1-20): </label>
		<input type="number" id="target" name="target" min="1" max="20" bind:value={target} required />
		<label for="cryptoLimit"> Crypto Limit (0-100): </label>
		<input type="number" id="cryptoLimit" name="cryptoLimit" min="0" max="100" value="3" required />
		<button type="submit" disabled={isSubmitting}>
			{isSubmitting ? 'Building...' : 'Build Portfolio'}
		</button>
	</form>

	{#if allocations}
		<div>
			<h2>Portfolio Allocation</h2>
			<div>
				<ul>
					{#each allocations as item (item.key)}
						<li>
							<div>
								<div>
									<p>{item.label}</p>
									<div>
										<p>
											{item.value}%
										</p>
									</div>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>
