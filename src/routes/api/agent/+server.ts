import { ENVIRONMENT } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ResponsesClass: any;

export const POST: RequestHandler = async ({ request }) => {
	// Parse JSON body
	const { query } = (await request.json()) as { query: string };

	if (ENVIRONMENT === 'TEST' || ENVIRONMENT === 'DEV') {
		// You could check/validate query here if needed
		console.log('Received query:', query);
		console.log('Using mock Responses class');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ResponsesClass = (await import('../../../tests/mocks/responses')).Responses as any;
	} else {
		ResponsesClass = (await import('blockbootstrapagent')).Responses;
	}
	const responses = new ResponsesClass();
	const stream = await responses.create('wealth-manager', query);

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/plain'
		}
	});
};
