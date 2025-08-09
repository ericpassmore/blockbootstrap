interface TaxBracket {
	rate: number;
	start: number;
	end: number;
}

export class Taxes {
	public longTermCapitalGainsTaxRate: number;
	public thresholdAGI_NIIT: number;
	public goldTaxRate: number = 28;
	public NIITRate: number = 3.8;
	public incomeTaxBrackets: TaxBracket[];

	constructor(thresholdAGI_NIIT: number = 600000, longTermCapitalGainsTaxRate: number = 20) {
		this.thresholdAGI_NIIT = thresholdAGI_NIIT;
		this.longTermCapitalGainsTaxRate = longTermCapitalGainsTaxRate;
		// 2025 Federal Income Tax Bracket Projections
		this.incomeTaxBrackets = [
			{ rate: 10, start: 0, end: 23850 },
			{ rate: 12, start: 23850, end: 96950 },
			{ rate: 22, start: 96950, end: 206700 },
			{ rate: 24, start: 206700, end: 394600 },
			{ rate: 32, start: 394600, end: 501050 },
			{ rate: 37, start: 501050, end: Infinity }
		];
	}

	calculateTaxes(ordinaryIncome: number, capitalGains: number, goldGains: number): number {
		const NIITRate = this.addNIIT(ordinaryIncome, capitalGains, goldGains) ? this.NIITRate : 0.0;
		const ordinaryTax = this.calculateOrdinaryIncomeTax(ordinaryIncome);
		const capitalGainsTax = capitalGains * ((this.longTermCapitalGainsTaxRate + NIITRate) / 100);
		const goldTax = goldGains * (this.goldTaxRate / 100);
		return ordinaryTax + capitalGainsTax + goldTax;
	}

	private calculateOrdinaryIncomeTax(income: number): number {
		let tax = 0;
		for (const bracket of this.incomeTaxBrackets) {
			if (income > bracket.start) {
				const taxableAmount = Math.min(income, bracket.end) - bracket.start;
				tax += taxableAmount * (bracket.rate / 100);
			}
		}
		return tax;
	}

	private addNIIT(ordinaryIncome: number, capitalGains: number, goldGains: number): boolean {
		return ordinaryIncome + capitalGains + goldGains > this.thresholdAGI_NIIT;
	}
}
