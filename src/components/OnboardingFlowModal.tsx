import React, { useState, useEffect } from 'react';
import { PirivenaLogo } from './PirivenaLogo';
import { useAccessibility, TEXT_SIZE_SCALES, TextSizeOption } from '../context/AccessibilityContext';
import { notificationService } from '../services/notificationService';
import { permissionManager } from '../services/permissionManager';
import { triggerHaptic } from '../utils/haptics';
import { navigationHistoryManager } from '../services/navigationHistoryManager';
import {
  Sparkles,
  Type,
  Bell,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FolderLock,
  GraduationCap,
  Calendar,
  FileText,
  BookOpen,
  School,
  Lock,
  Award,
  Check,
  Smartphone,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface OnboardingFlowModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingFlowModal: React.FC<OnboardingFlowModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const { appTextSize, setAppTextSize, notifTextSize, setNotifTextSize } = useAccessibility();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);

  useEffect(() => {
    if (isOpen) {
      permissionManager.checkAllPermissions().then((status) => {
        setNotificationPermissionGranted(status.notifications === 'granted');
        setCameraPermissionGranted(status.camera === 'granted');
      });

      navigationHistoryManager.pushModal(
        'onboarding_modal',
        () => {
          setStep((prev) => {
            if (prev === 3) return 2;
            if (prev === 2) return 1;
            onComplete();
            return 1;
          });
        },
        50
      );
    } else {
      navigationHistoryManager.removeModal('onboarding_modal');
    }
    return () => navigationHistoryManager.removeModal('onboarding_modal');
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    triggerHaptic('medium');
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      try {
        localStorage.setItem('pirivena_onboarding_completed', 'true');
      } catch (e) {}
      onComplete();
    }
  };

  const handlePrevStep = () => {
    triggerHaptic('light');
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleRequestNotifPermission = async () => {
    setIsRequestingPermission(true);
    triggerHaptic('light');
    try {
      const granted = await permissionManager.requestNotificationPermission();
      setNotificationPermissionGranted(granted);
      if (granted) {
        notificationService.scheduleNotification({
          title: 'ශ්‍රී සුමන මහා පිරිවෙන',
          body: 'දැනුම්දීම් සාර්ථකව සක්‍රීය විය! (Notifications Enabled)',
          sound: true,
        });
      }
    } catch (e) {
      console.warn('Permission error:', e);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleRequestCameraPermission = async () => {
    setIsRequestingCamera(true);
    triggerHaptic('light');
    try {
      const granted = await permissionManager.requestCameraPermission();
      setCameraPermissionGranted(granted);
    } catch (e) {
      console.warn('Camera permission error:', e);
    } finally {
      setIsRequestingCamera(false);
    }
  };

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-4 bg-stone-950/92 backdrop-blur-2xl animate-fade-in select-none pt-safe pb-safe overflow-hidden"
    >
      {/* 🌟 1. ATMOSPHERIC AMBIENT ANIMATED BACKGROUND ORBS */}
      <div className="absolute -top-20 -left-20 w-80 h-80 sm:w-[450px] sm:h-[450px] bg-amber-500/35 rounded-full blur-[80px] sm:blur-[110px] pointer-events-none animate-bg-float-1" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 sm:w-[450px] sm:h-[450px] bg-orange-600/30 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none animate-bg-float-2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-yellow-400/25 rounded-full blur-[80px] pointer-events-none animate-icon-pulse-glow" />

      {/* 🌟 2. FLOATING GOLDEN STARDUST PARTICLES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { top: '10%', left: '12%', size: 'w-2 h-2', delay: '0s', dur: '4.5s' },
          { top: '20%', left: '88%', size: 'w-2.5 h-2.5', delay: '1s', dur: '5.5s' },
          { top: '40%', left: '6%', size: 'w-2 h-2', delay: '1.8s', dur: '4s' },
          { top: '55%', left: '92%', size: 'w-2 h-2', delay: '0.8s', dur: '5.2s' },
          { top: '75%', left: '14%', size: 'w-2.5 h-2.5', delay: '2s', dur: '5s' },
          { top: '85%', left: '84%', size: 'w-3 h-3', delay: '0.5s', dur: '6s' },
        ].map((pt, i) => (
          <div
            key={i}
            style={{
              top: pt.top,
              left: pt.left,
              animationDelay: pt.delay,
              animationDuration: pt.dur,
            }}
            className={`absolute ${pt.size} rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.95)] animate-bg-stardust`}
          />
        ))}
      </div>

      {/* 🌟 3. MAIN ONBOARDING MODAL CARD */}
      <div className="w-full max-w-lg max-h-[calc(100dvh-2rem)] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border border-amber-500/40 dark:border-amber-600/40 rounded-3xl p-4 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col relative overflow-hidden animate-scale-up text-slate-900 dark:text-stone-100">
        {/* Top Golden Accent Strip */}
        <div className="h-1.5 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 shrink-0 -mt-4 sm:-mt-6 -mx-4 sm:-mx-6 mb-3 shadow-xs" />

        {/* Top Step Progress Bar Header */}
        <div className="flex items-center justify-between gap-3 pb-3 shrink-0 relative z-10 border-b border-slate-100 dark:border-stone-800">
          <div className="flex items-center gap-2 flex-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all duration-300 relative overflow-hidden ${
                  s === step
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-md shadow-amber-500/50 ring-1 ring-amber-400/50'
                    : s < step
                    ? 'bg-emerald-500 shadow-2xs'
                    : 'bg-slate-200 dark:bg-stone-800'
                }`}
              >
                {s === step && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-bg-shimmer" />
                )}
              </div>
            ))}
          </div>
          <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 shrink-0 font-mono tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            පියවර {step} / 3
          </span>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto py-3.5 px-0.5 space-y-4 scrollbar-thin relative z-10">
          {/* ========================================================
              STEP 1: WELCOME SCREEN (සාදරයෙන් පිළිගනිමු)
              ======================================================== */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              {/* Monastic Logo Hero & Heading */}
              <div className="flex flex-col items-center text-center space-y-3 pt-1">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-amber-500/25 blur-md animate-icon-pulse-glow" />
                  <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 text-white flex items-center justify-center shadow-xl shadow-amber-600/30 ring-4 ring-amber-500/25 p-2.5 backdrop-blur-md">
                    <img
                      src="/pirivena-logo.svg"
                      alt="ශ්‍රී සුමන මහා පිරිවෙන"
                      className="w-full h-full object-contain pointer-events-none filter drop-shadow-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-stone-900 animate-icon-sparkle">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5 px-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-[10.5px] uppercase tracking-wider border border-amber-500/25 shadow-2xs">
                    <span>☸ ශ්‍රී සුමන මහා පිරිවෙන් අධ්‍යාපන පද්ධතිය</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
                    සාදරයෙන් පිළිගනිමු
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 font-serif">
                    ශ්‍රී සුමන මහා පිරිවෙන (මුද්දුව, රත්නපුර)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed pt-0.5">
                    විද්‍යායතනයේ සිසුන්, ගුරු මණ්ඩලය සහ පරිපාලනය සඳහා වන නිල ස්මාර්ට් ජංගම ඉගෙනුම් ද්වාරය (Smart Monastic ERP/LMS)
                  </p>
                </div>
              </div>

              {/* Core Features Monastic Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Timetable */}
                <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-stone-800/70 border border-amber-200/80 dark:border-stone-750 flex items-center gap-2.5 shadow-2xs transition hover:border-amber-300 group">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <Calendar className="w-4 h-4 animate-icon-bounce" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">දෛනික කාලසටහන</h4>
                    <p className="text-[10px] text-slate-500 dark:text-stone-400 truncate">කාලච්ඡේද මතක් කිරීම්</p>
                  </div>
                </div>

                {/* 2. Exams & Marks */}
                <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-stone-800/70 border border-emerald-200/80 dark:border-stone-750 flex items-center gap-2.5 shadow-2xs transition hover:border-emerald-300 group">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <FileText className="w-4 h-4 animate-icon-sparkle" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">විභාග සහ ලකුණු</h4>
                    <p className="text-[10px] text-slate-500 dark:text-stone-400 truncate">Online Exam පත්‍ර</p>
                  </div>
                </div>

                {/* 3. Study Notes & Library */}
                <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-stone-800/70 border border-blue-200/80 dark:border-stone-750 flex items-center gap-2.5 shadow-2xs transition hover:border-blue-300 group">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <BookOpen className="w-4 h-4 animate-icon-float" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">ඩිජිටල් පුස්තකාලය</h4>
                    <p className="text-[10px] text-slate-500 dark:text-stone-400 truncate">ත්‍රිපිටක සහ නිබන්ධන</p>
                  </div>
                </div>

                {/* 4. Monastic Credentials */}
                <div className="p-3 rounded-2xl bg-purple-50/80 dark:bg-stone-800/70 border border-purple-200/80 dark:border-stone-750 flex items-center gap-2.5 shadow-2xs transition hover:border-purple-300 group">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <GraduationCap className="w-4 h-4 animate-icon-bounce" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">ඩිජිටල් හැඳුනුම්පත</h4>
                    <p className="text-[10px] text-slate-500 dark:text-stone-400 truncate">QR සහ ප්‍රගති වාර්තා</p>
                  </div>
                </div>
              </div>

              {/* Institution Seal Ribbon */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-stone-800/50 border border-slate-200 dark:border-stone-800 text-[11px] text-slate-600 dark:text-stone-300 shadow-2xs">
                <School className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 animate-icon-pulse-glow" />
                <span className="truncate">ශ්‍රී ලංකා ප්‍රාචීන භික්ෂු විශ්වවිද්‍යාල අනුබද්ධ අධ්‍යාපන පීඨය</span>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 2: SYSTEM PERMISSIONS (පද්ධති අවසර) - FULL ANDROID APK POLISH
              ======================================================== */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center space-y-1">
                <div className="relative inline-block">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto shadow-inner border border-amber-500/25">
                    <ShieldCheck className="w-6 h-6 animate-icon-pulse-glow" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full text-[9px] shadow-sm">
                    <Zap className="w-3 h-3 fill-white" />
                  </span>
                </div>
                <h3 className="text-base font-serif font-black text-slate-900 dark:text-white pt-1">
                  Android පද්ධති අවසර සක්‍රීය කිරීම
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-stone-400">
                  යෙදුමේ සියලුම පහසුකම් නිසි පරිදි ක්‍රියාත්මක වීම සඳහා පහත අවසර ලබා දෙන්න
                </p>
              </div>

              <div className="space-y-2.5">
                {/* 1. Notifications Card */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800/80 border border-slate-200/90 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs transition hover:border-amber-400">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/25 shadow-2xs">
                      <Bell className="w-5 h-5 animate-icon-bell" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          දැනුම්දීම් (Push Notifications)
                        </h4>
                        {notificationPermissionGranted && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Granted</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-stone-400 leading-tight">
                        කාලසටහන්, විභාග හා හදිසි නිවේදන සජීවීව ලබා ගැනීමට
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestNotifPermission}
                    disabled={notificationPermissionGranted || isRequestingPermission}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5 ${
                      notificationPermissionGranted
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-default'
                        : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-amber-600/20'
                    }`}
                  >
                    {notificationPermissionGranted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>අවසර ලැබී ඇත</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>{isRequestingPermission ? 'ඉල්ලමින්...' : 'අවසර දෙන්න'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. Camera Card */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800/80 border border-slate-200/90 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs transition hover:border-blue-400">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/25 shadow-2xs">
                      <Camera className="w-5 h-5 animate-icon-pulse-glow" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">
                          කැමරාව (Camera & QR Scanner)
                        </h4>
                        {cameraPermissionGranted && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Granted</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-stone-400 leading-tight">
                        ශිෂ්‍ය පැමිණීම හා QR කාඩ්පත් අධිවේගීව ස්කෑන් කිරීමට
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestCameraPermission}
                    disabled={cameraPermissionGranted || isRequestingCamera}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl font-black text-xs transition active:scale-95 cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5 ${
                      cameraPermissionGranted
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-default'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-600/20'
                    }`}
                  >
                    {cameraPermissionGranted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>අවසර ලැබී ඇත</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isRequestingCamera ? 'ඉල්ලමින්...' : 'අවසර දෙන්න'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 3. Storage Card */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800/80 border border-slate-200/90 dark:border-stone-700/80 flex items-center gap-2.5 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/25 shadow-2xs">
                    <FolderLock className="w-5 h-5 animate-icon-float" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        ගොනු සහ වාර්තා (Internal Storage)
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                        Auto Active ✓
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-stone-400 leading-tight truncate">
                      වාර්තා කාඩ්පත්, සහතික හා පැවරුම් PDF බාගත කිරීමට
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy Guarantee Note */}
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-icon-pulse-glow" />
                <span className="truncate">ඔබගේ පෞද්ගලිකත්වය සහ දත්ත ආරක්ෂාව 100% තහවුරු කර ඇත.</span>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 3: ACCESSIBILITY & TEXT SIZING
              ======================================================== */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto shadow-inner border border-amber-500/25">
                  <Type className="w-6 h-6 animate-icon-bounce" />
                </div>
                <h3 className="text-base font-serif font-black text-slate-900 dark:text-white pt-1">
                  අකුරු ප්‍රමාණය තෝරන්න
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-stone-400">
                  තිරය පහසුවෙන් කියවීම සඳහා ඔබට ගැළපෙන අකුරු ප්‍රමාණය තෝරන්න
                </p>
              </div>

              {/* Text Sizing Choices */}
              <div className="grid grid-cols-2 gap-2.5">
                {(['small', 'normal', 'large', 'extra_large'] as TextSizeOption[]).map((sizeKey) => {
                  const meta = TEXT_SIZE_SCALES[sizeKey];
                  const isSelected = appTextSize === sizeKey;
                  return (
                    <button
                      key={sizeKey}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setAppTextSize(sizeKey);
                        setNotifTextSize(sizeKey);
                      }}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 cursor-pointer active:scale-95 shadow-2xs ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-600 dark:border-amber-500 ring-2 ring-amber-500/30 text-amber-950 dark:text-amber-200 font-bold'
                          : 'bg-slate-50 dark:bg-stone-800/60 border-slate-200 dark:border-stone-700 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{meta.labelSi}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-icon-pulse-glow" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-stone-400 leading-tight">
                        {meta.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Live Text Preview Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/80 dark:border-stone-700 text-center space-y-1 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                  සජීවී පෙළ පෙරදසුන (Live Preview)
                </span>
                <p className="font-serif font-bold text-slate-900 dark:text-white">
                  නමෝ තස්ස භගවතෝ අරහතෝ සම්මා සම්බුද්ධස්ස
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  ශ්‍රී සුමන මහා පිරිවෙන් ඩිජිටල් ඉගෙනුම් ද්වාරය
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons (Fixed Footer) */}
        <div className="pt-3 border-t border-slate-100 dark:border-stone-800/80 shrink-0 flex items-center justify-between gap-2.5 relative z-10">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-stone-700 text-slate-700 dark:text-stone-300 text-xs font-black hover:bg-slate-50 dark:hover:bg-stone-800 transition active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs min-h-[44px] shrink-0 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>ආපසු</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNextStep}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white text-xs sm:text-sm font-black shadow-lg shadow-amber-600/30 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer min-h-[44px] group"
          >
            <span>{step === 3 ? 'ආරම්භ කරමු (Get Started)' : 'ඉදිරියට (Next)'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
