import { readFile } from 'fs/promises';

export class ConstantRateReturns {
    private static treasuryYield: Map<number, number> = new Map();
    private static baaCorpYield: Map<number, number> = new Map();
    private static zeroYield = 0;
    private static initialized = false;

    /**
     * Initializes the class by fetching and parsing the CSV data.
     * This must be called once before using getYield().
     */
    public static async init(): Promise<void> {
        if (this.initialized) return;

        try {

            let fileContent: string;
            
            if (typeof window === 'undefined') {
                // Node/Vitest environment
                const filePath = new URL('../../static/data/MarketYields.csv', import.meta.url);
                fileContent = await readFile(filePath, 'utf-8');
            } else {
                // Browser/SvelteKit environment
                const response = await fetch('/data/MarketYields.csv');
                fileContent = await response.text();
            }

            const lines = fileContent.split('\n');

            // Parse rows (skip header line)
            for (let i = 1; i < lines.length; i++) {
                const trimmedLine = lines[i].trim();
                if (!trimmedLine) continue;

                const values = trimmedLine.replace(/#N\/A/g, '0').split(',');
                if (values.length < 3) continue;

                const year = parseInt(values[0], 10);
                const treasuryYield = parseFloat(values[1]);
                const baaCorpYield = parseFloat(values[2]);

                this.treasuryYield.set(year, treasuryYield);
                this.baaCorpYield.set(year, baaCorpYield);
            }

            this.initialized = true;
        } catch (error) {
            console.error(`Error fetching or parsing /data/MarketYields.csv:`, error);
        }
    }
    /**
     * Gets the years stored for testing purposes
     * @returns years number[]
     */
    public static getYears(): number[] {
        return Array.from(this.treasuryYield.keys());
    }

    /**
     * Returns the yield for the specified year and asset type.
     */
    public static getYield(
        key: number,
        assetType: 'treasury10Year' | 'baaCorp'
    ): number {
        if (assetType === 'treasury10Year') {
            return this.treasuryYield.get(key) ?? this.zeroYield;
        } else if (assetType === 'baaCorp') {
            return this.baaCorpYield.get(key) ?? this.zeroYield;
        }
        return this.zeroYield;
    }
}
