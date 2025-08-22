import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = 'static/data';

export const PUT: RequestHandler = async ({ request, url }) => {
	// Get file path from query parameter
	const filePath = url.searchParams.get('file');
	if (!filePath) {
		return json({ success: false, error: 'Missing file parameter' }, { status: 400 });
	}

	// Sanitize file path to prevent directory traversal
	const safeFilePath = path.basename(filePath);
	const ext = path.extname(safeFilePath).toLowerCase();
	const allowedExts = ['.json', '.txt', '.csv', '.md'];

	if (!allowedExts.includes(ext)) {
		return json({ error: 'Invalid file type' }, { status: 400 });
	}

	// Size check
	const contentLength = request.headers.get('content-length');
	if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
		return json({ error: 'File too large' }, { status: 413 });
	}

	// Full Path
	const fullPath = path.join(DATA_DIR, safeFilePath);

	try {
		const body = await request.arrayBuffer();
		const buffer = Buffer.from(body);

		// Atomic write
		const tempPath = `${fullPath}.tmp`;
		await fs.writeFile(tempPath, buffer);
		// Overwrite
		await fs.rename(tempPath, fullPath);

		return json({ success: true, message: `File ${safeFilePath} uploaded successfully` });
	} catch (error) {
		console.error('File upload error:', error);
		return json({ success: false, error: 'Failed to write file' }, { status: 500 });
	}
};
