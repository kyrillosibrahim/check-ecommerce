import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'sz-theme';
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private themeSubject = new BehaviorSubject<Theme>(this.loadTheme());

  theme$ = this.themeSubject.asObservable();

  constructor() {
    if (this.isBrowser) {
      this.applyTheme(this.themeSubject.getValue());
    }
  }

  toggleTheme(): void {
    const next: Theme = this.themeSubject.getValue() === 'light' ? 'dark' : 'light';
    this.themeSubject.next(next);
    if (this.isBrowser) {
      this.applyTheme(next);
      localStorage.setItem(this.STORAGE_KEY, next);
    }
  }

  isDark(): boolean {
    return this.themeSubject.getValue() === 'dark';
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }

  private loadTheme(): Theme {
    if (!this.isBrowser) return 'light';
    return (localStorage.getItem(this.STORAGE_KEY) as Theme) || 'light';
  }
}
