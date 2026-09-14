import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X } from 'lucide-react';
import type { User, PirivenaClass, Exam } from '../../../types';
import { triggerHaptic } from '../../../utils/haptics';
import { triggerUniversalPrint } from '../../../utils/printHelper';
import { resolveSubjectSinhalaName } from '../../../utils/subjectHelper';

interface SubmissionReviewModalProps {
  review: { submission: any; exam?: Exam } | null;
  user: User | null;
  studentClass: PirivenaClass | undefined;
  onClose: () => void;
  isSi: boolean;
  resolveStudentAnswer: (answersObj: any, q: any, qIdx: number) => any;
  isCorrectAnswerMatch: (studentAns: any, correctAns: any, q?: any) => boolean;
}

export const SubmissionReviewModal: React.FC<SubmissionReviewModalProps> = ({
  review,
  user,
  studentClass,
  onClose,
  isSi,
  resolveStudentAnswer,
  isCorrectAnswerMatch,
}) => {
  const cleanSubjectName = resolveSubjectSinhalaName(
    review?.exam?.subject ||
      review?.exam?.subjectId ||
      review?.submission?.subjectId ||
      review?.submission?.subject,
    undefined,
    review?.exam?.title || review?.submission?.examTitle
  );

  const modalContent = (
    <AnimatePresence>
      {review && (
        <div
          data-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print-container print:p-0 print:bg-white print:static select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 max-w-4xl w-full shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto my-auto text-stone-900 dark:text-stone-100 border border-amber-500/40 dark:border-stone-700 print-modal-content select-none mobile-bottom-sheet print:shadow-none print:border-none print:w-full print:rounded-none"
          >
        {/* Mobile Bottom Sheet Drag Indicator */}
        <div className="bottom-sheet-drag-handle sm:hidden -mt-1 mb-2" />

        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-amber-200/80 dark:border-stone-800 pb-3.5 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-inner ${
                  user?.monkStatus === 'monk'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border border-amber-400'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-400'
                }`}
              >
                {user?.monkStatus === 'monk'
                  ? isSi
                    ? '🪷 සාමණේර ශිෂ්‍ය හිමි'
                    : '🪷 MONASTIC SCHOLAR'
                  : isSi
                  ? '👤 ගිහි ශිෂ්‍යයා'
                  : '👤 LAY SCHOLAR'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                {user?.customId || user?.indexNumber || 'STD-2026-001'}
              </span>
              {studentClass && (
                <span className="text-xs font-serif font-bold text-amber-900 dark:text-amber-300">
                  • 🏛️ {studentClass.name}
                </span>
              )}
              {cleanSubjectName && (
                <span className="text-xs font-serif font-bold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                  📖 විෂය: {cleanSubjectName}
                </span>
              )}
            </div>

            <h3 className="font-serif font-bold text-lg sm:text-xl text-amber-950 dark:text-amber-100">
              {review.exam?.titleSinhala ||
                review.exam?.title ||
                (isSi ? 'විභාග පිළිතුරු පත්‍රය' : 'Examination Paper Review')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <span>{isSi ? 'ශිෂ්‍ය නාමය' : 'Student'}: </span>
              <strong className="text-slate-900 dark:text-white font-serif">
                {user?.name || user?.monkName || '—'}
              </strong>
              {review.submission?.submittedAt && (
                <span> • 📅 {review.submission.submittedAt.split('T')[0]}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 no-print shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerUniversalPrint(`විභාග_ප්‍රතිඵල_සමාලෝචනය_${review.exam?.title || 'Exam_Review'}`);
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-stone-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title={isSi ? 'පිළිතුරු පත්‍රය Print කරන්න' : 'Print answer sheet'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSi ? 'Print' : 'Print'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition active:scale-95"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {(() => {
          let rawQuestions =
            review.exam?.questions ||
            review.submission?.questions ||
            (review.exam as any)?.questionsJson ||
            [];

          if (typeof rawQuestions === 'string') {
            try {
              rawQuestions = JSON.parse(rawQuestions);
            } catch (e) {
              rawQuestions = [];
            }
          }

          const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
          const rawAnswers =
            review.submission?.answers ?? review.submission?.answersJson ?? {};

          let answersObj: any = {};
          if (typeof rawAnswers === 'string') {
            try {
              answersObj = JSON.parse(rawAnswers);
            } catch (e) {
              answersObj = {};
            }
          } else if (typeof rawAnswers === 'object' && rawAnswers !== null) {
            answersObj = rawAnswers;
          }

          let correctCount = 0;
          let incorrectCount = 0;
          let unansweredCount = 0;

          questions.forEach((q: any, idx: number) => {
            const studentAns = resolveStudentAnswer(answersObj, q, idx);
            const hasAnswered =
              studentAns !== undefined && studentAns !== null && studentAns !== '';
            if (!hasAnswered) {
              unansweredCount++;
            } else if (isCorrectAnswerMatch(studentAns, q.correctAnswer, q)) {
              correctCount++;
            } else {
              incorrectCount++;
            }
          });

          const totalQ = questions.length;
          const score =
            review.submission?.score ??
            (totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0);
          const passingMarks = review.exam?.passingMarks || 40;
          const isPassed = score >= passingMarks;

          return (
            <div className="space-y-4">
              {/* Score & Evaluation Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 dark:from-stone-900 dark:to-stone-850 border border-amber-300 dark:border-stone-700 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-400 uppercase block">
                    📊 {isSi ? 'ලබාගත් ලකුණු' : 'Final Score'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black font-mono text-amber-950 dark:text-amber-200">
                      {score}%
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        isPassed
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {isPassed ? (isSi ? 'සමර්ථයි' : 'Pass') : isSi ? 'අසමත්' : 'Fail'}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase block">
                    ✓ {isSi ? 'නිවැරදි පිළිතුරු' : 'Correct'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {correctCount}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      / {totalQ} {isSi ? 'ප්‍රශ්න' : 'Questions'}
                    </span>
                  </div>
                </div>

                <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800/60 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase block">
                    ✕ {isSi ? 'වැරදි පිළිතුරු' : 'Incorrect'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-rose-700 dark:text-rose-300">
                      {incorrectCount}
                    </span>
                    {unansweredCount > 0 && (
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                        ({isSi ? 'නොකළ' : 'Skipped'}: {unansweredCount})
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800/60 p-3 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase block">
                    🏆 {isSi ? 'ශ්‍රේණිය' : 'Grade'}
                  </span>
                  <span className="text-xs font-black mt-1 block text-blue-950 dark:text-blue-200 truncate">
                    {score >= 75
                      ? isSi
                        ? '🌟 විශිෂ්ට (Distinction)'
                        : 'Distinction (A)'
                      : score >= 65
                      ? isSi
                        ? '🥇 ඉතා හොඳ (Very Good)'
                        : 'Very Good (B)'
                      : score >= 50
                      ? isSi
                        ? '🥈 සම්මාන (Credit)'
                        : 'Credit Pass (C)'
                      : score >= 40
                      ? isSi
                        ? '🥉 සාමාන්‍ය (Pass)'
                        : 'Ordinary Pass (S)'
                      : isSi
                      ? '✕ නැවත පෙනී සිටිය යුතුයි'
                      : 'Re-Attempt'}
                  </span>
                </div>
              </div>

              {/* Teacher Feedback Note (if available) */}
              {(review.submission?.feedback ||
                (review.submission as any)?.teacherFeedback) && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                  <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span>👨‍🏫</span>
                    <span>
                      {isSi
                        ? 'ගුරුභවතුන්ගේ ඇගයීම් සටහන (Lecturer Comments):'
                        : 'Lecturer Feedback:'}
                    </span>
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 italic pl-5">
                    "{review.submission.feedback ||
                      (review.submission as any).teacherFeedback}"
                  </p>
                </div>
              )}

              {/* Complete Question Breakdown Strip */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-2">
                  <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📜</span>
                    <span>
                      {isSi
                        ? 'සම්පූර්ණ ප්‍රශ්න පත්‍රය සහ නිවැරදි පිළිතුරු විග්‍රහය'
                        : 'Complete Question Sheet & Answer Keys'}
                    </span>
                  </h4>
                  <span className="text-xs font-mono text-slate-500">
                    {isSi ? `මුළු ප්‍රශ්න: ${totalQ}` : `Total Questions: ${totalQ}`}
                  </span>
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-stone-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-stone-700 text-xs text-slate-500">
                    {isSi
                      ? 'ප්‍රශ්න පත්‍රයේ ප්‍රශ්න සොයාගත නොහැකි විය.'
                      : 'No questions found in this paper.'}
                  </div>
                ) : (
                  questions.map((q: any, qIdx: number) => {
                    const studentAns = resolveStudentAnswer(answersObj, q, qIdx);
                    const hasAnswered =
                      studentAns !== undefined && studentAns !== null && studentAns !== '';
                    const isCorrect =
                      hasAnswered && isCorrectAnswerMatch(studentAns, q.correctAnswer, q);
                    const marks = q.marks || 10;

                    return (
                      <div
                        key={`rev-q-${qIdx}`}
                        className={`p-4 rounded-2xl border transition space-y-3 ${
                          !hasAnswered
                            ? 'bg-slate-50 dark:bg-stone-850/60 border-slate-200 dark:border-stone-700'
                            : isCorrect
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-2xs'
                            : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60 shadow-2xs'
                        }`}
                      >
                        {/* Question Top Header */}
                        <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 dark:border-stone-750 pb-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100">
                                #{qIdx + 1}
                              </span>
                              {q.type && (
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                  {q.type}
                                </span>
                              )}
                            </div>
                            <h5 className="font-serif font-bold text-sm text-slate-900 dark:text-white leading-snug">
                              {q.text || q.question}
                            </h5>
                            {q.textSinhala && (
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {q.textSinhala}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800/50">
                              {isCorrect ? `+${marks}` : '+0'} / {marks} Marks
                            </span>
                            {!hasAnswered ? (
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-200 dark:bg-stone-700 px-2 py-0.5 rounded-full">
                                ⚪ {isSi ? 'නොකළ ප්‍රශ්නයකි' : 'Unanswered'}
                              </span>
                            ) : isCorrect ? (
                              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-200/80 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full border border-emerald-400">
                                ✓ {isSi ? 'නිවැරදි පිළිතුරකි' : 'Correct'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-800 dark:text-rose-200 bg-rose-200/80 dark:bg-rose-900/80 px-2 py-0.5 rounded-full border border-rose-400">
                                ✕ {isSi ? 'වැරදි පිළිතුරකි' : 'Incorrect'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Multiple Choice Options View */}
                        {(q.type === 'mcq' || (Array.isArray(q.options) && q.options.length > 0)) &&
                          q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                              {q.options.map((opt: string, oIdx: number) => {
                                const isStudentSelected = (() => {
                                  if (!hasAnswered) return false;
                                  if (typeof studentAns === 'number') return studentAns === oIdx;
                                  const s = String(studentAns).trim().toLowerCase();
                                  if (s === String(oIdx)) return true;
                                  if (oIdx === 0 && (s === 'a' || s === 'opt a' || s === 'option a')) return true;
                                  if (oIdx === 1 && (s === 'b' || s === 'opt b' || s === 'option b')) return true;
                                  if (oIdx === 2 && (s === 'c' || s === 'opt c' || s === 'option c')) return true;
                                  if (oIdx === 3 && (s === 'd' || s === 'opt d' || s === 'option d')) return true;
                                  return s === opt.trim().toLowerCase();
                                })();

                                const isCorrectOpt = (() => {
                                  if (
                                    q.correctAnswer === undefined ||
                                    q.correctAnswer === null ||
                                    q.correctAnswer === ''
                                  )
                                    return false;
                                  if (typeof q.correctAnswer === 'number') return q.correctAnswer === oIdx;
                                  const c = String(q.correctAnswer).trim().toLowerCase();
                                  if (c === String(oIdx)) return true;
                                  if (oIdx === 0 && (c === 'a' || c === 'opt a' || c === 'option a')) return true;
                                  if (oIdx === 1 && (c === 'b' || c === 'opt b' || c === 'option b')) return true;
                                  if (oIdx === 2 && (c === 'c' || c === 'opt c' || c === 'option c')) return true;
                                  if (oIdx === 3 && (c === 'd' || c === 'opt d' || c === 'option d')) return true;
                                  return c === opt.trim().toLowerCase();
                                })();

                                return (
                                  <div
                                    key={`opt-${oIdx}`}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                                      isCorrectOpt && isStudentSelected
                                        ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-2xs ring-1 ring-emerald-400'
                                        : isStudentSelected && !isCorrectOpt
                                        ? 'bg-rose-100 dark:bg-rose-950/70 border-rose-500 text-rose-950 dark:text-rose-100 font-bold shadow-2xs ring-1 ring-rose-400'
                                        : isCorrectOpt
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-semibold'
                                        : 'bg-white/80 dark:bg-stone-800/80 border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span className="truncate">{opt}</span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold">
                                      {isCorrectOpt && isStudentSelected ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white shadow-2xs">
                                          ✓ {isSi ? 'ඔබගේ නිවැරදි තේරීම' : 'Your Choice (Correct)'}
                                        </span>
                                      ) : isStudentSelected ? (
                                        <span className="px-2 py-0.5 rounded-full bg-rose-700 text-white shadow-2xs">
                                          ✕ {isSi ? 'ඔබගේ තේරීම' : 'Your Choice'}
                                        </span>
                                      ) : isCorrectOpt ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-400">
                                          ✓ {isSi ? 'නිවැරදි පිළිතුර' : 'Correct Answer'}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        {/* True / False Answers View */}
                        {q.type === 'true_false' && (
                          <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold pt-1">
                            {['True', 'False'].map((tfVal) => {
                              const isTfTrue = tfVal === 'True';
                              const isChosen =
                                studentAns === isTfTrue ||
                                String(studentAns).toLowerCase() === tfVal.toLowerCase() ||
                                (isTfTrue
                                  ? studentAns === 1 || studentAns === '1'
                                  : studentAns === 0 || studentAns === '0');
                              const isCorrectTf =
                                q.correctAnswer === isTfTrue ||
                                String(q.correctAnswer).toLowerCase() === tfVal.toLowerCase() ||
                                (isTfTrue
                                  ? q.correctAnswer === 1 || q.correctAnswer === '1'
                                  : q.correctAnswer === 0 || q.correctAnswer === '0');

                              return (
                                <div
                                  key={`tf-${tfVal}`}
                                  className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${
                                    isCorrectTf && isChosen
                                      ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold'
                                      : isChosen && !isCorrectTf
                                      ? 'bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-950 dark:text-rose-100 font-bold'
                                      : isCorrectTf
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200 font-semibold'
                                      : 'bg-white dark:bg-stone-800 border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <span>
                                    [{' '}
                                    {isChosen ? '✓' : '  '}{' '}
                                    ]{' '}
                                    {tfVal === 'True'
                                      ? isSi
                                        ? 'සත්‍ය (True)'
                                        : 'True'
                                      : isSi
                                      ? 'අසත්‍ය (False)'
                                      : 'False'}
                                  </span>
                                  {isChosen && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded text-white ${
                                        isCorrectTf ? 'bg-emerald-700' : 'bg-rose-700'
                                      }`}
                                    >
                                      {isCorrectTf
                                        ? isSi
                                          ? 'නිවැරදියි'
                                          : 'Correct'
                                        : isSi
                                        ? 'ඔබගේ තේරීම'
                                        : 'Your Choice'}
                                    </span>
                                  )}
                                  {!isChosen && isCorrectTf && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-400">
                                      ✓ {isSi ? 'නිවැරදි පිළිතුර' : 'Correct Answer'}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Short Answer / Structured Essay View */}
                        {q.type !== 'mcq' &&
                          q.type !== 'true_false' &&
                          (!Array.isArray(q.options) || q.options.length === 0) && (
                            <div className="space-y-2 pt-1 text-xs">
                              <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 space-y-1">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                  ✍️ {isSi ? 'ඔබ සැපයූ පිළිතුර' : 'Your Submitted Answer'}:
                                </span>
                                <p className="font-serif text-slate-900 dark:text-white pl-2 whitespace-pre-wrap">
                                  {studentAns ||
                                    (isSi ? '(පිළිතුරක් සපයා නැත)' : '(No answer submitted)')}
                                </p>
                              </div>

                              {(q.correctAnswer || q.answer) && (
                                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 space-y-1">
                                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                                    🔑 {isSi ? 'ආදර්ශ / නිවැරදි පිළිතුර' : 'Model / Correct Answer'}:
                                  </span>
                                  <p className="font-serif pl-2 whitespace-pre-wrap">
                                    {q.correctAnswer || q.answer}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Explanation Box */}
                        {(q.explanation || q.hint) && (
                          <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs space-y-1">
                            <span className="font-bold flex items-center gap-1">
                              <span>💡</span>
                              <span>
                                {isSi
                                  ? 'විවරණය සහ පැහැදිලි කිරීම (Explanation):'
                                  : 'Explanation & Notes:'}
                              </span>
                            </span>
                            <p className="pl-4 font-serif text-[11.5px] leading-relaxed">
                              {q.explanation || q.hint}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 dark:border-stone-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            {isSi ? 'වසන්න (Close)' : 'Close'}
          </button>
        </div>
      </motion.div>
      </div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
