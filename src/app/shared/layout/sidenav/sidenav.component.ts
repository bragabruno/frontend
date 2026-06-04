import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { NbIconModule, NbTooltipModule } from '@nebular/theme';
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
  imports: [NgIf, NgFor, RouterLink, RouterLinkActive, NbIconModule, NbTooltipModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  user = input<CurrentUser | null>(null);

  navItems: NavItem[] = [
    { label: 'Cases', icon: 'layers-outline', route: '/cases' },
    { label: 'Users', icon: 'people-outline', route: '/admin/users', roles: ['ADMIN'] },
    { label: 'Rules', icon: 'options-2-outline', route: '/admin/rules', roles: ['ADMIN'] },
    { label: 'Models', icon: 'cube-outline', route: '/admin/models', roles: ['ADMIN'] },
    { label: 'Audit', icon: 'file-text-outline', route: '/audit', roles: ['ADMIN', 'AUDITOR'] },
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

  get roleLabel(): string {
    const role = this.user()?.role;
    return role ? role.replace('_', ' ') : '';
  }
}
