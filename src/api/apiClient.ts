export interface RequestOptions extends Omit<RequestInit, 'body'> {
  timeout?: number;
  skipAuth?: boolean;
  body?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  data: any;

  constructor(message: string, status: number, code: string = 'ERROR', data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

type UnauthorizedHandler = () => void;
const onUnauthorizedListeners: Set<UnauthorizedHandler> = new Set();

export function onUnauthorized(callback: UnauthorizedHandler): () => void {
  onUnauthorizedListeners.add(callback);
  return () => {
    onUnauthorizedListeners.delete(callback);
  };
}

export function notifyUnauthorized() {
  onUnauthorizedListeners.forEach((fn) => fn());
}

export type ApiMutationHandler = (endpoint: string, method: string) => void;
const onApiMutationListeners: Set<ApiMutationHandler> = new Set();

export function onApiMutation(callback: ApiMutationHandler): () => void {
  onApiMutationListeners.add(callback);
  return () => {
    onApiMutationListeners.delete(callback);
  };
}

export function notifyApiMutation(endpoint: string, method: string) {
  onApiMutationListeners.forEach((fn) => {
    try {
      fn(endpoint, method);
    } catch (_) {}
  });
}

/**
 * Standardize unwrapping of API response envelopes ({ success: true, data: T })
 * while remaining fully backward-compatible with raw data payloads.
 */
export function unwrapApiResponse<T = any>(res: any): T {
  if (res && typeof res === 'object' && 'success' in res && 'data' in res && res.data !== undefined) {
    return res.data as T;
  }
  return res as T;
}

/**
 * Clean, production-grade API Client that communicates directly with
 * backend database APIs with comprehensive network resilience.
 */
async function parseResponseBody(response: Response): Promise<{ data: any; text: string; contentType: string }> {
  const contentType = response.headers.get('content-type') || '';
  let text = '';
  try {
    text = await response.text();
  } catch (readErr) {
    return { data: null, text: '', contentType };
  }
  const trimmed = text.trim();

  if (!trimmed) {
    return { data: null, text: '', contentType };
  }

  // 1. Check for standard JSON
  if (contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return { data: JSON.parse(trimmed), text, contentType };
    } catch (parseError) {
      const jsonLikeMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonLikeMatch) {
        try {
          return { data: JSON.parse(jsonLikeMatch[1]), text, contentType };
        } catch (e) {
          // fall through to text handler
        }
      }
    }
  }

  // 2. If server returned HTML (e.g. 502 Bad Gateway / Cloudflare / Apache error)
  if (trimmed.startsWith('<') || trimmed.includes('<!DOCTYPE') || trimmed.includes('<html')) {
    let cleanMessage = 'සේවාදායකය ප්‍රතිචාර දැක්වීම අසාර්ථක විය (Server Error)';
    const titleMatch = trimmed.match(/<title[^>]*>([^<]+)<\/title>/i);
    const h1Match = trimmed.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (titleMatch && titleMatch[1]) {
      cleanMessage = titleMatch[1].trim();
    } else if (h1Match && h1Match[1]) {
      cleanMessage = h1Match[1].trim();
    }
    return { data: { error: cleanMessage }, text: cleanMessage, contentType };
  }

  return { data: trimmed, text, contentType };
}

// In-flight GET request deduplication map to prevent redundant concurrent server queries
const inFlightRequests = new Map<string, Promise<any>>();

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {},
  retries = 2
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Deduplicate identical simultaneous GET requests
  if (isGet) {
    const dedupeKey = `${endpoint}`;
    if (inFlightRequests.has(dedupeKey)) {
      return inFlightRequests.get(dedupeKey)!;
    }
    const requestPromise = executeRequest<T>(endpoint, options, retries).finally(() => {
      inFlightRequests.delete(dedupeKey);
    });
    inFlightRequests.set(dedupeKey, requestPromise);
    return requestPromise;
  }

  return executeRequest<T>(endpoint, options, retries);
}

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'https://srisumanamahapiriwena-lk.us.stackstaging.com';

