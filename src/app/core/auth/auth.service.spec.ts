import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const REFRESH_TOKEN_STORAGE_KEY = 'fps.refresh_token';
const API = '/api';

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    sessionStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  /**
   * AuthService reads the persisted refresh token in its constructor, so any
   * seeding must happen before the first injection. Seed first, then create.
   */
  function createService(seedRefreshToken?: string): AuthService {
    if (seedRefreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, seedRefreshToken);
    }
    return TestBed.inject(AuthService);
  }

  it('persists the refresh token to sessionStorage on login', () => {
    const service = createService();
    service.login('admin', 'pw').subscribe();

    const req = httpMock.expectOne(`${API}/auth/login`);
    expect(req.request.body).toEqual({ username: 'admin', password: 'pw' });
    req.flush({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      role: 'ADMIN',
      userId: 'u1',
      username: 'admin',
    });

    expect(service.getToken()).toBe('access-1');
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()).toEqual({ userId: 'u1', username: 'admin', role: 'ADMIN' });
    expect(sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe('refresh-1');
  });

  it('clears stored token and navigates to /login on logout', () => {
    const service = createService('refresh-1');

    service.logout();

    httpMock.expectOne(`${API}/auth/logout`).flush(null, { status: 204, statusText: 'No Content' });
    expect(sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('restoreSession() refreshes then loads the current user', () => {
    const service = createService('refresh-1');

    service.restoreSession().subscribe();

    const refreshReq = httpMock.expectOne(`${API}/auth/refresh`);
    expect(refreshReq.request.body).toEqual({ refreshToken: 'refresh-1' });
    refreshReq.flush({ accessToken: 'access-2', refreshToken: 'refresh-2' });

    const meReq = httpMock.expectOne(`${API}/auth/me`);
    meReq.flush({ userId: 'u1', username: 'admin', role: 'ADMIN' });

    expect(service.getToken()).toBe('access-2');
    expect(service.currentUser()).toEqual({ userId: 'u1', username: 'admin', role: 'ADMIN' });
    expect(sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe('refresh-2');
  });

  it('restoreSession() makes no request when no refresh token is stored', () => {
    const service = createService();
    let completed = false;
    service.restoreSession().subscribe({ complete: () => (completed = true) });

    httpMock.expectNone(`${API}/auth/refresh`);
    expect(completed).toBeTrue();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('restoreSession() clears state silently when refresh fails', () => {
    const service = createService('refresh-1');

    let errored = false;
    service.restoreSession().subscribe({ error: () => (errored = true) });

    httpMock
      .expectOne(`${API}/auth/refresh`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(errored).toBeFalse(); // failure is swallowed, not propagated
    expect(service.isAuthenticated()).toBeFalse();
    expect(sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled(); // guards handle routing, not restore
  });

  it('refreshAccessToken() logs out when the refresh call fails', () => {
    const service = createService('refresh-1');

    service.refreshAccessToken().subscribe();

    httpMock
      .expectOne(`${API}/auth/refresh`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    // logout() posts to /auth/logout (refresh token still present at that point)
    httpMock.expectOne(`${API}/auth/logout`).flush(null, { status: 204, statusText: 'No Content' });

    expect(service.isAuthenticated()).toBeFalse();
    expect(sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('hasRole() reflects the current user role', () => {
    const service = createService();
    service.login('aud', 'pw').subscribe();
    httpMock.expectOne(`${API}/auth/login`).flush({
      accessToken: 'a',
      refreshToken: 'r',
      role: 'AUDITOR',
      userId: 'u1',
      username: 'aud',
    });

    expect(service.hasRole('AUDITOR')).toBeTrue();
    expect(service.hasRole('ADMIN', 'AUDITOR')).toBeTrue();
    expect(service.hasRole('ADMIN')).toBeFalse();
  });
});
