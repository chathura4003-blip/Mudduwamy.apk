import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  UserCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import type { BroadcastNotice, User } from '../types';
import { broadcastApi } from '../api';
import { formatSriLankaDate } from '../utils/sriLankaTime';
import { playNotificationSound } from '../utils/soundHelper';
import { triggerHaptic } from '../utils/haptics';
import { appLifecycleManager } from '../services/appLifecycleManager';
import { notificationService } from '../services/notificationService';
import { oneSignalService } from '../services/oneSignalService';

interface BroadcastNoticeBannerProps {
  user: User | null;
}

const SEEN_NOTICES_KEY = 'pirivena_seen_notices';

const COLOR_PALETTES: Record<string, string> = {
  red: 'bg-gradient-to-r from-red-950 via-red-900 to-stone-900 text-red-100 border-red-500/60 shadow-md',
  amber: 'bg-gradient-to-r from-slate-900 via-stone-900 to-amber-950 text-amber-100 border-amber-500/60 shadow-md',
  blue: 'bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-blue-100 border-blue-500/60 shadow-md',
  emerald: 'bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 text-emerald-100 border-emerald-500/60 shadow-md',
  purple: 'bg-gradient-to-r from-purple-950 via-indigo-950 to-stone-900 text-purple-100 border-purple-500/60 shadow-md',
  rose: 'bg-gradient-to-r from-rose-950 via-pink-950 to-stone-900 text-rose-100 border-rose-500/60 shadow-md',
  orange: 'bg-gradient-to-r from-orange-950 via-amber-900 to-stone-900 text-orange-100 border-orange-500/60 shadow-md',
  cyan: 'bg-gradient-to-r from-teal-950 via-cyan-950 to-stone-900 text-cyan-100 border-teal-500/60 shadow-md',
  charcoal: 'bg-gradient-to-r from-stone-950 via-stone-900 to-slate-900 text-slate-100 border-slate-700/80 shadow-md',
};

