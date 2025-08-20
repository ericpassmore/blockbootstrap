import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ENVIRONMENT } from '$env/static/private';

export class Responses {
	/**
	 * Creates a mock response by reading from a static file.
	 * Only returns mock data when \ENVIRONMENT === 'TEST'.
	 */
	async create(_param1: string, _param2: string): Promise<ReadableStream> {
		console.log('Creating mock AI Agent responses');
		if (ENVIRONMENT !== 'PROD') {
			const mockFilePath = resolve('src/tests/data/agent_output.txt');
			const mockReply = readFileSync(mockFilePath, 'utf-8');
			return this.sendStringAsStream(mockReply);
		}
		throw new Error('Responses mock is only available in non-PROD environment');
	}
	async sendStringAsStream(content: string): Promise<ReadableStream> {
		return new ReadableStream({
			async start(controller) {
				const encoder = new TextEncoder();

				// split into "first chunk" + "rest"
				const firstChunk = content.slice(0, 50); // or 1 token/word if you prefer
				const rest = content.slice(50);

				// send first chunk immediately
				controller.enqueue(encoder.encode(firstChunk));

				// wait 250ms before sending the rest
				await new Promise((resolve) => setTimeout(resolve, 250));

				if (rest.length > 0) {
					controller.enqueue(encoder.encode(rest));
				}

				controller.close(); // Signal the end of the stream
			}
		});
	}
}
