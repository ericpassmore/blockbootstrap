import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launch, Browser, Page } from 'puppeteer';

let browser: Browser;
let page: Page;

describe('Main page instructions toggle', () => {
	beforeAll(async () => {
		browser = await launch({ headless: true });
		page = await browser.newPage();
		await page.goto('http://localhost:5173/', {
			waitUntil: 'networkidle0' // or 'networkidle2'
		});
	});

	afterAll(async () => {
		await browser.close();
	});

	it('should toggle instructions visibility', async () => {
		const toggleSelector = '.toggle-button';
		const instructionsSelector = '.instructions';

		// Initially instructions should be visible
		await page.waitForSelector(instructionsSelector, { visible: true });

		// Click to hide instructions
		await page.click(toggleSelector);
		// Instructions div should not be present
		const instructionsHidden = await page.$(instructionsSelector);
		expect(instructionsHidden).toBeNull();

		// Click to show instructions
		await page.click(toggleSelector);
		// Instructions div should be visible again
		await page.waitForSelector(instructionsSelector, { visible: true });
	});

	it('should submit the form, scroll the page, and show the graph', async () => {
		const formSelector = '#main-form';
		const submitButtonSelector = `${formSelector} button[type="submit"]`;
		const chartContainerSelector = '.chart-container';

		// Wait for form and submit button to be available
		try {
			await page.waitForSelector(submitButtonSelector, { visible: true, timeout: 10000 });
		} catch (error) {
			// Debug: log what's actually on the page
			const formExists = await page.$(formSelector);
			const buttons = await page.$$eval('button', (btns) =>
				btns.map((btn) => ({
					text: btn.textContent,
					type: btn.type,
					id: btn.id,
					className: btn.className
				}))
			);
			console.log('Form exists:', !!formExists);
			console.log('Available buttons:', buttons);
			throw error;
		}

		// Get initial scroll position
		const initialScrollY = await page.evaluate(() => window.scrollY);

		// Click the submit button
		await page.click(submitButtonSelector);

		// Wait for scroll to happen (scrollY to increase)
		await page.waitForFunction((initialY) => window.scrollY > initialY, {}, initialScrollY);

		// Wait for the chart container to be visible
		await page.waitForSelector(chartContainerSelector, { visible: true });

		// Optionally, assert chart container is visible
		const chartVisible = await page.$eval(chartContainerSelector, (el) => {
			const style = window.getComputedStyle(el);
			return (
				style &&
				style.display !== 'none' &&
				style.visibility !== 'hidden' &&
				(el as HTMLElement).offsetHeight > 0
			);
		});
		expect(chartVisible).toBe(true);
	});
});
