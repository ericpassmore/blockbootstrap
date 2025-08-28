<script lang="ts">
	let isOpen = true;

	function toggleInstructions() {
		isOpen = !isOpen;
	}
</script>

<div class="instructions-container">
	<button class="toggle-button" on:click={toggleInstructions}>
		{isOpen ? '▼ Hide Instructions' : '▶ Show Instructions'}
	</button>
	{#if isOpen}
		<div class="instructions">
			<p>
				Define your starting investment and allocate funds across different asset classes. The total
				must equal 100%.
			</p>
			<p class="disclaimer">
				⚠ Any information presented is intended purely for illustrative or entertainment purposes
				and should not be construed as financial advice.
			</p>
		</div>
	{/if}
</div>

<style>
	.instructions-container {
		margin-bottom: 1rem;
	}

	.toggle-button {
		background: none;
		border: none;
		color: var(--text-color);
		cursor: pointer;
		font-size: 1rem;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		transition: background-color 0.2s;
	}

	.toggle-button:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.disclaimer {
		font-size: 0.9rem;
		color: var(--muted-text-color);
	}

	.instructions {
		padding-bottom: 1rem;
		margin: 0;
		border: 1px solid var(--secondary-highligh-color);
		border-radius: 6px;
		box-shadow: 0 2px 4px var(--shadow-color-light);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		row-gap: 0.5rem;
		/* smaller space vertically */
		column-gap: 0.5rem;
		/* keep horizontal spacing */
		background-color: var(--primary-highligh-color);
	}
</style>
