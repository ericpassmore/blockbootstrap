<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Inspect Block Data</h1>

{#if data.block?.length > 0}
	{#each data.block as item}
		<div class="data-block">
			<h2>Year: {item.year + data.blockNumber + 1969 -1}</h2>
			<ul>
				<li><strong>S&P 500:</strong> {item.sp500}%</li>
				<li><strong>US Small Cap:</strong> {item.usSmallCap}%</li>
				<li><strong>T-Bill:</strong> {item.TBill}%</li>
				<li><strong>10-Year Treasury:</strong> {item.treasury10Year}%</li>
				<li><strong>BAA Corporate Bond:</strong> {item.baaCorp}%</li>
				<li><strong>Real Estate:</strong> {item.realEstate}%</li>
				<li><strong>Gold:</strong> {item.gold}%</li>
				<li><strong>Inflation:</strong> {item.inflation}%</li>
				<li><strong>S&P 500 Dividend Yield:</strong> {item.sp500DividendYield}%</li>
				<li><strong>Bitcoin:</strong> {item.bitcoin}%</li>
				<li><strong>International Equity:</strong> {item.internationalEquity}%</li>
				<li><strong>Emerging Markets:</strong> {item.emergingMarkets}%</li>
				<li><strong>NASDAQ 100:</strong> {item.nasdaq100}%</li>
			</ul>
		</div>
	{/each}
{:else}
	<p>No block data available to display.</p>
{/if}
