import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  BookOpen,
  Award,
  Users,
  BarChart2,
  ShieldCheck,
  Mail,
  Upload,
  Calendar,
  Printer,
  FileText,
  Clock,
  Sparkles,
  PlusCircle,
  Activity,
  ChevronRight,
  School,
  FileCheck2,
  Layers,
  ArrowUpRight,
  Settings,
  Zap,
  X,
  CheckCircle2,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  Coffee,
} from 'lucide-react';
import type { User, PirivenaClass, Subject, Exam, StudyMaterial, ClassTimetableSlot } from '../../../types';
import { handleAvatarError, getImageUrl } from '../../../utils/imageHelper';
import { triggerHaptic } from '../../../utils/haptics';
import { useLanguage } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { playNotificationSound } from '../../../utils/soundHelper';
import { notificationService } from '../../../services/notificationService';
import {
  getSriLankaDate,
  getSriLankaDateString,
  getSriLankaDayKey,
  getSriLankaMinutesOfDay,
  formatSriLankaDateTime,
  formatSriLankaTime,
  DayKey,
} from '../../../utils/sriLankaTime';

interface OverviewTabProps {
  user: User | null;
  classes?: PirivenaClass[];
  assignedClasses: PirivenaClass[];
  assignedSubjects: Subject[];
  assignedStudents: User[];
  assignedExams: Exam[];
  assignedMaterials: StudyMaterial[];
  handleTabNavigate: (tab: 'overview' | 'monitoring' | 'roster' | 'exams' | 'materials' | 'settings' | 'timetable') => void;
  openUploadMaterialModal: () => void;
  openCreateExamModal?: () => void;
  setRosterClassFilter: (id: string) => void;
  onOpenTimetable?: () => void;
}

const DEFAULT_PERIODS = [
  { period: 1, startTime: '07:40 AM', endTime: '08:20 AM', startMin: 460, endMin: 500 },
  { period: 2, startTime: '08:20 AM', endTime: '09:00 AM', startMin: 500, endMin: 540 },
  { period: 3, startTime: '09:00 AM', endTime: '09:40 AM', startMin: 540, endMin: 580 },
  { period: 4, startTime: '09:40 AM', endTime: '10:20 AM', startMin: 580, endMin: 620 },
  { period: 5, startTime: '10:20 AM', endTime: '11:00 AM', startMin: 620, endMin: 660 },
  { period: 6, startTime: '11:00 AM', endTime: '11:40 AM', startMin: 660, endMin: 700 },
  { period: 7, startTime: '12:00 PM', endTime: '12:45 PM', startMin: 720, endMin: 765 },
  { period: 8, startTime: '12:45 PM', endTime: '01:30 PM', startMin: 765, endMin: 810 },
];

const DAYS: { id: DayKey; labelSi: string; labelEn: string; shortSi: string; icon: string }[] = [
  { id: 'monday', labelSi: 'සඳුදා', labelEn: 'Monday', shortSi: 'සඳු', icon: '🌕' },
  { id: 'tuesday', labelSi: 'අඟහරුවාදා', labelEn: 'Tuesday', shortSi: 'අඟ', icon: '🔥' },
  { id: 'wednesday', labelSi: 'බදාදා', labelEn: 'Wednesday', shortSi: 'බදා', icon: '💧' },
  { id: 'thursday', labelSi: 'බ්‍රහස්පතින්දා', labelEn: 'Thursday', shortSi: 'බ්‍රහ', icon: '🌳' },
  { id: 'friday', labelSi: 'සිකුරාදා', labelEn: 'Friday', shortSi: 'සිකු', icon: '🪷' },
];

const getSubjectIcon = (name: string): string => {
  const n = name.toLowerCase();
  if (/පාලි|pali/i.test(n)) return '📜';
  if (/සංස්කෘත|sanskrit/i.test(n)) return '🪷';
  if (/සිංහල|sinhala/i.test(n)) return '✍️';
  if (/බුද්ධ|ධර්ම|buddhism|dhamma/i.test(n)) return '☸';
  if (/ඉංග්‍රීසි|english/i.test(n)) return '🌐';
  if (/දෙමළ|tamil/i.test(n)) return '🗣️';
  if (/ඉතිහාස|history/i.test(n)) return '🏛️';
  if (/භූගෝල|geography/i.test(n)) return '🗺️';
  if (/ගණිත|math/i.test(n)) return '📐';
  if (/විද්‍යා|science/i.test(n)) return '🔬';
  if (/තොරතුරු|ict|computer/i.test(n)) return '💻';
  return '📖';
};

