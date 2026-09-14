import React from 'react';
import { getMediaUrl } from '../api/apiClient';

/**
 * Encoded SVG data URL representing a beautiful Buddhist themed placeholder
 * to be used when external images fail to load due to connection or DNS issues.
 */
export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2378350f'/%3E%3Cstop offset='100%25' stop-color='%231c1917'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23g)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='64' fill='%23fde68a'%3E☸%3C/text%3E%3C/svg%3E";

export const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2378350f'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23fde68a'%3E🪷%3C/text%3E%3C/svg%3E";

/**
 * Image error handler that replaces a broken image source with the fallback placeholder.
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = FALLBACK_IMAGE;
};

/**
 * Avatar error handler that replaces a broken avatar image source with a lotus placeholder.
 */
export const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = FALLBACK_AVATAR;
};

/**
 * Converts various YouTube URL formats (watch, youtu.be, shorts) into a clean embed URL.
 */
export const getYouTubeEmbedUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;

  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortsMatch = url.match(/shorts\/([a-zA-Z0-9_-]+)/);
  return url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
};

/**
 * Resolves an image URL to ensure relative upload paths have the backend domain.
 */
export const getImageUrl = (url?: string | null): string => {
  if (!url) return FALLBACK_IMAGE;
  return getMediaUrl(url);
};
