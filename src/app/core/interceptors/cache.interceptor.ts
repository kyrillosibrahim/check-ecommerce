import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { of, tap } from 'rxjs';

interface CacheEntry {
  response: HttpResponse<unknown>;
  expiry: number;
}

// Browser-only, module-scoped cache. NEVER used on the server (see guard below):
// under SSR a module-level Map is shared across every user's request, which both
// leaks memory on the long-running Node process and risks serving one request's
// response to another. Cap the size with simple LRU-ish eviction.
const MAX_ENTRIES = 100;
const cache = new Map<string, CacheEntry>();

function setCache(key: string, entry: CacheEntry): void {
  // Re-insert to move the key to the end (most-recently-used).
  if (cache.has(key)) cache.delete(key);
  cache.set(key, entry);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

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
  // Never cache on the server — the Map would be shared across all SSR requests.
  if (isPlatformServer(inject(PLATFORM_ID))) {
    return next(req);
  }

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
        setCache(cacheKey, {
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
