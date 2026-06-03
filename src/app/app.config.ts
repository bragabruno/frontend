import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NbThemeModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { authInterceptor } from './core/auth/auth.interceptor';
import { AuthService } from './core/auth/auth.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    // Nebular (futuristic Material alternative) — cosmic theme + Eva icon pack.
    // Coexists with Angular Material; Nebular styles apply only inside <nb-layout>.
    importProvidersFrom(NbThemeModule.forRoot({ name: 'cosmic' }), NbEvaIconsModule),
    // Re-establish a session from the persisted refresh token before routes/guards run.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
};
