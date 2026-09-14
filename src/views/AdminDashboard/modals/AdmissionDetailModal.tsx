import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { OnlineAdmission } from '../../../types';
import {
  XCircle,
  Printer,
  Users,
  Phone,
  School,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Plus,
  X,
} from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';
import { triggerUniversalPrint } from '../../../utils/printHelper';

interface AdmissionDetailModalProps {
  isOpen?: boolean;
  previewAdmission?: OnlineAdmission | null;
  admission?: OnlineAdmission | null;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onUpdateStatus?: (id: string, status: 'approved' | 'rejected' | 'pending') => void;
  onConvertToStudent: (adm: OnlineAdmission) => void;
}

export const AdmissionDetailModal: React.FC<AdmissionDetailModalProps> = ({
  isOpen = true,
  previewAdmission: propPreviewAdmission,
  admission: propAdmission,
  onClose,
  onApprove: propOnApprove,
  onReject: propOnReject,
  onUpdateStatus,
  onConvertToStudent,
}) => {
  const previewAdmission = propPreviewAdmission || propAdmission || null;
  const onApprove = propOnApprove || ((id: string) => onUpdateStatus?.(id, 'approved'));
  const onReject = propOnReject || ((id: string) => onUpdateStatus?.(id, 'rejected'));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewAdmission && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewAdmission, isOpen, onClose]);

  const modalContent = (
    <AnimatePresence>
      {previewAdmission && isOpen && (
        <div
          data-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto select-none print-container print:p-0 print:bg-white print:static"
          onClick={onClose}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full border border-amber-500/40 dark:border-amber-700/60 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900 dark:text-stone-100 print-modal-content mobile-bottom-sheet print:shadow-none print:border-none print:w-full print:rounded-none select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Bottom Sheet Drag Indicator */}
          <div className="bottom-sheet-drag-handle sm:hidden no-print" />

          {/* Top Golden Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shrink-0 no-print" />

          {/* Modal Header */}
          <div className="bg-gradient-to-r from-stone-950 via-amber-950/80 to-stone-950 p-4 sm:p-5 text-white flex items-center justify-between border-b border-amber-500/20 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-lg shrink-0 shadow-2xs">
                🪷
              </div>
              <div className="min-w-0">
                <h3 className="font-serif font-black text-sm sm:text-base text-amber-100 truncate">
                  ශිෂ්‍ය ඇතුළත් වීමේ සම්පූර්ණ අයදුම්පත
                </h3>
                <div className="flex items-center gap-2 text-[10.5px] text-amber-200/80 font-mono mt-0.5 truncate">
                  <span>ID: {previewAdmission.trackingId || previewAdmission.id}</span>
                  <span>•</span>
                  <span>දිනය: {previewAdmission.submittedDate || previewAdmission.dateSubmitted || '2026-07-30'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 text-stone-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-xl transition cursor-pointer active:scale-95 shrink-0 no-print"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
            {/* Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-stone-850 border border-slate-200 dark:border-stone-750 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-stone-300 text-xs">
                  වත්මන් තත්වය:
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black border ${
                    previewAdmission.status === 'approved'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : previewAdmission.status === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse'
                  }`}
                >
                  {previewAdmission.status === 'approved'
                    ? '✅ අනුමත කර ඇත (Approved)'
                    : previewAdmission.status === 'rejected'
                      ? '❌ ප්‍රතික්ෂේපිතයි (Rejected)'
                      : '⏳ පරීක්ෂා වෙමින් පවතී (Pending Review)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerUniversalPrint(`ඇතුළත්_වීමේ_අයදුම්පත_${previewAdmission?.applicantName || previewAdmission?.monkName || 'Admission_Application'}`);
                }}
                className="px-3.5 py-1.5 bg-slate-200 dark:bg-stone-800 hover:bg-slate-300 dark:hover:bg-stone-700 text-slate-800 dark:text-stone-200 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer no-print"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </div>

            {/* SECTION 1: PRIMARY APPLICANT PROFILE */}
            <div className="bg-slate-50 dark:bg-stone-850 border border-slate-200/80 dark:border-stone-750 rounded-2xl p-4 space-y-3">
              <h4 className="font-serif font-bold text-slate-900 dark:text-stone-100 text-xs border-b border-slate-200/80 dark:border-stone-750 pb-2 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>1. ප්‍රධාන අයදුම්කරුගේ තොරතුරු (Primary Applicant Profile)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    ගෞරව නාමය / Title
                  </span>
                  <strong className="text-slate-900 dark:text-stone-100 font-bold block">
                    {previewAdmission.titlePrefix || 'පූජ්‍ය'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    අයදුම්කරුගේ සම්පූර්ණ නම
                  </span>
                  <strong className="text-slate-900 dark:text-stone-100 font-bold block">
                    {previewAdmission.applicantName || previewAdmission.monkName}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    පැවිදි නාමය (Monk Name)
                  </span>
                  <strong className="text-amber-700 dark:text-amber-300 font-bold block">
                    {previewAdmission.monkName || 'නොමැත (ගිහි ශිෂ්‍ය)'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    පැවිදි / ගිහි තත්වය
                  </span>
                  <strong className="text-slate-900 dark:text-stone-100 font-bold block">
                    {previewAdmission.monkStatus === 'monk'
                      ? '🪷 සාමණේර හිමි'
                      : previewAdmission.monkStatus === 'upasampada'
                        ? '☸ උපසම්පදා හිමි'
                        : '👤 ගිහි ශිෂ්‍ය'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    උපන් දිනය (DOB)
                  </span>
                  <strong className="text-slate-800 dark:text-stone-200 font-bold block font-mono">
                    {previewAdmission.dob || 'නොදන්නා'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    ගණනය කළ වයස
                  </span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold block">
                    {previewAdmission.calculatedAge
                      ? `${previewAdmission.calculatedAge} වසරයි`
                      : 'නොදන්නා'}
                  </strong>
                </div>

                <div className="sm:col-span-3">
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    ජාතික හැඳුනුම්පත් අංකය / උප්පැන්න අංකය (NIC / Birth Cert)
                  </span>
                  <strong className="text-slate-900 dark:text-stone-100 font-mono font-bold block">
                    {previewAdmission.nicOrBirthCert || 'නොමැත'}
                  </strong>
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTACT & RESIDENTIAL ADDRESS */}
            <div className="bg-slate-50 dark:bg-stone-850 border border-slate-200/80 dark:border-stone-750 rounded-2xl p-4 space-y-3">
              <h4 className="font-serif font-bold text-slate-900 dark:text-stone-100 text-xs border-b border-slate-200/80 dark:border-stone-750 pb-2 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>2. සම්බන්ධ කරගැනීමේ & ලිපින තොරතුරු (Contact & Address)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    ප්‍රධාන දුරකථන අංකය (Phone)
                  </span>
                  <strong className="text-slate-900 dark:text-stone-100 font-mono font-bold block">
                    {previewAdmission.phone || 'නොමැත'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    WhatsApp දුරකථන අංකය
                  </span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold block">
                    {previewAdmission.whatsappPhone || previewAdmission.phone || 'නොමැත'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    දිස්ත්‍රික්කය (District)
                  </span>
                  <strong className="text-slate-900 dark:text-stone-100 font-bold block">
                    {previewAdmission.district || 'රත්නපුර'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    ස්ථිර පදිංචි ලිපිනය (Full Address)
                  </span>
                  <strong className="text-slate-800 dark:text-stone-200 font-medium block">
                    {previewAdmission.address || 'නොමැත'}
                  </strong>
                </div>
              </div>
            </div>

            {/* SECTION 3: TEMPLE, ORDER & GUARDIAN */}
            <div className="bg-slate-50 dark:bg-stone-850 border border-slate-200/80 dark:border-stone-750 rounded-2xl p-4 space-y-3">
              <h4 className="font-serif font-bold text-slate-900 dark:text-stone-100 text-xs border-b border-slate-200/80 dark:border-stone-750 pb-2 flex items-center gap-1.5">
                <School className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>3. විහාරස්ථානය, නිකාය & භාරකරුගේ තොරතුරු (Temple & Guardian)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    වැඩවසන විහාරස්ථානය (Temple Name)
                  </span>
                  <strong className="text-slate-900 dark:text-stone-100 font-bold block">
                    {previewAdmission.templeName || 'නොදන්නා'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    නිකාය සහ පාර්ශවය (Nikaya & Chapter)
                  </span>
                  <strong className="text-amber-700 dark:text-amber-300 font-bold block">
                    {previewAdmission.nikayaChapter || 'ස්‍යාමෝපාලී මහා නිකාය'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    මව්පියන්ගේ / භාරකරුගේ නම (Guardian Name)
                  </span>
                  <strong className="text-slate-900 dark:text-stone-100 font-bold block">
                    {previewAdmission.guardianName || 'නොදන්නා'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    පෙර ඉගෙනුම ලැබූ පිරිවෙන/පාසල (Previous School)
                  </span>
                  <strong className="text-slate-800 dark:text-stone-200 font-medium block">
                    {previewAdmission.previousSchool || 'නොමැත'}
                  </strong>
                </div>
              </div>
            </div>

            {/* SECTION 4: APPLIED CLASS & HOSTEL REQUIREMENTS */}
            <div className="bg-slate-50 dark:bg-stone-850 border border-slate-200/80 dark:border-stone-750 rounded-2xl p-4 space-y-3">
              <h4 className="font-serif font-bold text-slate-900 dark:text-stone-100 text-xs border-b border-slate-200/80 dark:border-stone-750 pb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>4. ඉල්ලුම් කරන ශ්‍රේණිය & නවාතැන් පහසුකම් (Class & Hostel)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    ඉල්ලුම් කළ ශ්‍රේණිය (Applied Class)
                  </span>
                  <strong className="text-slate-900 dark:text-stone-100 font-black block text-sm">
                    {previewAdmission.appliedClass || 'ප්‍රාරම්භ 01'}
                  </strong>
                </div>

                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                    නවාතැන්/ආවාස පහසුකම් (Hostel Requirement)
                  </span>
                  <strong
                    className={`font-bold block ${previewAdmission.hostelRequired === 'yes' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-stone-300'}`}
                  >
                    {previewAdmission.hostelRequired === 'yes'
                      ? '🏠 අවශ්‍යයි (Hostel Accommodation Requested)'
                      : 'අනවශ්‍යයි (Day Scholar)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* SECTION 5: TALENTS & NOTES */}
            {(previewAdmission.specialTalents || previewAdmission.additionalNotes) && (
              <div className="bg-slate-50 dark:bg-stone-850 border border-slate-200/80 dark:border-stone-750 rounded-2xl p-4 space-y-3">
                <h4 className="font-serif font-bold text-slate-900 dark:text-stone-100 text-xs border-b border-slate-200/80 dark:border-stone-750 pb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>5. විශේෂ කුසලතා & අමතර සටහන් (Talents & Notes)</span>
                </h4>

                <div className="space-y-2 text-slate-800 dark:text-stone-200">
                  {previewAdmission.specialTalents && (
                    <div>
                      <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                        විශේෂ කුසලතා:
                      </span>
                      <p className="p-2.5 bg-white dark:bg-stone-800 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-medium mt-0.5">
                        {previewAdmission.specialTalents}
                      </p>
                    </div>
                  )}

                  {previewAdmission.additionalNotes && (
                    <div>
                      <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold">
                        අමතර විශේෂ සටහන්:
                      </span>
                      <p className="p-2.5 bg-white dark:bg-stone-800 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 font-medium mt-0.5">
                        {previewAdmission.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="bg-stone-50 dark:bg-stone-950 p-4 border-t border-slate-200 dark:border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 pb-safe">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  onApprove(previewAdmission.id);
                }}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation group"
              >
                <CheckCircle2 className="w-4 h-4 animate-icon-pulse-glow" />
                <span>✓ අනුමත කරන්න</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('warning');
                  onReject(previewAdmission.id);
                }}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation group"
              >
                <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>✕ ප්‍රතික්ෂේප කරන්න</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onConvertToStudent(previewAdmission);
              }}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>ලියාපදිංචි ශිෂ්‍යයෙකු බවට පත් කරන්න</span>
            </button>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
