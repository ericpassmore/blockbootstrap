import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { Allocation } from '$lib/modelReturns';
import { Portfolio } from 'blockbootstrapagent';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		let target = Number(formData.get('target'));
		let cryptoLimit = Number(formData.get('cryptoLimit'));

		if (isNaN(target) || target < 1 || target > 20) {
			return fail(400, { error: 'Target must be a number between 1 and 20' });
		} else {
			target = parseFloat((target / 100).toFixed(2));
		}

		if (isNaN(cryptoLimit) || cryptoLimit < 1 || cryptoLimit > 20) {
			cryptoLimit = 0.03;
		} else {
			cryptoLimit = parseFloat((cryptoLimit / 100).toFixed(2));
		}

		try {
			const portfolio = new Portfolio();
			const result: Allocation[] = await portfolio.buildOptimizeVariance(target, cryptoLimit);
			return { success: true, data: result };
		} catch {
			return fail(500, { error: 'Failed to build portfolio' });
		}
	}
};
