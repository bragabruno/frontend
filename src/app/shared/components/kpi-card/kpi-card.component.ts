import { Component, input, computed } from '@angular/core';
import { NgIf, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { KpiData } from '../../../features/cases/services/kpi.service';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [NgIf, DecimalPipe, MatIconModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  kpi = input.required<KpiData>();

  changePercent = computed(() => {
    const k = this.kpi();
    if (k.previousValue === 0) return 0;
    return ((k.value - k.previousValue) / k.previousValue) * 100;
  });

  isPositive = computed(() => this.changePercent() >= 0);

  sparklinePath = computed(() => {
    const data = this.kpi().sparklineData;
    if (!data.length) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 120;
    const height = 40;
    const padding = 2;

    const points = data.map((val: number, i: number) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  });

  sparklineAreaPath = computed(() => {
    const data = this.kpi().sparklineData;
    if (!data.length) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 120;
    const height = 40;
    const padding = 2;

    const points = data.map((val: number, i: number) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M${padding},${height} L${points.join(' L')} L${width - padding},${height} Z`;
  });
}
