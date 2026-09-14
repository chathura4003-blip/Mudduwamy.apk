import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { handleImageError, FALLBACK_IMAGE } from '../utils/imageHelper';
import { uploadFile } from '../utils/fileUpload';
import { getSriLankaDateString } from '../utils/sriLankaTime';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../context/ToastContext';
import { triggerUniversalPrint } from '../utils/printHelper';
import {
  Heart,
  ShieldCheck,
  Check,
  X,
  Trash2,
  Eye,
  FileText,
  Search,
  Upload,
  RefreshCw,
  Loader2,
  Printer,
  Award,
  Phone,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import type { DonationRecord } from '../types';
import { usePublicSite } from '../context/PublicSiteContext';

export const AdminDonationsManager: React.FC = () => {
  const toast = useToast();
  const { donations, addDonation, updateDonationStatus, deleteDonation, refreshAllData, siteSettings } =
    usePublicSite();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlipModal, setSelectedSlipModal] = useState<DonationRecord | null>(null);
  const [selectedCertificateModal, setSelectedCertificateModal] = useState<DonationRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [slipZoom, setSlipZoom] = useState<number>(1);
  const [slipRotation, setSlipRotation] = useState<number>(0);

  // Auto-refresh donations on mount
  useEffect(() => {
    refreshAllData();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllData();
      toast.success('පින්කම් දත්ත සාර්ථකව යාවත්කාලීන විය!');
    } catch (e) {
      toast.error('යාවත්කාලීන කිරීම අසාර්ථක විය.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle ESC key to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedSlipModal) setSelectedSlipModal(null);
        if (selectedCertificateModal) setSelectedCertificateModal(null);
        if (showAddModal) setShowAddModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlipModal, selectedCertificateModal, showAddModal]);

  // Dynamic Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => Promise<void> | void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ඔව්, ඉවත් කරන්න',
    cancelText: 'අවලංගු කරන්න',
    variant: 'danger',
    onConfirm: () => {},
    isLoading: false,
  });

  const askConfirmation = ({
    title,
    message,
    confirmText = 'ඔව්, ඉවත් කරන්න',
    cancelText = 'අවලංගු කරන්න',
    variant = 'danger',
    action,
  }: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    action: () => Promise<void> | void;
  }) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isLoading: true }));
        try {
          await action();
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
      isLoading: false,
    });
  };

  // Manual Add State for Admin
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [newForm, setNewForm] = useState({
    donorName: '',
    type: 'අටපිරිකර හා සිවුරු පූජාව',
    amount: '12500',
    dedicationWish: '',
    contactPhone: '',
    slipUrl: '',
    slipFileName: '',
    status: 'approved' as 'pending' | 'approved' | 'rejected',
  });

  const handleAdminSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlip(true);
    try {
      const url = await uploadFile(file);
      setNewForm((prev) => ({ ...prev, slipUrl: url, slipFileName: file.name }));
      toast.success('බැංකු රිසිට්පත සාර්ථකව Upload කරන ලදී!');
    } catch (err: any) {
      console.error('Slip upload failed:', err);
      toast.error('බැංකු රිසිට්පත Upload කිරීමේදී දෝෂයක් සිදුවිය: ' + (err.message || 'Error'));
    } finally {
      setUploadingSlip(false);
    }
  };

  const handleStatusChange = (id: string, status: 'approved' | 'rejected') => {
    updateDonationStatus(id, status);
    toast.success(
      status === 'approved' ? 'පින්කම් සම්මාදම අනුමත කරන ලදී!' : 'පින්කම් සම්මාදම ප්‍රතික්ෂේප කරන ලදී'
    );
  };

  const handleDelete = (id: string, donorName: string) => {
    askConfirmation({
      title: 'පින්කම් වාර්තාව ඉවත් කිරීම',
      message: `"${donorName}" මහතා/මහත්මියගේ පින්කම් වාර්තාව ඉවත් කිරීමට ඔබට විශ්වාසද?`,
      action: async () => {
        deleteDonation(id);
        toast.success('පින්කම් වාර්තාව සාර්ථකව ඉවත් කරන ලදී!');
      },
    });
  };

  const handleCreateDonation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.donorName.trim()) {
      toast.warning('කරුණාකර දායකයාගේ නම ඇතුළත් කරන්න.');
      return;
    }

    const receiptId = `PNK-${Math.floor(100000 + Math.random() * 900000)}`;
    const formattedAmount = `LKR ${Number(newForm.amount || 0).toLocaleString()} for ${newForm.type}`;

    const newRec: DonationRecord = {
      id: Date.now().toString(),
      donorName: newForm.donorName,
      type: newForm.type,
      amountOrItems: formattedAmount,
      date: getSriLankaDateString(),
      receiptId,
      dedicationWish: newForm.dedicationWish,
      contactPhone: newForm.contactPhone,
      slipUrl: newForm.slipUrl || undefined,
      slipFileName: newForm.slipFileName || undefined,
      status: newForm.status,
    };

    addDonation(newRec);
    setShowAddModal(false);
    toast.success('නව පින්කම් වාර්තාව සාර්ථකව ඇතුළත් කරන ලදී!');
    setNewForm({
      donorName: '',
      type: 'අටපිරිකර හා සිවුරු පූජාව',
      amount: '12500',
      dedicationWish: '',
      contactPhone: '',
      slipUrl: '',
      slipFileName: '',
      status: 'approved',
    });
  };

  const parseAmountNumber = (amountStr?: string): number => {
    if (!amountStr) return 0;
    const clean = amountStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  // Calculated Metrics
  const metrics = useMemo(() => {
    const totalCount = donations.length;
    const pendingCount = donations.filter((d) => d.status === 'pending').length;
    const approvedList = donations.filter((d) => d.status === 'approved' || !d.status);
    const approvedCount = approvedList.length;
    const withSlipCount = donations.filter((d) => !!d.slipUrl).length;
    const totalFundsLKR = approvedList.reduce((sum, d) => sum + parseAmountNumber(d.amountOrItems), 0);

    return {
      totalCount,
      pendingCount,
      approvedCount,
      withSlipCount,
      totalFundsLKR,
    };
  }, [donations]);

  // Filtered Donations
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        d.donorName?.toLowerCase().includes(term) ||
        d.receiptId?.toLowerCase().includes(term) ||
        d.type?.toLowerCase().includes(term) ||
        (d.dedicationWish && d.dedicationWish.toLowerCase().includes(term)) ||
        (d.contactPhone && d.contactPhone.toLowerCase().includes(term));

      return matchesSearch;
    });
  }, [donations, searchTerm]);

  return (
    <div className="space-y-3.5 pb-16 select-none animate-fade-in">
      {/* 📱 1. SIMPLE CLEAN PINKAMA BANNER */}
      <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-amber-900 rounded-3xl p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl shrink-0 shadow-inner">
            ☸
          </div>
          <div>
            <h2 className="font-serif font-black text-base sm:text-xl text-white tracking-tight leading-tight">
              පින්කම් අරමුදල හා සම්මාදම් කළමනාකරණය
            </h2>
            <p className="text-[11px] text-rose-100 mt-0.5">
              මුළු අරමුදල: <strong className="text-amber-300 font-mono">රු. {metrics.totalFundsLKR.toLocaleString()}</strong> • අනුමත පූජා {metrics.approvedCount} යි
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md rounded-xl text-xs font-black border border-white/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">යාවත්කාලීන</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-white hover:bg-rose-50 active:scale-95 text-rose-900 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 group"
          >
            <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600 animate-icon-heartbeat" />
            <span>+ නව පූජාවක් එක් කරන්න</span>
          </button>
        </div>
      </div>

      {/* 📱 2. CLEAN SEARCH BAR */}
      <div className="bg-white dark:bg-stone-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 dark:border-stone-800 shadow-2xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="admindonationsmanager-input-1" name="admindonationsmanager-input-1"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="දායකයාගේ නම, රිසිට්පත් අංකය, දුරකථන අංකය හෝ පූජාව අනුව සොයන්න..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-rose-500 transition shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 📱 3. CLEAN DONATION CARDS LIST */}
      <div className="space-y-3">
        {filteredDonations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredDonations.map((d) => {
              const isApproved = d.status === 'approved' || !d.status;
              const isPending = d.status === 'pending';
              const isRejected = d.status === 'rejected';

              return (
                <div
                  key={d.id}
                  className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-2xs hover:border-rose-300 dark:hover:border-rose-700/60 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header: Donor Name & Status Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] font-bold text-slate-400 block">
                          ID: {d.receiptId} • {d.date}
                        </span>
                        <h4 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white truncate mt-0.5">
                          {d.donorName}
                        </h4>
                      </div>

                      <div className="shrink-0">
                        {isPending && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold text-[10px] border border-amber-300 inline-flex items-center gap-1">
                            ⏳ පරීක්ෂාවට
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold text-[10px] border border-emerald-300 inline-flex items-center gap-1">
                            ✓ අනුමතයි
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 font-bold text-[10px] border border-rose-300 inline-flex items-center gap-1">
                            ✕ ප්‍රතික්ෂේපයි
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cause & Amount Box */}
                    <div className="bg-slate-50/90 dark:bg-stone-850 p-3 rounded-2xl border border-slate-100 dark:border-stone-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">පූජාව / කාණ්ඩය</span>
                        <span className="px-2 py-0.5 bg-white dark:bg-stone-800 text-rose-700 dark:text-rose-300 font-bold text-[10.5px] rounded-lg border border-slate-200 dark:border-stone-700 truncate max-w-[170px]">
                          {d.type}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-stone-750">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">මුදල / විස්තරය</span>
                        <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                          {d.amountOrItems}
                        </span>
                      </div>

                      {d.contactPhone && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-stone-750">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">දුරකථනය</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                            📞 {d.contactPhone}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dedication Wish Note */}
                    {d.dedicationWish && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                        ✨ &quot;{d.dedicationWish}&quot;
                      </p>
                    )}

                    {/* Bank Slip Attachment Strip */}
                    {d.slipUrl && (
                      <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 dark:bg-stone-850 rounded-xl border border-slate-200/60 dark:border-stone-750">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={d.slipUrl || FALLBACK_IMAGE}
                            alt="Slip preview"
                            onError={handleImageError}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-300 dark:border-stone-700 shrink-0"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                            බැංකු රිසිට්පත
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedSlipModal(d)}
                          className="px-2.5 py-1 bg-slate-900 dark:bg-white hover:bg-slate-800 text-white dark:text-slate-900 font-bold text-[10.5px] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                        >
                          <Eye className="w-3 h-3" />
                          <span>බලන්න</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Strip */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-stone-800 flex items-center justify-between gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedCertificateModal(d)}
                      className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-center gap-1 transition cursor-pointer active:scale-95 group"
                    >
                      <Award className="w-3.5 h-3.5 text-rose-600 animate-icon-sparkle" />
                      <span>පින් සහතිකය</span>
                    </button>

                    <div className="flex items-center gap-1.5 ml-auto">
                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(d.id, 'approved')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95 transition group"
                          title="අනුමත කරන්න"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>අනුමත</span>
                        </button>
                      )}

                      {!isRejected && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(d.id, 'rejected')}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95 transition group"
                          title="ප්‍රතික්ෂේප කරන්න"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(d.id, d.donorName)}
                        className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 transition cursor-pointer active:scale-95 group"
                        title="මකා දමන්න"
                      >
                        <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-8 text-center space-y-3 shadow-2xs">
            <div className="text-4xl">🪷</div>
            <p className="font-serif font-black text-base text-slate-800 dark:text-slate-200">
              පින්කම් සටහන් කිසිවක් හමු නොවීය
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              ඔබ සෙවූ පදයට අදාළ පින්කම් සටහන් කිසිවක් හමු නොවීය.
            </p>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition active:scale-95"
            >
              සෙවුම ඉවත් කරන්න (Clear Search)
            </button>
          </div>
        )}
      </div>

      {/* 📱 4. INSPECT BANK SLIP MODAL */}
      {selectedSlipModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in select-none">
            <div
              className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-stone-800 shadow-2xl relative text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-icon-pulse-glow" />
                  <h3 className="font-serif font-black text-base text-slate-900 dark:text-white">
                    බැංකු රිසිට්පත් පරීක්ෂාව
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlipModal(null);
                    setSlipZoom(1);
                    setSlipRotation(0);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm transition cursor-pointer active:scale-90"
                >
                  ✕
                </button>
              </div>

              {/* Slip Meta Info */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-stone-850 p-3.5 rounded-2xl border border-slate-200/80 dark:border-stone-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">දායකයාගේ නම</span>
                  <span className="font-black text-slate-900 dark:text-white truncate block">
                    {selectedSlipModal.donorName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">දුරකථනය</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedSlipModal.contactPhone || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">පූජාව / ආධාරය</span>
                  <span className="font-bold text-rose-700 dark:text-rose-300 truncate block">
                    {selectedSlipModal.type}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">මුදල / විස්තරය</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">
                    {selectedSlipModal.amountOrItems}
                  </span>
                </div>
              </div>

              {/* Image Preview Canvas with Zoom/Rotate Controls */}
              <div className="relative bg-slate-950 rounded-2xl p-2 min-h-[250px] max-h-[360px] overflow-hidden flex items-center justify-center">
                {selectedSlipModal.slipUrl ? (
                  <img
                    src={selectedSlipModal.slipUrl || FALLBACK_IMAGE}
                    alt="Deposit Slip"
                    onError={handleImageError}
                    style={{
                      transform: `scale(${slipZoom}) rotate(${slipRotation}deg)`,
                      transition: 'transform 0.2s ease-in-out',
                    }}
                    className="max-h-[320px] object-contain rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="text-center text-slate-400 p-6 space-y-2">
                    <FileText className="w-12 h-12 mx-auto text-slate-600" />
                    <p className="text-xs">බැංකු රිසිට්පත් ගොනුවක් අමුණා නැත.</p>
                  </div>
                )}

                {/* Floating Image Tools */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/20">
                  <button
                    type="button"
                    onClick={() => setSlipZoom((prev) => Math.min(prev + 0.25, 3))}
                    className="p-1.5 text-white hover:bg-white/20 rounded-lg transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlipZoom((prev) => Math.max(prev - 0.25, 0.5))}
                    className="p-1.5 text-white hover:bg-white/20 rounded-lg transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlipRotation((prev) => (prev + 90) % 360)}
                    className="p-1.5 text-white hover:bg-white/20 rounded-lg transition"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  {selectedSlipModal.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleStatusChange(selectedSlipModal.id, 'approved');
                        setSelectedSlipModal(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer active:scale-95"
                    >
                      ✓ අනුමත කරන්න
                    </button>
                  )}

                  {selectedSlipModal.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleStatusChange(selectedSlipModal.id, 'rejected');
                        setSelectedSlipModal(null);
                      }}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                    >
                      ✕ ප්‍රතික්ෂේප කරන්න
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSlipModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  වසන්න
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 📱 5. OFFICIAL PINKAMA BLESSING CERTIFICATE & RECEIPT MODAL */}
      {selectedCertificateModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            data-modal="true"
            className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in select-none print-container print:p-0 print:bg-white print:static"
          >
            <div
              className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-4 border border-slate-200 dark:border-stone-800 shadow-2xl text-slate-900 dark:text-white max-h-[95vh] overflow-y-auto my-auto print-modal-content mobile-bottom-sheet select-none print:shadow-none print:border-none print:w-full print:rounded-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Bottom Sheet Drag Indicator */}
              <div className="bottom-sheet-drag-handle sm:hidden no-print" />
              {/* Modal Top Control Strip */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3 no-print">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-rose-600" />
                  <h3 className="font-serif font-black text-sm sm:text-base">
                    පින්කම් ආශිර්වාද සහතික පත්‍රය හා රිසිට්පත
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerUniversalPrint(`පින්කම්_ආශිර්වාද_සහතිකය_${selectedCertificateModal.donorName || 'Donation_Receipt'}`);
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Certificate / Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCertificateModal(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 🖨️ A4 CERTIFICATE SHEET */}
              <div
                id="pinkama-certificate-sheet"
                className="bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 dark:from-stone-900 dark:via-stone-850 dark:to-stone-900 border-4 border-double border-amber-600/60 p-6 sm:p-8 rounded-3xl space-y-5 text-center relative overflow-hidden shadow-inner"
              >
                {/* Traditional Corner Lotus Accents */}
                <div className="absolute top-2 left-3 text-amber-500/30 text-2xl font-serif select-none">☸</div>
                <div className="absolute top-2 right-3 text-amber-500/30 text-2xl font-serif select-none">☸</div>
                <div className="absolute bottom-2 left-3 text-amber-500/30 text-2xl font-serif select-none">☸</div>
                <div className="absolute bottom-2 right-3 text-amber-500/30 text-2xl font-serif select-none">☸</div>

                {/* Header Letterhead */}
                <div className="space-y-1">
                  <span className="text-xl">🪷</span>
                  <h2 className="font-serif font-black text-lg sm:text-2xl text-amber-900 dark:text-amber-200 tracking-wide">
                    {siteSettings?.pirivenaNameSinhala || 'ශ්‍රී සුමන මහා පිරිවෙන'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    {siteSettings?.address || 'මුද්දුව, රත්නපුර'} | ලියාපදිංචි අංකය: {siteSettings?.registrationNo || 'P/RP/1958'}
                  </p>
                  <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mt-2" />
                </div>

                {/* Certificate Title Badge */}
                <div className="py-1">
                  <span className="px-4 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 font-serif font-black text-xs sm:text-sm border border-amber-300 dark:border-amber-700 uppercase tracking-wider inline-block shadow-2xs">
                    ☸ උදාර පුණ්‍යානුමෝදනා පින් සහතිකය ☸
                  </span>
                </div>

                {/* Main Merit Text */}
                <div className="space-y-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium max-w-lg mx-auto">
                  <p>
                    ශ්‍රී සුමන මහා පිරිවෙන් විහාරස්ථානයේ ශාසනික හා අධ්‍යාපනික අභිවෘද්ධිය උදෙසා
                    පැවැත්වෙන{' '}
                    <strong className="text-rose-700 dark:text-rose-300 font-black">
                      &quot;{selectedCertificateModal.type}&quot;
                    </strong>{' '}
                    පුණ්‍ය කර්මය වෙනුවෙන්,
                  </p>

                  <div className="p-3 bg-white dark:bg-stone-800 rounded-2xl border border-amber-300 dark:border-amber-800/80 shadow-xs">
                    <span className="text-[10.5px] text-slate-400 font-bold block uppercase">ශ්‍රද්ධාබර දායක භවතා</span>
                    <span className="font-serif font-black text-base sm:text-lg text-amber-900 dark:text-amber-200">
                      {selectedCertificateModal.donorName}
                    </span>
                  </div>

                  <p>
                    මහතා/මහත්මිය විසින් පිරිනමන ලද{' '}
                    <strong className="text-slate-900 dark:text-white font-black font-mono">
                      {selectedCertificateModal.amountOrItems}
                    </strong>{' '}
                    ක මුදල/ද්‍රව්‍ය පරිත්‍යාගය ගෞරවයෙන් භාරගත් බවත්,
                  </p>

                  {selectedCertificateModal.dedicationWish && (
                    <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs italic text-amber-950 dark:text-amber-200">
                      ✨ &quot;{selectedCertificateModal.dedicationWish}&quot;
                    </div>
                  )}

                  {/* Pali Gatha Merit Blessing */}
                  <div className="pt-2 text-amber-900 dark:text-amber-300 font-serif text-xs italic space-y-0.5">
                    <p>ඉමිනා පුඤ්ඤකම්මේන මා මේ බාලසමාගමෝ</p>
                    <p>සතං සමාගමෝ හෝතු යාව නිබ්බානපත්තියා</p>
                  </div>
                </div>

                {/* Signatures & Seal Strip */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-amber-200 dark:border-stone-800 text-[11px]">
                  <div className="text-center space-y-1">
                    <div className="w-28 h-0.5 bg-slate-300 dark:bg-stone-700 mx-auto" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">
                      {siteSettings?.principalNameSinhala || 'පරිවේණාධිපති ස්වාමීන් වහන්සේ'}
                    </span>
                    <span className="text-[9.5px] text-slate-400">ශ්‍රී සුමන මහා පිරිවෙන</span>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="w-28 h-0.5 bg-slate-300 dark:bg-stone-700 mx-auto" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">
                      දිනය: {selectedCertificateModal.date}
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-400">
                      Receipt: {selectedCertificateModal.receiptId}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 📱 6. ADD NEW DONATION RECORD MODAL */}
      {showAddModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in select-none">
            <div
              className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 border border-slate-200 dark:border-stone-800 shadow-2xl text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                  <h3 className="font-serif font-black text-base">
                    + නව පින්කම් සටහනක් ඇතුළත් කිරීම
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateDonation} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    දායකයාගේ නම (Donor Name) *
                  </label>
                  <input id="admindonationsmanager-input-2" name="admindonationsmanager-input-2"
                    type="text"
                    required
                    value={newForm.donorName}
                    onChange={(e) => setNewForm({ ...newForm, donorName: e.target.value })}
                    placeholder="e.g. ඩී.එම්. ගුණසේකර මහතා"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 text-slate-900 dark:text-white font-bold outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    පූජාව / කාණ්ඩය (Donation Cause)
                  </label>
                  <input id="admindonationsmanager-input-3" name="admindonationsmanager-input-3"
                    type="text"
                    required
                    value={newForm.type}
                    onChange={(e) => setNewForm({ ...newForm, type: e.target.value })}
                    placeholder="e.g. අටපිරිකර පූජාව / දානමය පින්කම"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 text-slate-900 dark:text-white font-bold outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    පරිත්‍යාග මුදල (LKR) *
                  </label>
                  <input id="admindonationsmanager-input-4" name="number_4"
                    type="number"
                    required
                    value={newForm.amount}
                    onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 text-slate-900 dark:text-white font-mono font-black text-sm outline-none focus:border-rose-500"
                  />

                  {/* Quick Amount Pills */}
                  <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                    {['2500', '5000', '10000', '25000', '50000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNewForm({ ...newForm, amount: amt })}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-stone-800 hover:bg-rose-50 hover:text-rose-600 font-mono font-bold text-[10px] border border-slate-200 dark:border-stone-700 cursor-pointer"
                      >
                        +{Number(amt).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    දුරකථන අංකය (Contact Phone)
                  </label>
                  <input id="admindonationsmanager-input-5" name="admindonationsmanager-input-5"
                    type="text"
                    value={newForm.contactPhone}
                    onChange={(e) => setNewForm({ ...newForm, contactPhone: e.target.value })}
                    placeholder="e.g. 077 123 4567"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 text-slate-900 dark:text-white font-bold outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    පුණ්‍යානුමෝදනා ප්‍රාර්ථනාව (Dedication Wish)
                  </label>
                  <input id="admindonationsmanager-input-6" name="admindonationsmanager-input-6"
                    type="text"
                    value={newForm.dedicationWish}
                    onChange={(e) => setNewForm({ ...newForm, dedicationWish: e.target.value })}
                    placeholder="e.g. මියගිය දෙගුරුන්ට නිවන් සුව පිණිසයි"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 text-slate-900 dark:text-white font-medium outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                    බැංකු රිසිට්පත (Bank Deposit Slip)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input id="admindonationsmanager-input-7" name="admindonationsmanager-input-7"
                      type="text"
                      value={newForm.slipUrl}
                      onChange={(e) => setNewForm({ ...newForm, slipUrl: e.target.value })}
                      placeholder="/uploads/slip_..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 text-slate-900 dark:text-white text-xs"
                    />
                    <label className="px-3 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black rounded-xl flex items-center gap-1 cursor-pointer shrink-0 shadow-md">
                      {uploadingSlip ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Upload</span>
                      <input id="admindonationsmanager-input-8" name="file_8"
                        type="file"
                        accept="image/*,.pdf"
                        disabled={uploadingSlip}
                        onChange={handleAdminSlipUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    අවලංගු කරන්න
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-md cursor-pointer active:scale-95 transition"
                  >
                    සුරකින්න (Save Record)
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        variant={confirmConfig.variant}
        isLoading={confirmConfig.isLoading}
      />
    </div>
  );
};
