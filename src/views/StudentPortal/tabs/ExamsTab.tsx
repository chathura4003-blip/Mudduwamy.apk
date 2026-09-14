import React from 'react';
import { FileText, Award, Play, CheckCircle2, BookOpen, Clock, Check, ChevronRight, BarChart3 } from 'lucide-react';
import type { Exam, Subject } from '../../../types';
import { triggerHaptic } from '../../../utils/haptics';
import { resolveSubjectSinhalaName } from '../../../utils/subjectHelper';

interface ExamsTabProps {
  activeUnattemptedExams: Exam[];
  completedSubmissions: any[];
  exams: Exam[];
  subjects?: Subject[];
  studentPerformance: {
    totalAttempted: number;
    avgScore: number;
    highestScore: number;
    passedRate: number;
  };
  setActiveExam: (exam: Exam) => void;
  setViewingSubmissionReview: (review: { submission: any; exam?: Exam }) => void;
  switchSubTab: (tab: any) => void;
  activeSubTab: 'exams' | 'results';
  isSi: boolean;
}

export const ExamsTab: React.FC<ExamsTabProps> = ({
  activeUnattemptedExams,
  completedSubmissions,
  exams,
  subjects = [],
  studentPerformance,
  setActiveExam,
  setViewingSubmissionReview,
  switchSubTab,
  activeSubTab,
  isSi,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in select-none">
      {/* ========================================================= */}
      {/* 📝 SECTION 1: ACTIVE / UPCOMING ONLINE EXAMS               */}
      {/* ========================================================= */}
      {activeSubTab === 'exams' && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <FileText className="w-5 h-5 animate-icon-pulse-glow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-serif font-black text-slate-900 dark:text-white">
                    {isSi ? 'මාර්ගගත විභාග සහ පරීක්ෂණ' : 'Online Examinations'}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-800 dark:text-purple-300 font-mono font-bold text-xs rounded-full border border-purple-500/30">
                    {activeUnattemptedExams.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isSi ? 'නියමිත කාල සීමාව තුළ පිළිතුරු සපයා Submit කරන්න' : 'Attempt your assigned class tests'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                switchSubTab('results');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-200 dark:border-stone-700 shadow-2xs active:scale-95"
            >
              {isSi ? '🏆 පෙර ප්‍රතිඵල බලන්න' : 'View Past Results'}
            </button>
          </div>

          {activeUnattemptedExams.length === 0 ? (
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300/80 dark:border-emerald-800/60 rounded-3xl p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8 animate-icon-bounce" />
              </div>
              <div>
                <h3 className="font-serif font-black text-emerald-950 dark:text-emerald-100 text-base">
                  {isSi ? 'සියලුම විභාග සාර්ථකව නිමකර ඇත!' : 'All Assigned Exams Completed!'}
                </h3>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-1">
                  {isSi ? 'නව විභාගයක් එක් කළ විට මෙහි දිස්වනු ඇත' : 'New tests will appear here once scheduled'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  switchSubTab('results');
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95 inline-flex items-center gap-1.5"
              >
                <Award className="w-4 h-4 animate-icon-sparkle" />
                <span>{isSi ? 'ප්‍රතිඵල සහ ලකුණු බලන්න' : 'View Results & Scores'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeUnattemptedExams.map((exam) => {
                const cleanSubj = resolveSubjectSinhalaName(exam.subject || exam.subjectId, subjects, exam.title);

                return (
                  <div
                    key={exam.id}
                    className="bg-white dark:bg-stone-850 border border-slate-200/90 dark:border-stone-700/80 hover:border-purple-500 dark:hover:border-purple-500 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3.5 transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-800 dark:text-purple-300 font-bold text-[10px] rounded-md border border-purple-500/30">
                          📖 {cleanSubj}
                        </span>
                        <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-bold rounded-md border border-rose-200 dark:border-rose-800">
                          1-TIME ATTEMPT
                        </span>
                      </div>

                      <h3 className="font-serif font-black text-base text-slate-900 dark:text-white leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {exam.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{exam.durationMinutes} mins</span>
                        </span>
                        <span>•</span>
                        <span>Total: {exam.totalMarks}</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Pass: {exam.passingMarks}%</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('medium');
                        setActiveExam(exam);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/20 active:scale-95 group"
                    >
                      <Play className="w-4 h-4 fill-current text-purple-200 group-hover:scale-125 transition-transform" />
                      <span>{isSi ? 'විභාගය ආරම්භ කරන්න (Start Exam)' : 'Start Examination'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 🏆 SECTION 2: EXAM RESULTS & COMPLETED REVIEWS            */}
      {/* ========================================================= */}
      {activeSubTab === 'results' && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <Award className="w-5 h-5 animate-icon-sparkle" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif font-black text-slate-900 dark:text-white">
                  {isSi ? 'විභාග ප්‍රතිඵල සහ පිළිතුරු විග්‍රහ' : 'Exam Results & Analysis'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isSi ? 'ඔබ සම්පූර්ණ කළ සියලුම විභාග සහ ලකුණු' : 'Past submitted answer sheets & review'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                switchSubTab('exams');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-200 dark:border-stone-700 shadow-2xs active:scale-95"
            >
              {isSi ? '📝 ක්‍රියාකාරී විභාග' : 'Active Exams'}
            </button>
          </div>

          {/* Performance Summary Banner */}
          {completedSubmissions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-stone-850 dark:to-stone-800 p-4 rounded-2xl border border-slate-200/90 dark:border-stone-700/80 shadow-2xs">
              <div className="text-center space-y-1 p-2 bg-white/70 dark:bg-stone-900/60 rounded-xl border border-slate-100 dark:border-stone-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">{isSi ? 'විභාග ගණන' : 'Total Tests'}</span>
                <p className="text-xl font-mono font-black text-slate-900 dark:text-white">{studentPerformance.totalAttempted}</p>
              </div>
              <div className="text-center space-y-1 p-2 bg-white/70 dark:bg-stone-900/60 rounded-xl border border-slate-100 dark:border-stone-800">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase">{isSi ? 'සාමාන්‍ය ලකුණු' : 'Avg Score'}</span>
                <p className="text-xl font-mono font-black text-amber-600 dark:text-amber-400">{studentPerformance.avgScore}%</p>
              </div>
              <div className="text-center space-y-1 p-2 bg-white/70 dark:bg-stone-900/60 rounded-xl border border-slate-100 dark:border-stone-800">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">{isSi ? 'ඉහළම ලකුණු' : 'Highest'}</span>
                <p className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">{studentPerformance.highestScore}%</p>
              </div>
              <div className="text-center space-y-1 p-2 bg-white/70 dark:bg-stone-900/60 rounded-xl border border-slate-100 dark:border-stone-800">
                <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold uppercase">{isSi ? 'සමර්ථ ප්‍රතිශතය' : 'Pass Rate'}</span>
                <p className="text-xl font-mono font-black text-indigo-600 dark:text-indigo-400">{studentPerformance.passedRate}%</p>
              </div>
            </div>
          )}

          {completedSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-stone-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-stone-700 space-y-2">
              <Award className="w-10 h-10 text-slate-400 mx-auto animate-icon-sparkle" />
              <h3 className="font-serif font-bold text-slate-900 dark:text-white text-sm">
                {isSi ? 'තවමත් ප්‍රතිඵල වාර්තා නොමැත' : 'No Completed Exams Found'}
              </h3>
              <p className="text-xs text-slate-400">
                {isSi ? 'විභාගයකට පිළිතුරු සැපයීමෙන් පසු ප්‍රතිඵල මෙහි දිස්වේ' : 'Submit answers to see graded score sheets'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {completedSubmissions.map((sub: any) => {
                const examObj = exams.find((e) => e.id === sub.examId);
                const isPassed = (sub.score || 0) >= (examObj?.passingMarks || 40);
                const cleanSubj = resolveSubjectSinhalaName(
                  examObj?.subject || examObj?.subjectId || sub.subjectId || sub.subject,
                  subjects,
                  examObj?.title || sub.examTitle
                );

                return (
                  <div
                    key={sub.id}
                    className="bg-white dark:bg-stone-850 border border-slate-200/90 dark:border-stone-700/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 hover:shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block px-2 py-0.5 mb-1 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold text-[10px] rounded border border-purple-200 dark:border-purple-800">
                          📖 {cleanSubj}
                        </span>
                        <h4 className="font-serif font-black text-sm text-slate-900 dark:text-white leading-snug">
                          {examObj?.title || sub.examTitle || (isSi ? 'විභාග පත්‍රය' : 'Exam Paper')}
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 border ${
                          isPassed
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {isPassed ? (isSi ? '✓ සමර්ථයි' : 'PASSED') : 'RE-ATTEMPT'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                      <span>
                        {isSi ? 'ලබාගත් ලකුණු' : 'Score'}:{' '}
                        <strong className="text-emerald-700 dark:text-emerald-300 font-black text-base">
                          {sub.score}%
                        </strong>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{sub.submittedAt?.split('T')[0]}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setViewingSubmissionReview({ submission: sub, exam: examObj });
                      }}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 group"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                      <span>{isSi ? 'පිළිතුරු පත්‍රය සහ විග්‍රහය බලන්න' : 'View Graded Answer Paper'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
