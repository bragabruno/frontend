import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { CaseDetailComponent } from './case-detail.component';
import { CasesService } from '../services/cases.service';
import { CaseDetailDto } from '../../../shared/models/models';

/** Mirrors the template's score formatting so specs assert behaviour, not a literal. */
const asPercent = (score: number): string => `${(score * 100).toFixed(1)}%`;

/** Maps each `.score-item` block to { label -> rendered value } for targeted assertions. */
function readScoreItems(fixture: ComponentFixture<CaseDetailComponent>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const item of fixture.debugElement.queryAll(By.css('.score-item'))) {
    const label = item.query(By.css('.label'))?.nativeElement.textContent.trim();
    const value = item.query(By.css('.value'))?.nativeElement.textContent.trim();
    if (label) result[label] = value;
  }
  return result;
}

function makeDetail(): CaseDetailDto {
  return {
    id: 'case-1',
    transactionId: 'txn-1',
    riskScoreId: 'rs-1',
    assigneeId: null,
    status: 'OPEN',
    severity: 'HIGH',
    openedAt: '2026-01-01T00:00:00Z',
    slaDueAt: null,
    resolvedAt: null,
    transaction: {
      id: 'txn-1',
      userId: 'u1',
      merchantId: 'm1',
      deviceId: 'd1',
      amount: 1250.5,
      currency: 'USD',
      ipAddress: '10.0.0.1',
      country: 'US',
      status: 'IN_REVIEW',
      idempotencyKey: 'k1',
      createdAt: '2026-01-01T00:00:00Z',
      latestRiskScore: null,
    },
    riskScore: {
      id: 'rs-1',
      transactionId: 'txn-1',
      modelVersionId: 'mv-1',
      mlScore: 0.8,
      rulesScore: 0.6,
      aggregateScore: 0.72,
      decision: 'DECLINE',
      degradedMode: false,
      reasonCodes: ['VELOCITY_HIGH', 'GEO_MISMATCH'],
      createdAt: '2026-01-01T00:00:00Z',
    },
    notes: [],
    labels: [],
  };
}

describe('CaseDetailComponent', () => {
  let casesService: jasmine.SpyObj<CasesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  function setup(): ComponentFixture<CaseDetailComponent> {
    TestBed.configureTestingModule({
      imports: [CaseDetailComponent],
      providers: [
        provideNoopAnimations(),
        { provide: CasesService, useValue: casesService },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'case-1' } } },
        },
      ],
    });
    // MatSnackBarModule re-provides MatSnackBar at the component injector level,
    // so a root provider would be shadowed — overrideProvider replaces it everywhere.
    TestBed.overrideProvider(MatSnackBar, { useValue: snackBar });
    const fixture = TestBed.createComponent(CaseDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    casesService = jasmine.createSpyObj<CasesService>('CasesService', ['getCase']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    casesService.getCase.and.returnValue(of(makeDetail()));
  });

  it('loads the case by route id on init', () => {
    const fixture = setup();
    expect(casesService.getCase).toHaveBeenCalledWith('case-1');
    expect(fixture.componentInstance.caseDetail()?.id).toBe('case-1');
    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('renders the ML + rules + aggregate breakdown clearly', () => {
    const fixture = setup();
    const rs = makeDetail().riskScore;
    const scores = readScoreItems(fixture);

    expect(scores['ML Score']).toBe(asPercent(rs.mlScore));
    expect(scores['Rules Score']).toBe(asPercent(rs.rulesScore));
    expect(scores['Aggregate']).toBe(asPercent(rs.aggregateScore));
  });

  it('renders the decision and top explanation factors (reason codes)', () => {
    const fixture = setup();

    const decision = fixture.debugElement.query(By.css('.decision-chip')).nativeElement.textContent;
    expect(decision.trim()).toBe(makeDetail().riskScore.decision);

    const codes = fixture.debugElement
      .queryAll(By.css('.code-chip'))
      .map((el) => el.nativeElement.textContent.trim());
    expect(codes).toEqual(makeDetail().riskScore.reasonCodes);
  });

  it('renders the transaction context (country and IP)', () => {
    const fixture = setup();
    const tx = makeDetail().transaction;
    const values = fixture.debugElement
      .queryAll(By.css('.info-grid .value'))
      .map((el) => el.nativeElement.textContent.trim());

    expect(values).toContain(tx.country);
    expect(values).toContain(tx.ipAddress);
  });

  it('handles a load failure: clears loading, leaves no detail, notifies', () => {
    casesService.getCase.and.returnValue(throwError(() => new Error('boom')));
    const fixture = setup();
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.caseDetail()).toBeNull();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to load case', 'Close', { duration: 3000 });
  });
});
