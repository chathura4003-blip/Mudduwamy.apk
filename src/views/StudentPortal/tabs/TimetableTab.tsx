import React from 'react';
import { Calendar, Clock, BookMarked, Printer, Sparkles } from 'lucide-react';
import type { PirivenaClass, ClassTimetableSlot } from '../../../types';
import { triggerHaptic } from '../../../utils/haptics';
import { triggerUniversalPrint } from '../../../utils/printHelper';

interface TimetableTabProps {
  studentClass: PirivenaClass | undefined;
  dailyTimetableSlots: ClassTimetableSlot[];
  classTimetableSlots: ClassTimetableSlot[];
  selectedTimetableDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  setSelectedTimetableDay: (day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday') => void;
  isWeeklyGridView: boolean;
  setIsWeeklyGridView: (v: boolean) => void;
  currentLivePeriod: any;
  currentLiveTimeStr?: string;
  activeOngoingPeriod?: any;
  upcomingNextPeriod?: any;
  getSubjectIconAndColor: (subjName?: string) => { icon: string; color: string };
  isSi: boolean;
}

export const TimetableTab: React.FC<TimetableTabProps> = ({
  studentClass,
  dailyTimetableSlots,
  classTimetableSlots,
  selectedTimetableDay,
  setSelectedTimetableDay,
  isWeeklyGridView,
  setIsWeeklyGridView,
  currentLivePeriod,
  currentLiveTimeStr,
  activeOngoingPeriod,
  upcomingNextPeriod,
  getSubjectIconAndColor,
  isSi,
}) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 print-modal-content animate-fade-in">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-900/20">
            <Calendar className="w-5 h-5 animate-icon-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white">
                {isSi ? 'පන්ති කාලසටහන' : 'Class Timetable'}
              </h2>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-[10px] border border-amber-500/30">
                {studentClass ? studentClass.name : isSi ? 'සාමාන්‍ය කාලසටහන' : 'Standard Schedule'}
              </span>
              {currentLiveTimeStr && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/5 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-stone-900 dark:text-amber-300 text-[10px] font-mono font-black shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{currentLiveTimeStr}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSi
                ? 'දෛනික කාලච්ඡේද 8 ක අධ්‍යයන සැලැස්ම (07:40 AM - 01:30 PM)'
                : 'Daily 8-period academic timetable (07:40 AM - 01:30 PM)'}
              {studentClass?.roomNumber ? ` • 🏛️ ${studentClass.roomNumber}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={() => setIsWeeklyGridView(!isWeeklyGridView)}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
              isWeeklyGridView
                ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700 hover:bg-slate-200'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>
              {isWeeklyGridView ? (isSi ? 'දෛනික දසුන' : 'Day View') : isSi ? 'සතිපතා දසුන' : 'Week Grid'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerUniversalPrint(`පන්ති_කාලසටහන_${studentClass?.name || 'Timetable'}`);
            }}
            className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 no-print group"
          >
            <Printer className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>{isSi ? 'මුද්‍රණය (Print)' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Day Selector Pills */}
      {!isWeeklyGridView && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'monday', label: isSi ? 'සඳුදා' : 'Monday', short: isSi ? 'සඳු' : 'Mon' },
            { id: 'tuesday', label: isSi ? 'අඟහරුවාදා' : 'Tuesday', short: isSi ? 'අඟ' : 'Tue' },
            { id: 'wednesday', label: isSi ? 'බදාදා' : 'Wednesday', short: isSi ? 'බදා' : 'Wed' },
            { id: 'thursday', label: isSi ? 'බ්‍රහස්පතින්දා' : 'Thursday', short: isSi ? 'බ්‍රහ' : 'Thu' },
            { id: 'friday', label: isSi ? 'සිකුරාදා' : 'Friday', short: isSi ? 'සිකු' : 'Fri' },
          ].map((day) => {
            const isSelected = selectedTimetableDay === day.id;
            const isToday = currentLivePeriod.day === day.id;

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedTimetableDay(day.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-2 border active:scale-95 ${
                  isSelected
                    ? 'bg-amber-800 text-white border-amber-800 shadow-md'
                    : 'bg-slate-50 dark:bg-stone-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700 hover:bg-slate-100'
                }`}
              >
                <span>{day.label}</span>
                {isToday && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      isSelected ? 'bg-amber-400 text-amber-950 animate-pulse' : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {isSi ? 'අද' : 'Today'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Daily Schedule Timeline View */}
      {!isWeeklyGridView && (
        <div className="space-y-3">
          {dailyTimetableSlots.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-stone-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-stone-700 space-y-2">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto animate-icon-float" />
              <h3 className="font-serif font-bold text-slate-900 dark:text-white text-sm">
                {isSi ? 'මෙම දිනය සඳහා කාලසටහන සකස් කර නොමැත' : 'No Timetable Set For This Day'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isSi
                  ? 'පරිපාලක විසින් කාලසටහන යාවත්කාලීන කළ පසු මෙහි ස්වයංක්‍රීයව දිස්වනු ඇත.'
                  : 'Timetable will appear here once configured by the administration.'}
              </p>
            </div>
          ) : (
            <>
              {/* 🙏 Morning Buddha Puja Banner */}
              <div className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🙏</span>
                  <div>
                    <h4 className="font-serif font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-200">
                      {isSi ? 'උදෑසන බුද්ධ වන්දනාව සහ ආගමික වතාවත්' : 'Morning Buddha Puja & Assembly'}
                    </h4>
                    <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
                      {isSi ? 'සියලුම සාමණේර හිමිවරුන් සහ ගිහි සිසුන් සඳහා' : 'Daily Morning Devotion'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-amber-500/20 text-amber-950 dark:text-amber-200 rounded-xl border border-amber-500/30">
                  07:30 AM - 07:40 AM
                </span>
              </div>

              {/* Period 1 to 6 */}
              {dailyTimetableSlots
                .filter((s) => (s.periodNumber || 0) <= 6)
                .map((slot) => {
                  const subjMeta = getSubjectIconAndColor(slot.subjectName);
                  const isLiveNow =
                    currentLivePeriod.day === selectedTimetableDay &&
                    currentLivePeriod.periodNumber === slot.periodNumber;

                  return (
                    <div
                      key={slot.id || `slot-${slot.periodNumber}`}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col gap-2.5 ${
                        isLiveNow
                          ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                          : 'bg-white dark:bg-stone-800/80 border-slate-200 dark:border-stone-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 shadow-inner ${
                            isLiveNow
                              ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950'
                              : 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-200'
                          }`}>
                            <span className="text-[9px] uppercase tracking-wider text-amber-300 font-mono">P</span>
                            <span className="text-sm font-extrabold leading-none">{slot.periodNumber}</span>
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base">{subjMeta.icon}</span>
                              <h4 className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                {slot.subjectName || (isSi ? 'විෂය සඳහන් කර නැත' : 'General Period')}
                              </h4>
                              {isLiveNow && (
                                <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-full animate-pulse flex items-center gap-1 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  <span>{isSi ? 'දැන් පැවැත්වේ' : 'LIVE NOW'}</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <span>
                                👨‍🏫 {slot.teacherName || (isSi ? 'ගුරුභවතා පවරා නැත' : 'Lecturer Assigned')}
                              </span>
                              {slot.room && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-800 dark:text-amber-300 font-medium">
                                    🏛️ {slot.room}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isLiveNow && activeOngoingPeriod && (
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/25 border border-emerald-500/40 text-emerald-950 dark:text-emerald-200 text-xs font-mono font-black shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-icon-bounce shrink-0" />
                              <span>{isSi ? 'ඉතිරි:' : 'Left:'} {activeOngoingPeriod.remainingMins}:{activeOngoingPeriod.remainingSecStr}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-stone-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-stone-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="font-bold">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Live Progress Bar for active slot */}
                      {isLiveNow && activeOngoingPeriod && (
                        <div className="w-full h-1.5 rounded-full bg-amber-500/20 dark:bg-stone-800 overflow-hidden relative shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 transition-all duration-1000 ease-linear rounded-full shadow-xs"
                            style={{ width: `${activeOngoingPeriod.progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* 🍱 Lunch / Alms Interval Banner (11:40 AM - 12:00 PM) */}
              <div className="p-3.5 bg-gradient-to-r from-amber-900/90 via-amber-800 to-amber-950 text-white rounded-2xl flex items-center justify-between shadow-sm border border-amber-700/60">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🍱</span>
                  <div>
                    <h4 className="font-serif font-bold text-xs sm:text-sm text-amber-100">
                      {isSi
                        ? 'දාන වේලාව සහ දහවල් විවේකය (Lunch & Alms Interval)'
                        : 'Lunch & Midday Interval'}
                    </h4>
                    <p className="text-[11px] text-amber-200/80">
                      {isSi
                        ? 'සාමණේර භික්ෂූන් වහන්සේලා සහ සිසුන් සඳහා දහවල් දානය'
                        : 'Midday alms & student meal break'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-black/30 rounded-xl border border-amber-500/30">
                  11:40 AM - 12:00 PM
                </span>
              </div>

              {/* Period 7 and 8 */}
              {dailyTimetableSlots
                .filter((s) => (s.periodNumber || 0) > 6)
                .map((slot) => {
                  const subjMeta = getSubjectIconAndColor(slot.subjectName);
                  const isLiveNow =
                    currentLivePeriod.day === selectedTimetableDay &&
                    currentLivePeriod.periodNumber === slot.periodNumber;

                  return (
                    <div
                      key={slot.id || `slot-${slot.periodNumber}`}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col gap-2.5 ${
                        isLiveNow
                          ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                          : 'bg-white dark:bg-stone-800/80 border-slate-200 dark:border-stone-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 shadow-inner ${
                            isLiveNow
                              ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950'
                              : 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-200'
                          }`}>
                            <span className="text-[9px] uppercase tracking-wider text-amber-300 font-mono">P</span>
                            <span className="text-sm font-extrabold leading-none">{slot.periodNumber}</span>
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base">{subjMeta.icon}</span>
                              <h4 className="font-serif font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                                {slot.subjectName || (isSi ? 'විෂය සඳහන් කර නැත' : 'General Period')}
                              </h4>
                              {isLiveNow && (
                                <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[9px] rounded-full animate-pulse flex items-center gap-1 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  <span>{isSi ? 'දැන් පැවැත්වේ' : 'LIVE NOW'}</span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <span>
                                👨‍🏫 {slot.teacherName || (isSi ? 'ගුරුභවතා පවරා නැත' : 'Lecturer Assigned')}
                              </span>
                              {slot.room && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-800 dark:text-amber-300 font-medium">
                                    🏛️ {slot.room}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isLiveNow && activeOngoingPeriod && (
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/25 border border-emerald-500/40 text-emerald-950 dark:text-emerald-200 text-xs font-mono font-black shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-icon-bounce shrink-0" />
                              <span>{isSi ? 'ඉතිරි:' : 'Left:'} {activeOngoingPeriod.remainingMins}:{activeOngoingPeriod.remainingSecStr}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-stone-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-stone-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="font-bold">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Live Progress Bar for active slot */}
                      {isLiveNow && activeOngoingPeriod && (
                        <div className="w-full h-1.5 rounded-full bg-amber-500/20 dark:bg-stone-800 overflow-hidden relative shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 transition-all duration-1000 ease-linear rounded-full shadow-xs"
                            style={{ width: `${activeOngoingPeriod.progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}

      {/* Full Week Master Grid */}
      {isWeeklyGridView && (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-stone-700 shadow-sm">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-gradient-to-r from-stone-950 via-amber-950 to-stone-950 text-amber-200 font-bold border-b border-amber-800/40">
                <th className="p-3 whitespace-nowrap">{isSi ? 'දිනය' : 'Day'}</th>
                {[1, 2, 3, 4, 5, 6].map((p) => (
                  <th key={p} className="p-2.5 text-center whitespace-nowrap">
                    #{p}
                  </th>
                ))}
                <th className="p-2.5 text-center bg-amber-900/60 text-amber-300 font-extrabold whitespace-nowrap">
                  🍱 {isSi ? 'විවේකය' : 'Alms/Break'}
                </th>
                {[7, 8].map((p) => (
                  <th key={p} className="p-2.5 text-center whitespace-nowrap">
                    #{p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-stone-800 text-slate-800 dark:text-slate-200 bg-white dark:bg-stone-900">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((dayKey) => {
                const daySlots = classTimetableSlots.filter((s) => s.day?.toLowerCase() === dayKey);
                const dayLabels: any = {
                  monday: isSi ? 'සඳුදා' : 'Mon',
                  tuesday: isSi ? 'අඟහරුවාදා' : 'Tue',
                  wednesday: isSi ? 'බදාදා' : 'Wed',
                  thursday: isSi ? 'බ්‍රහස්පතින්දා' : 'Thu',
                  friday: isSi ? 'සිකුරාදා' : 'Fri',
                };

                return (
                  <tr key={dayKey} className="hover:bg-amber-50/50 dark:hover:bg-stone-800/60 transition">
                    <td className="p-3 font-serif font-bold text-amber-900 dark:text-amber-300 whitespace-nowrap border-r border-slate-100 dark:border-stone-800">
                      {dayLabels[dayKey]}
                    </td>

                    {/* Periods 1 - 6 */}
                    {[1, 2, 3, 4, 5, 6].map((pNum) => {
                      const slot = daySlots.find((s) => s.periodNumber === pNum);
                      const subjMeta = slot ? getSubjectIconAndColor(slot.subjectName) : null;
                      const isLiveGridSlot =
                        currentLivePeriod.day === dayKey && currentLivePeriod.periodNumber === pNum;

                      return (
                        <td
                          key={pNum}
                          className={`p-2 text-center align-top border-r border-slate-100 dark:border-stone-800 ${
                            isLiveGridSlot ? 'bg-amber-500/15 dark:bg-amber-950/40' : ''
                          }`}
                        >
                          {slot ? (
                            <div className={`p-1.5 rounded-xl border space-y-0.5 transition ${
                              isLiveGridSlot
                                ? 'bg-amber-500/20 dark:bg-amber-900/60 border-amber-500 ring-2 ring-amber-500/40 shadow-xs'
                                : 'bg-slate-50 dark:bg-stone-800/80 border-slate-100 dark:border-stone-700'
                            }`}>
                              {isLiveGridSlot && (
                                <span className="inline-block px-1.5 py-0.2 bg-rose-600 text-white font-bold text-[8px] rounded-full animate-pulse">
                                  LIVE
                                </span>
                              )}
                              <span className="font-bold block truncate text-[11px] text-slate-900 dark:text-white">
                                {subjMeta?.icon} {slot.subjectName}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {slot.teacherName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-stone-700 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Midday Alms & Lunch Interval Divider (11:40 AM - 12:00 PM) */}
                    <td className="p-2 text-center bg-amber-500/5 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold border-r border-slate-100 dark:border-stone-800 whitespace-nowrap">
                      11:40 AM
                    </td>

                    {/* Periods 7 - 8 */}
                    {[7, 8].map((pNum) => {
                      const slot = daySlots.find((s) => s.periodNumber === pNum);
                      const subjMeta = slot ? getSubjectIconAndColor(slot.subjectName) : null;
                      const isLiveGridSlot =
                        currentLivePeriod.day === dayKey && currentLivePeriod.periodNumber === pNum;

                      return (
                        <td
                          key={pNum}
                          className={`p-2 text-center align-top border-r border-slate-100 dark:border-stone-800 ${
                            isLiveGridSlot ? 'bg-amber-500/15 dark:bg-amber-950/40' : ''
                          }`}
                        >
                          {slot ? (
                            <div className={`p-1.5 rounded-xl border space-y-0.5 transition ${
                              isLiveGridSlot
                                ? 'bg-amber-500/20 dark:bg-amber-900/60 border-amber-500 ring-2 ring-amber-500/40 shadow-xs'
                                : 'bg-slate-50 dark:bg-stone-800/80 border-slate-100 dark:border-stone-700'
                            }`}>
                              {isLiveGridSlot && (
                                <span className="inline-block px-1.5 py-0.2 bg-rose-600 text-white font-bold text-[8px] rounded-full animate-pulse">
                                  LIVE
                                </span>
                              )}
                              <span className="font-bold block truncate text-[11px] text-slate-900 dark:text-white">
                                {subjMeta?.icon} {slot.subjectName}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {slot.teacherName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-stone-700 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
