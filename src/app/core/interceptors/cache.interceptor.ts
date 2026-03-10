import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

interface CacheEntry {
  response: HttpResponse<unknown>;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

/** URLs that should be cached (GET requests only) */
const CACHEABLE_PATTERNS = [
  '/api/categories/detailed',
  '/api/brands',
  '/api/banners',
  '/api/settings',
  '/api/governorates',
];

/** Cache duration in ms (5 minutes) */
const CACHE_DURATION = 5 * 60 * 1000;

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Check if this URL matches a cacheable pattern
  const isCacheable = CACHEABLE_PATTERNS.some(pattern => req.url.includes(pattern));
  if (!isCacheable) {
    return next(req);
  }

  const cacheKey = req.urlWithParams;
  const cached = cache.get(cacheKey);

  // Return cached response if valid
  if (cached && cached.expiry > Date.now()) {
    return of(cached.response.clone());
  }

  // Remove expired entry
  if (cached) {
    cache.delete(cacheKey);
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(cacheKey, {
          response: event.clone(),
          expiry: Date.now() + CACHE_DURATION,
        });
      }
    })
  );
};
