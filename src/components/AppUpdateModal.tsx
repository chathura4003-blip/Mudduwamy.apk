import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  X,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Zap,
  Flame,
  Rocket,
  Check,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptics';
import { settingsApi } from '../api';
import {
  CURRENT_APP_VERSION,
  useAppVersion,
  compareSemanticVersions,
} from '../utils/appVersion';
import { liveUpdateService, LiveUpdateProgress } from '../services/liveUpdateService';

interface AppUpdateModalProps {
  isOpenManually?: boolean;
  onCloseManual?: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpenManually = false,
  onCloseManual,
}) => {
  const { language } = useLanguage();
  const isSi = language === 'si';
  const currentAppVersion = useAppVersion();

  const [isOpen, setIsOpen] = useState(isOpenManually);
  const [updateInfo, setUpdateInfo] = useState<{
    latestVersion: string;
    liveUpdateZipUrl: string;
    releaseNotes: string;
    forceUpdate: boolean;
  } | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [otaProgress, setOtaProgress] = useState<LiveUpdateProgress>(() => liveUpdateService.getProgress());

  // Subscribe to live update service progress & auto-restart on ready
  useEffect(() => {
    const unsubscribe = liveUpdateService.subscribe((progress) => {
      setOtaProgress(progress);
      if (progress.status === 'ready') {
        setIsDownloading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Smooth Auto-Restart when bundle is ready
  useEffect(() => {
    if (otaProgress.status === 'ready') {
      triggerHaptic('success');
      const timer = setTimeout(() => {
        liveUpdateService.restartApp();
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [otaProgress.status]);

  const checkForAppUpdate = useCallback(async (isManualTrigger = false) => {
    try {
      const data = await settingsApi.getSiteSettings();
      if (!data) return;

      const serverVersion = String((data as any).liveUpdateVersion || (data as any).appLatestVersion || '3.8.5').trim();
      const otaZipUrl = String((data as any).liveUpdateZipUrl || (data as any).appOtaZipUrl || '').trim();
      const releaseNotes =
        (data as any).appReleaseNotes ||
        'නව විශේෂාංග, දෝෂ නිවැරදි කිරීම් හා වැඩිදියුණු කළ වේගය.';
      const forceUpdate =
        (data as any).appForceUpdate === true || (data as any).appForceUpdate === 'true';

      const hasNewerVersion = compareSemanticVersions(serverVersion, currentAppVersion) > 0;

      if (hasNewerVersion || isManualTrigger) {
        setUpdateInfo({
          latestVersion: serverVersion,
          liveUpdateZipUrl: otaZipUrl,
          releaseNotes,
          forceUpdate,
        });

        // Check if user dismissed this specific version in this session
        const sessionDismissed = sessionStorage.getItem(`pirivena_dismissed_update_${serverVersion}`);
        if (!sessionDismissed || forceUpdate || isManualTrigger) {
          setIsOpen(true);
        }
      }
    } catch (err) {
      console.warn('Failed to check for live app update:', err);
    }
  }, [currentAppVersion]);

  // Initial check & listen for deep link
  useEffect(() => {
    checkForAppUpdate();

    const handleDeepLink = (e: any) => {
      if (e?.detail) {
        const detail = e.detail;
        if (detail.version || detail.liveUpdateZipUrl) {
          setUpdateInfo({
            latestVersion: detail.version || '3.8.5',
            liveUpdateZipUrl: detail.liveUpdateZipUrl || '',
            releaseNotes:
              detail.releaseNotes ||
              'නව විශේෂාංග, දෝෂ නිවැරදි කිරීම් හා වැඩිදියුණු කළ වේගය.',
            forceUpdate: detail.forceUpdate === true || detail.forceUpdate === 'true',
          });
          setIsOpen(true);
          return;
        }
      }
      checkForAppUpdate(true);
    };

    window.addEventListener('open-app-update', handleDeepLink);
    return () => window.removeEventListener('open-app-update', handleDeepLink);
  }, [checkForAppUpdate]);

  // Sync manual prop
  useEffect(() => {
    if (isOpenManually) {
      checkForAppUpdate(true);
      setIsOpen(true);
    }
  }, [isOpenManually, checkForAppUpdate]);

  const handleDismiss = () => {
    triggerHaptic('light');
    if (updateInfo?.latestVersion && !updateInfo.forceUpdate) {
      sessionStorage.setItem(`pirivena_dismissed_update_${updateInfo.latestVersion}`, 'true');
    }
    setIsOpen(false);
    if (onCloseManual) onCloseManual();
  };

  const handleStartLiveUpdate = async () => {
    triggerHaptic('heavy');
    setIsDownloading(true);

    try {
      await liveUpdateService.checkForLiveUpdate({ force: true, autoApply: false });
    } catch (e) {
      console.warn('Live OTA download error:', e);
      setIsDownloading(false);
    }
  };

  const handleApplyRestart = async () => {
    triggerHaptic('heavy');
    await liveUpdateService.restartApp();
  };

  const isReadyToRestart = otaProgress.status === 'ready';
  const isInDownloadProgress = isDownloading || otaProgress.status === 'downloading';

  return (
    <AnimatePresence>
      {isOpen && updateInfo && (
        <div
          className="fixed inset-0 z-[99999999] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 select-none pt-safe pb-safe"
          onClick={() => {
            if (!updateInfo.forceUpdate && !isInDownloadProgress && !isReadyToRestart) {
              handleDismiss();
            }
          }}
        >
          {/* Background Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-transparent rounded-full blur-3xl animate-pulse" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border-t sm:border border-amber-400/40 dark:border-amber-500/30 rounded-t-[36px] sm:rounded-[32px] max-w-md w-full shadow-[0_30px_90px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col my-0 sm:my-auto text-slate-900 dark:text-white ring-1 ring-white/20 dark:ring-stone-800"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Top Multi-Color Gradient Bar */}
            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 via-orange-500 to-amber-600 shrink-0" />

            {/* Header Area with Glowing Icon */}
            <div className="relative p-5 pb-4 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent border-b border-amber-200/40 dark:border-amber-900/40 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  {/* Glowing 3D-styled Badge Icon */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300 animate-pulse" />
                    <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-orange-500 text-stone-950 flex items-center justify-center text-2xl font-black shadow-lg shadow-amber-500/30 ring-2 ring-white dark:ring-stone-800 shrink-0">
                      <Rocket className="w-6 h-6 text-stone-950 transform -rotate-45 group-hover:scale-110 transition duration-300" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>{isSi ? 'ක්ෂණික Live Update' : 'Live OTA Update'}</span>
                      </span>

                      {updateInfo.forceUpdate ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5 shadow-xs animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>{isSi ? 'අනිවාර්යයි' : 'Mandatory'}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[9px] flex items-center gap-1 border border-emerald-500/30">
                          <Check className="w-2.5 h-2.5" />
                          <span>{isSi ? 'සූදානම්' : 'Ready'}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-black text-lg sm:text-xl text-slate-900 dark:text-white mt-1 leading-tight flex items-center gap-1.5">
                      <span>{isSi ? 'නවතම යාවත්කාලීනය' : 'New Update Available'}</span>
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
                    </h3>
                  </div>
                </div>

                {!updateInfo.forceUpdate && !isInDownloadProgress && !isReadyToRestart && (
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-2xl bg-slate-100/80 hover:bg-slate-200 dark:bg-stone-800/80 dark:hover:bg-stone-750 transition cursor-pointer shrink-0 active:scale-90"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh] scrollbar-thin">
              {/* Version Comparison Card */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-100/80 dark:bg-stone-800/80 border border-slate-200 dark:border-stone-700 rounded-2xl">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                    {isSi ? 'දැනට ස්ථාපිත අනුවාදය:' : 'Installed Version:'}
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                    v{currentAppVersion}
                  </span>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold block">
                    {isSi ? 'නවතම අනුවාදය:' : 'New Version:'}
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                    v{updateInfo.latestVersion}
                  </span>
                </div>
              </div>

              {/* Downloading Progress Indicator */}
              {isInDownloadProgress && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                      <span>{isSi ? 'යාවත්කාලීනය බාගත වෙමින් පවතී...' : 'Downloading Live Update bundle...'}</span>
                    </span>
                    <span className="font-mono px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[11px]">
                      {otaProgress.percent > 0 ? `${otaProgress.percent}%` : '0%'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-stone-700/80 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 h-full rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${Math.max(8, otaProgress.percent)}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-medium">
                    {isSi ? 'කරුණාකර මොහොතක් රැඳී සිටින්න. තත්පර කිහිපයකින් සූදානම් වේ.' : 'Please wait, applying instant bundle patch...'}
                  </p>
                </div>
              )}

              {/* Ready to Restart Success Banner */}
              {isReadyToRestart && (
                <div className="p-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/10 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200 text-xs font-bold shadow-md animate-fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center shrink-0 shadow-md">
                      <CheckCircle2 className="w-5 h-5 text-stone-950" />
                    </div>
                    <div className="min-w-0">
                      <span className="block font-black text-xs text-emerald-800 dark:text-emerald-300">
                        {isSi ? '✓ බාගත වීම සාර්ථකයි!' : '✓ Download Complete!'}
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block truncate">
                        {isSi
                          ? 'යෙදුම ක්ෂණිකව Restart වෙමින් පවතී...'
                          : 'Restarting app instantly...'}
                      </span>
                    </div>
                  </div>

                  <span className="w-8 h-8 rounded-full bg-emerald-500 text-stone-950 font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-lg ring-2 ring-emerald-400/50">
                    <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                  </span>
                </div>
              )}

              {/* Release Notes / What's New Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>{isSi ? 'මෙම යාවත්කාලීනයේ අලුත් දේවල්:' : "What's New in this update:"}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
                    v{updateInfo.latestVersion}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/80 dark:bg-stone-800/60 border border-slate-200/80 dark:border-stone-700/60 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium shadow-inner">
                  {updateInfo.releaseNotes}
                </div>
              </div>

              {/* Security & Speed Guarantee Notice */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-medium">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {isSi
                    ? 'Capgo Live OTA මඟින් කිසිදු APK Re-install එකක් නොමැතිව තත්පර 2කින් ආරක්ෂිතව Update වේ.'
                    : 'Instant Over-The-Air web update. No APK re-installation required.'}
                </span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-slate-50/90 dark:bg-stone-900/90 border-t border-slate-200/80 dark:border-stone-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 pb-safe">
              {!updateInfo.forceUpdate && !isInDownloadProgress && !isReadyToRestart && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full sm:w-auto px-5 py-3 min-h-[44px] rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-stone-800 dark:hover:bg-stone-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center touch-manipulation"
                >
                  {isSi ? 'පසුව' : 'Later'}
                </button>
              )}

              {isReadyToRestart ? (
                <button
                  type="button"
                  onClick={handleApplyRestart}
                  className="w-full sm:flex-1 py-3 px-5 min-h-[44px] rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/30 transition cursor-pointer active:scale-95 flex items-center justify-center gap-2 border border-emerald-400/30 touch-manipulation"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isSi ? 'දැන්ම Restart කරන්න' : 'Restart Now'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartLiveUpdate}
                  disabled={isInDownloadProgress}
                  className="w-full sm:flex-1 py-3 px-5 min-h-[44px] rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 transition cursor-pointer active:scale-95 flex items-center justify-center gap-2 group border border-amber-300/40 disabled:opacity-75 touch-manipulation"
                >
                  {isInDownloadProgress ? (
                    <>
                      <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      <span>{isSi ? 'බාගත වෙමින් පවතී...' : 'Downloading Live Update...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-stone-950 fill-stone-950 group-hover:scale-125 transition-transform" />
                      <span>{isSi ? 'ක්ෂණිකව Update කරන්න (Live OTA)' : 'Update Instantly (Live OTA)'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
