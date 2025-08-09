export type ForecastOptionsInterface = {
    rebalance: boolean;
    inflationAdjusted: boolean;
};

export class ForecastOptions {
    constructor(
        public rebalance: boolean = false,
        public inflationAdjusted: boolean = false
    ) {}

    public rebalanceOn() {
        this.rebalance = true;
    }
    public rebalanceOff() {
        this.rebalance = false; 
    }
    public adjustForInflationOn() {
        this.inflationAdjusted = true;
    }
    public adjustForInflationOff() {
        this.inflationAdjusted = false; 
    }
    public allOn() {
        this.rebalanceOn();
        this.adjustForInflationOn();
    }
    public allOff() {
        this.rebalanceOff();
        this.adjustForInflationOff();
    }
}