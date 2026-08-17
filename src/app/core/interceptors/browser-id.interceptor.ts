import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'sz-browser-id';

export const browserIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    try {
      if (req.url.includes('/api/')) {
        const browserId = localStorage.getItem(STORAGE_KEY);
        if (browserId) {
          req = req.clone({
            setHeaders: { 'X-Browser-Id': browserId },
          });
        }
      }
    } catch { /* ignore */ }
  }

  return next(req);
};
