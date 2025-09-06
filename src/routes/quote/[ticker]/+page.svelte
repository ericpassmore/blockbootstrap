<script lang="ts">
	import type { PageData } from '../$types';
	import type { WeeklyData } from '$lib/polygon';

	export let data: PageData;

	$: weeklyData = data.weeklyData as WeeklyData[];
	$: totalVolume = weeklyData.reduce((sum, week) => sum + week.volume, 0);
	$: averageClose =
		weeklyData.length > 0
			? weeklyData.reduce((sum, week) => sum + week.close, 0) / weeklyData.length
			: 0;

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(price);
	}

	function formatVolume(volume: number): string {
		return new Intl.NumberFormat('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(volume);
	}
</script>

<svelte:head>
	<title>Weekly Data</title>
</svelte:head>

<main class="container mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">Weekly Closing Prices & Volume</h1>

	{#if !data.success}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			<strong>Error:</strong>
			{data.error || 'Failed to load data'}
		</div>
	{:else if weeklyData.length === 0}
		<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
			No data available for the selected period.
		</div>
	{:else}
		<!-- Summary Stats -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
			<div class="bg-blue-100 p-4 rounded-lg">
				<h3 class="font-semibold text-blue-800">Total Weeks</h3>
				<p class="text-2xl font-bold text-blue-900">{weeklyData.length}</p>
			</div>
			<div class="bg-green-100 p-4 rounded-lg">
				<h3 class="font-semibold text-green-800">Average Close</h3>
				<p class="text-2xl font-bold text-green-900">{formatPrice(averageClose)}</p>
			</div>
			<div class="bg-purple-100 p-4 rounded-lg">
				<h3 class="font-semibold text-purple-800">Total Volume</h3>
				<p class="text-2xl font-bold text-purple-900">{formatVolume(totalVolume)}</p>
			</div>
		</div>

		<!-- Data Table -->
		<div class="overflow-x-auto">
			<table class="min-w-full bg-white border border-gray-300">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Week Ending
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Closing Price
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
						>
							Volume
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each weeklyData as week (week.timestamp)}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{week.date}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{formatPrice(week.close)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{formatVolume(week.volume)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>

<style>
	.container {
		max-width: 1200px;
	}
</style>
