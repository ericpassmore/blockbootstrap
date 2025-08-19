import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User } from '$lib/user';

describe('User Management (DI)', () => {
	let mockDb: any;

	beforeEach(() => {
		mockDb = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						limit: vi.fn().mockResolvedValue([])
					})
				})
			}),
			insert: vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoNothing: vi.fn()
				})
			})
		};
	});

	it('retrieves user by email and verifies code', async () => {
		const mockUser = {
			id: 1,
			email: 'fff@test.com',
			code: 123456,
			firstLoginDate: null,
			lastLoginDate: null
		};

		// Configure mock
		mockDb.select().from().where().limit.mockResolvedValue([mockUser]);

		const user = new User('fff@test.com', mockDb);
		const userData = await user.get();

		expect(userData).toEqual(mockUser);
		expect(userData?.code).toEqual(123456);
	});

	it('returns null when user not found', async () => {
		mockDb.select().from().where().limit.mockResolvedValue([]);

		const user = new User('missing@test.com', mockDb);
		const userData = await user.get();

		expect(userData).toBeNull();
	});
});
