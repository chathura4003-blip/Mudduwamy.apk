import { useEffect, useState, useRef } from 'react';
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
 * 2. Virtual Keyboard Avoidance - smoothly scrolls focused input fields into view ONLY when occluded.
 */
export function useMobileNativeEnhancements({
  onRefreshData,
}: MobileEnhancementsOptions = {}) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const refreshCallbackRef = useRef(onRefreshData);
  refreshCallbackRef.current = onRefreshData;

  // 1. ONLINE / OFFLINE NETWORK STATUS LISTENER (Single stable registration)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
      triggerHaptic('light');
      if (refreshCallbackRef.current) {
        refreshCallbackRef.current();
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
  }, []);

  // 2. VIRTUAL KEYBOARD AUTO-SCROLL & VIEWPORT AVOIDANCE (Passive & Non-Jank)
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
            const rect = target.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            // Only scroll if element is positioned in the lower 45% of the screen (keyboard occlusion risk)
            if (rect.bottom > viewportHeight * 0.55 || rect.top < 60) {
              target.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
              });
            }
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


