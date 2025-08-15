export type ReturnWindow = 10 | 20 | 30;

export type ForecastOptionsInterface = {
	rebalance: boolean;
	inflationAdjusted: boolean;
	returnWindow: ReturnWindow;
};

export class ForecastOptions {
	public returnWindow: ReturnWindow;

	constructor(
		public rebalance: boolean = false,
		public inflationAdjusted: boolean = false,
		returnWindow: number = 10
	) {
		this.returnWindow = this.sanitizeReturnWindow(returnWindow);
	}

	private sanitizeReturnWindow(value: number): ReturnWindow {
		return [10, 20, 30].includes(value) ? (value as ReturnWindow) : 10;
	}

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

	// Optional setter to enforce the restriction at runtime
	public setReturnWindow(value: number) {
		this.returnWindow = this.sanitizeReturnWindow(value);
	}
}
