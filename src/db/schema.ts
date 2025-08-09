import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	firstLoginDate: timestamp('first_login_date'),
	lastLoginDate: timestamp('last_login_date'),
	code: integer('code').notNull()
});
