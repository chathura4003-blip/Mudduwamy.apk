import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Plus,
  Edit3,
  Copy,
  Printer,
  Trash2,
  Activity,
  Layers,
} from 'lucide-react';
import type { Exam, PirivenaClass, Subject, User } from '../../../types';
import { triggerHaptic } from '../../../utils/haptics';
import { playNotificationSound } from '../../../utils/soundHelper';
import { resolveSubjectSinhalaName, resolveClassSinhalaName } from '../../../utils/subjectHelper';

interface ExamsTabProps {
  assignedExams: Exam[];
  classes: PirivenaClass[];
  subjects: Subject[];
  openCreateExamModal: () => void;
  handleTogglePublish: (exam: Exam) => void;
  openEditExamModal: (exam: Exam) => void;
  handleDuplicateExam: (exam: Exam) => void;
  setPrintablePaper: (exam: Exam) => void;
  setCustomPaperTitle: (title: string) => void;
  setCustomInstituteHeader: (header: string) => void;
  setCustomInstituteEnglish: (english: string) => void;
  user: User | null;
  deletingExamId: string | null;
  setDeletingExamId: (id: string | null) => void;
  handleDeleteExam: (id: string) => void;
  setSelectedExamId: (id: string) => void;
  setActiveTab: (tab: 'overview' | 'monitoring' | 'roster' | 'exams' | 'materials') => void;
}

