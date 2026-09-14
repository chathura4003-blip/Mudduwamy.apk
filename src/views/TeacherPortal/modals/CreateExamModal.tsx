import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../../../utils/haptics';
import {
  Sparkles,
  X,
  BookOpen,
  Upload,
  RefreshCw,
  AlertCircle,
  Download,
  Zap,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Clipboard,
  CheckCircle2,
  Check,
  FileCode,
  Loader2,
} from 'lucide-react';
import { Question, ClassItem, SubjectItem } from '../types';
import { checkOptionMatch } from '../utils';

interface CreateExamModalProps {
  showCreateExamModal: boolean;

  setShowCreateExamModal: (show: boolean) => void;
  editingExamId: string | null;
  examBuilderSubTab: string;
  setExamBuilderSubTab: (tab: any) => void;
  paperPreviewMode: boolean;
  setPaperPreviewMode: (mode: boolean) => void;
  examTitle: string;
  setExamTitle: (t: string) => void;
  examTitleSinhala: string;
  setExamTitleSinhala: (t: string) => void;
  examClassId: string;
  setExamClassId: (id: string) => void;
  examSubjectId: string;
  setExamSubjectId: (id: string) => void;
  durationMinutes: number;
  setDurationMinutes: (m: number) => void;
  passingMarks: number;
  setPassingMarks: (m: number) => void;
  attemptsAllowed: number;
  setAttemptsAllowed: (a: number) => void;
  startDate: string;
  setStartDate: (d: string) => void;
  instructions: string;
  setInstructions: (i: string) => void;
  assignedClasses: ClassItem[];
  assignedSubjects: SubjectItem[];
  getAssignedSubjectsForClass?: (classId?: string) => SubjectItem[];
  questionsList: Question[];
  setQuestionsList: React.Dispatch<React.SetStateAction<Question[]>>;
  isExtractingPaper: boolean;
  paperExtractSuccessMsg: string | null;
  setPaperExtractSuccessMsg: (msg: string | null) => void;
  paperExtractErrorMsg: string | null;
  setPaperExtractErrorMsg: (msg: string | null) => void;
  paperFilePreview: string | null;
  uploadingPaperFile: File | null;
  handleExtractPaperFromUpload: (file: File) => void;
  handleResetPaperVision: () => void;
  handleExportQuestionsToCsv: (questions: Question[], title: string) => void;
  handleEqualizeMarks: () => void;
  handleClearAllQuestions: () => void;
  handleAddQuestionToForm: (type: 'mcq' | 'true_false' | 'essay' | 'structured') => void;
  handleMoveQuestion: (index: number, direction: 'up' | 'down') => void;
  handleDuplicateQuestion: (index: number) => void;
  handleDeleteQuestion: (index: number) => void;
  sheetsPastedData: string;
  setSheetsPastedData: (d: string) => void;
  handlePasteFromClipboard: () => void;
  handleFileUploadCsv: (file: File) => void;
  handleParseSheetsData: (data: string) => void;
  parsedCsvQuestions: any[];
  setParsedCsvQuestions: (q: any[]) => void;
  csvParseSuccessMsg: string | null;
  setCsvParseSuccessMsg: (msg: string | null) => void;
  csvParseErrorMsg: string | null;
  setCsvParseErrorMsg: (msg: string | null) => void;
  handleSetAllParsedMarks: (marks: number) => void;
  handleBalanceParsedMarks: () => void;
  handleAddBlankParsedQuestion: () => void;
  handleConfirmImportCsvQuestions: () => void;
  handleUpdateParsedQuestion: (index: number, q: any) => void;
  handleDeleteParsedQuestion: (index: number) => void;
  handleFileUploadJson: (file: File) => void;
  handleConfirmImportStagedJson: () => void;
  handleCopyRawJsonToClipboard: () => void;
  copiedRawJsonSuccess: boolean;
  handleDownloadRawJsonFile: () => void;
  handleClearRawJsonData: () => void;
  jsonImportSuccessMsg: string | null;
  jsonImportErrorMsg: string | null;
  isRawJsonCleared: boolean;
  setIsRawJsonCleared: (c: boolean) => void;
  rawAiJsonContent: string;
  setRawAiJsonContent: (c: string) => void;
  formatQuestionsTo9ColumnJson: (questions: Question[]) => string;
  handleSaveExam: (e: React.FormEvent) => void;
  isSavingExam?: boolean;
}

