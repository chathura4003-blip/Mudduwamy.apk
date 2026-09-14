import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  FileCheck,
  X,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { Exam, Subject, PirivenaClass, Question } from '../../../types';
import { checkOptionMatch } from '../utils';
import { triggerUniversalPrint } from '../../../utils/printHelper';
import { PirivenaLogo } from '../../../components/PirivenaLogo';
import { triggerHaptic } from '../../../utils/haptics';
import { examsApi } from '../../../api/examsApi';

interface PrintablePaperModalProps {
  paper: Exam | null;
  onClose: () => void;
  subjects: Subject[];
  classes: PirivenaClass[];
  showMarkingSchemeInPrint: boolean;
  setShowMarkingSchemeInPrint: (val: boolean | ((prev: boolean) => boolean)) => void;
  customInstituteHeader?: string;
  customInstituteEnglish?: string;
}

export const PrintablePaperModal: React.FC<PrintablePaperModalProps> = ({
  paper,
  onClose,
  subjects = [],
  classes = [],
  showMarkingSchemeInPrint,
  setShowMarkingSchemeInPrint,
  customInstituteHeader,
  customInstituteEnglish,
}) => {
  const [currentExam, setCurrentExam] = useState<Exam | null>(paper);
  const [isLoadingFullPaper, setIsLoadingFullPaper] = useState(false);

  // Sync state when paper prop changes
  useEffect(() => {
    setCurrentExam(paper);
  }, [paper]);

  // Safe parsing of questions from any format (array, JSON string, or questionsJson)
  const parseQuestions = (examData: any): Question[] => {
    if (!examData) return [];
    let qData: any = examData.questions || examData.questionsJson;
    if (typeof qData === 'string') {
      try {
        qData = JSON.parse(qData);
      } catch {
        qData = [];
      }
    }
    return Array.isArray(qData) ? qData : [];
  };

  const parsedQuestions = parseQuestions(currentExam);

  // Auto-fetch full exam details if questions array is empty
  useEffect(() => {
    if (!paper?.id) return;
    if (parsedQuestions.length === 0 && !isLoadingFullPaper) {
      setIsLoadingFullPaper(true);
      examsApi
        .getExamById(paper.id)
        .then((fullData) => {
          if (fullData) {
            setCurrentExam(fullData);
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch full exam for print preview:', err);
        })
        .finally(() => {
          setIsLoadingFullPaper(false);
        });
    }
  }, [paper?.id, parsedQuestions.length]);

  if (!paper) return null;

  const targetExam = currentExam || paper;

  // Flexible Subject matching
  const subjectObj = subjects.find(
    (s) =>
      s.id === targetExam.subjectId ||
      s.name === targetExam.subjectId ||
      s.name === (targetExam as any).subject ||
      s.nameSinhala === (targetExam as any).subject
  );

  const subjectDisplayName =
    subjectObj?.nameSinhala ||
    subjectObj?.name ||
    (targetExam as any).subjectNameSinhala ||
    (targetExam as any).subjectName ||
    (targetExam as any).subject ||
    (targetExam.subjectId && targetExam.subjectId !== 'all' ? targetExam.subjectId : '') ||
    'පාලි භාෂාව (Pali Language)';

  // Flexible Class matching
  const classObj = classes.find(
    (c) =>
      c.id === targetExam.classId ||
      c.name === targetExam.classId ||
      c.name === (targetExam as any).className ||
      c.nameSinhala === (targetExam as any).className
  );

  const classDisplayName =
    classObj?.nameSinhala ||
    classObj?.name ||
    (targetExam as any).classNameSinhala ||
    (targetExam as any).className ||
    (targetExam.classId && targetExam.classId !== 'all' ? targetExam.classId : '') ||
    'පිරිවෙන් අංශය';

  const durationHours = Math.floor((targetExam.durationMinutes || 60) / 60);
  const durationMins = (targetExam.durationMinutes || 60) % 60;
  const durationText =
    durationHours > 0
      ? `පැය ${durationHours}${durationMins > 0 ? ` මිනිත්තු ${durationMins}` : ''} යි (${targetExam.durationMinutes} Mins)`
      : `මිනිත්තු ${durationMins} යි (${targetExam.durationMinutes} Mins)`;

  const totalQuestionsCount = parsedQuestions.length;
  const totalPaperMarks =
    targetExam.totalMarks ||
    parsedQuestions.reduce((acc: number, q: Question) => acc + (Number(q.marks) || 10), 0) ||
    100;

  const instituteTitleSinhala =
    customInstituteHeader || 'ශ්‍රී සුමන මහා පිරිවෙන - මුද්දුව, රත්නපුර';
  const instituteTitleEnglish =
    customInstituteEnglish || 'SRI SUMANA MAHA PIRIVENA - MUDDUWA, RATNAPURA';

  // Helper to safely extract options list for a question
  const getQuestionOptions = (q: any): string[] => {
    let opts = q.options || q.optionsSinhala;
    if (typeof opts === 'string') {
      try {
        opts = JSON.parse(opts);
      } catch {
        opts = [];
      }
    }
    if (Array.isArray(opts) && opts.length > 0) return opts;

    const fallbackList: string[] = [];
    if (q.option_a) fallbackList.push(q.option_a);
    if (q.option_b) fallbackList.push(q.option_b);
    if (q.option_c) fallbackList.push(q.option_c);
    if (q.option_d) fallbackList.push(q.option_d);
    return fallbackList;
  };

  const handlePrintClick = () => {
    triggerHaptic('heavy');
    triggerUniversalPrint(
      `ප්‍රශ්න_පත්‍රය_${targetExam?.titleSinhala || targetExam?.title || 'Exam_Paper'}`
    );
  };

  const modalContent = (
    <div
      id="printable-exam-paper-sheet"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="printable-paper-overlay print-container fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block select-none"
    >
      <style>{`
        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            font-size: 11pt !important;
          }
          #root, nav, header, aside, .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          #printable-exam-paper-sheet {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            inset: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            visibility: visible !important;
          }
          #printable-exam-paper-sheet .printable-paper-card {
            position: static !important;
            display: block !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            visibility: visible !important;
          }
          #printable-exam-paper-sheet .printable-paper-scroll {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            max-height: none !important;
            visibility: visible !important;
          }
          #printable-exam-paper-sheet .printable-paper-content {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            width: 100% !important;
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-exam-paper-sheet * {
            visibility: visible !important;
          }
          .avoid-break, .page-break-inside-avoid, .print-question-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="printable-paper-card print-modal-content bg-stone-100 dark:bg-stone-900 rounded-3xl max-w-4xl w-full shadow-2xl space-y-4 max-h-[96vh] overflow-y-auto my-auto text-stone-900 dark:text-white border border-amber-300/60 dark:border-stone-800 print:shadow-none print:border-none print:max-w-none print:w-full print:max-h-none print:p-0 print:my-0 print:bg-white flex flex-col">
        {/* ========================================================= */}
        {/* 🖨️ SCREEN ONLY TOP ACTION CONTROLS                        */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-stone-900 border-b border-amber-200 dark:border-stone-800 p-4 sm:p-5 rounded-t-3xl flex items-center justify-between gap-3 shrink-0 no-print">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <h3 className="font-serif font-black text-base sm:text-lg text-amber-950 dark:text-amber-100">
                ප්‍රශ්න පත්‍ර මුද්‍රණ ආකෘතිය (Printable Exam Paper)
              </h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              A4 කඩදාසිවල මුද්‍රණය කිරීමට (Print / Save as PDF) 100%ක් පරිපූර්ණ ආකෘතිය.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Marking Scheme */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setShowMarkingSchemeInPrint(!showMarkingSchemeInPrint);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[38px] ${
                showMarkingSchemeInPrint
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300'
              }`}
              title="පිළිතුරු සහ ලකුණු දීමේ පටිපාටිය සක්‍රීය කරන්න"
            >
              <FileCheck className="w-4 h-4" />
              <span>{showMarkingSchemeInPrint ? '✓ Marking Scheme ON' : '📜 Marking Scheme'}</span>
            </button>

            {/* Print Action Button */}
            <button
              type="button"
              onClick={handlePrintClick}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer min-h-[38px] active:scale-95 group"
            >
              <Printer className="w-4 h-4 text-stone-950 group-hover:scale-110 transition-transform" />
              <span>🖨️ මුද්‍රණය කරන්න (Print / PDF)</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 flex items-center justify-center transition cursor-pointer shrink-0 active:scale-90"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 📜 100% OFFICIAL PIRIVENA PRINTABLE EXAM PAPER CONTAINER  */}
        {/* ========================================================= */}
        <div className="printable-paper-scroll p-3 sm:p-6 overflow-y-auto print:p-0 print:overflow-visible">
          <div className="printable-paper-content bg-white text-black p-6 sm:p-10 rounded-2xl border-2 border-stone-400 shadow-md font-serif space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-5">
            {/* 1. Official Emblem & Header */}
            <div className="text-center space-y-2 border-b-2 border-black pb-4">
              <div className="flex items-center justify-center gap-3.5">
                <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                  <PirivenaLogo size={52} variant="icon" />
                </div>
                <div className="space-y-0.5 text-center">
                  <h2 className="font-serif font-black text-xl sm:text-2xl text-black tracking-wide leading-tight">
                    {instituteTitleSinhala}
                  </h2>
                  <h3 className="font-sans font-bold text-xs sm:text-sm text-stone-800 uppercase tracking-wider">
                    {instituteTitleEnglish}
                  </h3>
                  <p className="text-[11px] font-bold text-stone-700 font-serif pt-0.5">
                    පිරිවෙන් විභාග මණ්ඩලය / ආචාර්ය මණ්ඩලය (Pirivena Academic Board)
                  </p>
                </div>
              </div>

              {/* Exam Title Box */}
              <div className="pt-2">
                <div className="inline-block border-y-2 border-black py-1 px-8 bg-stone-50 print:bg-transparent">
                  <h4 className="font-serif font-extrabold text-base sm:text-lg text-black">
                    {targetExam.titleSinhala || targetExam.title} • පිරිවෙන් වාර විභාගය
                  </h4>
                </div>
              </div>

              {/* Exam Metadata Grid (Subject, Class, Duration, Total Marks) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold pt-3 mt-1 border-t border-black/80 text-black">
                <div className="border-r border-stone-400 pr-2 text-left">
                  <span className="text-stone-600 block text-[10px] uppercase font-sans">විෂයය (Subject):</span>
                  <span className="text-xs sm:text-sm font-extrabold">{subjectDisplayName}</span>
                </div>
                <div className="border-r border-stone-400 pr-2 text-left">
                  <span className="text-stone-600 block text-[10px] uppercase font-sans">පන්තිය (Class):</span>
                  <span className="text-xs sm:text-sm font-extrabold">{classDisplayName}</span>
                </div>
                <div className="border-r border-stone-400 pr-2 text-left">
                  <span className="text-stone-600 block text-[10px] uppercase font-sans">කාලය (Time Allowed):</span>
                  <span className="text-xs sm:text-sm font-extrabold">{durationText}</span>
                </div>
                <div className="text-left">
                  <span className="text-stone-600 block text-[10px] uppercase font-sans">මුළු ලකුණු (Total Marks):</span>
                  <span className="text-xs sm:text-sm font-extrabold">{totalPaperMarks} Marks</span>
                </div>
              </div>
            </div>

            {/* 2. Candidate Index & Examiner Marking Summary Box */}
            <div className="border-2 border-black p-3.5 rounded-xl space-y-3 bg-stone-50/60 print:bg-transparent text-black avoid-break">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs font-bold items-center">
                {/* Index No Box with 6 clear cells */}
                <div className="md:col-span-5 flex items-center gap-2 shrink-0">
                  <span className="whitespace-nowrap">විභාග අංකය (Index No):</span>
                  <div className="flex gap-1.5 font-mono">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span
                        key={i}
                        className="w-6 h-7 border-2 border-black flex items-center justify-center bg-white text-black font-bold text-sm shrink-0"
                      />
                    ))}
                  </div>
                </div>

                {/* Student Name Dotted Line */}
                <div className="md:col-span-7 flex items-center gap-2 flex-1">
                  <span className="whitespace-nowrap">ශිෂ්‍යයාගේ නම:</span>
                  <span className="flex-1 border-b-2 border-dotted border-black h-5 min-w-[140px]"></span>
                </div>
              </div>

              {/* Examiner's Score Table (Clean 2-Row Official Structure) */}
              <div className="pt-2 border-t border-stone-400 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                <span>පරීක්ෂකවරයාගේ සටහන් (Examiner Score Table):</span>
                <table className="border-collapse border-2 border-black font-mono text-center text-[11px]">
                  <tbody>
                    <tr className="bg-stone-100 print:bg-transparent">
                      <td className="border border-black px-2 py-0.5 font-sans font-bold text-[10px]">ප්‍රශ්නය</td>
                      {Array.from({ length: Math.min(10, Math.max(5, totalQuestionsCount)) }).map((_, i) => (
                        <td key={i} className="border border-black px-2 py-0.5 min-w-[26px]">
                          {i + 1}
                        </td>
                      ))}
                      <td className="border border-black px-3 py-0.5 font-bold font-sans text-[10px]">එකතුව</td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1 font-sans font-bold text-stone-600 text-[10px]">ලකුණු</td>
                      {Array.from({ length: Math.min(10, Math.max(5, totalQuestionsCount)) }).map((_, i) => (
                        <td key={i} className="border border-black px-2 py-1 h-6"></td>
                      ))}
                      <td className="border border-black px-3 py-1 font-bold"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Candidate General Instructions */}
            <div className="p-3 border border-black/80 bg-stone-50/40 rounded-xl text-xs space-y-1 print:bg-transparent text-black avoid-break">
              <span className="font-extrabold block uppercase text-[10px] text-stone-800 font-sans">
                අපේක්ෂකයින් සඳහා උපදෙස් (Candidate Instructions):
              </span>
              <p className="text-black leading-relaxed font-serif text-[11px]">
                {targetExam.instructions ||
                  targetExam.instructionsSinhala ||
                  '• සියලුම ප්‍රශ්නවලට මෙම ප්‍රශ්න පත්‍රයේම පැහැදිලි අත්අකුරින් පිළිතුරු සපයන්න. නිල් හෝ කළු තීන්ත පෑනක් පමණක් භාවිතා කරන්න. ලබා දී ඇති නියමිත කාල සීමාව අවසානයේ ප්‍රශ්න පත්‍රය ශාලාධිපති වෙත භාර දෙන්න.'}
              </p>
            </div>

            {/* 4. Questions Section (Page-Break Isolated) */}
            <div className="space-y-6 pt-1">
              <div className="border-b-2 border-black pb-1 flex justify-between items-center text-xs font-bold uppercase text-black">
                <span>ප්‍රශ්න පත්‍රය (EXAMINATION QUESTIONS)</span>
                <span>[ මුළු ප්‍රශ්න: {totalQuestionsCount} ]</span>
              </div>

              {isLoadingFullPaper ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-500 font-sans">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                  <span className="text-xs">ප්‍රශ්න පත්‍රය සකස් කරමින් පවතී...</span>
                </div>
              ) : parsedQuestions.length === 0 ? (
                <div className="py-8 text-center text-sm font-sans text-stone-500">
                  මෙම ප්‍රශ්න පත්‍රය සඳහා තවමත් ප්‍රශ්න ඇතුළත් කර නැත.
                </div>
              ) : (
                parsedQuestions.map((q: Question, idx: number) => {
                  const qNum = String(idx + 1).padStart(2, '0');
                  const qMarks = q.marks || 10;
                  const qText = q.text || q.question || q.textSinhala || q.questionSinhala || '';
                  const qOptions = getQuestionOptions(q);
                  const qType = (q.type || 'mcq').toLowerCase();
                  const qCorrect = q.correctAnswer ?? (q as any).correct_answer;
                  const qExplanation = q.explanation || q.explanationSinhala || '';

                  return (
                    <div
                      key={`print-q-${q.id || idx}-${idx}`}
                      className="print-question-block page-break-inside-avoid border-b border-stone-300 print:border-black pb-5 space-y-3"
                    >
                      {/* Question Header & Title (Fixed: shrink-0 whitespace-nowrap prevents line-breaking on question number) */}
                      <div className="flex items-start justify-between gap-3 text-sm text-black leading-snug font-serif">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="font-extrabold font-mono text-sm shrink-0 whitespace-nowrap min-w-[28px] pt-0.5 select-none">
                            {qNum}.
                          </span>
                          <span className="font-bold text-[13px] pt-0.5 whitespace-pre-line leading-relaxed flex-1">
                            {qText}
                          </span>
                        </div>
                        <span className="text-xs font-sans font-bold shrink-0 whitespace-nowrap border border-black px-2.5 py-0.5 rounded bg-stone-50 print:bg-transparent leading-normal">
                          [ලකුණු {qMarks}]
                        </span>
                      </div>

                      {/* Optional Question Image / Diagram */}
                      {q.imageUrl && (
                        <div className="pl-7 my-2">
                          <img
                            src={q.imageUrl}
                            alt={`Diagram for Question ${qNum}`}
                            className="max-h-48 rounded-lg border border-black object-contain"
                          />
                        </div>
                      )}

                      {/* A. Multiple Choice Questions (MCQ) */}
                      {qType === 'mcq' && qOptions.length > 0 && (
                        <div className="pl-7 space-y-2 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-1">
                            {qOptions.map((opt: string, oIdx: number) => {
                              const isRight = checkOptionMatch(oIdx, qCorrect, qOptions);
                              return (
                                <div
                                  key={`print-opt-${q.id || idx}-${oIdx}`}
                                  className={`flex items-start gap-2.5 p-1 rounded ${
                                    showMarkingSchemeInPrint && isRight
                                      ? 'bg-emerald-100 font-bold border border-emerald-500'
                                      : ''
                                  }`}
                                >
                                  <span className="w-5 h-5 rounded-full border border-black flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 leading-none">
                                    {oIdx + 1}
                                  </span>
                                  <span className="leading-snug text-xs">{opt}</span>
                                  {showMarkingSchemeInPrint && isRight && (
                                    <span className="text-[10px] font-bold text-emerald-800 shrink-0 ml-auto">
                                      ✓ [නිවැරදි]
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Right Aligned Answer Box for Student Handwriting */}
                          <div className="flex justify-end pt-2 pr-1">
                            <div className="border border-black px-3 py-1 rounded text-xs font-bold flex items-center gap-2 bg-stone-50/50 print:bg-transparent">
                              <span>පිළිතුරු අංකය:</span>
                              <span className="w-10 h-6 border-b-2 border-black inline-flex items-center justify-center font-mono font-bold text-sm">
                                {showMarkingSchemeInPrint && qCorrect !== undefined
                                  ? typeof qCorrect === 'number'
                                    ? qCorrect + 1
                                    : qCorrect
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* B. True/False or Fill in Blank */}
                      {qType === 'boolean' && (
                        <div className="pl-7 space-y-2 text-xs">
                          <div className="flex items-center gap-6 pt-1">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full border border-black inline-block"></span>
                              <span>සත්‍ය වේ (True)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full border border-black inline-block"></span>
                              <span>අසත්‍ය වේ (False)</span>
                            </div>
                          </div>
                          <div className="flex justify-end pt-2 pr-1">
                            <div className="border border-black px-3 py-1 rounded text-xs font-bold flex items-center gap-2 bg-stone-50/50 print:bg-transparent">
                              <span>පිළිතුර:</span>
                              <span className="w-16 h-6 border-b-2 border-black inline-flex items-center justify-center font-mono font-bold">
                                {showMarkingSchemeInPrint && qCorrect !== undefined
                                  ? String(qCorrect)
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* C. Structured / Short Answer Questions */}
                      {(qType === 'structured' || qType === 'short' || qType === 'short_answer') && (
                        <div className="pl-7 space-y-2.5 pt-1">
                          <div className="border-b border-dotted border-stone-500 h-6"></div>
                          <div className="border-b border-dotted border-stone-500 h-6"></div>
                          <div className="border-b border-dotted border-stone-500 h-6"></div>
                        </div>
                      )}

                      {/* D. Essay / Translation Longform Questions */}
                      {qType === 'essay' && (
                        <div className="pl-7 space-y-2.5 pt-1">
                          <div className="border-b border-dotted border-stone-500 h-6"></div>
                          <div className="border-b border-dotted border-stone-500 h-6"></div>
                          <div className="border-b border-dotted border-stone-500 h-6"></div>
                          <div className="border-b border-dotted border-stone-500 h-6"></div>
                          <div className="border-b border-dotted border-stone-500 h-6"></div>
                          <div className="border-b border-dotted border-stone-500 h-6"></div>
                        </div>
                      )}

                      {/* 🌟 Marking Scheme Model Answer & Explanation */}
                      {showMarkingSchemeInPrint && (
                        <div className="ml-7 mt-2 p-3 bg-emerald-50 border border-emerald-400 rounded-xl text-xs space-y-1 text-emerald-950 font-sans">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>මාදිලි පිළිතුර හා ලකුණු දීමේ පටිපාටිය (Marking Scheme & Criteria):</span>
                          </div>
                          {qCorrect !== undefined && qCorrect !== '' && (
                            <p className="font-semibold text-emerald-900">
                              නිවැරදි පිළිතුර: <span className="font-mono">{String(qCorrect)}</span>
                            </p>
                          )}
                          {qExplanation && (
                            <p className="text-emerald-800 text-[11px] leading-relaxed">
                              💡 <strong>විග්‍රහය:</strong> {qExplanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 5. Official Signatures & End of Paper Footer */}
            <div className="pt-8 space-y-6 page-break-inside-avoid text-black avoid-break">
              <div className="grid grid-cols-2 gap-12 text-xs font-bold pt-4">
                <div className="space-y-2 text-center">
                  <div className="border-b-2 border-dotted border-black h-8 w-4/5 mx-auto"></div>
                  <p>අපේක්ෂකයාගේ අත්සන (Candidate's Signature)</p>
                </div>
                <div className="space-y-2 text-center">
                  <div className="border-b-2 border-dotted border-black h-8 w-4/5 mx-auto"></div>
                  <p>ශාලාධිපතිගේ අත්සන (Supervisor's Signature)</p>
                </div>
              </div>

              <div className="text-center text-xs font-mono font-bold text-stone-700 border-t-2 border-black pt-3">
                ❖ --- ප්‍රශ්න පත්‍රය අවසන් (END OF EXAMINATION PAPER) --- ❖
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
