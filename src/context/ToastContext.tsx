import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

import { createPortal } from 'react-dom';

import { triggerHaptic } from '../utils/haptics';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', title?: string, duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastItem = { id, message, type, title, duration };
      
      // Trigger tactile haptic feedback on mobile
      if (type === 'success') triggerHaptic('success');
      else if (type === 'error') triggerHaptic('warning');
      else triggerHaptic('light');

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast(message, 'success', title || 'සාර්ථකයි (Success)'),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast(message, 'error', title || 'දෝෂයකි (Error)'),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast(message, 'info', title || 'තොරතුරයි (Info)'),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast(message, 'warning', title || 'අවධානයට (Warning)'),
    [showToast]
  );

  const toastContainer = (
    <div
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 sm:right-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 z-[100000] flex flex-col gap-2.5 max-w-md w-[calc(100vw-1.5rem)] sm:w-full px-0 pointer-events-none transition-all"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-2xl border-2 backdrop-blur-xl transition-all transform animate-in slide-in-from-bottom-5 fade-in duration-200 cursor-pointer active:scale-98 select-none ${
              isSuccess
                ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500 shadow-emerald-950/60'
                : isError
                ? 'bg-rose-950/95 text-rose-100 border-rose-500 shadow-rose-950/60'
                : isWarning
                ? 'bg-amber-950/95 text-amber-100 border-amber-500 shadow-amber-950/60'
                : 'bg-stone-900/95 text-stone-100 border-amber-400 shadow-stone-950/80'
            }`}
          >
            {/* Icon */}
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isSuccess
                  ? 'bg-emerald-500 text-emerald-950'
                  : isError
                  ? 'bg-rose-500 text-white'
                  : isWarning
                  ? 'bg-amber-500 text-amber-950'
                  : 'bg-amber-500 text-amber-950'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.5]" />}
              {isError && <AlertCircle className="w-4.5 h-4.5 stroke-[2.5]" />}
              {isWarning && <AlertTriangle className="w-4.5 h-4.5 stroke-[2.5]" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4.5 h-4.5 stroke-[2.5]" />}
            </div>

            {/* Message Content */}
            <div className="flex-1 pt-0.5 pr-2">
              {toast.title && (
                <h4 className="text-[11px] font-black tracking-wide uppercase text-white mb-0.5 font-serif">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs sm:text-sm font-bold text-stone-100 leading-snug break-words">
                {toast.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="p-1 rounded-lg text-stone-300 hover:text-white hover:bg-white/20 transition-colors shrink-0 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {typeof document !== 'undefined' ? createPortal(toastContainer, document.body) : toastContainer}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
