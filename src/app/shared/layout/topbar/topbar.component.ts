import { Component, input, output, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { CurrentUser } from '../../models/models';
import { getInitials } from '../../utils/utils';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);

  user = input<CurrentUser | null>(null);
  toggleSidenav = output<void>();

  searchQuery = signal('');
  menuOpened = signal(false);

  get initials(): string {
    const u = this.user();
    return u ? getInitials(u.username) : '??';
  }

  get roleBadge(): string {
    const u = this.user();
    return u ? u.role.replace('_', ' ') : '';
  }

  onLogout(): void {
    this.auth.logout();
  }
}
