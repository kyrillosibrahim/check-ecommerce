import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { API_CONFIG } from '../config/api.config';
import { getOrCreateDeviceId, parseDeviceName } from '../utils/device.util';

@Injectable({ providedIn: 'root' })
export class SiteVisitService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  trackVisit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const deviceId = getOrCreateDeviceId();
    const deviceName = parseDeviceName(navigator.userAgent);

    this.http.post(API_CONFIG.siteVisitsUrl, { deviceId, deviceName, userAgent: navigator.userAgent })
      .subscribe({ error: () => {} });
  }
}
