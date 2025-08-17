import { expect, test } from 'vitest';
import puppeteer from 'puppeteer';

test('ai-assistant input and info-block height test', async () => {
	const baseUrl = 'http://localhost:5173';

	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();

	await page.goto(`${baseUrl}/ai-assistant`);

	// Input 3 lines of text into the input box and submit (press Enter)
	const inputSelector = 'textarea.expanding-textarea';
	await page.waitForSelector(inputSelector, { visible: true });

	const lines = ['Line 1', 'Line 2', 'Line 3'];
	for (const line of lines) {
		await page.type(inputSelector, line);
		await page.keyboard.down('Shift');
		await page.keyboard.press('Enter');
		await page.keyboard.up('Shift');
	}
	// Press Enter to submit (without Shift)
	await page.keyboard.press('Enter');

	// Check textarea is visible
	const textareaVisible = await page.$eval(inputSelector, (el) => {
		const style = window.getComputedStyle(el);
		return (
			style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0
		);
	});
	expect(textareaVisible).toBe(true);

	// Check div.info-block for the response and its height
	const infoBlockSelector = 'div.info-block';
	await page.waitForSelector(infoBlockSelector, { visible: true });

	const infoBlockHeight = await page.$eval(infoBlockSelector, (el) => el.clientHeight);
	const infoBlockLineHeight = await page.$eval(infoBlockSelector, (el) => {
		const style = window.getComputedStyle(el);
		return parseFloat(style.lineHeight) || 16; // fallback 16px
	});
	const infoBlockLinesCount = infoBlockHeight / infoBlockLineHeight;
	expect(infoBlockLinesCount).toBeGreaterThan(10);

	await browser.close();
});
