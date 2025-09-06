import type { Handle } from '@sveltejs/kit';
import { AuthorizationHelper } from '$lib/server/authorization';

export const handle: Handle = async ({ event, resolve }) => {
	const { request, url } = event;
	const pathname = url.pathname;

	if (pathname.startsWith('/api')) {
		const method = request.method;

		if (method === 'PUT' || method === 'PATCH') {
			// Check authorization
			if (!AuthorizationHelper.isAuthorized(request)) {
				return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			// Check origin header
			const origin = request.headers.get('origin');
			if (origin && origin !== url.origin) {
				return new Response(JSON.stringify({ success: false, error: 'Invalid origin' }), {
					status: 403,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		}

		if (method === 'GET' || method === 'OPTIONS') {
			// Allow from any origin without authorization
			// No action needed here, just proceed
		}
	}

	return resolve(event);
};
