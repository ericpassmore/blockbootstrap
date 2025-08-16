import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	// Parse JSON body
	const { query } = await request.json() as { query: string };

	// You could check/validate query here if needed
	console.log('Received query:', query);

	// Respond with plain text
	return new Response('hello', {
		headers: { 'Content-Type': 'text/plain' }
	});
};