export const OverviewTab: React.FC<OverviewTabProps> = ({
  user,
  classes = [],
  assignedClasses,
  assignedSubjects,
  assignedStudents,
  assignedExams,
  assignedMaterials,
  handleTabNavigate,
  openUploadMaterialModal,
  openCreateExamModal,
  setRosterClassFilter,
  onOpenTimetable,
}) => {
  const { language } = useLanguage();
  const toast = useToast();
  const isSi = language === 'si';
  const [currentTime, setCurrentTime] = useState<string>(() =>
    formatSriLankaDateTime(null, isSi ? 'si' : 'en', true, true)
  );
  const [currentSecTick, setCurrentSecTick] = useState<number>(() => Date.now());
  const [showClassesModal, setShowClassesModal] = useState<boolean>(false);
  const [showSubjectsModal, setShowSubjectsModal] = useState<boolean>(false);

  // 🔔 Timetable Period Reminder Notifications State
  const [periodAlertsEnabled, setPeriodAlertsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pirivena_period_notifications') === 'true';
    } catch (e) {
      return false;
    }
  });

  const lastNotifiedPeriodRef = useRef<number | null>(null);

  const targetClasses = classes.length > 0 ? classes : assignedClasses;

  // Sri Lanka Standard Time Day Key
  const todayKey = getSriLankaDayKey();

  // Aggregate all teaching slots for this teacher across all classes
  const teacherTodaySlots = useMemo(() => {
    if (!user || !todayKey) return {};
    const teacherId = user.id;
    const teacherCustomId = user.customId;
    const teacherName = user.name;
    const teacherMonkName = user.monkName;

    const slotsMap: { [period: number]: any } = {};

    targetClasses.forEach((cls) => {
      let slots: ClassTimetableSlot[] = [];
      if (cls.timetable && Array.isArray(cls.timetable) && cls.timetable.length > 0) {
        slots = cls.timetable;
      } else {
        try {
          const cached = localStorage.getItem(`pirivena_timetable_${cls.id}`);
          if (cached) slots = JSON.parse(cached);
        } catch (e) {}
      }

      slots.forEach((s) => {
        if (s.day !== todayKey) return;

        const isMatched =
          (teacherId && s.teacherId === teacherId) ||
          (teacherCustomId && s.teacherId === teacherCustomId) ||
          (teacherMonkName && s.teacherName === teacherMonkName) ||
          (teacherName && s.teacherName === teacherName);

        if (isMatched && s.subjectName) {
          const dp = DEFAULT_PERIODS.find((p) => p.period === s.periodNumber) || {
            startTime: s.startTime || '07:40 AM',
            endTime: s.endTime || '08:20 AM',
          };

          slotsMap[s.periodNumber] = {
            day: s.day,
            periodNumber: s.periodNumber,
            startTime: dp.startTime,
            endTime: dp.endTime,
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            classId: cls.id,
            className: cls.nameSinhala || cls.name,
            classCode: cls.code,
            room: cls.roomNumber,
          };
        }
      });
    });

    return slotsMap;
  }, [user, todayKey, targetClasses]);

  // Live Active Period & Next Upcoming Period Calculation (Sri Lanka Standard Time)
  const { activeOngoingPeriod, upcomingNextPeriod } = useMemo(() => {
    if (!todayKey) return { activeOngoingPeriod: null, upcomingNextPeriod: null };
    const currentMins = getSriLankaMinutesOfDay();
    const currentSecs = getSriLankaDate().getSeconds();
    const totalCurrentSecs = currentMins * 60 + currentSecs;

    // 1. Find currently active period in standard school hours (07:40 AM - 01:30 PM)
    const currentPeriod = DEFAULT_PERIODS.find(
      (p) => totalCurrentSecs >= p.startMin * 60 && totalCurrentSecs < p.endMin * 60
    );

    let activeData = null;
    let nextData = null;

    if (currentPeriod) {
      const slot = teacherTodaySlots[currentPeriod.period] || null;
      const periodTotalSecs = (currentPeriod.endMin - currentPeriod.startMin) * 60;
      const elapsedSecs = Math.max(0, totalCurrentSecs - currentPeriod.startMin * 60);
      const remainingSecs = Math.max(0, currentPeriod.endMin * 60 - totalCurrentSecs);
      const remainingMins = Math.floor(remainingSecs / 60);
      const remainingSecStr = String(remainingSecs % 60).padStart(2, '0');
      const progressPercent = Math.min(100, Math.max(0, (elapsedSecs / periodTotalSecs) * 100));

      activeData = {
        period: currentPeriod,
        slot,
        remainingMins,
        remainingSecs,
        remainingSecStr,
        progressPercent,
      };
    }

    // 2. Find next upcoming period
    const nextPeriod = DEFAULT_PERIODS.find((p) => p.startMin * 60 > totalCurrentSecs);
    if (nextPeriod) {
      const slot = teacherTodaySlots[nextPeriod.period] || null;
      const startsInSecs = Math.max(0, nextPeriod.startMin * 60 - totalCurrentSecs);
      const startsInMins = Math.floor(startsInSecs / 60);
      const startsInSecStr = String(startsInSecs % 60).padStart(2, '0');

      nextData = {
        period: nextPeriod,
        slot,
        startsInMins,
        startsInSecStr,
      };
    }

    return {
      activeOngoingPeriod: activeData,
      upcomingNextPeriod: nextData,
    };
  }, [todayKey, teacherTodaySlots, currentSecTick]);

  const [currentLiveTimeStr, setCurrentLiveTimeStr] = useState<string>(() =>
    formatSriLankaTime(null, true)
  );

  // Live Clock locked to Sri Lanka Standard Time (Asia/Colombo) - updates every 1s (second-by-second)
  useEffect(() => {
    const updateTime = () => {
      setCurrentLiveTimeStr(formatSriLankaTime(null, true));
      setCurrentTime(formatSriLankaDateTime(null, isSi ? 'si' : 'en', true, true));
      setCurrentSecTick(Date.now());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [isSi]);

  // Automated Period Notification Trigger (Chime + Toast + Native Notification)
  useEffect(() => {
    if (!periodAlertsEnabled || !activeOngoingPeriod || !activeOngoingPeriod.slot) return;

    const currentPeriodNum = activeOngoingPeriod.period.period;
    const todayStr = getSriLankaDateString();
    const sessionKey = `pirivena_teacher_notified_${todayStr}_p${currentPeriodNum}_${activeOngoingPeriod.slot.classId}`;

    if (lastNotifiedPeriodRef.current === currentPeriodNum || sessionStorage.getItem(sessionKey)) {
      lastNotifiedPeriodRef.current = currentPeriodNum;
      return;
    }

    lastNotifiedPeriodRef.current = currentPeriodNum;
    try {
      sessionStorage.setItem(sessionKey, 'true');
    } catch (e) {}

    const msg = isSi
      ? `🔔 ${currentPeriodNum} වන කාලච්ඡේදය ආරම්භ විය: ${activeOngoingPeriod.slot.subjectName} (${activeOngoingPeriod.slot.className})`
      : `🔔 Period ${currentPeriodNum} Started: ${activeOngoingPeriod.slot.subjectName} (${activeOngoingPeriod.slot.className})`;

    toast.info(msg);

    // Native Capacitor Local Notification with deduplication
    notificationService.scheduleNotification({
      stableKey: `teacher_period_${currentPeriodNum}_${activeOngoingPeriod.slot.classId}_${todayStr}`,
      title: 'ශ්‍රී සුමන පිරිවෙන් කාලසටහන',
      body: msg,
      sound: true,
    });
  }, [periodAlertsEnabled, activeOngoingPeriod, isSi, toast]);

  // Toggle Notification Reminders
  const handleTogglePeriodNotifications = async () => {
    triggerHaptic('medium');
    const nextState = !periodAlertsEnabled;
    setPeriodAlertsEnabled(nextState);

    try {
      localStorage.setItem('pirivena_period_notifications', nextState ? 'true' : 'false');
    } catch (e) {}

    if (nextState) {
      playNotificationSound();
      toast.success(
        isSi
          ? '✓ කාලච්ඡේද දැනුම්දීම් සක්‍රීය විය! සෑම කාලච්ඡේදයකදීම ශබ්දයක් සහ පණිවිඩයක් ලැබෙනු ඇත.'
          : '✓ Period alerts enabled! You will be notified with a chime when periods start.'
      );

      // Request runtime notification permission
      await notificationService.requestPermission();
    } else {
      toast.info(isSi ? '🔕 කාලච්ඡේද දැනුම්දීම් අක්‍රිය කරන ලදී.' : '🔕 Period alerts muted.');
    }
  };

  // Dashboard Live Timetable Visibility Window: 07:30 AM to 01:30 PM on Weekdays (Monday-Friday)
  const isDashboardTimetableVisible = useMemo(() => {
    if (!todayKey) return false;
    const currentMins = getSriLankaMinutesOfDay();
    // 07:30 AM = 450 minutes from midnight
    // 01:30 PM = 810 minutes from midnight
    return currentMins >= 450 && currentMins <= 810;
  }, [todayKey, currentSecTick]);

  const monkStudentsCount = assignedStudents.filter((s) => s.monkStatus === 'monk').length;
  const layStudentsCount = assignedStudents.filter((s) => s.monkStatus === 'lay').length;
  const publishedExamsCount = assignedExams.filter((e) => e.published).length;
  const todayAssignedCount = Object.keys(teacherTodaySlots).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-4 sm:space-y-6 animate-fade-in pb-10 select-none"
    >
      {/* ========================================================= */}
      {/* 📱 1. NATIVE MOBILE APP FACULTY HEADER CARD               */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2e0e04] via-[#3b1507] to-[#1f0902] text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-amber-500/40">
        {/* Background Monastic Watermark Insignia */}
        <div className="absolute right-2 -bottom-3 opacity-15 pointer-events-none select-none">
          <span className="text-7xl sm:text-9xl text-amber-400 font-serif">
            {user?.monkStatus === 'monk' ? '🪷' : '☸'}
          </span>
        </div>

        <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
          {/* Top Row: Avatar & Profile Info */}
          <div className="flex items-center sm:items-start gap-3.5 sm:gap-5">
            {/* Faculty Photo Frame with Golden Halo */}
            <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-2xl bg-[#1a0601] p-1 shadow-xl shrink-0 border-2 sm:border-3 border-amber-400/90 flex items-center justify-center overflow-hidden relative">
              <div className="w-full h-full rounded-xl bg-[#200902] flex items-center justify-center overflow-hidden font-serif font-bold text-2xl sm:text-4xl text-amber-300">
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

            {/* Main Faculty Info */}
            <div className="flex-1 min-w-0 text-left space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] sm:text-[10px] shadow-inner truncate ${
                    user?.monkStatus === 'monk'
                      ? 'bg-amber-950/80 border border-amber-500/60 text-amber-300'
                      : 'bg-amber-950/60 border border-amber-500/50 text-amber-200'
                  }`}
                >
                  <span>{user?.monkStatus === 'monk' ? '🪷' : '🎓'}</span>
                  <span>
                    {user?.monkStatus === 'monk'
                      ? 'පූජ්‍ය ආචාර්ය මණ්ඩලය'
                      : 'ගිහි ආචාර්ය මණ්ඩලය'}
                  </span>
                </span>

                <span className="px-2 py-0.5 rounded-full bg-black/40 border border-amber-600/40 text-amber-200 text-[9px] font-mono font-bold">
                  {user?.customId && !user.customId.startsWith('usr-')
                    ? user.customId
                    : user?.indexNumber && !user.indexNumber.startsWith('usr-')
                      ? user.indexNumber
                      : 'TCH-2026-001'}
                </span>
              </div>

              <h1 className="text-base sm:text-2xl font-serif font-black text-white tracking-tight break-words truncate leading-tight">
                {user?.monkStatus === 'monk' && user?.monkName
                  ? user.monkName
                  : user?.name || user?.monkName || 'ආචාර්යතුමා'}
              </h1>

              <p className="text-amber-100/90 text-[11px] sm:text-xs font-semibold leading-tight truncate">
                {user?.qualification ||
                  (user as any)?.qualifications ||
                  (user?.monkStatus === 'monk'
                    ? 'රාජකීය පණ්ඩිත, බෞද්ධ හා පාලි විශ්වවිද්‍යාලය'
                    : 'ගෞරව ශාස්ත්‍රවේදී උපාධිය (BA Hons)')}
              </p>
            </div>
          </div>

          {/* Quick Timetable & Live Clock Bar */}
          <div className="pt-2.5 border-t border-amber-600/30 flex items-center justify-between gap-2 text-xs flex-wrap">
            {currentTime ? (
              <span className="text-[10px] sm:text-[11px] font-medium text-amber-200/80 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400 shrink-0 animate-icon-spin-slow" />
                <span>{currentTime}</span>
              </span>
            ) : <div />}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                if (onOpenTimetable) onOpenTimetable();
                else handleTabNavigate('timetable');
              }}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-[11px] sm:text-xs shadow-md transition cursor-pointer active:scale-95 ml-auto group"
            >
              <Calendar className="w-3.5 h-3.5 text-stone-950 animate-icon-bounce group-hover:rotate-12 transition-transform" />
              <span>මගේ කාලසටහන (Timetable)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🔔 2. LIVE COUNTDOWN CARDS (VISIBLE: 07:30 AM - 01:25 PM)  */}
      {/* ========================================================= */}
      {isDashboardTimetableVisible && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* Widget Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <span className="inline-block animate-icon-pulse-glow">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white leading-tight">
                  {isSi ? 'සජීවී කාලච්ඡේද සහ ඊළඟ පන්තිය' : 'Live Class & Next Upcoming'}
                </h3>
                {todayKey && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 font-bold text-[10px] border border-amber-200 dark:border-amber-800">
                    {DAYS.find((d) => d.id === todayKey)?.icon} {DAYS.find((d) => d.id === todayKey)?.labelSi}
                  </span>
                )}
                {currentLiveTimeStr && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/5 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-stone-900 dark:text-amber-300 text-[10px] font-mono font-black shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{currentLiveTimeStr}</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isSi ? 'ශ්‍රී ලංකා සම්මත වේලාවට අනුව සජීවීව ක්‍රියාත්මක වේ' : 'Live synchronized to Sri Lanka Standard Time'}
              </p>
            </div>
          </div>

          {/* Interactive Notification Bell Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePeriodNotifications}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                periodAlertsEnabled
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 border-amber-400 shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-stone-700 hover:bg-slate-200'
              }`}
              title="Toggle automatic period chime notifications"
            >
              {periodAlertsEnabled ? (
                <BellRing className="w-3.5 h-3.5 text-stone-950 animate-icon-bell" />
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
              onClick={() => {
                triggerHaptic('light');
                if (onOpenTimetable) onOpenTimetable();
                else handleTabNavigate('timetable');
              }}
              className="px-2.5 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-stone-800 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-stone-700 text-xs font-bold transition cursor-pointer active:scale-95 flex items-center gap-1 group"
            >
              <span>{isSi ? 'කාලසටහන' : 'Timetable'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Current Active Class & Next Upcoming Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* ========================================================= */}
          {/* 🔴 CARD 1: CURRENT ACTIVE CLASS (දැන් පැවැත්වෙන පන්තිය)    */}
          {/* ========================================================= */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-50/90 via-emerald-50/40 to-white dark:from-[#2e1808]/70 dark:via-stone-900 dark:to-stone-900 border-2 border-amber-500/80 dark:border-amber-600/80 shadow-md flex flex-col justify-between space-y-3 relative overflow-hidden">
            {/* Top Indicator */}
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>{isSi ? 'සජීවීව දැන් (NOW)' : 'ACTIVE NOW'}</span>
              </span>

              {activeOngoingPeriod && (
                <span className="font-mono text-xs font-bold text-amber-950 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-xl border border-amber-300 dark:border-amber-800">
                  Period {activeOngoingPeriod.period.period} ({activeOngoingPeriod.period.startTime} - {activeOngoingPeriod.period.endTime})
                </span>
              )}
            </div>

            {/* Main Class Info */}
            {activeOngoingPeriod ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">
                    {activeOngoingPeriod.slot
                      ? getSubjectIcon(activeOngoingPeriod.slot.subjectName || '')
                      : '☕'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                      {activeOngoingPeriod.slot
                        ? activeOngoingPeriod.slot.subjectName
                        : isSi
                          ? 'නිදහස් අධ්‍යයන කාලය'
                          : 'Free Preparation Period'}
                    </h4>
                    <p className="text-xs text-amber-900 dark:text-amber-300 font-bold truncate">
                      {activeOngoingPeriod.slot
                        ? `🏫 ${activeOngoingPeriod.slot.className} ${activeOngoingPeriod.slot.room ? `• කාමරය ${activeOngoingPeriod.slot.room}` : ''}`
                        : isSi
                          ? 'විවේකය හෝ ලේඛන සූදානම් කිරීම'
                          : 'Free Slot / Resource Prep'}
                    </p>
                  </div>
                </div>

                {/* ⏳ LIVE ANIMATED COUNTDOWN TIMER & PROGRESS BAR */}
                <div className="pt-2 border-t border-amber-200/80 dark:border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-800 dark:text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-icon-bounce shrink-0" />
                      <span>{isSi ? 'අවසන් වීමට:' : 'Time Left:'}</span>
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 dark:bg-emerald-500/25 text-emerald-950 dark:text-emerald-200 border border-emerald-500/40 shadow-xs tracking-wider">
                        {activeOngoingPeriod.remainingMins}:{activeOngoingPeriod.remainingSecStr}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {Math.round(activeOngoingPeriod.progressPercent)}%
                    </span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-stone-800 overflow-hidden relative shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 transition-all duration-1000 ease-linear rounded-full shadow-xs"
                      style={{ width: `${activeOngoingPeriod.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-1 text-slate-500 dark:text-slate-400">
                <span className="text-2xl">☕</span>
                <p className="text-xs font-bold">
                  {isSi
                    ? 'මේ මොහොතේ කාලච්ඡේදයක් නොපැවැත්වේ (පාසල් වේලාවෙන් පිටත)'
                    : 'No active period in session at this moment'}
                </p>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* ⏭️ CARD 2: NEXT UPCOMING CLASS (ඊළඟට පැවැත්වෙන පන්තිය)    */}
          {/* ========================================================= */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-50/90 via-amber-50/30 to-white dark:from-stone-800/80 dark:via-stone-900 dark:to-stone-900 border border-slate-200 dark:border-stone-700 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden">
            {/* Top Indicator */}
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                <span>⏭️</span>
                <span>{isSi ? 'ඊළඟට (NEXT)' : 'UPCOMING NEXT'}</span>
              </span>

              {upcomingNextPeriod && (
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-stone-800 px-2.5 py-0.5 rounded-xl border border-slate-200 dark:border-stone-700">
                  Period {upcomingNextPeriod.period.period} ({upcomingNextPeriod.period.startTime})
                </span>
              )}
            </div>

            {/* Main Next Class Info */}
            {upcomingNextPeriod ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">
                    {upcomingNextPeriod.slot
                      ? getSubjectIcon(upcomingNextPeriod.slot.subjectName || '')
                      : '☕'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight truncate">
                      {upcomingNextPeriod.slot
                        ? upcomingNextPeriod.slot.subjectName
                        : isSi
                          ? 'නිදහස් කාලච්ඡේදය'
                          : 'Free Period'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-bold truncate">
                      {upcomingNextPeriod.slot
                        ? `🏫 ${upcomingNextPeriod.slot.className} ${upcomingNextPeriod.slot.room ? `• කාමරය ${upcomingNextPeriod.slot.room}` : ''}`
                        : isSi
                          ? 'විවේක කාලය'
                          : 'Free Preparation'}
                    </p>
                  </div>
                </div>

                {/* ⏱️ COUNTDOWN TO START */}
                <div className="pt-2 border-t border-slate-200 dark:border-stone-800 flex items-center justify-between text-xs font-black text-amber-900 dark:text-amber-300">
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
                <span className="text-2xl">🎉</span>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {isSi
                    ? 'අද දවසේ සියලුම කාලච්ඡේද සාර්ථකව අවසන් කර ඇත!'
                    : 'All periods completed for today!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ========================================================= */}
      {/* ⚡ 3. ADMIN-STYLE VIBRANT 6-ACTION QUICK MODULES HUB       */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-stone-950 flex items-center justify-center font-bold text-xs shadow-xs">
              ⚡
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {isSi ? 'ප්‍රධාන මෙහෙයුම් මෙවලම් කට්ටලය (Core Management Hub)' : 'Core Management Hub'}
              </h2>
            </div>
          </div>
          <span className="text-[10px] text-amber-800 dark:text-amber-300 font-black px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 shadow-2xs">
            6 Direct Tools
          </span>
        </div>

        {/* 6-Grid Native Action Tiles (Admin Dashboard Pro Aesthetics) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Action 1: Create Exam */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              if (openCreateExamModal) openCreateExamModal();
              else handleTabNavigate('exams');
            }}
            className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-fuchsia-50/30 to-white dark:from-purple-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-purple-100/90 border border-purple-200/80 dark:border-purple-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 text-left group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
              <PlusCircle className="w-5 h-5 animate-icon-pulse-glow group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-xs text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight truncate">
                {isSi ? 'නව විභාගයක්' : 'New Exam'}
              </h4>
              <p className="text-[10px] text-purple-700/80 dark:text-purple-300/80 font-bold truncate">
                {isSi ? 'AI Vision / Manual' : 'AI / OCR Builder'}
              </p>
            </div>
          </button>

          {/* Action 2: Live Exam Monitoring */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              handleTabNavigate('monitoring');
            }}
            className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/90 via-pink-50/30 to-white dark:from-rose-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-rose-100/90 border border-rose-200/80 dark:border-rose-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 text-left group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
              <Activity className="w-5 h-5 animate-icon-heartbeat group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-xs text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors leading-tight truncate">
                {isSi ? 'විභාග අධීක්ෂණය' : 'Live Monitoring'}
              </h4>
              <p className="text-[10px] text-rose-700/80 dark:text-rose-300/80 font-bold truncate">
                {isSi ? 'ලකුණු & පිළිතුරු' : 'Marks & Submissions'}
              </p>
            </div>
          </button>

          {/* Action 3: Student Roster */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              handleTabNavigate('roster');
            }}
            className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/30 to-white dark:from-emerald-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-emerald-100/90 border border-emerald-200/80 dark:border-emerald-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 text-left group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
              <Users className="w-5 h-5 animate-icon-bounce group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight truncate">
                {isSi ? 'ශිෂ්‍ය නාමාවලිය' : 'Student Roster'}
              </h4>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-bold truncate">
                {assignedStudents.length} {isSi ? 'ලියාපදිංචි සිසුන්' : 'Students'}
              </p>
            </div>
          </button>

          {/* Action 4: Upload Material */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              openUploadMaterialModal();
            }}
            className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/30 to-white dark:from-blue-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-blue-100/90 border border-blue-200/80 dark:border-blue-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 text-left group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
              <Upload className="w-5 h-5 animate-icon-float group-hover:-translate-y-1 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
                {isSi ? 'නිබන්ධන Upload' : 'Upload Notes'}
              </h4>
              <p className="text-[10px] text-blue-700/80 dark:text-blue-300/80 font-bold truncate">
                {assignedMaterials.length} {isSi ? 'ගොනු' : 'Files'}
              </p>
            </div>
          </button>

          {/* Action 5: Timetable */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              if (onOpenTimetable) onOpenTimetable();
              else handleTabNavigate('timetable');
            }}
            className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/30 to-white dark:from-amber-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-amber-100/90 border border-amber-200/80 dark:border-amber-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 text-left group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
              <Calendar className="w-5 h-5 animate-icon-bounce group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-xs text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight truncate">
                {isSi ? 'කාලසටහන' : 'Timetable'}
              </h4>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-bold truncate">
                {isSi ? 'සතිපතා කාලසටහන' : 'Weekly Schedule'}
              </p>
            </div>
          </button>

          {/* Action 6: Settings */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              handleTabNavigate('settings');
            }}
            className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-slate-50/90 via-stone-50/40 to-white dark:from-slate-900/40 dark:via-stone-900 dark:to-stone-900 hover:from-slate-100/90 border border-slate-200/80 dark:border-slate-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 text-left group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border border-slate-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
              <Settings className="w-5 h-5 animate-icon-spin-slow group-hover:scale-125 transition-transform duration-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-xs text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors leading-tight truncate">
                {isSi ? 'ගිණුම් සැකසුම්' : 'Settings & Info'}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                {isSi ? 'බලපත්‍ර & App Specs' : 'Scope & App Specs'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📊 4. 4-TILE BENTO KPI METRICS GRID                        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Card 1: Students Roster */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => {
            triggerHaptic('light');
            handleTabNavigate('roster');
          }}
          className="bg-gradient-to-br from-blue-50/80 via-sky-50/30 to-white dark:from-[#151e2e]/60 dark:via-stone-900 dark:to-stone-900 border border-blue-200/80 dark:border-blue-900/60 p-3.5 sm:p-5 rounded-3xl shadow-xs space-y-2 relative overflow-hidden group cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-900/80 dark:text-blue-300">
              {isSi ? 'සිසුන්' : 'Students'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:rotate-6 transition-transform border border-blue-500/30 shadow-2xs flex items-center justify-center">
              <Users className="w-4.5 h-4.5 animate-icon-bounce group-hover:scale-125 transition-transform" />
            </div>
          </div>

          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-white">
              {assignedStudents.length}
            </p>
            <span className="text-[10px] sm:text-xs font-bold text-blue-700/70 dark:text-blue-300/70">
              {isSi ? 'ලියාපදිංචි' : 'Active'}
            </span>
          </div>

          {/* Monk / Lay Visual Ratio Pill */}
          {assignedStudents.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-blue-200/60 dark:border-blue-900/40">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-blue-900 dark:text-blue-200">
                <span>🪷 {monkStudentsCount}</span>
                <span>👤 {layStudentsCount}</span>
              </div>
              <div className="w-full bg-blue-200/60 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-amber-600 dark:bg-amber-500 h-full transition-all"
                  style={{
                    width: `${(monkStudentsCount / assignedStudents.length) * 100}%`,
                  }}
                />
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full transition-all"
                  style={{
                    width: `${(layStudentsCount / assignedStudents.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Card 2: Assigned Classes (OPENS POPUP MODAL) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => {
            triggerHaptic('medium');
            setShowClassesModal(true);
          }}
          className="bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-white dark:from-emerald-950/40 dark:via-stone-900 dark:to-stone-900 border border-emerald-200/80 dark:border-emerald-900/60 p-3.5 sm:p-5 rounded-3xl shadow-xs space-y-2 relative overflow-hidden group cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-900/80 dark:text-emerald-300">
              {isSi ? 'පවරන ලද පන්ති' : 'Classes'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-transform border border-emerald-500/30 shadow-2xs flex items-center justify-center">
              <School className="w-4.5 h-4.5 animate-icon-float group-hover:scale-125 transition-transform" />
            </div>
          </div>

          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-white">
              {assignedClasses.length}
            </p>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700/70 dark:text-emerald-300/70">
              {isSi ? 'අංශ' : 'Rooms'}
            </span>
          </div>

          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-between pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
            <span>{isSi ? 'විස්තර බලන්න' : 'View Classes'}</span>
            <span className="text-xs group-hover:translate-x-1 transition-transform">🔍</span>
          </p>
        </motion.div>

        {/* Card 3: Teaching Subjects (OPENS POPUP MODAL) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => {
            triggerHaptic('medium');
            setShowSubjectsModal(true);
          }}
          className="bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-white dark:from-[#2e0e04]/50 dark:via-stone-900 dark:to-stone-900 border border-amber-200/90 dark:border-amber-900/60 p-3.5 sm:p-5 rounded-3xl shadow-xs space-y-2 relative overflow-hidden group cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 transition active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-900/80 dark:text-amber-300">
              {isSi ? 'උගන්වන විෂයයන්' : 'Subjects'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 group-hover:scale-110 group-hover:rotate-6 transition-transform border border-amber-500/30 shadow-2xs flex items-center justify-center">
              <BookOpen className="w-4.5 h-4.5 animate-icon-float group-hover:scale-125 transition-transform" />
            </div>
          </div>

          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-white">
              {assignedSubjects.length}
            </p>
            <span className="text-[10px] sm:text-xs font-bold text-amber-800/70 dark:text-amber-300/70">
              {isSi ? 'විෂයමාලා' : 'Curriculum'}
            </span>
          </div>

          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold flex items-center justify-between pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
            <span>{isSi ? 'විස්තර බලන්න' : 'View Subjects'}</span>
            <span className="text-xs group-hover:translate-x-1 transition-transform">🔍</span>
          </p>
        </motion.div>

        {/* Card 4: Online Exams */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          onClick={() => {
            triggerHaptic('light');
            handleTabNavigate('exams');
          }}
          className="bg-gradient-to-br from-purple-50/80 via-fuchsia-50/30 to-white dark:from-purple-950/40 dark:via-stone-900 dark:to-stone-900 border border-purple-200/90 dark:border-purple-900/60 p-3.5 sm:p-5 rounded-3xl shadow-xs space-y-2 relative overflow-hidden group cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-900/80 dark:text-purple-300">
              {isSi ? 'විභාග' : 'Exams'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-transform border border-purple-500/30 shadow-2xs flex items-center justify-center">
              <Award className="w-4.5 h-4.5 animate-icon-sparkle group-hover:scale-125 transition-transform" />
            </div>
          </div>

          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-white">
              {assignedExams.length}
            </p>
            <span className="text-[10px] sm:text-xs font-bold text-purple-800/70 dark:text-purple-300/70">
              {isSi ? `(සක්‍රීය ${publishedExamsCount})` : `(${publishedExamsCount} live)`}
            </span>
          </div>

          <p className="text-[10px] text-purple-700 dark:text-purple-400 font-bold flex items-center justify-between pt-1 border-t border-purple-200/60 dark:border-purple-900/40">
            <span>{isSi ? 'ප්‍රශ්න පත්‍ර' : 'Exam Papers'}</span>
            <span className="text-xs group-hover:translate-x-1 transition-transform">→</span>
          </p>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* 📂 5. STUDY MATERIALS VAULT SNAPSHOT                      */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white">
                {isSi ? 'අධ්‍යයන නිබන්ධන සුරක්ෂිතාගාරය' : 'Study Materials Vault'}
              </h3>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800">
            {assignedMaterials.length} ක්
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200/70 dark:border-stone-700 flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              📄 PDF
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-white bg-white dark:bg-stone-700 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-stone-600 text-xs">
              {assignedMaterials.filter((m) => m.type === 'pdf').length}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200/70 dark:border-stone-700 flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              📝 Notes
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-white bg-white dark:bg-stone-700 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-stone-600 text-xs">
              {assignedMaterials.filter((m) => m.type === 'notes').length}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200/70 dark:border-stone-700 flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              📜 Papers
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-white bg-white dark:bg-stone-700 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-stone-600 text-xs">
              {assignedMaterials.filter((m) => m.type === 'past_paper').length}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200/70 dark:border-stone-700 flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              🎧 Audio
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-white bg-white dark:bg-stone-700 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-stone-600 text-xs">
              {assignedMaterials.filter((m) => m.type === 'audio' || m.type === 'video').length}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-stone-800 flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('medium');
              openUploadMaterialModal();
            }}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>{isSi ? 'නව නිබන්ධනයක් Upload' : 'Upload Material'}</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              handleTabNavigate('materials');
            }}
            className="px-4 py-2.5 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-800 dark:text-white font-bold text-xs rounded-2xl transition cursor-pointer active:scale-95"
          >
            <span>{isSi ? 'සියල්ල' : 'View All'} →</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🏫 POPUP MODAL 1: ASSIGNED CLASSES DETAILS (APK OPTIMIZED) */}
      {/* ========================================================= */}
      {/* 🏫 POPUP MODAL 1: ASSIGNED CLASSES DETAILS                */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showClassesModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowClassesModal(false);
            }}
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-stone-900 border border-emerald-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-5 sm:p-6 max-h-[90vh] flex flex-col my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-stone-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                      {isSi ? 'පවරන ලද පන්ති කාමර විස්තර' : 'Assigned Classes Details'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isSi ? 'පරිපාලක විසින් පවරා ඇති පන්ති කාමර සහ ශිෂ්‍ය නාමලේඛන' : 'Classrooms and student distribution'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowClassesModal(false)}
                  className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Classes List */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {assignedClasses.length > 0 ? (
                  assignedClasses.map((cls) => {
                    const classStudents = assignedStudents.filter(
                      (s) => s.classId === cls.id || s.classTeacherId === user?.id
                    );
                    const classMonks = classStudents.filter((s) => s.monkStatus === 'monk').length;
                    const classLays = classStudents.filter((s) => s.monkStatus === 'lay').length;

                    return (
                      <div
                        key={`modal-cls-${cls.id}`}
                        className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-stone-800/70 border border-emerald-200/80 dark:border-stone-700 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-200 dark:border-emerald-800">
                              {cls.code || cls.id}
                            </span>
                            <h4 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white mt-1">
                              🏫 {cls.name}
                            </h4>
                          </div>

                          <span className="text-sm font-serif font-bold text-slate-900 dark:text-white bg-white dark:bg-stone-700 px-3 py-1 rounded-xl border border-slate-200 dark:border-stone-600 shadow-2xs">
                            {classStudents.length} {isSi ? 'සිසුන්' : 'Students'}
                          </span>
                        </div>

                        {/* Monk / Lay Split */}
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-stone-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-stone-700">
                          <span>🪷 සාමණේර හිමිවරු: {classMonks}</span>
                          <span>👤 ගිහි සිසුන්: {classLays}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              setShowClassesModal(false);
                              setRosterClassFilter(cls.id);
                              handleTabNavigate('roster');
                            }}
                            className="px-3.5 py-2 bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 text-emerald-950 dark:text-emerald-200 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-800 transition cursor-pointer active:scale-95 flex items-center gap-1 min-h-[40px]"
                          >
                            <span>👥 {isSi ? 'ශිෂ්‍යයින් බලන්න' : 'View Students'}</span>
                          </button>

                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              setShowClassesModal(false);
                              setRosterClassFilter(cls.id);
                              handleTabNavigate('monitoring');
                            }}
                            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1 min-h-[40px]"
                          >
                            <span>📈 {isSi ? 'ලකුණු වාර්තා' : 'View Marks'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    {isSi ? 'පන්ති පවරා නොමැත.' : 'No classes assigned.'}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-stone-800 shrink-0">
                <button
                  onClick={() => setShowClassesModal(false)}
                  className="w-full py-3 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-800 dark:text-white font-bold text-xs rounded-2xl transition cursor-pointer active:scale-95 min-h-[44px]"
                >
                  {isSi ? 'වසන්න (Close)' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 📖 POPUP MODAL 2: TEACHING SUBJECTS DETAILS               */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showSubjectsModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSubjectsModal(false);
            }}
            className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-stone-900 border border-amber-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 p-5 sm:p-6 max-h-[90vh] flex flex-col my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-stone-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-500/30 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                      {isSi ? 'උගන්වන විෂයමාලා විස්තර' : 'Teaching Subjects Details'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isSi ? 'පරිපාලක විසින් පවරා ඇති විෂයමාලා සහ නිබන්ධන' : 'Assigned subject curriculum and materials'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSubjectsModal(false)}
                  className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subjects List */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {assignedSubjects.length > 0 ? (
                  assignedSubjects.map((sbj) => {
                    const subjectIcon = getSubjectIcon(sbj.name);
                    const subjectMaterialsCount = assignedMaterials.filter(
                      (m) => m.subjectId === sbj.id || (m as any)?.subject === sbj.name
                    ).length;

                    return (
                      <div
                        key={`modal-sbj-${sbj.id}`}
                        className="p-4 rounded-2xl bg-amber-50/50 dark:bg-stone-800/70 border border-amber-200/80 dark:border-stone-700 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{subjectIcon}</span>
                            <div>
                              <h4 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                                {sbj.name}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                {sbj.code || sbj.id}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                            {subjectMaterialsCount} {isSi ? 'නිබන්ධන' : 'Files'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-200/60 dark:border-stone-700">
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              setShowSubjectsModal(false);
                              if (openCreateExamModal) openCreateExamModal();
                              else handleTabNavigate('exams');
                            }}
                            className="px-3.5 py-2 bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 text-amber-950 dark:text-amber-200 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-800 transition cursor-pointer active:scale-95 flex items-center gap-1 min-h-[40px]"
                          >
                            <span>📝 {isSi ? 'විභාග සාදන්න' : 'Create Exam'}</span>
                          </button>

                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              setShowSubjectsModal(false);
                              handleTabNavigate('materials');
                            }}
                            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black rounded-xl shadow-xs transition cursor-pointer active:scale-95 flex items-center gap-1 min-h-[40px]"
                          >
                            <span>📂 {isSi ? 'නිබන්ධන බලන්න' : 'View Notes'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    {isSi ? 'විෂයයන් පවරා නොමැත.' : 'No subjects assigned.'}
                  </div>
                )}
              </div>

              {/* Close Button */}
              {/* Close Button */}
              <div className="pt-2 border-t border-slate-100 dark:border-stone-800 shrink-0">
                <button
                  onClick={() => setShowSubjectsModal(false)}
                  className="w-full py-3 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-800 dark:text-white font-bold text-xs rounded-2xl transition cursor-pointer active:scale-95 min-h-[44px]"
                >
                  {isSi ? 'වසන්න (Close)' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
