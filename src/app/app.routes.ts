import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cases',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'FRAUD_ANALYST', 'INVESTIGATOR', 'AUDITOR'], breadcrumb: 'Cases' },
    loadComponent: () =>
      import('./features/cases/cases-list/cases-list.component').then((m) => m.CasesListComponent),
  },
  {
    path: 'cases/:id',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['ADMIN', 'FRAUD_ANALYST', 'INVESTIGATOR', 'AUDITOR'],
      breadcrumb: 'Case Detail',
    },
    loadComponent: () =>
      import('./features/cases/case-detail/case-detail.component').then(
        (m) => m.CaseDetailComponent,
      ),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'], breadcrumb: 'Users' },
    loadComponent: () =>
      import('./features/admin/users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'admin/rules',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'], breadcrumb: 'Rules' },
    loadComponent: () =>
      import('./features/admin/rules/rules.component').then((m) => m.RulesComponent),
  },
  {
    path: 'admin/models',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'], breadcrumb: 'Models' },
    loadComponent: () =>
      import('./features/admin/models/models.component').then((m) => m.ModelsComponent),
  },
  {
    path: 'audit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'AUDITOR'], breadcrumb: 'Audit Trail' },
    loadComponent: () =>
      import('./features/admin/audit/audit.component').then((m) => m.AuditComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },
  { path: '', redirectTo: 'cases', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
