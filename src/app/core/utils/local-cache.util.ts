import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> { data: T; ts: number; }

function read<T>(key: string, ttl: number, platformId: object): T | null {
  if (!isPlatformBrowser(platformId)) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts < ttl) return entry.data;
  } catch {}
  return null;
}

function write<T>(key: string, data: T, platformId: object): void {
  if (!isPlatformBrowser(platformId)) return;
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() } satisfies CacheEntry<T>)); } catch {}
}

/**
 * Wraps an observable with stale-while-revalidate localStorage caching.
 * - Fresh cache hit  → emits cached data synchronously + silently refreshes in background
 * - Cache miss/stale → fetches normally and writes result to cache
 */
export function withLocalCache<T>(
  key: string,
  source$: Observable<T>,
  platformId: object,
  ttl = DEFAULT_TTL
): Observable<T> {
  const cached = read<T>(key, ttl, platformId);

  const sourceWithWrite$ = source$.pipe(
    tap(data => write(key, data, platformId))
  );

  if (cached !== null) {
    sourceWithWrite$.subscribe({ error: () => {} }); // silent background refresh
    return of(cached);
  }

  return sourceWithWrite$;
}
