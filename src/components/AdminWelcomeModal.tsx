import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Award,
  Users,
  GraduationCap,
  Heart,
  FileText,
  Sparkles,
  ArrowRight,
  X,
  Database,
  Activity,
  Clock,
  School,
  ChevronRight,
  BookOpen,
  Newspaper,
  Calendar,
} from 'lucide-react';
import type { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptics';
import { navigationHistoryManager } from '../services/navigationHistoryManager';

interface AdminWelcomeModalProps {
  user: User | null;
  totalStudents?: number;
  totalTeachers?: number;
  totalClasses?: number;
  totalExams?: number;
  totalSubjects?: number;
  totalNews?: number;
  pendingAdmissionsCount?: number;
  pendingDonationsCount?: number;
  onGoToSiteEditor?: () => void;
  onGoToAdmissions?: () => void;
  onGoToDonations?: () => void;
  onGoToStudents?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminWelcomeModal: React.FC<AdminWelcomeModalProps> = ({
  user,
  totalStudents = 0,
  totalTeachers = 0,
  totalClasses = 0,
  totalExams = 0,
  totalSubjects = 0,
  totalNews = 0,
  pendingAdmissionsCount = 0,
  pendingDonationsCount = 0,
  isOpen: customIsOpen,
  onClose,
}) => {
  const { language } = useLanguage();
  const isSi = language === 'si';
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const showModal = customIsOpen !== undefined ? customIsOpen : internalIsOpen;

  useEffect(() => {
    if (!showModal) return;

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString(isSi ? 'si-LK' : 'en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) +
          ' • ' +
          now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, [isSi, showModal]);

  const handleClose = () => {
    triggerHaptic('light');
    try {
      sessionStorage.setItem('pirivena_admin_welcome_shown', 'true');
      localStorage.setItem('pirivena_admin_welcome_shown', 'true');
    } catch (e) {}
    setInternalIsOpen(false);
    if (onClose) onClose();
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      document.body.style.pointerEvents = '';
    }
  };

  const handleQuickNav = (subTab: string) => {
    triggerHaptic('medium');
    handleClose();
    window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: subTab }));
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      navigationHistoryManager.pushModal('admin_welcome_modal', handleClose, 40);
      return () => {
        document.body.style.overflow = '';
        document.body.style.overflowY = '';
        document.body.style.pointerEvents = '';
        navigationHistoryManager.removeModal('admin_welcome_modal');
      };
    } else {
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      document.body.style.pointerEvents = '';
      navigationHistoryManager.removeModal('admin_welcome_modal');
    }
  }, [showModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {showModal && user && (
        <div
          className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto select-none pt-safe pb-safe"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 25 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="w-full max-w-lg sm:max-w-xl bg-white dark:bg-stone-900 rounded-t-[32px] sm:rounded-3xl border-t sm:border border-slate-200/90 dark:border-stone-800 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden relative text-slate-900 dark:text-white max-h-[calc(100dvh-1.5rem)] flex flex-col my-0 sm:my-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Top Monastic Golden Strip */}
            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 shrink-0" />

            {/* ========================================================= */}
            {/* 🌟 1. HERO HEADER                                         */}
            {/* ========================================================= */}
            <div className="relative bg-white dark:bg-stone-900 text-slate-900 dark:text-white p-5 sm:p-6 border-b border-slate-100 dark:border-stone-800 shrink-0">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-2xl transition cursor-pointer active:scale-95 z-20"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5 relative z-10">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white p-0.5 shadow-md shrink-0 flex items-center justify-center">
                  <div className="w-full h-full rounded-xl flex items-center justify-center text-2xl font-bold">
                    ☸
                  </div>
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] uppercase tracking-wider border border-amber-200 dark:border-amber-800/60">
                    <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{isSi ? 'පිරිවෙන් විධායක පාලක සාරාංශය' : 'Executive ERP Summary'}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-serif font-black text-slate-900 dark:text-white truncate tracking-tight mt-0.5">
                    {isSi ? 'ශ්‍රී සුමන මහා පිරිවෙන' : 'Sri Sumana Maha Pirivena'}
                  </h2>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                    {user.monkName || user.name || 'චතුර ධනංජය'} • {isSi ? 'ප්‍රධාන පාලක පුවරුව' : 'Chief Administrator'}
                  </p>
                  {currentTime && (
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>{currentTime}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 📊 2. MODAL SCROLLABLE METRICS BODY                      */}
            {/* ========================================================= */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              {/* System Live Health Status Pill */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200/80 dark:border-stone-700 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Activity className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <div className="text-xs">
                    <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px]">
                      <span>{isSi ? 'පද්ධති තත්ත්වය: 100% සක්‍රීයයි (Live ERP)' : 'System Status: Active & Operational'}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                      {isSi ? 'Cloud MySQL Database & Real-time Sync සජීවීව ක්‍රියාත්මකයි' : 'Cloud Database Real-time Sync Active'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-stone-700 text-slate-700 dark:text-slate-200 text-[10px] font-mono font-bold border border-slate-200 dark:border-stone-600 shrink-0">
                  <Database className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>v2.4.0</span>
                </div>
              </div>

              {/* Interactive Module KPI Grid (Tap to navigate) */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{isSi ? 'සජීවී ආයතනික දත්ත සාරාංශය' : 'Real-time Monastic Metrics'}</span>
                  </h4>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    {isSi ? 'පිවිසීමට Click කරන්න' : 'Tap tile to open'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* 1. Students Tile */}
                  <button
                    onClick={() => handleQuickNav('students')}
                    className="p-3.5 bg-gradient-to-br from-blue-50/90 to-white dark:from-stone-800/90 dark:to-stone-800/40 hover:from-blue-100 dark:hover:from-stone-750 rounded-2xl border border-blue-200/80 dark:border-stone-700 flex flex-col justify-between transition cursor-pointer active:scale-95 text-left group shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-800 dark:text-slate-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span>{isSi ? 'සිසුන්' : 'Students'}</span>
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 transition" />
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                        {totalStudents}
                      </span>
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60">
                        {isSi ? 'ලියාපදිංචි' : 'Active'}
                      </span>
                    </div>
                  </button>

                  {/* 2. Teachers Tile */}
                  <button
                    onClick={() => handleQuickNav('teachers')}
                    className="p-3.5 bg-gradient-to-br from-emerald-50/90 to-white dark:from-stone-800/90 dark:to-stone-800/40 hover:from-emerald-100 dark:hover:from-stone-750 rounded-2xl border border-emerald-200/80 dark:border-stone-700 flex flex-col justify-between transition cursor-pointer active:scale-95 text-left group shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-800 dark:text-slate-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span>{isSi ? 'ගුරු මණ්ඩලය' : 'Teachers'}</span>
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition" />
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                        {totalTeachers}
                      </span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60">
                        {isSi ? 'ආචාර්ය' : 'Faculty'}
                      </span>
                    </div>
                  </button>

                  {/* 3. Classes Tile */}
                  <button
                    onClick={() => handleQuickNav('classes')}
                    className="p-3.5 bg-gradient-to-br from-indigo-50/90 to-white dark:from-stone-800/90 dark:to-stone-800/40 hover:from-indigo-100 dark:hover:from-stone-750 rounded-2xl border border-indigo-200/80 dark:border-stone-700 flex flex-col justify-between transition cursor-pointer active:scale-95 text-left group shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-800 dark:text-slate-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <School className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                        <span>{isSi ? 'පන්ති & ශ්‍රේණි' : 'Classes'}</span>
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition" />
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                        {totalClasses}
                      </span>
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60">
                        {isSi ? 'පන්ති කාමර' : 'Rooms'}
                      </span>
                    </div>
                  </button>

                  {/* 4. Exams Tile */}
                  <button
                    onClick={() => handleQuickNav('exam_reviews')}
                    className="p-3.5 bg-gradient-to-br from-purple-50/90 to-white dark:from-stone-800/90 dark:to-stone-800/40 hover:from-purple-100 dark:hover:from-stone-750 rounded-2xl border border-purple-200/80 dark:border-stone-700 flex flex-col justify-between transition cursor-pointer active:scale-95 text-left group shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-800 dark:text-slate-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                        <span>{isSi ? 'විභාග සහ ලකුණු' : 'Exams'}</span>
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-purple-600 transition" />
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                        {totalExams}
                      </span>
                      <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60">
                        {isSi ? 'ප්‍රශ්න පත්‍ර' : 'Papers'}
                      </span>
                    </div>
                  </button>

                  {/* 5. Admissions Tile */}
                  <button
                    onClick={() => handleQuickNav('admissions')}
                    className="p-3.5 bg-gradient-to-br from-sky-50/90 to-white dark:from-stone-800/90 dark:to-stone-800/40 hover:from-sky-100 dark:hover:from-stone-750 rounded-2xl border border-sky-200/80 dark:border-stone-700 flex flex-col justify-between transition cursor-pointer active:scale-95 text-left group relative shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-800 dark:text-slate-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                        <span>{isSi ? 'අයදුම්පත්' : 'Admissions'}</span>
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-sky-600 transition" />
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                        {pendingAdmissionsCount}
                      </span>
                      <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60">
                        {isSi ? 'පොරොත්තු' : 'Pending'}
                      </span>
                    </div>
                    {pendingAdmissionsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                    )}
                  </button>

                  {/* 6. Donations Tile */}
                  <button
                    onClick={() => handleQuickNav('donations_manager')}
                    className="p-3.5 bg-gradient-to-br from-rose-50/90 to-white dark:from-stone-800/90 dark:to-stone-800/40 hover:from-rose-100 dark:hover:from-stone-750 rounded-2xl border border-rose-200/80 dark:border-stone-700 flex flex-col justify-between transition cursor-pointer active:scale-95 text-left group shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-800 dark:text-slate-200 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-600 fill-rose-500/20 group-hover:scale-110 transition-transform" />
                        <span>{isSi ? 'පින්කම් අරමුදල' : 'Donations'}</span>
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-rose-600 transition" />
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                        {pendingDonationsCount}
                      </span>
                      <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60">
                        {isSi ? 'නව ආධාර' : 'New'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 🚀 3. ACTION BUTTON FOOTER                                */}
            {/* ========================================================= */}
            <div className="p-4 bg-slate-50 dark:bg-stone-900/95 border-t border-slate-200/80 dark:border-stone-800 shrink-0">
              <button
                onClick={handleClose}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 group"
              >
                <ShieldCheck className="w-4.5 h-4.5 stroke-[2.5] animate-icon-pulse-glow" />
                <span>{isSi ? 'පරිපාලන ප්‍රධාන පුවරුවට පිවිසෙන්න' : 'Continue to Admin Dashboard'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
