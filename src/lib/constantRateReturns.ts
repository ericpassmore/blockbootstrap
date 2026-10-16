import marketYieldsCsv from '../../static/data/MarketYields.csv?raw';

export class ConstantRateReturns {
	private static treasuryYield: Map<number, number> = new Map();
	private static baaCorpYield: Map<number, number> = new Map();
	private static zeroYield = 0;
	private static initialized = false;
	private static initialization: Promise<void> | undefined;

	/** Loads yields from the bundled local CSV; concurrent callers share one load. */
	public static init(): Promise<void>;
	public static init(environment: string): Promise<void>;
	public static async init(): Promise<void> {
		if (this.initialized) return;
		if (!this.initialization) {
			this.initialization = Promise.resolve().then(() => this.load(marketYieldsCsv));
		}
		try {
			await this.initialization;
		} finally {
			this.initialization = undefined;
		}
	}

	private static load(fileContent: string): void {
		const [header, ...lines] = fileContent.trim().split(/\r?\n/);
		if (header.trim() !== 'Year,GS10,baaCorp') throw new Error('Invalid market yields header');
		const treasuryYields = new Map<number, number>();
		const baaYields = new Map<number, number>();
		for (const line of lines) {
			if (!line.trim()) continue;
			const values = line.split(',').map((value) => value.trim());
			const [year, treasuryYield, baaYield] = values.map(Number);
			if (
				values.length !== 3 ||
				values.some((value) => value === '') ||
				!Number.isInteger(year) ||
				year < 1 ||
				!Number.isFinite(treasuryYield) ||
				!Number.isFinite(baaYield) ||
				treasuryYields.has(year)
			) {
				throw new Error('Invalid or duplicate market yields row');
			}
			treasuryYields.set(year, treasuryYield);
			baaYields.set(year, baaYield);
		}
		if (treasuryYields.size === 0) throw new Error('Market yields contain no observations');
		this.treasuryYield = treasuryYields;
		this.baaCorpYield = baaYields;
		this.initialized = true;
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
	public static getYield(key: number, assetType: 'treasury10Year' | 'baaCorp'): number {
		if (assetType === 'treasury10Year') {
			return this.treasuryYield.get(key) ?? this.zeroYield;
		} else if (assetType === 'baaCorp') {
			return this.baaCorpYield.get(key) ?? this.zeroYield;
		}
		return this.zeroYield;
	}
}
