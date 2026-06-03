import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { CasesListComponent } from './cases-list.component';
import { CasesService } from '../services/cases.service';
import { KpiService } from '../services/kpi.service';
import { SseService } from '../../../core/sse/sse.service';
import { CaseSummaryDto, PageResponse } from '../../../shared/models/models';

function makeCase(id: string, severity: CaseSummaryDto['severity']): CaseSummaryDto {
  return {
    id,
    transactionId: 't-' + id,
    riskScoreId: null,
    assigneeId: null,
    status: 'OPEN',
    severity,
    openedAt: '2026-01-01T00:00:00Z',
    slaDueAt: null,
    resolvedAt: null,
  };
}

function page(content: CaseSummaryDto[]): PageResponse<CaseSummaryDto> {
  return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1 };
}

describe('CasesListComponent', () => {
  let casesService: jasmine.SpyObj<CasesService>;
  let kpiService: jasmine.SpyObj<KpiService>;
  let router: jasmine.SpyObj<Router>;

  function createComponent(): CasesListComponent {
    const fixture = TestBed.createComponent(CasesListComponent);
    fixture.detectChanges(); // triggers ngOnInit + the SSE effect
    return fixture.componentInstance;
  }

  beforeEach(() => {
    casesService = jasmine.createSpyObj<CasesService>('CasesService', ['getCases']);
    kpiService = jasmine.createSpyObj<KpiService>('KpiService', ['getKpis']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    casesService.getCases.and.returnValue(of(page([makeCase('c1', 'HIGH')])));
    kpiService.getKpis.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [CasesListComponent],
      providers: [
        provideNoopAnimations(),
        { provide: CasesService, useValue: casesService },
        { provide: KpiService, useValue: kpiService },
        // SSE is only read as a signal here; provide an inert empty stream.
        {
          provide: SseService,
          useValue: { caseUpdates: signal(new Map<string, CaseSummaryDto>()) },
        },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('loads cases and KPIs on init from the (role-scoped) API', () => {
    const component = createComponent();
    expect(casesService.getCases).toHaveBeenCalledTimes(1);
    expect(kpiService.getKpis).toHaveBeenCalledTimes(1);
    expect(component.cases().length).toBe(1);
    expect(component.totalElements()).toBe(1);
    expect(component.loading()).toBeFalse();
  });

  it('reflects status and severity filters and resets to the first page', () => {
    const component = createComponent();
    casesService.getCases.calls.reset();

    component.statusFilter = 'OPEN';
    component.severityFilter = 'CRITICAL';
    component.page = 3;
    component.onFilterChange();

    expect(component.page).toBe(0);
    expect(casesService.getCases).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 0, status: 'OPEN', severity: 'CRITICAL' }),
    );
  });

  it('reloads with the new page index and size on pagination', () => {
    const component = createComponent();
    casesService.getCases.calls.reset();

    component.onPageChange({ pageIndex: 2, pageSize: 50, length: 100, previousPageIndex: 1 });

    expect(component.page).toBe(2);
    expect(component.pageSize).toBe(50);
    expect(casesService.getCases).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 2, size: 50 }),
    );
  });

  it('sorts by severity priority (ascending ranks CRITICAL highest)', () => {
    casesService.getCases.and.returnValue(
      of(page([makeCase('low', 'LOW'), makeCase('crit', 'CRITICAL'), makeCase('med', 'MEDIUM')])),
    );
    const component = createComponent();

    // CRITICAL has rank 0, so ascending order surfaces the highest severity first.
    component.onSort({ active: 'severity', direction: 'asc' });
    expect(component.cases().map((c) => c.severity)).toEqual(['CRITICAL', 'MEDIUM', 'LOW']);

    component.onSort({ active: 'severity', direction: 'desc' });
    expect(component.cases().map((c) => c.severity)).toEqual(['LOW', 'MEDIUM', 'CRITICAL']);
  });

  it('surfaces an error when the queue fails to load', () => {
    casesService.getCases.and.returnValue(throwError(() => new Error('boom')));
    const component = createComponent();

    expect(component.error()).toBe('boom');
    expect(component.loading()).toBeFalse();
  });

  it('navigates to the case detail on row click', () => {
    const component = createComponent();
    component.onRowClick(makeCase('c1', 'HIGH'));
    expect(router.navigate).toHaveBeenCalledWith(['/cases', 'c1']);
  });
});
