import { Component, input, output, signal, inject, ElementRef, HostListener } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NbIconModule, NbButtonModule, NbInputModule } from '@nebular/theme';
import { CurrentUser } from '../../models/models';
import { getInitials } from '../../utils/utils';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [NgIf, RouterLink, FormsModule, NbIconModule, NbButtonModule, NbInputModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);

  user = input<CurrentUser | null>(null);
  toggleSidenav = output<void>();

  searchQuery = signal('');
  menuOpen = signal(false);

  // Close the user dropdown on outside click or Escape (accessible dropdown).
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
  }

  get initials(): string {
    const u = this.user();
    return u ? getInitials(u.username) : '??';
  }

  get roleBadge(): string {
    const u = this.user();
    return u ? u.role.replace('_', ' ') : '';
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  onLogout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }
}
