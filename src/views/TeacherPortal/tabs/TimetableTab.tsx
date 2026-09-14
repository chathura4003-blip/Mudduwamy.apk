import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  Printer,
  School,
  BookOpen,
  Layers,
  Sparkles,
  ChevronRight,
  Coffee,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Award,
  ArrowUpRight,
  ArrowLeft,
  Filter,
  Flame,
  Activity,
  Compass,
  BarChart2,
  BellRing,
  BellOff,
} from 'lucide-react';
import type { PirivenaClass, Subject, User, ClassTimetableSlot } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { useToast } from '../../../context/ToastContext';
import { triggerHaptic } from '../../../utils/haptics';
import { triggerUniversalPrint } from '../../../utils/printHelper';
import { playNotificationSound } from '../../../utils/soundHelper';
import { notificationService } from '../../../services/notificationService';
import { LiveSriLankaClock } from '../../../components/LiveSriLankaClock';
import { LivePeriodCountdown } from '../../../components/LivePeriodCountdown';

import {
  getSriLankaDate,
  getSriLankaDateString,
  getSriLankaDayKey,
  getSriLankaMinutesOfDay,
  formatSriLankaDateTime,
} from '../../../utils/sriLankaTime';

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

interface TimetableTabProps {
  user: User | null;
  classes?: PirivenaClass[];
  assignedClasses?: PirivenaClass[];
  assignedSubjects?: Subject[];
  onNavigate?: (tab: 'overview' | 'monitoring' | 'roster' | 'exams' | 'materials' | 'settings') => void;
}

const DAYS: { id: DayKey; labelSi: string; labelEn: string; shortSi: string; icon: string }[] = [
  { id: 'monday', labelSi: 'සඳුදා', labelEn: 'Monday', shortSi: 'සඳු', icon: '🌕' },
  { id: 'tuesday', labelSi: 'අඟහරුවාදා', labelEn: 'Tuesday', shortSi: 'අඟ', icon: '🔥' },
  { id: 'wednesday', labelSi: 'බදාදා', labelEn: 'Wednesday', shortSi: 'බදා', icon: '💧' },
  { id: 'thursday', labelSi: 'බ්‍රහස්පතින්දා', labelEn: 'Thursday', shortSi: 'බ්‍රහ', icon: '🌳' },
  { id: 'friday', labelSi: 'සිකුරාදා', labelEn: 'Friday', shortSi: 'සිකු', icon: '🪷' },
];

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

export interface TeacherSlotInfo {
  day: DayKey;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId?: string;
  subjectName?: string;
  classId: string;
  className: string;
  classCode?: string;
  room?: string;
}

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

