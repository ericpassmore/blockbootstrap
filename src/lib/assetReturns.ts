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
	 * If negative return purchase is zero amount 
	 * @param year The year of the performance data.
	 * @param value The value of the asset for the upcoming year.
	 * @param returnPercentage The percentage return of the asset for that year.
	 */
	public addRecord(year: number, assetPurchase: number, returnPercentage: number): void {
		const value = assetPurchase>0 ? assetPurchase : 0
		this.annualPerformance.push({ year, value, returnPercentage });
	}

	/**
	 * Retrieves amount invested in a specific year.
	 * @param year The year of the performance data.
	 * @returns The amount invested in a specific year.
	 *          if no records returns zero
	 */
	public getAssetValue (year: number): number {
		const performance = this.annualPerformance.find((perf) => perf.year === year);
		if (performance) {
			return performance.value
		}
		return 0
	}

	/**
	 * Retrieves change in value of the asset for the specificed year.
	 * @param year The year of the performance data.
	 * @returns The change in value of the asset for the specified year.
	 *          if no records returns zero
	 */
	public getChangeInValue (year: number): number {
		const performance = this.annualPerformance.find((perf) => perf.year === year);
		if (performance) {
			return performance.value * performance.returnPercentage/100
		}
		return 0
	}

	/**
	 * check if there are any records to processes
	 * @returns true of there are records otherwise false
	 */
	public hasRecords(): boolean {
		return this.annualPerformance.length > 0
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