import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  UserCheck,
  GraduationCap,
  Heart,
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  Clock,
  Calendar,
  School,
  Settings,
  BookOpen,
  Award,
  Database,
  Bell,
  Activity,
  Bot,
  QrCode,
  FileCheck2,
  FileBadge,
  HardDrive,
  Newspaper,
  Image as ImageIcon,
  Globe,
} from 'lucide-react';
import { AdminTab } from '../types';
import { User, OnlineAdmission, Exam, ExamSubmission, DonationRecord as PirivenaDonation, SystemAuditLog } from '../../../types';
import { usePublicSite } from '../../../context/PublicSiteContext';
import { useLanguage } from '../../../context/LanguageContext';
import { AcademicYearTermSwitcherModal } from '../../../components/AcademicYearTermSwitcherModal';
import { DatabaseStatusModal } from '../../../components/DatabaseStatusModal';
import { CertificateVerificationModal } from '../../../components/CertificateVerificationModal';
import { SystemAuditModal } from '../../../components/SystemAuditModal';

import { getSriLankaGreeting } from '../../../utils/sriLankaTime';

interface OverviewTabProps {
  students: User[];
  teachers: User[];
  classes: any[];
  exams: Exam[];
  submissions: ExamSubmission[];
  admissions: OnlineAdmission[];
  donations: PirivenaDonation[];
  auditLogs: SystemAuditLog[];
  broadcastNotices: any[];
  onOpenWelcomeModal: () => void;
  onSwitchSubTab: (tab: AdminTab) => void;
  onOpenCreateNoticeModal: () => void;
  onOpenEditNoticeModal: (notice: any) => void;
  onToggleNotice: (id: string, active: boolean) => void;
  onDeleteNotice: (id: string) => void;
  onClearAuditLogs: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = React.memo(({
  students,
  teachers,
  classes,
  exams,
  submissions,
  admissions,
  donations,
  auditLogs,
  broadcastNotices,
  onOpenWelcomeModal,
  onSwitchSubTab,
  onOpenCreateNoticeModal,
  onOpenEditNoticeModal,
  onToggleNotice,
  onDeleteNotice,
  onClearAuditLogs,
}) => {
  const { siteSettings, newsArticles, events, galleryItems, libraryBooks } = usePublicSite();
  const { language } = useLanguage();
  const [isAcademicModalOpen, setIsAcademicModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const handleOpenSiteEditorTab = (subTab: 'news' | 'events' | 'gallery' | 'library' | 'general' | 'about') => {
    onSwitchSubTab(`site_${subTab}` as any);
  };

  // Compute time-of-day greeting locked to Sri Lanka Standard Time (Asia/Colombo)
  const greeting = useMemo(() => getSriLankaGreeting(language === 'si' ? 'si' : 'en'), [language]);

  const pendingAdmissionsCount = useMemo(() => admissions.filter((a) => a.status === 'pending').length, [admissions]);
  const pendingDonationsCount = useMemo(() => donations.filter((d) => d.status === 'pending').length, [donations]);
  const activeNoticesCount = useMemo(() => (
    Array.isArray(broadcastNotices) ? broadcastNotices.filter((n: any) => n.active).length : 0
  ), [broadcastNotices]);

  const handleOpenAiAssistant = () => {
    window.dispatchEvent(new CustomEvent('open-ai-assistant-modal'));
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* ========================================================= */}
      {/* 🌟 1. 2026 HERO BANNER (CLEAN WHITE & SLATE CONTRAST)     */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-white border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative overflow-hidden">
        {/* Subtle Ambient Backing */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-extrabold text-[11px] uppercase border border-slate-200 dark:border-stone-700 tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span>☸</span>
                <span>{greeting}, {language === 'si' ? 'ගරු පරිපාලකතුමනි' : 'Administrator'}</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {language === 'si' ? 'ERP පද්ධතිය සක්‍රීයයි' : 'ERP Live Online'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'si' ? 'ශ්‍රී සුමන පිරිවෙන් පාලක පුවරුව' : 'Sri Sumana Pirivena ERP Dashboard'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {language === 'si'
                ? `අධ්‍යයන වර්ෂය ${siteSettings.currentAcademicYear || '2026'} • සියලු දත්ත සජීවීව යාවත්කාලීන වේ`
                : `Academic Year ${siteSettings.currentAcademicYear || '2026'} • Live Real-time Monastic Management`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Academic Year Switcher Button */}
            <button
              onClick={() => setIsAcademicModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
              title="අධ්‍යයන වර්ෂය සහ වාරය මාරු කරන්න"
            >
              <Calendar className="w-4 h-4 animate-icon-bounce" />
              <span>
                {siteSettings.currentAcademicYear || '2026'} • {siteSettings.currentAcademicTermSinhala || '1 වන වාරය'}
              </span>
            </button>

            {/* Live Metrics Modal Button */}
            <button
              onClick={onOpenWelcomeModal}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-white dark:bg-stone-800 hover:bg-slate-50 dark:hover:bg-stone-700 text-slate-800 dark:text-white border border-slate-200 dark:border-stone-700 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 group"
            >
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-icon-sparkle" />
              <span>{language === 'si' ? 'සාරාංශය' : 'Summary'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals - conditionally mounted for maximum performance */}
      {isAcademicModalOpen && (
        <AcademicYearTermSwitcherModal
          isOpen={isAcademicModalOpen}
          onClose={() => setIsAcademicModalOpen(false)}
        />
      )}

      {isDbModalOpen && (
        <DatabaseStatusModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
        />
      )}

      {isCertModalOpen && (
        <CertificateVerificationModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
        />
      )}

      {isAuditModalOpen && (
        <SystemAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          auditLogs={auditLogs}
          onClearAuditLogs={onClearAuditLogs}
        />
      )}

      {/* ========================================================= */}
      {/* 🚀 2. VIBRANT 20-MODULE QUICK MANAGEMENT BENTO HUB        */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black shadow-xs">
              <span className="inline-block animate-icon-spin-slow">☸</span>
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {language === 'si' ? 'ප්‍රධාන පාලන මෙවලම් කට්ටලය (Quick Modules)' : 'Core Management Tools Hub'}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'si' ? 'පිරිවෙන් පද්ධතියේ සියලුම අංශ ක්ෂණිකව පාලනය කරන්න' : 'Direct access to all ERP modules'}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-amber-800 dark:text-amber-300 font-black px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 shadow-2xs">
            20 Modules
          </span>
        </div>

        {/* 20-MODULE GRID (Vibrant Themed Cards with Soft BG & Line Colored Icons) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Module 1: Students */}
          <button
            onClick={() => onSwitchSubTab('students')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white dark:from-blue-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-blue-100/90 hover:to-sky-50 dark:hover:from-blue-900/40 border border-blue-200/80 dark:border-blue-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 font-black text-base group-hover:scale-110 transition-transform shadow-2xs">
              <span className="inline-block animate-icon-spin-slow group-hover:scale-125 transition-transform">☸</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {language === 'si' ? 'ශිෂ්‍ය කළමනාකරණය' : 'Students Hub'}
              </div>
              <div className="text-[10px] text-blue-700/80 dark:text-blue-300/80 font-bold truncate">
                {students.length} {language === 'si' ? 'සාමණේර/ගිහි' : 'Enrolled'}
              </div>
            </div>
          </button>

          {/* Module 2: Teachers */}
          <button
            onClick={() => onSwitchSubTab('teachers')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white dark:from-emerald-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-emerald-100/90 hover:to-teal-50 dark:hover:from-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <GraduationCap className="w-5 h-5 animate-icon-bounce group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {language === 'si' ? 'ගුරු මණ්ඩලය' : 'Teacher Staff'}
              </div>
              <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-bold truncate">
                {teachers.length} {language === 'si' ? 'ආචාර්යවරුන්' : 'Teachers'}
              </div>
            </div>
          </button>

          {/* Module 3: Classes & Grades */}
          <button
            onClick={() => onSwitchSubTab('classes')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-violet-50/40 to-white dark:from-indigo-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-indigo-100/90 hover:to-violet-50 dark:hover:from-indigo-900/40 border border-indigo-200/80 dark:border-indigo-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <School className="w-5 h-5 animate-icon-pulse-glow group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {language === 'si' ? 'පන්ති & ශ්‍රේණි' : 'Classes & Grades'}
              </div>
              <div className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 font-bold truncate">
                {classes.length} {language === 'si' ? 'පන්ති කාමර' : 'Classes'}
              </div>
            </div>
          </button>

          {/* Module 4: Subjects & Curriculum */}
          <button
            onClick={() => onSwitchSubTab('classes')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-cyan-50/90 via-teal-50/40 to-white dark:from-cyan-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-cyan-100/90 hover:to-teal-50 dark:hover:from-cyan-900/40 border border-cyan-200/80 dark:border-cyan-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <BookOpen className="w-5 h-5 animate-icon-float group-hover:scale-125 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {language === 'si' ? 'විෂය නිර්දේශය' : 'Curriculum & Subjects'}
              </div>
              <div className="text-[10px] text-cyan-700/80 dark:text-cyan-300/80 font-bold truncate">
                {language === 'si' ? 'විෂය මාලා පාලනය' : 'Manage Subjects'}
              </div>
            </div>
          </button>

          {/* Module 5: Online Admissions */}
          <button
            onClick={() => onSwitchSubTab('admissions')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white dark:from-amber-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-amber-100/90 hover:to-orange-50 dark:hover:from-amber-900/40 border border-amber-200/80 dark:border-amber-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left relative shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <UserCheck className="w-5 h-5 animate-icon-bounce group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {language === 'si' ? 'නව ඇතුළත් කිරීම්' : 'Admissions'}
              </div>
              <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-bold truncate">
                {admissions.length} {language === 'si' ? 'අයදුම්පත්' : 'Applications'}
              </div>
            </div>
            {pendingAdmissionsCount > 0 && (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black animate-pulse shadow-xs">
                {pendingAdmissionsCount}
              </span>
            )}
          </button>

          {/* Module 6: Exams & Results */}
          <button
            onClick={() => onSwitchSubTab('exam_reviews')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-fuchsia-50/40 to-white dark:from-purple-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-purple-100/90 hover:to-fuchsia-50 dark:hover:from-purple-900/40 border border-purple-200/80 dark:border-purple-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <Award className="w-5 h-5 animate-icon-sparkle group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {language === 'si' ? 'විභාග සහ ප්‍රතිඵල' : 'Exams & Marks'}
              </div>
              <div className="text-[10px] text-purple-700/80 dark:text-purple-300/80 font-bold truncate">
                {exams.length} {language === 'si' ? 'විභාග' : 'Exams'} • {submissions.length} {language === 'si' ? 'පිළිතුරු' : 'Papers'}
              </div>
            </div>
          </button>

          {/* Module 7: Pinkama Fund */}
          <button
            onClick={() => onSwitchSubTab('donations_manager')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/90 via-pink-50/40 to-white dark:from-rose-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-rose-100/90 hover:to-pink-50 dark:hover:from-rose-900/40 border border-rose-200/80 dark:border-rose-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left relative shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <Heart className="w-5 h-5 animate-icon-heartbeat group-hover:scale-125 transition-transform duration-300 text-rose-500 fill-rose-500/30" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {language === 'si' ? 'පින්කම් අරමුදල' : 'Pinkama Fund'}
              </div>
              <div className="text-[10px] text-rose-700/80 dark:text-rose-300/80 font-bold truncate">
                {donations.length} {language === 'si' ? 'දායක වාර්තා' : 'Donations'}
              </div>
            </div>
            {pendingDonationsCount > 0 && (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black animate-pulse shadow-xs">
                {pendingDonationsCount}
              </span>
            )}
          </button>

          {/* Module 8: Live Emergency Alert Broadcast */}
          <button
            onClick={onOpenCreateNoticeModal}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-red-50/90 via-orange-50/40 to-white dark:from-red-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-red-100/90 hover:to-orange-50 dark:hover:from-red-900/40 border border-red-200/80 dark:border-red-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <Plus className="w-5 h-5 stroke-[2.8] animate-icon-pulse-glow group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                {language === 'si' ? 'හදිසි නිවේදන' : 'Broadcast Alert'}
              </div>
              <div className="text-[10px] text-red-700/80 dark:text-red-300/80 font-bold truncate">
                {activeNoticesCount} {language === 'si' ? 'සක්‍රීය නිවේදන' : 'Active Alerts'}
              </div>
            </div>
          </button>

          {/* Module 9: AI Monastic Copilot */}
          <button
            onClick={handleOpenAiAssistant}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/15 to-violet-500/15 hover:from-blue-500/25 hover:to-violet-500/25 border-2 border-blue-500/40 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg active:scale-95 group text-left shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <Bot className="w-5 h-5 animate-icon-pulse-glow group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate flex items-center gap-1">
                <span>{language === 'si' ? 'AI ධර්ම සහකාර' : 'AI Copilot'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold truncate">
                {language === 'si' ? 'බුද්ධිමත් සහයකයා' : 'Smart Monastic AI'}
              </div>
            </div>
          </button>

          {/* Module 10: QR Student ID Cards */}
          <button
            onClick={() => onSwitchSubTab('students')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-white dark:from-amber-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-amber-100/90 hover:to-yellow-50 dark:hover:from-amber-900/40 border border-amber-300/80 dark:border-amber-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <QrCode className="w-5 h-5 animate-icon-bounce group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {language === 'si' ? 'QR හැඳුනුම්පත්' : 'QR Student IDs'}
              </div>
              <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-bold truncate">
                {language === 'si' ? 'මුද්‍රණය සහ QR' : 'Monastic ID Cards'}
              </div>
            </div>
          </button>

          {/* Module 11: Term Report Cards */}
          <button
            onClick={() => onSwitchSubTab('students')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-green-50/40 to-white dark:from-emerald-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-emerald-100/90 hover:to-green-50 dark:hover:from-emerald-900/40 border border-emerald-300/80 dark:border-emerald-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <FileCheck2 className="w-5 h-5 animate-icon-float group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {language === 'si' ? 'වාර වාර්තා පොත්' : 'Term Report Cards'}
              </div>
              <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-bold truncate">
                {language === 'si' ? 'නිල ලකුණු පොත්' : 'Official Marksheets'}
              </div>
            </div>
          </button>

          {/* Module 12: Certificate Verification */}
          <button
            onClick={() => setIsCertModalOpen(true)}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-violet-50/90 via-purple-50/40 to-white dark:from-violet-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-violet-100/90 hover:to-purple-50 dark:hover:from-violet-900/40 border border-violet-200/80 dark:border-violet-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <FileBadge className="w-5 h-5 animate-icon-sparkle group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {language === 'si' ? 'සහතික සත්‍යාපනය' : 'Verify Certificates'}
              </div>
              <div className="text-[10px] text-violet-700/80 dark:text-violet-300/80 font-bold truncate">
                {language === 'si' ? 'වලංගුභාවය පරීක්ෂාව' : 'Online Verification'}
              </div>
            </div>
          </button>

          {/* Module 13: Database & Cloud Backup */}
          <button
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white dark:from-blue-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-blue-100/90 hover:to-indigo-50 dark:hover:from-blue-900/40 border border-blue-200/80 dark:border-blue-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <HardDrive className="w-5 h-5 animate-icon-pulse-glow group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {language === 'si' ? 'සජීවී MySQL දත්ත සමුදාය' : 'Live MySQL Database'}
              </div>
              <div className="text-[10px] text-blue-700/80 dark:text-blue-300/80 font-bold truncate">
                {language === 'si' ? 'වේගය සහ සම්බන්ධතාව' : 'Connection & Health'}
              </div>
            </div>
          </button>

          {/* Module 14: System Audit Trail */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-white dark:from-teal-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-teal-100/90 hover:to-emerald-50 dark:hover:from-teal-900/40 border border-teal-200/80 dark:border-teal-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <ShieldCheck className="w-5 h-5 animate-icon-float group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {language === 'si' ? 'ආරක්ෂක සටහන්' : 'Audit Logs'}
              </div>
              <div className="text-[10px] text-teal-700/80 dark:text-teal-300/80 font-bold truncate">
                {auditLogs.length} {language === 'si' ? 'ලොග් වාර්තා' : 'Log Entries'}
              </div>
            </div>
          </button>

          {/* Module 15: Academic Term Switcher */}
          <button
            onClick={() => setIsAcademicModalOpen(true)}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white dark:from-orange-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-orange-100/90 hover:to-amber-50 dark:hover:from-orange-900/40 border border-orange-200/80 dark:border-orange-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <Calendar className="w-5 h-5 animate-icon-bounce group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {language === 'si' ? 'අධ්‍යයන වාරය' : 'Academic Term'}
              </div>
              <div className="text-[10px] text-orange-700/80 dark:text-orange-300/80 font-bold truncate">
                {siteSettings.currentAcademicYear || '2026'} • {siteSettings.currentAcademicTermSinhala || '1 වන වාරය'}
              </div>
            </div>
          </button>

          {/* Module 16: Security Settings & PIN */}
          <button
            onClick={() => onSwitchSubTab('settings')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-100/90 via-stone-100/40 to-white dark:from-stone-800/60 dark:via-stone-900 dark:to-stone-900 hover:from-slate-200/90 hover:to-stone-100 dark:hover:from-stone-750 border border-slate-200/90 dark:border-stone-700 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-500/15 text-slate-700 dark:bg-stone-700/40 dark:text-slate-300 border border-slate-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <Settings className="w-5 h-5 animate-icon-spin-slow group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {language === 'si' ? 'පද්ධති සැකසුම්' : 'Settings & Security'}
              </div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold truncate">
                {language === 'si' ? 'Master PIN & Backup' : 'Master PIN & Config'}
              </div>
            </div>
          </button>

          {/* Module 17: News & Articles Editor */}
          <button
            onClick={() => handleOpenSiteEditorTab('news')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white dark:from-amber-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-amber-100/90 hover:to-orange-50 dark:hover:from-amber-900/40 border border-amber-200/80 dark:border-amber-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <Newspaper className="w-5 h-5 animate-icon-float group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {language === 'si' ? 'පුවත් සහ නිවේදන' : 'News & Articles'}
              </div>
              <div className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-bold truncate">
                {newsArticles.length} {language === 'si' ? 'ප්‍රකාශිත පුවත්' : 'Published'}
              </div>
            </div>
          </button>

          {/* Module 18: Events & Calendar Editor */}
          <button
            onClick={() => handleOpenSiteEditorTab('events')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/90 via-pink-50/40 to-white dark:from-rose-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-rose-100/90 hover:to-pink-50 dark:hover:from-rose-900/40 border border-rose-200/80 dark:border-rose-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <Calendar className="w-5 h-5 animate-icon-bounce group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                {language === 'si' ? 'උත්සව & දින දර්ශනය' : 'Events & Calendar'}
              </div>
              <div className="text-[10px] text-rose-700/80 dark:text-rose-300/80 font-bold truncate">
                {events.length} {language === 'si' ? 'සංවිධානාත්මක උත්සව' : 'Events'}
              </div>
            </div>
          </button>

          {/* Module 19: Photo Gallery Manager */}
          <button
            onClick={() => handleOpenSiteEditorTab('gallery')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-pink-50/90 via-rose-50/40 to-white dark:from-pink-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-pink-100/90 hover:to-rose-50 dark:hover:from-pink-900/40 border border-pink-200/80 dark:border-pink-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 border border-pink-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <ImageIcon className="w-5 h-5 animate-icon-sparkle group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                {language === 'si' ? 'ඡායාරූප ගැලරිය' : 'Photo Gallery'}
              </div>
              <div className="text-[10px] text-pink-700/80 dark:text-pink-300/80 font-bold truncate">
                {galleryItems.length} {language === 'si' ? 'ඡායාරූප/වීඩියෝ' : 'Media Items'}
              </div>
            </div>
          </button>

          {/* Module 20: Digital E-Library Hub */}
          <button
            onClick={() => handleOpenSiteEditorTab('library')}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-sky-50/40 to-white dark:from-indigo-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-indigo-100/90 hover:to-sky-50 dark:hover:from-indigo-900/40 border border-indigo-200/80 dark:border-indigo-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <BookOpen className="w-5 h-5 animate-icon-float group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {language === 'si' ? 'ඩිජිටල් පුස්තකාලය' : 'E-Library Hub'}
              </div>
              <div className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 font-bold truncate">
                {libraryBooks.length} {language === 'si' ? 'ධර්ම ග්‍රන්ථ/PDF' : 'E-Books & PDFs'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📢 4. 2026 MOBILE LIVE BROADCAST ALERT CONTROL CENTER    */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-stone-900 text-slate-900 dark:text-white border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  {language === 'si' ? 'සජීවී පිරිවෙන් නිවේදන විකාශය' : 'Live Broadcast Alerts Hub'}
                </h3>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>ON-AIR</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'si'
                  ? 'පිරිවෙනේ සියලු ගුරු-සිසු ජංගම දුරකථන වෙත ක්ෂණික නිවේදන නිකුත් කිරීම'
                  : 'Broadcast real-time push alerts to all teacher and student app users'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreateNoticeModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 transition shadow-md shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>{language === 'si' ? 'නව නිවේදනයක් නිකුත් කරන්න' : 'Publish Alert'}</span>
          </button>
        </div>

        {/* Notices Cards List */}
        <div className="space-y-2.5">
          {!Array.isArray(broadcastNotices) || broadcastNotices.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 dark:bg-stone-950/50 border border-dashed border-slate-200 dark:border-stone-800 space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-200 dark:bg-stone-800 text-slate-500 flex items-center justify-center">
                <Bell className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {language === 'si'
                  ? 'දැනට නිකුත් කර ඇති සජීවී නිවේදන නොමැත.'
                  : 'No active broadcast alerts currently on air.'}
              </p>
              <button
                onClick={onOpenCreateNoticeModal}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
              >
                {language === 'si' ? '+ පළමු නිවේදනය පළ කරන්න' : '+ Publish First Alert'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 sm:max-h-80 overflow-y-auto pr-1 scrollbar-thin touch-pan-y overscroll-contain">
              {broadcastNotices.map((notice: any) => {
                const targetText =
                  notice.targetRole === 'students'
                    ? language === 'si' ? '🎓 සිසුන්ට පමණයි' : 'Students Only'
                    : notice.targetRole === 'teachers'
                      ? language === 'si' ? '👨‍🏫 ගුරුවරුන්ට පමණයි' : 'Teachers Only'
                      : language === 'si' ? '👥 සියලු දෙනාට' : 'All Users';

                return (
                  <div
                    key={notice.id}
                    className="bg-slate-50 dark:bg-stone-800/80 hover:bg-slate-100 dark:hover:bg-stone-800 border border-slate-200/90 dark:border-stone-700 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-stone-700 border border-slate-200 dark:border-stone-600 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                        {notice.customIcon || '📢'}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wide border ${notice.severity === 'urgent'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse'
                                : notice.severity === 'warning'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                              }`}
                          >
                            {notice.severity || 'info'}
                          </span>

                          <span className="px-2 py-0.2 rounded-md bg-white dark:bg-stone-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-stone-600">
                            {targetText}
                          </span>

                          <span className="font-bold text-slate-900 dark:text-white truncate text-xs">
                            {language === 'si' ? notice.titleSinhala || notice.title : notice.title || notice.titleSinhala}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {language === 'si' ? notice.messageSinhala || notice.message : notice.message || notice.messageSinhala}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-stone-700 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => onToggleNotice(notice.id, !notice.active)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer active:scale-95 shadow-xs ${notice.active
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500'
                            : 'bg-slate-200 dark:bg-stone-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-stone-600'
                          }`}
                        title="Toggle Alert State"
                      >
                        {notice.active ? '● සක්‍රීයයි (ON)' : '○ අක්‍රීයයි (OFF)'}
                      </button>

                      <button
                        onClick={() => onOpenEditNoticeModal(notice)}
                        className="p-1.5 bg-white dark:bg-stone-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer active:scale-95 border border-slate-200 dark:border-stone-600"
                        title="Edit Notice"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteNotice(notice.id)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl transition cursor-pointer active:scale-95 border border-rose-200 dark:border-rose-800"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

