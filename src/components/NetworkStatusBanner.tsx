import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptics';

export const NetworkStatusBanner: React.FC = () => {
  const { language } = useLanguage();
  const isSi = language === 'si';

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showBackOnlineToast, setShowBackOnlineToast] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [serverErrorMsg, setServerErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let onlineTimer: any = null;

    const handleOnline = () => {
      setIsOnline(true);
      setServerErrorMsg(null);
      setShowBackOnlineToast(true);
      triggerHaptic('light');
      if (onlineTimer) clearTimeout(onlineTimer);
      onlineTimer = setTimeout(() => {
        setShowBackOnlineToast(false);
      }, 3500);
    };

    const handleOffline = () => {
      if (onlineTimer) clearTimeout(onlineTimer);
      setIsOnline(false);
      setShowBackOnlineToast(false);
      triggerHaptic('warning');
    };

    const handleApiNetworkError = (e: any) => {
      if (e.detail?.message) {
        setServerErrorMsg(e.detail.message);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('network-api-error', handleApiNetworkError);

    return () => {
      if (onlineTimer) clearTimeout(onlineTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('network-api-error', handleApiNetworkError);
    };
  }, []);

  const handleRetry = async () => {
    triggerHaptic('medium');
    setIsRetrying(true);

    // Test ping or re-check online state
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    // Trigger data refresh across active portals
    window.dispatchEvent(new CustomEvent('refresh-portal-data'));

    setTimeout(() => {
      setIsRetrying(false);
      setServerErrorMsg(null);
    }, 1200);
  };

  const isVisible = !isOnline || Boolean(serverErrorMsg);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed top-0 left-0 right-0 z-[999999] bg-stone-900/95 dark:bg-stone-950/95 backdrop-blur-xl border-b border-amber-500/50 text-white px-3.5 py-2.5 shadow-xl flex items-center justify-between gap-2.5 text-xs select-none pt-safe"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-2xs">
              <WifiOff className="w-4 h-4 animate-icon-pulse-glow" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif font-black text-amber-200 text-xs truncate">
                {!isOnline
                  ? isSi
                    ? 'අන්තර්ජාල සම්බන්ධතාවය ඇනහිට ඇත (No Internet)'
                    : 'No Internet Connection'
                  : isSi
                  ? 'ජාල සම්බන්ධතාවය පරීක්ෂා කරන්න'
                  : 'Connection Timeout'}
              </p>
              <p className="text-[10px] text-amber-300/80 truncate">
                {isSi
                  ? 'කරුණාකර ඔබගේ ජාලය පරීක්ෂා කර නැවත උත්සාහ කරන්න.'
                  : 'Please check your connection and try again.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0 font-serif"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? (isSi ? 'පරීක්ෂා කරමින්...' : 'Checking...') : isSi ? 'නැවත උත්සාහ කරන්න' : 'Retry'}</span>
          </button>
        </motion.div>
      )}

      {isOnline && showBackOnlineToast && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed top-0 left-0 right-0 z-[999999] bg-emerald-900/95 backdrop-blur-xl border-b border-emerald-500/50 text-white px-3.5 py-2.5 shadow-xl flex items-center justify-between text-xs select-none pt-safe"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
              <Wifi className="w-4 h-4 animate-icon-pulse-glow" />
            </div>
            <span className="font-serif font-black text-emerald-100 text-xs">
              {isSi
                ? '✓ අන්තර්ජාල සම්බන්ධතාවය සාර්ථකව තහවුරු විය (Online)'
                : '✓ Internet Connection Restored (Online)'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-300 font-bold font-mono">Synced</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
