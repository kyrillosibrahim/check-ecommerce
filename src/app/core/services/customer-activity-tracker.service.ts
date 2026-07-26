import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';
import { getOrCreateDeviceId, parseDeviceName } from '../utils/device.util';
import { AuthService } from './auth.service';

// Router redirects and guard bounces under two seconds do not mean the customer read the page.
const MIN_DURATION_SECONDS = 2;

interface CurrentEntry {
  path: string;
  enteredAt: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerActivityTrackerService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private title = inject(Title);
  private auth = inject(AuthService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly url = API_CONFIG.customerActivityUrl;
  private started = false;
  private current: CurrentEntry | null = null;
  private deviceId = '';
  private deviceName = '';

  start(): void {
    if (!this.isBrowser || this.started) return;
    this.started = true;
    this.deviceId = getOrCreateDeviceId();
    this.deviceName = parseDeviceName(navigator.userAgent);

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => this.onNavigation(event.urlAfterRedirects));

    // The landing page is often the only one a visitor sees, and its NavigationEnd can
    // fire before ngOnInit runs. Seed it here; onNavigation dedupes if the event follows.
    this.onNavigation(this.router.url);

    // beforeunload misses iOS/Android tab freezes and discards; visibilitychange plus pagehide
    // caps durations at time actually viewed instead of inflating an overnight parked tab.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushBeacon();
      } else if (!this.current) {
        this.onNavigation(this.router.url);
      }
    });
    window.addEventListener('pagehide', () => this.flushBeacon());
  }

  private onNavigation(url: string): void {
    if (this.auth.isAdmin()) {
      this.current = null;
      return;
    }

    const normalized = url.split('?')[0].split('#')[0] || '/';
    if (this.current?.path === normalized) return;

    this.commit();
    this.current = { path: normalized, enteredAt: Date.now() };
  }

  private buildPayload(): Record<string, unknown> | null {
    if (!this.current) return null;

    const current = this.current;
    // Clear first so visibilitychange and pagehide cannot send the same entry; do not reorder.
    this.current = null;
    const durationSeconds = Math.round((Date.now() - current.enteredAt) / 1000);
    if (durationSeconds < MIN_DURATION_SECONDS) return null;

    const user = this.auth.getCurrentUser();
    // Read at exit: NavigationEnd precedes titleStrategy.updateTitle, so entry reads the previous title;
    // product titles also arrive asynchronously from SeoService after loading.
    const rawTitle = this.title.getTitle();
    const title = rawTitle
      .replace(/^Check\s*-\s*/i, '')
      .replace(/\s*\|\s*Kaf\s*$/i, '')
      .trim();

    return {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      userId: user?.id || '',
      userName: user?.name || '',
      userPhone: user?.phone || '',
      path: current.path,
      title,
      enteredAt: new Date(current.enteredAt).toISOString(),
      durationSeconds,
      userAgent: navigator.userAgent,
    };
  }

  private commit(): void {
    const payload = this.buildPayload();
    if (!payload) return;

    this.http.post(this.url, payload)
      .subscribe({ error: () => {} });
  }

  private flushBeacon(): void {
    const payload = this.buildPayload();
    if (!payload) return;

    try {
      navigator.sendBeacon(this.url, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    } catch { /* best-effort during unload */ }
  }
}
