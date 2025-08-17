import type { RequestHandler } from '@sveltejs/kit';
import { Responses } from 'blockbootstrapagent';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export const POST: RequestHandler = async ({ request }) => {
	// Parse JSON body
	const { query } = (await request.json()) as { query: string };

	// Mock response when ENVIRONMENT=TEST
	if (process.env.ENVIRONMENT === 'TEST') {
		const mockFilePath = resolve('src/tests/data/agent_output.txt');
		const mockReply = readFileSync(mockFilePath, 'utf-8');
		return new Response(mockReply, {
			headers: { 'Content-Type': 'text/plain' }
		});
	}

	// You could check/validate query here if needed
	console.log('Received query:', query);
	const responses = new Responses();
	const reply = await responses.create('wealth-manager', query);

	// Respond with plain text
	return new Response(reply, {
		headers: { 'Content-Type': 'text/plain' }
	});
};
