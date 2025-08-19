import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ENVIRONMENT } from '$env/static/private';

export class Responses {
	/**
	 * Creates a mock response by reading from a static file.
	 * Only returns mock data when \ENVIRONMENT === 'TEST'.
	 */
	async create(_param1: string, _param2: string): Promise<string> {
		console.log('Creating mock AI Agent responses');
		if (ENVIRONMENT !== 'PROD') {
			const mockFilePath = resolve('src/tests/data/agent_output.txt');
			const mockReply = readFileSync(mockFilePath, 'utf-8');
			return mockReply;
		}
		throw new Error('Responses mock is only available in non-PROD environment');
	}
}
