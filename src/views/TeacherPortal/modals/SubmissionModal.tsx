import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, FileCheck } from 'lucide-react';
import type { MonitoringData } from '../types';
import { triggerUniversalPrint } from '../../../utils/printHelper';

interface SubmissionModalProps {
  submission: any | null;
  monitoringData: MonitoringData | null;
  onClose: () => void;
  manualScoreInput: string;
  setManualScoreInput: (val: string) => void;
  teacherFeedbackInput: string;
  setTeacherFeedbackInput: (val: string) => void;
  handleSaveTeacherFeedback: () => void;
  isSavingFeedback: boolean;
  feedbackSaveSuccess: boolean;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  submission,
  monitoringData,
  onClose,
  manualScoreInput,
  setManualScoreInput,
  teacherFeedbackInput,
  setTeacherFeedbackInput,
  handleSaveTeacherFeedback,
  isSavingFeedback,
  feedbackSaveSuccess,
}) => {
  const modalContent = (
    <AnimatePresence>
      {submission && (
        <div
          data-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto print-container print:p-0 print:bg-white print:static select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 max-w-3xl w-full border border-amber-500/30 dark:border-stone-800 shadow-2xl space-y-5 my-auto max-h-[90vh] overflow-y-auto print-modal-content mobile-bottom-sheet print:shadow-none print:border-none print:w-full print:rounded-none"
          >
            {/* Mobile Bottom Sheet Drag Indicator */}
            <div className="bottom-sheet-drag-handle sm:hidden no-print" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-amber-200 dark:border-stone-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${submission.monkStatus === 'monk' ? 'bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'}`}
              >
                {submission.monkStatus === 'monk' ? '🪷 MONASTIC SAMANERA' : 'LAY SCHOLAR'}
              </span>
              <span className="text-xs font-mono text-stone-500 dark:text-stone-400 font-bold">
                {submission.customId}
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl text-amber-950 dark:text-amber-100">
              {submission.monkName || submission.name}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Examination Paper Submission:{' '}
              <strong className="text-amber-950 dark:text-amber-200">
                {submission?.exam?.titleSinhala ||
                  submission?.exam?.title ||
                  monitoringData?.exam?.titleSinhala ||
                  monitoringData?.exam?.title ||
                  'විභාග ප්‍රශ්න පත්‍රය'}
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={() => {
                triggerUniversalPrint(`විභාග_පිළිතුරු_පත්‍රය_${submission.studentName || 'Exam'}`);
              }}
              className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl border border-stone-300 dark:border-stone-700 transition flex items-center gap-1.5 cursor-pointer min-h-[38px]"
            >
              <Printer className="w-4 h-4 text-stone-700 dark:text-stone-300" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-stone-400 hover:text-amber-950 dark:hover:text-amber-200 flex items-center justify-center cursor-pointer shrink-0 active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score & Status Summary Banner with Comprehensive Metrics */}
        {(() => {
          let rawQuestions =
            submission?.exam?.questions ||
            submission?.submission?.questions ||
            monitoringData?.exam?.questions ||
            (submission?.exam as any)?.questionsJson ||
            (monitoringData?.exam as any)?.questionsJson ||
            [];

          if (typeof rawQuestions === 'string') {
            try {
              rawQuestions = JSON.parse(rawQuestions);
            } catch (e) {
              rawQuestions = [];
            }
          }

          const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
          const subData = submission.submission || submission;
          let ansObj: any = {};
          const rawAns =
            subData?.answers ??
            subData?.answersJson ??
            submission?.answers ??
            submission?.answersJson;

          if (typeof rawAns === 'string') {
            try {
              ansObj = JSON.parse(rawAns);
            } catch (e) {
              ansObj = {};
            }
          } else if (typeof rawAns === 'object' && rawAns !== null) {
            ansObj = rawAns;
          }

          let correctCount = 0;
          let incorrectCount = 0;
          let unansweredCount = 0;

          questions.forEach((q: any, idx: number) => {
            const studentAnswer =
              ansObj[q.id] ??
              ansObj[q._id] ??
              ansObj[`q-${idx}`] ??
              ansObj[`q-${idx + 1}`] ??
              ansObj[`q${idx + 1}`] ??
              ansObj[idx] ??
              ansObj[String(idx)];

            if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
              unansweredCount++;
              return;
            }

            if (q.type === 'mcq' && q.options) {
              const studentIdx = (() => {
                if (typeof studentAnswer === 'number') return studentAnswer;
                const s = String(studentAnswer).trim().toLowerCase();
                if (s === '0' || s === 'a' || s === 'opt a' || s === 'option a') return 0;
                if (s === '1' || s === 'b' || s === 'opt b' || s === 'option b') return 1;
                if (s === '2' || s === 'c' || s === 'opt c' || s === 'option c') return 2;
                if (s === '3' || s === 'd' || s === 'opt d' || s === 'option d') return 3;
                return q.options.findIndex((opt: string) => opt.trim().toLowerCase() === s);
              })();
              const correctIdx = (() => {
                if (typeof q.correctAnswer === 'number') return q.correctAnswer;
                const c = String(q.correctAnswer).trim().toLowerCase();
                if (c === '0' || c === 'a' || c === 'opt a' || c === 'option a') return 0;
                if (c === '1' || c === 'b' || c === 'opt b' || c === 'option b') return 1;
                if (c === '2' || c === 'c' || c === 'opt c' || c === 'option c') return 2;
                if (c === '3' || c === 'd' || c === 'opt d' || c === 'option d') return 3;
                return q.options.findIndex((opt: string) => opt.trim().toLowerCase() === c);
              })();
              if (studentIdx !== -1 && studentIdx === correctIdx) {
                correctCount++;
              } else {
                incorrectCount++;
              }
            } else if (q.type === 'true_false') {
              const sVal =
                studentAnswer === true ||
                studentAnswer === 'true' ||
                studentAnswer === 1 ||
                studentAnswer === '1';
              const cVal =
                q.correctAnswer === true ||
                q.correctAnswer === 'true' ||
                q.correctAnswer === 1 ||
                q.correctAnswer === '1';
              if (sVal === cVal) correctCount++;
              else incorrectCount++;
            } else {
              if (
                String(studentAnswer).trim().toLowerCase() ===
                String(q.correctAnswer).trim().toLowerCase()
              ) {
                correctCount++;
              } else {
                incorrectCount++;
              }
            }
          });

          const totalQ = questions.length;
          const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
          const finalScore =
            submission.score !== null && submission.score !== undefined
              ? submission.score
              : accuracy;

          return (
            <div className="space-y-4">
              {/* Comprehensive Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-stone-900 dark:to-stone-800 border border-amber-200 dark:border-stone-700 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase block">
                    📊 සම්පූර්ණ ලකුණු (Total Score)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-amber-950 dark:text-amber-100">
                      {finalScore}%
                    </span>
                    <span className="text-[10px] font-bold text-stone-500">
                      ({submission.status || 'graded'})
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                    ✓ නිවැරදි පිළිතුරු (Correct)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                      {correctCount}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      / {totalQ} ප්‍රශ්න
                    </span>
                  </div>
                </div>

                <div className="bg-rose-50/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/60 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase block">
                    ✕ වැරදි පිළිතුරු (Incorrect)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-rose-700 dark:text-rose-300">
                      {incorrectCount}
                    </span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                      (අතපසු වූ: {unansweredCount})
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800/60 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase block">
                    🏆 සාමාර්ථය (Evaluation)
                  </span>
                  <span className="text-sm font-black mt-0.5 block text-blue-950 dark:text-blue-200">
                    {finalScore >= 75
                      ? '🌟 විශිෂ්ට (Distinction)'
                      : finalScore >= 65
                      ? '🥇 ඉතා හොඳ (Very Good)'
                      : finalScore >= 50
                      ? '🥈 සම්මාන (Credit)'
                      : finalScore >= 40
                      ? '🥉 සාමාන්‍ය (Pass)'
                      : '✕ නැවත පෙනී සිටිය යුතුයි'}
                  </span>
                </div>
              </div>

              {/* Detailed Question & Answer Breakdown */}
              <div className="space-y-4 pt-2">
                <h4 className="font-serif font-bold text-sm text-amber-950 dark:text-amber-100 flex items-center justify-between border-b border-amber-200 dark:border-stone-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <span>📜 සම්පූර්ණ ප්‍රශ්න පත්‍ර සමාලෝචනය (Detailed Paper Review)</span>
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                    නිවැරදි: {correctCount} • වැරදි: {incorrectCount} • මුළු: {totalQ}
                  </span>
                </h4>

                {questions.length === 0 ? (
                  <div className="text-center py-10 bg-amber-50/50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-amber-200 dark:border-stone-700 space-y-2 p-6">
                    <h5 className="font-bold text-sm text-amber-950 dark:text-amber-100">
                      {submission.submission || submission.score !== null
                        ? 'ප්‍රශ්න පත්‍රයේ ප්‍රශ්න පූරණය වෙමින් පවතී...'
                        : 'මෙම ශිෂ්‍යයා තවමත් විභාගයට පිළිතුරු සපයා නොමැත (No Submission)'}
                    </h5>
                    <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                      {submission.submission || submission.score !== null
                        ? 'කරුණාකර මොහොතක් රැඳී සිටින්න...'
                        : 'ශිෂ්‍යයා විසින් විභාගය අවසන් කර භාරදුන් පසු සම්පූර්ණ පිළිතුරු පත්‍රය මෙහි දිස්වේ.'}
                    </p>
                  </div>
                ) : (
                  questions.map((q: any, idx: number) => {
                    const studentAnswer =
                      ansObj[q.id] ??
                      ansObj[q._id] ??
                      ansObj[`q-${idx}`] ??
                      ansObj[`q-${idx + 1}`] ??
                      ansObj[`q${idx + 1}`] ??
                      ansObj[idx] ??
                      ansObj[String(idx)];

                    const hasAnswered =
                      studentAnswer !== undefined && studentAnswer !== null && studentAnswer !== '';

                    const isCorrect = (() => {
                      if (!hasAnswered) return false;
                      if (q.type === 'mcq' && q.options) {
                        const studentIdx = (() => {
                          if (typeof studentAnswer === 'number') return studentAnswer;
                          const s = String(studentAnswer).trim().toLowerCase();
                          if (s === '0' || s === 'a' || s === 'opt a' || s === 'option a') return 0;
                          if (s === '1' || s === 'b' || s === 'opt b' || s === 'option b') return 1;
                          if (s === '2' || s === 'c' || s === 'opt c' || s === 'option c') return 2;
                          if (s === '3' || s === 'd' || s === 'opt d' || s === 'option d') return 3;
                          return q.options.findIndex((opt: string) => opt.trim().toLowerCase() === s);
                        })();
                        const correctIdx = (() => {
                          if (typeof q.correctAnswer === 'number') return q.correctAnswer;
                          const c = String(q.correctAnswer).trim().toLowerCase();
                          if (c === '0' || c === 'a' || c === 'opt a' || c === 'option a') return 0;
                          if (c === '1' || c === 'b' || c === 'opt b' || c === 'option b') return 1;
                          if (c === '2' || c === 'c' || c === 'opt c' || c === 'option c') return 2;
                          if (c === '3' || c === 'd' || c === 'opt d' || c === 'option d') return 3;
                          return q.options.findIndex((opt: string) => opt.trim().toLowerCase() === c);
                        })();
                        return studentIdx !== -1 && studentIdx === correctIdx;
                      }
                      if (q.type === 'true_false') {
                        const sVal =
                          studentAnswer === true ||
                          studentAnswer === 'true' ||
                          studentAnswer === 1 ||
                          studentAnswer === '1';
                        const cVal =
                          q.correctAnswer === true ||
                          q.correctAnswer === 'true' ||
                          q.correctAnswer === 1 ||
                          q.correctAnswer === '1';
                        return sVal === cVal;
                      }
                      return (
                        String(studentAnswer).trim().toLowerCase() ===
                        String(q.correctAnswer).trim().toLowerCase()
                      );
                    })();

                    return (
                      <div
                        key={`mon-q-${q.id || 'q'}-${idx}`}
                        className={`rounded-2xl p-4 sm:p-5 space-y-3.5 border transition ${
                          !hasAnswered
                            ? 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700'
                            : isCorrect
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-xs'
                            : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60 shadow-xs'
                        }`}
                      >
                        {/* Question Header & Correctness Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-mono">
                                QUESTION #{idx + 1}
                              </span>
                              {q.type && (
                                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase">
                                  {q.type}
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-sm text-amber-950 dark:text-amber-100 leading-snug">
                              {q.text || q.question}
                            </h5>
                            {q.textSinhala && (
                              <p className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                                {q.textSinhala}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-lg">
                              {isCorrect ? `+${q.marks || 10}` : '+0'} / {q.marks || 10} Marks
                            </span>
                            {!hasAnswered ? (
                              <span className="text-[10px] font-bold text-stone-600 bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded-full">
                                ⚪ නොකළ ප්‍රශ්නයකි
                              </span>
                            ) : isCorrect ? (
                              <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-200 bg-emerald-200/80 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full border border-emerald-400">
                                ✓ නිවැරදි පිළිතුරකි
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-rose-800 dark:text-rose-200 bg-rose-200/80 dark:bg-rose-900/80 px-2 py-0.5 rounded-full border border-rose-400">
                                ✕ වැරදි පිළිතුරකි
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Multiple Choice Options Display */}
                        {q.type === 'mcq' && q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                            {q.options.map((opt: string, oIdx: number) => {
                              const isStudentSelected = (() => {
                                if (!hasAnswered) return false;
                                if (typeof studentAnswer === 'number') return studentAnswer === oIdx;
                                const s = String(studentAnswer).trim().toLowerCase();
                                if (s === String(oIdx)) return true;
                                if (oIdx === 0 && (s === 'a' || s === 'opt a' || s === 'option a'))
                                  return true;
                                if (oIdx === 1 && (s === 'b' || s === 'opt b' || s === 'option b'))
                                  return true;
                                if (oIdx === 2 && (s === 'c' || s === 'opt c' || s === 'option c'))
                                  return true;
                                if (oIdx === 3 && (s === 'd' || s === 'opt d' || s === 'option d'))
                                  return true;
                                return s === opt.trim().toLowerCase();
                              })();

                              const isCorrectOpt = (() => {
                                if (
                                  q.correctAnswer === undefined ||
                                  q.correctAnswer === null ||
                                  q.correctAnswer === ''
                                )
                                  return false;
                                if (typeof q.correctAnswer === 'number')
                                  return q.correctAnswer === oIdx;
                                const c = String(q.correctAnswer).trim().toLowerCase();
                                if (c === String(oIdx)) return true;
                                if (oIdx === 0 && (c === 'a' || c === 'opt a' || c === 'option a'))
                                  return true;
                                if (oIdx === 1 && (c === 'b' || c === 'opt b' || c === 'option b'))
                                  return true;
                                if (oIdx === 2 && (c === 'c' || c === 'opt c' || c === 'option c'))
                                  return true;
                                if (oIdx === 3 && (c === 'd' || c === 'opt d' || c === 'option d'))
                                  return true;
                                return c === opt.trim().toLowerCase();
                              })();

                              return (
                                <div
                                  key={`sub-opt-${oIdx}`}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                                    isCorrectOpt && isStudentSelected
                                      ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-2xs'
                                      : isStudentSelected && !isCorrectOpt
                                      ? 'bg-rose-100 dark:bg-rose-950/70 border-rose-500 text-rose-950 dark:text-rose-100 font-bold shadow-2xs'
                                      : isCorrectOpt
                                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-semibold'
                                      : 'bg-white/80 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-mono font-bold text-[10px]">
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <span>{opt}</span>
                                  </span>

                                  <div className="flex items-center gap-1 shrink-0 text-[10px] font-black">
                                    {isCorrectOpt && isStudentSelected ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-white shadow-2xs">
                                        ✓ ඔබගේ නිවැරදි තේරීම
                                      </span>
                                    ) : isStudentSelected ? (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-800 text-white shadow-2xs">
                                        ✕ ශිෂ්‍යයාගේ තේරීම
                                      </span>
                                    ) : isCorrectOpt ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-400">
                                        ✓ නිවැරදි පිළිතුර
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* True / False Answers Display */}
                        {q.type === 'true_false' && (
                          <div className="flex flex-wrap items-center gap-3 text-xs font-bold pt-1">
                            {['True', 'False'].map((tfVal) => {
                              const isTfTrue = tfVal === 'True';
                              const isChosen =
                                studentAnswer === isTfTrue ||
                                String(studentAnswer).toLowerCase() === tfVal.toLowerCase() ||
                                (isTfTrue
                                  ? studentAnswer === 1 || studentAnswer === '1'
                                  : studentAnswer === 0 || studentAnswer === '0');
                              const isCorrectTf =
                                q.correctAnswer === isTfTrue ||
                                String(q.correctAnswer).toLowerCase() === tfVal.toLowerCase() ||
                                (isTfTrue
                                  ? q.correctAnswer === 1 || q.correctAnswer === '1'
                                  : q.correctAnswer === 0 || q.correctAnswer === '0');

                              return (
                                <div
                                  key={`tf-${tfVal}`}
                                  className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                    isCorrectTf && isChosen
                                      ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                                      : isChosen && !isCorrectTf
                                      ? 'bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-950 dark:text-rose-100'
                                      : isCorrectTf
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                                      : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                                  }`}
                                >
                                  <span>[ {isChosen ? '✓' : '  '} ] {tfVal}</span>
                                  {isChosen && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                                        isCorrectTf ? 'bg-emerald-800' : 'bg-rose-800'
                                      }`}
                                    >
                                      {isCorrectTf ? '✓ Correct' : '✕ Selected'}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Essay Response Display */}
                        {q.type === 'essay' && (
                          <div className="space-y-2 pt-1">
                            <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-amber-200 dark:border-stone-700 text-xs font-sans text-stone-900 dark:text-stone-100 whitespace-pre-wrap leading-relaxed shadow-2xs">
                              {studentAnswer || (
                                <span className="italic text-stone-400 dark:text-stone-500">
                                  ශිෂ්‍යයා විසින් මෙම රචනා ප්‍රශ්නයට පිළිතුරු සපයා නැත. (No essay response typed).
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Question Detailed Explanation / Model Answer Callout */}
                        {q.explanation && (
                          <div className="p-3 bg-amber-100/70 dark:bg-amber-950/60 rounded-xl border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                              <span>💡 ප්‍රශ්න විග්‍රහය සහ පැහැදිලි කිරීම (Explanation):</span>
                            </span>
                            <p className="leading-relaxed font-sans">{q.explanation}</p>
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


        {/* Lecturer Review & Custom Feedback Section */}
        <div className="bg-amber-100/50 dark:bg-stone-800/80 border border-amber-300 dark:border-stone-700 rounded-2xl p-4 space-y-3">
          <h5 className="font-serif font-bold text-xs text-amber-950 dark:text-amber-100 uppercase tracking-wide flex items-center justify-between">
            <span>Lecturer Feedback & Assessment Comments (ගුරු ඇගයීම් සටහන)</span>
            {feedbackSaveSuccess && (
              <span className="text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md animate-bounce">
                ✓ Feedback & Grade Saved Successfully!
              </span>
            )}
          </h5>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-48 bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-amber-300 dark:border-stone-700">
              <label htmlFor="submissionmodal-manualScoreInput" className="text-[10px] font-bold text-amber-950 dark:text-amber-200 uppercase block">
                Total Score Override (%)
              </label>
              <input autoComplete="name" id="submissionmodal-manualScoreInput" name="manualScoreInput"
                type="number"
                min={0}
                max={100}
                value={manualScoreInput}
                onChange={(e) => setManualScoreInput(e.target.value)}
                placeholder="e.g. 85"
                className="w-full font-mono font-bold text-sm text-amber-950 dark:text-amber-100 bg-amber-50/50 dark:bg-stone-800 px-2 py-1 rounded border border-amber-200 dark:border-stone-700 mt-1"
              />
            </div>

            <div className="flex-1 w-full">
              <textarea autoComplete="name" id="submissionmodal-teacherFeedbackInput" name="teacherFeedbackInput"
                rows={2}
                value={teacherFeedbackInput}
                onChange={(e) => setTeacherFeedbackInput(e.target.value)}
                placeholder="Type official lecturer comments, grade notes, or recommendations for the student..."
                className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 text-xs text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveTeacherFeedback}
              disabled={isSavingFeedback}
              className="px-4 py-2 bg-amber-900 dark:bg-amber-800 hover:bg-amber-950 dark:hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-amber-300" />
              <span>
                {isSavingFeedback
                  ? 'Saving...'
                  : 'Save Grade & Feedback (ලකුණු සහ ගුරු සටහන සුරකින්න)'}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close Answer Paper Review
          </button>
        </div>
      </motion.div>
      </div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
