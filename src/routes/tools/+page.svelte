<script lang="ts">
	let selectedBlock: number = 1;
</script>

<h1>Inspect a Block</h1>
<p>Select a 10-year historical data block to inspect its annual returns.</p>

<div class="inspect-block">
	<label for="block-selector">Block Number:</label>
	<select id="block-selector" bind:value={selectedBlock}>
		{#each { length: 50 } as _, i}
			<option value={i + 1}>{i + 1}</option>
		{/each}
	</select>
	<a href="/inspect/{selectedBlock}" class="button-link">Inspect Block {selectedBlock}</a>
</div>
