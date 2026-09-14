import { useState, useEffect } from 'react';

/**
 * App Version & APK In-App Update Helper Utilities
 * Handles Semantic Version comparison and Google Drive Direct Download URL conversion.
 */

export const DEFAULT_APP_VERSION = '3.8.6';
export const CURRENT_APP_VERSION = '3.8.6';
export const CURRENT_APP_VERSION_CODE = 386;

let activeAppVersion =
  (typeof window !== 'undefined' && localStorage.getItem('pirivena_active_app_version')) ||
  DEFAULT_APP_VERSION;

export function setActiveAppVersion(version: string) {
  if (version && typeof version === 'string' && version.trim()) {
    const cleanVer = version.trim().replace(/^v/i, '');
    activeAppVersion = cleanVer;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pirivena_active_app_version', cleanVer);
        window.dispatchEvent(
          new CustomEvent('app-version-updated', { detail: { version: cleanVer } })
        );
      } catch (_) { }
    }
  }
}

export function getActiveAppVersion(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('pirivena_active_app_version');
      if (stored) return stored;
    } catch (_) { }
  }
  return activeAppVersion || DEFAULT_APP_VERSION;
}

export function useAppVersion(): string {
  const [version, setVersion] = useState<string>(getActiveAppVersion());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVersionUpdated = (e: any) => {
      if (e?.detail?.version) {
        setVersion(e.detail.version);
      }
    };

    window.addEventListener('app-version-updated', handleVersionUpdated);
    // Also re-verify from storage
    const stored = getActiveAppVersion();
    if (stored && stored !== version) {
      setVersion(stored);
    }

    return () => window.removeEventListener('app-version-updated', handleVersionUpdated);
  }, []);

  return version;
}

/**
 * Compares two semantic version strings (e.g., '3.8.5' vs '3.8.6')
 * Returns:
 *   1 if v1 > v2 (v1 is newer)
 *  -1 if v1 < v2 (v2 is newer)
 *   0 if v1 === v2
 */
export function compareSemanticVersions(v1: string, v2: string): number {
  if (!v1 && !v2) return 0;
  if (!v1) return -1;
  if (!v2) return 1;

  const clean1 = v1.trim().replace(/^v/i, '');
  const clean2 = v2.trim().replace(/^v/i, '');

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Extract Google Drive File ID from any sharing/view URL format:
 * - https://drive.google.com/file/d/1A2B3C4D5E6F/view?usp=sharing
 * - https://drive.google.com/open?id=1A2B3C4D5E6F
 * - https://drive.google.com/uc?id=1A2B3C4D5E6F
 * - 1A2B3C4D5E6F (raw ID)
 */
export function extractGoogleDriveFileId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If it's already a clean raw Google Drive ID (typically 28-45 alphanumeric, dashes, underscores)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex patterns for Google Drive URL formats
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  const idQueryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (idQueryMatch && idQueryMatch[1]) {
    return idQueryMatch[1];
  }

  const ucMatch = trimmed.match(/\/uc\?id=([a-zA-Z0-9_-]+)/i);
  if (ucMatch && ucMatch[1]) {
    return ucMatch[1];
  }

  return null;
}

/**
 * Resolves any relative URL, CDN path, or Google Drive URL into a direct downloadable HTTPS URL.
 */
export function resolveDownloadUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/uc?export=download&id=${driveId}&confirm=t`;
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const base = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    'https://srisumanamahapiriwena-lk.us.stackstaging.com'
  ).replace(/\/+$/, '');

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${cleanPath}`;
}

export const getGoogleDriveDirectDownloadUrl = resolveDownloadUrl;
