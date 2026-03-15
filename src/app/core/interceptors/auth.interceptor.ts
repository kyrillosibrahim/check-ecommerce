import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'sz-current-user';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const user = JSON.parse(data);
        if (user?.token) {
          req = req.clone({
            setHeaders: { Authorization: `Bearer ${user.token}` },
          });
        }
      }
    } catch { /* ignore */ }
  }

  return next(req);
};
