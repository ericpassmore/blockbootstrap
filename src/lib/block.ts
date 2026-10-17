import marketDataCsv from '../../static/data/Fifty10YearBlocksFrom1970.csv?raw';

export interface MarketData {
	year: number;
	sp500: number;
	usSmallCap: number;
	TBill: number;
	treasury10Year: number;
	baaCorp: number;
	realEstate: number;
	gold: number;
	inflation: number;
	sp500DividendYield: number;
	usSmallCapDividendYield: number;
	'crypto:BTC': number;
	'crypto:ETH': number;
	'crypto:SOL': number;
	'crypto:XRP': number;
	internationalEquity: number;
	emergingMarkets: number;
	nasdaq100: number;
}

const columns = {
	sp500: 'S&P 500 (includes dividends)',
	usSmallCap: 'US Small cap (bottom decile)',
	TBill: '3-month T.Bill',
	treasury10Year: 'US T. Bond (10-year)',
	baaCorp: 'Baa Corporate Bond',
	realEstate: 'Real Estate',
	gold: 'Gold*',
	inflation: 'inflation',
	sp500DividendYield: 'SP500 Dividend Yield',
	'crypto:BTC': 'Bitcoin*',
	'crypto:ETH': 'Ethereum',
	'crypto:XRP': 'XRP',
	'crypto:SOL': 'SOL',
	internationalEquity: 'International Stocks',
	emergingMarkets: 'Emerging Markets',
	nasdaq100: 'NASDAQ 100'
} as const;

/** Local historical returns, stored in percentage points. */
export class BlockData {
	private static marketDataMap: Map<number, MarketData[]> = new Map();
	private static initialized = false;
	private static initialization: Promise<void> | undefined;
	private static incompleteBlocks: number[] = [];
	private static missingAssets: Map<number, Set<keyof MarketData>> = new Map();

	/** Bundles local CSV data; the optional environment argument is retained for callers. */
	public static init(): Promise<void>;
	public static init(environment: string): Promise<void>;
	public static async init(): Promise<void> {
		if (this.initialized) return;
		if (!this.initialization) {
			this.initialization = Promise.resolve().then(() => this.load(marketDataCsv));
		}
		try {
			await this.initialization;
		} finally {
			this.initialization = undefined;
		}
	}

	private static load(fileContent: string): void {
		const [header, ...lines] = fileContent.trim().split(/\r?\n/);
		const headers = header.split(',').map((value) => value.trim());
		const required = ['Series', 'Year', ...Object.values(columns)];
		for (const name of required) {
			if (headers.filter((value) => value === name).length !== 1) {
				throw new Error(`Missing or duplicate market data column: ${name}`);
			}
		}
		const data = new Map<number, MarketData[]>();
		const missing = new Map<number, Set<keyof MarketData>>();
		const incomplete = new Set<number>();
		for (const line of lines) {
			if (!line.trim()) continue;
			const values = line.split(',').map((value) => value.trim());
			if (values.length !== headers.length) throw new Error('Malformed market data row');
			const series = Number(values[headers.indexOf('Series')]);
			const year = Number(values[headers.indexOf('Year')]);
			if (
				!Number.isInteger(series) ||
				series < 1 ||
				!Number.isInteger(year) ||
				year < 1 ||
				year > 10
			) {
				throw new Error('Invalid market data series or year');
			}
			const marketData = { year, usSmallCapDividendYield: 1.5 } as MarketData;
			const missingInBlock = missing.get(series) ?? new Set<keyof MarketData>();
			let hasObservedReturn = false;
			for (const [key, name] of Object.entries(columns)) {
				const raw = values[headers.indexOf(name)];
				const parsed = raw === '' || raw === '#N/A' ? NaN : Number(raw.replace(/%$/, ''));
				const asset = key as keyof typeof columns;
				marketData[asset] = Number.isFinite(parsed) ? parsed : 0;
				if (!Number.isFinite(parsed)) missingInBlock.add(asset);
				else if (asset !== 'inflation' && asset !== 'sp500DividendYield') hasObservedReturn = true;
			}
			missing.set(series, missingInBlock);
			// Auxiliary data alone cannot make an otherwise unavailable future year complete.
			if (!hasObservedReturn) incomplete.add(series);
			const block = data.get(series) ?? [];
			if (block.some((row) => row.year === year)) throw new Error('Duplicate market data year');
			block.push(marketData);
			data.set(series, block);
		}
		if (data.size === 0) throw new Error('Market data contains no blocks');
		for (const [series, block] of data) {
			block.sort((a, b) => a.year - b.year);
			if (block.length !== 10) incomplete.add(series);
		}
		// Publish only after every row has parsed successfully.
		this.marketDataMap = data;
		this.missingAssets = missing;
		this.incompleteBlocks = [...incomplete];
		this.initialized = true;
	}

	public static getAllData(excludeIncompleteBlocks: boolean = false): Map<number, MarketData[]> {
		if (!excludeIncompleteBlocks) return this.marketDataMap;
		return new Map([...this.marketDataMap].filter(([key]) => !this.incompleteBlocks.includes(key)));
	}

	/** Required noncrypto inputs must have observations for all ten years.
	 * Missing crypto history intentionally earns a flat nominal return.
	 * Callers add auxiliary inputs such as inflation and dividend yield when required.
	 */
	public static getEligibleBlockNumbers(assetKeys: (keyof MarketData)[]): number[] {
		const required = assetKeys.filter((key) => !key.startsWith('crypto:'));
		return [...this.getAllData(true).keys()].filter((series) =>
			required.every((key) => !this.missingAssets.get(series)?.has(key))
		);
	}

	/** Missing observations remain distinct from observed zero values in the numeric data. */
	public static hasMissingData(series: number, key: keyof MarketData): boolean {
		return this.missingAssets.get(series)?.has(key) ?? false;
	}

	public static getSeries(key: number): MarketData[] | undefined {
		return this.marketDataMap.get(key);
	}

	public static getHistoricalYear(blockNumber: number, yearIndex: number): number {
		if (blockNumber < 1 || yearIndex < 1) {
			throw new Error('blockNumber and yearIndex must be 1-based and cannot be less than 1.');
		}
		return 1970 + (blockNumber - 1) + (yearIndex - 1);
	}

	public static getIncompleteBlocks(): number[] {
		return [...this.incompleteBlocks];
	}
}
