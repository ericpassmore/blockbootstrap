import { beforeAll, describe, it, expect } from 'vitest';
import { ConstantRateReturns } from '$lib/constantRateReturns';
import { BlockData } from '$lib/block';
import { AssetReturns } from '$lib/assetReturns';

beforeAll(async () => {
    await ConstantRateReturns.init('TEST');
    await BlockData.init('TEST')
});



describe('Value Treasury Rates', () => {
    it('all greater then zero', () => {
        for (const year of ConstantRateReturns.getYears()) {
            expect(ConstantRateReturns.getYield(year, 'treasury10Year')).toBeGreaterThan(0);
        }
    });
    it('first and last values ok', () => {
        expect(ConstantRateReturns.getYield(1970, 'treasury10Year')).toBeCloseTo(7.79, 2);
        expect(ConstantRateReturns.getYield(2025, 'treasury10Year')).toBeCloseTo(4.63, 2);
    })
});

describe('Value Market Data', () => {
    it('all greater then zero', () => {
        for (let id = 1; id <= 46; id++) {
            const block = BlockData.getSeries(id)
            expect(block).toBeDefined()
            if (!block) return;
            for (const year of block) {
                expect(year.treasury10Year).not.toBeNaN()
                expect(year.treasury10Year).not.toBe(0)

                expect(year.usSmallCap).not.toBeNaN()
                expect(year.usSmallCap).not.toBe(0)

                expect(year.sp500).not.toBeNaN()
                expect(year.sp500).not.toBe(0)

                expect(year.sp500DividendYield).not.toBeNaN()
                expect(year.sp500DividendYield).toBeGreaterThan(0)

                expect(year.baaCorp).not.toBeNaN()
                expect(year.baaCorp).not.toBe(0)

                expect(year.TBill).not.toBeNaN()
                expect(year.TBill).toBeGreaterThan(0)

                expect(year.gold).not.toBeNaN()
                expect(year.gold).not.toBe(0)

                expect(year.inflation).not.toBeNaN()
                expect(year.inflation).toBeGreaterThan(0)

                expect(year.realEstate).not.toBeNaN()
                expect(year.realEstate).not.toBe(0)

                expect(year.bitcoin).not.toBeNaN()
                expect(year.bitcoin).not.toBe(0)

                expect(year.internationalEquity).not.toBeNaN()
                expect(year.internationalEquity).not.toBe(0)

                expect(year.emergingMarkets).not.toBeNaN()
                expect(year.emergingMarkets).not.toBe(0)

                expect(year.nasdaq100).not.toBeNaN()
                expect(year.nasdaq100).not.toBe(0)
            }
        }
    });
    it('first and last values ok', () => {
        // first year 
        const firstYear = BlockData.getSeries(1)?.[0]
        expect(firstYear).toBeDefined()
        if (!firstYear) return;
        expect(firstYear.treasury10Year).toBeCloseTo(16.75, 2)
        expect(firstYear.usSmallCap).toBeCloseTo(-19.00)
        expect(firstYear.sp500).toBeCloseTo(3.56)
        expect(firstYear.sp500DividendYield).toBeCloseTo(3.46)
        expect(firstYear.baaCorp).toBeCloseTo(5.65)
        expect(firstYear.TBill).toBeCloseTo(6.39)
        expect(firstYear.gold).toBeCloseTo(-9.45)
        expect(firstYear.inflation).toBeCloseTo(5.57)
        expect(firstYear.realEstate).toBeCloseTo(8.22)
        expect(firstYear.bitcoin).toBe(1)
        // last entry N/A == 0
        const lastBlockId = BlockData.getAllData().size;
        const lastYear = BlockData.getSeries(lastBlockId)?.[9];
        expect(lastYear).toBeDefined()
        if (!lastYear) return;
        expect(lastYear.treasury10Year).toBe(0)
        expect(lastYear.sp500).toBe(0)
        expect(lastYear.sp500DividendYield).toBe(0)
        expect(lastYear.baaCorp).toBe(0)
        expect(lastYear.TBill).toBe(0)
        expect(lastYear.gold).toBe(0)
        expect(lastYear.inflation).toBe(0)
        expect(lastYear.realEstate).toBe(0)
        expect(lastYear.bitcoin).toBe(0)
    })
});

describe('Asset Returns', () => {
    const treasuryPurchases: AssetReturns = new AssetReturns('treasury10Year', '10 Year Treasury');
    it('initial totals match expected', () => {
        treasuryPurchases.addRecord(1970, 10000, 7.79)
        expect(treasuryPurchases.totalIncome()).toBeCloseTo(10000 * 7.79 / 100)
    })
})

