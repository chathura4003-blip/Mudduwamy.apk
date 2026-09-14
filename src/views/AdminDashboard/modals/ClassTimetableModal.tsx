import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Printer,
  Save,
  X,
  Layers,
  Sparkles,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import { PirivenaClass, Subject, User, ClassTimetableSlot } from '../../../types';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import { triggerHaptic } from '../../../utils/haptics';
import { triggerUniversalPrint } from '../../../utils/printHelper';

interface ClassTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClass: PirivenaClass | null;
  subjects: Subject[];
  teachers: User[];
  onSaveTimetable?: (classId: string, timetable: ClassTimetableSlot[]) => Promise<void> | void;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

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

export const ClassTimetableModal: React.FC<ClassTimetableModalProps> = ({
  isOpen,
  onClose,
  targetClass,
  subjects = [],
  teachers = [],
  onSaveTimetable,
}) => {
  const toast = useToast();
  const { language } = useLanguage();
  const isSi = language === 'si';

  const [activeDay, setActiveDay] = useState<DayKey | 'all'>('monday');
  const [timetableSlots, setTimetableSlots] = useState<ClassTimetableSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize or load slots from class / localStorage
  useEffect(() => {
    if (!targetClass) return;

    let initialSlots: ClassTimetableSlot[] = [];
    if (targetClass.timetable && targetClass.timetable.length > 0) {
      initialSlots = targetClass.timetable;
    } else {
      try {
        const saved = localStorage.getItem(`pirivena_timetable_${targetClass.id}`);
        if (saved) {
          initialSlots = JSON.parse(saved);
        }
      } catch (e) {}
    }

    // If still empty, initialize standard week template
    if (initialSlots.length === 0) {
      initialSlots = generateDefaultWeekSlots();
    } else {
      initialSlots = initialSlots.map((slot) => {
        const dp = DEFAULT_PERIODS.find((p) => p.period === slot.periodNumber);
        if (dp) {
          return {
            ...slot,
            startTime: dp.startTime,
            endTime: dp.endTime,
          };
        }
        return slot;
      });
    }

    setTimetableSlots(initialSlots);
  }, [targetClass]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const generateDefaultWeekSlots = (): ClassTimetableSlot[] => {
    if (!targetClass) return [];
    const slots: ClassTimetableSlot[] = [];
    DAYS.forEach((d) => {
      DEFAULT_PERIODS.forEach((p) => {
        slots.push({
          id: `${targetClass.id}_${d.id}_${p.period}`,
          classId: targetClass.id,
          day: d.id,
          periodNumber: p.period,
          startTime: p.startTime,
          endTime: p.endTime,
          subjectId: '',
          subjectName: '',
          teacherId: '',
          teacherName: '',
        });
      });
    });
    return slots;
  };

  const getSlot = (day: DayKey, period: number): ClassTimetableSlot => {
    const found = timetableSlots.find((s) => s.day === day && s.periodNumber === period);
    if (found) return found;
    const dp = DEFAULT_PERIODS.find((p) => p.period === period) || {
      startTime: '',
      endTime: '',
    };
    return {
      id: `${targetClass.id}_${day}_${period}`,
      classId: targetClass.id,
      day,
      periodNumber: period,
      startTime: dp.startTime,
      endTime: dp.endTime,
      subjectId: '',
      subjectName: '',
      teacherId: '',
      teacherName: '',
    };
  };

  const updateSlot = (day: DayKey, period: number, updates: Partial<ClassTimetableSlot>) => {
    triggerHaptic('light');
    setTimetableSlots((prev) => {
      const idx = prev.findIndex((s) => s.day === day && s.periodNumber === period);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updates };
        return next;
      }
      const dp = DEFAULT_PERIODS.find((p) => p.period === period) || {
        startTime: '',
        endTime: '',
      };
      const newSlot: ClassTimetableSlot = {
        id: `${targetClass.id}_${day}_${period}`,
        classId: targetClass.id,
        day,
        periodNumber: period,
        startTime: dp.startTime,
        endTime: dp.endTime,
        subjectId: '',
        subjectName: '',
        teacherId: '',
        teacherName: '',
        ...updates,
      };
      return [...prev, newSlot];
    });
  };

  const teacherInCharge = targetClass ? teachers.find((t) => t.id === targetClass.teacherInChargeId) : undefined;

  const handleSave = async () => {
    if (!targetClass) return;
    triggerHaptic('medium');
    setIsSaving(true);
    try {
      if (onSaveTimetable) {
        await onSaveTimetable(targetClass.id, timetableSlots);
      }
      try {
        localStorage.setItem(
          `pirivena_timetable_${targetClass.id}`,
          JSON.stringify(timetableSlots)
        );
        localStorage.setItem('pirivena_classes_sync', String(Date.now()));
        const bc = new BroadcastChannel('pirivena-admin-sync');
        bc.postMessage({ type: 'classes-updated', classId: targetClass.id });
        bc.close();
        window.dispatchEvent(new CustomEvent('classes-updated'));
      } catch (e) {}
      toast.success(
        isSi
          ? `${targetClass.nameSinhala || targetClass.name} පන්ති කාලසටහන සාර්ථකව සුරැකිණි!`
          : `Timetable for ${targetClass.name} saved successfully!`
      );
      onClose();
    } catch (e) {
      toast.error(isSi ? 'කාලසටහන සුරැකීම අසාර්ථක විය.' : 'Failed to save timetable.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    triggerUniversalPrint(`පන්ති_කාලසටහන_${targetClass?.name || 'Class_Timetable'}`);
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <>
          {/* 1. ON-SCREEN INTERACTIVE MODAL (HIDDEN DURING PRINT) */}
          <AnimatePresence>
            {isOpen && targetClass && (
              <div
                className="no-print fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto select-none"
                onClick={onClose}
              >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 14 }}
                transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                className="bg-white dark:bg-stone-900 border border-indigo-500/40 dark:border-indigo-700/50 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden my-auto text-slate-900 dark:text-stone-100 mobile-bottom-sheet"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Bottom Sheet Drag Indicator */}
                <div className="bottom-sheet-drag-handle sm:hidden" />

                {/* Top Indigo / Gold Accent Strip */}
                <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-amber-400 to-indigo-600 shrink-0" />

                {/* MODAL HEADER */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-stone-800 bg-gradient-to-r from-stone-950 via-indigo-950/60 to-stone-950 text-white flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/40 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                      📅
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-serif font-black text-base sm:text-lg text-indigo-100 truncate">
                          {targetClass.nameSinhala || targetClass.name} - {isSi ? 'පන්ති කාලසටහන' : 'Class Timetable'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-black text-xs border border-indigo-400/30">
                          {targetClass.code || 'CLS'}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-200/80 truncate mt-0.5 font-medium">
                        {teacherInCharge
                          ? `👨‍🏫 ${isSi ? 'පන්තිභාර' : 'In Charge'}: ${teacherInCharge.monkName || teacherInCharge.name} | `
                          : ''}
                        {targetClass.category || 'සාමාන්‍ය අංශය'}
                        {targetClass.roomNumber ? ` | 🏛️ ${isSi ? 'ශාලාව' : 'Hall'}: ${targetClass.roomNumber}` : ''}
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
                      <Printer className="w-3.5 h-3.5 text-indigo-300 group-hover:scale-110 transition-transform" />
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

                {/* DAY SELECTOR TABS SUB-BAR */}
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-stone-850 border-b border-slate-200 dark:border-stone-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
                  <div className="flex items-center gap-1.5">
                    {DAYS.map((d) => {
                      const isActive = activeDay === d.id;
                      const daySlotsFilled = timetableSlots.filter(
                        (s) => s.day === d.id && s.subjectId
                      ).length;

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
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-750 border border-slate-200 dark:border-stone-700'
                          }`}
                        >
                          <span>{isSi ? d.labelSi : d.labelEn}</span>
                          {daySlotsFilled > 0 && (
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                isActive
                                  ? 'bg-white/25 text-white'
                                  : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                              }`}
                            >
                              {daySlotsFilled}
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
                          : 'bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-750 border border-slate-200 dark:border-stone-700'
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
                            {isSi ? 'දින කාලසටහන' : 'Timetable'}
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
                              <div className="bg-slate-50 dark:bg-stone-850 border border-slate-200 dark:border-stone-750 rounded-2xl p-3 sm:p-3.5 shadow-2xs space-y-2.5 transition hover:border-indigo-400 dark:hover:border-indigo-600">
                                {/* Slot Header */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                                      {dp.period}
                                    </span>
                                    <span className="font-serif font-black text-xs text-slate-900 dark:text-stone-100">
                                      {dp.period} {isSi ? 'වන කාලච්ඡේදය' : 'Period'}
                                    </span>
                                  </div>

                                  {/* Time range pill */}
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-stone-800 text-slate-600 dark:text-stone-300 font-mono font-bold text-[10px] border border-slate-200 dark:border-stone-700">
                                    <Clock className="w-2.5 h-2.5 text-indigo-500" />
                                    <span>
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </span>
                                </div>

                                {/* Dropdowns for Subject & Teacher */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {/* Subject Picker */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-stone-400 mb-0.5">
                                      📚 {isSi ? 'විෂයය (Subject)' : 'Subject'}
                                    </label>
                                    <select id="classtimetablemodal-select-1" name="classtimetablemodal-select-1"
                                      value={slot.subjectId || ''}
                                      onChange={(e) => {
                                        const subj = subjects.find((s) => s.id === e.target.value);
                                        updateSlot(activeDay, dp.period, {
                                          subjectId: e.target.value,
                                          subjectName: subj ? subj.nameSinhala || subj.name : '',
                                        });
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100 font-bold text-xs outline-none focus:border-indigo-500 cursor-pointer"
                                    >
                                      <option value="" className="bg-white dark:bg-stone-850 text-slate-900 dark:text-stone-100">
                                        {isSi ? '-- විෂයය තෝරන්න --' : '-- Select Subject --'}
                                      </option>
                                      {subjects.map((s) => (
                                        <option
                                          key={s.id}
                                          value={s.id}
                                          className="bg-white dark:bg-stone-850 text-slate-900 dark:text-stone-100"
                                        >
                                          {s.nameSinhala || s.name} ({s.code || 'SUBJ'})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Teacher Picker */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-stone-400 mb-0.5">
                                      👨‍🏫 {isSi ? 'ආචාර්යවරයා (Teacher)' : 'Teacher'}
                                    </label>
                                    <select id="classtimetablemodal-select-2" name="classtimetablemodal-select-2"
                                      value={slot.teacherId || ''}
                                      onChange={(e) => {
                                        const t = teachers.find((tch) => tch.id === e.target.value);
                                        updateSlot(activeDay, dp.period, {
                                          teacherId: e.target.value,
                                          teacherName: t ? t.monkName || t.name : '',
                                        });
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100 font-bold text-xs outline-none focus:border-indigo-500 cursor-pointer"
                                    >
                                      <option value="" className="bg-white dark:bg-stone-850 text-slate-900 dark:text-stone-100">
                                        {isSi ? '-- ආචාර්ය තෝරන්න --' : '-- Select Teacher --'}
                                      </option>
                                      {teachers.map((t) => (
                                        <option
                                          key={t.id}
                                          value={t.id}
                                          className="bg-white dark:bg-stone-850 text-slate-900 dark:text-stone-100"
                                        >
                                          {t.monkStatus === 'monk' ? '🪷 ' : '👨‍🏫 '}
                                          {t.monkName || t.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Interval Banner after Period 6 */}
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
                    /* FULL WEEK 5-DAY MATRIX VIEW */
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
                                        {slot.subjectName ? (
                                          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-0.5">
                                            <div className="font-black text-indigo-950 dark:text-indigo-200 text-xs truncate">
                                              {slot.subjectName}
                                            </div>
                                            {slot.teacherName && (
                                              <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold truncate">
                                                {slot.teacherName}
                                              </div>
                                            )}
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
                <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 pb-safe">
                  <div className="text-[11px] text-slate-500 dark:text-stone-400 font-medium hidden sm:block">
                    {isSi ? '🔒 පන්ති කාලසටහන ශිෂ්‍ය සහ ගුරු Portals වල ස්වයංක්‍රීයව දිස්වේ.' : 'Timetable syncs automatically across all portals.'}
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        onClose();
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-stone-700 transition cursor-pointer active:scale-95 shadow-2xs flex items-center justify-center touch-manipulation"
                    >
                      {isSi ? 'අවලංගු කරන්න' : 'Cancel'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50 touch-manipulation group"
                    >
                      <Save className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      <span>{isSaving ? (isSi ? 'සුරැකෙමින්...' : 'Saving...') : (isSi ? 'කාලසටහන සුරකින්න' : 'Save Timetable')}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* 2. PRINT-ONLY OFFICIAL TIMETABLE DOCUMENT */}
          {targetClass && (
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
                    නිල පන්ති කාලසටහන (Class Timetable)
                  </div>
                </div>
                <div className="w-14 text-right text-xs font-bold text-slate-800">
                  {targetClass.academicYear || new Date().getFullYear()}
                </div>
              </div>

              {/* Class Metadata Sub-bar */}
              <div className="mt-2 pt-1.5 border-t border-slate-300 flex items-center justify-between text-xs font-bold text-slate-900 px-1">
                <div>
                  <span>පන්තිය: </span>
                  <span className="font-black text-sm">{targetClass.nameSinhala || targetClass.name}</span>
                  {targetClass.code && <span className="ml-1 text-[11px] font-mono">({targetClass.code})</span>}
                </div>
                <div>
                  <span>පන්තිභාර ආචාර්ය: </span>
                  <span className="font-black">
                    {teacherInCharge ? (teacherInCharge.monkName || teacherInCharge.name) : 'නොමැත'}
                  </span>
                </div>
                <div>
                  <span>ශාලාව: </span>
                  <span className="font-black">{targetClass.roomNumber || 'නොමැත'}</span>
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
                              {slot.subjectName ? (
                                <div>
                                  <div className="font-black text-black">{slot.subjectName}</div>
                                  {slot.teacherName && (
                                    <div className="text-[9.5px] text-slate-800">({slot.teacherName})</div>
                                  )}
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
                <div>පන්තිභාර ආචාර්ය අත්සන</div>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-black mb-1 mx-auto" />
                <div>ප්‍රධානාචාර්ය / පරිවේණාධිපති අත්සන සහ නිල මුද්‍රාව</div>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body
    )
  : null;
};
