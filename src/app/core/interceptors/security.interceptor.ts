import { HttpInterceptorFn } from '@angular/common/http';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://check-ecommerce.onrender.com',
  'https://karokan-backend.onrender.com',
  'https://nominatim.openstreetmap.org'
];

export const securityInterceptor: HttpInterceptorFn = (req, next) => {
  // Block requests to unexpected external origins
  try {
    const url = new URL(req.url, window.location.origin);
    const isRelative = req.url.startsWith('/');
    const isAllowed = ALLOWED_ORIGINS.some(origin => req.url.startsWith(origin));

    if (!isRelative && !isAllowed && url.origin !== window.location.origin) {
      console.warn('[Security] Blocked request to unexpected origin:', url.origin);
      throw new Error('Request blocked: unauthorized origin');
    }
  } catch (e: any) {
    if (e.message === 'Request blocked: unauthorized origin') throw e;
    // relative URL — allowed
  }

  // Add security headers to outgoing requests
  const secureReq = req.clone({
    setHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
    }
  });

  return next(secureReq);
};
