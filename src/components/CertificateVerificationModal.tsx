import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PirivenaLogo } from './PirivenaLogo';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import {
  Search,
  CheckCircle2,
  XCircle,
  X,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Sparkles,
  Building2,
  Printer,
  Share2,
  Calendar,
  Award,
  Hash,
  FileCheck2,
  Info,
} from 'lucide-react';
import type { CertificateInfo } from '../types';
import { certificatesApi } from '../api';
import { triggerHaptic } from '../utils/haptics';
import { copyToClipboard } from '../utils/clipboardHelper';
import { shareContent } from '../utils/shareHelper';
import { triggerUniversalPrint } from '../utils/printHelper';
import { getPublicShareUrl } from '../utils/urlHelper';
import { navigationHistoryManager } from '../services/navigationHistoryManager';

interface CertificateVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCertId?: string;
}

export const CertificateVerificationModal: React.FC<CertificateVerificationModalProps> = ({
  isOpen,
  onClose,
  initialCertId = '',
}) => {
  const { language } = useLanguage();
  const toast = useToast();
  const isSi = language === 'si';

  const [activeTab, setActiveTab] = useState<'search' | 'result'>('search');
  const [certId, setCertId] = useState(initialCertId);
  const [result, setResult] = useState<CertificateInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (queryToUse?: string) => {
    const idToSearch = (queryToUse || certId).trim();
    if (!idToSearch) return;
    triggerHaptic('light');
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await certificatesApi.verifyCertificate(idToSearch);
      if (data.verified || data.valid) {
        setResult(data);
        setActiveTab('result');
        triggerHaptic('medium');
      } else {
        setError(
          data.error ||
            (isSi
              ? 'මෙම අංකයට (ID) අදාළ ශිෂ්‍ය, ගුරු හෝ සහතිකපත්‍ර ලියාපදිංචි වාර්තාවක් පිරිවෙන් පද්ධතියේ හමු නොවීය.'
              : 'No matching student, teacher, or certificate record found in the Pirivena Registry for this ID.')
        );
        triggerHaptic('warning');
      }
    } catch (e: any) {
      setError(
        e?.message ||
          (isSi
            ? 'සත්‍යාපන සේවාදායකය සමඟ සම්බන්ධ විය නොහැක. කරුණාකර නැවත උත්සාහ කරන්න.'
            : 'Unable to reach the verification server. Please check your connection and try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Register with Android Back Stack
  useEffect(() => {
    if (isOpen) {
      navigationHistoryManager.pushModal('cert_verification_modal', onClose, 20);
    } else {
      navigationHistoryManager.removeModal('cert_verification_modal');
    }
    return () => navigationHistoryManager.removeModal('cert_verification_modal');
  }, [isOpen, onClose]);

  // Sync initial ID
  useEffect(() => {
    if (initialCertId && initialCertId.trim()) {
      setCertId(initialCertId.trim());
      handleVerify(initialCertId.trim());
    }
  }, [initialCertId]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleShare = async () => {
    if (result) {
      const res = await shareContent({
        title: `Sri Sumana Pirivena Verified Certificate - ${result.certificateId || result.studentName}`,
        text: `Official Verified Record: ${result.studentName} (${result.certificateId || certId})`,
        url: getPublicShareUrl(),
      });
      if (res.success && res.method === 'clipboard') {
        toast.success(isSi ? '✓ සහතික අංකය සාර්ථකව Copy විය!' : '✓ Certificate ID copied to clipboard!');
      }
    } else {
      const ok = await copyToClipboard(certId);
      if (ok) {
        toast.success(isSi ? '✓ සහතික අංකය සාර්ථකව Copy විය!' : '✓ Certificate ID copied to clipboard!');
      } else {
        toast.error('පිටපත් කිරීමට නොහැකි විය.');
      }
    }
  };

  const quickSamples = ['STD-2026-001', 'TCH-001', 'CERT-2026-01', 'ADM-2026-001'];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          data-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto select-none pt-safe pb-safe print-container print:p-0 print:bg-white print:static"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="bg-white dark:bg-stone-900 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] w-full max-w-xl overflow-hidden border border-amber-300/80 dark:border-amber-700/60 my-auto max-h-[calc(100dvh-2rem)] flex flex-col text-stone-900 dark:text-stone-100 mobile-bottom-sheet print-modal-content print:shadow-none print:border-none print:w-full print:rounded-none"
          >
          {/* Mobile Bottom Sheet Drag Indicator */}
          <div className="bottom-sheet-drag-handle sm:hidden" />

          {/* Top Golden Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shrink-0" />

          {/* Modal Header */}
          <div className="bg-gradient-to-r from-stone-950 via-amber-950 to-stone-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-amber-500/25 shrink-0">
            <div className="flex items-center gap-3">
              <PirivenaLogo size={42} variant="icon" animate />
              <div>
                <h3 className="font-serif font-black text-sm sm:text-base text-amber-100 flex items-center gap-2">
                  <span>{isSi ? 'සහතික & අක්තපත්‍ර සත්‍යාපනය' : 'Certificate & Credential Verification'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    VERIFY PRO
                  </span>
                </h3>
                <p className="text-[11px] text-amber-200/80 font-medium">
                  {isSi
                    ? 'ශ්‍රී සුමන මහා පිරිවෙන - රත්නපුර මුද්දුව | නිල සත්‍යාපන ද්වාරය'
                    : 'Sri Sumana Maha Pirivena - Official Registry Portal'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 text-stone-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-xl transition cursor-pointer active:scale-95 shrink-0"
              title={isSi ? 'වසන්න' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Sub-Tabs */}
          <div className="px-4 pt-3 pb-1 bg-stone-50 dark:bg-stone-850 border-b border-slate-200 dark:border-stone-800 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('search');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                activeTab === 'search'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-slate-600 dark:text-stone-300 hover:bg-slate-100'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isSi ? '🔍 සත්‍යාපන සෙවුම' : 'Search & Verify'}</span>
            </button>

            {result && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab('result');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                  activeTab === 'result'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSi ? '📜 සහතික තොරතුරු' : 'Verified Record'}</span>
              </button>
            )}
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {activeTab === 'search' && (
              <div className="space-y-4">
                {/* Search Box */}
                <div className="space-y-2">
                  <label
                    htmlFor="certificateverificationmodal-certId"
                    className="text-xs font-bold text-stone-700 dark:text-stone-300 block"
                  >
                    {isSi
                      ? 'සහතික අංකය, ශිෂ්‍ය ID, ගුරු ID හෝ Tracking අංකය ඇතුළත් කරන්න:'
                      : 'Enter Certificate ID, Student ID, Staff ID, or Tracking No:'}
                  </label>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleVerify();
                    }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <input
                        autoComplete="name"
                        id="certificateverificationmodal-certId"
                        name="certId"
                        type="text"
                        value={certId}
                        onChange={(e) => setCertId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                        placeholder={
                          isSi
                            ? 'ශිෂ්‍ය ID, ගුරු ID, සහතික අංකය...'
                            : 'e.g. STD-2026-001, TCH-001, CERT-...'
                        }
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-amber-300 dark:border-amber-700 text-xs sm:text-sm font-mono font-bold text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-800 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-500"
                      />
                      <Search className="w-4 h-4 text-amber-600 dark:text-amber-400 absolute left-3.5 top-3.5" />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !certId.trim()}
                      className="px-4 sm:px-5 py-3 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 dark:from-amber-600 dark:to-amber-700 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {loading ? (
                        <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      ) : (
                        <Search className="w-4 h-4 text-amber-300" />
                      )}
                      <span>{isSi ? 'සත්‍යාපනය' : 'Verify'}</span>
                    </button>
                  </form>

                  {/* Quick Sample ID Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-stone-400 font-bold">{isSi ? 'උදාහරණ:' : 'Samples:'}</span>
                    {quickSamples.map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => {
                          setCertId(sample);
                          handleVerify(sample);
                        }}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 active:scale-95 transition cursor-pointer"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Helpful Instruction Box */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-stone-850 border border-amber-200/80 dark:border-stone-750 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    {isSi
                      ? 'ශ්‍රී සුමන මහා පිරිවෙන මඟින් නිකුත් කරන ලද නිල සහතිකපත් අංක, ශිෂ්‍ය ID, ගුරු ID හෝ ඇතුළත්වීමේ Tracking අංක සත්‍යාපනය කළ හැක.'
                      : 'Official certificates, Student IDs, Staff credentials, and Admission Tracking numbers issued by Sri Sumana Pirivena can be securely verified.'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'result' && result && (
              <div className="bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border border-amber-500/40 rounded-3xl p-4 sm:p-5 text-stone-100 space-y-4 shadow-2xl relative overflow-hidden animate-fade-in print-modal-content select-none">
                {/* Gold watermark accent */}
                <div className="absolute right-[-10px] bottom-[-10px] opacity-5 pointer-events-none text-amber-400 no-print">
                  <Building2 className="w-40 h-40" />
                </div>

                {/* Verified Status Banner Header */}
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-5 h-5 animate-icon-bounce" />
                    </div>
                    <div>
                      <span className="font-serif font-black text-xs sm:text-sm text-emerald-400 tracking-wider block uppercase">
                        OFFICIALLY VERIFIED RECORD
                      </span>
                      <span className="text-[10px] font-bold text-amber-200/70">
                        {isSi
                          ? 'ශ්‍රී සුමන මහා පිරිවෙන් නිල සත්‍යාපිත ලේඛනය'
                          : 'Sri Sumana Maha Pirivena Official Verified Record'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-500/15 border border-amber-400/30 text-amber-300 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 animate-icon-pulse-glow" />
                    <span>{result.verifiedType || 'VERIFIED'}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Name */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5 sm:col-span-2">
                    <span className="text-[10px] text-amber-300/80 font-bold block uppercase flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isSi ? 'නම / හිමි නම' : 'Full Name / Monastic Title'}</span>
                    </span>
                    <div className="font-serif font-black text-sm sm:text-base text-amber-100">
                      {result.studentName || (result as any).recipientName || 'නොදන්නා'}
                    </div>
                  </div>

                  {/* ID / Certificate Number */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-bold block uppercase flex items-center gap-1">
                      <Hash className="w-3 h-3 text-amber-400" />
                      <span>{isSi ? 'අදාළ අංකය' : 'Record Reference ID'}</span>
                    </span>
                    <div className="font-mono font-bold text-xs text-emerald-300">
                      {result.certificateId || certId}
                    </div>
                  </div>

                  {/* Course / Class */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                    <span className="text-[10px] text-stone-400 font-bold block uppercase flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-amber-400" />
                      <span>{isSi ? 'ශ්‍රේණිය / පාඨමාලාව' : 'Class / Course'}</span>
                    </span>
                    <div className="font-bold text-xs text-stone-200">
                      {result.courseTitle || (result as any).className || 'පිරිවෙන් අධ්‍යයන අංශය'}
                    </div>
                  </div>

                  {/* Issue Date */}
                  {result.issueDate && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                      <span className="text-[10px] text-stone-400 font-bold block uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400 animate-icon-bounce" />
                        <span>{isSi ? 'නිකුත් කළ දිනය' : 'Issue Date'}</span>
                      </span>
                      <div className="font-bold text-xs text-stone-300">
                        {result.issueDate}
                      </div>
                    </div>
                  )}

                  {/* Grade / Distinction */}
                  {result.grade && (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                      <span className="text-[10px] text-stone-400 font-bold block uppercase flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400 animate-icon-sparkle" />
                        <span>{isSi ? 'සාමාර්ථය' : 'Grade / Distinction'}</span>
                      </span>
                      <div className="font-bold text-xs text-amber-300">
                        {result.grade}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons: Print & Share */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10 no-print">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer group"
                  >
                    <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>{isSi ? 'බෙදාහරින්න' : 'Share'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerUniversalPrint(`සත්‍යාපිත_සහතිකය_${result?.certificateId || certId}`);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md group"
                  >
                    <Printer className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>{isSi ? 'මුද්‍රණය (Print / PDF)' : 'Print / PDF'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3 animate-fade-in">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">{isSi ? 'සත්‍යාපනය අසාර්ථක විය' : 'Verification Failed'}</div>
                  <p className="leading-relaxed opacity-90">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 sm:p-4 bg-stone-100 dark:bg-stone-950 border-t border-slate-200 dark:border-stone-800 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
              🔒 SSL Encrypted • 100% Verified Registry
            </span>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="px-4 py-2 bg-slate-200 dark:bg-stone-800 hover:bg-slate-300 dark:hover:bg-stone-700 text-slate-800 dark:text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
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
