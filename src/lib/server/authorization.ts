import { env } from '$env/dynamic/private';

export class AuthorizationHelper {
	static isAuthorized(request: Request): boolean {
		const authHeader = request.headers.get('authorization');
		const secret = env.UPLOAD_SECRET;

		// Allow localhost connections without checking the secret
		const host = request.headers.get('host');
		if (host && (host.startsWith('localhost') || host.startsWith('127.0.0.1'))) {
			return true;
		}

		if (!secret) {
			console.error('UPLOAD_SECRET is not set in environment variables');
			return false;
		}

		if (!authHeader) {
			return false;
		}

		// Authorization header should be in the format "Bearer <token>"
		const token = authHeader.split(' ')[1];
		if (!token) {
			return false;
		}

		return token === secret;
	}
}
