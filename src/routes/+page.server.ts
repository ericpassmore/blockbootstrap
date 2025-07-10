import { ModelReturns, type Allocation } from '$lib/modelReturns';
import { fail, type Actions } from '@sveltejs/kit';
import { ForecastService } from '$lib/forecastService';

export const actions: Actions = {
	runForecast: async ({ request }) => {
        
		const formData = await request.formData();
		const startingAmount = Number(formData.get('startingAmount'));
		const allocationsJSON = formData.get('allocations');

		// Basic validation for form data
		if (!startingAmount || !allocationsJSON) {
			return fail(400, { error: 'Missing form data. Please try again.' });
		}

		const allocations = JSON.parse(allocationsJSON as string) as Allocation[];
		const totalAllocation = allocations.reduce((sum, asset) => sum + asset.value, 0);

		// Server-side validation of allocation total
		if (Math.round(totalAllocation) !== 100) {
			return fail(400, { error: 'Total allocation must be 100%.' });
		}

		// Instantiate the service to perform all calculations and data transformations.
		const forecastService = new ForecastService(startingAmount, allocations);

		return {
			success: true,
			forecasts: forecastService.forecasts,
			allocations: allocations,
			startingAmount: forecastService.startingAmount,
			median: forecastService.median,
			medianSeries: forecastService.medianSeries,
			q1: forecastService.q1,
			q1Series: forecastService.q1Series,
			q3: forecastService.q3,
			q3Series: forecastService.q3Series,
            averageCAGR: forecastService.averageCAGR
		};
	}
};