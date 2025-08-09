import { type Allocation } from '$lib/modelReturns';
import { fail } from '@sveltejs/kit';
import { ForecastService } from '$lib/forecastService';
import type { Actions } from './$types';
import { BREVO_API_KEY } from '$env/static/private';
import { db } from '$lib/server/db'; // your Drizzle DB instance
import { User } from '$lib/user'; // adjust path as needed

export const actions: Actions = {
	login: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();

		if (!email || !email.includes('@')) {
			return { success: false, error: 'Please enter a valid email address.' };
		}
		const user = new User(email, db);

		// Check if user exists
		const existingUser = await user.get();

		if (existingUser) {
			// Generate a new 6-digit code and update
			const newCode = Math.floor(100000 + Math.random() * 900000);
			await user.setCode(newCode);
		} else {
			// Create user (constructor already sets code)
			await user.create();
		}
		await user.sendVerificationEmail(BREVO_API_KEY);

		return { success: true };
	},
	runForecast: async ({ request }) => {
		const formData = await request.formData();
		const startingAmount = Number(formData.get('startingAmount'));
		const allocationsJSON = formData.get('allocations');
		const rebalance = formData.get('rebalance') === 'on';
		const inflationAdjusted = formData.get('inflationAdjusted') === 'on';

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
		const forecastService = await ForecastService.create(
			startingAmount,
			allocations,
			rebalance,
			inflationAdjusted
		);

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
			averageCAGR: forecastService.averageCAGR,
			options: [rebalance, inflationAdjusted]
		};
	}
};
