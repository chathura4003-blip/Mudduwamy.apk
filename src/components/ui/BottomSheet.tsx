import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { navigationHistoryManager } from '../../services/navigationHistoryManager';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  id?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = 'lg',
  id = 'bottom_sheet',
}) => {
  // Connect with Android hardware back button
  useEffect(() => {
    if (isOpen) {
      navigationHistoryManager.pushModal(id, onClose, 55);
    } else {
      navigationHistoryManager.removeModal(id);
    }
    return () => navigationHistoryManager.removeModal(id);
  }, [isOpen, id, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-xl',
    xl: 'sm:max-w-2xl',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthClass} bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200/80 dark:border-stone-800 flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden animate-slide-up sm:animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Pill */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-stone-700" />
        </div>

        {/* Header */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between border-b border-slate-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {Icon && (
              <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Icon className="w-4.5 h-4.5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate leading-normal">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-stone-400 truncate mt-0.5 leading-normal">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8.5 h-8.5 sm:w-9 sm:h-9 min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] rounded-2xl bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:text-stone-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-4 -webkit-overflow-scrolling-touch">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="px-3.5 sm:px-6 py-2.5 sm:py-4 border-t border-slate-100 dark:border-stone-800 bg-slate-50/50 dark:bg-stone-900/50 pb-safe shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
