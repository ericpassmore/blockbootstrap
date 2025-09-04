import { describe, it, expect } from 'vitest';
import { cryptoAssetClassMock } from '../../tests/mocks/cryptoAssetClassMock';

describe('CryptoAssetClass', () => {
	it('should return correct genesis date for valid symbol', () => {
		const genesisDate = cryptoAssetClassMock.getGenesisDate('SOL');
		expect(genesisDate).toEqual(new Date('2020-03-16'));
	});

	it('should return undefined for invalid symbol', () => {
		const genesisDate = cryptoAssetClassMock.getGenesisDate('INVALID');
		expect(genesisDate).toBeUndefined();
	});
});
