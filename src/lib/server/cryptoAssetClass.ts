import { cryptoGenesisDates } from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class cryptoAssetClass {
	private static assets: Map<
		string,
		{
			symbol: string;
			genesisDate: Date;
		}
	> = new Map();

	// Load assets from database table crypto_genesis_dates
	public static async loadAssets(db: NodePgDatabase<Record<string, never>>): Promise<void> {
		const result = await db.select().from(cryptoGenesisDates);
		this.assets.clear();
		for (const row of result) {
			if (row.symbol && row.genesis_date) {
				this.assets.set(row.symbol, {
					symbol: row.symbol,
					genesisDate: new Date(row.genesis_date)
				});
			}
		}
	}

	// Get genesis date for a symbol
	public static getGenesisDate(symbol: string): Date | undefined {
		const asset = this.assets.get(symbol);
		return asset?.genesisDate;
	}
}
