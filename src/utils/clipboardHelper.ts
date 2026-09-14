import { triggerHaptic } from './haptics';

/**
 * Universal Mobile-Safe Clipboard Copy Utility
 * Works seamlessly on:
 * - Android APKs & Mobile WebViews
 * - iOS Safari & Chrome Mobile (even without HTTPS)
 * - Modern Desktop Browsers
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;

  try {
    triggerHaptic('light');
  } catch (e) {}

  // 1. Try modern navigator.clipboard API (if supported and permitted)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fall through to fallback
    }
  }

  // 2. Reliable Fallback using temporary textarea and document.execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');
    textArea.style.opacity = '0';
    textArea.style.zIndex = '-9999';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999); // Critical for iOS Safari

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (err) {
    console.error('Mobile clipboard fallback failed:', err);
    return false;
  }
};
