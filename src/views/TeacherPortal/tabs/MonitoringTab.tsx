import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart2,
  RefreshCw,
  Eye,
  Printer,
  Users,
  Search,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import type { Exam } from '../../../types';
import { handleAvatarError, getImageUrl } from '../../../utils/imageHelper';
import { triggerHaptic } from '../../../utils/haptics';
import { playNotificationSound } from '../../../utils/soundHelper';
import { invalidateCache } from '../../../utils/dataCache';

interface MonitoringTabProps {
  teacherExams: Exam[];
  selectedExamId: string;
  setSelectedExamId: (id: string) => void;
  setShowClassReportModal: (show: boolean) => void;
  fetchExamMonitoring: (examId: string) => void;
  handleDeleteSelectedExam: () => void;
  monitoringData: any;
  handleOpenSubmissionModal: (st: any) => void;
  setSelectedStudentReport: (st: any) => void;
}

export const MonitoringTab: React.FC<MonitoringTabProps> = ({
  teacherExams,
  selectedExamId,
  setSelectedExamId,
  setShowClassReportModal,
  fetchExamMonitoring,
  handleDeleteSelectedExam,
  monitoringData,
  handleOpenSubmissionModal,
  setSelectedStudentReport,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'in_progress' | 'pending'>('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleManualRefresh = () => {
    triggerHaptic('medium');
    playNotificationSound();
    setIsRefreshing(true);
    invalidateCache('/api/exams');
    if (selectedExamId) {
      fetchExamMonitoring(selectedExamId);
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const rawStudentList: any[] = monitoringData?.studentStatuses || [];
  const passingMarks = Number(monitoringData?.exam?.passingMarks) || 40;

  // Filtered Student List
  const filteredStudents = useMemo(() => {
    return rawStudentList.filter((st: any) => {
      const hasSub = Boolean(st.submission || st.status === 'completed' || st.status === 'graded' || st.status === 'submitted');
      const scoreVal = st.score !== null && st.score !== undefined ? Number(st.score) : (st.submission?.score !== undefined ? Number(st.submission?.score) : null);
      const isPassed = scoreVal !== null && scoreVal >= passingMarks;

      if (statusFilter === 'passed' && (!hasSub || !isPassed)) return false;
      if (statusFilter === 'failed' && (!hasSub || isPassed)) return false;
      if (statusFilter === 'in_progress' && st.status !== 'in_progress') return false;
      if (statusFilter === 'pending' && (hasSub || st.status === 'in_progress')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = String(st.name || '').toLowerCase();
        const monkName = String(st.monkName || '').toLowerCase();
        const customId = String(st.customId || st.id || '').toLowerCase();
        return name.includes(q) || monkName.includes(q) || customId.includes(q);
      }

      return true;
    });
  }, [rawStudentList, statusFilter, searchQuery, passingMarks]);

  // Quick Stats
  const stats = useMemo(() => {
    const total = rawStudentList.length;
    const completed = rawStudentList.filter((s: any) => Boolean(s.submission || s.status === 'completed' || s.status === 'graded' || s.status === 'submitted')).length;
    const pending = total - completed;
    const scores = rawStudentList
      .map((s: any) => (s.score !== null && s.score !== undefined ? Number(s.score) : (s.submission?.score !== undefined ? Number(s.submission?.score) : null)))
      .filter((s): s is number => s !== null);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const passed = scores.filter((s) => s >= passingMarks).length;
    const passRate = scores.length > 0 ? Math.round((passed / scores.length) * 100) : 0;

    return { total, completed, pending, avg, passRate };
  }, [rawStudentList, passingMarks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 sm:space-y-5 pb-12 select-none"
    >
      {/* ========================================================= */}
      {/* 📱 1. CLEAN TOP HERO: EXAM SELECTOR & LIVE SYNC          */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-[#2a0c04] via-[#381307] to-[#1e0701] text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-amber-500/40 space-y-3.5">
        {/* Top Title Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <h2 className="font-serif font-black text-base sm:text-lg text-white tracking-tight">
              සජීවී විභාග අධීක්ෂණය
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/40">
              LIVE
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setShowClassReportModal(true);
              }}
              disabled={!monitoringData}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 min-h-[38px] group"
            >
              <BarChart2 className="w-4 h-4 text-stone-950 animate-icon-pulse-glow group-hover:scale-125 transition-transform" />
              <span>පන්ති වාර්තාව</span>
            </button>

            <button
              type="button"
              onClick={handleManualRefresh}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition cursor-pointer active:scale-95 min-h-[38px] flex items-center justify-center group"
              title="යාවත්කාලීන කරන්න"
            >
              <RefreshCw className={`w-4 h-4 text-amber-300 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                handleDeleteSelectedExam();
              }}
              disabled={!selectedExamId}
              className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-rose-400/30 transition cursor-pointer active:scale-95 disabled:opacity-50 min-h-[38px] flex items-center justify-center group"
              title="විභාගය මකන්න"
            >
              <Trash2 className="w-4 h-4 text-rose-400 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>

        {/* Clean Exam Dropdown */}
        <div className="relative">
          <select id="monitoringtab-select-1" name="monitoringtab-select-1"
            value={selectedExamId}
            onChange={(e) => {
              triggerHaptic('light');
              setSelectedExamId(e.target.value);
            }}
            className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl border border-amber-400/50 text-xs sm:text-sm font-bold text-amber-100 bg-stone-900/90 focus:ring-2 focus:ring-amber-500 shadow-inner appearance-none cursor-pointer"
          >
            {teacherExams.map((e, idx) => {
              const extraGrade = (e as any).gradeLevel || (e as any).className || '';
              return (
                <option key={`texam-opt-${e.id || idx}`} value={e.id} className="bg-stone-900 text-white py-1">
                  {e.title} {extraGrade ? `(${extraGrade})` : ''}
                </option>
              );
            })}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-amber-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!monitoringData && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-8 text-center space-y-2 shadow-xs">
          <RefreshCw className="w-6 h-6 text-amber-600 animate-spin mx-auto" />
          <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
            විභාග දත්ත ලබා ගනිමින් පවතී...
          </p>
        </div>
      )}

      {/* ========================================================= */}
      {/* 📊 2. FOUR CLEAN KPI CARDS (2x2 GRID)                     */}
      {/* ========================================================= */}
      {monitoringData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Total */}
          <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 p-3 sm:p-4 rounded-2xl shadow-xs text-center space-y-0.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
              මුළු අපේක්ෂකයින්
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {stats.total}
            </span>
          </div>

          {/* Card 2: Submitted */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-3 sm:p-4 rounded-2xl shadow-xs text-center space-y-0.5">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block">
              ලියා අවසන්
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {stats.completed}
            </span>
          </div>

          {/* Card 3: Pending */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 p-3 sm:p-4 rounded-2xl shadow-xs text-center space-y-0.5">
            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold uppercase block">
              නොලියූ
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">
              {stats.pending}
            </span>
          </div>

          {/* Card 4: Class Average */}
          <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 p-3 sm:p-4 rounded-2xl shadow-xs text-center space-y-0.5">
            <span className="text-[10px] text-purple-800 dark:text-purple-300 font-bold uppercase block">
              සාමාන්‍ය ලකුණ
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-400 font-mono">
              {stats.avg}%
            </span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 👥 3. CANDIDATES LIST & SMART TOUCH CONTROLS              */}
      {/* ========================================================= */}
      {monitoringData && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white">
                ශිෂ්‍ය ලැයිස්තුව & ලකුණු
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              {filteredStudents.length} Students
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input id="monitoringtab-input-2" name="monitoringtab-input-2"
              type="text"
              placeholder="ශිෂ්‍ය නම හෝ අංකයෙන් සොයන්න..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800/60 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
            {[
              { id: 'all', label: 'සියල්ල' },
              { id: 'passed', label: '✓ සමත්' },
              { id: 'failed', label: '✕ අසමත්' },
              { id: 'in_progress', label: '⏳ ලියමින් පවතී' },
              { id: 'pending', label: '⏸️ නොලියූ' },
            ].map((f) => (
              <button
                key={`flt-${f.id}`}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setStatusFilter(f.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer active:scale-95 ${
                  statusFilter === f.id
                    ? 'bg-amber-500 text-stone-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Student Cards List */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-stone-700 text-xs text-slate-500">
              ගැළපෙන ශිෂ්‍යයින් කිසිවෙක් හමු නොවීය.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredStudents.map((st: any, idx: number) => {
                const hasSub = Boolean(st.submission || st.status === 'completed' || st.status === 'graded' || st.status === 'submitted');
                const scoreVal = st.score !== null && st.score !== undefined ? Number(st.score) : (st.submission?.score !== undefined ? Number(st.submission?.score) : null);
                const isPassed = scoreVal !== null && scoreVal >= passingMarks;

                return (
                  <div
                    key={`cand-card-${st.id || idx}`}
                    className="bg-slate-50/80 dark:bg-stone-800/60 hover:bg-white dark:hover:bg-stone-800 border border-slate-200/80 dark:border-stone-700 p-3 sm:p-3.5 rounded-2xl transition shadow-2xs space-y-2.5"
                  >
                    {/* Top Row: Avatar, Name, Status & Score */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-amber-200 dark:bg-stone-700 flex items-center justify-center font-bold text-amber-950 dark:text-amber-200 text-sm shrink-0 overflow-hidden border border-amber-400/40">
                          {st.avatar ? (
                            <img
                              src={getImageUrl(st.avatar)}
                              alt={st.name}
                              className="w-full h-full object-cover"
                              onError={handleAvatarError}
                            />
                          ) : st.monkStatus === 'monk' ? (
                            '🪷'
                          ) : (
                            '👤'
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-serif font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {st.monkStatus === 'monk' && st.monkName ? st.monkName : (st.name || st.monkName || 'ශිෂ්‍ය නාමය')}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            #{st.customId || st.id}
                          </span>
                        </div>
                      </div>

                      {/* Score / Status Pill */}
                      <div className="shrink-0 text-right">
                        {hasSub ? (
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border inline-block ${
                              isPassed
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            {scoreVal !== null ? `${scoreVal}%` : '—'} {isPassed ? '✓ සමත්' : '✕ අසමත්'}
                          </span>
                        ) : st.status === 'in_progress' ? (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 animate-pulse inline-block">
                            ⏳ ලියමින් පවතී
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-600 inline-block">
                            ⏸️ නොලියූ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-stone-700/60">
                      {hasSub && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            handleOpenSubmissionModal(st);
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 min-h-[36px]"
                        >
                          <Eye className="w-3.5 h-3.5 text-stone-950" />
                          <span>පිළිතුරු බලන්න</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setSelectedStudentReport(st);
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 min-h-[36px]"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>වාර්තාව</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