export function isNativeMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window as any).Capacitor !== undefined ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    window.location.protocol === 'ionic:' ||
    window.location.hostname === 'localhost' ||
    window.location.origin.includes('localhost') ||
    navigator.userAgent.includes('wv') ||
    navigator.userAgent.includes('Capacitor')
  );
}

export function getFullApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!base) return path;
  return `${base}${path}`;
}

export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) return cleanPath;
  return `${base}${cleanPath}`;
}

function getStatusErrorMessage(status: number, customMessage?: string): string {
  if (customMessage && customMessage.trim().length > 0 && !customMessage.startsWith('HTTP Error')) {
    return customMessage;
  }
  switch (status) {
    case 400:
      return 'ඉල්ලීමේ දෝෂයක් පවතී (Invalid Request).';
    case 401:
      return 'ප්‍රවේශ සැසිය කල් ඉකුත් වී ඇත. කරුණාකර නැවත Log In වන්න. (Session expired. Please log in again.)';
    case 403:
      return 'මෙම ක්‍රියාව සිදු කිරීමට ඔබට ප්‍රමාණවත් අවසර නොමැත (Access Forbidden).';
    case 404:
      return 'ඉල්ලූ තොරතුර හෝ සේවාව සොයාගත නොහැක (Resource Not Found).';
    case 408:
      return 'සේවාදායකය ප්‍රතිචාර දැක්වීම ප්‍රමාද විය (Request Timeout). කරුණාකර නැවත උත්සාහ කරන්න.';
    case 422:
      return 'ඇතුළත් කළ දත්තවල දෝෂයක් පවතී (Validation Error). කරුණාකර පරීක්ෂා කරන්න.';
    case 429:
      return 'ඉල්ලීම් ප්‍රමාණය වැඩි වී ඇත (Too Many Requests). කරුණාකර සුළු වේලාවකින් නැවත උත්සාහ කරන්න.';
    case 500:
      return 'සේවාදායකයේ අභ්‍යන්තර දෝෂයක් (Internal Server Error). කරුණාකර සුළු මොහොතකින් නැවත උත්සාහ කරන්න.';
    case 502:
    case 503:
    case 504:
      return 'සේවාදායකය තාවකාලිකව කාර්යබහුලයි (Service Unavailable). කරුණාකර නැවත උත්සාහ කරන්න.';
    default:
      return `සේවාදායකයේ දෝෂයක් (HTTP Error ${status})`;
  }
}

function getErrorCodeForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 408:
      return 'TIMEOUT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMITED';
    case 500:
      return 'INTERNAL_SERVER_ERROR';
    case 502:
    case 503:
    case 504:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'API_ERROR';
  }
}

