import * as fs from 'fs';
import * as path from 'path';

/**
 * Defines the structure for a single data point of market information for a year.
 * This interface is exported to be usable by other parts of the application.
 */
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
	bitcoin: number;
	internationalEquity: number;
	emergingMarkets: number;
	nasdaq100: number;
}

/**
 * A service class to load, parse, and provide access to market data from a CSV file.
 * This encapsulates the data loading logic and provides a clean API for accessing the data.
 */
export class BlockData {
	private static marketDataMap: Map<number, MarketData[]> = new Map();
	private static initialized = false;
	private static incompleteBlocks: number[] = [];

	/**
	 * Initializes the service and loads data from the provided CSV file path.
	 * The data file is expected to be at '/data/Fifty10YearBlocksFrom1970.csv' relative to this file.
	 */
	public static async init(envTarget: string = 'PROD'): Promise<void> {
		if (this.initialized) return;

		try {
			let fileContent: string;

			if (envTarget === 'PROD') {
				// Browser/SvelteKit environment
				const response = await fetch(
					'https://blockbootstrap.com/data/Fifty10YearBlocksFrom1970.csv'
				);
				fileContent = await response.text();
			} else {
				// Node/Vitest environment
				const filePath = path.join('static/data', 'Fifty10YearBlocksFrom1970.csv');
				fileContent = fs.readFileSync(filePath, 'utf-8');
			}

			const lines = fileContent.split('\n').slice(1); // Split by line and skip header

			for (const line of lines) {
				const trimmedLine = line.trim();
				if (!trimmedLine) {
					continue; // Skip empty lines
				}

				// Replace any '#N/A' value with '0' before splitting into columns
				const values = trimmedLine.replace(/#N\/A/g, '0').split(',');
				const seriesKey = this.safeParseInt(values[0]);
				// mark incomplete
				if (this.hasIncompleteData(trimmedLine)) {
					this.incompleteBlocks.push(seriesKey);
				}

				// could not find historical dividend yield for small cap so made a constant
				const marketData: MarketData = {
					year: this.safeParseInt(values[1]),
					sp500: this.safeParsePercentage(values[2]),
					usSmallCap: this.safeParsePercentage(values[3]),
					TBill: this.safeParsePercentage(values[4]),
					treasury10Year: this.safeParsePercentage(values[5]),
					baaCorp: this.safeParsePercentage(values[6]),
					realEstate: this.safeParsePercentage(values[7]),
					gold: this.safeParsePercentage(values[8]),
					inflation: this.safeParsePercentage(values[9]),
					sp500DividendYield: this.safeParsePercentage(values[10]),
					usSmallCapDividendYield: 1.5,
					bitcoin: this.safeParsePercentage(values[11]),
					internationalEquity: this.safeParsePercentage(values[12]),
					emergingMarkets: this.safeParsePercentage(values[13]),
					nasdaq100: this.safeParsePercentage(values[14])
				};

				const seriesData = this.marketDataMap.get(seriesKey) || [];
				seriesData.push(marketData);
				this.marketDataMap.set(seriesKey, seriesData);
			}

			this.initialized = true;
		} catch (error) {
			console.error(
				`Error reading or parsing CSV file at /data/Fifty10YearBlocksFrom1970.csv:`,
				error
			);
		}
	}

	/**
	 * Determins if a block has incomplete data
	 * @params an array of values for this year
	 * @returns boolean indicated the block has incomplete data
	 */
	private static hasIncompleteData(line: string) {
		let count = 0;
		for (const value of line.split(',')) {
			if (value.trim() === '#N/A') {
				count++;
			}
		}
		return count >= 8;
	}

	/**
	 * Retrieves the entire map of market data.
	 * @returns A Map where the key is the series number and the value is an array of MarketData.
	 */
	public static getAllData(excludeIncompleteBlocks: boolean = false): Map<number, MarketData[]> {
		if (!excludeIncompleteBlocks) {
			return this.marketDataMap;
		}
		const filteredMap = new Map<number, MarketData[]>();
		for (const [key, value] of this.marketDataMap.entries()) {
			if (!this.incompleteBlocks.includes(key)) {
				filteredMap.set(key, value);
			}
		}
		return filteredMap;
	}

	/**
	 * Retrieves a specific series of market data by its key.
	 * @param key The numeric key for the series.
	 * @returns An array of MarketData for the series, or undefined if not found.
	 */
	public static getSeries(key: number): MarketData[] | undefined {
		return this.marketDataMap.get(key);
	}

	/**
	 * calculated a historical year based on block number and block index
	 * @param blockNumber The 1-based block number (e.g., 1-50).
	 * @param yearIndex The 1-based index within the block (e.g., 1-10).
	 * @returns historical 4 digit year
	 * @throws {Error} if blockNumber or yearIndex are less than 1.
	 */
	public static getHistoricalYear(blockNumber: number, yearIndex: number): number {
		if (blockNumber < 1 || yearIndex < 1) {
			throw new Error('blockNumber and yearIndex must be 1-based and cannot be less than 1.');
		}
		return 1970 + (blockNumber - 1) + (yearIndex - 1);
	}

	/**
	 * Parses a string that should contain a number.
	 * @param value The string value to parse
	 * @returns The parsed floating-point number. Defaults to 0 when parsing error
	 */
	private static safeParseInt = (val: string) => {
		const parsed = parseInt(val, 10);
		return isNaN(parsed) ? 0 : parsed;
	};

	/**
	 * Parses a string that may contain a percentage sign and returns it as a float.
	 * @param value The string value to parse (e.g., "15.55%" or "-5.2%").
	 * @returns The parsed floating-point number.
	 */
	private static safeParsePercentage = (value: string) => {
		if (typeof value !== 'string') {
			return 1;
		}
		const parsed = parseFloat(value.replace('%', ''));
		return isNaN(parsed) ? 1 : parsed;
	};

	/**
	 * Return incomplete blocks
	 * @returns number[] list of deduped blocks
	 */
	public static getIncompleteBlocks(): number[] {
		return [...new Set(this.incompleteBlocks)];
	}
}
