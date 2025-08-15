import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DATABASE_URL } from '$env/static/private';

// Connect to PostgreSQL database using the URL from .env

// Create connection pool using DATABASE_URL
const pool = new Pool({
	connectionString: DATABASE_URL,
	ssl: DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Initialize Drizzle with the pool
export const db = drizzle(pool);
