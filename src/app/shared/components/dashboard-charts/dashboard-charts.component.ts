import { Component, OnInit, signal } from '@angular/core';
import { NgFor } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
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

  // Moonlight ordinal scheme for the charts.
  colorScheme: Color = {
    name: 'moonlight',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [
      '#82aaff',
      '#c099ff',
      '#ffc777',
      '#4fd6be',
      '#ff757f',
      '#c3e88d',
      '#86e1fc',
      '#636da6',
    ],
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
