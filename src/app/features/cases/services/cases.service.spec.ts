import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CasesService } from './cases.service';

describe('CasesService', () => {
  let service: CasesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CasesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CasesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('always sends page and size params', () => {
    service.getCases({ page: 2, size: 50 }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/cases');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    expect(req.request.params.has('status')).toBeFalse();
    expect(req.request.params.has('severity')).toBeFalse();
    req.flush({ content: [], page: 2, size: 50, totalElements: 0, totalPages: 0 });
  });

  it('includes status, severity and assignee filters only when provided', () => {
    service
      .getCases({ page: 0, size: 20, status: 'OPEN', severity: 'HIGH', assigneeId: 'u1' })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/cases');
    expect(req.request.params.get('status')).toBe('OPEN');
    expect(req.request.params.get('severity')).toBe('HIGH');
    expect(req.request.params.get('assigneeId')).toBe('u1');
    req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('defaults page/size when omitted', () => {
    service.getCases({}).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/cases');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });
});
