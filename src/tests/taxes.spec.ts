import { describe, it, expect } from 'vitest';
import { ModelReturns, type Allocation } from '$lib/modelReturns';

describe('Taxes', () => {
    it('treasury taxes are always greater than zero for the first 40 blocks', () => {
        const allocations: Allocation[] = [
            { key: 'treasury10Year', label: '10-Year Treasury', value: 100 }
        ];
        const startingAmount = 100000;

        for (let blockNumber = 1; blockNumber <= 40; blockNumber++) {
            const model = new ModelReturns(startingAmount, allocations, blockNumber);

            // We expect some ordinary income from treasuries each year, which should result in taxes.
            const totalTaxes = model.results.reduce((sum, yearResult) => sum + yearResult.taxes, 0);

            expect(model.results.length, `Block ${blockNumber} should have 10 years of results`).toBe(10);
            expect(totalTaxes, `Total taxes for block ${blockNumber} should be > 0`).toBeGreaterThan(0);
            expect(model.results[0].taxes, `First year taxes for block ${blockNumber} should be > 0`).toBeGreaterThan(0);
        }
    })
    it('check taxes for block 9 with 100% Treasuries', () => {
                const allocations: Allocation[] = [
            { key: 'treasury10Year', label: '10-Year Treasury', value: 100 }
        ];
        const startingAmount = 100000;
        const model = new ModelReturns(startingAmount, allocations, 9);

        // We expect some ordinary income from treasuries each year, which should result in taxes.
        const totalTaxes = model.results.reduce((sum, yearResult) => sum + yearResult.taxes, 0);
        expect(totalTaxes, `Total taxes for block 9 should be close to $8682.34`).toBeCloseTo(8682.34,2);
    })
    it('check taxes for block 9 with 100% baaCorp', () => {
                const allocations: Allocation[] = [
            { key: 'baaCorp', label: 'BAA Corporate Bonds', value: 100 }
        ];
        const startingAmount = 100000;
        const model = new ModelReturns(startingAmount, allocations, 9);

        // We expect some ordinary income from treasuries each year, which should result in taxes.
        const totalTaxes = model.results.reduce((sum, yearResult) => sum + yearResult.taxes, 0);
        expect(totalTaxes, `Total taxes for block 9 should be close to $8682.34`).toBeCloseTo(10112.48,2);
    })
})