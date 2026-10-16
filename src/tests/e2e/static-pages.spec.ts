import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';

describe('Static Pages Performance and Content', () => {
	let browser: Browser;
	let page: Page;

	beforeAll(async () => {
		browser = await puppeteer.launch({ headless: true });
		page = await browser.newPage();
	});

	afterAll(async () => {
		await browser.close();
	});

	async function testPage(urlPath: string, expectedH1Start: string) {
		const baseUrl = 'http://localhost:5173'; // Adjust if your dev server runs on a different port or domain
		const url = baseUrl + urlPath;

		const startTime = Date.now();
		const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

		const duration = Date.now() - startTime;

		expect(response?.status()).toBe(200);
		expect(duration).toBeLessThanOrEqual(3000);

		// Check h1 content
		const h1Text = await page.$eval('h1', (el) => el.textContent);
		expect(h1Text).toBeTruthy();
		expect(h1Text?.startsWith(expectedH1Start)).toBe(true);
	}

	it('Privacy page loads within 3 seconds with status 200 and correct h1', async () => {
		await testPage('/privacy', 'Privacy');
	});

	it('Methodology page loads within 3 seconds with status 200 and correct h1', async () => {
		await testPage('/methodology', 'Methodology');
	});
});
