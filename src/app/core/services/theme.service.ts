import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'sz-theme';
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private themeSubject = new BehaviorSubject<Theme>('light');

  theme$ = this.themeSubject.asObservable();

  constructor() {
    if (this.isBrowser) {
      // Clear any previously persisted dark preference and force light mode.
      localStorage.removeItem(this.STORAGE_KEY);
      this.applyTheme('light');
    }
  }

  toggleTheme(): void {
    // Dark mode is disabled — keep the site in light mode.
  }

  isDark(): boolean {
    return false;
  }

  private applyTheme(_theme: Theme): void {
    document.documentElement.setAttribute('data-bs-theme', 'light');
  }
}
