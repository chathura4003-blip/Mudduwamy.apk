import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Eye,
  Printer,
  ChevronDown,
  GraduationCap,
} from 'lucide-react';
import type { PirivenaClass, Exam } from '../../../types';
import { handleAvatarError, getImageUrl } from '../../../utils/imageHelper';
import { triggerHaptic } from '../../../utils/haptics';
import { triggerUniversalPrint } from '../../../utils/printHelper';

interface RosterTabProps {
  rosterViewList: any[];
  rosterSearch: string;
  setRosterSearch: (q: string) => void;
  rosterClassFilter: string;
  setRosterClassFilter: (id: string) => void;
  assignedClasses: PirivenaClass[];
  assignedExams: Exam[];
  selectedExamId: string;
  setSelectedExamId: (id: string) => void;
  classes: PirivenaClass[];
  handleOpenSubmissionModal: (st: any) => void;
  setSelectedStudentReport: (st: any) => void;
}

export const RosterTab: React.FC<RosterTabProps> = ({
  rosterViewList,
  rosterSearch,
  setRosterSearch,
  rosterClassFilter,
  setRosterClassFilter,
  assignedClasses,
  assignedExams,
  selectedExamId,
  setSelectedExamId,
  classes,
  handleOpenSubmissionModal,
  setSelectedStudentReport,
}) => {
  // Category quick filter: all | monk | lay | submitted | not_submitted
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'monk' | 'lay' | 'submitted' | 'not_submitted'>('all');

  // Filtered list
  const filteredRoster = useMemo(() => {
    return rosterViewList.filter((st: any) => {
      const isMonk = st.monkStatus === 'monk';
      const hasSub = Boolean(
        st.submission ||
        st.status === 'completed' ||
        st.status === 'graded' ||
        st.status === 'submitted' ||
        (st.score !== null && st.score !== undefined)
      );

      if (categoryFilter === 'monk' && !isMonk) return false;
      if (categoryFilter === 'lay' && isMonk) return false;
      if (categoryFilter === 'submitted' && !hasSub) return false;
      if (categoryFilter === 'not_submitted' && hasSub) return false;

      return true;
    });
  }, [rosterViewList, categoryFilter]);

  // Counts for Monk & Lay
  const monkCount = useMemo(() => rosterViewList.filter((s: any) => s.monkStatus === 'monk').length, [rosterViewList]);
  const layCount = useMemo(() => rosterViewList.length - monkCount, [rosterViewList, monkCount]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 sm:space-y-5 pb-12 select-none"
    >
      {/* ========================================================= */}
      {/* 📱 1. CLEAN TOP HERO: CLASS & EXAM FILTER BAR            */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-[#2a0c04] via-[#381307] to-[#1e0701] text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-amber-500/40 space-y-3.5">
        {/* Header Title Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-2xs">
              <Users className="w-4 h-4 animate-icon-bounce" />
            </div>
            <div>
              <h2 className="font-serif font-black text-base sm:text-lg text-white tracking-tight leading-tight">
                ශිෂ්‍ය නාමාවලිය
              </h2>
              <p className="text-[11px] text-amber-200/80">
                පන්ති අනුව ශිෂ්‍ය තොරතුරු සහ වාර්තා
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 no-print">
            <button
              type="button"
              onClick={() => {
                triggerUniversalPrint('ශිෂ්‍ය_නාමාවලිය_ශ්‍රී_සුමන_මහා_පිරිවෙන');
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition group"
              title="ශිෂ්‍ය නාමාවලිය මුද්‍රණය කරන්න (Print Student Roster)"
            >
              <Printer className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Print Roster</span>
            </button>
            <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
              {filteredRoster.length} ශිෂ්‍යයින්
            </span>
          </div>
        </div>

        {/* Single Clean Class Filter Dropdown */}
        <div className="relative pt-1">
          <label htmlFor="roster-class-select" className="sr-only">
            පන්තිය තෝරන්න
          </label>
          <select name="roster-class-select"
            id="roster-class-select"
            value={rosterClassFilter}
            onChange={(e) => {
              triggerHaptic('light');
              setRosterClassFilter(e.target.value);
            }}
            className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl border border-amber-400/50 text-xs sm:text-sm font-bold text-amber-100 bg-stone-900/90 focus:ring-2 focus:ring-amber-500 shadow-inner appearance-none cursor-pointer"
          >
            <option value="all" className="bg-stone-900 text-white">🏫 සියලුම පන්ති (All Classes)</option>
            {assignedClasses.map((c, idx) => (
              <option key={`roster-cls-opt-${c.id || idx}`} value={c.id} className="bg-stone-900 text-white">
                🏫 {c.name} {c.code ? `(${c.code})` : ''}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-amber-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📊 2. QUICK STAT SUMMARY PILLS                           */}
      {/* ========================================================= */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 p-2.5 sm:p-3 rounded-2xl shadow-xs text-center space-y-0.5">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
            මුළු සිසුන්
          </span>
          <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
            {rosterViewList.length}
          </span>
        </div>

        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-2.5 sm:p-3 rounded-2xl shadow-xs text-center space-y-0.5">
          <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase block">
            🪷 පැවිදි හිමිවරුන්
          </span>
          <span className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-400 font-mono">
            {monkCount}
          </span>
        </div>

        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-2.5 sm:p-3 rounded-2xl shadow-xs text-center space-y-0.5">
          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block">
            👤 ගිහි සිසුන්
          </span>
          <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {layCount}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🔍 3. SEARCH & QUICK FILTER CHIPS                        */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="rostertab-input-2" name="rostertab-input-2"
            type="text"
            placeholder="නම, සාමණේර නාමය හෝ ශිෂ්‍ය අංකයෙන් සොයන්න..."
            value={rosterSearch}
            onChange={(e) => setRosterSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800/60 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          {[
            { id: 'all', label: 'සියල්ල (All)' },
            { id: 'monk', label: '🪷 පැවිදි හිමිවරුන්' },
            { id: 'lay', label: '👤 ගිහි සිසුන්' },
            { id: 'submitted', label: '✓ විභාගය කළ අය' },
            { id: 'not_submitted', label: '⏸️ නොකළ අය' },
          ].map((f) => (
            <button
              key={`cat-flt-${f.id}`}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setCategoryFilter(f.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer active:scale-95 ${
                categoryFilter === f.id
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* 👥 4. STUDENT CARDS LIST (MOBILE-FIRST)                  */}
        {/* ========================================================= */}
        {filteredRoster.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-stone-700 text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
            <p className="font-bold">ගැළපෙන ශිෂ්‍යයින් කිසිවෙක් හමු නොවීය.</p>
            {(rosterSearch || rosterClassFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setRosterSearch('');
                  setRosterClassFilter('all');
                  setCategoryFilter('all');
                }}
                className="px-3 py-1.5 bg-amber-100 dark:bg-stone-800 text-amber-950 dark:text-amber-200 font-bold text-xs rounded-xl border border-amber-300 dark:border-stone-700 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ෆිල්ටර් ඉවත් කරන්න (Reset)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {filteredRoster.map((st: any, idx: number) => {
              const isMonk = st.monkStatus === 'monk';
              const hasSub = Boolean(
                st.submission ||
                st.status === 'completed' ||
                st.status === 'graded' ||
                st.status === 'submitted' ||
                (st.score !== null && st.score !== undefined)
              );
              const scoreVal = st.score !== null && st.score !== undefined ? st.score : (st.submission?.score ?? null);

              return (
                <div
                  key={`roster-st-card-${st.id || st.customId || idx}`}
                  className="bg-slate-50/80 dark:bg-stone-800/60 hover:bg-white dark:hover:bg-stone-800 border border-slate-200/80 dark:border-stone-700 p-3.5 rounded-2xl transition shadow-2xs space-y-3"
                >
                  {/* Top Row: Avatar, Name, Class & Category Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-amber-200 dark:bg-stone-700 flex items-center justify-center font-bold text-amber-950 dark:text-amber-200 text-base shrink-0 overflow-hidden border border-amber-400/40 shadow-xs">
                        {st.avatar ? (
                          <img
                            src={getImageUrl(st.avatar)}
                            alt={st.name}
                            className="w-full h-full object-cover"
                            onError={handleAvatarError}
                          />
                        ) : isMonk ? (
                          '🪷'
                        ) : (
                          '👤'
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {isMonk && st.monkName ? st.monkName : (st.name || st.monkName || 'ශිෂ්‍ය නාමය')}
                        </h4>
                        {isMonk && st.monkName && st.name && st.monkName !== st.name && (
                          <p className="text-[10px] text-slate-400 truncate">
                            ({st.name})
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-300/60 dark:border-amber-800">
                            #{st.customId || st.id}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-stone-700 px-1.5 py-0.5 rounded">
                            🏫 {st.className}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Category Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 border ${
                        isMonk
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                      }`}
                    >
                      {isMonk ? '🪷 පැවිදි' : '👤 ගිහි'}
                    </span>
                  </div>

                  {/* Contact Info (if available) */}
                  {(st.phone || st.email) && (
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-stone-900 p-2 rounded-xl border border-slate-200/60 dark:border-stone-700/60">
                      {st.phone && (
                        <a
                          href={`tel:${st.phone}`}
                          className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-amber-600 truncate font-mono group"
                        >
                          <Phone className="w-3 h-3 text-amber-600 shrink-0 group-hover:rotate-12 transition-transform" />
                          <span>{st.phone}</span>
                        </a>
                      )}
                      {st.email && (
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate font-sans select-all group">
                          <Mail className="w-3 h-3 text-amber-600 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="truncate">{st.email}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-stone-700/60">
                    {hasSub && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          handleOpenSubmissionModal(st);
                        }}
                        className="flex-1 py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 min-h-[36px] group"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-950 group-hover:scale-110 transition-transform" />
                        <span>පිළිතුරු පත්‍රය</span>
                        {scoreVal !== null && (
                          <span className="bg-stone-950/20 text-stone-950 px-1.5 py-0.2 rounded font-mono text-[11px]">
                            {scoreVal}%
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedStudentReport(st);
                      }}
                      className={`${hasSub ? '' : 'flex-1'} py-1.5 px-3 bg-slate-200 hover:bg-slate-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 min-h-[36px] group`}
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                      <span>වාර්තාව</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
