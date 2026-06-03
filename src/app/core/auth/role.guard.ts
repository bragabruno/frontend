import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from '../../shared/models/models';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = (route.data?.['roles'] as Role[]) || [];

  if (requiredRoles.length === 0) return true;

  if (authService.hasRole(...requiredRoles)) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
