import { Component, signal, inject, effect, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterOutlet } from '@angular/router';
import { NbLayoutModule, NbSidebarModule, NbSidebarService } from '@nebular/theme';
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
    RouterOutlet,
    NbLayoutModule,
    NbSidebarModule,
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
  private readonly sidebar = inject(NbSidebarService);

  readonly sidebarTag = 'menu-sidebar';

  currentUser = signal<CurrentUser | null>(null);
  breadcrumbs = signal<Breadcrumb[]>([]);

  private routerSub = this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd))
    .subscribe(() => {
      this.breadcrumbs.set(this.buildBreadcrumbs(this.activatedRoute.root));
      this.currentUser.set(this.auth.currentUser());
    });

  private userEffect = effect(() => {
    this.currentUser.set(this.auth.currentUser());
  });

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

  onToggleSidebar(): void {
    this.sidebar.toggle(true, this.sidebarTag);
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe();
  }
}
