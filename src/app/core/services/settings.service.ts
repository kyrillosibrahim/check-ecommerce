import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { withLocalCache } from '../utils/local-cache.util';

const SERVER_URL = API_CONFIG.baseUrl;

export interface ISiteSettings {
  logo: string;
  logoAr?: string;
  logoEn?: string;
  logoIcon?: string;
  colors: {
    primaryLight: string;
    primaryDark: string;
    secondaryLight: string;
    secondaryDark: string;
  };
  social: {
    facebook: string;
    instagram: string;
    whatsapp: string;
    phone: string;
  };
  bestSellingProducts: number[];
  bestSellingBrands: number[];
  naturalProducts?: { video: string; link: string }[];
}

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private settings$ = this.http.get<ISiteSettings>(`${SERVER_URL}/api/settings`).pipe(
    shareReplay(1)
  );

  private homeProducts$ = withLocalCache(
    'kaf:home-products',
    this.http.get<any[]>(`${SERVER_URL}/api/settings/home-products`).pipe(
      catchError(() => of([] as any[])),
      shareReplay(1)
    ),
    this.platformId
  );

  getSettings(): Observable<ISiteSettings> {
    return this.settings$;
  }

  getHomeProducts(): Observable<any[]> {
    return this.homeProducts$;
  }

  getLogoUrl(logo: string): string {
    if (!logo) return '';
    if (logo.startsWith('http')) return logo;
    return `${SERVER_URL}/uploads/${logo}`;
  }

  getLogoUrlByLang(settings: ISiteSettings, lang: 'ar' | 'en'): string {
    const src = (lang === 'ar' ? settings.logoAr : settings.logoEn) || settings.logo || '';
    return this.getLogoUrl(src);
  }

  getIconUrl(settings: ISiteSettings): string {
    const src = settings.logoIcon || settings.logo || '';
    return this.getLogoUrl(src);
  }
}
