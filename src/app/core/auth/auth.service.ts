import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of, switchMap, map, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { CurrentUser, LoginResponse, RefreshResponse } from '../../shared/models/models';
import { environment } from '../../../environments/environment';

/**
 * sessionStorage key for the persisted refresh token. Only the refresh token is
 * persisted across reloads — the access token and user identity stay in memory
 * and are reconstructed from the server on app start (see `restoreSession`).
 */
const REFRESH_TOKEN_STORAGE_KEY = 'fps.refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessToken = signal<string | null>(null);
  private readonly refreshToken = signal<string | null>(this.readStoredRefreshToken());
  private readonly user = signal<CurrentUser | null>(null);

  readonly currentUser = () => this.user();
  readonly isAuthenticated = () => !!this.accessToken();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap((res) => {
          this.accessToken.set(res.accessToken);
          this.setRefreshToken(res.refreshToken);
          this.user.set({ userId: res.userId, username: res.username, role: res.role });
        }),
      );
  }

  logout(): void {
    const rt = this.refreshToken();
    if (rt) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken: rt }).subscribe();
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  refreshAccessToken(): Observable<RefreshResponse | null> {
    const rt = this.refreshToken();
    if (!rt) return of(null);

    return this.http
      .post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken: rt })
      .pipe(
        tap((res) => {
          this.accessToken.set(res.accessToken);
          this.setRefreshToken(res.refreshToken);
        }),
        catchError(() => {
          this.logout();
          return of(null);
        }),
      );
  }

  /**
   * Re-establish a session on app start from the persisted refresh token.
   * Exchanges the stored refresh token for a fresh access token, then loads the
   * authoritative user identity from the server. Any failure clears state
   * silently — route guards send unauthenticated users to /login.
   */
  restoreSession(): Observable<void> {
    const rt = this.refreshToken();
    if (!rt) return of(undefined);

    return this.http
      .post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken: rt })
      .pipe(
        switchMap((res) => {
          this.accessToken.set(res.accessToken);
          this.setRefreshToken(res.refreshToken);
          return this.loadCurrentUser();
        }),
        map(() => undefined),
        catchError(() => {
          this.clearSession();
          return of(undefined);
        }),
      );
  }

  loadCurrentUser(): Observable<CurrentUser> {
    return this.http
      .get<CurrentUser>(`${environment.apiUrl}/auth/me`)
      .pipe(tap((u) => this.user.set(u)));
  }

  getToken(): string | null {
    return this.accessToken();
  }

  getRole() {
    return this.user()?.role ?? null;
  }

  hasRole(...roles: string[]): boolean {
    const role = this.getRole();
    return role ? roles.includes(role) : false;
  }

  private clearSession(): void {
    this.accessToken.set(null);
    this.setRefreshToken(null);
    this.user.set(null);
  }

  private setRefreshToken(token: string | null): void {
    this.refreshToken.set(token);
    try {
      if (token) {
        sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
      } else {
        sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
    } catch {
      // sessionStorage may be unavailable (private mode); degrade to in-memory only.
    }
  }

  private readStoredRefreshToken(): string | null {
    try {
      return sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
