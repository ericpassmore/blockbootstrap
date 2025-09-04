<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Allocation } from '$lib/modelReturns';
  let target: number = 1;
  let isSubmitting = false;
  let allocation: Allocation | null = null;
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Portfolio Builder</h1>
  <form
    method="POST"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ result }) => {
        isSubmitting = false;
        if (result.type === 'success' && result.data) {
          allocation = result.data.data as Allocation;
        }
      };
    }}
    class="flex flex-col gap-4 max-w-md"
  >
    <label for="target" class="block text-sm font-medium text-gray-700">
      Target Number (1-20):
    </label>
    <input
      type="number"
      id="target"
      name="target"
      min="1"
      max="20"
      bind:value={target}
      required
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    />
    <label for="cryptoLimit" class="block text-sm font-medium text-gray-700">
      Crypto Limit (0-100):
    </label>
    <input
      type="number"
      id="cryptoLimit"
      name="cryptoLimit"
      min="0"
      max="100"
      value="3"
      required
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
    />
    <button
      type="submit"
      disabled={isSubmitting}
      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {isSubmitting ? 'Building...' : 'Build Portfolio'}
    </button>
  </form>

  {#if allocation}
    <div class="mt-6 max-w-md">
      <h2 class="text-xl font-semibold mb-2">Portfolio Allocation</h2>
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul class="divide-y divide-gray-200">
          <li>
            <div class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-indigo-600 truncate">{allocation.label}</p>
                <div class="ml-2 flex-shrink-0 flex">
                  <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {allocation.value.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  {/if}
</div>