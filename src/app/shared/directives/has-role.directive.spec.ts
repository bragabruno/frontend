import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HasRoleDirective } from './has-role.directive';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../models/models';

@Component({
  standalone: true,
  imports: [HasRoleDirective],
  template: `<span *appHasRole="roles" class="guarded">visible</span>`,
})
class HostComponent {
  roles: Role[] = ['ADMIN'];
}

describe('HasRoleDirective', () => {
  let authService: jasmine.SpyObj<AuthService>;

  function render(roles: Role[]) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.roles = roles;
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasRole']);
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: AuthService, useValue: authService }],
    });
  });

  it('renders the host when the user holds one of the roles', () => {
    authService.hasRole.and.returnValue(true);
    const fixture = render(['ADMIN', 'FRAUD_ANALYST']);

    expect(fixture.debugElement.query(By.css('.guarded'))).toBeTruthy();
    expect(authService.hasRole).toHaveBeenCalledWith('ADMIN', 'FRAUD_ANALYST');
  });

  it('does not render the host when the user lacks the roles', () => {
    authService.hasRole.and.returnValue(false);
    const fixture = render(['ADMIN']);

    expect(fixture.debugElement.query(By.css('.guarded'))).toBeNull();
  });
});
