import { users } from '$lib/../db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { CodeGenerator } from '$lib/codeGenerator';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!params.code) return { codeOk: false, status: 400, error: 'No verification code provided' };

	const codeParam = params.code;
	const code = parseInt(codeParam, 10);
	const userResult = await db.select().from(users).where(eq(users.code, code)).limit(1);
	if (userResult.length === 0) return { codeOk: false, status: 400, error: 'Your code was not found. Please try again.'};

	const user = userResult[0];
	const now = new Date();
	const updates: { lastLoginDate: Date, firstLoginDate?: Date } = { lastLoginDate: now };

	if (!user.firstLoginDate) { updates.firstLoginDate = now; }

	await db.update(users).set(updates).where(eq(users.id, user.id));

	return { codeOk: true, status: 200, token: CodeGenerator.getToken(), error: null }
};