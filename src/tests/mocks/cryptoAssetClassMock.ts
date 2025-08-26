export const cryptoAssetClassMock = {
	getGenesisDate(symbol: string): Date | undefined {
		const assets = new Map([
			[
				'SOL',
				{
					symbol: 'SOL',
					genesisDate: new Date('2020-03-16')
				}
			],
			[
				'BTC',
				{
					symbol: 'BTC',
					genesisDate: new Date('2009-01-03')
				}
			]
		]);
		const asset = assets.get(symbol);
		return asset?.genesisDate;
	}
};