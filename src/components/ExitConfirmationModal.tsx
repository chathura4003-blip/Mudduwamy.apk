import React from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleExit = async () => {
    triggerHaptic('heavy');
    try {
      await CapacitorApp.exitApp();
    } catch (e) {
      // If web browser where exitApp is not applicable, close modal
      onClose();
    }
  };

  const handleStay = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <div
      data-modal="true"
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in pt-safe pb-safe"
      onClick={handleStay}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up max-h-[calc(100dvh-2rem)] overflow-y-auto mobile-bottom-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Bottom Sheet Drag Indicator */}
        <div className="bottom-sheet-drag-handle sm:hidden -mt-2 mb-2" />

        {/* Header Icon */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={handleStay}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 rounded-full transition touch-manipulation active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-serif font-black text-slate-900 dark:text-stone-100">
            යෙදුමෙන් ඉවත් වීම
          </h3>
          <p className="text-sm text-slate-600 dark:text-stone-300 font-medium">
            යෙදුමෙන් ඉවත් වීමට අවශ්‍යද?
          </p>
          <p className="text-xs text-slate-400 dark:text-stone-500">
            Are you sure you want to exit the application?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleStay}
            className="w-full sm:flex-1 py-3 px-4 min-h-[44px] touch-manipulation rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-800 dark:text-stone-200 font-bold text-sm transition active:scale-95 cursor-pointer text-center flex items-center justify-center"
          >
            නැවතී සිටින්න
          </button>

          <button
            type="button"
            onClick={handleExit}
            className="w-full sm:flex-1 py-3 px-4 min-h-[44px] touch-manipulation rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <LogOut className="w-4 h-4" />
            <span>ඉවත් වන්න</span>
          </button>
        </div>
      </div>
    </div>
  );
};
