import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

interface CacheEntry {
  response: HttpResponse<unknown>;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();

/** Per-pattern cache rules. Patterns are matched via `url.includes`. */
const CACHE_RULES: ReadonlyArray<{ pattern: string; ttl: number }> = [
  { pattern: '/api/brands',              ttl: 24 * 60 * 60 * 1000 },
  { pattern: '/api/categories/detailed', ttl:  6 * 60 * 60 * 1000 },
  { pattern: '/api/governorates',        ttl: 24 * 60 * 60 * 1000 },
  { pattern: '/api/banners',             ttl: 15 * 60 * 1000 },
  { pattern: '/api/settings',            ttl: 10 * 60 * 1000 },
];

function ttlFor(url: string): number | null {
  const rule = CACHE_RULES.find(r => url.includes(r.pattern));
  return rule ? rule.ttl : null;
}

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  const ttl = ttlFor(req.url);
  if (ttl === null) {
    return next(req);
  }

  const cacheKey = req.urlWithParams;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return of(cached.response.clone());
  }

  if (cached) {
    cache.delete(cacheKey);
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(cacheKey, {
          response: event.clone(),
          expiry: Date.now() + ttl,
        });
      }
    })
  );
};

/** Invalidate cached entries whose URL matches the given substring. */
export function invalidateCache(urlSubstring: string): void {
  for (const key of cache.keys()) {
    if (key.includes(urlSubstring)) cache.delete(key);
  }
}
