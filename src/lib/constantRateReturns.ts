import * as fs from 'fs';
import * as path from 'path';


export class ConstantRateReturns {
    private static treasuryYield: Map<number, number> = new Map();
    private static baaCorpYield: Map<number, number> = new Map();
    private static zeroYield = 0;

    /**
     * Initializes the service and loads data from the provided CSV file path.
     * The data file is expected to be at './data/' relative to this file.
     */
    static {
        // Construct the path to the CSV file, assuming it's in a 'data' subdirectory
        // relative to the location of this script.
        const csvFilePath = path.join('src/lib', 'data', 'MarketYields.csv');
        ConstantRateReturns.loadDataFromCsv(csvFilePath);
    }

    public static getYield(key: number, assetType: 'treasury10Year' | 'baaCorp'): number {
        if (assetType === 'treasury10Year') {
            return ConstantRateReturns.treasuryYield.get(key) || ConstantRateReturns.zeroYield;
        } else if (assetType === 'baaCorp') {
            return ConstantRateReturns.baaCorpYield.get(key) || ConstantRateReturns.zeroYield;
        }
        return ConstantRateReturns.zeroYield;
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

            // Start from index 1 to skip the first line
            for (let i = 1; i < lines.length; i++) {
                const trimmedLine = lines[i].trim();
                if (!trimmedLine) {
                    continue; // Skip empty lines
                }

                // Replace any '#N/A' value with '0' before splitting into columns
                const values = trimmedLine.replace(/#N\/A/g, '0').split(',');
                if (values.length < 3) {
                    continue; // Skip lines that don't have enough columns
                }

                const year = parseInt(values[0], 10);
                const treasuryYield = parseFloat(values[1]); // GS10
                const baaCorpYield = parseFloat(values[2]); // baaCorp

                ConstantRateReturns.treasuryYield.set(year, treasuryYield);
                ConstantRateReturns.baaCorpYield.set(year, baaCorpYield);
            }
        } catch (error) {
            console.error(`Error reading or parsing CSV file at ${csvFilePath}:`, error);
        }
    }
}
