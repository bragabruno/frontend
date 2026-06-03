import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../models/models';

/**
 * Structural directive that renders its host only when the current user holds one of the
 * given roles. UI-level defense-in-depth — the route `roleGuard` and the server remain
 * authoritative; this just keeps unauthorized affordances out of the DOM.
 *
 * Usage: `<button *appHasRole="['ADMIN', 'FRAUD_ANALYST']">Act</button>`
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  private rendered = false;

  @Input()
  set appHasRole(roles: Role[] | Role | null | undefined) {
    // Normalize to a clean list; with no roles given, fail closed (hide).
    const allowed = (Array.isArray(roles) ? roles : roles ? [roles] : []).filter(Boolean);
    const permitted = allowed.length > 0 && this.authService.hasRole(...allowed);

    if (permitted && !this.rendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!permitted && this.rendered) {
      this.viewContainer.clear();
      this.rendered = false;
    }
  }
}
