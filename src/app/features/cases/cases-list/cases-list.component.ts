import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf, NgFor, NgClass, DatePipe, SlicePipe, CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { CasesService } from '../services/cases.service';
import { KpiService, KpiData } from '../services/kpi.service';
import { SseService } from '../../../core/sse/sse.service';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { DashboardChartsComponent } from '../../../shared/components/dashboard-charts/dashboard-charts.component';
import { CaseSummaryDto, CaseStatus, Severity, PageResponse } from '../../../shared/models/models';
import { formatSlaDue } from '../../../shared/utils/utils';

@Component({
  selector: 'app-cases-list',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    DatePipe,
    SlicePipe,
    CurrencyPipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    FormsModule,
    KpiCardComponent,
    DashboardChartsComponent,
  ],
  templateUrl: './cases-list.component.html',
  styleUrl: './cases-list.component.scss',
})
export class CasesListComponent implements OnInit, OnDestroy {
  displayedColumns = [
    'expand',
    'severity',
    'id',
    'status',
    'transactionAmount',
    'assignee',
    'openedAt',
    'sla',
  ];
  cases = signal<CaseSummaryDto[]>([]);
  kpis = signal<KpiData[]>([]);
  totalElements = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);
  page = 0;
  pageSize = 20;
  statusFilter: CaseStatus | '' = '';
  severityFilter: Severity | '' = '';
  newCaseIds = signal<Set<string>>(new Set());
  expandedCaseId = signal<string | null>(null);

  statusOptions: CaseStatus[] = [
    'OPEN',
    'ASSIGNED',
    'IN_REVIEW',
    'ESCALATED',
    'RESOLVED_FRAUD',
    'RESOLVED_LEGIT',
    'CLOSED',
  ];
  severityOptions: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  private effectRef: import('@angular/core').EffectRef | null = null;

  constructor(
    private casesService: CasesService,
    private kpiService: KpiService,
    private sseService: SseService,
    private router: Router,
  ) {
    // effect() must be created in an injection context (constructor), not ngOnInit.
    this.setupSseUpdates();
  }

  ngOnInit(): void {
    this.loadCases();
    this.loadKpis();
  }

  ngOnDestroy(): void {
    this.effectRef?.destroy();
  }

  private setupSseUpdates(): void {
    this.effectRef = effect(() => {
      const updates = this.sseService.caseUpdates();
      if (updates.size > 0) {
        this.mergeUpdates();
      }
    });
  }

  private mergeUpdates(): void {
    const updates = this.sseService.caseUpdates();
    if (updates.size === 0) return;

    this.cases.update((current) => {
      const newCases = [...current];
      const newIds = new Set<string>();

      updates.forEach((updatedCase, caseId) => {
        const index = newCases.findIndex((c) => c.id === caseId);
        if (index >= 0) {
          newCases[index] = { ...newCases[index], ...updatedCase };
        } else {
          newCases.unshift(updatedCase);
          newIds.add(caseId);
        }
      });

      this.newCaseIds.set(newIds);
      setTimeout(() => this.newCaseIds.set(new Set()), 3000);
      return newCases;
    });
  }

  loadKpis(): void {
    this.kpiService.getKpis().subscribe({
      next: (kpis) => this.kpis.set(kpis),
      error: () => {},
    });
  }

  loadCases(): void {
    this.loading.set(true);
    this.error.set(null);
    const params: Record<string, unknown> = {
      page: this.page,
      size: this.pageSize,
    };
    if (this.statusFilter) params['status'] = this.statusFilter;
    if (this.severityFilter) params['severity'] = this.severityFilter;

    this.casesService.getCases(params as Parameters<CasesService['getCases']>[0]).subscribe({
      next: (res: PageResponse<CaseSummaryDto>) => {
        this.cases.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message ?? 'Failed to load cases');
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCases();
  }

  onFilterChange(): void {
    this.page = 0;
    this.loadCases();
  }

  onSort(sort: Sort): void {
    const data = [...this.cases()];
    if (sort.active && sort.direction) {
      data.sort((a, b) => {
        const sevOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        if (sort.active === 'severity') {
          return sort.direction === 'asc'
            ? (sevOrder[a.severity] ?? 0) - (sevOrder[b.severity] ?? 0)
            : (sevOrder[b.severity] ?? 0) - (sevOrder[a.severity] ?? 0);
        }
        return 0;
      });
    }
    this.cases.set(data);
  }

  toggleExpand(caseItem: CaseSummaryDto, event: Event): void {
    event.stopPropagation();
    this.expandedCaseId.update((current) => (current === caseItem.id ? null : caseItem.id));
  }

  isExpanded(caseId: string): boolean {
    return this.expandedCaseId() === caseId;
  }

  onRowClick(caseItem: CaseSummaryDto): void {
    this.router.navigate(['/cases', caseItem.id]);
  }

  getSlaInfo(slaDueAt: string | null): { text: string; class: string } {
    return formatSlaDue(slaDueAt);
  }

  isNewCase(caseId: string): boolean {
    return this.newCaseIds().has(caseId);
  }

  getSeverityIcon(severity: Severity): string {
    switch (severity) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'check_circle';
    }
  }
}
