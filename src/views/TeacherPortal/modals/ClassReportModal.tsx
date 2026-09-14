import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X } from 'lucide-react';
import type { PirivenaClass, User } from '../../../types';
import type { MonitoringData } from '../types';
import { triggerUniversalPrint } from '../../../utils/printHelper';

interface ClassReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitoringData: MonitoringData | null;
  assignedClasses: PirivenaClass[];
  user: User | null;
}

export const ClassReportModal: React.FC<ClassReportModalProps> = ({
  isOpen,
  onClose,
  monitoringData,
  assignedClasses,
  user,
}) => {
  const stats = monitoringData?.stats ?? {
    totalStudents: 0,
    completedCount: 0,
    passCount: 0,
    avgScore: 0,
    highestScore: 0,
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && monitoringData && (
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
            className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-8 max-w-4xl w-full border border-amber-300 dark:border-stone-800 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto print-modal-content mobile-bottom-sheet print:shadow-none print:border-none print:w-full print:rounded-none"
          >
            {/* Mobile Bottom Sheet Drag Indicator */}
            <div className="bottom-sheet-drag-handle sm:hidden no-print" />

        {/* Official Institutional Letterhead */}
        <div className="flex items-start justify-between border-b-2 border-amber-800 dark:border-amber-700 pb-4">
          <div className="text-center flex-1 space-y-1">
            <div className="text-amber-800 dark:text-amber-400 font-serif font-bold text-xs uppercase tracking-widest">
              ශ්‍රී සුමන පිරිවෙන් අධ්‍යාපන ආයතනය • SRI SUMANA PIRIVENA EDUCATIONAL INSTITUTE
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-amber-950 dark:text-amber-100">
              ONLINE EXAMINATION COMPREHENSIVE CLASS PERFORMANCE REPORT
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
              Official Pirivena Faculty Assessment & Merit Analytics Report
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-stone-400 hover:text-amber-950 dark:hover:text-amber-200 flex items-center justify-center no-print cursor-pointer shrink-0 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exam & Class Metadata Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-amber-50/80 dark:bg-stone-800/80 p-4 rounded-2xl border border-amber-200 dark:border-stone-700 text-xs">
          <div>
            <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold block">
              Examination Title
            </span>
            <span className="font-bold text-amber-950 dark:text-amber-100">{monitoringData.exam?.title}</span>
          </div>
          <div>
            <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold block">
              Academic Class
            </span>
            <span className="font-bold text-amber-950 dark:text-amber-100">
              {assignedClasses.find((c) => c.id === monitoringData.exam?.classId)?.name ||
                monitoringData.exam?.classId ||
                'All Classes'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold block">
              Evaluating Teacher
            </span>
            <span className="font-bold text-amber-950 dark:text-amber-100">
              {user?.monkName || user?.name || 'Faculty Lecturer'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-bold block">
              Date Generated
            </span>
            <span className="font-mono font-bold text-amber-950 dark:text-amber-100">
              {new Date().toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Key Statistical Aggregations */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-amber-50 dark:bg-stone-800 p-3 rounded-xl border border-amber-200 dark:border-stone-700">
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block uppercase">
              Total Enrolled
            </span>
            <span className="text-xl font-bold font-mono text-amber-950 dark:text-amber-100">
              {stats.totalStudents}
            </span>
          </div>
          <div className="bg-amber-50 dark:bg-stone-800 p-3 rounded-xl border border-amber-200 dark:border-stone-700">
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block uppercase">
              Submissions
            </span>
            <span className="text-xl font-bold font-mono text-emerald-950 dark:text-emerald-400">
              {stats.completedCount}
            </span>
          </div>
          <div className="bg-amber-50 dark:bg-stone-800 p-3 rounded-xl border border-amber-200 dark:border-stone-700">
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block uppercase">
              Pass Rate
            </span>
            <span className="text-xl font-bold font-mono text-blue-950 dark:text-blue-400">
              {stats.completedCount > 0
                ? Math.round((stats.passCount / stats.completedCount) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="bg-amber-50 dark:bg-stone-800 p-3 rounded-xl border border-amber-200 dark:border-stone-700">
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block uppercase">
              Class Average
            </span>
            <span className="text-xl font-bold font-mono text-amber-900 dark:text-amber-300">
              {stats.avgScore}%
            </span>
          </div>
          <div className="bg-amber-50 dark:bg-stone-800 p-3 rounded-xl border border-amber-200 dark:border-stone-700">
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block uppercase">
              Top Mark
            </span>
            <span className="text-xl font-bold font-mono text-purple-950 dark:text-purple-400">
              {stats.highestScore}%
            </span>
          </div>
        </div>

        {/* Detailed Student Marks Table */}
        <div className="space-y-2">
          <h4 className="font-serif font-bold text-sm text-amber-950 dark:text-amber-100 uppercase border-b border-amber-200 dark:border-stone-700 pb-1">
            Student Merit & Performance Register (ලකුණු නාමලේඛනය)
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-amber-200 dark:border-stone-700 rounded-xl overflow-hidden">
              <thead className="bg-amber-100 dark:bg-stone-800 text-amber-950 dark:text-amber-100 font-serif">
                <tr>
                  <th className="p-2.5 border-b border-amber-200 dark:border-stone-700">#</th>
                  <th className="p-2.5 border-b border-amber-200 dark:border-stone-700">Reg ID</th>
                  <th className="p-2.5 border-b border-amber-200 dark:border-stone-700">Student Name</th>
                  <th className="p-2.5 border-b border-amber-200 dark:border-stone-700">Category</th>
                  <th className="p-2.5 border-b border-amber-200 dark:border-stone-700 text-center">Score %</th>
                  <th className="p-2.5 border-b border-amber-200 dark:border-stone-700 text-center">Status</th>
                  <th className="p-2.5 border-b border-amber-200 dark:border-stone-700">Lecturer Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-stone-800">
                {(monitoringData?.studentStatuses || [])
                  .slice()
                  .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
                  .map((st: any, idx: number) => {
                    const isCompleted =
                      st.status === 'completed' ||
                      st.status === 'graded' ||
                      st.status === 'submitted';
                    const isPassed =
                      st.score !== null &&
                      st.score >= (monitoringData.exam?.passingMarks || 40);

                    return (
                      <tr key={st.id || idx} className="hover:bg-amber-50/50 dark:hover:bg-stone-800/50">
                        <td className="p-2.5 font-mono text-stone-500">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-amber-950 dark:text-amber-100">
                          {st.customId || st.id}
                        </td>
                        <td className="p-2.5 font-bold text-amber-950 dark:text-amber-100">
                          {st.monkName || st.name}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              st.monkStatus === 'monk'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {st.monkStatus === 'monk' ? '🪷 හිමි' : 'ගිහි'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-amber-950 dark:text-amber-100">
                          {st.score !== null ? `${st.score}%` : '—'}
                        </td>
                        <td className="p-2.5 text-center">
                          {isCompleted ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isPassed ? 'PASSED' : 'NEEDS RETAKE'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-[11px] text-stone-600 dark:text-stone-400 italic">
                          {st.submission?.teacherFeedback || (
                            isCompleted
                              ? isPassed
                                ? 'Good performance'
                                : 'Needs attention'
                              : 'Not submitted'
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Endorsement Signatures Section */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-amber-200 dark:border-stone-800">
          <div className="text-center space-y-2">
            <div className="border-b border-stone-400 dark:border-stone-600 w-48 mx-auto h-8"></div>
            <p className="text-xs font-bold text-amber-950 dark:text-amber-100">Course Lecturer Signature</p>
            <p className="text-[10px] text-stone-500 dark:text-stone-400">Ven. Academic Lecturer / Instructor</p>
          </div>

          <div className="text-center space-y-2">
            <div className="border-b border-stone-400 dark:border-stone-600 w-48 mx-auto h-8"></div>
            <p className="text-xs font-bold text-amber-950 dark:text-amber-100">Pirivena Principal Approval</p>
            <p className="text-[10px] text-stone-500 dark:text-stone-400">Kruthyadhikari / Head Monk Seal</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-amber-200 dark:border-stone-800 no-print">
          <button
            onClick={() => {
              triggerUniversalPrint('පන්ති_වාර_වාර්තාව_ශ්‍රී_සුමන_මහා_පිරිවෙන');
            }}
            className="px-5 py-2.5 bg-amber-900 dark:bg-amber-800 hover:bg-amber-950 dark:hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print Official Report</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
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
