import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Exam, Question } from '../types';
import { examsApi } from '../api';
import { useToast } from '../context/ToastContext';
import { resolveSubjectSinhalaName, resolveClassSinhalaName } from '../utils/subjectHelper';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  FileText,
  HelpCircle,
  AlertTriangle,
  X,
  Award,
  Sparkles,
} from 'lucide-react';

interface OnlineExamViewProps {
  exam: Exam;
  studentUser: any;
  onFinishExam: (result: any) => void;
  onCancel: () => void;
}

export const OnlineExamView: React.FC<OnlineExamViewProps> = ({
  exam,
  studentUser,
  onFinishExam,
  onCancel,
}) => {
  const toast = useToast();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('ලියමින් පවතී (Draft)');
  const [isSavedToDatabase, setIsSavedToDatabase] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'answered' | 'unanswered' | 'flagged'>(
    'all'
  );
  const [timeExpiredModal, setTimeExpiredModal] = useState(false);

  const cleanSubjectName = resolveSubjectSinhalaName(exam.subject || exam.subjectId, undefined, exam.title);
  const cleanClassName = resolveClassSinhalaName(exam.gradeClass || exam.classId);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeExpiredModal(true);
          handleSubmitExamDirect(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerSelect = (qId: string, val: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    setAutoSaveStatus('පිළිතුර සටහන් කරමින්...');
    setTimeout(() => setAutoSaveStatus('පිළිතුර සටහන් විය (Recorded Draft)'), 300);
  };

  const toggleFlagQuestion = (qId: string) => {
    setFlaggedQuestions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Helper metrics
  const questionsList = exam.questions || [];
  const totalQuestions = questionsList.length;
  const answeredCount = questionsList.filter((q) => {
    const a = answers[q.id];
    return a !== undefined && a !== null && String(a).trim() !== '';
  }).length;
  const unansweredQuestions = questionsList.filter((q) => {
    const a = answers[q.id];
    return a === undefined || a === null || String(a).trim() === '';
  });
  const unansweredCount = unansweredQuestions.length;
  const flaggedCount = Object.values(flaggedQuestions).filter(Boolean).length;
  const completionPercentage =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const formatTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const currentQ = questionsList[currentQIndex] || questionsList[0] || {
    id: 'q-empty',
    type: 'mcq' as const,
    text: 'No questions available for this exam.',
    textSinhala: 'මෙම විභාගය සඳහා ප්‍රශ්න තවම සූදානම් කර නැත.',
    marks: 0,
    options: [],
    optionsSinhala: []
  };
  const isCurrentAnswered = currentQ
    ? answers[currentQ.id] !== undefined && String(answers[currentQ.id]).trim() !== ''
    : false;
  const isCurrentFlagged = currentQ ? Boolean(flaggedQuestions[currentQ.id]) : false;

  // Direct submit to backend - ONLY HERE permanently saves to database
  const handleSubmitExamDirect = async (isAutoTimeExpired: boolean = false) => {
    if (isSubmitting) return;

    // MANDATORY REQUIREMENT: Block manual submission if any question is unanswered
    if (!isAutoTimeExpired && unansweredCount > 0) {
      setShowSubmitConfirmModal(true);
      return;
    }

    setIsSubmitting(true);
    setAutoSaveStatus('පද්ධතියට සුරකිමින්... (Saving to Database)');

    // Calculate auto-graded score for MCQ, True/False & Short Answer
    let totalScore = 0;
    let totalPossible = 0;
    let hasEssay = false;

    const checkMcqCorrect = (qItem: Question, userA: any): boolean => {
      if (userA === undefined || userA === null || userA === '') return false;
      if (qItem.correctAnswer === undefined || qItem.correctAnswer === null || qItem.correctAnswer === '') return false;

      let sIdx: number | null = null;
      if (typeof userA === 'number' && !isNaN(userA)) {
        sIdx = userA;
      } else {
        const uStr = String(userA).trim().toLowerCase();
        const uNum = Number(uStr);
        if (!isNaN(uNum) && uNum >= 0 && qItem.options && uNum < qItem.options.length) {
          sIdx = uNum;
        } else if (qItem.options && Array.isArray(qItem.options)) {
          const matched = qItem.options.findIndex((o) => String(o).trim().toLowerCase() === uStr);
          if (matched !== -1) sIdx = matched;
        }

        if (sIdx === null) {
          const letterMatch = uStr.match(/(?:opt|option|vikalpaya|විකල්පය|පිළිතුර|op)?\s*([a-z])\b/);
          if (letterMatch) {
            const code = letterMatch[1].charCodeAt(0) - 97;
            if (code >= 0 && code < 26) sIdx = code;
          }
        }
      }

      let cIdx: number | null = null;
      if (typeof qItem.correctAnswer === 'number' && !isNaN(qItem.correctAnswer)) {
        cIdx = qItem.correctAnswer;
      } else {
        const cStr = String(qItem.correctAnswer).trim().toLowerCase();
        const cNum = Number(cStr);
        if (!isNaN(cNum) && cNum >= 0 && qItem.options && cNum < qItem.options.length) {
          cIdx = cNum;
        } else if (qItem.options && Array.isArray(qItem.options)) {
          const matched = qItem.options.findIndex((o) => String(o).trim().toLowerCase() === cStr);
          if (matched !== -1) cIdx = matched;
        }

        if (cIdx === null) {
          const letterMatch = cStr.match(/(?:opt|option|vikalpaya|විකල්පය|පිළිතුර|op)?\s*([a-z])\b/);
          if (letterMatch) {
            const code = letterMatch[1].charCodeAt(0) - 97;
            if (code >= 0 && code < 26) cIdx = code;
          }
        }
      }

      if (sIdx !== null && cIdx !== null) {
        return sIdx === cIdx;
      }

      return String(userA).trim().toLowerCase() === String(qItem.correctAnswer).trim().toLowerCase();
    };

    const checkTrueFalseCorrect = (qItem: Question, userA: any): boolean => {
      if (userA === undefined || userA === null || userA === '') return false;
      if (qItem.correctAnswer === undefined || qItem.correctAnswer === null || qItem.correctAnswer === '') return false;

      const norm = (v: any) => {
        const s = String(v).trim().toLowerCase();
        if (s === 'true' || s === 't' || s === '1' || s.includes('සත්‍ය')) return 'true';
        if (s === 'false' || s === 'f' || s === '0' || s.includes('අසත්‍ය')) return 'false';
        return s;
      };
      return norm(userA) === norm(qItem.correctAnswer);
    };

    const checkShortAnswerCorrect = (qItem: Question, userA: any): boolean => {
      if (userA === undefined || userA === null || String(userA).trim() === '') return false;
      if (qItem.correctAnswer === undefined || qItem.correctAnswer === null || String(qItem.correctAnswer).trim() === '') return false;

      const uStr = String(userA).trim().toLowerCase();
      const cStr = String(qItem.correctAnswer).trim().toLowerCase();
      if (uStr === cStr) return true;

      const accepted = cStr.split(/[,/|]/).map((a) => a.trim()).filter(Boolean);
      return accepted.includes(uStr);
    };

    questionsList.forEach((q) => {
      const marks = Number(q.marks) > 0 ? Number(q.marks) : 10;
      totalPossible += marks;

      const userAns = answers[q.id];
      if (q.type === 'mcq') {
        if (checkMcqCorrect(q, userAns)) {
          totalScore += marks;
        }
      } else if (q.type === 'true_false') {
        if (checkTrueFalseCorrect(q, userAns)) {
          totalScore += marks;
        }
      } else if (q.type === 'short_answer' || q.type === 'structured') {
        if (checkShortAnswerCorrect(q, userAns)) {
          totalScore += marks;
        }
      } else if (q.type === 'essay') {
        hasEssay = true;
      }
    });

    const calculatedScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    try {
      const data = await examsApi.submitExam(exam.id, {
        studentId: studentUser?.id || studentUser?.customId || 'user-student-01',
        studentCustomId: studentUser?.customId || 'STD-2026-001',
        studentName: studentUser?.name || studentUser?.monkName || 'ශිෂ්‍යයා',
        studentMonkName: studentUser?.monkName || '',
        studentMonkStatus: studentUser?.monkStatus || 'lay',
        studentAvatar: studentUser?.avatar || '',
        classId: exam.classId,
        answers,
        score: calculatedScore,
        status: hasEssay ? 'submitted' : 'graded',
        graded: !hasEssay,
      });

      setAutoSaveStatus('✓ පද්ධතියට සුරැකිණි (Saved to Database)');
      setIsSavedToDatabase(true);
      setShowSubmitConfirmModal(false);
      onFinishExam(data);
    } catch (e) {
      console.error('Error submitting exam:', e);
      setAutoSaveStatus('දෝෂයක් සිදු විය (Save Error)');
      toast.error('විභාග පිළිතුරු භාරදීමේදී දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered question palette
  const filteredQuestionsIndices = questionsList
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => {
      const isAns = answers[q.id] !== undefined && String(answers[q.id]).trim() !== '';
      const isFlag = Boolean(flaggedQuestions[q.id]);

      if (paletteFilter === 'answered') return isAns;
      if (paletteFilter === 'unanswered') return !isAns;
      if (paletteFilter === 'flagged') return isFlag;
      return true;
    });

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 p-3 sm:p-6 flex flex-col justify-between space-y-6 text-stone-900 dark:text-stone-100">
      {/* Top Header Bar */}
      <div className="bg-amber-950 dark:bg-stone-900 text-white p-4 sm:p-5 rounded-3xl shadow-lg border-b-4 border-amber-500 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-amber-400 animate-icon-sparkle" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 bg-amber-500/25 text-amber-300 font-bold text-[10px] rounded-md border border-amber-500/40">
                📖 {cleanSubjectName}
              </span>
              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-200 font-bold text-[10px] rounded-md border border-amber-500/30">
                🏛️ {cleanClassName}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-serif font-extrabold">{exam.title}</h1>
            <p className="text-xs text-amber-200/90">
              ශිෂ්‍ය:{' '}
              <strong className="text-white">
                {studentUser?.monkName || studentUser?.name || 'ශිෂ්‍ය හිමි'}
              </strong>{' '}
              ({studentUser?.customId || 'STD-2026'})
            </p>
          </div>
        </div>

        {/* Progress & Timer Bar */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 border-amber-900 pt-3 md:pt-0">
          <div className="bg-amber-900/80 dark:bg-stone-950 border border-amber-700/80 px-3.5 py-1.5 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">
              ඉතිරි කාලය (Timer)
            </span>
            <span
              className={`text-lg sm:text-xl font-mono font-black ${timeLeftSeconds < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}
            >
              ⏱ {formatTime}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span
              className={`text-[11px] font-semibold px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
                isSavedToDatabase
                  ? 'text-emerald-300 bg-emerald-950/80 border-emerald-800/80'
                  : 'text-amber-200 bg-amber-900/80 border-amber-700/80'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isSavedToDatabase ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}
              />
              <span>{autoSaveStatus}</span>
            </span>
            <span className="text-[10px] text-amber-300 mt-1 font-mono">
              සම්පූර්ණ ප්‍රගතිය: {completionPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-amber-500 to-emerald-500 h-2.5 transition-all duration-300 rounded-full"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Time Warning Notice (if under 5 mins) */}
      {timeLeftSeconds < 300 && (
        <div className="bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/60 rounded-2xl p-3 flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-bold animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 animate-icon-pulse-glow" />
            <span>
              අවධානයට: විභාග කාලය අවසන් වීමට මිනිත්තු 5 කටත් වඩා අඩු කාලයක් ඉතිරිව ඇත! කරුණාකර සියලු
              පිළිතුරු පරීක්ෂා කර අවසන් කරන්න.
            </span>
          </div>
        </div>
      )}

      {/* Main Examination Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Left / Center: Question Box */}
        <div className="lg:col-span-8 bg-white dark:bg-stone-900 border border-amber-200 dark:border-stone-800 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
          {/* Question Header & Flag Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-amber-950 dark:text-amber-200 text-sm sm:text-base">
                ප්‍රශ්නය {currentQIndex + 1} / {totalQuestions}
              </span>
              {currentQ?.required !== false && (
                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-extrabold rounded-md border border-rose-300 dark:border-rose-800">
                  * අනිවාර්යයි (Required)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentQ && (
                <button
                  onClick={() => toggleFlagQuestion(currentQ.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    isCurrentFlagged
                      ? 'bg-amber-500 text-amber-950 border-amber-600 shadow-2xs font-extrabold'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-amber-50'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-amber-950 text-amber-950' : ''}`}
                  />
                  <span>{isCurrentFlagged ? 'සලකුණු කර ඇත (Flagged)' : 'පසුවට සලකුණු කරන්න'}</span>
                </button>
              )}

              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-200 font-bold text-xs rounded-full border border-amber-200 dark:border-amber-800">
                ලකුණු: {currentQ?.marks || 10}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 leading-relaxed">
              {currentQ?.textSinhala || currentQ?.text || 'ප්‍රශ්නය සූදානම් වෙමින් පවතී...'}
            </h2>
            {currentQ?.textSinhala && currentQ?.text && currentQ.textSinhala !== currentQ.text && (
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {currentQ.text}
              </p>
            )}
            {currentQ?.imageUrl && (
              <div className="my-3 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 max-h-64 bg-stone-50 dark:bg-stone-950">
                <img
                  src={currentQ.imageUrl}
                  alt="Question Reference"
                  className="object-contain max-h-64 mx-auto"
                />
              </div>
            )}
          </div>

          {/* Question Answer Inputs */}
          {/* MCQ Option Choices */}
          {currentQ.type === 'mcq' && currentQ.options && (
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, idx) => {
                const currentAns = answers[currentQ.id];
                const isSelected =
                  currentAns === idx ||
                  (currentAns !== undefined && currentAns !== null && String(currentAns).trim() === String(idx));
                const optSinhala = currentQ.optionsSinhala?.[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(currentQ.id, idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between gap-3 text-xs sm:text-sm font-medium ${
                      isSelected
                        ? 'bg-amber-100 dark:bg-amber-950/90 border-amber-500 text-amber-950 dark:text-amber-100 font-bold shadow-2xs'
                        : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:bg-amber-50/50 dark:hover:bg-amber-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'border-amber-700 bg-amber-700 dark:bg-amber-500 text-white dark:text-amber-950'
                            : 'border-stone-400 dark:border-stone-600 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span>{optSinhala || opt}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* True / False Choice */}
          {currentQ.type === 'true_false' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {['true', 'false'].map((val) => {
                const isSelected = String(answers[currentQ.id]) === val;
                return (
                  <button
                    key={val}
                    onClick={() => handleAnswerSelect(currentQ.id, val)}
                    className={`p-5 rounded-2xl border text-center font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-amber-800 dark:bg-amber-700 text-white border-amber-900 shadow-md'
                        : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:bg-amber-50/50'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-300" />}
                    <span>{val === 'true' ? 'සත්‍යයි (True)' : 'අසත්‍යයි (False)'}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Short Answer / Structured Text Input */}
          {(currentQ.type === 'structured' || currentQ.type === 'short_answer') && (
            <div className="space-y-2 pt-2">
              <label htmlFor="onlineexamview-id-1" className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                ඔබගේ පිළිතුර පහත කොටුවේ ටයිප් කරන්න (Type your answer below):
              </label>
              <input autoComplete="name" id="onlineexamview-id-1" name="id"
                type="text"
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleAnswerSelect(currentQ.id, e.target.value)}
                placeholder="සංක්ෂිප්ත පිළිතුර මෙහි ඇතුළත් කරන්න..."
                className="w-full px-4 py-3 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          )}

          {/* Essay Text Area */}
          {currentQ.type === 'essay' && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-200">
                <span>රචනා පිළිතුර දීර්ඝව පැහැදිලි කරන්න (Essay Response):</span>
                <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                  අක්ෂර ගණන: {String(answers[currentQ.id] || '').length}
                </span>
              </div>
              <textarea autoComplete="name" id="onlineexamview-id-2" name="id"
                rows={6}
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleAnswerSelect(currentQ.id, e.target.value)}
                placeholder="විස්තරාත්මක රචනා පිළිතුර මෙහි ටයිප් කරන්න (උදා: පාළි ව්‍යාකරණ රීති, අට්ඨකථා විවරණ හෝ ධර්ම කරුණු)..."
                className="w-full p-4 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-stone-950 text-sm text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
              />
            </div>
          )}

          {/* Question Navigation Controls */}
          <div className="pt-6 border-t border-amber-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
            <button
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((prev) => prev - 1)}
              className="px-4 py-2.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 rounded-xl font-bold text-xs disabled:opacity-40 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>පෙර ප්‍රශ්නය (Previous)</span>
            </button>

            <div className="flex items-center gap-2">
              {currentQIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition"
                >
                  <span>ඊළඟ ප්‍රශ්නය (Next)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitConfirmModal(true)}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>විභාගය අවසන් කර භාරදෙන්න (Submit)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Question Palette */}
        <div className="lg:col-span-4 bg-white dark:bg-stone-900 border border-amber-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-amber-100 dark:border-stone-800 pb-2">
            <h3 className="font-serif font-bold text-sm text-amber-950 dark:text-amber-200">
              ප්‍රශ්න සිතියම (Palette)
            </h3>
            <span className="text-[11px] font-bold text-stone-500 font-mono">
              {answeredCount}/{totalQuestions}
            </span>
          </div>

          {/* Palette Filter Options */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-950 p-1 rounded-xl border border-stone-200 dark:border-stone-800 text-[11px] font-bold">
            <button
              onClick={() => setPaletteFilter('all')}
              className={`flex-1 py-1 rounded-lg transition ${paletteFilter === 'all' ? 'bg-amber-800 text-white shadow-2xs' : 'text-stone-600 dark:text-stone-400'}`}
            >
              සියල්ල ({totalQuestions})
            </button>
            <button
              onClick={() => setPaletteFilter('unanswered')}
              className={`flex-1 py-1 rounded-lg transition ${paletteFilter === 'unanswered' ? 'bg-amber-800 text-white shadow-2xs' : 'text-stone-600 dark:text-stone-400'}`}
            >
              නොදුන් ({unansweredCount})
            </button>
            <button
              onClick={() => setPaletteFilter('flagged')}
              className={`flex-1 py-1 rounded-lg transition ${paletteFilter === 'flagged' ? 'bg-amber-800 text-white shadow-2xs' : 'text-stone-600 dark:text-stone-400'}`}
            >
              සලකුණු ({flaggedCount})
            </button>
          </div>

          {/* Grid Palette Buttons */}
          <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
            {filteredQuestionsIndices.map(({ q, idx }) => {
              const isAns = answers[q.id] !== undefined && String(answers[q.id]).trim() !== '';
              const isFlag = Boolean(flaggedQuestions[q.id]);
              const isCurrent = currentQIndex === idx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`py-2.5 rounded-xl text-xs font-mono font-bold transition relative flex flex-col items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-amber-500 bg-amber-500 text-amber-950 shadow-md font-extrabold scale-105'
                      : isAns
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-700'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {isFlag && (
                    <span className="absolute top-0.5 right-1 w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="pt-3 border-t border-amber-100 dark:border-stone-800 space-y-2 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 dark:bg-emerald-900 dark:border-emerald-700" />
                <span>පිළිතුරු දුන් (Answered)</span>
              </span>
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                {answeredCount}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-stone-100 border border-stone-300 dark:bg-stone-800 dark:border-stone-700" />
                <span>නොදුන් (Unanswered)</span>
              </span>
              <strong
                className={`font-mono ${unansweredCount > 0 ? 'text-rose-600 font-bold' : 'text-stone-500'}`}
              >
                {unansweredCount}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span>පසුවට සලකුණු කළ (Flagged)</span>
              </span>
              <strong className="font-mono text-amber-700 dark:text-amber-400">
                {flaggedCount}
              </strong>
            </div>
          </div>

          {/* Direct Submit Trigger Button */}
          <div className="pt-2">
            <button
              onClick={() => setShowSubmitConfirmModal(true)}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>විභාගය අවසන් කරන්න (Finish Exam)</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION SUBMISSION MODAL (PROTECTS AGAINST INCOMPLETE SUBMISSION) */}
      {showSubmitConfirmModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-stone-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSubmitConfirmModal(false);
            }}
          >
            <div className="bg-white dark:bg-stone-900 border-2 border-amber-500 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 relative my-auto max-h-[92vh] overflow-y-auto">
              <button
                onClick={() => setShowSubmitConfirmModal(false)}
                className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-amber-100 dark:border-stone-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div className="pr-8">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-amber-950 dark:text-amber-100 leading-snug">
                    විභාගය භාරදීම තහවුරු කරන්න
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{exam.title}</p>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-stone-50 dark:bg-stone-950 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-bold block">
                    සම්පූර්ණ ප්‍රශ්න
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-stone-800 dark:text-stone-200">
                    {totalQuestions}
                  </span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">
                    පිළිතුරු දුන්
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {answeredCount}
                  </span>
                </div>
                <div
                  className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border ${
                    unansweredCount > 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                      : 'bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <span className="text-[10px] font-bold block">නොදුන් ප්‍රශ්න</span>
                  <span className="text-base sm:text-lg font-mono font-bold">{unansweredCount}</span>
                </div>
              </div>

              {/* Incomplete Warning Notice & Direct Jump List */}
              {unansweredCount > 0 ? (
                <div className="bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-400 dark:border-rose-700 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-start gap-2.5 text-rose-900 dark:text-rose-200 text-xs font-bold leading-relaxed">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-xs sm:text-sm text-rose-700 dark:text-rose-300">
                        ⛔ විභාගය භාරදීම තහනම් කර ඇත! (Submission Blocked)
                      </p>
                      <p className="text-[11px] font-medium opacity-90 mt-1">
                        සියලුම ප්‍රශ්න ({totalQuestions}) සඳහා පිළිතුරු සැපයීම අනිවාර්ය වේ. ඔබ තවම
                        ප්‍රශ්න <strong>{unansweredCount}</strong> කට පිළිතුරු දී නැත. සියලු
                        ප්‍රශ්නවලට පිළිතුරු සපයන තෙක් විභාගය භාරදීමට නොහැක.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-rose-900 dark:text-rose-300 block mb-1.5">
                      ඍජුවම පිළිතුරු නොදුන් ප්‍රශ්නයට යාමට අංකය මත ක්ලික් කරන්න:
                    </span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {unansweredQuestions.map((uq) => {
                        const uqIdx = exam.questions.findIndex((q) => q.id === uq.id);
                        return (
                          <button
                            key={uq.id}
                            onClick={() => {
                              setCurrentQIndex(uqIdx);
                              setShowSubmitConfirmModal(false);
                            }}
                            className="px-2.5 sm:px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-mono font-bold text-xs shadow-2xs transition cursor-pointer"
                          >
                            ප්‍රශ්නය {uqIdx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl sm:rounded-2xl p-3.5 flex items-center gap-3 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    ඔබ සියලු ප්‍රශ්න සඳහා සාර්ථකව පිළිතුරු සපයා ඇත! ඔබට දැන් විභාගය අවසන් කළ හැක.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowSubmitConfirmModal(false);
                    if (unansweredCount > 0 && unansweredQuestions[0]) {
                      const firstUqIdx = exam.questions.findIndex(
                        (q) => q.id === unansweredQuestions[0].id
                      );
                      if (firstUqIdx !== -1) setCurrentQIndex(firstUqIdx);
                    }
                  }}
                  className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 font-bold text-xs rounded-xl transition cursor-pointer text-center ${
                    unansweredCount > 0
                      ? 'bg-amber-800 hover:bg-amber-900 text-white shadow-md'
                      : 'bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  {unansweredCount > 0
                    ? 'නොදුන් ප්‍රශ්නවලට පිළිතුරු සපයන්න'
                    : 'ආපසු යන්න (Go Back)'}
                </button>

                <button
                  onClick={() => handleSubmitExamDirect(false)}
                  disabled={isSubmitting || unansweredCount > 0}
                  className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                    unansweredCount > 0
                      ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed border border-stone-300 dark:border-stone-700'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md'
                  }`}
                >
                  {isSubmitting ? (
                    <span>භාරදෙමින්... (Submitting)</span>
                  ) : unansweredCount > 0 ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>ප්‍රශ්න {unansweredCount} කට පිළිතුරු දිය යුතුය</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>තහවුරු කර භාරදෙන්න</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* TIME EXPIRED AUTOMATIC SUBMISSION MODAL */}
      {timeExpiredModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-stone-950/90 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-900 border-2 border-red-500 rounded-2xl sm:rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-bounce-short">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-stone-100">
                ⏱ විභාග කාලය අවසන් විය!
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                නියමිත කාල සීමාව අවසන් වූ බැවින්, ඔබ මේ දක්වා ඇතුළත් කළ පිළිතුරු පද්ධතියට ස්වයංක්‍රීයව
                භාරදෙන ලදී.
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
