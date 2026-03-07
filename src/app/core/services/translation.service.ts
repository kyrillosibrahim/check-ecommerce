import { Injectable, signal } from '@angular/core';
import { EN_TRANSLATIONS, AR_TRANSLATIONS } from '../data/translations';

type Language = 'en' | 'ar';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: EN_TRANSLATIONS,
  ar: AR_TRANSLATIONS,
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly STORAGE_KEY = 'sz-lang';

  currentLang = signal<Language>(this.loadLang());

  constructor() {
    this.applyLang(this.currentLang());
  }

  toggleLanguage(): void {
    const next: Language = this.currentLang() === 'en' ? 'ar' : 'en';
    this.currentLang.set(next);
    this.applyLang(next);
    localStorage.setItem(this.STORAGE_KEY, next);
    location.reload();
  }

  translate(key: string): string {
    return TRANSLATIONS[this.currentLang()][key] || key;
  }

  isArabic(): boolean {
    return this.currentLang() === 'ar';
  }

  get currencySymbol(): string {
    return this.currentLang() === 'ar' ? 'ج.م ' : 'EGP';
  }

  private applyLang(lang: Language): void {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    const link = document.getElementById('bootstrap-css') as HTMLLinkElement;
    if (link) {
      link.href =
        lang === 'ar'
          ? 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css'
          : 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
    }
  }

  private loadLang(): Language {
    return (localStorage.getItem(this.STORAGE_KEY) as Language) || 'ar';
  }
}
