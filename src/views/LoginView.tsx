import React, { useState, useEffect } from 'react';
import { PirivenaLogo } from '../components/PirivenaLogo';
import { useAuth } from '../context/AuthContext';
import { usePublicSite } from '../context/PublicSiteContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { handleImageError, getImageUrl } from '../utils/imageHelper';

import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Phone,
  GraduationCap,
  Settings,
  Smartphone,
  Maximize2,
  Minimize2,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Activity,
  Vibrate,
  VolumeX,
  Zap,
} from 'lucide-react';
import { triggerHaptic, isHapticFeedbackEnabled, setHapticFeedbackEnabled } from '../utils/haptics';
import { useAppVersion } from '../utils/appVersion';
import {
  liveUpdateService,
  isAutoLiveUpdateEnabled,
  setAutoLiveUpdateEnabled,
} from '../services/liveUpdateService';
import { navigationHistoryManager } from '../services/navigationHistoryManager';
import { motion, AnimatePresence } from 'motion/react';

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const { siteSettings } = usePublicSite();
  const { toggleTheme, isDarkMode } = useTheme();
  const { language, setLanguage } = useLanguage();
  const appVersion = useAppVersion();
  const isSi = language === 'si';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);
  const [cacheClearStatus, setCacheClearStatus] = useState<string | null>(null);

  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    return isHapticFeedbackEnabled();
  });

  const handleToggleHaptic = (enabled: boolean) => {
    setHapticFeedbackEnabled(enabled);
    setHapticEnabled(enabled);
    if (enabled) {
      triggerHaptic('heavy', true);
    }
  };

  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(() => {
    return isAutoLiveUpdateEnabled();
  });

  const handleToggleAutoUpdate = (enabled: boolean) => {
    triggerHaptic('medium');
    setAutoLiveUpdateEnabled(enabled);
    setAutoUpdateEnabled(enabled);
    if (enabled) {
      liveUpdateService.checkForLiveUpdate({ force: true });
    }
  };

  const [displayMode, setDisplayMode] = useState<'safe-area' | 'fullscreen'>(() => {
    try {
      return (localStorage.getItem('pirivena_display_mode') as 'safe-area' | 'fullscreen') || 'safe-area';
    } catch {
      return 'safe-area';
    }
  });

  const handleToggleDisplayMode = (mode: 'safe-area' | 'fullscreen') => {
    triggerHaptic('medium');
    setDisplayMode(mode);
    try {
      localStorage.setItem('pirivena_display_mode', mode);
      document.documentElement.setAttribute('data-display-mode', mode);
      if (mode === 'fullscreen') {
        document.documentElement.classList.add('fullscreen-mode');
        document.documentElement.classList.remove('safe-area-mode');
      } else {
        document.documentElement.classList.add('safe-area-mode');
        document.documentElement.classList.remove('fullscreen-mode');
      }
    } catch (_) {}
  };

  const handleClearCache = () => {
    triggerHaptic('medium');
    try {
      sessionStorage.clear();
      setCacheClearStatus(isSi ? 'තාවකාලික දත්ත (Cache) ඉවත් කරන ලදී!' : 'Cache cleared successfully!');
      setTimeout(() => setCacheClearStatus(null), 3000);
    } catch (_) {}
  };

  // Load remembered user ID on mount
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('pirivena_remembered_id');
      if (savedId) {
        setIdentifier(savedId);
      }
    } catch (_) {}
  }, []);

  // Connect Android back button with Login View modals
  useEffect(() => {
    if (showHelpModal) {
      navigationHistoryManager.pushModal('login_help_modal', () => setShowHelpModal(false), 50);
    } else {
      navigationHistoryManager.removeModal('login_help_modal');
    }
    return () => navigationHistoryManager.removeModal('login_help_modal');
  }, [showHelpModal]);

  useEffect(() => {
    if (showSettingsModal) {
      navigationHistoryManager.pushModal('login_settings_modal', () => setShowSettingsModal(false), 50);
    } else {
      navigationHistoryManager.removeModal('login_settings_modal');
    }
    return () => navigationHistoryManager.removeModal('login_settings_modal');
  }, [showSettingsModal]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showHelpModal) setShowHelpModal(false);
        if (showSettingsModal) setShowSettingsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelpModal, showSettingsModal]);

  const handleFormSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    triggerHaptic('medium');

    const cleanId = (identifier || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanId) {
      triggerHaptic('warning');
      setErrorMessage(
        isSi
          ? 'පරිශීලක අංකය (User ID) හෝ Email ඇතුළත් කරන්න.'
          : 'Please enter your User ID or Email.'
      );
      return;
    }

    if (!cleanPass) {
      triggerHaptic('warning');
      setErrorMessage(
        isSi ? 'මුරපදය (Password) ඇතුළත් කරන්න.' : 'Please enter your Password.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Auto-save remembered ID if checkbox checked
    if (rememberMe) {
      try {
        localStorage.setItem('pirivena_remembered_id', cleanId);
      } catch (_) {}
    } else {
      try {
        localStorage.removeItem('pirivena_remembered_id');
      } catch (_) {}
    }

    try {
      const success = await login(cleanId, cleanPass);
      if (success) {
        triggerHaptic('success');
        setLoginSuccessMessage(
          isSi ? 'සාර්ථකව පිවිසෙන ලදී!' : 'Login successful! Redirecting...'
        );
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 200);
      }
    } catch (err: any) {
      triggerHaptic('warning');
      setErrorMessage(
        err.message ||
          (isSi
            ? 'ඇතුළත්වීමට අපොහොසත් විය. ඇතුළත් කළ තොරතුරු පරීක්ෂා කරන්න.'
            : 'Login failed. Please check your credentials and try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const bgPhoto = siteSettings?.campusImageUrl || siteSettings?.heroImageUrl;

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between items-center py-3 sm:py-4 px-3 sm:px-6 pb-12 bg-stone-950 select-none overflow-x-clip overflow-y-auto overscroll-contain">
      {/* 🌟 Background Campus Image with Monastic Gradient & Ambient Atmospheric Animations */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-[#090807]">
        {bgPhoto ? (
          <img
            src={getImageUrl(bgPhoto)}
            alt="Sri Sumana Pirivena Campus"
            onError={handleImageError}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center scale-100 opacity-50 filter saturate-[1.1] brightness-[0.7] transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-stone-900/60 via-stone-950/80 to-stone-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/85 via-stone-950/65 to-stone-950/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(9,8,7,0.9)_100%)]" />

        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 sm:w-96 sm:h-96 bg-amber-500/18 rounded-full blur-[100px] animate-bg-float-1" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 sm:w-96 sm:h-96 bg-orange-600/15 rounded-full blur-[110px] animate-bg-float-2" />

        {/* Floating Golden Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { top: '15%', left: '18%', size: 'w-1.5 h-1.5', delay: '0s', dur: '5s' },
            { top: '28%', left: '82%', size: 'w-2 h-2', delay: '1s', dur: '6s' },
            { top: '68%', left: '12%', size: 'w-1.5 h-1.5', delay: '2s', dur: '5.5s' },
            { top: '82%', left: '78%', size: 'w-2.5 h-2.5', delay: '0.5s', dur: '7s' },
          ].map((pt, i) => (
            <div
              key={i}
              style={{
                top: pt.top,
                left: pt.left,
                animationDelay: pt.delay,
                animationDuration: pt.dur,
              }}
              className={`absolute ${pt.size} rounded-full bg-amber-300/50 shadow-[0_0_8px_rgba(251,191,36,0.7)] animate-bg-particle`}
            />
          ))}
        </div>
      </div>

      {/* 📱 TOP APP BAR: Clean Mobile Actions */}
      <header className="w-full max-w-md z-20 flex items-center justify-between gap-1 sm:gap-2 shrink-0 pt-safe">
        {/* Language Switcher Pill */}
        <div className="flex items-center p-0.5 rounded-full bg-stone-900/80 backdrop-blur-xl border border-amber-400/30 shadow-lg text-[10.5px] sm:text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setLanguage('si');
            }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all cursor-pointer active:scale-95 flex items-center gap-1 leading-normal ${
              language === 'si'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-xs'
                : 'text-stone-300 hover:text-amber-200'
            }`}
          >
            <span>☸</span>
            <span>සිංහල</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setLanguage('en');
            }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all cursor-pointer active:scale-95 flex items-center gap-1 leading-none ${
              language === 'en'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-xs'
                : 'text-stone-300 hover:text-amber-200'
            }`}
          >
            <span>EN</span>
          </button>
        </div>

        {/* Right Actions: Dark/Light, Settings, Tour & Help */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              toggleTheme();
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] rounded-full bg-stone-900/80 backdrop-blur-xl border border-amber-400/30 text-amber-300 hover:text-amber-100 flex items-center justify-center transition cursor-pointer active:scale-90 shadow-md"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-icon-spin-slow" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-icon-float" />}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowSettingsModal(true);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] rounded-full bg-stone-900/80 backdrop-blur-xl border border-amber-400/30 text-amber-300 hover:text-amber-100 flex items-center justify-center transition cursor-pointer active:scale-90 shadow-md"
            title={isSi ? 'පද්ධති සැකසුම් (Settings)' : 'Settings'}
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              window.dispatchEvent(new CustomEvent('open-onboarding-modal'));
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] rounded-full bg-stone-900/80 backdrop-blur-xl border border-amber-400/30 text-amber-300 hover:text-amber-100 flex items-center justify-center transition cursor-pointer active:scale-90 shadow-md"
            title={isSi ? 'පද්ධති හැඳින්වීම සහ අවසර (Tour & Permissions)' : 'Tour & Permissions'}
            aria-label="Tour and Permissions"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-icon-sparkle" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowHelpModal(true);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] min-h-[32px] rounded-full bg-stone-900/80 backdrop-blur-xl border border-amber-400/30 text-amber-300 hover:text-amber-100 flex items-center justify-center transition cursor-pointer active:scale-90 shadow-md"
            title={isSi ? 'උපකාර' : 'Help'}
            aria-label="Help"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* 🏛️ MAIN LOGIN CARD: Native Mobile Ergonomics */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md my-auto bg-stone-900/90 sm:bg-stone-900/85 backdrop-blur-2xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-amber-400/30 p-4 sm:p-7 z-10 text-stone-100 overflow-hidden"
      >
        {/* Top Radiant Gold Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 shadow-[0_0_16px_rgba(245,158,11,0.75)]" />

        {/* Header Monastic Welcome & Emblem */}
        <div className="text-center space-y-2 mb-4 pb-3 border-b border-amber-500/20 relative z-10">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="flex justify-center mb-1"
          >
            <div className="relative p-1.5 rounded-full bg-gradient-to-b from-amber-500/25 via-amber-500/10 to-transparent ring-1 ring-amber-400/40 shadow-lg shadow-amber-500/20">
              <PirivenaLogo size={68} variant="icon" animate />
            </div>
          </motion.div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/35 text-amber-300 font-serif font-black text-[11px] shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-400 animate-icon-sparkle" />
              <span>{isSi ? '☸ නමෝ බුද්ධාය!' : '☸ Namo Buddhaya!'}</span>
            </div>

            <h1 className="text-lg sm:text-xl font-serif font-black text-amber-100 tracking-wide">
              {isSi ? 'ශ්‍රී සුමන මහා පිරිවෙන' : 'Sri Sumana Maha Pirivena'}
            </h1>
            <p className="text-[11px] text-amber-300/80 font-medium flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-icon-pulse-glow" />
              <span>{isSi ? 'පිරිවෙන් අධ්‍යාපන පද්ධතිය (SIS/ERP)' : 'Monastic Education ERP System'}</span>
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              className="mb-3 p-3 rounded-2xl bg-rose-950/90 backdrop-blur-md border border-rose-500/60 text-rose-100 text-xs flex items-start justify-between gap-2 shadow-lg"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-300 hover:text-white p-1 rounded-lg transition cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Alert Box */}
        <AnimatePresence>
          {loginSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              className="mb-3 p-3 rounded-2xl bg-emerald-950/90 backdrop-blur-md border border-emerald-500/60 text-emerald-100 text-xs flex items-center gap-2 shadow-lg"
            >
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">{loginSuccessMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-3.5">
          {/* User ID or Email Input */}
          <div className="space-y-1">
            <label
              htmlFor="login-identifier-input"
              className="text-xs font-bold text-amber-200/90 flex items-center justify-between"
            >
              <span>{isSi ? 'පරිශීලක අංකය / Email' : 'User ID or Email'}</span>
              <span className="text-[10px] text-amber-400/70 font-mono">ID / Email</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="login-identifier-input"
                name="identifier"
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={
                  isSi ? 'උදා: STD-2026-001 හෝ user@gmail.com' : 'e.g. STD-2026-001 or user@gmail.com'
                }
                className="w-full h-12 pl-10 pr-9 bg-stone-950/80 focus:bg-stone-950 border border-amber-500/35 focus:border-amber-400 rounded-2xl text-sm font-medium text-amber-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition duration-200"
              />
              {identifier && (
                <button
                  type="button"
                  onClick={() => setIdentifier('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-amber-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label
              htmlFor="login-password-input"
              className="text-xs font-bold text-amber-200/90 flex items-center justify-between"
            >
              <span>{isSi ? 'මුරපදය (Password)' : 'Password'}</span>
              <span className="text-[10px] text-amber-400/70 font-mono">Password</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/70">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-11 bg-stone-950/80 focus:bg-stone-950 border border-amber-500/35 focus:border-amber-400 rounded-2xl text-sm font-medium text-amber-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition duration-200"
              />
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowPassword(!showPassword);
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-amber-200 cursor-pointer transition"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Help Row */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setRememberMe(!rememberMe);
              }}
              className="flex items-center gap-2 text-amber-200/80 hover:text-amber-200 cursor-pointer py-1 active:scale-95 transition"
            >
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center transition border ${
                  rememberMe
                    ? 'bg-amber-500 border-amber-400 text-stone-950'
                    : 'bg-stone-950 border-amber-500/40 text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-[11px] sm:text-xs font-medium">
                {isSi ? 'මාව මතක තබාගන්න' : 'Remember ID'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowHelpModal(true);
              }}
              className="text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer text-[11px] sm:text-xs py-1"
            >
              {isSi ? 'උදවු අවශ්‍යද?' : 'Need Help?'}
            </button>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full h-12 mt-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 active:scale-[0.98] border border-amber-300/60 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-[0_8px_25px_rgba(245,158,11,0.4)] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 group"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>{isSi ? 'තොරතුරු පරීක්ෂා වේ...' : 'Verifying credentials...'}</span>
              </>
            ) : (
              <>
                <span>{isSi ? 'පද්ධතියට පිවිසෙන්න' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4 text-stone-950 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* 📱 BOTTOM MONASTIC FOOTER */}
      <footer className="w-full max-w-md z-20 text-center shrink-0 pb-safe pt-2">
        <p className="text-[10px] sm:text-[11px] text-amber-300/60 font-serif font-medium flex items-center justify-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-amber-400/80 animate-icon-bounce" />
          <span>{isSi ? 'ශ්‍රී ලංකා ප්‍රාචීන අධ්‍යාපන පිරිවෙන් පද්ධතිය' : 'Oriental Studies Monastic Education System'}</span>
        </p>
      </footer>

      {/* 🔑 Native Bottom-Sheet Help & Password Assistance Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md pb-safe"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-stone-900 border-t sm:border border-amber-400/40 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 text-stone-100 shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bottom Sheet Drag Indicator */}
              <div className="w-12 h-1 bg-stone-700 rounded-full mx-auto mb-4 sm:hidden" />

              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="font-serif font-black text-sm sm:text-base text-amber-100">
                    {isSi ? 'ගිණුම් උපකාර සහ සහයෝගය' : 'Account Help & Support'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-stone-300 leading-relaxed py-1">
                <p className="font-medium text-amber-200/90">
                  {isSi
                    ? 'පිරිවෙන් ERP පද්ධතියට පිවිසීමේදී හෝ මුරපදය අමතක වූ විට:'
                    : 'If you have forgotten your password or need login assistance:'}
                </p>
                <div className="space-y-2 p-3 rounded-2xl bg-stone-950/80 border border-stone-800 text-[11.5px]">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{isSi ? 'සිසුන්: පන්තිභාර ආචාර්ය හිමියන් හමුවන්න.' : 'Students: Contact your Class Teacher.'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{isSi ? 'ගුරුභවතුන්: පිරිවෙන් ලේඛකාධිකාරී හිමියන් හමුවන්න.' : 'Teachers: Contact the Registrar.'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{isSi ? 'පරිපාලකවරුන්: ප්‍රධාන පරිපාලක (Super Admin) අමතන්න.' : 'Admins: Contact Super Admin.'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs rounded-2xl shadow-md transition cursor-pointer active:scale-95"
                >
                  {isSi ? 'හරි (Understood)' : 'Understood'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚙️ Native Bottom-Sheet App Settings & Preferences Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-md pb-safe"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-stone-900 border-t sm:border border-amber-400/40 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 text-stone-100 shadow-2xl relative overflow-hidden max-h-[90dvh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bottom Sheet Drag Indicator */}
              <div className="w-12 h-1 bg-stone-700 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4 shrink-0">
                <div className="flex items-center gap-2 text-amber-300">
                  <Settings className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="font-serif font-black text-sm sm:text-base text-amber-100">
                    {isSi ? 'පද්ධති සැකසුම් (System Settings)' : 'System Settings & Preferences'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 rounded-full bg-stone-800/80 text-stone-400 hover:text-white transition cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Settings Content */}
              <div className="space-y-4 overflow-y-auto pr-1 text-xs">
                {/* 1. DISPLAY MODE SETTING */}
                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-200 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      <span>{isSi ? 'තිර සංදර්ශක ප්‍රකාරය (Display Mode)' : 'Display Mode'}</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {displayMode === 'fullscreen' ? 'Fullscreen' : 'Safe Area'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleDisplayMode('safe-area')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition cursor-pointer active:scale-95 ${
                        displayMode === 'safe-area'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Minimize2 className="w-4 h-4" />
                      <span className="text-[11px] leading-tight">
                        {isSi ? 'සුපුරුදු (Safe Area)' : 'Safe Area (Default)'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleDisplayMode('fullscreen')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-center transition cursor-pointer active:scale-95 ${
                        displayMode === 'fullscreen'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span className="text-[11px] leading-tight">
                        {isSi ? 'සම්පූර්ණ තිරය (Notch Immersive)' : 'Fullscreen Immersive'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. THEME MODE SETTING */}
                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
                  <span className="font-bold text-amber-200 flex items-center gap-1.5">
                    {isDarkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                    <span>{isSi ? 'වර්ණ තේමාව (Theme)' : 'App Theme'}</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isDarkMode) toggleTheme();
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                        isDarkMode
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-amber-400" />
                      <span>{isSi ? 'අඳුරු තේමාව' : 'Dark Mode'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isDarkMode) toggleTheme();
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                        !isDarkMode
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>{isSi ? 'ආලෝකමත් තේමාව' : 'Light Mode'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. HAPTIC FEEDBACK (VIBRATION) ON/OFF SETTING */}
                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-200 flex items-center gap-1.5">
                      <Vibrate className="w-4 h-4 text-amber-400" />
                      <span>{isSi ? 'ස්පර්ශ ප්‍රතිචාර (Haptic Feedback)' : 'Haptic Vibration'}</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {hapticEnabled ? (isSi ? 'සක්‍රියයි (ON)' : 'Enabled') : (isSi ? 'අක්‍රියයි (OFF)' : 'Disabled')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleHaptic(true)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                        hapticEnabled
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Vibrate className="w-4 h-4 text-amber-400" />
                      <span>{isSi ? 'ක්‍රියාත්මක (ON)' : 'Turn ON'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleHaptic(false)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                        !hapticEnabled
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <VolumeX className="w-4 h-4 text-stone-400" />
                      <span>{isSi ? 'අක්‍රිය (OFF)' : 'Turn OFF'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400/80 pt-0.5">
                    {isSi
                      ? 'බොත්තම් එබීමේදී සහ පද්ධති දැනුම්දීම්වලදී ස්පර්ශක කම්පනය (Haptic Feedback)'
                      : 'Tactile vibration response on button taps and system alerts.'}
                  </p>
                </div>

                {/* 4. AUTO LIVE OTA UPDATE ON/OFF SETTING */}
                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-200 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>{isSi ? 'ස්වයංක්‍රීය යාවත්කාලීන (Auto OTA Update)' : 'Auto Live OTA Update'}</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {autoUpdateEnabled ? (isSi ? 'සක්‍රියයි (ON)' : 'Enabled') : (isSi ? 'අක්‍රියයි (OFF)' : 'Disabled')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleAutoUpdate(true)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                        autoUpdateEnabled
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>{isSi ? 'ක්‍රියාත්මක (ON)' : 'Turn ON'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAutoUpdate(false)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                        !autoUpdateEnabled
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <X className="w-4 h-4 text-stone-400" />
                      <span>{isSi ? 'අක්‍රිය (OFF)' : 'Turn OFF'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400/80 pt-0.5">
                    {isSi
                      ? 'නව යාවත්කාලීන නිකුත් වූ සැණින් පසුබිමෙන් ස්වයංක්‍රීයව බාගත වී යෙදුම නැවුම් වේ.'
                      : 'Automatically downloads and applies live updates silently when published.'}
                  </p>
                </div>

                {/* 4. LANGUAGE SWITCHER */}
                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2">
                  <span className="font-bold text-amber-200 flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">☸</span>
                    <span>{isSi ? 'භාෂාව (Language)' : 'Interface Language'}</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setLanguage('si');
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        isSi
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400'
                      }`}
                    >
                      <span>☸</span>
                      <span>සිංහල (Sinhala)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setLanguage('en');
                      }}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                        !isSi
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                          : 'bg-stone-900/60 border-stone-800 text-stone-400'
                      }`}
                    >
                      <span>English</span>
                    </button>
                  </div>
                </div>

                {/* 5. SYSTEM TOUR & PERMISSIONS */}
                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-amber-200">
                      {isSi ? 'පද්ධති හැඳින්වීම සහ අවසර' : 'Tour & Device Permissions'}
                    </p>
                    <p className="text-[10.5px] text-stone-400">
                      {isSi ? 'කැමරා, නිවේදන සහ පද්ධති මාර්ගෝපදේශය' : 'Camera, notifications & setup guide'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setShowSettingsModal(false);
                      window.dispatchEvent(new CustomEvent('open-onboarding-modal'));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold shrink-0 hover:bg-amber-500/30 transition cursor-pointer active:scale-95"
                  >
                    {isSi ? 'විවෘත කරන්න' : 'Open'}
                  </button>
                </div>

                {/* 5. CACHE CLEAR & RESET */}
                <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-amber-200">
                      {isSi ? 'තාවකාලික මතකය (Cache)' : 'Clear Temporary Cache'}
                    </p>
                    <p className="text-[10.5px] text-stone-400">
                      {cacheClearStatus || (isSi ? 'වේගවත් ක්‍රියාකාරිත්වය සඳහා' : 'Refresh local session')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 text-[11px] font-bold shrink-0 hover:text-white transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isSi ? 'Reset' : 'Reset'}</span>
                  </button>
                </div>

                {/* 6. APP VERSION FOOTER */}
                <div className="text-center pt-2 pb-1 text-[10.5px] text-amber-400/60 font-mono">
                  <span>ශ්‍රී සුමන මහා පිරිවෙන ERP • v{appVersion} Mobile Edition</span>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-4 pt-2 border-t border-stone-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs rounded-2xl shadow-md transition cursor-pointer active:scale-95"
                >
                  {isSi ? 'සැකසුම් සුරකින්න (Done)' : 'Done'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

