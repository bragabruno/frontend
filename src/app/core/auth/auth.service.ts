import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { CurrentUser, LoginResponse } from '../../shared/models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessToken = signal<string | null>(null);
  private readonly refreshToken = signal<string | null>(null);
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
          this.refreshToken.set(res.refreshToken);
          this.user.set({ userId: res.userId, username: res.username, role: res.role });
        }),
      );
  }

  logout(): void {
    const rt = this.refreshToken();
    if (rt) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken: rt }).subscribe();
    }
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  refreshAccessToken() {
    const rt = this.refreshToken();
    if (!rt) return of(null);

    return this.http
      .post<{ accessToken: string; refreshToken: string }>(`${environment.apiUrl}/auth/refresh`, {
        refreshToken: rt,
      })
      .pipe(
        tap((res) => {
          this.accessToken.set(res.accessToken);
          this.refreshToken.set(res.refreshToken);
        }),
        catchError(() => {
          this.logout();
          return of(null);
        }),
      );
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
}
