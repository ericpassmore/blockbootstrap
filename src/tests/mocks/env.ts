// src/tests/setup.ts
export const DATABASE_URL =
	process.env.DATABASE_URL ||
	'postgresql://blockbootstrap_user:secure_password@localhost:5432/blockbootstrap_db';
export const BREVO_API_KEY = process.env.BREVO_API_KEY || 'test-brevo-key';
export const POLYGON_API_KEY = process.env.POLYGON_API_KEY || 'test-polygon-key';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key';
export const UPLOAD_SECRET = process.env.UPLOAD_SECRET || 'test-upload-secret';
