import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckCircle2, GraduationCap, X, Clock, Sparkles } from 'lucide-react';
import { usePublicSite, triggerRealtimeSync } from '../context/PublicSiteContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { settingsApi } from '../api';
import { triggerHaptic } from '../utils/haptics';

interface AcademicYearTermSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACADEMIC_YEARS = ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'];

const ACADEMIC_TERMS = [
  {
    key: 'Term 1',
    labelSi: '1 වන වාරය',
    labelEn: '1st Term',
    descSi: 'ජනවාරි - අප්‍රේල් (ආරම්භක වාරය)',
    descEn: 'January - April',
    icon: '🌱',
  },
  {
    key: 'Term 2',
    labelSi: '2 වන වාරය',
    labelEn: '2nd Term',
    descSi: 'මැයි - අගෝස්තු (මධ්‍යම වාරය)',
    descEn: 'May - August',
    icon: '☀️',
  },
  {
    key: 'Term 3',
    labelSi: '3 වන වාරය',
    labelEn: '3rd Term',
    descSi: 'සැප්තැම්බර් - දෙසැම්බර් (අවසාන වාරය)',
    descEn: 'September - December',
    icon: '🏆',
  },
];

export const AcademicYearTermSwitcherModal: React.FC<AcademicYearTermSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { siteSettings, updateSiteSettings } = usePublicSite();
  const { language } = useLanguage();
  const isSi = language === 'si';
  const toast = useToast();

  const [selectedYear, setSelectedYear] = useState<string>(
    siteSettings.currentAcademicYear || '2026'
  );
  const [selectedTerm, setSelectedTerm] = useState<string>(
    siteSettings.currentAcademicTerm || 'Term 1'
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    setIsSaving(true);
    try {
      const termObj = ACADEMIC_TERMS.find((t) => t.key === selectedTerm) || ACADEMIC_TERMS[0];
      const payload = {
        currentAcademicYear: selectedYear,
        currentAcademicTerm: selectedTerm,
        currentAcademicTermSinhala: `${termObj.labelSi} (${termObj.labelEn})`,
      };

      // 1. API Call
      await settingsApi.updateSiteSettings(payload);

      // 2. Local Context & Storage
      if (updateSiteSettings) {
        updateSiteSettings(payload);
      }
      try {
        const curr = localStorage.getItem('pirivena_site_settings');
        const parsed = curr ? JSON.parse(curr) : {};
        Object.assign(parsed, payload);
        localStorage.setItem('pirivena_site_settings', JSON.stringify(parsed));
        localStorage.setItem('pirivena_academic_year', selectedYear);
        localStorage.setItem('pirivena_academic_term', selectedTerm);
      } catch (e) {}

      // 3. Realtime Broadcast
      triggerRealtimeSync();
      window.dispatchEvent(new CustomEvent('academic-year-changed', { detail: payload }));
      window.dispatchEvent(new CustomEvent('site-data-updated'));
      try {
        const bc = new BroadcastChannel('pirivena-admin-sync');
        bc.postMessage({ type: 'academic-year-changed', payload });
        bc.close();
      } catch (e) {}

      toast.success(
        isSi
          ? `🎓 ${selectedYear} අධ්‍යයන වර්ෂය සහ ${termObj.labelSi} සාර්ථකව පද්ධතිය පුරා යාවත්කාලීන විය!`
          : `🎓 Academic Year ${selectedYear} & ${termObj.labelEn} updated successfully!`
      );
      onClose();
    } catch (err: any) {
      console.error('Failed to update academic year & term', err);
      toast.error(
        isSi
          ? 'වෙනස්කම් සුරැකීමට නොහැකි විය: ' + (err.message || 'Server error')
          : 'Failed to update academic year: ' + (err.message || 'Server error')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const modalJSX = (
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
          className="bg-white dark:bg-stone-900 text-slate-900 dark:text-white rounded-3xl p-5 sm:p-7 max-w-md w-full border border-amber-300/80 dark:border-amber-700/60 shadow-[0_25px_70px_rgba(0,0,0,0.85)] space-y-4 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Golden Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shrink-0 -mt-5 -mx-5 sm:-mt-7 sm:-mx-7 mb-2" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
                <GraduationCap className="w-5 h-5 animate-icon-bounce" />
              </div>
              <div>
                <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  {isSi ? 'අධ්‍යයන වර්ෂය සහ වාරය' : 'Academic Year & Term'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {isSi ? 'පිරිවෙන් ශාස්ත්‍රීය කාලරාමුව වෙනස් කිරීම' : 'Manage Pirivena Academic Calendar'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-stone-800 transition cursor-pointer active:scale-95 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleApply} className="space-y-4 text-xs flex-1">
            {/* Step 1: Year Selection */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{isSi ? '1. අධ්‍යයන වර්ෂය (Academic Year):' : '1. Select Academic Year:'}</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {ACADEMIC_YEARS.map((yr) => {
                  const isSelected = selectedYear === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedYear(yr);
                      }}
                      className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-center active:scale-95 border ${
                        isSelected
                          ? 'bg-amber-600 border-amber-500 text-white shadow-md font-black'
                          : 'bg-slate-50 dark:bg-stone-800/80 border-slate-200 dark:border-stone-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Term Selection */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{isSi ? '2. පාසල්/පිරිවෙන් වාරය (Academic Term):' : '2. Select Academic Term:'}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ACADEMIC_TERMS.map((term) => {
                  const isSelected = selectedTerm === term.key;
                  return (
                    <button
                      key={term.key}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedTerm(term.key);
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex sm:flex-col items-center justify-between sm:justify-center text-left sm:text-center gap-2 active:scale-95 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-xs font-black'
                          : 'border-slate-200 dark:border-stone-800 bg-slate-50/60 dark:bg-stone-800/40 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex sm:flex-col items-center gap-2">
                        <span className="text-2xl">{term.icon}</span>
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white block">
                            {isSi ? term.labelSi : term.labelEn}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-stone-400 font-medium block">
                            {isSi ? term.descSi : term.descEn}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Summary Preview */}
            <div className="p-3.5 bg-amber-50/60 dark:bg-stone-800/60 border border-amber-200/80 dark:border-stone-750 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 block">
                {isSi ? 'සජීවීව ක්‍රියාත්මක වන කාලරාමුව' : 'Active Timeline Summary'}
              </span>
              <div className="font-serif font-black text-slate-900 dark:text-white text-sm mt-0.5">
                {selectedYear} {isSi ? 'අධ්‍යයන වර්ෂය' : 'Academic Year'} •{' '}
                {isSi
                  ? ACADEMIC_TERMS.find((t) => t.key === selectedTerm)?.labelSi
                  : ACADEMIC_TERMS.find((t) => t.key === selectedTerm)?.labelEn}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2.5 pt-3 pb-safe border-t border-slate-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-3 min-h-[44px] touch-manipulation flex items-center justify-center bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer active:scale-95"
              >
                {isSi ? 'අවලංගු කරන්න' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] touch-manipulation bg-amber-600 hover:bg-amber-500 text-stone-950 font-black rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 group"
              >
                <CheckCircle2 className="w-4 h-4 animate-icon-pulse-glow shrink-0" />
                <span>{isSaving ? (isSi ? 'සුරැකෙමින්...' : 'Saving...') : (isSi ? 'සුරකින්න (Save)' : 'Save Changes')}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
};
