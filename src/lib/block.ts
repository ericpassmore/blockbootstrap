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
  bitcoin: number;
}

/**
 * A service class to load, parse, and provide access to market data from a CSV file.
 * This encapsulates the data loading logic and provides a clean API for accessing the data.
 */
export class MarketDataService {
  private marketDataMap: Map<number, MarketData[]> = new Map();

  /**
   * Initializes the service and loads data from the provided CSV file path.
   * The data file is expected to be at './data/Fifty10YearBlocksFrom1970.csv' relative to this file.
   */
  constructor() {
    // Construct the path to the CSV file, assuming it's in a 'data' subdirectory
    // relative to the location of this script.
    const csvFilePath = path.join('src/lib', 'data', 'Fifty10YearBlocksFrom1970.csv');
    this.loadDataFromCsv(csvFilePath);
  }

  /**
   * Retrieves the entire map of market data.
   * @returns A Map where the key is the series number and the value is an array of MarketData.
   */
  public getAllData(): Map<number, MarketData[]> {
    return this.marketDataMap;
  }

  /**
   * Retrieves a specific series of market data by its key.
   * @param key The numeric key for the series.
   * @returns An array of MarketData for the series, or undefined if not found.
   */
  public getSeries(key: number): MarketData[] | undefined {
    return this.marketDataMap.get(key);
  }

  /**
   * calculated a historical year based on block number and block index
   * @param blockNumber The 1-based block number (e.g., 1-50).
   * @param yearIndex The 1-based index within the block (e.g., 1-10).
   * @returns historical 4 digit year
   * @throws {Error} if blockNumber or yearIndex are less than 1.
   */
  public getHistoricalYear(blockNumber: number, yearIndex: number): number {
    if (blockNumber < 1 || yearIndex < 1) {
      throw new Error('blockNumber and yearIndex must be 1-based and cannot be less than 1.');
    }
    return 1970 + (blockNumber - 1) + (yearIndex - 1 );
  }

  /**
   * Parses a string that may contain a percentage sign and returns it as a float.
   * @param value The string value to parse (e.g., "15.55%" or "-5.2%").
   * @returns The parsed floating-point number.
   */
  private parsePercentage(value: string): number {
    if (typeof value !== 'string') {
      return NaN;
    }
    return parseFloat(value.replace('%', ''));
  }

  /**
   * Reads the specified CSV file, parses its content, and populates the marketDataMap.
   * This method is called automatically by the constructor.
   * @param csvFilePath The absolute path to the CSV file.
   */
  private loadDataFromCsv(csvFilePath: string): void {
    try {
      const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
      const lines = fileContent.split('\n').slice(1); // Split by line and skip header

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          continue; // Skip empty lines
        }

        // Replace any '#N/A' value with '1' before splitting into columns
        const values = trimmedLine.replace(/#N\/A/g, '0').split(',');
        const seriesKey = parseInt(values[0], 10);

        const marketData: MarketData = {
          year: parseInt(values[1], 10),
          sp500: this.parsePercentage(values[2]),
          usSmallCap: this.parsePercentage(values[3]),
          TBill: this.parsePercentage(values[4]),
          treasury10Year: this.parsePercentage(values[5]),
          baaCorp: this.parsePercentage(values[6]),
          realEstate: this.parsePercentage(values[7]),
          gold: this.parsePercentage(values[8]),
          inflation: this.parsePercentage(values[9]),
          sp500DividendYield: this.parsePercentage(values[10]),
          bitcoin: this.parsePercentage(values[11]),
        };

        const seriesData = this.marketDataMap.get(seriesKey) || [];
        seriesData.push(marketData);
        this.marketDataMap.set(seriesKey, seriesData);
      }
    } catch (error) {
      console.error(`Error reading or parsing CSV file at ${csvFilePath}:`, error);
    }
  }
}

export const blockData = new MarketDataService();
