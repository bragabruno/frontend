import { Component, OnInit, signal } from '@angular/core';
import { NgFor } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import {
  DashboardService,
  ChartDataPoint,
} from '../../../features/cases/services/dashboard.service';

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [NgFor, NgxChartsModule],
  templateUrl: './dashboard-charts.component.html',
  styleUrl: './dashboard-charts.component.scss',
})
export class DashboardChartsComponent implements OnInit {
  statusDistribution = signal<ChartDataPoint[]>([]);
  severityData = signal<ChartDataPoint[]>([]);
  topRules = signal<ChartDataPoint[]>([]);

  colorScheme = {
    name: 'dark',
    selectable: true,
    group: 'Ordinal' as any,
    domain: ['#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#ef4444', '#22c55e', '#6b7280'],
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getCaseStatusDistribution().subscribe((data) => {
      this.statusDistribution.set(data);
    });
    this.dashboardService.getCasesBySeverity().subscribe((data) => {
      this.severityData.set(data);
    });
    this.dashboardService.getTopRulesTriggered().subscribe((data) => {
      this.topRules.set(data);
    });
  }
}
