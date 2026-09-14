import React from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  RefreshCw,
  Sparkles,
  Globe,
  Sun,
  Moon,
  BellRing,
  Volume2,
  Vibrate,
  User as UserIcon,
  QrCode,
  Award,
  School,
  Lock,
  Type,
  Check,
  Smartphone,
} from 'lucide-react';
import type { User, PirivenaClass } from '../../../types';
import { triggerHaptic } from '../../../utils/haptics';
import { invalidateCache, triggerFullAppRefresh } from '../../../utils/dataCache';
import { useAccessibility, type TextSizeOption } from '../../../context/AccessibilityContext';
import { useToast } from '../../../context/ToastContext';
import { NotificationSettingsControl } from '../../../components/NotificationSettingsControl';
import { useAppVersion } from '../../../utils/appVersion';

interface SettingsTabProps {
  user: User | null;
  studentClass: PirivenaClass | undefined;
  language: string;
  setLanguage: (lang: 'si' | 'en') => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  periodAlertsEnabled: boolean;
  handleTogglePeriodNotifications: () => void;
  playNotificationSound: () => void;
  onOpenQrModal?: () => void;
  onOpenReportCardModal?: () => void;
  isSi: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  user,
  studentClass,
  language,
  setLanguage,
  isDarkMode,
  toggleTheme,
  periodAlertsEnabled,
  handleTogglePeriodNotifications,
  playNotificationSound,
  onOpenQrModal,
  onOpenReportCardModal,
  isSi,
}) => {
  const { appTextSize, setAppTextSize } = useAccessibility();
  const appVersion = useAppVersion();
  const toast = useToast();

  const textSizeOptions: { id: TextSizeOption; labelSi: string; labelEn: string; scale: string }[] = [
    { id: 'small', labelSi: 'කුඩා (90%)', labelEn: 'Small (90%)', scale: '0.90x' },
    { id: 'normal', labelSi: 'සාමාන්‍ය (100%)', labelEn: 'Normal (100%)', scale: '1.00x' },
    { id: 'large', labelSi: 'විශාල (115%)', labelEn: 'Large (115%)', scale: '1.15x' },
    { id: 'extra_large', labelSi: 'ඉතා විශාල (130%)', labelEn: 'Extra Large (130%)', scale: '1.30x' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-12 select-none animate-fade-in"
    >
      {/* Header Title Banner */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold shadow-xs">
            <Settings className="w-5 h-5 animate-icon-spin-slow" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white">
              {isSi ? 'සැකසුම් සහ යෙදුම් තොරතුරු' : 'Settings & Mobile App Info'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isSi
                ? 'ශිෂ්‍ය ජංගම යෙදුමේ (APK) විස්තර, මූලික සැකසුම් හා දත්ත සමමුහුර්තකරණය'
                : 'Mobile APK build info, student preferences, and data synchronization'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            triggerFullAppRefresh();
            toast.success(
              isSi
                ? '✓ ශිෂ්‍ය ද්වාරයේ සියලුම දත්ත සාර්ථකව සමමුහුර්ත විය (Sync Completed)!'
                : '✓ Portal data synced successfully!'
            );
          }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto group"
        >
          <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
          <span>{isSi ? 'දත්ත Refresh කරන්න' : 'Sync Portal Data'}</span>
        </button>
      </div>

      {/* ⚙️ 2. PREFERENCES & SETTINGS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 2A: Preferences (භාෂාව, තේමාව, නාද) */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-stone-800 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 animate-icon-sparkle" />
            </div>
            <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {isSi ? 'පද්ධති අභිරුචි සහ සැකසුම්' : 'General App Preferences'}
            </h3>
          </div>

          <div className="space-y-3.5">
            {/* Language Switch */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-750">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 animate-icon-spin-slow" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {isSi ? 'භාෂාව (System Language)' : 'Interface Language'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {language === 'si' ? 'සිංහල මාධ්‍යය' : 'English Interface'}
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-slate-200 dark:bg-stone-700 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setLanguage('si');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    language === 'si'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  සිංහල
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setLanguage('en');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    language === 'en'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Display Theme */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-750">
              <div className="flex items-center gap-2.5">
                {isDarkMode ? (
                  <Moon className="w-4.5 h-4.5 text-indigo-400 animate-icon-float" />
                ) : (
                  <Sun className="w-4.5 h-4.5 text-amber-500 animate-icon-spin-slow" />
                )}
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {isSi ? 'අතුරුමුහුණත් තේමාව (Theme)' : 'Display Theme'}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {isDarkMode
                      ? isSi
                        ? 'අඳුරු තේමාව (Dark Mode)'
                        : 'Dark Mode Active'
                      : isSi
                      ? 'දීප්තිමත් තේමාව (Light Mode)'
                      : 'Light Mode Active'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  toggleTheme();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-700 border border-slate-200 dark:border-stone-600 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-2xs hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 group"
              >
                {isDarkMode ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400 animate-icon-spin-slow" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-indigo-600 animate-icon-float" />
                )}
                <span>
                  {isDarkMode ? (isSi ? 'Light Theme' : 'Light Mode') : isSi ? 'Dark Theme' : 'Dark Mode'}
                </span>
              </button>
            </div>

          </div>
        </div>

        {/* 🔔 Notifications & Sound/Vibration Controls */}
        <NotificationSettingsControl userId={user?.id} />

        {/* Card 2B: Accessibility & App Text Scaling */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-stone-800 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Type className="w-4.5 h-4.5 animate-icon-pulse-glow" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {isSi ? 'ප්‍රවේශ්‍යතාව සහ අකුරු ප්‍රමාණය' : 'Accessibility & Text Sizing'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isSi
                  ? 'ජංගම තිරයේ අකුරු විශාලත්වය ඔබගේ පහසුව පරිදි සකසන්න'
                  : 'Adjust font scaling for enhanced reading comfort'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {textSizeOptions.map((opt) => {
              const isSelected = appTextSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setAppTextSize(opt.id);
                    toast.success(
                      isSi
                        ? `✓ අකුරු ප්‍රමාණය '${opt.labelSi}' ලෙස යාවත්කාලීන විය.`
                        : `✓ Text scale updated to '${opt.labelEn}'.`
                    );
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-1.5 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-600 dark:border-amber-500 ring-2 ring-amber-500/30 text-amber-950 dark:text-amber-200 font-bold'
                      : 'bg-slate-50 dark:bg-stone-800/60 border-slate-200 dark:border-stone-700 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{isSi ? opt.labelSi : opt.labelEn}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    Scale: {opt.scale}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-[11px] text-amber-900 dark:text-amber-300">
            💡 {isSi
              ? 'අකුරු ප්‍රමාණය වෙනස් කළ පසු මුළු යෙදුමෙහිම (Dashboard, Notes, Timetable) පෙළ ප්‍රමාණය ක්ෂණිකව පරිමාණය වේ.'
              : 'Changing text size instantly rescales all UI typography across all dashboards, notes, and timetables.'}
          </div>
        </div>
      </div>

      {/* Card 2C: Student Account Snapshot & ID Shortcuts */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-stone-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
            <UserIcon className="w-4.5 h-4.5" />
          </div>
          <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            {isSi ? 'ශිෂ්‍ය ගිණුම් විස්තර' : 'Student Profile Snapshot'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800 space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">
              {isSi ? 'ශිෂ්‍ය නාමය' : 'Student Name'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-serif truncate block">
              {user?.name || user?.monkName || '—'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800 space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">
              {isSi ? 'ලියාපදිංචි අංකය' : 'Index Number'}
            </span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400 block">
              {user?.customId || user?.indexNumber || 'STD-2026-001'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800 space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">
              {isSi ? 'පන්තිය' : 'Class'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white truncate block">
              {studentClass ? studentClass.name : isSi ? 'පන්තිය පවරා නැත' : 'Enrolled'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800 space-y-0.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">
              {isSi ? 'ශිෂ්‍ය තත්ත්වය' : 'Scholar Status'}
            </span>
            <span className="font-bold text-amber-800 dark:text-amber-300 block">
              {user?.monkStatus === 'monk'
                ? isSi
                  ? '🪷 සාමණේර හිමි'
                  : '🪷 Monastic'
                : isSi
                ? '👤 ගිහි ශිෂ්‍යයා'
                : '👤 Lay Student'}
            </span>
          </div>
        </div>

        {/* Digital Pass Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-stone-800">
          {onOpenQrModal && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onOpenQrModal();
              }}
              className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-stone-750 border border-amber-200 dark:border-stone-700 text-amber-950 dark:text-amber-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
            >
              <QrCode className="w-4 h-4 text-amber-700 dark:text-amber-400 animate-icon-pulse-glow" />
              <span>{isSi ? 'QR හැඳුනුම්පත (Digital ID)' : 'Digital QR ID'}</span>
            </button>
          )}

          {onOpenReportCardModal && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onOpenReportCardModal();
              }}
              className="p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-stone-800 dark:hover:bg-stone-750 border border-purple-200 dark:border-stone-700 text-purple-950 dark:text-purple-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
            >
              <Award className="w-4 h-4 text-purple-700 dark:text-purple-400 animate-icon-sparkle" />
              <span>{isSi ? 'ප්‍රගති වාර්තාව (Report Card)' : 'Report Card'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 🔒 2C. APP SECURITY & MONASTIC PIN LOCK */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-stone-800 pb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <Lock className="w-4.5 h-4.5 animate-icon-pulse-glow" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {isSi ? 'යෙදුමේ ආරක්ෂාව සහ PIN Lock' : 'App Security & PIN Lock'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isSi
                ? 'පෞද්ගලිකත්වය සඳහා යෙදුම 4-Digit PIN අංකයකින් Lock කිරීමේ පහසුකම'
                : 'Protect student session with a 4-digit security PIN'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              const current = localStorage.getItem('pirivena_app_lock_enabled') === 'true';
              if (!current) {
                const pin = window.prompt(isSi ? 'නව 4-Digit PIN අංකයක් ඇතුළත් කරන්න:' : 'Enter a 4-digit PIN:');
                if (pin && pin.length >= 4) {
                  localStorage.setItem('pirivena_app_lock_pin', pin);
                  localStorage.setItem('pirivena_app_lock_enabled', 'true');
                  toast.success(isSi ? '✓ PIN Lock සක්‍රීය විය!' : '✓ PIN Lock enabled!');
                }
              } else {
                localStorage.setItem('pirivena_app_lock_enabled', 'false');
                toast.info(isSi ? 'PIN Lock අක්‍රීය කරන ලදී.' : 'PIN Lock disabled.');
              }
            }}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-stone-800/60 dark:hover:bg-stone-800 border border-slate-200 dark:border-stone-700 text-left transition flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Lock className="w-4 h-4 animate-icon-pulse-glow" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  {isSi ? 'PIN ආරක්ෂණය සැකසීම' : 'Setup PIN Lock'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {localStorage.getItem('pirivena_app_lock_enabled') === 'true'
                    ? (isSi ? 'සක්‍රීයයි (Active)' : 'Active')
                    : (isSi ? 'අක්‍රීයයි (Inactive)' : 'Inactive')}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {isSi ? 'වෙනස් කරන්න' : 'Toggle'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              triggerFullAppRefresh();
              toast.success(isSi ? '✓ මතකය සහ Cache දත්ත සාර්ථකව පිරිසිදු විය!' : '✓ Cache cleared successfully!');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-stone-800/60 dark:hover:bg-stone-800 border border-slate-200 dark:border-stone-700 text-left transition flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  {isSi ? 'මතකය හා Cache පිරිසිදු කිරීම' : 'Clear Offline Cache'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {isSi ? 'නැවුම් දත්ත බාගත කර ගැනීමට' : 'Refresh local stored data'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {isSi ? 'පිරිසිදු කරන්න' : 'Clear'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              window.dispatchEvent(new CustomEvent('open-onboarding-modal'));
            }}
            className="p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 dark:bg-stone-800/60 dark:hover:bg-stone-800 border border-amber-300/80 dark:border-amber-700/60 text-left transition flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-icon-sparkle" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  {isSi ? 'පද්ධති හැඳින්වීම සහ අවසර (Tour & Permissions)' : 'System Tour & Permissions'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {isSi ? 'යෙදුමේ විශේෂාංග සහ අවසර නැවත බලන්න' : 'Review features & app permissions'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {isSi ? 'නැරඹීමට' : 'Open'}
            </span>
          </button>
        </div>
      </div>

      {/* 🏛️ 3. INSTITUTION & DEVELOPER ATTRIBUTION */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="font-serif font-bold text-slate-900 dark:text-white">
              {isSi ? 'ශ්‍රී සුමන මහා පිරිවෙන (මුද්දුව, රත්නපුර)' : 'Sri Sumana Maha Pirivena (Mudduwa, Ratnapura)'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {isSi ? 'මෘදුකාංග පද්ධති සංවර්ධනය: චතුර ධනංජය' : 'System Engineer: Chathura Dananjaya'}
          </span>
        </div>

        {/* 📱 App Version & Status Card with Check for Updates */}
        <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-stone-800/40 border border-amber-200/70 dark:border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {isSi ? 'යෙදුම් අනුවාදය (App Version)' : 'App Version'}
              </span>
              <div className="flex items-center gap-2">
                <p className="font-mono font-black text-slate-900 dark:text-white text-xs">
                  v{appVersion} PRO
                </p>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  ● Live OTA
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              window.dispatchEvent(new CustomEvent('open-app-update'));
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isSi ? 'යාවත්කාලීන පරීක්ෂා කරන්න' : 'Check for Updates'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isSi ? '256-bit Encrypted Student Session (ආරක්ෂිතයි)' : '256-bit Encrypted Student Session'}
            </span>
          </div>
          <span>© {new Date().getFullYear()} Sri Sumana Maha Pirivena ERP. All rights reserved.</span>
        </div>
      </div>
    </motion.div>
  );
};
