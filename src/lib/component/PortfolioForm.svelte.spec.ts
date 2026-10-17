import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PortfolioForm from './PortfolioForm.svelte';
import type { FormData } from '$lib/types/formData';

const response = (overrides: Partial<FormData> = {}): FormData => ({
	success: false,
	forecasts: [],
	startingAmount: 10000,
	allocations: [{ key: 'sp500', label: 'S&P 500', value: 100 }],
	median: 0,
	medianSeries: [],
	q1: 0,
	q1Series: [],
	q3: 0,
	q3Series: [],
	averageCAGR: 0,
	finalValueStdDev: 0,
	error: '',
	options: [false, false, 10, false],
	...overrides
});

it('shows all three extra indexes and the 1988 boundary only after enabling the toggle', async () => {
	const screen = render(PortfolioForm, { form: response(), onSubmit: vi.fn() });
	const toggle = screen.getByRole('switch', { name: 'Enable more indexes' });
	await expect.element(toggle).not.toBeChecked();
	await expect
		.element(screen.getByText('Forecast history starts in 1970 (block 01).'))
		.toBeVisible();
	await expect
		.element(screen.getByLabelText('International stocks allocation percentage'))
		.not.toBeInTheDocument();
	await toggle.click();
	for (const name of ['International stocks', 'Emerging markets', 'Nasdaq-100']) {
		await expect.element(screen.getByLabelText(`${name} allocation percentage`)).toHaveValue(0);
	}
	await expect
		.element(screen.getByText(/Forecast history starts in 1988\s+\(block 19\)/))
		.toBeVisible();
	await expect.element(screen.getByRole('button', { name: 'Run Forecast' })).toBeEnabled();
});

it('removes hidden index weights without silently reallocating them', async () => {
	const screen = render(PortfolioForm, { form: response(), onSubmit: vi.fn() });
	const toggle = screen.getByRole('switch', { name: 'Enable more indexes' });
	await toggle.click();
	await screen.getByLabelText('S&P 500 allocation percentage').fill('80');
	await screen.getByLabelText('Nasdaq-100 allocation percentage').fill('20');
	await expect.element(screen.getByRole('button', { name: 'Run Forecast' })).toBeEnabled();
	await toggle.click();
	await expect
		.element(screen.getByLabelText('Nasdaq-100 allocation percentage'))
		.not.toBeInTheDocument();
	await expect.element(screen.getByText('Total Allocation: 80%')).toBeVisible();
	await expect.element(screen.getByRole('button', { name: 'Run Forecast' })).toBeDisabled();
	const submitted = new window.FormData(document.querySelector('form')!);
	expect(submitted.get('includeMoreIndexes')).toBeNull();
	expect(JSON.parse(String(submitted.get('allocations')))).toEqual([
		{ key: 'sp500', label: 'S&P 500', value: 80 }
	]);
});

it('restores enabled mode and allocations returned by the server', async () => {
	const screen = render(PortfolioForm, {
		form: response({
			includeMoreIndexes: true,
			allocations: [
				{ key: 'sp500', label: 'S&P 500', value: 75 },
				{ key: 'internationalEquity', label: 'International stocks', value: 25 }
			]
		}),
		onSubmit: vi.fn()
	});
	await expect.element(screen.getByRole('switch', { name: 'Enable more indexes' })).toBeChecked();
	await expect
		.element(screen.getByLabelText('International stocks allocation percentage'))
		.toHaveValue(25);
	await expect
		.element(screen.getByLabelText('Emerging markets allocation percentage'))
		.toHaveValue(0);
	const submitted = new window.FormData(document.querySelector('form')!);
	expect(submitted.get('includeMoreIndexes')).toBe('on');
	expect(JSON.parse(String(submitted.get('allocations')))).toHaveLength(4);
});