export const ExamsTab: React.FC<ExamsTabProps> = ({
  assignedExams,
  classes,
  subjects,
  openCreateExamModal,
  handleTogglePublish,
  openEditExamModal,
  handleDuplicateExam,
  setPrintablePaper,
  setCustomPaperTitle,
  setCustomInstituteHeader,
  setCustomInstituteEnglish,
  user,
  deletingExamId,
  setDeletingExamId,
  handleDeleteExam,
  setSelectedExamId,
  setActiveTab,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 sm:space-y-5 pb-12 select-none"
    >
      {/* ========================================================= */}
      {/* 📱 1. CLEAN TOP BAR: TITLE & CREATE EXAM BUTTON           */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-[#2a0c04] via-[#381307] to-[#1e0701] text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-black text-base sm:text-lg text-white tracking-tight">
              විභාග කළමනාකරණය
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
              {assignedExams.length} ප්‍රශ්න පත්‍ර
            </span>
          </div>
          <p className="text-[11px] text-amber-200/80">
            ප්‍රශ්න පත්‍ර නිර්මාණය, සංස්කරණය සහ මුද්‍රණය
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            playNotificationSound();
            openCreateExamModal();
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 min-h-[42px] group"
        >
          <Plus className="w-4 h-4 text-stone-950 animate-icon-pulse-glow group-hover:rotate-90 transition-transform duration-300" />
          <span>+ නව ප්‍රශ්න පත්‍රයක් හදන්න</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 📱 2. CREATED EXAM PAPERS LIST                            */}
      {/* ========================================================= */}
      {assignedExams.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-slate-200 dark:border-stone-800 space-y-3 p-6">
          <BookOpen className="w-10 h-10 text-amber-600/50 mx-auto animate-icon-float" />
          <div className="space-y-1">
            <h3 className="font-serif font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base">
              තවමත් ප්‍රශ්න පත්‍ර සකසා නැත
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              ඉහත "නව ප්‍රශ්න පත්‍රයක් හදන්න" බොත්තමෙන් AI Vision හෝ Manual ක්‍රමයට ප්‍රශ්න පත්‍ර සාදන්න.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {assignedExams.map((e, idx) => {
            const targetClass = classes.find((c) => c.id === e.classId || c.code === e.classId || c.name === e.classId || c.nameSinhala === e.classId);
            const targetSubj = subjects.find((s) => s.id === e.subjectId || s.code === e.subjectId || s.name === e.subjectId || s.nameSinhala === e.subjectId);
            const cleanClass = targetClass?.nameSinhala || targetClass?.name || resolveClassSinhalaName(e.classId);
            const cleanSubj = targetSubj?.nameSinhala || targetSubj?.name || resolveSubjectSinhalaName(e.subjectId);

            return (
              <div
                key={`exam-card-${e.id || idx}`}
                className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 p-4 rounded-3xl transition shadow-2xs space-y-3.5 flex flex-col justify-between"
              >
                {/* Card Top: Publish Toggle & ID */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        handleTogglePublish(e);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider transition border flex items-center gap-1 cursor-pointer active:scale-95 ${e.published
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                          : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                        }`}
                      title="Click to toggle Published status"
                    >
                      {e.published ? '✓ PUBLISHED' : '⏸ DRAFT (කෙටුම්පත)'}
                    </button>

                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      #{e.id}
                    </span>
                  </div>

                  {/* Exam Title */}
                  <div>
                    <h4 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      {e.title}
                    </h4>
                    {e.titleSinhala && e.titleSinhala !== e.title && (
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mt-0.5">
                        {e.titleSinhala}
                      </p>
                    )}
                  </div>

                  {/* Metadata Attribute Badges */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold pt-0.5">
                    <span className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-stone-700">
                      🏫 {cleanClass}
                    </span>
                    <span className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-stone-700">
                      📚 {cleanSubj}
                    </span>
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      ⏱️ {e.durationMinutes} Mins
                    </span>
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      🎯 Pass: {e.passingMarks}%
                    </span>
                  </div>

                  {/* Questions & Marks Summary */}
                  <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-stone-800/80 p-2.5 rounded-2xl border border-slate-200/80 dark:border-stone-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-amber-500 animate-icon-float" />
                      <span>ප්‍රශ්න: <strong>{e.questions?.length || 0}</strong></span>
                    </span>
                    <span>
                      මුළු ලකුණු: <strong className="text-amber-600 dark:text-amber-400">{e.totalMarks || 100}</strong>
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons Hub */}
                <div className="pt-2 border-t border-slate-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                  {/* Left Actions: Edit, Copy, Print, Delete */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        openEditExamModal(e);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95 min-h-[34px] group"
                      title="සංස්කරණය කරන්න"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:rotate-12 transition-transform" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        handleDuplicateExam(e);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95 min-h-[34px] group"
                      title="පිටපත් කරන්න"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform" />
                      <span>Copy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setPrintablePaper(e);
                        setCustomPaperTitle(e.titleSinhala || e.title);
                        setCustomInstituteHeader(
                          (user as any)?.institution ||
                          (user as any)?.schoolName ||
                          'ශ්‍රී සුමන මහා පිරිවෙන - මුද්දුව, රත්නපුර'
                        );
                        setCustomInstituteEnglish('Sri Sumana Maha Pirivena - Mudduwa, Ratnapura');
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95 min-h-[34px] group"
                      title="මුද්‍රණය කරන්න"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform" />
                      <span>Print</span>
                    </button>

                    {/* Delete Button / Inline Confirmation */}
                    {deletingExamId === e.id ? (
                      <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950 p-1 rounded-xl border border-rose-300 dark:border-rose-800">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('heavy');
                            handleDeleteExam(e.id);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition active:scale-95"
                        >
                          මකන්න
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingExamId(null)}
                          className="px-1.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold text-xs"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setDeletingExamId(e.id);
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200/60 dark:border-rose-900/60 transition cursor-pointer active:scale-95 min-h-[34px] flex items-center justify-center group"
                        title="විභාගය මකන්න"
                      >
                        <Trash2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                      </button>
                    )}
                  </div>

                  {/* Right Action: Live Monitor */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setSelectedExamId(e.id);
                      setActiveTab('monitoring');
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 min-h-[34px] group"
                  >
                    <Activity className="w-3.5 h-3.5 text-stone-950 animate-icon-heartbeat" />
                    <span>සජීවී අධීක්ෂණය</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
