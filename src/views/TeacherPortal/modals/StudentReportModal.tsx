import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer } from 'lucide-react';
import type { MonitoringData } from '../types';
import { triggerUniversalPrint } from '../../../utils/printHelper';

interface StudentReportModalProps {
  student: any | null;
  monitoringData: MonitoringData | null;
  onClose: () => void;
}

export const StudentReportModal: React.FC<StudentReportModalProps> = ({
  student,
  monitoringData,
  onClose,
}) => {
  const modalContent = (
    <AnimatePresence>
      {student && (
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
            className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-8 max-w-2xl w-full border border-amber-300 dark:border-stone-800 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto print-modal-content mobile-bottom-sheet print:shadow-none print:border-none print:w-full print:rounded-none"
          >
            {/* Mobile Bottom Sheet Drag Indicator */}
            <div className="bottom-sheet-drag-handle sm:hidden no-print" />

        {/* Header Letterhead */}
        <div className="flex justify-between items-start border-b-2 border-amber-800 dark:border-amber-700 pb-4">
          <div className="space-y-1">
            <div className="text-amber-800 dark:text-amber-400 font-serif font-bold text-[10px] uppercase tracking-widest">
              ශ්‍රී සුමන පිරිවෙන් අධ්‍යාපන ආයතනය • SRI SUMANA PIRIVENA EDUCATIONAL INSTITUTE
            </div>
            <h3 className="font-serif font-bold text-xl text-amber-950 dark:text-amber-100">
              {student.monkStatus === 'monk' && student.monkName ? student.monkName : (student.name || student.monkName || 'ශිෂ්‍ය නාමය')}
            </h3>
            {student.monkStatus === 'monk' && student.monkName && student.name && student.monkName !== student.name && (
              <p className="text-xs text-stone-600 dark:text-stone-400 font-serif font-medium">
                ගිහි නම: {student.name}
              </p>
            )}
            <p className="text-xs text-stone-600 dark:text-stone-400 font-mono">
              Registration ID:{' '}
              <strong className="text-amber-950 dark:text-amber-200">{student.customId}</strong> •
              Category:{' '}
              <span className={`font-bold ${student.monkStatus === 'monk' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {student.monkStatus === 'monk'
                  ? '🪷 පැවිදි හිමි (Monastic Samanera)'
                  : '👤 ගිහි සිසු (Lay Scholar)'}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-stone-400 hover:text-amber-950 dark:hover:text-amber-200 flex items-center justify-center no-print cursor-pointer shrink-0 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Examination & Performance Metrics Card */}
        <div className="bg-amber-50/80 dark:bg-stone-800/80 p-5 rounded-2xl border border-amber-200 dark:border-stone-700 space-y-3 text-xs">
          <div className="text-xs font-serif font-bold text-amber-900 dark:text-amber-300 uppercase border-b border-amber-200 dark:border-stone-700 pb-2">
            Official Examination Performance Summary / විභාග ලකුණු වාර්තාව
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase block">
                Examination Title
              </span>
              <span className="font-bold text-amber-950 dark:text-amber-100">
                {monitoringData?.exam?.title || 'Online Assessment'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase block">
                Passing Requirement
              </span>
              <span className="font-bold text-amber-950 dark:text-amber-100 font-mono">
                {monitoringData?.exam?.passingMarks || 40}% Minimum Pass
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase block">
                Obtained Raw Score
              </span>
              <span className="text-base font-mono font-extrabold text-emerald-800 dark:text-emerald-300">
                {student.score !== null
                  ? `${student.score}%`
                  : 'Pending'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase block">
                Evaluation Outcome
              </span>
              <span className="font-bold uppercase text-amber-950 dark:text-amber-100">
                {student.score !== null &&
                student.score >= (monitoringData?.exam?.passingMarks || 40) ? (
                  <span className="text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded text-[11px]">
                    {student.score >= 75
                      ? '🌟 DISTINCTION (අති විශිෂ්ට)'
                      : '✓ PASSED (සාමාර්ථයි)'}
                  </span>
                ) : student.score !== null ? (
                  <span className="text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded text-[11px]">
                    ✕ RE-ATTEMPT (නැවත පෙනීසිටින්න)
                  </span>
                ) : (
                  '—'
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-amber-200/80 dark:border-stone-700/80 pt-2 text-[11px] text-stone-600 dark:text-stone-400">
            <span>
              Attempt Status:{' '}
              <strong className="text-amber-950 dark:text-amber-200 uppercase">
                {student.status}
              </strong>
            </span>
            <span>
              Report Generated:{' '}
              <strong className="font-mono text-amber-950 dark:text-amber-200">
                {new Date().toLocaleDateString()}
              </strong>
            </span>
          </div>
        </div>

        {/* Lecturer Remarks & Evaluation Notes */}
        {student.submission?.teacherFeedback ? (
          <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl border border-amber-300 dark:border-stone-700 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-900 dark:text-amber-300 block">
              Lecturer Remarks / ගුරු ඇගයීම් සටහන
            </span>
            <p className="text-xs font-serif text-stone-800 dark:text-stone-200 italic leading-relaxed">
              "{student.submission.teacherFeedback}"
            </p>
          </div>
        ) : (
          <div className="bg-amber-50/40 dark:bg-stone-800/40 p-3.5 rounded-2xl border border-amber-200/60 dark:border-stone-700/60 text-xs text-stone-600 dark:text-stone-400 font-serif italic">
            Note: Candidate has completed all assigned online examination sections. Official
            grade entries verified by Sri Sumana Pirivena Academic Board.
          </div>
        )}

        {/* Endorsement Signature Block for Official Printouts */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-amber-200 dark:border-stone-800 text-center">
          <div className="space-y-1">
            <div className="border-b border-stone-400 dark:border-stone-600 w-40 mx-auto h-8"></div>
            <p className="text-xs font-bold text-amber-950 dark:text-amber-100">Course Lecturer Signature</p>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">Faculty Examiner</p>
          </div>

          <div className="space-y-1">
            <div className="border-b border-stone-400 dark:border-stone-600 w-40 mx-auto h-8"></div>
            <p className="text-xs font-bold text-amber-950 dark:text-amber-100">Pirivena Principal Seal</p>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">Head Monk / Director</p>
          </div>
        </div>

        {/* Modal Control Actions */}
        <div className="flex justify-between items-center pt-2 no-print border-t border-amber-100 dark:border-stone-800">
          <button
            onClick={() => {
              triggerUniversalPrint(`ශිෂ්‍ය_වාර්තාව_${student.monkName || student.name || 'Student'}`);
            }}
            className="px-5 py-2.5 bg-amber-900 dark:bg-amber-800 hover:bg-amber-950 dark:hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print Student Report (PDF / මුද්‍රණය)</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close Report
          </button>
        </div>
      </motion.div>
      </div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