export const CreateExamModal: React.FC<CreateExamModalProps> = ({
  showCreateExamModal,
  setShowCreateExamModal,
  editingExamId,
  examBuilderSubTab,
  setExamBuilderSubTab,
  paperPreviewMode,
  setPaperPreviewMode,
  examTitle,
  setExamTitle,
  examTitleSinhala,
  setExamTitleSinhala,
  examClassId,
  setExamClassId,
  examSubjectId,
  setExamSubjectId,
  durationMinutes,
  setDurationMinutes,
  passingMarks,
  setPassingMarks,
  attemptsAllowed,
  setAttemptsAllowed,
  startDate,
  setStartDate,
  instructions,
  setInstructions,
  assignedClasses,
  assignedSubjects,
  getAssignedSubjectsForClass,
  questionsList,
  setQuestionsList,
  isExtractingPaper,
  paperExtractSuccessMsg,
  setPaperExtractSuccessMsg,
  paperExtractErrorMsg,
  setPaperExtractErrorMsg,
  paperFilePreview,
  uploadingPaperFile,
  handleExtractPaperFromUpload,
  handleResetPaperVision,
  handleExportQuestionsToCsv,
  handleEqualizeMarks,
  handleClearAllQuestions,
  handleAddQuestionToForm,
  handleMoveQuestion,
  handleDuplicateQuestion,
  handleDeleteQuestion,
  sheetsPastedData,
  setSheetsPastedData,
  handlePasteFromClipboard,
  handleFileUploadCsv,
  handleParseSheetsData,
  parsedCsvQuestions,
  setParsedCsvQuestions,
  csvParseSuccessMsg,
  setCsvParseSuccessMsg,
  csvParseErrorMsg,
  setCsvParseErrorMsg,
  handleSetAllParsedMarks,
  handleBalanceParsedMarks,
  handleAddBlankParsedQuestion,
  handleConfirmImportCsvQuestions,
  handleUpdateParsedQuestion,
  handleDeleteParsedQuestion,
  handleFileUploadJson,
  handleConfirmImportStagedJson,
  handleCopyRawJsonToClipboard,
  copiedRawJsonSuccess,
  handleDownloadRawJsonFile,
  handleClearRawJsonData,
  jsonImportSuccessMsg,
  jsonImportErrorMsg,
  isRawJsonCleared,
  setIsRawJsonCleared,
  rawAiJsonContent,
  setRawAiJsonContent,
  formatQuestionsTo9ColumnJson,
  handleSaveExam,
  isSavingExam = false,
}) => {
  const modalContent = (
    <AnimatePresence>
      {showCreateExamModal && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto select-none"
          onClick={() => {
            triggerHaptic('light');
            setShowCreateExamModal(false);
          }}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-stone-800 shadow-[0_25px_70px_rgba(0,0,0,0.85)] max-h-[92vh] overflow-y-auto my-auto text-slate-900 dark:text-stone-100 flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Top Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-purple-600 via-amber-500 to-indigo-600 shrink-0" />

          {/* Modal Header & Navigation Bar */}
          <div className="border-b border-slate-200 dark:border-stone-800 p-5 space-y-3 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-serif font-black text-lg text-slate-900 dark:text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-icon-sparkle" />
                  <span>
                    {editingExamId
                      ? 'විභාග ප්‍රශ්න පත්‍රය සංස්කරණය (Edit Examination Paper)'
                      : 'උසස් විභාග ප්‍රශ්න පත්‍ර නිර්මාණ ශිල්පියා (Paper Builder)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-stone-400">
                  Pro Pirivena Paper Authoring Studio • AI Question Generator & Presets
                </p>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowCreateExamModal(false);
                }}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 bg-slate-100 dark:bg-stone-800 rounded-xl border border-slate-200 dark:border-stone-700 cursor-pointer active:scale-95 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Sub-Tabs (5 Options - Mobile APK Ready) */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-stone-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-stone-700 text-xs font-bold overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setExamBuilderSubTab('settings');
                  setPaperPreviewMode(false);
                }}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 min-h-[38px] ${
                  examBuilderSubTab === 'settings' && !paperPreviewMode
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs font-black'
                    : 'text-slate-700 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-stone-700'
                }`}
              >
                <BookOpen className="w-4 h-4 animate-icon-float" />
                <span>⚙️ 1. සැකසුම් (Settings)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setExamBuilderSubTab('questions');
                  setPaperPreviewMode(false);
                }}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 min-h-[38px] ${
                  examBuilderSubTab === 'questions' && !paperPreviewMode
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs font-black'
                    : 'text-slate-700 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-stone-700'
                }`}
              >
                <Sparkles className="w-4 h-4 animate-icon-sparkle" />
                <span>📝 2. ප්‍රශ්න ({questionsList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setExamBuilderSubTab('presets');
                  setPaperPreviewMode(false);
                }}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 min-h-[38px] ${
                  examBuilderSubTab === 'presets' && !paperPreviewMode
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs font-black'
                    : 'text-slate-700 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-stone-700'
                }`}
              >
                <span>📊 3. Sheets Import</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setExamBuilderSubTab('json');
                  setPaperPreviewMode(false);
                }}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 min-h-[38px] ${
                  examBuilderSubTab === 'json' && !paperPreviewMode
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs font-black'
                    : 'text-slate-700 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-stone-700'
                }`}
              >
                <span>📥 4. Raw JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setExamBuilderSubTab('preview');
                  setPaperPreviewMode(true);
                }}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 min-h-[38px] ${
                  paperPreviewMode || examBuilderSubTab === 'preview'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs font-black'
                    : 'text-slate-700 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-stone-700'
                }`}
              >
                <span>👁️ 5. Preview</span>
              </button>
            </div>
          </div>

        {/* PREVIEW MODE VIEW */}
        {paperPreviewMode ? (
          <div className="p-6 bg-stone-50 border border-stone-300 rounded-2xl space-y-6 text-stone-900 font-serif">
            <div className="text-center border-b-2 border-stone-800 pb-4 space-y-1">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-stone-600">
                SRI SUMANA PIRIVENA ONLINE EXAMINATION
              </div>
              <h2 className="text-xl font-bold text-stone-950">
                {examTitle || 'Pracheena Examination Paper'}
              </h2>
              {examTitleSinhala && (
                <h3 className="text-base text-stone-800 font-medium">{examTitleSinhala}</h3>
              )}
              <div className="flex justify-center gap-6 text-xs text-stone-700 font-sans font-bold pt-2">
                <span>Duration: {durationMinutes} Minutes</span>
                <span>
                  Total Marks:{' '}
                  {questionsList.reduce((acc, q) => acc + (Number(q.marks) || 0), 0)}
                </span>
                <span>Pass Threshold: {passingMarks}%</span>
              </div>
            </div>

            {instructions && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-sans space-y-1">
                <p className="font-bold text-amber-950">
                  Instructions for Candidates / උපදෙස්:
                </p>
                <p className="text-stone-800 font-medium">{instructions}</p>
              </div>
            )}

            <div className="space-y-6 font-sans">
              {questionsList.map((q, idx) => (
                <div
                  key={`q-build-${q.id || 'q'}-${idx}`}
                  className="p-4 bg-white rounded-xl border border-stone-200 text-xs space-y-3"
                >
                  <div className="flex justify-between font-bold text-stone-900 border-b pb-2">
                    <span>
                      Question #{idx + 1} ({q.type.toUpperCase()})
                    </span>
                    <span className="text-amber-900 font-mono">[{q.marks} Marks]</span>
                  </div>
                  <p className="font-bold text-sm text-stone-950 whitespace-pre-line">
                    {q.text}
                  </p>
                  {q.imageUrl && (
                    <img
                      src={q.imageUrl}
                      alt="Diagram"
                      className="max-h-40 rounded-lg border my-2"
                    />
                  )}

                  {q.type === 'mcq' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={`q-build-opt-${q.id || idx}-${oIdx}`}
                          className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 ${
                            checkOptionMatch(oIdx, q.correctAnswer, q.options)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-stone-50 border-stone-200'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full border border-stone-400 flex items-center justify-center text-[10px] font-bold">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === 'true_false' && (
                    <div className="flex gap-4 pt-1 font-bold">
                      <span
                        className={`px-4 py-2 rounded-lg border ${
                          q.correctAnswer === 'true'
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                            : 'bg-stone-50'
                        }`}
                      >
                        ✓ True
                      </span>
                      <span
                        className={`px-4 py-2 rounded-lg border ${
                          q.correctAnswer === 'false'
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                            : 'bg-stone-50'
                        }`}
                      >
                        ✗ False
                      </span>
                    </div>
                  )}

                  {q.type === 'essay' && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-stone-500 font-mono text-[11px]">
                      [ Candidate Text Answer / Translation Entry Box ]
                    </div>
                  )}

                  {q.explanation && (
                    <div className="p-2 bg-blue-50 text-blue-900 rounded border border-blue-200 text-[11px]">
                      💡 <strong>Model Feedback / Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* EDITOR MODE FORM */
          <form onSubmit={handleSaveExam} className="space-y-4">
            {/* 1. PAPER SETTINGS SUB-TAB */}
            {examBuilderSubTab === 'settings' && (
              <div className="space-y-4">
                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                    <h4 className="font-serif font-bold text-sm text-amber-950 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-800" />
                      <span>1. Paper Identification & Curriculum Meta</span>
                    </h4>
                    <span className="text-xs text-stone-500">General exam parameters</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="create-exam-title" className="text-xs font-bold text-amber-950 block mb-1">
                        Exam Title / ප්‍රශ්න පත්‍රයේ මාතෘකාව
                      </label>
                      <input autoComplete="name"
                        id="create-exam-title"
                        name="examTitle"
                        type="text"
                        required
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        placeholder="ප්‍රාචීන ප්‍රාරම්භ පාලි II ප්‍රශ්න පත්‍රය (Pali Examination Paper)"
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs text-amber-950 font-semibold bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="create-exam-subtitle" className="text-xs font-bold text-amber-950 block mb-1">
                        Subtitle / Sub-category (Optional)
                      </label>
                      <input autoComplete="name"
                        id="create-exam-subtitle"
                        name="examTitleSinhala"
                        type="text"
                        value={examTitleSinhala}
                        onChange={(e) => setExamTitleSinhala(e.target.value)}
                        placeholder="e.g. 1st Semester Mid-Term Evaluation"
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs text-amber-950 font-semibold bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="create-exam-class" className="text-xs font-bold text-amber-950 block mb-1">
                        Target Pirivena Class
                      </label>
                      <select autoComplete="off"
                        id="create-exam-class"
                        name="examClassId"
                        value={examClassId}
                        onChange={(e) => setExamClassId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-amber-950 bg-white"
                      >
                        {assignedClasses.map((c, idx) => (
                          <option key={`ex-cls-opt-${c.id || idx}-${idx}`} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="create-exam-subject" className="text-xs font-bold text-amber-950 block mb-1">
                        Subject Curriculum
                      </label>
                      <select autoComplete="off"
                        id="create-exam-subject"
                        name="examSubjectId"
                        value={examSubjectId}
                        onChange={(e) => setExamSubjectId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-amber-950 bg-white"
                      >
                        {(() => {
                          const classSubjects = getAssignedSubjectsForClass ? getAssignedSubjectsForClass(examClassId) : assignedSubjects;
                          const finalOptions = classSubjects.length > 0 ? classSubjects : assignedSubjects;
                          return finalOptions.map((s, idx) => (
                            <option key={`ex-sbj-opt-${s.id || idx}-${idx}`} value={s.id}>
                              {s.name} ({s.code})
                            </option>
                          ));
                        })()}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="create-exam-instructions" className="text-xs font-bold text-amber-950 block mb-1">
                      Instructions for Candidates / අපේක්ෂකයින් සඳහා උපදෙස්
                    </label>
                    <input autoComplete="name"
                      id="create-exam-instructions"
                      name="instructions"
                      type="text"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="සියලුම ප්‍රශ්නවලට පැහැදිලිව පිළිතුරු සපයන්න. කාල සීමාව දැඩිව ක්‍රියාත්මක වේ."
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs text-amber-950 font-medium bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label htmlFor="create-exam-duration" className="text-xs font-bold text-amber-950 block mb-1">
                        Duration (Mins)
                      </label>
                      <input autoComplete="name"
                        id="create-exam-duration"
                        name="durationMinutes"
                        type="number"
                        required
                        min="5"
                        max="300"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs text-amber-950 font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="create-exam-pass-marks" className="text-xs font-bold text-amber-950 block mb-1">
                        Passing Mark (%)
                      </label>
                      <input autoComplete="name"
                        id="create-exam-pass-marks"
                        name="passingMarks"
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={passingMarks}
                        onChange={(e) => setPassingMarks(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs text-amber-950 font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="create-exam-attempts" className="text-xs font-bold text-amber-950 block mb-1">
                        Attempts Allowed
                      </label>
                      <input autoComplete="name"
                        id="create-exam-attempts"
                        name="attemptsAllowed"
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={attemptsAllowed}
                        onChange={(e) => setAttemptsAllowed(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs text-amber-950 font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="create-exam-start-date" className="text-xs font-bold text-amber-950 block mb-1">
                        Start Date
                      </label>
                      <input autoComplete="name"
                        id="create-exam-start-date"
                        name="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs text-amber-950 font-mono bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setExamBuilderSubTab('questions')}
                    className="px-5 py-2.5 bg-amber-800 text-white font-bold text-xs rounded-xl hover:bg-amber-900 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Next: Author Questions & AI Tools →</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. QUESTION BANK SUB-TAB */}
            {examBuilderSubTab === 'questions' && (
              <div className="space-y-4">
                {/* AI Exam Paper Vision & Generator Tools */}
                <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 p-4 rounded-2xl text-white space-y-3.5 shadow-md border border-amber-700/60">
                  {/* AI Paper Vision 9-Column Extractor Toolbar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-extrabold shrink-0 shadow-inner">
                        <Sparkles className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-amber-100 flex flex-wrap items-center gap-2">
                          <span>AI Paper Vision - PDF 9-Column JSON Extractor</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-400/30 flex items-center gap-1">
                            <span>⚡ Dual AI Engine (Gemini ↔ OpenRouter)</span>
                          </span>
                        </h4>
                        <p className="text-[11px] text-amber-200/90 leading-snug">
                          PDF ප්‍රශ්න පත්‍රයක් හෝ ඡායාරූපයක් Upload කරන්න. AI මගින් එය තීරු 9යේ JSON Grid එකක් බවට ස්වයංක්‍රීයව පරිවර්තනය කරයි.
                        </p>
                      </div>
                    </div>
                    <label htmlFor="createexammodal-file-1" className="cursor-pointer px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-md shrink-0 border border-amber-300">
                      <Upload className="w-4 h-4 text-amber-950" />
                      <span>📄 PDF / Photo Upload කරන්න</span>
                      <input autoComplete="off" id="createexammodal-file-1" name="file-1"
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleExtractPaperFromUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {isExtractingPaper && (
                    <div className="flex items-center gap-2.5 text-xs font-bold text-amber-200 bg-amber-950/70 p-3 rounded-xl border border-amber-500/40 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                      <span>
                        Gemini AI Thinking Mode මගින් ප්‍රශ්න පත්‍රය කියවමින් පවතී...
                        (Extracting questions from paper scan)
                      </span>
                    </div>
                  )}

                  {paperExtractSuccessMsg && (
                    <div className="p-3 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-xs font-bold text-emerald-200 flex items-center justify-between gap-2 shadow-xs">
                      <span>{paperExtractSuccessMsg}</span>
                      <button
                        type="button"
                        onClick={() => setPaperExtractSuccessMsg(null)}
                        className="text-emerald-400 hover:text-white px-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {paperExtractErrorMsg && (
                    <div className="p-3.5 bg-rose-950/90 border border-rose-500/60 rounded-xl text-xs font-bold text-rose-200 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{paperExtractErrorMsg}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaperExtractErrorMsg(null)}
                          className="text-rose-400 hover:text-white px-1.5 py-0.5 rounded text-sm cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      {(paperExtractErrorMsg.includes('API Key') || paperExtractErrorMsg.includes('🔑')) && (
                        <div className="pt-2 border-t border-rose-800/80 flex flex-wrap items-center gap-2 text-[11px] font-normal text-rose-200/90">
                          <span>💡 <b>විසඳුම:</b> Admin Panel -&gt; Settings -&gt; AI Settings වෙත ගොස් නොමිලේ ලබාගත හැකි Google Gemini API Key එක (aistudio.google.com) හෝ OpenRouter API Key එක Save කරන්න.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(paperFilePreview || uploadingPaperFile) && (
                    <div className="flex items-center justify-between bg-amber-950/60 p-3 rounded-xl border border-amber-700/60 text-white">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {paperFilePreview ? (
                          <img
                            src={paperFilePreview}
                            alt="Paper Scan Preview"
                            className="h-12 w-16 object-cover rounded-lg border border-amber-500/50 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-amber-900/80 border border-amber-500/50 flex items-center justify-center text-amber-300 font-black text-xs shrink-0">
                            PDF
                          </div>
                        )}
                        <div className="text-xs text-amber-200 truncate">
                          <span className="font-bold block truncate text-amber-100">
                            📄 {uploadingPaperFile?.name || 'Uploaded Exam Paper'}
                          </span>
                          <span className="text-[10px] text-amber-300/90 font-mono">
                            {uploadingPaperFile?.size
                              ? (uploadingPaperFile.size / 1024).toFixed(1)
                              : 0}{' '}
                            KB • Gemini AI Vision Processed
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetPaperVision}
                        className="px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 border border-rose-500/50 text-rose-100 font-bold text-xs rounded-xl transition shrink-0 ml-2 cursor-pointer"
                        title="උඩුගත කළ ලේඛනය ඉවත් කර අලුතින් ආරම්භ කරන්න"
                      >
                        ✕ Reset / Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Question Bank Builder List */}
                <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2">
                    <div>
                      <span className="text-xs font-extrabold text-amber-950 uppercase block">
                        2. Question Bank ({questionsList.length} Questions)
                      </span>
                      <span className="text-[11px] text-amber-900 font-mono font-bold">
                        Total Calculated Marks:{' '}
                        {questionsList.reduce((acc, q) => acc + (Number(q.marks) || 0), 0)}{' '}
                        Marks
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleExportQuestionsToCsv(
                            questionsList,
                            examTitle || 'pirivena_exam_questions'
                          )
                        }
                        title="Download .csv file formatted in 9 columns"
                        className="px-2.5 py-1 bg-emerald-900 text-white font-bold text-[10px] rounded-lg hover:bg-emerald-950 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-emerald-300" />
                        <span>Export CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleEqualizeMarks}
                        title="ලකුණු 100 සාධාරණව බෙදා වෙන්කරන්න"
                        className="px-2.5 py-1 bg-amber-600 text-white font-bold text-[10px] rounded-lg hover:bg-amber-700 transition flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Balance Marks</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllQuestions}
                        title="සියලුම ප්‍රශ්න ඉවත් කරන්න"
                        className="px-2 py-1 bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px] rounded-lg hover:bg-rose-200 transition cursor-pointer"
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToForm('mcq')}
                        className="px-2.5 py-1 bg-amber-800 text-white font-bold text-[10px] rounded-lg hover:bg-amber-900 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add MCQ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToForm('true_false')}
                        className="px-2.5 py-1 bg-amber-800 text-white font-bold text-[10px] rounded-lg hover:bg-amber-900 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add T/F</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestionToForm('essay')}
                        className="px-2.5 py-1 bg-amber-800 text-white font-bold text-[10px] rounded-lg hover:bg-amber-900 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add Essay</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Cards List View */}
                  {questionsList.length === 0 ? (
                    <div className="p-8 text-center text-stone-500 font-bold text-xs space-y-2 bg-white rounded-2xl border border-amber-200">
                      <p>ප්‍රශ්න කිසිවක් නැත (No questions added yet).</p>
                      <p className="text-[11px] text-stone-400 font-normal">
                        PDF/ඡායාරූපයක් Upload කරන්න, නැතහොත් + Add MCQ/TF/Essay ක්ලික් කරන්න.
                      </p>
                    </div>
                  ) : (
                    questionsList.map((q, idx) => (
                      <div
                        key={`bank-${q.id || 'q'}-${idx}`}
                        className="bg-white p-3.5 rounded-2xl border border-amber-300 text-xs space-y-3 shadow-2xs"
                      >
                        {/* Question Control Bar */}
                        <div className="flex items-center justify-between bg-amber-100/60 p-2 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-950 text-xs">
                              # Question {idx + 1}
                            </span>
                            <select autoComplete="off" id={`createexammodal-type-${idx}`} name="type"
                              value={q.type}
                              onChange={(e) => {
                                const updated = [...questionsList];
                                const newType = e.target.value as any;
                                updated[idx].type = newType;
                                if (
                                  newType === 'mcq' &&
                                  (!updated[idx].options || updated[idx].options.length === 0)
                                ) {
                                  updated[idx].options = [
                                    'විකල්පය A',
                                    'විකල්පය B',
                                    'විකල්පය C',
                                    'විකල්පය D',
                                  ];
                                  updated[idx].correctAnswer = 0;
                                }
                                setQuestionsList(updated);
                              }}
                              className="px-2 py-0.5 rounded border border-amber-300 font-bold text-[10px] text-amber-900 bg-white"
                            >
                              <option value="mcq">Multiple Choice (MCQ)</option>
                              <option value="true_false">True / False</option>
                              <option value="structured">Short Answer / Structured</option>
                              <option value="essay">Essay / Translation</option>
                            </select>

                            <label htmlFor="createexammodal-checkbox-3" className="flex items-center gap-1 text-[11px] font-bold text-amber-950 cursor-pointer ml-2">
                              <input id="createexammodal-checkbox-3" name="checkbox-3"
                                type="checkbox"
                                checked={q.required !== false}
                                onChange={(e) => {
                                  const updated = [...questionsList];
                                  updated[idx].required = e.target.checked;
                                  setQuestionsList(updated);
                                }}
                                className="rounded border-amber-400 text-amber-700 focus:ring-amber-500"
                              />
                              <span>අනිවාර්යයි (Required)</span>
                            </label>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 text-stone-600 hover:text-amber-950 disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(idx, 'down')}
                              disabled={idx === questionsList.length - 1}
                              className="p-1 text-stone-600 hover:text-amber-950 disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateQuestion(idx)}
                              className="p-1 text-amber-800 hover:text-amber-950 cursor-pointer"
                              title="Duplicate Question"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(idx)}
                              className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Single Question Prompt Input */}
                        <div>
                          <label htmlFor={`createexammodal-prompt-${idx}`} className="text-[11px] font-extrabold text-amber-950 block mb-1">
                            Question Prompt / ප්‍රශ්නය ඇතුළත් කරන්න
                          </label>
                          <textarea
                            autoComplete="name"
                            id={`createexammodal-prompt-${idx}`}
                            name={`question-text-${idx}`}
                            rows={2}
                            value={q.text || q.question || q.textSinhala || q.questionSinhala || ''}
                            onChange={(e) => {
                              const updated = [...questionsList];
                              updated[idx] = {
                                ...updated[idx],
                                text: e.target.value,
                                question: e.target.value,
                                textSinhala: e.target.value,
                                questionSinhala: e.target.value,
                              };
                              setQuestionsList(updated);
                            }}
                            placeholder="ප්‍රශ්නය ඇතුළත් කරන්න (e.g. පාලි වාක්‍ය රටාවෙහි... / What is the nominative plural...)"
                            className="w-full p-2.5 rounded-xl border border-amber-300 text-xs text-stone-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-stone-50/50"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label htmlFor={`createexammodal-marks-${idx}`} className="text-[10px] font-bold text-stone-700 block mb-0.5">
                              Marks Allocated
                            </label>
                            <input autoComplete="name" id={`createexammodal-marks-${idx}`} name="marks"
                              type="number"
                              min="1"
                              value={q.marks}
                              onChange={(e) => {
                                const updated = [...questionsList];
                                updated[idx].marks = Number(e.target.value);
                                setQuestionsList(updated);
                              }}
                              className="w-full px-2.5 py-1 rounded-xl border border-amber-200 text-xs font-bold text-stone-900"
                            />
                          </div>
                          <div>
                            <label htmlFor="createexammodal-imageUrl" className="text-[10px] font-bold text-stone-700 block mb-0.5">
                              Image / Diagram URL (Optional)
                            </label>
                            <input autoComplete="name" id="createexammodal-imageUrl" name="imageUrl"
                              type="text"
                              value={q.imageUrl || ''}
                              onChange={(e) => {
                                const updated = [...questionsList];
                                updated[idx].imageUrl = e.target.value;
                                setQuestionsList(updated);
                              }}
                              placeholder="https://example.com/diagram.png"
                              className="w-full px-2.5 py-1 rounded-xl border border-amber-200 text-xs text-stone-900"
                            />
                          </div>
                        </div>

                        {/* Type Specific Fields */}
                        {q.type === 'mcq' && (
                          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <label htmlFor="createexammodal-correctAnswer" className="text-[11px] font-extrabold text-amber-950 block">
                                MCQ Options & Select Correct Answer (නිවැරදි පිළිතුර තෝරන්න):
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...questionsList];
                                  const currentOpts = updated[idx].options || [];
                                  if (currentOpts.length < 6) {
                                    updated[idx].options = [
                                      ...currentOpts,
                                      `විකල්පය ${String.fromCharCode(65 + currentOpts.length)}`,
                                    ];
                                    setQuestionsList(updated);
                                  }
                                }}
                                className="text-[10px] font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
                              >
                                + Add Option
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              {(
                                q.options || ['විකල්පය A', 'විකල්පය B', 'විකල්පය C', 'විකල්පය D']
                              ).map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input id="createexammodal-radio-7"
                                    type="radio"
                                    name={`correct-${q.id || idx}`}
                                    checked={Number(q.correctAnswer) === optIdx}
                                    onChange={() => {
                                      const updated = [...questionsList];
                                      updated[idx].correctAnswer = optIdx;
                                      setQuestionsList(updated);
                                    }}
                                    className="accent-amber-800 cursor-pointer"
                                  />
                                  <span className="font-bold text-amber-950 text-xs w-4">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <input autoComplete="name" id={`createexammodal-opt-${idx}-${optIdx}`} name="opt"
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const updated = [...questionsList];
                                      if (!updated[idx].options) updated[idx].options = [];
                                      updated[idx].options![optIdx] = e.target.value;
                                      setQuestionsList(updated);
                                    }}
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)} text`}
                                    className="flex-1 px-2.5 py-1 rounded-lg border border-amber-200 text-xs text-stone-900 bg-white"
                                  />
                                  {(q.options?.length || 0) > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...questionsList];
                                        if (updated[idx].options) {
                                          updated[idx].options = updated[idx].options!.filter(
                                            (_, i) => i !== optIdx
                                          );
                                          if (
                                            Number(updated[idx].correctAnswer) >=
                                            updated[idx].options!.length
                                          ) {
                                            updated[idx].correctAnswer = 0;
                                          }
                                          setQuestionsList(updated);
                                        }
                                      }}
                                      className="text-stone-400 hover:text-rose-600 text-xs px-1 cursor-pointer"
                                      title="Remove option"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {q.type === 'true_false' && (
                          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center gap-4">
                            <span className="font-bold text-stone-900 text-xs">
                              Correct Statement Answer:
                            </span>
                            <label htmlFor="createexammodal-radio-9" className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-emerald-800">
                              <input id="createexammodal-radio-9"
                                type="radio"
                                name={`tf-${q.id || idx}`}
                                checked={String(q.correctAnswer) === 'true'}
                                onChange={() => {
                                  const updated = [...questionsList];
                                  updated[idx].correctAnswer = 'true';
                                  setQuestionsList(updated);
                                }}
                                className="accent-emerald-700"
                              />
                              <span>✓ True</span>
                            </label>
                            <label htmlFor="createexammodal-radio-10" className="flex items-center gap-1.5 cursor-pointer font-bold text-xs text-rose-800">
                              <input id="createexammodal-radio-10"
                                type="radio"
                                name={`tf-${q.id || idx}`}
                                checked={String(q.correctAnswer) === 'false'}
                                onChange={() => {
                                  const updated = [...questionsList];
                                  updated[idx].correctAnswer = 'false';
                                  setQuestionsList(updated);
                                }}
                                className="accent-rose-700"
                              />
                              <span>✗ False</span>
                            </label>
                          </div>
                        )}

                        {q.type === 'essay' && (
                          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-1">
                            <label htmlFor="createexammodal-correctAnswer" className="text-[11px] font-bold text-amber-950 block">
                              Model Translation / Criteria Keywords:
                            </label>
                            <input autoComplete="name" id="createexammodal-correctAnswer" name="correctAnswer"
                              type="text"
                              value={String(q.correctAnswer || '')}
                              onChange={(e) => {
                                const updated = [...questionsList];
                                updated[idx].correctAnswer = e.target.value;
                                setQuestionsList(updated);
                              }}
                              placeholder="e.g. ධර්මයෙහි හැසිරෙන තැනැත්තා ධර්මය විසින් රකිනු ලබයි."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 text-xs text-stone-900 bg-white"
                            />
                          </div>
                        )}

                        {/* Explanation Feedback */}
                        <div>
                          <label htmlFor="createexammodal-explanation" className="text-[10px] font-bold text-stone-600 block mb-0.5">
                            Answer Explanation / Feedback Note for Students
                          </label>
                          <input autoComplete="name" id="createexammodal-explanation" name="explanation"
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => {
                              const updated = [...questionsList];
                              updated[idx].explanation = e.target.value;
                              setQuestionsList(updated);
                            }}
                            placeholder="e.g. In Pali, masculine nouns ending in -a take -a in nominative plural."
                            className="w-full px-2.5 py-1 rounded-lg border border-amber-200 text-xs text-stone-700"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. MODEL PAPER PRESETS & GOOGLE SHEETS / EXCEL IMPORTER SUB-TAB */}
            {examBuilderSubTab === 'presets' && (
              <div className="space-y-6 p-1">
                {/* SECTION 1: GOOGLE SHEETS / EXCEL BULK QUESTION IMPORTER */}
                <div className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200 space-y-4">
                  {/* Instructions & Column Order */}
                  <div className="bg-white p-3 rounded-xl border border-emerald-200/80 text-xs text-stone-700 space-y-1">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>
                        📋 Google Sheets / Excel Column අනුපිළිවෙළ (Expected Columns):
                      </span>
                    </p>
                    <div className="font-mono text-[11px] text-emerald-900 bg-emerald-50/50 p-2 rounded-lg border border-emerald-200 overflow-x-auto">
                      Col 1: Question | Col 2: Option A | Col 3: Option B | Col 4: Option C |
                      Col 5: Option D | Col 6: Correct Answer (1-4 / Text) | Col 7: Marks | Col
                      8: Type (mcq/true_false/essay) | Col 9: Explanation
                    </div>
                  </div>

                  {/* File Upload or Text Paste Area */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-emerald-950 block">
                        Sheets / Excel වලින් කොපි කරගත් සෛල (Cells) මෙතැනට Paste කරන්න:
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePasteFromClipboard}
                          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Clipboard className="w-3.5 h-3.5 text-emerald-300" />
                          <span>📋 Clipboard එකෙන් Paste කරන්න</span>
                        </button>

                        <label htmlFor="createexammodal-file-13" className="cursor-pointer px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-lg border border-emerald-300 transition flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Upload CSV / Excel File</span>
                          <input autoComplete="off" id="createexammodal-file-13" name="file-13"
                            type="file"
                            accept=".csv,.txt,.tsv"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileUploadCsv(f);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <textarea autoComplete="name" id="createexammodal-sheetsPastedData" name="sheetsPastedData"
                      rows={4}
                      value={sheetsPastedData}
                      onChange={(e) => setSheetsPastedData(e.target.value)}
                      placeholder="Google Sheets හෝ Excel වල සෛල (Cells) Copy කර මෙහි Paste කරන්න (e.g. Question, OptA, OptB, OptC, OptD, CorrectAns, Marks)..."
                      className="w-full p-3 rounded-xl border border-emerald-300 text-xs font-mono text-stone-900 bg-white focus:ring-2 focus:ring-emerald-500 shadow-inner"
                    />

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleParseSheetsData(sheetsPastedData)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>🔍 දත්ත පරීක්ෂා කර ප්‍රශ්න හඳුනාගන්න (Parse Questions)</span>
                      </button>

                      {sheetsPastedData && (
                        <button
                          type="button"
                          onClick={() => {
                            setSheetsPastedData('');
                            setParsedCsvQuestions([]);
                            setCsvParseSuccessMsg(null);
                            setCsvParseErrorMsg(null);
                          }}
                          className="text-xs text-stone-500 hover:text-stone-800 font-bold cursor-pointer"
                        >
                          ඉවත් කරන්න (Clear)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Error & Success Messages */}
                  {csvParseErrorMsg && (
                    <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-rose-900 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>{csvParseErrorMsg}</span>
                    </div>
                  )}

                  {csvParseSuccessMsg && (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-bold flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{csvParseSuccessMsg}</span>
                      </div>
                    </div>
                  )}

                  {/* PARSED QUESTIONS PREVIEW & EDITABLE GRID TABLE */}
                  {parsedCsvQuestions.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border border-emerald-300 space-y-4 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                        <div className="space-y-0.5">
                          <h5 className="font-serif font-bold text-sm text-emerald-950 flex items-center gap-2">
                            <span>
                              ✏️ හඳුනාගත් ප්‍රශ්න සංස්කරණය (Parsed Questions Live Preview & Editor)
                            </span>
                          </h5>
                          <p className="text-[11px] text-stone-500">
                            ප්‍රශ්න {parsedCsvQuestions.length} ක් | මුළු ලකුණු (Total Marks):{' '}
                            <strong className="text-amber-900 font-mono">
                              {parsedCsvQuestions.reduce((acc, q) => acc + q.marks, 0)}
                            </strong>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Quick Mark Setter */}
                          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-[11px]">
                            <span className="font-bold text-stone-600 px-1">ලකුණු:</span>
                            <button
                              type="button"
                              onClick={() => handleSetAllParsedMarks(5)}
                              className="px-2 py-0.5 bg-white hover:bg-stone-200 rounded font-bold text-stone-800 shadow-2xs cursor-pointer"
                            >
                              5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetAllParsedMarks(10)}
                              className="px-2 py-0.5 bg-white hover:bg-stone-200 rounded font-bold text-stone-800 shadow-2xs cursor-pointer"
                            >
                              10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetAllParsedMarks(20)}
                              className="px-2 py-0.5 bg-white hover:bg-stone-200 rounded font-bold text-stone-800 shadow-2xs cursor-pointer"
                            >
                              20
                            </button>
                            <button
                              type="button"
                              onClick={handleBalanceParsedMarks}
                              title="ලකුණු 100 ට බෙදන්න"
                              className="px-2.5 py-0.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded font-bold shadow-2xs cursor-pointer"
                            >
                              ⚖️ Balance 100
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddBlankParsedQuestion}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl border border-stone-300 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-stone-600" />
                            <span>➕ ප්‍රශ්නයක් එක් කරන්න</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleConfirmImportCsvQuestions}
                            className="px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-amber-300" />
                            <span>
                              📥 ප්‍රශ්න පත්‍රයට සියල්ල එක් කරන්න (Import All{' '}
                              {parsedCsvQuestions.length} Qs)
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Editable Question List */}
                      <div className="max-h-96 overflow-y-auto space-y-3 pr-1 text-xs">
                        {parsedCsvQuestions.map((pq, idx) => (
                          <div
                            key={pq.id || idx}
                            className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5 hover:border-emerald-300 transition"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-900 font-mono bg-emerald-100 px-2 py-0.5 rounded-md text-xs">
                                  #{idx + 1}
                                </span>
                                <select autoComplete="off" id={`createexammodal-type-${idx}`} name="type"
                                  value={pq.type}
                                  onChange={(e) =>
                                    handleUpdateParsedQuestion(idx, {
                                      ...pq,
                                      type: e.target.value as any,
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg border border-stone-300 bg-white font-bold text-[11px] text-stone-800"
                                >
                                  <option value="mcq">MCQ (බහුපවරණ)</option>
                                  <option value="true_false">
                                    True / False (සත්‍ය/අසත්‍ය)
                                  </option>
                                  <option value="essay">Essay (විචාර/පරිවර්තන)</option>
                                  <option value="structured">
                                    Structured Short (කෙටි පිළිතුරු)
                                  </option>
                                </select>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] font-bold text-stone-600">
                                    ලකුණු:
                                  </span>
                                  <input autoComplete="name" id={`createexammodal-marks-${idx}`} name="marks"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={pq.marks}
                                    onChange={(e) =>
                                      handleUpdateParsedQuestion(idx, {
                                        ...pq,
                                        marks: Number(e.target.value) || 1,
                                      })
                                    }
                                    className="w-14 px-2 py-1 bg-white border border-stone-300 rounded-lg text-center font-bold text-xs font-mono"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteParsedQuestion(idx)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                                  title="Delete Question"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Question Text Input */}
                            <input autoComplete="name" id={`createexammodal-file-upload`} name="text"
                              type="text"
                              value={pq.text}
                              onChange={(e) =>
                                handleUpdateParsedQuestion(idx, { ...pq, text: e.target.value })
                              }
                              placeholder="ප්‍රශ්නය මෙහි ඇතුළත් කරන්න..."
                              className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-bold text-stone-900 text-xs focus:ring-1 focus:ring-emerald-500"
                            />

                            {/* MCQ Options & Correct Answer Selection */}
                            {pq.type === 'mcq' && (
                              <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-stone-200">
                                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                                  විකල්ප 4 සහ නිවැරදි පිළිතුර තෝරන්න (Select Correct Answer):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {(
                                    pq.options || [
                                      'විකල්පය 1',
                                      'විකල්පය 2',
                                      'විකල්පය 3',
                                      'විකල්පය 4',
                                    ]
                                  ).map((opt: string, optIdx: number) => (
                                    <div key={optIdx} className="flex items-center gap-1.5">
                                      <input id="createexammodal-radio-18"
                                        type="radio"
                                        name={`corr-${pq.id}`}
                                        checked={pq.correctAnswer === optIdx}
                                        onChange={() =>
                                          handleUpdateParsedQuestion(idx, {
                                            ...pq,
                                            correctAnswer: optIdx,
                                          })
                                        }
                                        className="w-3.5 h-3.5 text-emerald-700 cursor-pointer"
                                      />
                                      <input autoComplete="name" id={`createexammodal-opt-${idx}-${optIdx}`} name="opt"
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                          const opts = [...(pq.options || [])];
                                          opts[optIdx] = e.target.value;
                                          handleUpdateParsedQuestion(idx, {
                                            ...pq,
                                            options: opts,
                                          });
                                        }}
                                        className={`w-full px-2 py-1 text-xs rounded border ${
                                          pq.correctAnswer === optIdx
                                            ? 'border-emerald-500 bg-emerald-50/50 font-bold text-emerald-950'
                                            : 'border-stone-200 bg-stone-50 text-stone-800'
                                        }`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* True / False Correct Answer */}
                            {pq.type === 'true_false' && (
                              <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-stone-200 text-xs">
                                <span className="font-bold text-stone-600">
                                  නිවැරදි පිළිතුර:
                                </span>
                                <label htmlFor="createexammodal-radio-20" className="flex items-center gap-1 cursor-pointer font-bold text-emerald-900">
                                  <input id="createexammodal-radio-20"
                                    type="radio"
                                    name={`tf-${pq.id}`}
                                    checked={pq.correctAnswer === 'true'}
                                    onChange={() =>
                                      handleUpdateParsedQuestion(idx, {
                                        ...pq,
                                        correctAnswer: 'true',
                                      })
                                    }
                                  />
                                  <span>සත්‍ය (True)</span>
                                </label>
                                <label htmlFor="createexammodal-radio-21" className="flex items-center gap-1 cursor-pointer font-bold text-rose-900">
                                  <input id="createexammodal-radio-21"
                                    type="radio"
                                    name={`tf-${pq.id}`}
                                    checked={pq.correctAnswer === 'false'}
                                    onChange={() =>
                                      handleUpdateParsedQuestion(idx, {
                                        ...pq,
                                        correctAnswer: 'false',
                                      })
                                    }
                                  />
                                  <span>අසත්‍ය (False)</span>
                                </label>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. UNIFIED RAW JSON STUDIO & IMPORTER SUB-TAB */}
            {examBuilderSubTab === 'json' && (
              <div className="space-y-4 p-1">
                <div className="bg-amber-50/90 p-5 rounded-2xl border border-amber-300 space-y-4 shadow-2xs">
                  {/* Unified Title & Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-3">
                    <div>
                      <h4 className="font-serif font-bold text-amber-950 text-sm flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-amber-700" />
                        <span>📥 Raw JSON Studio & Importer (තීරු 9යේ JSON කළමනාකරණය)</span>
                      </h4>
                      <p className="text-xs text-stone-600 mt-0.5">
                        .json File එකක් Upload කරන්න, JSON Paste කරන්න, නැතහොත් වත්මන් ප්‍රශ්නවල JSON Code එක Copy / Download / Edit කරන්න.
                      </p>
                    </div>

                    {/* Top Control Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label htmlFor="createexammodal-file-22" className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-4 h-4 text-emerald-200" />
                        <span>📁 Upload .json File</span>
                        <input autoComplete="off" id="createexammodal-file-22" name="file-22"
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUploadJson(e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleConfirmImportStagedJson}
                        className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                        title="මෙතැන ඇති JSON ප්‍රශ්න පත්‍රයට (Question Bank) එකතු කරන්න"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>➕ ප්‍රශ්න පත්‍රයට එකතු කරන්න</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyRawJsonToClipboard}
                        className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedRawJsonSuccess ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>✓ JSON Copy විය!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-amber-700" />
                            <span>📋 Copy JSON</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadRawJsonFile}
                        className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-amber-700" />
                        <span>📥 Download .json</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearRawJsonData}
                        className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl border border-rose-300 transition flex items-center gap-1 cursor-pointer"
                        title="මෙතැන ඇති JSON Code එක ඉවත් කරන්න"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>🗑️ Delete / Clear</span>
                      </button>
                    </div>
                  </div>

                  {/* Toast Notifications */}
                  {jsonImportSuccessMsg && (
                    <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{jsonImportSuccessMsg}</span>
                    </div>
                  )}

                  {jsonImportErrorMsg && (
                    <div className="p-3 bg-rose-100 text-rose-900 rounded-xl text-xs font-bold border border-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{jsonImportErrorMsg}</span>
                    </div>
                  )}

                  {/* Single Clean Interactive JSON Editor Code Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-950">
                      <span>🔍 9-Column JSON Code Editor (ඔබට මෙතැනට JSON Paste කිරීමටද හැක):</span>
                      <span className="font-mono text-stone-500">JSON Format (Col 1 to Col 9)</span>
                    </div>
                    <textarea autoComplete="name" id="createexammodal-rawAiJsonContentformatQuestionsTo9ColumnJsonquestionsList" name="rawAiJsonContentformatQuestionsTo9ColumnJsonquestionsList"
                      rows={14}
                      value={
                        isRawJsonCleared
                          ? '[]'
                          : rawAiJsonContent || formatQuestionsTo9ColumnJson(questionsList)
                      }
                      onChange={(e) => {
                        setRawAiJsonContent(e.target.value);
                        setIsRawJsonCleared(false);
                      }}
                      placeholder={`[\n  {\n    "question": "සංස්කෘත භාෂාවේ ස්වර අක්ෂර ගණන කීයද?",\n    "option_a": "10",\n    "option_b": "13",\n    "option_c": "14",\n    "option_d": "16",\n    "correct_answer": "2",\n    "marks": 2,\n    "type": "mcq",\n    "explanation": "සංස්කෘත භාෂාවේ ප්‍රධාන ස්වර අක්ෂර 13කි."\n  }\n]`}
                      className="w-full p-4 rounded-xl border border-amber-300 bg-stone-950 text-emerald-400 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed selection:bg-emerald-900 selection:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer Buttons - Mobile APK Optimized */}
            <div className="flex gap-2.5 pt-3 border-t border-slate-200 dark:border-stone-800 shrink-0">
              <button
                type="submit"
                disabled={isSavingExam}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 min-h-[46px]"
              >
                {isSavingExam ? (
                  <>
                    <Loader2 className="w-4 h-4 text-stone-950 animate-spin" />
                    <span>ප්‍රශ්න පත්‍රය සුරැකෙමින් පවතී...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-stone-950" />
                    <span>
                      {editingExamId ? '💾 ප්‍රශ්න පත්‍රය සුරකින්න (Save Changes)' : '🚀 ප්‍රශ්න පත්‍රය පළ කරන්න (Publish Exam)'}
                    </span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isSavingExam}
                onClick={() => {
                  triggerHaptic('light');
                  setShowCreateExamModal(false);
                }}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 disabled:opacity-40 text-slate-700 dark:text-stone-300 font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer active:scale-95 min-h-[46px]"
              >
                අවලංගු කරන්න
              </button>
            </div>
          </form>
        )}
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

