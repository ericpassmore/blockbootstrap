import { describe, it, expect } from 'vitest';
import { db } from '$lib/server/db';
import { cryptoGenesisDates } from '../../db/schema';

describe('Database Access', () => {
	it('should query crypto_genesis_dates table successfully', async () => {
		const result = await db.select().from(cryptoGenesisDates);
		expect(Array.isArray(result)).toBe(true);
		if (result.length > 0) {
			expect(result[0]).toHaveProperty('symbol');
			expect(result[0]).toHaveProperty('genesis_date');
		}
	});
});
