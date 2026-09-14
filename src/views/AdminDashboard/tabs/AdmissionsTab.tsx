import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  XCircle,
  Eye,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  School,
} from 'lucide-react';
import { OnlineAdmission } from '../../../types';
import { AdmissionDetailModal } from '../modals';
import { useLanguage } from '../../../context/LanguageContext';

interface AdmissionsTabProps {
  admissions: OnlineAdmission[];
  onUpdateStatus: (id: string, status: 'approved' | 'rejected' | 'pending') => void;
  onDeleteAdmission: (id: string) => void;
  onConvertToStudent: (adm: OnlineAdmission) => void;
}

export const AdmissionsTab: React.FC<AdmissionsTabProps> = React.memo(({
  admissions = [],
  onUpdateStatus,
  onDeleteAdmission,
  onConvertToStudent,
}) => {
  const { language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('pirivena_admissions_filter') || 'all';
    } catch (e) {
      return 'all';
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_admissions_filter', statusFilter);
    } catch (e) {}
  }, [statusFilter]);
  const [previewAdmission, setPreviewAdmission] = useState<OnlineAdmission | null>(null);

  const pendingCount = admissions.filter((a) => a.status === 'pending').length;
  const approvedCount = admissions.filter((a) => a.status === 'approved').length;
  const rejectedCount = admissions.filter((a) => a.status === 'rejected').length;

  const filteredAdmissions = useMemo(() => {
    if (statusFilter === 'all') return admissions;
    return admissions.filter((adm) => adm.status === statusFilter);
  }, [admissions, statusFilter]);

  return (
    <div className="space-y-3 pb-12 select-none animate-fade-in">
      {/* 1. SINGLE-LINE STATUS SWITCHER TOOLBAR */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-2 sm:p-2.5 shadow-2xs flex items-center justify-between gap-2">
        {/* Status Switcher Pills */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-stone-800 rounded-xl text-xs font-black gap-1 overflow-x-auto scrollbar-none w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📋 සියලු අයදුම්පත්</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'all'
                  ? 'bg-white/25 text-white font-bold'
                  : 'bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {admissions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>⏳ පොරොත්තුවෙන්</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'pending'
                  ? 'bg-white/25 text-white font-bold'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>✅ අනුමත</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'approved'
                  ? 'bg-white/25 text-white font-bold'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {approvedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>❌ ප්‍රතික්ෂේපිත</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'rejected'
                  ? 'bg-white/25 text-white font-bold'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
              }`}
            >
              {rejectedCount}
            </span>
          </button>
        </div>
      </div>

      {/* 2. ADMISSION CARDS LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredAdmissions.length === 0 ? (
          <div className="col-span-full py-10 px-4 text-center rounded-2xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 space-y-2 shadow-2xs">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-stone-800 flex items-center justify-center text-lg">
              📋
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'si' ? 'අයදුම්පත් කිසිවක් හමු නොවීය.' : 'No admissions found.'}
            </p>
          </div>
        ) : (
          filteredAdmissions.map((adm) => {
            const isMonk = adm.monkStatus === 'monk' || adm.monkStatus === 'upasampada';

            return (
              <div
                key={adm.id}
                className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800/60"
              >
                <div className="space-y-2">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-stone-800 pb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border shadow-2xs ${
                        isMonk
                          ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                          : 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                      }`}
                    >
                      {adm.monkStatus === 'monk'
                        ? '🪷 සාමණේර'
                        : adm.monkStatus === 'upasampada'
                        ? '☸ උපසම්පදා'
                        : '👤 ගිහි'}
                    </span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60">
                      {adm.trackingId || `ADM-${adm.id.slice(0, 8)}`}
                    </span>
                  </div>

                  {/* Name */}
                  <div>
                    <h3 className="font-serif font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate leading-tight">
                      {adm.monkName || adm.applicantName}
                    </h3>
                    {adm.monkName && adm.applicantName && adm.monkName !== adm.applicantName && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        ගිහි නම: {adm.applicantName}
                      </p>
                    )}
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-stone-700 text-[9.5px]">
                      <School className="w-2.5 h-2.5 text-blue-500" />
                      <span>{adm.appliedClass || 'ප්‍රාරම්භ'}</span>
                    </span>

                    {adm.district && (
                      <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-stone-700 text-[9.5px]">
                        <MapPin className="w-2.5 h-2.5 text-emerald-500" />
                        <span>{adm.district}</span>
                      </span>
                    )}

                    {adm.phone && (
                      <span className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-400 text-[9.5px]">
                        <Phone className="w-2.5 h-2.5 text-slate-400" />
                        <span>{adm.phone}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Status & Actions Toolbar */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setPreviewAdmission(adm)}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 border border-blue-200/80 dark:border-blue-800/80 group"
                  >
                    <Eye className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    <span>විස්තර</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onConvertToStudent(adm)}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] rounded-lg flex items-center gap-1 shadow-xs shadow-emerald-500/20 transition cursor-pointer active:scale-95 group"
                    title="ශිෂ්‍යයෙකු ලෙස ඇතුළත් කරන්න"
                  >
                    <UserCheck className="w-3 h-3 animate-icon-pulse-glow" />
                    <span>+ බඳවා ගන්න</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteAdmission(adm.id)}
                    className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800 transition cursor-pointer active:scale-95 group"
                    title="මකන්න"
                  >
                    <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admission Detail Modal */}
      {previewAdmission && (
        <AdmissionDetailModal
          isOpen={!!previewAdmission}
          onClose={() => setPreviewAdmission(null)}
          admission={previewAdmission}
          onUpdateStatus={onUpdateStatus}
          onConvertToStudent={onConvertToStudent}
        />
      )}
    </div>
  );
});

