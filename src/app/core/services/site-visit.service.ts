import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class SiteVisitService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  trackVisit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const deviceId = this.getOrCreateDeviceId();
    const deviceName = this.parseDeviceName(navigator.userAgent);

    this.http.post(API_CONFIG.siteVisitsUrl, { deviceId, deviceName, userAgent: navigator.userAgent })
      .subscribe({ error: () => {} });
  }

  private getOrCreateDeviceId(): string {
    const key = 'kaf_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  }

  private parseDeviceName(ua: string): string {
    let os = 'Unknown OS';
    if (/Windows NT 10/.test(ua))      os = 'Windows 10';
    else if (/Windows NT 6/.test(ua))  os = 'Windows';
    else if (/Mac OS X/.test(ua))      os = 'Mac';
    else if (/Android/.test(ua))       os = 'Android';
    else if (/iPhone/.test(ua))        os = 'iPhone';
    else if (/iPad/.test(ua))          os = 'iPad';
    else if (/Linux/.test(ua))         os = 'Linux';

    let browser = 'Browser';
    if (/Edg\//.test(ua))             browser = 'Edge';
    else if (/OPR\//.test(ua))        browser = 'Opera';
    else if (/Chrome\//.test(ua))     browser = 'Chrome';
    else if (/Firefox\//.test(ua))    browser = 'Firefox';
    else if (/Safari\//.test(ua))     browser = 'Safari';

    return `${browser} / ${os}`;
  }
}
