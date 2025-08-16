<script lang="ts">
	type Props = {
		selectedBlock: number;
	};
	let { selectedBlock = $bindable() }: Props = $props();
</script>

<p>Select a 10-year historical data block to inspect its annual returns.</p>

<div class="inspect-block">
	<label for="block-selector">Block Number:</label>
	<select id="block-selector" bind:value={selectedBlock}>
		{#each Array.from({ length: 50 }, (_, i) => i + 1) as n (n)}
			<option value={n}>{n}</option>
		{/each}
	</select>
</div>
