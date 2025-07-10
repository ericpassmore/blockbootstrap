/**
 * Defines the structure for a single asset's performance in a given year.
 */
export interface AnnualAssetPerformance {
	year: number;
	value: number; // The dollar The value of the asset for the upcoming year.
	returnPercentage: number; // The percentage return for that asset in that year
}

/**
 * A class to store and manage the annual returns for a single asset over time.
 */
export class AssetReturns {
	public readonly assetKey: string;
	public readonly assetLabel: string;
	public annualPerformance: AnnualAssetPerformance[] = [];

	constructor(assetKey: string, assetLabel:string) {
		this.assetKey = assetKey;
		this.assetLabel = assetLabel;
	}

	/**
	 * Adds a record of the asset's performance for a specific year.
	 * @param year The year of the performance data.
	 * @param value The value of the asset for the upcoming year.
	 * @param returnPercentage The percentage return of the asset for that year.
	 */
	public addRecord(year: number, value: number, returnPercentage: number): void {
		this.annualPerformance.push({ year, value, returnPercentage });
	}

    /** 
     * sum up the product of the values to return the total interest income 
    */
    public totalIncome(): number {
        return this.annualPerformance.reduce((sum, perf) => {
            return sum + perf.value * perf.returnPercentage/100 }, 0
        )
    }

}