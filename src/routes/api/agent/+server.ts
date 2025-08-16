import type { RequestHandler } from '@sveltejs/kit';
import { Responses } from 'blockbootstrapagent';

export const POST: RequestHandler = async ({ request }) => {
	// Parse JSON body
	const { query } = (await request.json()) as { query: string };

	// You could check/validate query here if needed
	console.log('Received query:', query);
	const responses = new Responses();
	const reply = await responses.create('wealth-manager', query);

	// Respond with plain text
	return new Response(reply, {
		headers: { 'Content-Type': 'text/plain' }
	});
};
