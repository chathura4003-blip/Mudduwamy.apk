import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowDown, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { triggerFullAppRefresh } from '../utils/dataCache';
import { useLanguage } from '../context/LanguageContext';

interface PullToRefreshWrapperProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
  className?: string;
  pullThreshold?: number;
  maxPullDistance?: number;
  disabled?: boolean;
}

const PULL_THRESHOLD = 65;
const MAX_PULL_DISTANCE = 110;

/**
 * Ultra-Smooth Native-Grade Mobile Pull-To-Refresh Gesture Component
 * Supports touch gestures on Android/iOS Capacitor WebView, Mobile Browsers & Desktop
 */
export const PullToRefreshWrapper: React.FC<PullToRefreshWrapperProps> = ({
  children,
  onRefresh,
  className = '',
  pullThreshold = PULL_THRESHOLD,
  maxPullDistance = MAX_PULL_DISTANCE,
  disabled = false,
}) => {
  const { language } = useLanguage();
  const isSi = language === 'si';

  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState<boolean>(false);

  const startYRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const isTrackingRef = useRef<boolean>(false);
  const isAtTopRef = useRef<boolean>(false);

  const isScrolledToTop = useCallback(() => {
    if (typeof window === 'undefined') return true;
    const windowScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const containerScrollTop = containerRef.current?.scrollTop || 0;
    return windowScrollTop <= 3 && containerScrollTop <= 3;
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;
    if (e.touches.length !== 1) return;

    if (isScrolledToTop()) {
      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isTrackingRef.current = true;
      isAtTopRef.current = true;
      setHasTriggeredHaptic(false);
    } else {
      isTrackingRef.current = false;
      isAtTopRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTrackingRef.current || disabled || isRefreshing) return;
    if (e.touches.length !== 1) return;

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - startYRef.current;
    const deltaX = currentX - startXRef.current;

    // If horizontal scroll is dominant, cancel pull-to-refresh to avoid hijacking horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isTrackingRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    // Require minimum pull distance of 12px before hijacking touch, so taps and micro-movements on buttons are preserved
    const MIN_PULL_TRIGGER = 12;
    if (deltaY > MIN_PULL_TRIGGER && isScrolledToTop()) {
      setIsPulling(true);
      // Logarithmic rubber-band resistance curve
      const calculatedDistance = Math.min(
        maxPullDistance,
        Math.pow(deltaY - MIN_PULL_TRIGGER, 0.82) * 1.8
      );

      setPullDistance(calculatedDistance);

      // Light haptic feedback once threshold is crossed
      if (calculatedDistance >= pullThreshold && !hasTriggeredHaptic) {
        triggerHaptic('light');
        setHasTriggeredHaptic(true);
      } else if (calculatedDistance < pullThreshold && hasTriggeredHaptic) {
        setHasTriggeredHaptic(false);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleTouchEnd = async () => {
    if (!isTrackingRef.current) return;
    isTrackingRef.current = false;
    setIsPulling(false);

    if (pullDistance >= pullThreshold && !isRefreshing && !disabled) {
      triggerHaptic('medium');
      setIsRefreshing(true);
      setPullDistance(50); // Hold height while refreshing

      try {
        // Trigger universal app refresh
        triggerFullAppRefresh();
        if (onRefresh) {
          await onRefresh();
        }
      } catch (err) {
        console.warn('Pull to refresh error:', err);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setHasTriggeredHaptic(false);
        }, 500);
      }
    } else {
      setPullDistance(0);
      setHasTriggeredHaptic(false);
    }
  };

  // Reset pull distance on navigation / unmount
  useEffect(() => {
    return () => {
      setPullDistance(0);
      setIsPulling(false);
      setIsRefreshing(false);
    };
  }, []);

  const progressPercent = Math.min(100, Math.round((pullDistance / pullThreshold) * 100));
  const isReadyToRelease = pullDistance >= pullThreshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`w-full min-h-full relative ${className}`}
    >
      {/* 🌟 Dynamic Pull-to-Refresh Floating Indicator */}
      {(isPulling || isRefreshing || pullDistance > 0) && (
        <div
          style={{
            transform: `translate3d(-50%, ${Math.max(0, pullDistance - 45)}px, 0)`,
            opacity: Math.min(1, Math.max(0, (pullDistance - 10) / 30)),
            transition: isPulling ? 'none' : 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          className="fixed left-1/2 top-14 sm:top-18 z-[9999] pointer-events-none -translate-x-1/2 flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 dark:bg-stone-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-md text-slate-800 dark:text-slate-100 select-none animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Animated Spinner / Rotating Arrow */}
          <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
            {isRefreshing ? (
              <RefreshCw className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 animate-spin" />
            ) : isReadyToRelease ? (
              <Sparkles className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 animate-pulse scale-110" />
            ) : (
              <div
                style={{ transform: `rotate(${progressPercent * 1.8}deg)` }}
                className="transition-transform duration-75"
              >
                <ArrowDown className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
              </div>
            )}
          </div>

          {/* Status Text */}
          <span className="text-xs font-bold font-serif whitespace-nowrap">
            {isRefreshing
              ? isSi
                ? 'යාවත්කාලීන වෙමින් පවතී...'
                : 'Refreshing Data...'
              : isReadyToRelease
              ? isSi
                ? 'මුදාහරින්න (Release to Sync)'
                : 'Release to Sync'
              : isSi
              ? 'පහළට අදින්න...'
              : 'Pull down to refresh'}
          </span>
        </div>
      )}

      {/* Main Content with subtle translateY elasticity during active pull */}
      <div
        style={{
          transform: pullDistance > 0 ? `translate3d(0, ${pullDistance * 0.4}px, 0)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className="w-full min-h-full"
      >
        {children}
      </div>
    </div>
  );
};
