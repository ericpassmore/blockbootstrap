export class Taxes {

	public ordinaryIncomeTaxRate: number;
	public longTermCapitalGainsTaxRate: number;
    public thresholdAGI_NIIT: number;
    public goldTaxRate: number = 28;
    public NIITRate: number = 3.8;


	constructor(ordinaryIncomeTaxRate: number = 0, 
        thresholdAGI_NIIT: number = 600000,
        longTermCapitalGainsTaxRate: number = 20
    ) {
		this.ordinaryIncomeTaxRate = ordinaryIncomeTaxRate;
        this.thresholdAGI_NIIT = thresholdAGI_NIIT;
		this.longTermCapitalGainsTaxRate = longTermCapitalGainsTaxRate;
	}

	calculateTaxes(
        ordinaryIncome: number, 
        capitalGains: number, 
        goldGains: number
    ): number {
        const NIITRate = this.addNIIT(ordinaryIncome, capitalGains, goldGains) ? this.NIITRate : 0.0;
		const ordinaryTax = ordinaryIncome * (this.ordinaryIncomeTaxRate / 100);
		const capitalGainsTax = capitalGains * ((this.longTermCapitalGainsTaxRate + NIITRate)/ 100);
        const goldTax = goldGains * (this.goldTaxRate / 100);
		return ordinaryTax + capitalGainsTax + goldGains;
	}

    private addNIIT(
	    ordinaryIncome: number,
	    capitalGains: number,
	    goldGains: number
    ): boolean {
	    return (ordinaryIncome + capitalGains + goldGains) > this.thresholdAGI_NIIT;
    }
}