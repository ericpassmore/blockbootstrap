import { powerLawFits } from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type powerLawCalParams = {
	coefficient_a: number;
	exponent_b: number;
	offset_c: number;
};

export class powerLawFormula {
	// Store all power law fits by symbol
	private static fits: Map<
		string,
		{
			symbol: string;
			tag?: string;
			coefficient_a: number;
			exponent_b: number;
			offset_c: number;
			r_squared?: number;
			rmse?: number;
			sample_size?: number;
			x_min?: number;
			x_max?: number;
			coefficient_a_ci_lower?: number;
			coefficient_a_ci_upper?: number;
			exponent_b_ci_lower?: number;
			exponent_b_ci_upper?: number;
			fitted_at?: Date;
			fitted_by?: string;
			notes?: string;
		}
	> = new Map();

	public static async loadFits(db: NodePgDatabase<Record<string, never>>): Promise<void> {
		const result = await db.select().from(powerLawFits);
		powerLawFormula.fits.clear();
		for (const fit of result) {
			powerLawFormula.fits.set(fit.symbol, {
				symbol: fit.symbol,
				tag: fit.tag ?? undefined,
				coefficient_a: fit.coefficient_a,
				exponent_b: fit.exponent_b,
				offset_c: fit.offset_c,
				r_squared: fit.r_squared ?? undefined,
				rmse: fit.rmse ?? undefined,
				sample_size: fit.sample_size ?? undefined,
				x_min: fit.x_min ?? undefined,
				x_max: fit.x_max ?? undefined,
				coefficient_a_ci_lower: fit.coefficient_a_ci_lower ?? undefined,
				coefficient_a_ci_upper: fit.coefficient_a_ci_upper ?? undefined,
				exponent_b_ci_lower: fit.exponent_b_ci_lower ?? undefined,
				exponent_b_ci_upper: fit.exponent_b_ci_upper ?? undefined,
				fitted_at: fit.fitted_at ? new Date(fit.fitted_at) : undefined,
				fitted_by: fit.fitted_by ?? undefined,
				notes: fit.notes ?? undefined
			});
		}
	}

	// Return concise power law params for core, lowerBound, upperBound
	public static getPowerLawCalParams(symbol: string): {
		core: powerLawCalParams | undefined;
		lowerBound: powerLawCalParams | undefined;
		upperBound: powerLawCalParams | undefined;
	} {
		const fit = this.fits.get(symbol);
		if (!fit) {
			return { core: undefined, lowerBound: undefined, upperBound: undefined };
		}
		const core: powerLawCalParams = {
			coefficient_a: fit.coefficient_a,
			exponent_b: fit.exponent_b,
			offset_c: fit.offset_c
		};
		const lowerBound: powerLawCalParams = {
			coefficient_a: fit.coefficient_a_ci_lower ?? fit.coefficient_a,
			exponent_b: fit.exponent_b_ci_lower ?? fit.exponent_b,
			offset_c: fit.offset_c
		};
		const upperBound: powerLawCalParams = {
			coefficient_a: fit.coefficient_a_ci_upper ?? fit.coefficient_a,
			exponent_b: fit.exponent_b_ci_upper ?? fit.exponent_b,
			offset_c: fit.offset_c
		};
		return { core, lowerBound, upperBound };
	}

	// Return all data for a symbol or undefined
	public static getFitData(symbol: string) {
		return this.fits.get(symbol);
	}
}
