import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Search,
  Trash2,
  Download,
  X,
  Clock,
  User,
  Key,
  Database,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { SystemAuditLog } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptics';

interface SystemAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: SystemAuditLog[];
  onClearAuditLogs: () => void;
}

export const SystemAuditModal: React.FC<SystemAuditModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
  onClearAuditLogs,
}) => {
  const { language } = useLanguage();
  const isSi = language === 'si';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'auth' | 'student' | 'exam' | 'system'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredLogs = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      log.action?.toLowerCase().includes(q) ||
      log.userName?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.ipAddress?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterCategory === 'auth') {
      return /login|logout|auth|password|session/i.test(log.action + ' ' + (log.details || ''));
    }
    if (filterCategory === 'student') {
      return /student|admission|enrolled|qr|report/i.test(log.action + ' ' + (log.details || ''));
    }
    if (filterCategory === 'exam') {
      return /exam|grade|marks|submission|review/i.test(log.action + ' ' + (log.details || ''));
    }
    if (filterCategory === 'system') {
      return /setting|backup|database|notice|sync/i.test(log.action + ' ' + (log.details || ''));
    }
    return true;
  });

  const handleExportJson = () => {
    triggerHaptic('medium');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pirivena_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionIcon = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('login') || lower.includes('auth')) return <Key className="w-3.5 h-3.5 text-blue-500" />;
    if (lower.includes('student') || lower.includes('admission')) return <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />;
    if (lower.includes('exam') || lower.includes('grade')) return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
    if (lower.includes('delete') || lower.includes('reject')) return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
    return <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />;
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 select-none overflow-y-auto pt-safe pb-safe"
          onClick={onClose}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full border border-teal-500/40 dark:border-teal-700/50 shadow-[0_25px_70px_rgba(0,0,0,0.85)] space-y-4 my-auto text-slate-900 dark:text-white max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden"
        >
          {/* Top Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-teal-600 via-emerald-400 to-teal-600 shrink-0" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0 bg-gradient-to-r from-stone-950 via-teal-950/60 to-stone-950 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 shadow-2xs border border-teal-400/40">
                <ShieldCheck className="w-5 h-5 animate-icon-pulse-glow" />
              </div>
              <div>
                <h3 className="font-serif font-black text-sm sm:text-base text-teal-100 flex items-center gap-2">
                  <span>{isSi ? 'පද්ධති ආරක්ෂක ලොග් (Security Audit Trail)' : 'Security Audit Trail'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    LIVE LOGS
                  </span>
                </h3>
                <p className="text-[11px] text-teal-200/80">
                  {auditLogs.length} {isSi ? 'ක්‍රියාකාරකම් සටහන් වී ඇත' : 'system activities recorded'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportJson}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer active:scale-95 text-xs font-bold flex items-center gap-1 group"
                title={isSi ? 'ලොග් බාගත කරන්න (Export JSON)' : 'Export JSON'}
              >
                <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {confirmClear ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      triggerHaptic('warning');
                      onClearAuditLogs();
                      setConfirmClear(false);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-[11px] font-black animate-pulse cursor-pointer"
                  >
                    {isSi ? 'තහවුරු කරන්න' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="p-1.5 text-stone-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setConfirmClear(true);
                  }}
                  disabled={auditLogs.length === 0}
                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition cursor-pointer active:scale-95 disabled:opacity-40 group"
                  title={isSi ? 'ලොග් මකන්න' : 'Clear Logs'}
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              )}

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="p-2 text-stone-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-xl transition cursor-pointer active:scale-95 ml-1 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="px-4 sm:px-6 space-y-2.5 shrink-0">
            <div className="relative">
              <input
                id="audit-log-search-input"
                name="searchQuery"
                aria-label={isSi ? 'ආරක්ෂක ලොග් සොයන්න' : 'Search audit logs'}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSi ? 'පරිශීලක නම, ක්‍රියාව හෝ තොරතුරු සොයන්න...' : 'Search logs by user, action, details...'}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-stone-800 text-xs bg-slate-50 dark:bg-stone-800/80 focus:outline-none focus:border-teal-500 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Filter Pills / Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              {[
                { id: 'all', label: isSi ? 'සියලු සටහන්' : 'All Logs' },
                { id: 'auth', label: isSi ? 'ප්‍රවේශ වීම් (Auth)' : 'Auth' },
                { id: 'student', label: isSi ? 'ශිෂ්‍ය/ඇතුළත් වීම්' : 'Students' },
                { id: 'exam', label: isSi ? 'විභාග/ලකුණු' : 'Exams' },
                { id: 'system', label: isSi ? 'පද්ධතිය/බැකප්' : 'System' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setFilterCategory(cat.id as any);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap active:scale-95 cursor-pointer text-xs ${
                    filterCategory === cat.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Log List View */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-stone-800/80 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-stone-700" />
                <p>{isSi ? 'සටහන් වූ ආරක්ෂණ ලොග් හමු නොවීය.' : 'No audit records match your search.'}</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="pt-2.5 pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs hover:bg-slate-50/80 dark:hover:bg-stone-850/40 p-2.5 rounded-2xl transition"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="p-1 rounded-lg bg-slate-100 dark:bg-stone-800 shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      <span className="font-black text-slate-900 dark:text-white truncate">
                        {log.userName || 'System Admin'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-stone-800 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-stone-700">
                        {log.action}
                      </span>
                      {log.ipAddress && (
                        <span className="text-[9px] font-mono text-slate-400 dark:text-stone-500">
                          ({log.ipAddress})
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-slate-600 dark:text-stone-300 pl-6 leading-relaxed">
                        {log.details}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-stone-400 font-mono shrink-0 self-end sm:self-center pl-6 sm:pl-0">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 sm:p-4 pb-safe bg-stone-50 dark:bg-stone-950 border-t border-slate-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-stone-400 font-medium text-center sm:text-left">
              🔒 High Security Audit Trail • Real-time Log Engine
            </span>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] touch-manipulation flex items-center justify-center bg-slate-200 dark:bg-stone-800 hover:bg-slate-300 dark:hover:bg-stone-700 text-slate-800 dark:text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
            >
              {isSi ? 'වසන්න (Close)' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
