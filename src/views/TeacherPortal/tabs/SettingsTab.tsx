import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Award,
  Users,
  GraduationCap,
  School,
  BookOpen,
  Mail,
  Calendar,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Globe,
  Code2,
  Database,
  Smartphone,
  Cpu,
  Lock,
  FileCheck2,
  CheckCircle2,
  Info,
  Type,
  Bell,
} from 'lucide-react';
import type { User, PirivenaClass, Subject } from '../../../types';
import { handleAvatarError, getImageUrl } from '../../../utils/imageHelper';
import { triggerHaptic } from '../../../utils/haptics';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import { invalidateCache, triggerFullAppRefresh } from '../../../utils/dataCache';
import { useAccessibility, TEXT_SIZE_SCALES, TextSizeOption } from '../../../context/AccessibilityContext';
import { NotificationSettingsControl } from '../../../components/NotificationSettingsControl';
import { useAppVersion } from '../../../utils/appVersion';

interface SettingsTabProps {
  user: User | null;
  assignedClasses: PirivenaClass[];
  assignedSubjects: Subject[];
  onOpenTimetable?: () => void;
  onRefreshData?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  user,
  assignedClasses,
  assignedSubjects,
  onOpenTimetable,
  onRefreshData,
}) => {
  const { language, setLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const { appTextSize, setAppTextSize } = useAccessibility();
  const appVersion = useAppVersion();
  const toast = useToast();
  const isSi = language === 'si';

  const handleSyncData = () => {
    triggerHaptic('medium');
    triggerFullAppRefresh();
    if (onRefreshData) onRefreshData();
    toast.success(
      isSi
        ? '✓ ගුරු ද්වාරයේ දත්ත සාර්ථකව සමමුහුර්ත විය (Sync Completed)!'
        : '✓ Portal data synced successfully!'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto select-none"
    >
      {/* ========================================================= */}
      {/* 🌟 1. TEACHER PROFILE & CREDENTIALS CARD                   */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-[#2e0e04] via-[#3b1507] to-[#1f0902] text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-amber-500/30 relative overflow-hidden">
        <div className="absolute right-3 -bottom-4 opacity-15 pointer-events-none select-none">
          <span className="text-8xl sm:text-9xl text-amber-400 font-serif">
            {user?.monkStatus === 'monk' ? '🪷' : '☸'}
          </span>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Avatar Photo Frame */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-[#1a0601] p-1 shadow-2xl shrink-0 border-2 sm:border-3 border-amber-400/90 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full rounded-xl sm:rounded-2xl bg-[#200902] flex items-center justify-center overflow-hidden font-serif font-bold text-3xl sm:text-4xl text-amber-300">
              {user?.avatar ? (
                <img
                  src={getImageUrl(user.avatar)}
                  alt={user.name || 'Faculty Lecturer'}
                  onError={handleAvatarError}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.monkStatus === 'monk' ? '🪷' : '👨‍🏫'}</span>
              )}
            </div>
          </div>

          {/* Teacher Details */}
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
            <div className="flex justify-center sm:justify-start">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[10px] sm:text-xs shadow-inner max-w-full truncate ${
                  user?.monkStatus === 'monk'
                    ? 'bg-amber-950/80 border border-amber-500/60 text-amber-300'
                    : 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                }`}
              >
                <span>{user?.monkStatus === 'monk' ? '🪷' : '🎓'}</span>
                <span>
                  {user?.monkStatus === 'monk'
                    ? 'රාජකීය පණ්ඩිත පූජ්‍ය ආචාර්ය මණ්ඩලය'
                    : 'ලියාපදිංචි ගිහි ආචාර්ය මණ්ඩලය (Academic Faculty)'}
                </span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-serif font-black text-white tracking-tight break-words pt-0.5">
              {user?.monkStatus === 'monk' && user?.monkName
                ? user.monkName
                : user?.name || user?.monkName || 'ආචාර්යතුමා'}
            </h1>

            <p className="text-amber-100/90 text-xs sm:text-sm font-semibold leading-tight">
              {user?.qualification ||
                (user as any)?.qualifications ||
                (user?.monkStatus === 'monk'
                  ? 'රාජකීය පණ්ඩිත, බෞද්ධ හා පාලි විශ්වවිද්‍යාලය'
                  : 'ගෞරව ශාස්ත්‍රවේදී උපාධිය (BA Hons)')}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#1e0701]/90 border border-amber-600/40 text-amber-200 font-mono text-[11px]">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{user?.email || 'teacher@pirivena.edu.lk'}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#1e0701]/90 border border-amber-600/40 text-amber-200 font-mono text-[11px] font-bold">
                <span>
                  Staff ID:{' '}
                  {user?.customId && !user.customId.startsWith('usr-')
                    ? user.customId
                    : user?.indexNumber && !user.indexNumber.startsWith('usr-')
                      ? user.indexNumber
                      : 'TCH-2026-001'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🛡️ 2. ADMIN AUTHORIZED TEACHING SCOPE & LICENSES           */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-stone-800 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white">
                {isSi ? 'පරිපාලක අධ්‍යයන බලපත්‍රය (Admin Authorized Teaching Scope)' : 'Admin Authorized Teaching Scope'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSi ? 'පරිපාලක මණ්ඩලය විසින් ගුරු ගිණුමට පවරා ඇති අධ්‍යයන වගකීම් සහ බලතල' : 'Institutional scope assigned by administration'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-700 text-white rounded-xl text-[10px] font-mono font-black shrink-0 shadow-2xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>VERIFIED FACULTY SCOPE</span>
          </span>
        </div>

        {/* Assigned Classes Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <School className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-icon-float" />
            <span>{isSi ? 'පවරන ලද පන්ති කාමර (Assigned Classes)' : 'Assigned Classes'}</span>
          </h4>

          {assignedClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {assignedClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-stone-800/60 border border-amber-200/80 dark:border-stone-700 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-950 text-amber-950 dark:text-amber-300 text-[10px] font-mono font-bold border border-amber-300 dark:border-amber-800">
                      {cls.code || cls.id}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ සක්‍රීය පන්තිය
                    </span>
                  </div>
                  <h5 className="font-serif font-black text-sm text-slate-900 dark:text-white">
                    🏫 {cls.name}
                  </h5>
                  {(cls as any)?.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {(cls as any).description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-800/40 border border-slate-200 dark:border-stone-700 text-xs text-slate-500 italic text-center">
              {isSi ? 'පන්ති පවරා නොමැත. පරිපාලක මඟින් පන්ති පවරන තෙක් රැඳී සිටින්න.' : 'No classes assigned.'}
            </div>
          )}
        </div>

        {/* Assigned Subjects Grid */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-icon-float" />
            <span>{isSi ? 'පවරන ලද විෂයමාලා (Assigned Subjects)' : 'Assigned Subjects'}</span>
          </h4>

          {assignedSubjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assignedSubjects.map((sbj) => (
                <div
                  key={sbj.id}
                  className="px-3 py-2 rounded-2xl bg-blue-50/70 dark:bg-stone-800/60 border border-blue-200/80 dark:border-stone-700 flex items-center gap-2"
                >
                  <span className="text-blue-600 dark:text-blue-400 text-xs">📖</span>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white leading-none">
                      {sbj.name}
                    </p>
                    <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                      {sbj.code || sbj.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-800/40 border border-slate-200 dark:border-stone-700 text-xs text-slate-500 italic text-center">
              {isSi ? 'විෂයයන් පවරා නොමැත.' : 'No subjects assigned.'}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🔔 2.5 NOTIFICATIONS & SOUND/VIBRATION CONTROLS            */}
      {/* ========================================================= */}
      <NotificationSettingsControl userId={user?.id} />

      {/* ========================================================= */}
      {/* ⚙️ 3. SYSTEM PREFERENCES & CONTROLS                        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Accessibility & Text Size */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 shadow-xs space-y-3 md:col-span-2">
          <h4 className="font-serif font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Type className="w-4 h-4 text-amber-500 animate-icon-pulse-glow" />
            <span>{isSi ? 'අකුරු ප්‍රමාණය සහ ප්‍රවේශ්‍යතාව (Text Size & Accessibility)' : 'Text Size & Accessibility'}</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isSi ? 'ගුරු ද්වාරය සහ මුළු පද්ධතියේම අකුරු ප්‍රමාණය තෝරන්න' : 'Select preferred text scale across the application'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {(Object.keys(TEXT_SIZE_SCALES) as TextSizeOption[]).map((key) => {
              const opt = TEXT_SIZE_SCALES[key];
              const isSelected = appTextSize === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    triggerHaptic('light');
                    setAppTextSize(key);
                  }}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 text-slate-950 dark:text-white font-black shadow-xs ring-2 ring-amber-500/40'
                      : 'border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black">{opt.labelSi}</span>
                  <span className="text-[10px] opacity-75 font-mono">{Math.round(opt.scale * 100)}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme & Display Mode */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 shadow-xs space-y-3">
          <h4 className="font-serif font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            {isDarkMode ? <Moon className="w-4 h-4 text-amber-400 animate-icon-float" /> : <Sun className="w-4 h-4 text-amber-500 animate-icon-spin-slow" />}
            <span>{isSi ? 'පෙනුම සහ තේමාව (Display Theme)' : 'Display Theme'}</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isSi ? 'අඳුරු (Dark Mode) හෝ දීප්තිමත් (Light Mode) තේමාව තෝරන්න' : 'Switch between Dark and Light mode'}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                if (isDarkMode) toggleTheme();
              }}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 group ${
                !isDarkMode
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700'
              }`}
            >
              <Sun className="w-4 h-4 animate-icon-spin-slow" />
              <span>{isSi ? 'දීප්තිමත් (Light)' : 'Light'}</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                if (!isDarkMode) toggleTheme();
              }}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 group ${
                isDarkMode
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700'
              }`}
            >
              <Moon className="w-4 h-4 animate-icon-float" />
              <span>{isSi ? 'අඳුරු (Dark)' : 'Dark'}</span>
            </button>
          </div>
        </div>

        {/* Language & Real-time Sync */}
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 shadow-xs space-y-3">
          <h4 className="font-serif font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-icon-spin-slow" />
            <span>{isSi ? 'භාෂාව සහ සමමුහුර්තකරණය (Language & Sync)' : 'Language & Sync'}</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isSi ? 'භාෂාව මාරු කිරීම සහ දත්ත නැවත පූරණය කිරීම' : 'Language selection and data re-sync'}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                setLanguage('si');
              }}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                isSi
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700'
              }`}
            >
              <span>සිංහල (Sinhala)</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setLanguage('en');
              }}
              className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                !isSi
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700'
              }`}
            >
              <span>English</span>
            </button>
          </div>

          <button
            onClick={handleSyncData}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-800 dark:text-white rounded-2xl text-xs font-bold border border-slate-200 dark:border-stone-700 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 group"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
            <span>{isSi ? 'දත්ත නැවත සමමුහුර්ත කරන්න (Sync Cache)' : 'Sync Real-time Cache'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              window.dispatchEvent(new CustomEvent('open-onboarding-modal'));
            }}
            className="w-full py-2.5 bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-900 dark:text-amber-200 rounded-2xl text-xs font-bold border border-amber-300 dark:border-amber-700/60 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-icon-sparkle" />
            <span>{isSi ? 'පද්ධති හැඳින්වීම සහ අවසර (Tour & Permissions)' : 'System Tour & Permissions'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📱 4. SYSTEM & DEVELOPER SPECIFICATIONS (ABOUT APP)        */}
      {/* ========================================================= */}
      <div className="bg-slate-50 dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/80 dark:border-stone-800">
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs animate-icon-pulse-glow">
            ☸
          </div>
          <div>
            <h4 className="font-serif font-black text-sm text-slate-900 dark:text-white">
              {isSi ? 'ශ්‍රී සුමන මහා පිරිවෙන් ERP පද්ධති තොරතුරු' : 'Sri Sumana Pirivena ERP System Specs'}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Official Institutional Information & Engineering Credits
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {/* Tile 1: App Version & Check for Updates */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-800/70 border border-slate-200/80 dark:border-stone-700 space-y-2 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-blue-600 animate-icon-bounce" />
                <span>යෙදුම් අනුවාදය (App Version)</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                ● Live OTA
              </span>
            </div>
            <p className="font-mono font-black text-slate-900 dark:text-white text-sm">
              v{appVersion} PRO
            </p>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                window.dispatchEvent(new CustomEvent('open-app-update'));
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-black text-[11px] flex items-center justify-center gap-1 shadow-xs transition cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3 h-3" />
              <span>යාවත්කාලීන පරීක්ෂා කරන්න</span>
            </button>
          </div>

          {/* Tile 2: Lead Developer */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-800/70 border border-slate-200/80 dark:border-stone-700 space-y-1 group">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-amber-500 animate-icon-pulse-glow" />
              <span>පද්ධති නිර්මාණකරු (Lead Developer)</span>
            </span>
            <p className="font-serif font-black text-slate-900 dark:text-white text-sm">
              චතුර ධනංජය
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Full Stack System Architect
            </p>
          </div>

          {/* Tile 3: Database & Cloud */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-800/70 border border-slate-200/80 dark:border-stone-700 space-y-1 group">
            <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-purple-600 animate-icon-float" />
              <span>දත්ත ගබඩාව (Cloud Engine)</span>
            </span>
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              Cloud MySQL Realtime Engine
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              High-Availability Protected
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
