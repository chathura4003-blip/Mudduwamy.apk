/**
 * Native Android APK & Web Tactile Haptic Feedback Utility
 * 
 * Supports:
 * 1. Native Capacitor Haptics Hardware Motor (@capacitor/haptics)
 * 2. Web Vibration API (navigator.vibrate)
 * 3. Graceful fallback on non-supported environments
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'selection';

let capacitorHaptics: any = null;

// Lazy-load Capacitor Haptics plugin
if (typeof window !== 'undefined') {
  import('@capacitor/haptics')
    .then((module) => {
      capacitorHaptics = module.Haptics;
    })
    .catch(() => {});
}

export const isHapticFeedbackEnabled = (): boolean => {
  try {
    const saved = localStorage.getItem('pirivena_haptic_feedback');
    if (saved !== null) {
      return saved === 'true';
    }
    const vib = localStorage.getItem('pirivena_vibrate_enabled');
    if (vib !== null) {
      return vib === 'true';
    }
    return true; // Default enabled
  } catch {
    return true;
  }
};

export const setHapticFeedbackEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem('pirivena_haptic_feedback', enabled ? 'true' : 'false');
    localStorage.setItem('pirivena_vibrate_enabled', enabled ? 'true' : 'false');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('haptic-feedback-setting-changed', { detail: enabled })
      );
    }
  } catch {}
};

export const triggerHaptic = (type: HapticType = 'light', force: boolean = false) => {
  try {
    if (!force && !isHapticFeedbackEnabled()) return;

    // 1. Try Native Capacitor Haptics Plugin first (Real Android Tactile Engine)
    if (capacitorHaptics) {
      switch (type) {
        case 'light':
        case 'selection':
          capacitorHaptics.selectionStart?.().catch(() => {});
          capacitorHaptics.impact?.({ style: 'LIGHT' }).catch(() => {});
          return;
        case 'medium':
          capacitorHaptics.impact?.({ style: 'MEDIUM' }).catch(() => {});
          return;
        case 'heavy':
          capacitorHaptics.impact?.({ style: 'HEAVY' }).catch(() => {});
          return;
        case 'success':
          capacitorHaptics.notification?.({ type: 'SUCCESS' }).catch(() => {});
          return;
        case 'warning':
          capacitorHaptics.notification?.({ type: 'WARNING' }).catch(() => {});
          return;
        default:
          capacitorHaptics.impact?.({ style: 'LIGHT' }).catch(() => {});
          return;
      }
    }

    // 2. Fallback to Browser / WebView Vibration API
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        // Prevent Chrome intervention warning if user hasn't interacted with page yet
        if ((navigator as any).userActivation && !(navigator as any).userActivation.hasBeenActive) {
          return;
        }
        switch (type) {
          case 'light':
          case 'selection':
            navigator.vibrate(12);
            break;
          case 'medium':
            navigator.vibrate(28);
            break;
          case 'heavy':
            navigator.vibrate(50);
            break;
          case 'success':
            navigator.vibrate([15, 30, 20]);
            break;
          case 'warning':
            navigator.vibrate([30, 50, 30]);
            break;
          default:
            navigator.vibrate(12);
        }
      } catch (_) {}
    }
  } catch (e) {
    // Graceful silent fallback
  }
};
