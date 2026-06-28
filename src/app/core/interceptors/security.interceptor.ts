import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://check-ecommerce.onrender.com',
  'https://karokan-backend.onrender.com',
  'https://nominatim.openstreetmap.org'
];

export const securityInterceptor: HttpInterceptorFn = (req, next) => {
  // Block requests to unexpected external origins. Only enforce in the browser —
  // on the server `window` is undefined (the old try/catch silently treated every
  // request as allowed, providing no protection during SSR).
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    const isRelative = req.url.startsWith('/');
    const isAllowed = ALLOWED_ORIGINS.some(origin => req.url.startsWith(origin));
    if (!isRelative && !isAllowed) {
      const url = new URL(req.url, window.location.origin);
      if (url.origin !== window.location.origin) {
        console.warn('[Security] Blocked request to unexpected origin:', url.origin);
        throw new Error('Request blocked: unauthorized origin');
      }
    }
  }

  // Add security headers to outgoing requests
  const secureReq = req.clone({
    setHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
    }
  });

  return next(secureReq);
};
