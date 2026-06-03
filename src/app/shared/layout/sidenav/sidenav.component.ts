import { Component, signal, input, output, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrentUser, Role } from '../../models/models';
import { getInitials } from '../../utils/utils';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: Role[];
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  private readonly router = inject(Router);

  user = input<CurrentUser | null>(null);
  collapsed = signal(false);
  toggleCollapse = output<void>();

  navItems: NavItem[] = [
    { label: 'Cases', icon: 'assignment', route: '/cases' },
    { label: 'Admin', icon: 'admin_panel_settings', route: '/admin/users', roles: ['ADMIN'] },
    { label: 'Rules', icon: 'rule', route: '/admin/rules', roles: ['ADMIN'] },
    { label: 'Models', icon: 'smart_toy', route: '/admin/models', roles: ['ADMIN'] },
    { label: 'Audit', icon: 'history', route: '/audit', roles: ['ADMIN', 'AUDITOR'] },
  ];

  isVisible(item: NavItem): boolean {
    const role = this.user()?.role;
    if (!item.roles || item.roles.length === 0) return true;
    return role ? item.roles.includes(role) : false;
  }

  get initials(): string {
    const u = this.user();
    return u ? getInitials(u.username) : '??';
  }

  get displayName(): string {
    return this.user()?.username ?? 'Guest';
  }

  get roleLabel(): string {
    const role = this.user()?.role;
    return role ? role.replace('_', ' ') : '';
  }

  onToggle(): void {
    this.collapsed.update((v) => !v);
    this.toggleCollapse.emit();
  }
}
