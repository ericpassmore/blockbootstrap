import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

const DATA_DIR = 'static/data';
const TEST_FILE = 'hello.txt';
const TEST_FILE_PATH = path.join(DATA_DIR, TEST_FILE);
const UPLOAD_URL = 'http://localhost:5173/api/upload?file=' + TEST_FILE;

describe('Upload API', () => {
	beforeEach(async () => {
		// Clean up before test
		try {
			await fs.unlink(TEST_FILE_PATH);
		} catch (e) {
			// Ignore if file does not exist
		}
	});

	afterEach(async () => {
		// Clean up after test
		try {
			await fs.unlink(TEST_FILE_PATH);
		} catch (e) {
			// Ignore if file does not exist
		}
	});

	it('should upload a file and verify it exists with size > 0', async () => {
		const content = 'Hello, world!';

		// Upload the file using PUT
		const response = await fetch(UPLOAD_URL, {
			method: 'PUT',
			headers: {
				'Content-Type': 'text/plain'
			},
			body: content
		});

		expect(response.ok).toBe(true);
		const json = (await response.json()) as { success: boolean };
		expect(json.success).toBe(true);

		// Verify file exists and size > 0
		const stats = await fs.stat(TEST_FILE_PATH);
		expect(stats.isFile()).toBe(true);
		expect(stats.size).toBeGreaterThan(0);

		// Verify file content
		const fileContent = await fs.readFile(TEST_FILE_PATH, 'utf-8');
		expect(fileContent).toBe(content);
	});
});
