import { describe, it, expect } from 'vitest';
import { ModelReturns, type Allocation } from '$lib/modelReturns';

describe('Taxes/Appreciation', () => {
    it('treasury taxes are always greater than zero for the first 40 blocks', async() => {
        const allocations: Allocation[] = [
            { key: 'treasury10Year', label: '10-Year Treasury', value: 100 }
        ];
        const startingAmount = 100000;

        for (let blockNumber = 1; blockNumber <= 40; blockNumber++) {
            const model = await ModelReturns.create(startingAmount, allocations, blockNumber);

            // We expect some ordinary income from treasuries each year, which should result in taxes.
            const totalTaxes = model.results.reduce((sum, yearResult) => sum + yearResult.taxes, 0);

            expect(model.results.length, `Block ${blockNumber} should have 10 years of results`).toBe(10);
            expect(totalTaxes, `Total taxes for block ${blockNumber} should be > 0`).toBeGreaterThan(0);
            expect(model.results[0].taxes, `First year taxes for block ${blockNumber} should be > 0`).toBeGreaterThan(0);
        }
    })
    it('check taxes/appreciation for block 9 with 100% Treasuries', async() => {
                const allocations: Allocation[] = [
            { key: 'treasury10Year', label: '10-Year Treasury', value: 100 }
        ];
        const startingAmount = 100000;
        const model = await ModelReturns.create(startingAmount, allocations, 9);

        // We expect some ordinary income from treasuries each year, which should result in taxes.
        const totalTaxes = model.results.reduce((sum, yearResult) => sum + yearResult.taxes, 0);
        expect(totalTaxes, `Taxes for block 9 with 100% Treasuries should be close to $8682.34`).toBeCloseTo(8682.34,2);
        const terminatingValue = model.results[9].endValue;
        expect(terminatingValue, `Terminating value for block 9 with 100% Treasuries`).toBeCloseTo(242664.40,2);
    })
    it('check taxes/appreciation for block 9 with 100% baaCorp', async() => {
                const allocations: Allocation[] = [
            { key: 'baaCorp', label: 'BAA Corporate Bonds', value: 100 }
        ];
        const startingAmount = 100000;
        const model = await ModelReturns.create(startingAmount, allocations, 9);

        // We expect some ordinary income from treasuries each year, which should result in taxes.
        const totalTaxes = model.results.reduce((sum, yearResult) => sum + yearResult.taxes, 0);
        expect(totalTaxes, `Total taxes for block 9 with 100% baaCorp should be close to $8682.34`).toBeCloseTo(10112.48,2);
        const terminatingValue = model.results[9].endValue;
        expect(terminatingValue, `Terminating value for block 9 with 100% baaCorp `).toBeCloseTo(283910.25,2);
    })
    it('check taxes/appreciation block 4 with 100% sp500', async() => {
                const allocations: Allocation[] = [
            { key: 'sp500', label: 'S&P 500', value: 100 }
        ];
        const startingAmount = 100000;
        const model = await ModelReturns.create(startingAmount, allocations, 4);

        // We expect some ordinary income from treasuries each year, which should result in taxes.
        const totalTaxes = model.results.reduce((sum, yearResult) => sum + yearResult.taxes, 0);
        expect(totalTaxes, `Total taxes for block 4 with 100% sp500should be close to $8682.34`).toBeCloseTo(10862.77,2);
        const terminatingValue = model.results[9].endValue;
        expect(terminatingValue, `Terminating value for block 4 with 100% sp500 191232.78`).toBeCloseTo(191232.78,2);
    })
    it('bitcoin allocation in Block 1 should be ok', async() => {
        const allocations: Allocation[] = [
            { key: 'bitcoin', label: 'Bitcoin', value: 100 }
        ];
        const startingAmount = 100000;
        const model = await ModelReturns.create(startingAmount, allocations, 1);
        expect(model.finalValue).toBeTypeOf('number')
        expect(model.finalValue).not.toBeNaN()
        expect(model.finalValue).toBeGreaterThan(5000)
    })
})