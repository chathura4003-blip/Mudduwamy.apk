import { Capacitor } from '@capacitor/core';
import { triggerHaptic } from './haptics';
import { copyToClipboard } from './clipboardHelper';
import { getPublicShareUrl } from './urlHelper';

export interface ShareDataPayload {
  title: string;
  text: string;
  url?: string;
  dialogTitle?: string;
}

/**
 * Universal Native Android, iOS & Web Share Helper
 * Supports Web Share API, Capacitor Share Plugin, and Social Fallbacks
 */
export async function shareContent(payload: ShareDataPayload): Promise<{ success: boolean; method: string }> {
  triggerHaptic('light');

  const shareUrl = payload.url || getPublicShareUrl();
  const fullText = shareUrl ? `${payload.text}\n\n🌐 ${shareUrl}` : payload.text;

  // 1. Try Native Capacitor Share Plugin if on Android/iOS native runtime
  try {
    const capShare = (window as any)?.Capacitor?.Plugins?.Share;
    if (Capacitor.isNativePlatform() && capShare && typeof capShare.share === 'function') {
      await capShare.share({
        title: payload.title,
        text: fullText,
        url: shareUrl,
        dialogTitle: payload.dialogTitle || payload.title,
      });
      triggerHaptic('success');
      return { success: true, method: 'native' };
    }
  } catch (e) {
    // fallback to Web Share
  }

  // 2. Try Native Web Share API (Android Chrome, iOS Safari, Edge)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      // First attempt with full share payload
      const shareData: ShareData = {
        title: payload.title,
        text: fullText,
      };
      if (shareUrl && shareUrl.startsWith('http')) {
        shareData.url = shareUrl;
      }

      if (!navigator.canShare || navigator.canShare(shareData)) {
        await navigator.share(shareData);
        triggerHaptic('success');
        return { success: true, method: 'web_share' };
      }
    } catch (e: any) {
      if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) {
        // User dismissed the native share sheet
        return { success: false, method: 'cancelled' };
      }
      // Retry with text-only payload if URL sharing was rejected
      try {
        await navigator.share({
          title: payload.title,
          text: fullText,
        });
        triggerHaptic('success');
        return { success: true, method: 'web_share' };
      } catch (innerErr: any) {
        if (innerErr && innerErr.name === 'AbortError') {
          return { success: false, method: 'cancelled' };
        }
      }
    }
  }

  // 3. Fallback: Copy full content to clipboard
  const copied = await copyToClipboard(fullText);
  if (copied) {
    triggerHaptic('success');
    return { success: true, method: 'clipboard' };
  }

  return { success: false, method: 'none' };
}

/**
 * Direct WhatsApp Share Helper
 */
export function shareToWhatsApp(text: string, phone?: string): boolean {
  triggerHaptic('light');
  const encodedText = encodeURIComponent(text);
  const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '';
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
}

/**
 * Direct Telegram Share Helper
 */
export function shareToTelegram(text: string, url?: string): boolean {
  triggerHaptic('light');
  const encodedText = encodeURIComponent(text);
  const encodedUrl = url ? encodeURIComponent(url) : '';
  const tgUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
}

/**
 * Direct SMS / Message Share Helper
 */
export function shareToSms(text: string, phone?: string): boolean {
  triggerHaptic('light');
  const encodedText = encodeURIComponent(text);
  const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '';
  const smsUrl = cleanPhone
    ? `sms:${cleanPhone}?body=${encodedText}`
    : `sms:?body=${encodedText}`;

  if (typeof window !== 'undefined') {
    window.location.href = smsUrl;
    return true;
  }
  return false;
}