export const TimetableTab: React.FC<TimetableTabProps> = ({
  user,
  classes = [],
  assignedClasses = [],
  assignedSubjects = [],
  onNavigate,
}) => {
  const { language } = useLanguage();
  const toast = useToast();
  const isSi = language === 'si';
  const [periodTick, setPeriodTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) {
        setPeriodTick(Date.now());
      }
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // 🔔 Timetable Period Reminder Notifications State
  const [periodAlertsEnabled, setPeriodAlertsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pirivena_period_notifications') === 'true';
    } catch (e) {
      return false;
    }
  });

  const lastNotifiedPeriodRef = React.useRef<number | null>(null);

  const targetClasses = classes.length > 0 ? classes : assignedClasses;

  // Determine current day of week in Sri Lanka Standard Time (Asia/Colombo)
  const todayKey: DayKey | null = getSriLankaDayKey();
  const initialDay: DayKey | 'all' = todayKey || 'monday';
  const [activeDay, setActiveDay] = useState<DayKey | 'all'>(initialDay);

  // Aggregate all teaching slots for this teacher across all classes
  const teacherSlots = useMemo(() => {
    if (!user) return [];
    const teacherId = user.id;
    const teacherCustomId = user.customId;
    const teacherName = user.name;
    const teacherMonkName = user.monkName;

    const aggregated: TeacherSlotInfo[] = [];

    targetClasses.forEach((cls) => {
      let slots: ClassTimetableSlot[] = [];
      if (cls.timetable && Array.isArray(cls.timetable) && cls.timetable.length > 0) {
        slots = cls.timetable;
      } else {
        try {
          const cached = localStorage.getItem(`pirivena_timetable_${cls.id}`);
          if (cached) {
            slots = JSON.parse(cached);
          }
        } catch (e) {}
      }

      slots.forEach((s) => {
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

          aggregated.push({
            day: s.day as DayKey,
            periodNumber: s.periodNumber,
            startTime: dp.startTime,
            endTime: dp.endTime,
            subjectId: s.subjectId,
            subjectName: s.subjectName,
            classId: cls.id,
            className: cls.nameSinhala || cls.name,
            classCode: cls.code,
            room: cls.roomNumber,
          });
        }
      });
    });

    return aggregated;
  }, [user, targetClasses]);

  const filteredTeacherSlots = teacherSlots;
  const totalTeachingSlots = filteredTeacherSlots.length;
  const uniqueClassesCount = new Set(filteredTeacherSlots.map((s) => s.classId)).size;
  const totalFreeSlots = Math.max(0, 40 - totalTeachingSlots);

  // Active Ongoing Period Calculation (updates every second)
  const activeOngoingPeriod = useMemo(() => {
    if (!todayKey) return null;
    const currentMins = getSriLankaMinutesOfDay();
    const currentSecs = getSriLankaDate().getSeconds();
    const totalCurrentSecs = currentMins * 60 + currentSecs;

    const period = DEFAULT_PERIODS.find(
      (p) => totalCurrentSecs >= p.startMin * 60 && totalCurrentSecs < p.endMin * 60
    );
    if (!period) return null;

    const slot = filteredTeacherSlots.find(
      (s) => s.day === todayKey && s.periodNumber === period.period
    );

    const periodTotalSecs = (period.endMin - period.startMin) * 60;
    const elapsedSecs = Math.max(0, totalCurrentSecs - period.startMin * 60);
    const remainingSecs = Math.max(0, period.endMin * 60 - totalCurrentSecs);
    const remainingMins = Math.floor(remainingSecs / 60);
    const remainingSecStr = String(remainingSecs % 60).padStart(2, '0');
    const progressPercent = Math.min(100, Math.max(0, (elapsedSecs / periodTotalSecs) * 100));

    return {
      period,
      slot,
      remainingMins,
      remainingSecs,
      remainingSecStr,
      progressPercent,
    };
  }, [todayKey, filteredTeacherSlots, periodTick]);

  const getSlot = (day: DayKey, period: number): TeacherSlotInfo | undefined => {
    return filteredTeacherSlots.find((s) => s.day === day && s.periodNumber === period);
  };

  const currentPeriodNum = activeOngoingPeriod?.period?.period;

  // Automated Period Notification Trigger (Chime + Toast + Native Notification)
  useEffect(() => {
    if (!periodAlertsEnabled || !activeOngoingPeriod || !activeOngoingPeriod.slot || !currentPeriodNum) return;

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

    notificationService.scheduleNotification({
      stableKey: `teacher_period_${currentPeriodNum}_${activeOngoingPeriod.slot.classId}_${todayStr}`,
      title: 'ශ්‍රී සුමන පිරිවෙන් කාලසටහන',
      body: msg,
      sound: true,
    });
  }, [periodAlertsEnabled, currentPeriodNum, activeOngoingPeriod?.slot?.classId, isSi, toast]);

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

      await notificationService.requestPermission();
    } else {
      toast.info(isSi ? '🔕 කාලච්ඡේද දැනුම්දීම් අක්‍රිය කරන ලදී.' : '🔕 Period alerts muted.');
    }
  };

  const handlePrint = () => {
    triggerUniversalPrint('ආචාර්ය_කාලසටහන_ශ්‍රී_සුමන_මහා_පිරිවෙන');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-5 sm:space-y-6 pb-12 animate-fade-in select-none"
    >
      {/* ========================================================= */}
      {/* 🌟 1. TIMETABLE HERO BAR (DAY • TIME • PRINT • NOTIF)     */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2e0e04] via-[#3b1507] to-[#1f0902] text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
            📅
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-base sm:text-lg text-white">
                {isSi ? 'අධ්‍යයන කාලසටහන' : 'Timetable'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold text-[10px]">
                {DAYS.find((d) => d.id === (todayKey || 'monday'))?.icon}{' '}
                {isSi
                  ? DAYS.find((d) => d.id === (todayKey || 'monday'))?.labelSi
                  : DAYS.find((d) => d.id === (todayKey || 'monday'))?.labelEn}
              </span>
            </div>
            <p className="text-amber-200/90 text-xs font-mono font-semibold flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <LiveSriLankaClock format="full" isSi={isSi} />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleTogglePeriodNotifications}
            className={`px-3 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
              periodAlertsEnabled
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 border-amber-400 shadow-xs font-black'
                : 'bg-black/30 text-amber-200 border-amber-500/40 hover:bg-black/50'
            }`}
            title="Toggle automatic period chime notifications"
          >
            {periodAlertsEnabled ? (
              <BellRing className="w-3.5 h-3.5 text-stone-950 animate-icon-bell" />
            ) : (
              <BellOff className="w-3.5 h-3.5 text-amber-300/60" />
            )}
            <span>
              {periodAlertsEnabled
                ? isSi
                  ? '🔔 දැනුම්දීම් ON'
                  : '🔔 Alerts ON'
                : isSi
                  ? '🔕 දැනුම්දීම් Off'
                  : '🔕 Enable Alerts'}
            </span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs shadow-md transition cursor-pointer active:scale-95 shrink-0"
          >
            <Printer className="w-4 h-4 text-stone-950" />
            <span>{isSi ? 'මුද්‍රණය (Print / PDF)' : 'Print / PDF'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🟢 2. LIVE CURRENT ONGOING PERIOD BANNER                   */}
      {/* ========================================================= */}
      {activeOngoingPeriod && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border-2 border-amber-500/60 dark:border-amber-600/60 rounded-3xl p-4 sm:p-5 shadow-md flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xl shrink-0 shadow-sm animate-pulse">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>{isSi ? 'දැන් පැවැත්වෙන කාලච්ඡේදය' : 'CURRENT ACTIVE PERIOD'}</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-900 dark:text-amber-300">
                    Period {activeOngoingPeriod.period.period} ({activeOngoingPeriod.period.startTime} -{' '}
                    {activeOngoingPeriod.period.endTime})
                  </span>
                </div>
                <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white mt-0.5">
                  {activeOngoingPeriod.slot ? (
                    <span>
                      {getSubjectIcon(activeOngoingPeriod.slot.subjectName || '')}{' '}
                      {activeOngoingPeriod.slot.subjectName} • 🏫 {activeOngoingPeriod.slot.className}
                    </span>
                  ) : (
                    <span>☕ {isSi ? 'අධ්‍යයන විවේක කාලච්ඡේදය (Free Period)' : 'Free Preparation Slot'}</span>
                  )}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
              {/* Live Countdown Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/25 border border-emerald-500/40 text-emerald-950 dark:text-emerald-200 text-xs font-black shadow-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-icon-bounce shrink-0" />
                <span>{isSi ? 'ඉතිරි:' : 'Left:'}</span>
                <LivePeriodCountdown
                  startMin={activeOngoingPeriod.period.startMin}
                  endMin={activeOngoingPeriod.period.endMin}
                  mode="remaining"
                />
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300">
                  (
                  <LivePeriodCountdown
                    startMin={activeOngoingPeriod.period.startMin}
                    endMin={activeOngoingPeriod.period.endMin}
                    mode="remaining"
                    variant="percent"
                  />
                  )
                </span>
              </div>

              {activeOngoingPeriod.slot && onNavigate && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onNavigate('monitoring');
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  <span>{isSi ? 'විභාග / ලකුණු අධීක්ෂණය' : 'Class Monitoring'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Animated Progress Bar */}
          <LivePeriodCountdown
            startMin={activeOngoingPeriod.period.startMin}
            endMin={activeOngoingPeriod.period.endMin}
            mode="remaining"
            variant="bar"
            barContainerClassName="w-full h-2 rounded-full bg-amber-500/20 dark:bg-stone-800 overflow-hidden relative shadow-inner"
            barClassName="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 transition-all duration-1000 ease-linear rounded-full shadow-xs"
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* 📊 3. BENTO SUMMARY METRICS HUB                           */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* Metric 1: Teaching Periods */}
        <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/30 to-white dark:from-[#2e0e04]/50 dark:via-stone-900 dark:to-stone-900 border border-amber-200/90 dark:border-amber-900/60 p-4 rounded-3xl space-y-1 shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-900/80 dark:text-amber-300">
              {isSi ? 'සතියේ කාලච්ඡේද' : 'Teaching Periods'}
            </span>
            <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shadow-2xs group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 animate-icon-spin-slow" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-amber-950 dark:text-amber-100">
            {totalTeachingSlots}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">/ 40</span>
          </p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
            {isSi ? 'සක්‍රීය ඉගැන්වීම්' : 'Assigned Slots'}
          </span>
        </div>

        {/* Metric 2: Classes Covered */}
        <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/30 to-white dark:from-[#2e0e04]/50 dark:via-stone-900 dark:to-stone-900 border border-amber-200/90 dark:border-amber-900/60 p-4 rounded-3xl space-y-1 shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-900/80 dark:text-amber-300">
              {isSi ? 'ආවරණය වන පන්ති' : 'Classes Covered'}
            </span>
            <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shadow-2xs group-hover:scale-110 transition-transform">
              <School className="w-4 h-4 animate-icon-float" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-amber-950 dark:text-amber-100">
            {uniqueClassesCount || targetClasses.length}
          </p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
            {isSi ? 'පන්ති කාමර' : 'Classrooms'}
          </span>
        </div>

        {/* Metric 3: Subjects */}
        <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/30 to-white dark:from-[#2e0e04]/50 dark:via-stone-900 dark:to-stone-900 border border-amber-200/90 dark:border-amber-900/60 p-4 rounded-3xl space-y-1 shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-900/80 dark:text-amber-300">
              {isSi ? 'උගන්වන විෂයයන්' : 'Subjects'}
            </span>
            <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shadow-2xs group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4 animate-icon-float" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-amber-950 dark:text-amber-100">
            {assignedSubjects.length || 3}
          </p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
            {isSi ? 'විෂයමාලා' : 'Curriculum'}
          </span>
        </div>

        {/* Metric 4: Free Slots */}
        <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/30 to-white dark:from-[#2e0e04]/50 dark:via-stone-900 dark:to-stone-900 border border-amber-200/90 dark:border-amber-900/60 p-4 rounded-3xl space-y-1 shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-900/80 dark:text-amber-300">
              {isSi ? 'විවේක කාලච්ඡේද' : 'Free Periods'}
            </span>
            <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shadow-2xs group-hover:scale-110 transition-transform">
              <Coffee className="w-4 h-4 animate-icon-bounce" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-black text-amber-950 dark:text-amber-100">
            {totalFreeSlots}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
            {isSi ? 'අධ්‍යයන විවේකය' : 'Free Slots'}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📅 4. INTERACTIVE DAY SELECTOR TABS                        */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-stone-900 border border-amber-200/80 dark:border-stone-800 rounded-3xl p-2.5 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {DAYS.map((d) => {
          const daySlotsCount = filteredTeacherSlots.filter((s) => s.day === d.id).length;
          const isSelected = activeDay === d.id;
          const isToday = todayKey === d.id;

          return (
            <button
              key={d.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveDay(d.id);
              }}
              className={`flex-1 min-w-[105px] py-2.5 px-3 rounded-2xl font-bold text-xs transition flex flex-col items-center gap-0.5 cursor-pointer active:scale-95 relative ${
                isSelected
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-stone-950 shadow-md font-black'
                  : 'bg-slate-50 dark:bg-stone-800/60 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-stone-800'
              }`}
            >
              {isToday && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
              <span className="flex items-center gap-1">
                <span>{d.icon}</span>
                <span>{isSi ? d.labelSi : d.labelEn}</span>
              </span>
              <span
                className={`text-[9px] px-2 py-0.2 rounded-full font-mono font-bold ${
                  isSelected
                    ? 'bg-stone-950/20 text-stone-950'
                    : 'bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {daySlotsCount} {isSi ? 'කාලච්ඡේද' : 'slots'}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveDay('all');
          }}
          className={`flex-1 min-w-[125px] py-2.5 px-3 rounded-2xl font-bold text-xs transition flex flex-col items-center gap-0.5 cursor-pointer active:scale-95 ${
            activeDay === 'all'
              ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-stone-950 shadow-md font-black'
              : 'bg-slate-50 dark:bg-stone-800/60 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-stone-800'
          }`}
        >
          <span className="flex items-center gap-1">
            <span>🌐</span>
            <span>{isSi ? 'සම්පූර්ණ සතිය (Master)' : 'Full Week'}</span>
          </span>
          <span
            className={`text-[9px] px-2 py-0.2 rounded-full font-mono font-bold ${
              activeDay === 'all'
                ? 'bg-stone-950/20 text-stone-950'
                : 'bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {totalTeachingSlots} slots
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 📋 6. TIMETABLE VIEW (SINGLE DAY TIMELINE OR MASTER GRID)  */}
      {/* ========================================================= */}
      {activeDay !== 'all' ? (
        /* SINGLE DAY TIMELINE CARDS */
        <div className="bg-white dark:bg-stone-900 border border-amber-200/80 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-stone-800 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-base text-slate-900 dark:text-white">
                  {isSi
                    ? `${DAYS.find((d) => d.id === activeDay)?.labelSi} දින කාලසටහන`
                    : `${DAYS.find((d) => d.id === activeDay)?.labelEn} Schedule`}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isSi ? 'දෛනික කාලච්ඡේද 8 ක ඉගැන්වීම් සැලැස්ම' : 'Daily 8 Period Timetable Structure'}
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
              07:40 AM - 01:30 PM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DEFAULT_PERIODS.map((p) => {
              const slot = getSlot(activeDay, p.period);
              const isBreakAfter = p.period === 6;
              const subjectIcon = slot?.subjectName ? getSubjectIcon(slot.subjectName) : '📖';
              const isLiveNow =
                activeDay === todayKey && activeOngoingPeriod?.period.period === p.period;

              return (
                <div
                  key={`day-${activeDay}-period-${p.period}`}
                  className={`p-4 rounded-2xl border transition shadow-2xs space-y-2.5 relative flex flex-col justify-between ${
                    isLiveNow
                      ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-500/30'
                      : slot
                      ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 dark:from-[#2e0e04]/40 dark:via-stone-800/80 dark:to-stone-900 border-amber-300 dark:border-amber-800 hover:border-amber-500'
                      : 'bg-slate-50/60 dark:bg-stone-800/30 border-slate-200/80 dark:border-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-7 h-7 rounded-full font-mono font-bold text-xs flex items-center justify-center border shadow-2xs ${
                        isLiveNow
                          ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-400/40'
                      }`}>
                        {p.period}
                      </span>
                      {isLiveNow && (
                        <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-full animate-pulse flex items-center gap-1 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          <span>{isSi ? 'දැන්' : 'LIVE'}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isLiveNow && activeOngoingPeriod && (
                        <span className="text-[10px] font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          <LivePeriodCountdown
                            startMin={p.startMin}
                            endMin={p.endMin}
                            mode="remaining"
                          />
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold bg-white dark:bg-stone-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-stone-600">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>
                          {p.startTime} - {p.endTime}
                        </span>
                      </span>
                    </div>
                  </div>

                  {slot ? (
                    <div className="space-y-2 py-1">
                      <div className="flex items-start gap-2">
                        <span className="text-xl shrink-0 mt-0.5">{subjectIcon}</span>
                        <div>
                          <h4 className="font-serif font-black text-sm text-slate-900 dark:text-white leading-tight">
                            {slot.subjectName}
                          </h4>
                          {slot.subjectId && (
                            <span className="text-[9px] font-mono text-slate-400">
                              Code: {slot.subjectId}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs gap-1 flex-wrap">
                        <span className="font-bold text-amber-900 dark:text-amber-300 text-[11px]">
                          🏫 {slot.className}
                        </span>
                        {slot.room ? (
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-amber-100/60 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                            Room {slot.room}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-center text-slate-400 dark:text-slate-500 space-y-1">
                      <Coffee className="w-5 h-5 mx-auto text-slate-400 opacity-60" />
                      <p className="text-xs font-bold">
                        {isSi ? 'විවේක කාලච්ඡේදය' : 'Free Preparation Slot'}
                      </p>
                    </div>
                  )}

                  {isBreakAfter && (
                    <div className="text-[9px] font-bold text-center bg-amber-100/90 dark:bg-amber-950 text-amber-950 dark:text-amber-200 py-1 rounded-lg border border-amber-300/80 dark:border-amber-800">
                      ☕ දහවල් ගිලන්පස විවේකය (11:40 AM - 12:00 PM)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* FULL 5-DAY MASTER WEEKLY GRID TABLE */
        <div className="bg-white dark:bg-stone-900 border border-amber-200/80 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-stone-800">
            <div>
              <h3 className="font-serif font-black text-base text-slate-900 dark:text-white">
                {isSi ? 'සම්පූර්ණ සතිපතා කාලසටහන් පුවරුව (Weekly Master Grid)' : 'Weekly Master Timetable Grid'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isSi ? 'සතියේ දින 5 ම එක් බැල්මකින්' : '5 Days Full Schedule Overview'}
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-amber-900 dark:text-amber-200 text-xs font-bold rounded-xl border border-amber-200 dark:border-stone-700 transition cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>

          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-stone-700 bg-amber-50/60 dark:bg-stone-800/80">
                <th className="p-3 font-bold text-slate-700 dark:text-slate-300 w-24">Period</th>
                {DAYS.map((d) => (
                  <th key={d.id} className="p-3 font-serif font-bold text-slate-900 dark:text-white">
                    <span className="mr-1">{d.icon}</span>
                    <span>{isSi ? d.labelSi : d.labelEn}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEFAULT_PERIODS.map((p) => (
                <tr
                  key={`row-period-${p.period}`}
                  className="border-b border-slate-100 dark:border-stone-800/60 hover:bg-amber-50/30 dark:hover:bg-stone-800/40 transition"
                >
                  <td className="p-3 font-mono font-bold text-slate-500 whitespace-nowrap bg-slate-50/50 dark:bg-stone-850/50">
                    <span className="font-black text-slate-900 dark:text-white mr-1.5 text-sm">
                      {p.period}
                    </span>
                    <span className="text-[9px] text-slate-400 block">{p.startTime}</span>
                  </td>

                  {DAYS.map((d) => {
                    const slot = getSlot(d.id, p.period);
                    const subjectIcon = slot?.subjectName ? getSubjectIcon(slot.subjectName) : '📖';

                    return (
                      <td key={`grid-${d.id}-${p.period}`} className="p-2">
                        {slot ? (
                          <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-[#2e0e04]/60 border border-amber-200 dark:border-amber-800 space-y-1 shadow-2xs">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">{subjectIcon}</span>
                              <p className="font-serif font-black text-[11px] text-slate-900 dark:text-white leading-tight truncate">
                                {slot.subjectName}
                              </p>
                            </div>
                            <p className="text-[10px] text-amber-800 dark:text-amber-400 font-bold truncate">
                              🏫 {slot.className}
                            </p>
                            {slot.room && (
                              <span className="text-[9px] font-mono text-slate-500">
                                Room {slot.room}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="py-2 text-center text-slate-300 dark:text-stone-700 font-mono text-[11px]">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 7. QUICK ACTION SHORTCUTS (LINKS TO PORTAL SECTIONS)   */}
      {/* ========================================================= */}
      {onNavigate && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isSi ? 'ඉක්මන් මෙහෙයුම් පිවිසුම් (Quick Modules)' : 'Quick Action Modules'}</span>
            </h4>
            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80">
              4 Links
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Link 1: Dashboard */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onNavigate('overview');
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/30 to-white dark:from-amber-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-amber-100/90 border border-amber-200/80 dark:border-amber-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-slate-900 dark:text-white text-xs block truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {isSi ? 'ප්‍රධාන පුවරුව' : 'Dashboard'}
                </span>
                <span className="text-[9px] text-amber-700/80 dark:text-amber-300/80 font-bold block truncate">
                  {isSi ? 'මුල් පිටුව' : 'Overview'}
                </span>
              </div>
            </button>

            {/* Link 2: Monitoring */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onNavigate('monitoring');
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-rose-50/90 via-pink-50/30 to-white dark:from-rose-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-rose-100/90 border border-rose-200/80 dark:border-rose-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-slate-900 dark:text-white text-xs block truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {isSi ? 'විභාග අධීක්ෂණය' : 'Monitoring'}
                </span>
                <span className="text-[9px] text-rose-700/80 dark:text-rose-300/80 font-bold block truncate">
                  {isSi ? 'ලකුණු වාර්තා' : 'Marks & Submissions'}
                </span>
              </div>
            </button>

            {/* Link 3: Roster */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onNavigate('roster');
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/30 to-white dark:from-emerald-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-emerald-100/90 border border-emerald-200/80 dark:border-emerald-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-slate-900 dark:text-white text-xs block truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {isSi ? 'ශිෂ්‍ය නාමාවලිය' : 'Student Roster'}
                </span>
                <span className="text-[9px] text-emerald-700/80 dark:text-emerald-300/80 font-bold block truncate">
                  {isSi ? 'පන්ති නාමලේඛන' : 'Class Roster'}
                </span>
              </div>
            </button>

            {/* Link 4: Materials */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onNavigate('materials');
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-blue-50/90 via-sky-50/30 to-white dark:from-blue-950/30 dark:via-stone-900 dark:to-stone-900 hover:from-blue-100/90 border border-blue-200/80 dark:border-blue-800/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 group text-left shadow-2xs"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-2xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-slate-900 dark:text-white text-xs block truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {isSi ? 'අධ්‍යයන නිබන්ධන' : 'Study Notes'}
                </span>
                <span className="text-[9px] text-blue-700/80 dark:text-blue-300/80 font-bold block truncate">
                  {isSi ? 'PDF සහ Notes' : 'Files & Vault'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 🖨️ 100% OFFICIAL PIRIVENA PRINTABLE TIMETABLE SHEET (A4 PDF / PRINT SPOOLER) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="teacher-timetable-print-sheet" className="hidden print:block text-black bg-white">
            <style>{`
              @media print {
                @page {
                  size: A4 landscape;
                  margin: 6mm;
                }
                body {
                  background: #ffffff !important;
                  color: #000000 !important;
                }
              }
            `}</style>

            {/* Official Document Header */}
            <div className="text-center pb-2 mb-2 border-b-2 border-black">
              <div className="flex items-center justify-between">
                <div className="w-14 text-left text-2xl font-black">🏛️</div>
                <div className="flex-1 text-center">
                  <h1 className="text-xl font-serif font-black text-black tracking-wide leading-tight">
                    ශ්‍රී සුමන මහා පිරිවෙන - රත්නපුර
                  </h1>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mt-0.5">
                    Sri Sumana Maha Pirivena - Rathnapura
                  </h2>
                  <div className="inline-block mt-1 px-3 py-0.5 bg-black text-white text-[11px] font-black rounded-md uppercase tracking-wider">
                    ආචාර්ය පෞද්ගලික කාලසටහන (Faculty Teaching Timetable)
                  </div>
                </div>
                <div className="w-14 text-right text-xs font-bold text-slate-800">
                  {new Date().getFullYear()}
                </div>
              </div>

              {/* Metadata Sub-bar */}
              <div className="mt-2 pt-1.5 border-t border-slate-300 flex items-center justify-between text-xs font-bold text-slate-900 px-1">
                <div>
                  <span>ආචාර්ය නම: </span>
                  <span className="font-black text-sm">{user?.monkName || user?.name || 'ගුරුභවතා'}</span>
                  {user?.customId && <span className="ml-1 text-[11px] font-mono">({user.customId})</span>}
                </div>
                <div>
                  <span>තනතුර: </span>
                  <span className="font-black">{(user as any)?.designation || 'ආචාර්ය මණ්ඩලය'}</span>
                </div>
                <div>
                  <span>සතිපතා කාලච්ඡේද: </span>
                  <span className="font-black">{totalTeachingSlots}</span>
                </div>
              </div>
            </div>

            {/* Print Table Matrix */}
            <table className="w-full border-collapse border-2 border-black text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-black">
                  <th className="border border-black p-1.5 font-black text-left w-24">වේලාව</th>
                  {DAYS.map((d) => (
                    <th key={d.id} className="border border-black p-1.5 font-black text-center">
                      {d.labelSi} ({d.labelEn})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-50 text-black">
                  <td colSpan={6} className="border border-black p-1 text-center font-bold text-[10px]">
                    🙏 උදෑසන බුද්ධ වන්දනාව සහ ආගමික වතාවත් (07:30 AM – 07:40 AM)
                  </td>
                </tr>

                {DEFAULT_PERIODS.map((dp) => {
                  const isInterval = dp.period === 6;

                  return (
                    <React.Fragment key={dp.period}>
                      <tr>
                        <td className="border border-black p-1 font-bold text-[10px] bg-slate-50 whitespace-nowrap text-center text-black">
                          <div className="font-black">{dp.period} වන පැය</div>
                          <div className="text-[9px] font-mono">
                            {dp.startTime} - {dp.endTime}
                          </div>
                        </td>

                        {DAYS.map((d) => {
                          const slot = getSlot(d.id, dp.period);
                          return (
                            <td
                              key={d.id}
                              className="border border-black p-1 text-center align-middle text-black"
                            >
                              {slot ? (
                                <div>
                                  <div className="font-black text-black">{slot.subjectName}</div>
                                  <div className="text-[9.5px] text-slate-800">
                                    🏛️ {slot.className}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {isInterval && (
                        <tr className="bg-slate-100 text-black">
                          <td
                            colSpan={6}
                            className="border border-black p-1 text-center font-black text-[10px]"
                          >
                            🍱 දාන වේලාව සහ දහවල් විවේකය (11:40 AM – 12:00 PM)
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Signatures */}
            <div className="mt-6 pt-4 flex justify-between items-end text-xs font-bold text-black px-4">
              <div className="text-center">
                <div className="w-40 border-b border-black mb-1 mx-auto" />
                <div>ආචාර්යතුමාගේ අත්සන</div>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-black mb-1 mx-auto" />
                <div>ප්‍රධානාචාර්ය / පරිවේණාධිපති අත්සන සහ නිල මුද්‍රාව</div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </motion.div>
  );
};
