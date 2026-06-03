import { Injectable } from '@angular/core';
import { of, delay } from 'rxjs';

export interface KpiData {
  label: string;
  value: number;
  previousValue: number;
  suffix?: string;
  prefix?: string;
  color: string;
  sparklineData: number[];
}

@Injectable({ providedIn: 'root' })
export class KpiService {
  getKpis() {
    const kpis: KpiData[] = [
      {
        label: 'Open Cases',
        value: 47,
        previousValue: 38,
        color: '#3b82f6',
        sparklineData: [12, 15, 18, 14, 20, 22, 19, 25, 28, 30, 35, 38, 42, 47],
      },
      {
        label: 'Critical',
        value: 8,
        previousValue: 5,
        color: '#ef4444',
        sparklineData: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8],
      },
      {
        label: 'Resolved Today',
        value: 23,
        previousValue: 18,
        color: '#22c55e',
        sparklineData: [8, 10, 12, 14, 11, 15, 17, 16, 19, 20, 22, 23],
      },
      {
        label: 'Avg SLA',
        value: 92,
        suffix: '%',
        previousValue: 88,
        color: '#a855f7',
        sparklineData: [80, 82, 85, 83, 87, 86, 89, 88, 90, 91, 92, 92],
      },
      {
        label: 'Fraud Rate',
        value: 3.2,
        suffix: '%',
        previousValue: 4.1,
        color: '#f59e0b',
        sparklineData: [5.1, 4.8, 4.5, 4.2, 4.0, 3.8, 3.6, 3.5, 3.4, 3.3, 3.2, 3.2],
      },
      {
        label: 'Pending Review',
        value: 15,
        previousValue: 12,
        color: '#06b6d4',
        sparklineData: [6, 7, 8, 9, 8, 10, 11, 10, 12, 13, 14, 15],
      },
    ];

    return of(kpis).pipe(delay(300));
  }
}
