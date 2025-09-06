import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer';

describe('Userguide Page Performance and Content', () => {
	let browser: Browser;
	let page: Page;

	beforeAll(async () => {
		browser = await puppeteer.launch({ headless: true });
		page = await browser.newPage();
	});

	afterAll(async () => {
		await browser.close();
	});

	async function testUserguidePage() {
		const baseUrl = 'http://localhost:5173'; // Adjust if your dev server runs on a different port or domain
		const url = baseUrl + '/userguide';

		let response: HTTPResponse | undefined = undefined;
		const startTime = Date.now();

		// Intercept response to get status code
		page.once('response', (res) => {
			if (res.url() === url) {
				response = res;
			}
		});

		await page.goto(url, { waitUntil: 'domcontentloaded' });

		const duration = Date.now() - startTime;

		expect(response).toBeDefined();
		if (response !== undefined) {
			expect(response.status()).toBe(200);
		}
		expect(duration).toBeLessThanOrEqual(3000);

		// Check h1 content
		const h1Text = await page.$eval('h1', (el) => el.textContent);
		expect(h1Text).toBeTruthy();
		expect(h1Text?.toLowerCase().includes('options')).toBe(true);
	}

	it('Userguide page loads within 3 seconds with status 200 and correct h1', async () => {
		await testUserguidePage();
	});
});