async function executeRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {},
  retries = 2
): Promise<T> {
  const { timeout = 45000, skipAuth = false, headers: customHeaders, body, credentials = 'same-origin', ...rest } = options;

  // Fast offline check before issuing fetch
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const offlineMsg = 'අන්තර්ජාල සම්බන්ධතාවය ඇනහිට ඇත. කරුණාකර ඔබගේ ජාලය පරීක්ෂා කරන්න. (No Internet Connection)';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('network-api-error', { detail: { message: offlineMsg } }));
    }
    throw new ApiError(offlineMsg, 0, 'OFFLINE');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const headers = new Headers(customHeaders || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (!skipAuth) {
    const token = localStorage.getItem('pirivena_token');
    if (token) {
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('X-Authorization', `Bearer ${token}`);
      headers.set('X-Auth-Token', token);
    }
  }

  let formattedBody: any = body;
  if (
    body &&
    !(body instanceof FormData) &&
    typeof body === 'object' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
    formattedBody = JSON.stringify(body);
  }

  const url = getFullApiUrl(endpoint);

  try {
    const response = await fetch(url, {
      ...rest,
      headers,
      body: formattedBody,
      signal: controller.signal,
      credentials,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';

    // Handle 401 Unauthorized
    if (response.status === 401) {
      if (
        !endpoint.includes('/api/auth') &&
        !endpoint.includes('/api/ai/') &&
        !endpoint.includes('/api/upload') &&
        !endpoint.includes('/api/donations') &&
        !endpoint.includes('active-sessions') &&
        !endpoint.includes('system-status')
      ) {
        notifyUnauthorized();
      }
      let errMessage = getStatusErrorMessage(401);
      let errData: any = null;
      try {
        errData = await response.json();
        if (errData?.error) errMessage = errData.error;
      } catch (e) {}
      throw new ApiError(errMessage, 401, 'UNAUTHORIZED', errData);
    }

    // Handle Non-OK responses (400, 403, 404, 422, 429, 500, 502, 503, 504)
    if (!response.ok) {
      let errMessage = getStatusErrorMessage(response.status);
      let errData: any = null;
      try {
        const parsed = await parseResponseBody(response);
        if (parsed.data && typeof parsed.data === 'object') {
          errData = parsed.data;
          if (errData?.error) errMessage = errData.error;
          else if (errData?.message) errMessage = errData.message;
        } else if (parsed.text) {
          errMessage = parsed.text;
        }
      } catch (e) {}

      // Auto-retry server transient 502/503/504 errors on GET requests
      if (retries > 0 && (response.status === 502 || response.status === 503 || response.status === 504)) {
        await new Promise((r) => setTimeout(r, 600));
        return executeRequest<T>(endpoint, options, retries - 1);
      }

      const errorCode = (errData?.code || errData?.error && isNaN(Number(errData.error))) ? errData.error : getErrorCodeForStatus(response.status);
      throw new ApiError(getStatusErrorMessage(response.status, errMessage), response.status, errorCode, errData);
    }

    const reqMethod = (options.method || 'GET').toUpperCase();
    if (reqMethod !== 'GET') {
      notifyApiMutation(endpoint, reqMethod);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const parsed = await parseResponseBody(response);
    if (parsed.contentType.includes('application/json') || typeof parsed.data === 'object') {
      return parsed.data as T;
    }

    return parsed.text as unknown as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      const timeoutMessage = 'සේවාදායකය ප්‍රතිචාර දැක්වීම ප්‍රමාද විය. කරුණාකර නැවත උත්සාහ කරන්න. (Request timed out. Please try again.)';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('network-api-error', { detail: { message: timeoutMessage } }));
      }
      throw new ApiError(timeoutMessage, 408, 'TIMEOUT');
    }

    if (error instanceof ApiError) {
      throw error;
    }

    const msg = error?.message || String(error || '');

    // Auto-retry transient network errors with exponential backoff
    if (
      retries > 0 &&
      (msg.includes('Failed to fetch') ||
        msg.includes('NETWORK_CHANGED') ||
        msg.includes('network') ||
        msg.includes('NetworkError') ||
        msg.includes('Load failed') ||
        msg.includes('ERR_NAME_NOT_RESOLVED') ||
        msg.includes('ERR_CONNECTION_REFUSED') ||
        msg.includes('ERR_INTERNET_DISCONNECTED'))
    ) {
      await new Promise((r) => setTimeout(r, 500));
      return executeRequest<T>(endpoint, options, retries - 1);
    }

    if (typeof msg === 'string' && (msg.includes('M_ID') || msg.includes("reading 'M_ID'"))) {
      console.warn('Browser extension intercept exception caught:', msg);
      return [] as unknown as T;
    }

    const isNetworkErr =
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('NETWORK_CHANGED') ||
      msg.includes('Load failed') ||
      msg.includes('network') ||
      msg.includes('ERR_NAME_NOT_RESOLVED') ||
      msg.includes('ERR_CONNECTION_REFUSED') ||
      msg.includes('ERR_INTERNET_DISCONNECTED');

    const userFriendlyMessage = isNetworkErr
      ? 'ජාල සම්බන්ධතාවය අසාර්ථක විය. කරුණාකර ඔබගේ අන්තර්ජාල සම්බන්ධතාවය පරීක්ෂා කර නැවත උත්සාහ කරන්න. (Connection failed. Please check your internet connection and try again.)'
      : msg;

    if (isNetworkErr && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('network-api-error', { detail: { message: userFriendlyMessage } })
      );
    }

    throw new ApiError(userFriendlyMessage, 500, isNetworkErr ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR');
  }
}
