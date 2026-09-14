import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  RefreshCw,
  Trash2,
  Download,
  User,
  Globe,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { SystemAuditLog as AuditLog } from '../../../types';
import { auditApi } from '../../../api';
import { useToast } from '../../../context/ToastContext';

interface AuditTabProps {
  auditLogs: AuditLog[];
  onRefresh?: () => void;
  onClearLogs?: () => void;
}

export const AuditTab: React.FC<AuditTabProps> = React.memo(({ auditLogs: initialLogs, onRefresh, onClearLogs }) => {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [filterCategory, setFilterCategory] = useState<'all' | 'auth' | 'data'>(() => {
    try {
      const saved = localStorage.getItem('pirivena_audit_filter');
      return (saved as 'all' | 'auth' | 'data') || 'all';
    } catch (e) {
      return 'all';
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_audit_filter', filterCategory);
    } catch (e) {}
  }, [filterCategory]);

  // Sync if parent prop updates
  React.useEffect(() => {
    if (initialLogs && initialLogs.length > 0) {
      setLogs(initialLogs);
    }
  }, [initialLogs]);

  const handleFetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const data = await auditApi.getLogs();
      if (Array.isArray(data)) {
        setLogs(data);
        toast.success('ආරක්ෂක සටහන් සාර්ථකව යාවත්කාලීන විය!');
      }
      if (onRefresh) onRefresh();
    } catch (e) {
      toast.error('ආරක්ෂක සටහන් ලබාගැනීම අසාර්ථක විය.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('ඔබට සියලුම පද්ධති ආරක්ෂක සටහන් (Audit Logs) පිරිසිදු කිරීමට අවශ්‍යද?')) {
      return;
    }
    try {
      await auditApi.clearLogs();
      setLogs([]);
      if (onClearLogs) onClearLogs();
      toast.success('ආරක්ෂක සටහන් (Audit Logs) සාර්ථකව පිරිසිදු කරන ලදී!');
    } catch (e) {
      toast.error('පිරිසිදු කිරීම අසාර්ථක විය.');
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pirivena_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('ආරක්ෂක සටහන් වාර්තාව (JSON) බාගත විය!');
  };

  const filteredLogs = logs.filter((log) => {
    if (filterCategory === 'auth') {
      return (
        log.action &&
        (log.action.toLowerCase().includes('login') ||
          log.action.toLowerCase().includes('පිවිසීම') ||
          log.action.toLowerCase().includes('auth'))
      );
    }
    if (filterCategory === 'data') {
      return (
        log.action &&
        (log.action.toLowerCase().includes('create') ||
          log.action.toLowerCase().includes('update') ||
          log.action.toLowerCase().includes('delete') ||
          log.action.toLowerCase().includes('donation') ||
          log.action.toLowerCase().includes('student'))
      );
    }
    return true;
  });

  return (
    <div className="space-y-3 pb-12 select-none animate-fade-in text-slate-900 dark:text-white">
      {/* 1. SINGLE-LINE TOOLBAR: FILTER SWITCHER + ACTIONS */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-2 sm:p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        {/* Category Switcher Pills */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-stone-800 rounded-xl text-xs font-black gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              filterCategory === 'all'
                ? 'bg-teal-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🛡️ සියලු සටහන්</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterCategory === 'all'
                  ? 'bg-white/25 text-white font-bold'
                  : 'bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {logs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('auth')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              filterCategory === 'auth'
                ? 'bg-blue-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🔐 පිවිසුම් (Auth)</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterCategory('data')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              filterCategory === 'data'
                ? 'bg-purple-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>💾 දත්ත වෙනස්කම්</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleFetchLogs}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-800 dark:text-slate-200 font-bold text-[10.5px] rounded-lg border border-slate-200 dark:border-stone-700 transition flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'යාවත්කාලීන...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExport}
            className="px-2.5 py-1.5 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-800 dark:text-slate-200 font-bold text-[10.5px] rounded-lg border border-slate-200 dark:border-stone-700 transition flex items-center gap-1 cursor-pointer active:scale-95 group"
            title="Export to JSON"
          >
            <Download className="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleClear}
            className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-[10.5px] rounded-lg border border-rose-200 dark:border-rose-800 transition flex items-center gap-1 cursor-pointer active:scale-95 group"
            title="Clear All Logs"
          >
            <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* 2. COMPACT AUDIT LOGS FEED */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 space-y-2 shadow-2xs">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-stone-800 flex items-center justify-center text-lg">
              🛡️
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              ආරක්ෂක සටහන් කිසිවක් හමු නොවීය.
            </p>
          </div>
        ) : (
          filteredLogs.slice(0, 100).map((log) => {
            const isAuth =
              log.action &&
              (log.action.toLowerCase().includes('login') ||
                log.action.toLowerCase().includes('පිවිසීම') ||
                log.action.toLowerCase().includes('auth'));

            return (
              <div
                key={log.id}
                className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-xl p-2.5 sm:p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all duration-200 hover:border-teal-300 dark:hover:border-teal-800/60"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Action Icon Pill */}
                  <div
                    className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-black ${
                      isAuth
                        ? 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
                        : 'bg-purple-500/15 text-purple-600 border border-purple-500/30'
                    }`}
                  >
                    {isAuth ? '🔐' : '💾'}
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-serif font-black text-xs text-slate-900 dark:text-white truncate">
                        {log.userName || (log as any).userEmail || 'පද්ධති පරිශීලක'}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                          isAuth
                            ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                            : 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-600 dark:text-slate-400 truncate">
                      {log.details || 'ක්‍රියාකාරකම සාර්ථකව සිදු විය.'}
                    </p>
                  </div>
                </div>

                {/* Right: Timestamp & IP */}
                <div className="flex items-center gap-2 text-[9.5px] font-mono text-slate-500 shrink-0 self-end sm:self-auto">
                  {log.ipAddress && (
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-stone-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-stone-700">
                      <Globe className="w-2.5 h-2.5 text-slate-400" />
                      <span>{log.ipAddress}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    <span>{new Date(log.timestamp || (log as any).created_at || (log as any).createdAt || Date.now()).toLocaleTimeString()}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

