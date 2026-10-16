import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import {
	buildOptimizedPortfolio,
	selectPortfolioBlocks,
	type ReturnType
} from '$lib/server/portfolioOptimizer';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const target = Number(formData.get('target'));
		const cryptoLimitRaw = formData.get('cryptoLimit');
		const cryptoLimit = Number(cryptoLimitRaw);

		if (isNaN(target) || target < 1 || target > 20) {
			return fail(400, { error: 'Target must be a number between 1 and 20' });
		}

		if (
			cryptoLimitRaw === null ||
			cryptoLimitRaw === '' ||
			!Number.isFinite(cryptoLimit) ||
			cryptoLimit < 0 ||
			cryptoLimit > 100
		) {
			return fail(400, { error: 'Crypto limit must be a number between 0 and 100' });
		}

		// Extract startYear and endYear from formData and convert to integers if present
		const startYearRaw = formData.get('startYear');
		const endYearRaw = formData.get('endYear');
		const startYear = startYearRaw ? Number(startYearRaw) : undefined;
		const endYear = endYearRaw ? Number(endYearRaw) : undefined;

		const rawReturnType = formData.get('returnType');
		const validReturnTypes: ReturnType[] = ['nominal', 'real', 'excess'];
		const returnType: ReturnType | undefined =
			typeof rawReturnType === 'string' && validReturnTypes.includes(rawReturnType as ReturnType)
				? (rawReturnType as ReturnType)
				: undefined;

		let blocks: [number, number];
		try {
			blocks = selectPortfolioBlocks(startYear, endYear);
		} catch (error) {
			return fail(400, { error: (error as Error).message });
		}

		try {
			const result = buildOptimizedPortfolio(target / 100, cryptoLimit / 100, blocks, returnType);
			return { success: true, data: result };
		} catch {
			return fail(500, { error: 'Failed to build portfolio' });
		}
	}
};