const getSeenNoticeIds = (): string[] => {
  try {
    const raw = localStorage.getItem(SEEN_NOTICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const markNoticeAsSeen = (noticeId: string | number) => {
  try {
    const idStr = String(noticeId);
    sessionStorage.setItem(`pirivena_session_dismissed_${idStr}`, 'true');

    const seenIds = getSeenNoticeIds();
    if (!seenIds.includes(idStr)) {
      seenIds.push(idStr);
      localStorage.setItem(SEEN_NOTICES_KEY, JSON.stringify(seenIds.slice(-100)));
    }
  } catch {}
};

const isNoticeApplicable = (notice: BroadcastNotice, user: User | null, now: Date): boolean => {
  const isActive =
    notice.active === true || (notice.active as any) === 1 || (notice.active as any) === '1' || notice.active === undefined;
  if (!isActive) return false;
  if (notice.expiryDate && new Date(notice.expiryDate) < now) return false;

  const target = (notice.targetRole || (notice as any).targetAudience || 'all').toLowerCase().trim();
  if (target === 'all' || target === 'public' || target === '') return true;
  if (!user) return false;
  if (user.role === 'student' && (target === 'students' || target === 'student')) return true;
  if (user.role === 'teacher' && (target === 'teachers' || target === 'teacher')) return true;
  if (user.role === 'admin' || user.role === 'superadmin') return true;
  return false;
};

const getBannerStyle = (notice?: BroadcastNotice | null): string => {
  if (notice?.customColor && COLOR_PALETTES[notice.customColor]) {
    return COLOR_PALETTES[notice.customColor];
  }
  return 'bg-gradient-to-r from-slate-900 via-slate-850 to-stone-900 text-white border-slate-700 shadow-md';
};

export const BroadcastNoticeBanner: React.FC<BroadcastNoticeBannerProps> = ({ user }) => {
  const [notices, setNotices] = useState<BroadcastNotice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedModalNotice, setSelectedModalNotice] = useState<BroadcastNotice | null>(null);

  const prevNoticesJsonRef = useRef<string>('');
  const initialFetchDone = useRef(false);

  const triggerSystemNotification = (notice: BroadcastNotice) => {
    playNotificationSound();
    triggerHaptic('heavy');

    if (!oneSignalService.isAvailable()) {
      const title = notice.titleSinhala || notice.title || 'ශ්‍රී සුමන පිරිවෙන් නිවේදනය';
      const body = notice.messageSinhala || notice.message || '';

      notificationService.scheduleNotification({
        stableKey: `broadcast_notice_${notice.id || notice.title}`,
        title,
        body,
        sound: true,
      });
    }
  };

  const checkNewNotices = useCallback((freshNotices: BroadcastNotice[], isInitialLoad = false) => {
    try {
      const now = new Date();
      const applicable = freshNotices.filter((n) => isNoticeApplicable(n, user, now));
      if (applicable.length === 0) return;

      const seenIds = getSeenNoticeIds();

      if (isInitialLoad && seenIds.length === 0) {
        const allIds = applicable.map((n) => String(n.id || n.title));
        localStorage.setItem(SEEN_NOTICES_KEY, JSON.stringify(allIds));
        return;
      }

      const unacknowledgedNotice = applicable.find((n) => {
        const id = String(n.id || n.title);
        if (seenIds.includes(id)) return false;
        try {
          if (sessionStorage.getItem(`pirivena_session_dismissed_${id}`)) return false;
        } catch {}
        return true;
      });

      if (unacknowledgedNotice) {
        setSelectedModalNotice(unacknowledgedNotice);
        triggerSystemNotification(unacknowledgedNotice);
        markNoticeAsSeen(unacknowledgedNotice.id || unacknowledgedNotice.title);
      }
    } catch {}
  }, [user]);

  const fetchNotices = useCallback(() => {
    broadcastApi
      .getNotices()
      .then((data) => {
        if (Array.isArray(data)) {
          const json = JSON.stringify(data);
          if (prevNoticesJsonRef.current !== json) {
            prevNoticesJsonRef.current = json;
            setNotices(data);
            if (initialFetchDone.current) {
              checkNewNotices(data, false);
            }
          }

          if (!initialFetchDone.current) {
            initialFetchDone.current = true;
            checkNewNotices(data, true);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch broadcast notices:', err));
  }, [checkNewNotices]);

  useEffect(() => {
    fetchNotices();

    const cleanupPoll = appLifecycleManager.registerPollTask(
      'broadcast_notices_poll',
      fetchNotices,
      15000,
      { runImmediately: false, runImmediatelyOnResume: true, allowBackground: true, backgroundIntervalMs: 25000 }
    );

    const eventNames = ['broadcast-notices-updated', 'site-data-updated', 'pirivena-notices-updated'];
    const handleSync = () => fetchNotices();
    eventNames.forEach((ev) => window.addEventListener(ev, handleSync));

    let bc: BroadcastChannel | null = null;
    let bc2: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('pirivena-admin-sync');
      bc.onmessage = () => fetchNotices();
    } catch {}
    try {
      bc2 = new BroadcastChannel('pirivena_realtime_channel');
      bc2.onmessage = () => fetchNotices();
    } catch {}

    return () => {
      cleanupPoll();
      eventNames.forEach((ev) => window.removeEventListener(ev, handleSync));
      if (bc) bc.close();
      if (bc2) bc2.close();
    };
  }, [fetchNotices]);

  const handleCloseModal = useCallback(() => {
    triggerHaptic('light');
    if (selectedModalNotice) {
      markNoticeAsSeen(selectedModalNotice.id || selectedModalNotice.title);
    }
    setSelectedModalNotice(null);
  }, [selectedModalNotice]);

  useEffect(() => {
    if (selectedModalNotice) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedModalNotice]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedModalNotice) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModalNotice, handleCloseModal]);

  const activeNotices = useMemo(() => {
    const now = new Date();
    return notices.filter((n) => isNoticeApplicable(n, user, now));
  }, [notices, user]);

  const validIndex = activeNotices.length > 0 ? currentIndex % activeNotices.length : 0;
  const currentNotice = activeNotices[validIndex] || null;

  return (
    <>
      {/* 1. STICKY TOP TICKER BANNER (WHEN ACTIVE NOTICES EXIST) */}
      {activeNotices.length > 0 && currentNotice && (
        <div
          className={`w-full px-3 py-2 border-b text-xs flex items-center justify-between gap-2.5 transition-all select-none cursor-pointer ${getBannerStyle(
            currentNotice
          )}`}
          onClick={() => {
            triggerHaptic('light');
            setSelectedModalNotice(currentNotice);
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center text-xs shrink-0 shadow-2xs">
              {currentNotice.customIcon || '📢'}
            </div>

            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-black uppercase tracking-wider shrink-0">
                {currentNotice.severity || 'ALERT'}
              </span>
              <span className="font-bold truncate text-xs">
                {currentNotice.titleSinhala || currentNotice.title}
              </span>
              <span className="opacity-80 hidden md:inline truncate text-[11px]">
                — {currentNotice.messageSinhala || currentNotice.message}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                triggerHaptic('light');
                setSelectedModalNotice(currentNotice);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Eye className="w-3 h-3" />
              <span>බලන්න</span>
            </button>

            {activeNotices.length > 1 && (
              <div className="flex items-center gap-0.5 text-white/80">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('light');
                    setCurrentIndex((currentIndex - 1 + activeNotices.length) % activeNotices.length);
                  }}
                  className="p-1 hover:bg-white/20 rounded transition cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold px-1">
                  {validIndex + 1}/{activeNotices.length}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('light');
                    setCurrentIndex((currentIndex + 1) % activeNotices.length);
                  }}
                  className="p-1 hover:bg-white/20 rounded transition cursor-pointer active:scale-95"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. FULL BROADCAST NOTICE DETAILS POPUP MODAL */}
      {selectedModalNotice &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            <div
              className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 select-none overflow-y-auto pt-safe pb-safe"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 30 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                className="bg-white dark:bg-stone-900 rounded-t-[32px] sm:rounded-3xl max-w-lg w-full border-t sm:border border-slate-200 dark:border-stone-800 shadow-[0_25px_70px_rgba(0,0,0,0.85)] my-0 sm:my-auto text-slate-900 dark:text-white max-h-[92vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
              >
                {/* 📱 Android APK Native Drag Handle */}
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0 sm:hidden" />

                {/* Top Accent Strip */}
                <div className="h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 shrink-0" />

                {/* Modal Top Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-stone-800 flex items-start justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-stone-800 border border-amber-300/60 dark:border-stone-700 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                      {selectedModalNotice.customIcon || '📢'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[9px] uppercase tracking-wider inline-block">
                          {selectedModalNotice.category || 'සජීවී නිවේදනය'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 font-bold text-[9px] border border-slate-200 dark:border-stone-700">
                          {selectedModalNotice.severity === 'high' || selectedModalNotice.severity === 'urgent'
                            ? '🚨 හදිසි නිවේදනයක්'
                            : '📢 නිල දැනුම්දීම'}
                        </span>
                      </div>
                      <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white mt-1 leading-tight truncate">
                        {selectedModalNotice.titleSinhala || selectedModalNotice.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-stone-800 transition shrink-0 cursor-pointer active:scale-95"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Metadata Pill Grid */}
                <div className="px-4 sm:px-5 pt-3 grid grid-cols-2 gap-2 text-xs shrink-0">
                  <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-stone-800/80 border border-slate-200/80 dark:border-stone-700 rounded-2xl">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">
                      ප්‍රකාශිත දිනය
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 animate-icon-bounce" />
                      <span>
                        {selectedModalNotice.createdAt
                          ? formatSriLankaDate(selectedModalNotice.createdAt, 'si')
                          : 'අද දින'}
                      </span>
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-stone-800/80 border border-slate-200/80 dark:border-stone-700 rounded-2xl">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">
                      ප්‍රකාශකයා
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5 text-xs truncate">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 animate-icon-pulse-glow" />
                      <span className="truncate">
                        {selectedModalNotice.createdBy || 'පිරිවෙන් පාලක සභාව'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Notice Message Content */}
                <div className="px-4 sm:px-5 py-3 space-y-3 overflow-y-auto flex-1">
                  <div className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed font-sans bg-slate-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-stone-700 whitespace-pre-wrap font-medium">
                    {selectedModalNotice.messageSinhala || selectedModalNotice.message}
                  </div>

                  {selectedModalNotice.message &&
                    selectedModalNotice.messageSinhala &&
                    selectedModalNotice.message !== selectedModalNotice.messageSinhala && (
                      <div className="pt-1">
                        <span className="text-slate-400 uppercase text-[9px] font-bold block mb-1">
                          English Translation:
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 text-xs italic bg-slate-100 dark:bg-stone-800/90 p-3 rounded-xl border border-slate-200 dark:border-stone-700">
                          {selectedModalNotice.message}
                        </p>
                      </div>
                    )}
                </div>

                {/* Action Button Footer */}
                <div className="p-3.5 sm:p-4 pb-safe bg-slate-50 dark:bg-stone-900/95 border-t border-slate-100 dark:border-stone-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-5 py-3 min-h-[44px] touch-manipulation bg-slate-200 hover:bg-slate-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer active:scale-95 flex items-center justify-center"
                  >
                    වසන්න (Close)
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 px-4 min-h-[44px] touch-manipulation bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 group"
                  >
                    <CheckCircle2 className="w-4 h-4 text-stone-950 group-hover:scale-110 transition-transform shrink-0" />
                    <span>කියවා තේරුම් ගතිමි (Acknowledge)</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
