import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { navigationHistoryManager } from '../services/navigationHistoryManager';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'තහවුරු කිරීම (Confirm)',
  message,
  confirmText = 'ඔව්, තහවුරු කරන්න (Confirm)',
  cancelText = 'අවලංගු කරන්න (Cancel)',
  variant = 'danger',
  isLoading = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      navigationHistoryManager.pushModal('confirm_modal', onClose, 100);
    } else {
      navigationHistoryManager.removeModal('confirm_modal');
    }
    return () => navigationHistoryManager.removeModal('confirm_modal');
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto select-none pt-safe pb-safe"
          onClick={() => {
            if (!isLoading) {
              triggerHaptic('light');
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-amber-400/40 dark:border-amber-700/60 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden my-auto text-slate-900 dark:text-stone-100 flex flex-col max-h-[calc(100dvh-2rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            {/* Top Accent Strip */}
            <div
              className={`h-1.5 bg-gradient-to-r shrink-0 ${
                isDanger
                  ? 'from-rose-600 via-rose-400 to-rose-600'
                  : isWarning
                  ? 'from-amber-600 via-amber-400 to-amber-600'
                  : 'from-blue-600 via-blue-400 to-blue-600'
              }`}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-2xl shrink-0 ${
                    isDanger
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : isWarning
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {isDanger ? (
                    <Trash2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <h3
                  id="confirm-modal-title"
                  className="text-base sm:text-lg font-serif font-black text-slate-900 dark:text-stone-100"
                >
                  {title}
                </h3>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                disabled={isLoading}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition rounded-xl bg-slate-100 dark:bg-stone-800 cursor-pointer active:scale-95 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-stone-300 font-medium">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 px-4 sm:px-5 py-3.5 bg-slate-50 dark:bg-stone-950 border-t border-slate-100 dark:border-stone-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs font-bold text-slate-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-xl hover:bg-slate-100 dark:hover:bg-stone-700 transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs flex items-center justify-center touch-manipulation"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(isDanger ? 'warning' : 'medium');
                  onConfirm();
                }}
                disabled={isLoading}
                className={`w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-xs font-black text-white rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 touch-manipulation ${
                  isDanger
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                    : isWarning
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
                }`}
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
