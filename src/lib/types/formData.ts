import type { Forecast } from '$lib/forecastService';
import type { Allocation } from '$lib/modelReturns';

export interface FormData {
  success: boolean;
  forecasts: Forecast[];
  startingAmount: number;
  allocations: Allocation[];
  median: number;
  medianSeries: number[];
  q1: number;
  q1Series: number[];
  q3: number;
  q3Series: number[];
  averageCAGR: number;
  finalValueStdDev: number;
  error: string;
  options: [boolean, boolean, number, boolean];
}