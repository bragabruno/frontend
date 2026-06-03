import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject, of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { RefreshResponse } from '../../shared/models/models';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'getToken',
      'refreshAccessToken',
      'logout',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('attaches the Bearer token to outgoing requests', () => {
    authSpy.getToken.and.returnValue('tok');

    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({});
  });

  it('does not attach a header when there is no token', () => {
    authSpy.getToken.and.returnValue(null);

    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('refreshes and retries the request once on 401', () => {
    authSpy.getToken.and.returnValue('old');
    authSpy.refreshAccessToken.and.returnValue(
      of<RefreshResponse>({ accessToken: 'new', refreshToken: 'r' }),
    );

    let result: unknown;
    http.get('/api/data').subscribe((res) => (result = res));

    httpMock.expectOne('/api/data').flush(null, { status: 401, statusText: 'Unauthorized' });

    const retry = httpMock.expectOne('/api/data');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
    retry.flush({ ok: true });

    expect(result).toEqual({ ok: true });
    expect(authSpy.refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it('propagates the error and does not retry when refresh fails', () => {
    authSpy.getToken.and.returnValue('old');
    authSpy.refreshAccessToken.and.returnValue(of(null)); // refresh failed + logged out

    let errored = false;
    http.get('/api/data').subscribe({ error: () => (errored = true) });

    httpMock.expectOne('/api/data').flush(null, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone('/api/data'); // no retry
    expect(errored).toBeTrue();
  });

  it('does not attempt refresh for auth endpoints', () => {
    authSpy.getToken.and.returnValue(null);

    let errored = false;
    http.post('/api/auth/login', {}).subscribe({ error: () => (errored = true) });

    httpMock.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.refreshAccessToken).not.toHaveBeenCalled();
    expect(errored).toBeTrue();
  });

  it('refreshes once for concurrent 401s (single-flight) and retries both', () => {
    authSpy.getToken.and.returnValue('old');
    const refresh$ = new Subject<RefreshResponse | null>();
    authSpy.refreshAccessToken.and.returnValue(refresh$);

    http.get('/api/a').subscribe();
    http.get('/api/b').subscribe();

    httpMock.expectOne('/api/a').flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/b').flush(null, { status: 401, statusText: 'Unauthorized' });

    // Only the first 401 triggers a refresh; the second waits on it.
    expect(authSpy.refreshAccessToken).toHaveBeenCalledTimes(1);

    refresh$.next({ accessToken: 'new', refreshToken: 'r' });
    refresh$.complete();

    const retryA = httpMock.expectOne('/api/a');
    const retryB = httpMock.expectOne('/api/b');
    expect(retryA.request.headers.get('Authorization')).toBe('Bearer new');
    expect(retryB.request.headers.get('Authorization')).toBe('Bearer new');
    retryA.flush({});
    retryB.flush({});
  });
});
