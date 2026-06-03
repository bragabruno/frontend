import { Component, signal, inject, effect, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { BreadcrumbsComponent, Breadcrumb } from '../breadcrumbs/breadcrumbs.component';
import { HelpWidgetComponent } from '../../components/help-widget/help-widget.component';
import { AuthService } from '../../../core/auth/auth.service';
import { CurrentUser } from '../../models/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    NgIf,
    MatSidenavModule,
    SidenavComponent,
    TopbarComponent,
    BreadcrumbsComponent,
    HelpWidgetComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly breakpointObserver = inject(BreakpointObserver);

  currentUser = signal<CurrentUser | null>(null);
  breadcrumbs = signal<Breadcrumb[]>([]);
  isMobile = signal(false);
  sidenavCollapsed = signal(false);

  private mobileSub = this.breakpointObserver.observe([Breakpoints.Handset]).subscribe((result) => {
    this.isMobile.set(result.matches);
  });

  private routerSub = this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe(() => {
      this.breadcrumbs.set(this.buildBreadcrumbs(this.activatedRoute.root));
      this.refreshUser();
    });

  private userEffect = effect(() => {
    const user = this.auth.currentUser();
    this.currentUser.set(user);
  });

  private refreshUser(): void {
    this.currentUser.set(this.auth.currentUser());
  }

  private buildBreadcrumbs(route: ActivatedRoute, crumbs: Breadcrumb[] = []): Breadcrumb[] {
    const child = route.firstChild;
    if (!child) return crumbs;

    const data = child.snapshot.data;
    if (data['breadcrumb']) {
      crumbs.push({
        label: data['breadcrumb'],
        route: child.snapshot.url.map((u) => u.path).join('/'),
      });
    }

    return this.buildBreadcrumbs(child, crumbs);
  }

  onToggleSidenav(): void {
    this.sidenavCollapsed.update((v) => !v);
  }

  ngOnDestroy(): void {
    this.mobileSub.unsubscribe();
    this.routerSub.unsubscribe();
  }
}
