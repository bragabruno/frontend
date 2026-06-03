import { Injectable } from '@angular/core';
import { of, delay } from 'rxjs';

export interface ChartDataPoint {
  name: string;
  value: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  getCaseStatusDistribution() {
    return of([
      { name: 'Open', value: 12 },
      { name: 'Assigned', value: 8 },
      { name: 'In Review', value: 15 },
      { name: 'Escalated', value: 3 },
      { name: 'Resolved Fraud', value: 6 },
      { name: 'Resolved Legit', value: 9 },
      { name: 'Closed', value: 20 },
    ]).pipe(delay(200));
  }

  getCasesBySeverity() {
    return of([
      { name: 'Critical', value: 8 },
      { name: 'High', value: 14 },
      { name: 'Medium', value: 18 },
      { name: 'Low', value: 7 },
    ]).pipe(delay(200));
  }

  getTopRulesTriggered() {
    return of([
      { name: 'Velocity > 5 txns/hr', value: 34 },
      { name: 'New device + high amount', value: 28 },
      { name: 'Geo anomaly', value: 21 },
      { name: 'Known fraud merchant', value: 15 },
      { name: 'Amount > $5000', value: 12 },
    ]).pipe(delay(200));
  }

  getCasesOverTime() {
    return of([
      {
        name: 'Mon',
        series: [
          { name: 'Fraud', value: 4 },
          { name: 'Legit', value: 8 },
        ],
      },
      {
        name: 'Tue',
        series: [
          { name: 'Fraud', value: 6 },
          { name: 'Legit', value: 12 },
        ],
      },
      {
        name: 'Wed',
        series: [
          { name: 'Fraud', value: 3 },
          { name: 'Legit', value: 10 },
        ],
      },
      {
        name: 'Thu',
        series: [
          { name: 'Fraud', value: 8 },
          { name: 'Legit', value: 15 },
        ],
      },
      {
        name: 'Fri',
        series: [
          { name: 'Fraud', value: 5 },
          { name: 'Legit', value: 11 },
        ],
      },
      {
        name: 'Sat',
        series: [
          { name: 'Fraud', value: 2 },
          { name: 'Legit', value: 6 },
        ],
      },
      {
        name: 'Sun',
        series: [
          { name: 'Fraud', value: 1 },
          { name: 'Legit', value: 4 },
        ],
      },
    ]).pipe(delay(200));
  }
}
