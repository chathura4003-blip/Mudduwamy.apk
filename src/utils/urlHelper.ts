/**
 * Universal App & Share URL Helper
 * Prevents 'localhost' or 'capacitor://' from being shared to students or parents.
 */

export const OFFICIAL_PUBLIC_WEB_URL = 'https://srisumanamahapiriwena-lk.us.stackstaging.com';

/**
 * Returns a clean, production-ready URL for sharing credentials, report cards, and certificates.
 */
export function getPublicShareUrl(path = ''): string {
  if (typeof window === 'undefined') return OFFICIAL_PUBLIC_WEB_URL;

  const origin = window.location.origin;
  const isLocalOrNative =
    !origin ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.includes('capacitor://') ||
    origin.includes('ionic://') ||
    origin.includes('file://');

  const base = isLocalOrNative ? OFFICIAL_PUBLIC_WEB_URL : origin;
  const cleanPath = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${base}${cleanPath}`;
}
