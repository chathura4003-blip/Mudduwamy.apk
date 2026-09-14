import { apiClient, onApiMutation } from '../api/apiClient';

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

const SENSITIVE_URL_PATTERNS = [
  '/auth/me',
  '/backup',
  '/site-settings/test-',
  '/passwords',
  '/tokens',
  '/security',
  '/active-sessions',
  '/force-logout',
  '/audit-logs',
];

function isSensitiveUrl(url: string): boolean {
  return SENSITIVE_URL_PATTERNS.some((pattern) => url.includes(pattern));
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
 * Intelligent invalidation for related resources after a mutation
 */
export function invalidateRelatedCache(endpoint: string): void {
  if (!endpoint) return;
  const lower = endpoint.toLowerCase();
  if (lower.includes('/classes')) {
    invalidateCache('/api/classes');
  } else if (lower.includes('/subjects')) {
    invalidateCache('/api/subjects');
  } else if (lower.includes('/users') || lower.includes('/students') || lower.includes('/teachers')) {
    invalidateCache('/api/users');
    invalidateCache('/api/students');
    invalidateCache('/api/teachers');
  } else if (lower.includes('/exams') || lower.includes('/submissions')) {
    invalidateCache('/api/exams');
    invalidateCache('/api/submissions');
  } else if (lower.includes('/materials')) {
    invalidateCache('/api/materials');
  } else if (lower.includes('/broadcast-notices')) {
    invalidateCache('/api/broadcast-notices');
  } else if (lower.includes('/news') || lower.includes('/events') || lower.includes('/gallery')) {
    invalidateCache('/api/news');
    invalidateCache('/api/events');
    invalidateCache('/api/gallery');
  } else {
    invalidateCache(endpoint);
  }
}

// Automatically purge relevant cache keys whenever a mutation succeeds
if (typeof window !== 'undefined') {
  onApiMutation((endpoint) => {
    invalidateRelatedCache(endpoint);
  });
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
 * Trigger complete system-wide UI refresh and instant data re-fetch across all portals & open tabs.
 * Dispatches the single authoritative 'refresh-portal-data' event to eliminate duplicate event storms.
 */
export function triggerFullAppRefresh(): void {
  invalidateCache();

  if (typeof window !== 'undefined') {
    // 1. Authoritative refresh signal across active tab
    window.dispatchEvent(new CustomEvent('refresh-portal-data'));

    // 2. Cross-tab real-time synchronization (single clean broadcast)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('pirivena_realtime_channel');
        bc.postMessage('refresh-portal-data');
        bc.close();
      } catch (_) {}
    }
  }
}

