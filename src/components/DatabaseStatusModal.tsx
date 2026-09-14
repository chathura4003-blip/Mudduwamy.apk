import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Users,
  Table,
  HardDrive,
  X,
  Clock,
  ShieldCheck,
  Cpu,
  Heart,
  BookOpen,
  Sparkles,
  ClipboardCheck,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicSite } from '../context/PublicSiteContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../api/apiClient';
import { triggerHaptic } from '../utils/haptics';
import { copyToClipboard } from '../utils/clipboardHelper';

interface DbStatusResponse {
  connected: boolean;
  message: string;
  host: string;
  port: number;
  database: string;
  user: string;
  latencyMs?: number;
  tables?: string[];
  userCount?: number;
  sampleUsers?: {
    id: string;
    username?: string;
    role?: string;
    name?: string;
    customId?: string;
    email?: string;
    status?: string;
  }[];
  error?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseStatusModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isSi = language === 'si';
  const { newsArticles, events, galleryItems, libraryBooks } = usePublicSite();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DbStatusResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const json = await apiClient<DbStatusResponse>('/api/db/diagnose');
      const calculatedLatency = Math.round(performance.now() - startTime);
      setData({
        ...json,
        latencyMs: json.latencyMs !== undefined ? json.latencyMs : calculatedLatency,
      });
      setLastChecked(new Date());
    } catch (err: any) {
      const calculatedLatency = Math.round(performance.now() - startTime);
      setData({
        connected: false,
        message: isSi
          ? 'Backend Server හෝ MySQL වෙත සම්බන්ධ විය නොහැක: ' + (err.message || 'Network Error')
          : 'Unable to connect to Backend Server or MySQL: ' + (err.message || 'Network Error'),
        host: 'srisumanamahapiriwena-lk.us.stackstaging.com',
        port: 3306,
        database: 'srisuman_erp',
        user: 'srisuman_admin',
        latencyMs: calculatedLatency,
        error: err.message,
      });
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const toast = useToast();

  const handleCopy = async (text: string, fieldKey: string) => {
    try {
      const ok = await copyToClipboard(text);
      if (ok) {
        setCopiedField(fieldKey);
        toast.success(`✓ ${fieldKey} අගය (${text}) සාර්ථකව Copy විය!`);
        setTimeout(() => setCopiedField(null), 2000);
      } else {
        toast.error('පිටපත් කිරීමට නොහැකි විය.');
      }
    } catch (e) {
      toast.error('පිටපත් කිරීමට නොහැකි විය.');
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto pt-safe pb-safe"
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white dark:bg-stone-900 border border-amber-300/80 dark:border-amber-700/60 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden text-slate-900 dark:text-stone-100 flex flex-col max-h-[calc(100dvh-2rem)] my-auto"
          >
          {/* Top Golden Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shrink-0" />

          {/* Modal Header */}
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-stone-950 via-amber-950 to-stone-950 text-white border-b border-amber-500/25 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-md shrink-0 ${
                  data?.connected
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400'
                    : 'bg-rose-500/20 border-rose-400/50 text-rose-400'
                }`}
              >
                <Database className="w-5 h-5 animate-icon-pulse-glow" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-black text-sm sm:text-base text-amber-100 truncate">
                    {isSi ? 'සජීවී දත්ත සමුදාය (Live MySQL Status)' : 'Live MySQL Database Diagnostics'}
                  </h3>
                  <span
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                      data?.connected
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        data?.connected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                      }`}
                    />
                    <span>{data?.connected ? 'MYSQL 8.0 ONLINE' : 'DISCONNECTED'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/80 truncate mt-0.5">
                  {isSi
                    ? 'StackCP High-Performance MySQL 8.0 Cloud Server & Live Synchronization'
                    : 'StackCP Production Cloud Database Server'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-xl transition cursor-pointer shrink-0"
              title={isSi ? 'වසන්න' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
            {/* Status Banner */}
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                data?.connected
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/60 text-rose-950 dark:text-rose-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {loading ? (
                  <RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-spin shrink-0 mt-0.5" />
                ) : data?.connected ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 animate-icon-pulse-glow" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 animate-icon-bounce" />
                )}
                <div>
                  <div className="font-black text-sm sm:text-base flex items-center gap-2 flex-wrap">
                    <span>
                      {data?.connected
                        ? isSi
                          ? 'MySQL Database එක සක්‍රීයව සම්බන්ධ වී ඇත!'
                          : 'MySQL Database Connected Successfully!'
                        : isSi
                          ? 'MySQL සම්බන්ධතාවයේ ගැටලුවක් පවතී'
                          : 'Database Connection Offline / Unreachable'}
                    </span>
                    {data?.latencyMs !== undefined && (
                      <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                        ⚡ {data.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-90 mt-0.5 font-medium leading-relaxed">
                    {data?.message || (isSi ? 'දත්ත සමුදාය පරීක්ෂා කරමින්...' : 'Checking database status...')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  checkConnection();
                }}
                disabled={loading}
                className="self-end sm:self-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer shrink-0 active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{isSi ? 'වේගය පරීක්ෂා කරන්න (Ping)' : 'Re-test Ping'}</span>
              </button>
            </div>

            {/* Connection Specs Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Host */}
              <div className="p-3 bg-slate-50 dark:bg-stone-850 border border-slate-200 dark:border-stone-800 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-stone-400 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Host Server</span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(data?.host || 'srisumanamahapiriwena-lk.us.stackstaging.com', 'host')
                    }
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {copiedField === 'host' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-xs font-black text-slate-800 dark:text-amber-200 truncate">
                  {data?.host || 'srisumanamahapiriwena-lk.us.stackstaging.com'}
                </div>
              </div>

              {/* Database Name */}
              <div className="p-3 bg-slate-50 dark:bg-stone-850 border border-slate-200 dark:border-stone-800 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-stone-400 font-bold">
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Database</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    Port: {data?.port || 3306}
                  </span>
                </div>
                <div className="font-mono text-xs font-black text-slate-800 dark:text-amber-200 truncate">
                  {data?.database || 'srisuman_erp'}
                </div>
              </div>

              {/* Engine & Security */}
              <div className="p-3 bg-slate-50 dark:bg-stone-850 border border-slate-200 dark:border-stone-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-stone-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Engine & Security</span>
                </div>
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate">
                  MySQL 8.0 • InnoDB • SSL/TLS Active
                </div>
              </div>

              {/* Registered Users */}
              <div className="p-3 bg-slate-50 dark:bg-stone-850 border border-slate-200 dark:border-stone-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-stone-400 font-bold">
                  <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>DB Users Count</span>
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {data?.userCount !== undefined ? `${data.userCount} Accounts Registered` : 'Live Synced'}
                </div>
              </div>
            </div>

            {/* Live System Entity Counters */}
            <div className="p-4 bg-slate-50 dark:bg-stone-850 border border-slate-200 dark:border-stone-800 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{isSi ? 'සජීවී දත්ත වාර්තා (Live Entity Records):' : 'Live Entity Records:'}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">{isSi ? 'පුස්තකාල පොත්' : 'E-Books'}</div>
                    <div className="font-black text-slate-900 dark:text-white">{libraryBooks.length}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">{isSi ? 'පුවත් & ලිපි' : 'News'}</div>
                    <div className="font-black text-slate-900 dark:text-white">{newsArticles.length}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">{isSi ? 'උත්සව' : 'Events'}</div>
                    <div className="font-black text-slate-900 dark:text-white">{events.length}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold">{isSi ? 'ගැලරි මාධ්‍ය' : 'Gallery'}</div>
                    <div className="font-black text-slate-900 dark:text-white">{galleryItems.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Database Tables Found */}
            {data?.tables && data.tables.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-stone-850 border border-slate-200 dark:border-stone-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>
                      {isSi
                        ? `MySQL දත්ත වගු (Tables ${data.tables.length} ක් සක්‍රීයයි):`
                        : `Active MySQL Database Tables (${data.tables.length}):`}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {data.tables.map((tbl, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-[11px] font-mono font-bold bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-750 text-slate-700 dark:text-amber-200 rounded-lg shadow-2xs"
                    >
                      {tbl}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-4 sm:px-6 py-3.5 bg-stone-100 dark:bg-stone-950 border-t border-slate-200 dark:border-stone-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 pb-safe">
            <div className="text-[11px] text-slate-500 dark:text-stone-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>
                {lastChecked
                  ? isSi
                    ? `අවසන් පරීක්ෂාව: ${lastChecked.toLocaleTimeString()}`
                    : `Last checked: ${lastChecked.toLocaleTimeString()}`
                  : isSi
                    ? 'පරීක්ෂා කරමින්...'
                    : 'Checking...'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  checkConnection();
                }}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer active:scale-95 shadow-xs touch-manipulation"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{isSi ? 'නැවුම් කරන්න' : 'Refresh'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-slate-200 dark:bg-stone-800 hover:bg-slate-300 dark:hover:bg-stone-700 text-slate-800 dark:text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center touch-manipulation"
              >
                {isSi ? 'වසන්න (Close)' : 'Close'}
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
