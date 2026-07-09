/**
 * Lightweight in-process TTL cache — zero external dependencies.
 * Works perfectly on Render (single process) and handles burst traffic.
 * Entries auto-expire; no background timer needed.
 */

const _store = new Map();

/**
 * @param {string} key
 * @returns {any|null} cached value or null if missing/expired
 */
function cacheGet(key) {
  const entry = _store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs  time-to-live in milliseconds
 */
function cacheSet(key, value, ttlMs) {
  _store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Delete one key */
function cacheDel(key) {
  _store.delete(key);
}

/** Delete all keys that start with `prefix` */
function cacheClear(prefix) {
  for (const k of _store.keys()) {
    if (k.startsWith(prefix)) _store.delete(k);
  }
}

/** Flush the entire cache (useful for testing) */
function cacheFlush() {
  _store.clear();
}

const MIN  = 60_000;
const HOUR = 60 * MIN;

module.exports = { cacheGet, cacheSet, cacheDel, cacheClear, cacheFlush, MIN, HOUR };
