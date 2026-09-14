import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BackupPreviewData } from '../types';
import { FileText, X, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';

interface BackupPreviewModalProps {
  selectedBackupPreview: BackupPreviewData | null;
  onClose: () => void;
  onConfirmRestore: () => void;
  isRestoringBackup: boolean;
}

export const BackupPreviewModal: React.FC<BackupPreviewModalProps> = ({
  selectedBackupPreview,
  onClose,
  onConfirmRestore,
  isRestoringBackup,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedBackupPreview && !isRestoringBackup) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBackupPreview, isRestoringBackup, onClose]);

  const modalContent = (
    <AnimatePresence>
      {selectedBackupPreview && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none"
          onClick={() => {
            if (!isRestoringBackup) {
              triggerHaptic('light');
              onClose();
            }
          }}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden my-auto text-slate-900 dark:text-stone-100 flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Top Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-600 shrink-0" />

          {/* Modal Header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-800 shrink-0 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-slate-900 dark:text-stone-100 text-base leading-tight">
                  📄 තෝරාගත් Backup ගොනුවේ විස්තරය (Backup File Details)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 font-medium">
                  Restore කිරීමට පෙර මෙම Backup ගොනුවේ අඩංගු සියලුම දත්ත පරීක්ෂා කර තහවුරු කරන්න.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              disabled={isRestoringBackup}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1.5 rounded-xl bg-slate-100 dark:bg-stone-800 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* File Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-stone-800 p-3 rounded-2xl border border-slate-200 dark:border-stone-700">
                <span className="text-[10px] text-slate-500 dark:text-stone-400 font-bold block">
                  📁 ගොනු නාමය (File Name)
                </span>
                <span
                  className="font-black text-slate-900 dark:text-stone-100 truncate block mt-0.5"
                  title={selectedBackupPreview.fileName}
                >
                  {selectedBackupPreview.fileName}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-stone-800 p-3 rounded-2xl border border-slate-200 dark:border-stone-700">
                <span className="text-[10px] text-slate-500 dark:text-stone-400 font-bold block">
                  💾 ප්‍රමාණය (File Size)
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-stone-100 block mt-0.5">
                  {selectedBackupPreview.fileSizeKb}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-stone-800 p-3 rounded-2xl border border-slate-200 dark:border-stone-700 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 dark:text-stone-400 font-bold block">
                  📅 සාදන ලද දිනය (Created At)
                </span>
                <span className="font-bold text-slate-900 dark:text-stone-100 block mt-0.5">
                  {selectedBackupPreview.timestamp || 'N/A'}
                </span>
              </div>
            </div>

            {/* Restore Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-3 pb-safe border-t border-slate-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                disabled={isRestoringBackup}
                className="w-full sm:w-auto px-5 py-3 min-h-[44px] touch-manipulation bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 border border-slate-200 dark:border-stone-700 flex items-center justify-center"
              >
                අවලංගු කරන්න (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('warning');
                  onConfirmRestore();
                }}
                disabled={isRestoringBackup}
                className="flex-1 py-3 px-4 min-h-[44px] touch-manipulation bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRestoringBackup ? 'animate-spin' : ''}`} />
                <span>
                  {isRestoringBackup
                    ? 'දත්ත නැවත පිහිටුවමින් (Restoring)...'
                    : 'මෙම Backup ගොනුව Restore කරන්න'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
