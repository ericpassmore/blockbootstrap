import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { Allocation } from '$lib/modelReturns';
import { Portfolio } from 'blockbootstrapagent';


type ReturnType = 'nominal' | 'real' | 'excess'

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

		// Extract startYear and endYear from formData and convert to integers if present
		const startYearRaw = formData.get('startYear');
		const endYearRaw = formData.get('endYear');
		const startYear = startYearRaw ? parseInt(startYearRaw.toString(), 10) : undefined;
		const endYear = endYearRaw ? parseInt(endYearRaw.toString(), 10) : undefined;

		const rawReturnType = formData.get('returnType');
		const validReturnTypes: ReturnType[] = ['nominal', 'real', 'excess'];
		const returnType: ReturnType | undefined =
			typeof rawReturnType === 'string' && validReturnTypes.includes(rawReturnType as ReturnType)
				? (rawReturnType as ReturnType)
				: undefined;


		try {
			const portfolio = new Portfolio();
			// Pass startYear and endYear if they are valid numbers, else omit them
			const result: Allocation[] = await portfolio.buildOptimizeVariance(
				target,
				cryptoLimit,
				startYear,
				endYear,
				returnType
			);
			return { success: true, data: result };
		} catch {
			return fail(500, { error: 'Failed to build portfolio' });
		}
	}
};
