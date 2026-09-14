import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Printer,
  Calendar,
  Clock,
  School,
  BookOpen,
  GraduationCap,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PirivenaClass, Subject, User, ClassTimetableSlot } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptics';
import { triggerUniversalPrint } from '../utils/printHelper';

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

interface TeacherTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: User | null;
  classes: PirivenaClass[];
  subjects?: Subject[];
}

const DAYS: { id: DayKey; labelSi: string; labelEn: string; shortSi: string }[] = [
  { id: 'monday', labelSi: 'සඳුදා', labelEn: 'Monday', shortSi: 'සඳු' },
  { id: 'tuesday', labelSi: 'අඟහරුවාදා', labelEn: 'Tuesday', shortSi: 'අඟ' },
  { id: 'wednesday', labelSi: 'බදාදා', labelEn: 'Wednesday', shortSi: 'බදා' },
  { id: 'thursday', labelSi: 'බ්‍රහස්පතින්දා', labelEn: 'Thursday', shortSi: 'බ්‍රහ' },
  { id: 'friday', labelSi: 'සිකුරාදා', labelEn: 'Friday', shortSi: 'සිකු' },
];

const DEFAULT_PERIODS = [
  { period: 1, startTime: '07:40 AM', endTime: '08:20 AM' },
  { period: 2, startTime: '08:20 AM', endTime: '09:00 AM' },
  { period: 3, startTime: '09:00 AM', endTime: '09:40 AM' },
  { period: 4, startTime: '09:40 AM', endTime: '10:20 AM' },
  { period: 5, startTime: '10:20 AM', endTime: '11:00 AM' },
  { period: 6, startTime: '11:00 AM', endTime: '11:40 AM' },
  { period: 7, startTime: '12:00 PM', endTime: '12:45 PM' },
  { period: 8, startTime: '12:45 PM', endTime: '01:30 PM' },
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

export const TeacherTimetableModal: React.FC<TeacherTimetableModalProps> = ({
  isOpen,
  onClose,
  teacher,
  classes = [],
  subjects = [],
}) => {
  const { language } = useLanguage();
  const isSi = language === 'si';
  const [activeDay, setActiveDay] = useState<DayKey | 'all'>('monday');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Aggregate all teaching slots for this teacher across all classes
  const teacherSlots = useMemo(() => {
    if (!teacher) return [];
    const teacherId = teacher.id;
    const teacherCustomId = teacher.customId;
    const teacherName = teacher.name;
    const teacherMonkName = teacher.monkName;

    const aggregated: TeacherSlotInfo[] = [];

    classes.forEach((cls) => {
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
  }, [teacher, classes]);

  if (!isOpen || !teacher) return null;

  const totalTeachingSlots = teacherSlots.length;
  const uniqueClassesCount = new Set(teacherSlots.map((s) => s.classId)).size;
  const totalFreeSlots = 40 - totalTeachingSlots; // 8 periods * 5 days = 40 total

  const getSlot = (day: DayKey, period: number): TeacherSlotInfo | undefined => {
    return teacherSlots.find((s) => s.day === day && s.periodNumber === period);
  };

  const handlePrint = () => {
    triggerUniversalPrint(`ගුරු_කාලසටහන_${teacher?.monkName || teacher?.name || 'Teacher_Timetable'}`);
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <>
          {/* 1. ON-SCREEN INTERACTIVE MODAL (HIDDEN DURING PRINT) */}
          <AnimatePresence>
            <div
              className="no-print fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto select-none pt-safe pb-safe"
              onClick={onClose}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 14 }}
                transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                className="bg-white dark:bg-stone-900 border border-amber-500/40 dark:border-amber-700/50 rounded-3xl w-full max-w-5xl max-h-[calc(100dvh-2rem)] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden my-auto text-slate-900 dark:text-stone-100 mobile-bottom-sheet"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Bottom Sheet Drag Indicator */}
                <div className="bottom-sheet-drag-handle sm:hidden" />

                {/* Top Golden Accent Strip */}
                <div className="h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shrink-0" />

                {/* MODAL TOP HEADER */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-stone-800 bg-gradient-to-r from-stone-950 via-amber-950/70 to-stone-950 text-white flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                      👨‍🏫
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-serif font-black text-base sm:text-lg text-amber-100 truncate">
                          {teacher.monkName || teacher.name} - {isSi ? 'පෞද්ගලික කාලසටහන' : 'Personal Timetable'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-xs border border-amber-400/30">
                          {teacher.customId || 'STAFF'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-200/80 truncate mt-0.5 font-medium">
                        {(teacher as any).designation || (isSi ? 'ආචාර්ය මණ්ඩලය' : 'Faculty')} |{' '}
                        {teacher.monkStatus === 'monk' ? (isSi ? 'පූජ්‍ය ස්වාමීන් වහන්සේ' : 'Venerable Monk') : (isSi ? 'ගුරු භවතා' : 'Teacher')}
                      </p>
                    </div>
                  </div>

                  {/* Action Tools */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs group"
                      title={isSi ? 'මුද්‍රණය කරන්න (Print Timetable)' : 'Print Timetable'}
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Print / PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onClose();
                      }}
                      className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/15 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer active:scale-90"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* QUICK STATS SUB-BAR */}
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-stone-850 border-b border-slate-200 dark:border-stone-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0 text-xs font-bold">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                      <BookOpen className="w-3.5 h-3.5 animate-icon-float" />
                      <span>{isSi ? 'සතිපතා කාලච්ඡේද:' : 'Weekly Periods:'} <strong>{totalTeachingSlots}</strong></span>
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <School className="w-3.5 h-3.5 animate-icon-pulse-glow" />
                      <span>{isSi ? 'පන්ති:' : 'Classes:'} <strong>{uniqueClassesCount}</strong></span>
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-stone-400">
                      <Clock className="w-3.5 h-3.5 animate-icon-spin-slow" />
                      <span>{isSi ? 'නිදහස් කාලච්ඡේද:' : 'Free Periods:'} <strong>{totalFreeSlots}</strong></span>
                    </span>
                  </div>
                </div>

                {/* DAY SELECTOR TABS SUB-BAR */}
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-stone-800 border-b border-slate-200 dark:border-stone-750 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
                  <div className="flex items-center gap-1.5">
                    {DAYS.map((d) => {
                      const isActive = activeDay === d.id;
                      const daySlotsCount = teacherSlots.filter((s) => s.day === d.id).length;

                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setActiveDay(d.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0 ${
                            isActive
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white dark:bg-stone-900 text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-850 border border-slate-200 dark:border-stone-700'
                          }`}
                        >
                          <span>{isSi ? d.labelSi : d.labelEn}</span>
                          {daySlotsCount > 0 && (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                isActive
                                  ? 'bg-white/25 text-white'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {daySlotsCount}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveDay('all');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0 ${
                        activeDay === 'all'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white dark:bg-stone-900 text-slate-700 dark:text-stone-300 hover:bg-slate-50 dark:hover:bg-stone-850 border border-slate-200 dark:border-stone-700'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{isSi ? 'සම්පූර්ණ සතිය (Grid)' : 'Full Week Grid'}</span>
                    </button>
                  </div>
                </div>

                {/* TIMETABLE CONTENT BODY */}
                <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                  {activeDay !== 'all' ? (
                    /* SINGLE DAY PERIODS LIST */
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-stone-800 pb-2">
                        <span className="font-serif font-black text-sm text-slate-800 dark:text-stone-200 flex items-center gap-2">
                          <span>
                            {DAYS.find((d) => d.id === activeDay)?.[isSi ? 'labelSi' : 'labelEn']}{' '}
                            {isSi ? 'දින කාලසටහන' : 'Schedule'}
                          </span>
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-400 dark:text-stone-400">
                          {isSi ? 'කාලච්ඡේද 8 කින් සමන්විතයි' : '8 Periods'}
                        </span>
                      </div>

                      {/* Morning Buddha Puja Banner */}
                      <div className="py-2 px-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 shadow-2xs">
                        <span className="flex items-center gap-1.5 font-serif font-black">
                          <span>🙏</span>
                          <span>{isSi ? 'උදෑසන බුද්ධ වන්දනාව සහ ආගමික වතාවත්' : 'Morning Buddha Puja & Religious Observances'}</span>
                        </span>
                        <span className="font-mono text-[10.5px] bg-white dark:bg-stone-850 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 font-black">
                          07:30 – 07:40 AM (10 min)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {DEFAULT_PERIODS.map((dp) => {
                          const slot = getSlot(activeDay, dp.period);
                          const isInterval = dp.period === 6;

                          return (
                            <React.Fragment key={dp.period}>
                              <div
                                className={`border rounded-2xl p-3 sm:p-3.5 shadow-2xs space-y-2 transition ${
                                  slot
                                    ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-700/60'
                                    : 'bg-slate-50 dark:bg-stone-850 border-slate-200 dark:border-stone-750 opacity-75'
                                }`}
                              >
                                {/* Slot Header */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center border shadow-2xs ${
                                        slot
                                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-400/40'
                                          : 'bg-slate-200 dark:bg-stone-800 text-slate-600 dark:text-stone-400 border-slate-300 dark:border-stone-700'
                                      }`}
                                    >
                                      {dp.period}
                                    </span>
                                    <span className="font-serif font-black text-xs text-slate-900 dark:text-stone-100">
                                      {dp.period} {isSi ? 'වන කාලච්ඡේදය' : 'Period'}
                                    </span>
                                  </div>

                                  {/* Time range pill */}
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 text-slate-600 dark:text-stone-300 font-mono font-bold text-[10px] border border-slate-200 dark:border-stone-700">
                                    <Clock className="w-2.5 h-2.5 text-amber-500" />
                                    <span>
                                      {dp.startTime} - {dp.endTime}
                                    </span>
                                  </span>
                                </div>

                                {slot ? (
                                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/90 border border-amber-200 dark:border-amber-800/80 space-y-1 shadow-2xs">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-black text-xs text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                        <span>{slot.subjectName}</span>
                                      </div>
                                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold text-[9.5px] border border-amber-200 dark:border-amber-800">
                                        {slot.classCode || 'CLS'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-stone-300 pt-0.5">
                                      <span className="font-bold">🏛️ {slot.className}</span>
                                      {slot.room && <span className="font-medium text-stone-400">({slot.room})</span>}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-10 flex items-center justify-center text-[11px] font-bold text-slate-400 dark:text-stone-500 border border-dashed border-slate-200 dark:border-stone-750 rounded-xl">
                                    🍃 {isSi ? 'නිදහස් කාලච්ඡේදයකි (Free Period)' : 'Free Period'}
                                  </div>
                                )}
                              </div>

                              {/* Interval Banner */}
                              {isInterval && (
                                <div className="col-span-full py-2.5 px-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-amber-800 dark:text-amber-300 shadow-2xs">
                                  <span>🍱 {isSi ? 'දාන වේලාව සහ දහවල් විවේකය (11:40 AM – 12:00 PM)' : 'Lunch / Alms Interval (11:40 AM - 12:00 PM)'}</span>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* FULL WEEK MATRIX VIEW */
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs select-none">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-stone-800 text-slate-900 dark:text-stone-100">
                            <th className="p-2.5 border border-slate-200 dark:border-stone-700 font-black text-left w-24">
                              {isSi ? 'වේලාව' : 'Time'}
                            </th>
                            {DAYS.map((d) => (
                              <th
                                key={d.id}
                                className="p-2.5 border border-slate-200 dark:border-stone-700 font-black text-center"
                              >
                                {isSi ? d.labelSi : d.labelEn}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Morning Buddha Puja Row */}
                          <tr className="bg-amber-50 dark:bg-amber-950/40">
                            <td
                              colSpan={6}
                              className="p-2 border border-amber-200 dark:border-amber-800/60 text-center font-black text-xs text-amber-900 dark:text-amber-200"
                            >
                              🙏 {isSi ? 'උදෑසන බුද්ධ වන්දනාව සහ ආගමික වතාවත් (07:30 AM – 07:40 AM)' : 'Morning Buddha Puja (07:30 AM - 07:40 AM)'}
                            </td>
                          </tr>

                          {DEFAULT_PERIODS.map((dp) => {
                            const isInterval = dp.period === 6;

                            return (
                              <React.Fragment key={dp.period}>
                                <tr className="hover:bg-slate-50/50 dark:hover:bg-stone-800/40 transition">
                                  <td className="p-2 border border-slate-200 dark:border-stone-700 font-bold text-slate-600 dark:text-stone-300 text-[10.5px] bg-slate-50 dark:bg-stone-850 whitespace-nowrap">
                                    <div className="font-black text-slate-900 dark:text-stone-100">
                                      {dp.period} {isSi ? 'වන පැය' : 'Period'}
                                    </div>
                                    <div className="text-[9.5px] font-mono text-slate-500 dark:text-stone-400 font-bold leading-tight">
                                      {dp.startTime} - {dp.endTime}
                                    </div>
                                  </td>

                                  {DAYS.map((d) => {
                                    const slot = getSlot(d.id, dp.period);
                                    return (
                                      <td
                                        key={d.id}
                                        className="p-2 border border-slate-200 dark:border-stone-700 align-top min-w-[120px]"
                                      >
                                        {slot ? (
                                          <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 space-y-0.5">
                                            <div className="font-black text-amber-950 dark:text-amber-100 text-xs truncate">
                                              {slot.subjectName}
                                            </div>
                                            <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold truncate">
                                              🏛️ {slot.className}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="h-10 border border-dashed border-slate-200 dark:border-stone-750 rounded-xl flex items-center justify-center text-[10px] text-slate-400 dark:text-stone-500">
                                            -
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>

                                {isInterval && (
                                  <tr className="bg-amber-50 dark:bg-amber-950/40">
                                    <td
                                      colSpan={6}
                                      className="p-2 border border-amber-200 dark:border-amber-800/60 text-center font-black text-xs text-amber-900 dark:text-amber-200"
                                    >
                                      🍱 {isSi ? 'දාන වේලාව සහ දහවල් විවේකය (11:40 AM – 12:00 PM)' : 'Lunch / Alms Interval (11:40 AM - 12:00 PM)'}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* MODAL BOTTOM FOOTER */}
                <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 pb-safe">
                  <div className="text-[11px] text-slate-500 dark:text-stone-400 font-medium hidden sm:block">
                    {isSi ? '🔒 ආචාර්ය මණ්ඩල පෞද්ගලික කාලසටහන් ද්වාරය' : 'Faculty Personal Timetable Portal'}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onClose();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-800 dark:text-stone-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-stone-700 transition cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center touch-manipulation"
                  >
                    {isSi ? 'වසන්න (Close)' : 'Close'}
                  </button>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>

          {/* 2. PRINT-ONLY OFFICIAL TIMETABLE */}
          <div id="timetable-print-sheet" className="hidden print:block">
            <style>{`
              @media print {
                @page {
                  size: A4 landscape;
                  margin: 5mm 8mm;
                }
                html, body {
                  background: #ffffff !important;
                  color: #000000 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body * {
                  visibility: hidden !important;
                }
                #timetable-print-sheet, #timetable-print-sheet * {
                  visibility: visible !important;
                }
                #timetable-print-sheet {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  display: block !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  padding: 4px 8px !important;
                  margin: 0 !important;
                  box-sizing: border-box !important;
                  z-index: 999999999 !important;
                  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                }
                .no-print, .no-print * {
                  display: none !important;
                  visibility: hidden !important;
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
                  <span className="font-black text-sm">{teacher.monkName || teacher.name}</span>
                  {teacher.customId && <span className="ml-1 text-[11px] font-mono">({teacher.customId})</span>}
                </div>
                <div>
                  <span>තනතුර: </span>
                  <span className="font-black">{(teacher as any).designation || 'ආචාර්ය මණ්ඩලය'}</span>
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
                          <div className="text-[9px] font-mono">{dp.startTime} - {dp.endTime}</div>
                        </td>

                        {DAYS.map((d) => {
                          const slot = getSlot(d.id, dp.period);
                          return (
                            <td key={d.id} className="border border-black p-1 text-center align-middle text-black">
                              {slot ? (
                                <div>
                                  <div className="font-black text-black">{slot.subjectName}</div>
                                  <div className="text-[9.5px] text-slate-800">🏛️ {slot.className}</div>
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
                          <td colSpan={6} className="border border-black p-1 text-center font-black text-[10px]">
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
          </div>
        </>,
        document.body
      )
    : null;
};
