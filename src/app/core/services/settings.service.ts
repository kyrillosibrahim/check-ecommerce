import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

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
  bestSellingProducts: any[];
  bestSellingBrands: number[];
  naturalProducts?: { video: string; link: string }[];
}

@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private http = inject(HttpClient);

  private settings$ = this.http.get<ISiteSettings>(`${SERVER_URL}/api/settings`).pipe(
    shareReplay(1)
  );

  getSettings(): Observable<ISiteSettings> {
    return this.settings$;
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
