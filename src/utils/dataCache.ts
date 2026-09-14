// In-Memory Data Cache for instant zero-latency UI rendering
import { apiClient } from '../api/apiClient';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 15 * 1000; // 15 seconds cache TTL to keep tabs fresh on navigation

function getCacheUserSuffix(): string {
  try {
    const saved = localStorage.getItem('pirivena_user');
    if (saved) {
      const u = JSON.parse(saved);
      return `${u.id || u.customId || 'usr'}:${u.role || 'guest'}`;
    }
  } catch (e) {}
  return 'anon';
}

function buildCacheKey(url: string, method: string = 'GET'): string {
  return `${method}:${url}:${getCacheUserSuffix()}`;
}

const SENSITIVE_URL_PATTERNS = ['/auth/me', '/backup', '/site-settings/test-'];

function isSensitiveUrl(url: string): boolean {
  return SENSITIVE_URL_PATTERNS.some((pattern) => url.includes(pattern));
}

/**
 * Fetch data with in-memory caching strategy.
 * Returns cached data immediately if available and within TTL,
 * or fetches from API and caches the result.
 */
export async function cachedFetch<T = any>(
  url: string,
  options?: RequestInit,
  ttlMs: number = DEFAULT_TTL_MS,
  forceRefresh: boolean = false
): Promise<T> {
  const method = options?.method || 'GET';
  const cacheKey = buildCacheKey(url, method);
  const sensitive = isSensitiveUrl(url);

  if (!sensitive && !forceRefresh && memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey)!;
    const isFresh = Date.now() - entry.timestamp < ttlMs;
    if (isFresh) {
      return entry.data as T;
    }
  }

  try {
    const data = await apiClient<T>(url, options);
    if (!sensitive && method === 'GET') {
      if (memoryCache.size >= 120) {
        const oldestKey = memoryCache.keys().next().value;
        if (oldestKey) memoryCache.delete(oldestKey);
      }
      memoryCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    }
    return data;
  } catch (err) {
    if (!sensitive && memoryCache.has(cacheKey)) {
      return memoryCache.get(cacheKey)!.data as T;
    }
    throw err;
  }
}

/**
 * Manually update cache entry
 */
export function setCachedData<T = any>(url: string, data: T): void {
  if (isSensitiveUrl(url)) return;
  const cacheKey = buildCacheKey(url, 'GET');
  if (memoryCache.size >= 120) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) memoryCache.delete(oldestKey);
  }
  memoryCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Get cached data synchronously if available
 */
export function getCachedData<T = any>(url: string): T | null {
  const cacheKey = buildCacheKey(url, 'GET');
  const entry = memoryCache.get(cacheKey);
  return entry ? (entry.data as T) : null;
}

/**
 * Invalidate specific cache keys or all cache entries
 */
export function invalidateCache(urlPrefix?: string): void {
  if (!urlPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(urlPrefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Trigger complete system-wide UI refresh and instant data re-fetch across all portals & open tabs
 */
export function triggerFullAppRefresh(): void {
  invalidateCache();

  if (typeof window !== 'undefined') {
    const events = [
      'refresh-portal-data',
      'site-data-updated',
      'users-data-updated',
      'database-changed',
      'classes-updated',
      'subjects-updated',
      'curriculum-updated',
      'exams-updated',
      'materials-updated',
      'notices-updated',
      'admissions-updated',
      'donations-updated',
      'pirivena-users-updated',
      'pirivena-classes-updated',
      'pirivena-subjects-updated',
      'pirivena-notices-updated',
    ];

    events.forEach((evtName) => {
      try {
        window.dispatchEvent(new CustomEvent(evtName));
      } catch (_) {}
    });

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('pirivena_realtime_channel');
        bc.postMessage('refresh-portal-data');
        bc.close();
      } catch (_) {}
      try {
        const bc2 = new BroadcastChannel('pirivena-admin-sync');
        bc2.postMessage({ type: 'data-updated' });
        bc2.close();
      } catch (_) {}
    }
  }
}

