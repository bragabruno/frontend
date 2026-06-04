import { Injectable, signal } from '@angular/core';

type ThemeMode = 'dark' | 'light';

/**
 * Toggles the app between the Moonlight dark and light themes by adding/removing
 * a `light-mode` class on <html>. Because every colour (Nebular scales + the
 * app's semantic tokens) derives from the `--ml-*` primitives, that single class
 * — which redefines those primitives — flips the whole UI. The choice is
 * persisted so it survives reloads.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private static readonly STORAGE_KEY = 'fps.theme';

  readonly isLight = signal<boolean>(false);

  constructor() {
    this.apply(this.readStored() === 'light');
  }

  toggle(): void {
    this.apply(!this.isLight());
  }

  private apply(light: boolean): void {
    this.isLight.set(light);
    document.documentElement.classList.toggle('light-mode', light);
    this.store(light ? 'light' : 'dark');
  }

  private readStored(): ThemeMode | null {
    try {
      const value = localStorage.getItem(ThemeService.STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  private store(mode: ThemeMode): void {
    try {
      localStorage.setItem(ThemeService.STORAGE_KEY, mode);
    } catch {
      // Storage unavailable (private mode / SSR) — theme still applies for the session.
    }
  }
}
