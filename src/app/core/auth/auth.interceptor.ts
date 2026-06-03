import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Single-flight refresh state shared across concurrent requests: while one 401
 * triggers a token refresh, other 401s wait on `refreshedToken$` instead of
 * each firing their own refresh.
 */
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

// Auth endpoints must not trigger refresh-on-401 (avoids a refresh→401→refresh loop).
const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/me'];

function isAuthEndpoint(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}

function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const authReq = token ? withToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint(req.url)) {
        return handle401(req, next, authService);
      }
      return throwError(() => error);
    }),
  );
};

function handle401(req: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService) {
  if (isRefreshing) {
    // A refresh is already in flight — wait for it, then retry with the new token.
    return refreshedToken$.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => next(withToken(req, token))),
    );
  }

  isRefreshing = true;
  refreshedToken$.next(null);

  return authService.refreshAccessToken().pipe(
    switchMap((res) => {
      isRefreshing = false;
      if (!res) {
        // Refresh failed; refreshAccessToken() has already logged the user out.
        return throwError(() => new Error('Session expired'));
      }
      refreshedToken$.next(res.accessToken);
      return next(withToken(req, res.accessToken));
    }),
    catchError((err) => {
      isRefreshing = false;
      return throwError(() => err);
    }),
  );
}
