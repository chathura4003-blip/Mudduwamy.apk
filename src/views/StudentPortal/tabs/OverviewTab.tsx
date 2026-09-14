import React from 'react';
import { motion } from 'motion/react';
import {
  QrCode,
  BarChart3,
  ShieldCheck,
  Calendar,
  Clock,
  BookOpen,
  FileText,
  School,
  ArrowUpRight,
  BellRing,
  BellOff,
  Bot,
  Award,
  UserCheck,
  CheckCircle2,
  FileBadge,
  MessageCircle,
  Settings,
  Sparkles,
  Zap,
  BookMarked,
  Layers,
  GraduationCap,
} from 'lucide-react';
import type { User, PirivenaClass, StudyMaterial, Exam, LibraryBook } from '../../../types';
import { handleAvatarError, getImageUrl } from '../../../utils/imageHelper';
import { triggerHaptic } from '../../../utils/haptics';
import { LiveSriLankaClock } from '../../../components/LiveSriLankaClock';
import { LivePeriodCountdown } from '../../../components/LivePeriodCountdown';

interface OverviewTabProps {
  user: User | null;
  studentClass: PirivenaClass | undefined;
  filteredMaterials: StudyMaterial[];
  activeUnattemptedExams: Exam[];
  completedSubmissions: any[];
  libraryBooks: LibraryBook[];
  studentPerformance: {
    totalAttempted: number;
    avgScore: number;
    highestScore: number;
    passedRate: number;
  };
  isDashboardTimetableVisible: boolean;
  setIsDashboardTimetableVisible: (v: boolean) => void;
  currentLivePeriod: any;
  currentLiveTimeStr?: string;
  activeOngoingPeriod: any;
  upcomingNextPeriod?: any;
  periodAlertsEnabled: boolean;
  handleTogglePeriodNotifications: () => void;
  switchSubTab: (tab: any) => void;
  onOpenQrModal?: () => void;
  onOpenCertModal?: () => void;
  onOpenReportCardModal?: () => void;
  isSi: boolean;
  getSubjectIconAndColor: (subjName?: string) => { icon: string; color: string };
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  user,
  studentClass,
  filteredMaterials,
  activeUnattemptedExams,
  completedSubmissions,
  libraryBooks,
  studentPerformance,
  isDashboardTimetableVisible,
  setIsDashboardTimetableVisible,
  currentLivePeriod,
  currentLiveTimeStr,
  activeOngoingPeriod,
  upcomingNextPeriod,
  periodAlertsEnabled,
  handleTogglePeriodNotifications,
  switchSubTab,
  onOpenQrModal,
  onOpenCertModal,
  onOpenReportCardModal,
  isSi,
  getSubjectIconAndColor,
}) => {
  const handleOpenAiAssistant = () => {
    triggerHaptic('light');
    window.dispatchEvent(new CustomEvent('open-ai-assistant-modal'));
  };

  const handleOpenChat = () => {
    triggerHaptic('light');
    window.dispatchEvent(
      new CustomEvent('open-pirivena-chat', {
        detail: { roomId: 'general' },
      })
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in select-none">
      {/* ========================================================= */}
      {/* 🌟 1. SACRED MONASTIC SCHOLAR PROFILE HERO CARD           */}
      {/* ========================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 text-white rounded-3xl p-4 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] border border-amber-500/40 dark:border-amber-700/50"
      >
        {/* Monastic Lotus / Emblem Ambient Background Watermark */}
        <div className="absolute right-3 -bottom-4 opacity-10 pointer-events-none select-none text-8xl sm:text-9xl text-amber-400">
          {user?.monkStatus === 'monk' ? '🪷' : '☸'}
        </div>
        <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.5)]" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-row items-center sm:items-start gap-3.5 sm:gap-5">
            {/* Student Avatar with Gold Ring & Shimmer */}
            <div className="relative w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-stone-950 p-0.5 shadow-2xl shrink-0 border-2 border-amber-400/80 flex items-center justify-center overflow-hidden ring-4 ring-amber-500/20">
              <div className="w-full h-full rounded-xl bg-stone-900 flex items-center justify-center overflow-hidden font-serif font-bold text-2xl sm:text-3xl text-amber-300">
                {user?.avatar && user.avatar.trim() !== '' ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt={user.name || 'Student'}
                    onError={handleAvatarError}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.monkStatus === 'monk' ? '🪷' : '🎓'}</span>
                )}
              </div>
            </div>

            {/* Student Details */}
            <div className="flex-1 min-w-0 text-left space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] sm:text-xs shadow-inner truncate ${
                    user?.monkStatus === 'monk'
                      ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300'
                      : 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                  }`}
                >
                  <span>{user?.monkStatus === 'monk' ? '🪷' : '👤'}</span>
                  <span className="truncate">
                    {user?.monkStatus === 'monk'
                      ? isSi
                        ? 'සාමණේර ශිෂ්‍ය භික්ෂූන් වහන්සේ'
                        : 'Monastic Scholar'
                      : isSi
                      ? 'ලියාපදිංචි ගිහි ශිෂ්‍යයා'
                      : 'Lay Student Scholar'}
                  </span>
                </span>

                <span className="px-2 py-0.5 rounded-full bg-stone-800/80 border border-stone-700 text-stone-300 text-[10px] font-mono font-bold">
                  {user?.customId && !user.customId.startsWith('usr-')
                    ? user.customId
                    : user?.indexNumber && !user.indexNumber.startsWith('usr-')
                    ? user.indexNumber
                    : 'STD-2026-001'}
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-serif font-black text-white tracking-tight break-words pt-0.5">
                {user?.monkStatus === 'monk' && user?.monkName
                  ? user.monkName
                  : user?.name || user?.monkName || (isSi ? 'ශිෂ්‍ය නාමය' : 'Student Scholar')}
              </h1>

              <div className="flex items-center gap-2 text-amber-200/90 text-xs sm:text-sm font-medium flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-white">
                    {studentClass
                      ? `${studentClass.name}${studentClass.code ? ` (${studentClass.code})` : ''}`
                      : user?.classId || (user as any)?.pirivenaClass || (isSi ? 'පන්තිය පවරා නැත' : 'Pending Enrolment')}
                  </span>
                </span>
                {(user?.guardianName || user?.templeName) && (
                  <span className="text-amber-300/70 hidden sm:inline">• 🏛️ {user.guardianName || user.templeName}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Profile Action Buttons Pill Group */}
          <div className="pt-2 border-t border-amber-700/40 grid grid-cols-2 sm:flex sm:flex-wrap items-center sm:justify-end gap-2 text-xs font-bold">
            {onOpenQrModal && (
              <button
                type="button"
                onClick={onOpenQrModal}
                className="px-3 py-2 sm:px-3.5 sm:py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs rounded-xl transition flex items-center justify-center sm:justify-start gap-1.5 border border-amber-400/40 cursor-pointer shadow-xs active:scale-95 group"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400 animate-icon-pulse-glow" />
                <span className="truncate">{isSi ? 'QR හැඳුනුම්පත' : 'Digital ID'}</span>
              </button>
            )}

            {onOpenReportCardModal && (
              <button
                type="button"
                onClick={onOpenReportCardModal}
                className="px-3 py-2 sm:px-3.5 sm:py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-bold text-xs rounded-xl transition flex items-center justify-center sm:justify-start gap-1.5 border border-emerald-400/40 cursor-pointer shadow-xs active:scale-95 group"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400 animate-icon-float" />
                <span className="truncate">{isSi ? 'ප්‍රගති වාර්තාව' : 'Report Card'}</span>
              </button>
            )}

            {onOpenCertModal && (
              <button
                type="button"
                onClick={onOpenCertModal}
                className="px-3 py-2 sm:px-3.5 sm:py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 font-bold text-xs rounded-xl transition flex items-center justify-center sm:justify-start gap-1.5 border border-violet-400/40 cursor-pointer shadow-xs active:scale-95 group"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400 animate-icon-pulse-glow" />
                <span className="truncate">{isSi ? 'සහතික සත්‍යාපනය' : 'Verify'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAiAssistant}
              className="px-3 py-2 sm:px-3.5 sm:py-1.5 bg-blue-500/25 hover:bg-blue-500/35 text-blue-200 font-bold text-xs rounded-xl transition flex items-center justify-center sm:justify-start gap-1.5 border border-blue-400/50 cursor-pointer shadow-xs active:scale-95 group"
            >
              <Bot className="w-3.5 h-3.5 text-blue-400 animate-icon-pulse-glow" />
              <span className="truncate">AI Copilot</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ========================================================= */}
      {/* 🗓️ 2. TODAY'S LIVE CLASS TIMETABLE WIDGET                 */}
      {/* ========================================================= */}
      {isDashboardTimetableVisible && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold shadow-xs">
                <Calendar className="w-4.5 h-4.5 animate-icon-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {isSi ? 'අද දින පන්ති කාලසටහන' : "Today's Class Timetable"}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-[10px] border border-amber-500/30">
                    {studentClass ? studentClass.name : isSi ? 'පන්ති කාලසටහන' : 'Class Schedule'}
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/5 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-stone-900 dark:text-amber-300 text-[10px] font-mono font-black shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <LiveSriLankaClock includeSeconds={true} />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isSi
                    ? 'සජීවී කාලච්ඡේද ප්‍රගතිය සහ විස්තර (07:40 AM - 01:30 PM)'
                    : 'Live period tracking & lecture updates (07:40 AM - 01:30 PM)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePeriodNotifications}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 flex items-center gap-1.5 border shadow-2xs ${
                  periodAlertsEnabled
                    ? 'bg-amber-400 dark:bg-amber-500 text-stone-950 border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700'
                }`}
                title={isSi ? 'කාලච්ඡේද මතක් කිරීමේ දැනුම්දීම්' : 'Period Reminder Notifications'}
              >
                {periodAlertsEnabled ? (
                  <BellRing className="w-3.5 h-3.5 text-stone-950 animate-bounce" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {periodAlertsEnabled
                    ? isSi
                      ? '🔔 දැනුම්දීම් සක්‍රීයයි'
                      : '🔔 Alerts ON'
                    : isSi
                    ? '🔕 දැනුම්දීම් On කරන්න'
                    : '🔕 Enable Alerts'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchSubTab('timetable')}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-stone-800 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-stone-700 text-xs font-bold transition cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-2xs"
              >
                <span>{isSi ? 'සම්පූර්ණ කාලසටහන' : 'Full Timetable'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Period & Upcoming Next Period Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 🌟 CARD 1: ACTIVE NOW (සජීවීව දැන් පැවැත්වෙන පන්තිය) */}
            <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-stone-900 dark:to-stone-900 border border-amber-500/40 shadow-xs flex flex-col justify-between space-y-2.5 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>{isSi ? 'සජීවීව දැන් (NOW)' : 'ACTIVE NOW'}</span>
                </span>
                {activeOngoingPeriod && (
                  <span className="font-mono text-xs font-bold text-amber-950 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-xl border border-amber-300 dark:border-amber-800">
                    Period #{activeOngoingPeriod.period.period} ({activeOngoingPeriod.period.startTime} -{' '}
                    {activeOngoingPeriod.period.endTime})
                  </span>
                )}
              </div>

              {activeOngoingPeriod ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">
                      {getSubjectIconAndColor(activeOngoingPeriod.slot?.subjectName).icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                        {activeOngoingPeriod.slot?.subjectName ||
                          (isSi ? 'සාමාන්‍ය කාලච්ඡේදය' : 'General Period')}
                      </h4>
                      <p className="text-xs text-amber-900 dark:text-amber-300 font-bold truncate">
                        👨‍🏫{' '}
                        {activeOngoingPeriod.slot?.teacherName ||
                          (isSi ? 'ගුරුභවතා පවරා නැත' : 'Lecturer Assigned')}
                        {activeOngoingPeriod.slot?.room ? ` • 🏛️ කාමරය ${activeOngoingPeriod.slot.room}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* ⏳ LIVE ANIMATED COUNTDOWN TIMER & PROGRESS BAR */}
                  <div className="pt-2 border-t border-amber-500/20 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-emerald-800 dark:text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-icon-bounce shrink-0" />
                        <span>{isSi ? 'අවසන් වීමට:' : 'Time Left:'}</span>
                        <LivePeriodCountdown
                          startMin={activeOngoingPeriod.period.startMin}
                          endMin={activeOngoingPeriod.period.endMin}
                          variant="text"
                          className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-200 border border-emerald-500/40 shadow-xs tracking-wider"
                        />
                      </span>
                      <LivePeriodCountdown
                        startMin={activeOngoingPeriod.period.startMin}
                        endMin={activeOngoingPeriod.period.endMin}
                        variant="percent"
                        className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400"
                      />
                    </div>
                    <LivePeriodCountdown
                      startMin={activeOngoingPeriod.period.startMin}
                      endMin={activeOngoingPeriod.period.endMin}
                      variant="bar"
                      barContainerClassName="w-full h-2 rounded-full bg-slate-200 dark:bg-stone-800 overflow-hidden shadow-inner"
                      barClassName="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 transition-all duration-1000 ease-linear rounded-full shadow-xs"
                    />
                  </div>
                </div>
              ) : currentLivePeriod.isMorningPuja ? (
                <div className="py-2.5 flex items-center gap-3 text-amber-900 dark:text-amber-200">
                  <span className="text-3xl">🙏</span>
                  <div>
                    <h4 className="font-serif font-black text-sm sm:text-base">
                      {isSi ? 'උදෑසන බුද්ධ වන්දනාව පැවැත්වේ' : 'Morning Buddha Puja in Progress'}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">07:30 AM - 07:40 AM</p>
                  </div>
                </div>
              ) : currentLivePeriod.isInterval ? (
                <div className="py-2.5 flex items-center gap-3 text-amber-900 dark:text-amber-200">
                  <span className="text-3xl">🍱</span>
                  <div>
                    <h4 className="font-serif font-black text-sm sm:text-base">
                      {isSi
                        ? 'දහවල් දාන වේලාව සහ විවේකය'
                        : 'Midday Alms & Student Break in Progress'}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">11:40 AM - 12:00 PM</p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-500 dark:text-slate-400 space-y-1">
                  <Clock className="w-6 h-6 mx-auto text-amber-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-stone-300">
                    {isSi
                      ? 'මේ මොහොතේ සක්‍රීය පන්ති කාලච්ඡේදයක් නොමැත'
                      : 'No Active Class Session Right Now'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isSi
                      ? 'නියමිත කාලසටහනට අනුව පන්ති ස්වයංක්‍රීයව ආරම්භ වේ'
                      : 'Scheduled classes will start automatically'}
                  </p>
                </div>
              )}
            </div>

            {/* ⏭️ CARD 2: NEXT UPCOMING CLASS (ඊළඟට පැවැත්වෙන පන්තිය) */}
            <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-br from-slate-50/90 via-amber-50/30 to-white dark:from-stone-800/80 dark:via-stone-900 dark:to-stone-900 border border-slate-200 dark:border-stone-700 shadow-xs flex flex-col justify-between space-y-2.5 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                  <span>⏭️</span>
                  <span>{isSi ? 'ඊළඟට (NEXT)' : 'UPCOMING NEXT'}</span>
                </span>

                {upcomingNextPeriod && (
                  <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-stone-800 px-2.5 py-0.5 rounded-xl border border-slate-200 dark:border-stone-700">
                    Period #{upcomingNextPeriod.period.period} ({upcomingNextPeriod.period.startTime})
                  </span>
                )}
              </div>

              {upcomingNextPeriod ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">
                      {getSubjectIconAndColor(upcomingNextPeriod.slot?.subjectName).icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                        {upcomingNextPeriod.slot?.subjectName ||
                          (isSi ? 'සාමාන්‍ය කාලච්ඡේදය' : 'Next General Period')}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        👨‍🏫{' '}
                        {upcomingNextPeriod.slot?.teacherName ||
                          (isSi ? 'ගුරුභවතා පවරා නැත' : 'Lecturer Assigned')}
                        {upcomingNextPeriod.slot?.room ? ` • 🏛️ කාමරය ${upcomingNextPeriod.slot.room}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-stone-800 flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                      <span>{isSi ? 'ආරම්භ වීමට:' : 'Starts in:'}</span>
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-amber-500/20 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border border-amber-500/40 shadow-xs tracking-wider">
                        {upcomingNextPeriod.startsInMins}:{upcomingNextPeriod.startsInSecStr}
                      </span>
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20 text-amber-900 dark:text-amber-300">
                      {upcomingNextPeriod.period.startTime}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-1 text-slate-500 dark:text-slate-400">
                  <span className="text-2xl">🎓</span>
                  <p className="text-xs font-bold text-slate-700 dark:text-stone-300">
                    {isSi
                      ? 'අද දින නියමිත සියලුම කාලච්ඡේද අවසන්'
                      : 'All Scheduled Periods Completed For Today'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isSi
                      ? 'හෙට දින කාලසටහන බැලීමට Full Timetable විවෘත කරන්න'
                      : 'Check Full Timetable for tomorrow'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div
              onClick={() => switchSubTab('materials')}
              className="bg-slate-50 hover:bg-sky-50/60 dark:bg-stone-800/70 dark:hover:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-2xl p-3.5 space-y-1.5 cursor-pointer hover:border-sky-400 dark:hover:border-sky-600 transition shadow-2xs group active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="font-serif font-bold text-xs text-slate-900 dark:text-white">
                {isSi ? 'අධ්‍යයන නිබන්ධන' : 'Study Notes'}
              </h4>
              <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold block">
                {filteredMaterials.length} {isSi ? 'ගොනු' : 'Files'}
              </span>
            </div>

            <div
              onClick={() => switchSubTab('exams')}
              className="bg-slate-50 hover:bg-purple-50/60 dark:bg-stone-800/70 dark:hover:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-2xl p-3.5 space-y-1.5 cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition shadow-2xs group active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-serif font-bold text-xs text-slate-900 dark:text-white">
                {isSi ? 'මාර්ගගත විභාග' : 'Online Exams'}
              </h4>
              <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold block">
                {activeUnattemptedExams.length} {isSi ? 'ක්‍රියාකාරී' : 'Active'}
              </span>
            </div>

            <div
              onClick={() => switchSubTab('library')}
              className="bg-slate-50 hover:bg-indigo-50/60 dark:bg-stone-800/70 dark:hover:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-2xl p-3.5 space-y-1.5 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-2xs group active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
                <School className="w-4 h-4" />
              </div>
              <h4 className="font-serif font-bold text-xs text-slate-900 dark:text-white">
                {isSi ? 'ඩිජිටල් පුස්තකාලය' : 'E-Library'}
              </h4>
              <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold block">
                {libraryBooks.length} {isSi ? 'පොත්' : 'E-Books'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 3. FOCUSED SCHOLAR SERVICES & ACADEMIC HIGHLIGHTS      */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black shadow-xs">
              ☸
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-serif">
                {isSi ? 'ශිෂ්‍ය සේවාවන් සහ සහතික (Student Services)' : 'Student Services & Verification'}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {isSi ? 'හැඳුනුම්පත්, සහතික සහ වාර්තා පොත් පරිහරණය' : 'Identity cards, certificates & official reports'}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-amber-800 dark:text-amber-300 font-black px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 shadow-2xs font-mono">
            {isSi ? 'ක්ෂණික සේවා' : 'Direct Access'}
          </span>
        </div>

        {/* 4-Item Streamlined Scholar Services Grid (No bottom-bar duplicate buttons) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {/* Service 1: QR Student ID Card */}
          <button
            type="button"
            onClick={() => {
              if (onOpenQrModal) onOpenQrModal();
            }}
            className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white dark:from-amber-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-amber-100/90 border border-amber-200/80 dark:border-amber-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-pulse-glow" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-serif leading-tight">
                {isSi ? 'QR හැඳුනුම්පත' : 'Student ID'}
              </div>
              <div className="text-[9.5px] sm:text-[10px] text-amber-700/80 dark:text-amber-300/80 font-bold truncate leading-tight">
                {isSi ? 'ඩිජිටල් කාඩ්පත' : 'Digital Pass'}
              </div>
            </div>
          </button>

          {/* Service 2: Term Progress Report Card */}
          <button
            type="button"
            onClick={() => {
              if (onOpenReportCardModal) onOpenReportCardModal();
            }}
            className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white dark:from-emerald-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-emerald-100/90 border border-emerald-200/80 dark:border-emerald-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-2xs">
              <FileBadge className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-float" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-serif leading-tight">
                {isSi ? 'ප්‍රගති වාර්තාව' : 'Progress Report'}
              </div>
              <div className="text-[9.5px] sm:text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-bold truncate leading-tight">
                {isSi ? 'වාර ලකුණු පොත' : 'Term Marksheet'}
              </div>
            </div>
          </button>

          {/* Module 11: Verify Certificate */}
          <button
            type="button"
            onClick={() => {
              if (onOpenCertModal) onOpenCertModal();
            }}
            className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-br from-violet-50/90 via-purple-50/40 to-white dark:from-violet-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-violet-100/90 hover:to-purple-50 dark:hover:from-violet-900/40 border border-violet-200/80 dark:border-violet-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-pulse-glow" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors font-serif leading-tight">
                {isSi ? 'සහතික සත්‍යාපනය' : 'Verify Certificate'}
              </div>
              <div className="text-[9.5px] sm:text-[10px] text-violet-700/80 dark:text-violet-300/80 font-bold truncate leading-tight">
                {isSi ? 'වලංගුභාවය' : 'Online Verify'}
              </div>
            </div>
          </button>

          {/* Module 12: Account & PIN Settings */}
          <button
            type="button"
            onClick={() => switchSubTab('settings')}
            className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-br from-slate-100/90 via-stone-100/40 to-white dark:from-stone-800/60 dark:via-stone-900 dark:to-stone-900 hover:from-slate-200/90 hover:to-stone-100 dark:hover:from-stone-750 border border-slate-200/90 dark:border-stone-700 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
          >
            <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-slate-500/15 text-slate-700 dark:bg-stone-700/40 dark:text-slate-300 border border-slate-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 animate-icon-spin-slow" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors font-serif leading-tight">
                {isSi ? 'ගිණුම් සැකසුම්' : 'My Account'}
              </div>
              <div className="text-[9.5px] sm:text-[10px] text-slate-600 dark:text-slate-400 font-bold truncate leading-tight">
                {isSi ? 'මුරපද සහ විස්තර' : 'Profile & PIN'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
