import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/routes/api/agent/+server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Mock the Responses class from blockbootstrapagent
vi.mock('blockbootstrapagent', () => {
	return {
		Responses: vi.fn().mockImplementation(() => {
			return {
				create: vi.fn()
			};
		})
	};
});

import { Responses } from 'blockbootstrapagent';

describe('POST /api/agent', () => {
	let mockData: string;
	let createMock: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		// Read the mock data from file
		const filePath = path.resolve(__dirname, 'data/agent_output.txt');
		mockData = await fs.readFile(filePath, 'utf-8');

		// Setup the mock for Responses.create to return the mock data
		createMock = vi.fn().mockResolvedValue(mockData);
		(Responses as unknown as any).mockImplementation(() => {
			return { create: createMock };
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns a response with the same hash as the mock data', async () => {
		// Prepare a mock request with a JSON body containing a query
		const mockRequest = {
			json: async () => ({ query: 'test query' })
		};

		// Call the POST handler
		const response = await POST({ request: mockRequest } as any);

		// Read the response text
		const responseText = await response.text();

		// Calculate SHA256 hash of the mock data and response text
		const hashMockData = crypto.createHash('sha256').update(mockData).digest('hex');
		const hashResponse = crypto.createHash('sha256').update(responseText).digest('hex');

		// Assert the hashes are equal
		expect(hashResponse).toBe(hashMockData);

		// Also assert the response content type is text/plain
		expect(response.headers.get('Content-Type')).toBe('text/plain');

		// Assert the Responses.create method was called with the query
		expect(createMock).toHaveBeenCalledWith('wealth-manager', 'test query');
	});
});
