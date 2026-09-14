import { useEffect, useState } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface MobileEnhancementsOptions {
  onBackToOverview?: () => void;
  isSubTabActive?: boolean;
  onRefreshData?: () => Promise<void> | void;
}

/**
 * useMobileNativeEnhancements
 * 
 * Background Native Device & Connection Enhancement Hook:
 * 1. Network Status (Online/Offline) detection with haptic alerts and auto-refresh.
 * 2. Virtual Keyboard Avoidance - smoothly scrolls focused input fields into center view.
 */
export function useMobileNativeEnhancements({
  onRefreshData,
}: MobileEnhancementsOptions = {}) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  // 1. ONLINE / OFFLINE NETWORK STATUS LISTENER
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
      triggerHaptic('light');
      if (onRefreshData) {
        onRefreshData();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
      triggerHaptic('heavy');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onRefreshData]);

  // 2. VIRTUAL KEYBOARD AUTO-SCROLL & VIEWPORT AVOIDANCE (Passive & Smooth)
  useEffect(() => {
    let timer: any;
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest',
            });
          } catch (err) {}
        }, 150);
      }
    };

    document.addEventListener('focusin', handleFocusIn, { passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  return {
    isOnline,
    showOfflineToast,
    setShowOfflineToast,
  };
}

