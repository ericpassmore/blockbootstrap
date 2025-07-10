import * as fs from 'fs';
import * as path from 'path';


export class ConstantRateReturns {
    private static constantYield: Map<number, number> = new Map();
    private static zeroYield = 0;

    /**
     * Initializes the service and loads data from the provided CSV file path.
     * The data file is expected to be at './data/' relative to this file.
     */
    static {
        // Construct the path to the CSV file, assuming it's in a 'data' subdirectory
        // relative to the location of this script.
        const csvFilePath = path.join('src/lib', 'data', 'ConstantRate10YrTreasuryYield.csv');
        ConstantRateReturns.loadDataFromCsv(csvFilePath);
    }

    public static getYield(key: number): number {
        return ConstantRateReturns.constantYield.get(key) || ConstantRateReturns.zeroYield;
    }

    /**
     * Reads the specified CSV file, parses its content, and populates the marketDataMap.
     * This method is called automatically by the constructor.
     * @param csvFilePath The absolute path to the CSV file.
     */
    private static loadDataFromCsv(csvFilePath: string): void {
        try {
            const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
            const lines = fileContent.split('\n');

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) {
                    continue; // Skip empty lines
                }

                // Replace any '#N/A' value with '1' before splitting into columns
                const values = trimmedLine.replace(/#N\/A/g, '0').split(',');
                const seriesKey = parseInt(values[0], 10);
                const constantYield = parseFloat(values[1]);
                ConstantRateReturns.constantYield.set(seriesKey, constantYield);
            }
        } catch (error) {
            console.error(`Error reading or parsing CSV file at ${csvFilePath}:`, error);
        }
    }
}
