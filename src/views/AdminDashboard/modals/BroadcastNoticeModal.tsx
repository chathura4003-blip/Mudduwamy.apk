import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BroadcastNoticeFormState } from '../types';
import {
  Bell,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Palette,
  Users,
  Eye,
  Pipette,
  Radio,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { triggerHaptic } from '../../../utils/haptics';

interface BroadcastNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingNoticeId: string | null;
  noticeForm: BroadcastNoticeFormState;
  setNoticeForm: React.Dispatch<React.SetStateAction<BroadcastNoticeFormState>>;
  onSave: (e: React.FormEvent) => void;
  onApplyTemplate: (tplKey: string) => void;
  isSaving?: boolean;
}

const colorPresets = [
  { id: 'red', name: 'හදිසි (Red)', bgClass: 'bg-red-600', hex: '#dc2626' },
  { id: 'amber', name: 'විශේෂ (Amber)', bgClass: 'bg-amber-500', hex: '#d97706' },
  { id: 'blue', name: 'සාමාන්‍ය (Blue)', bgClass: 'bg-blue-600', hex: '#2563eb' },
  { id: 'emerald', name: 'ශාසනික (Green)', bgClass: 'bg-emerald-600', hex: '#059669' },
  { id: 'purple', name: 'විභාග (Purple)', bgClass: 'bg-purple-600', hex: '#7c3aed' },
  { id: 'rose', name: 'පින්කම් (Rose)', bgClass: 'bg-rose-600', hex: '#e11d48' },
  { id: 'orange', name: 'උත්සව (Orange)', bgClass: 'bg-orange-500', hex: '#ea580c' },
  { id: 'cyan', name: 'දැනුම්දීම් (Cyan)', bgClass: 'bg-cyan-600', hex: '#0891b2' },
  { id: 'charcoal', name: 'පරිපාලන (Slate)', bgClass: 'bg-slate-800', hex: '#1e293b' },
];

export const BroadcastNoticeModal: React.FC<BroadcastNoticeModalProps> = ({
  isOpen,
  onClose,
  editingNoticeId,
  noticeForm,
  setNoticeForm,
  onSave,
  onApplyTemplate,
  isSaving = false,
}) => {
  const { language } = useLanguage();
  const isSi = language === 'si';

  const [isCustomCategory, setIsCustomCategory] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const quickIcons = ['📢', '📜', '☸', '🍛', '🎓', '🚨', '⚠️', 'ℹ️', '🔔', '💡', '🏛️', '✨', '📝', '🌸'];
  const currentColor = noticeForm.customColor || 'blue';

  const getPreviewBackground = () => {
    if (currentColor.startsWith('#')) {
      return {
        background: `linear-gradient(135deg, ${currentColor} 0%, #0f172a 100%)`,
        borderColor: currentColor,
      };
    }
    const preset = colorPresets.find((c) => c.id === currentColor);
    if (preset) {
      return {
        background: `linear-gradient(135deg, ${preset.hex} 0%, #0f172a 100%)`,
        borderColor: preset.hex,
      };
    }
    return {
      background: 'linear-gradient(135deg, #2563eb 0%, #0f172a 100%)',
      borderColor: '#2563eb',
    };
  };

  const previewStyles = getPreviewBackground();

  const handleTemplateClick = (tpl: string, color: string, sev: 'info' | 'warning' | 'urgent') => {
    triggerHaptic('light');
    onApplyTemplate(tpl);
    setNoticeForm((prev) => ({ ...prev, customColor: color, severity: sev }));
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full border border-blue-500/40 dark:border-blue-700/50 shadow-[0_25px_70px_rgba(0,0,0,0.85)] space-y-4 my-auto text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto flex flex-col"
        >
          {/* Top Golden/Blue Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600 shrink-0" />

          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0 bg-gradient-to-r from-stone-950 via-blue-950/60 to-stone-950 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 shadow-2xs border border-blue-400/40">
                <Bell className="w-5 h-5 animate-icon-bell" />
              </div>
              <div>
                <h3 className="font-serif font-black text-sm sm:text-base text-blue-100 flex items-center gap-2">
                  <span>
                    {editingNoticeId
                      ? isSi
                        ? 'නිවේදනය සංස්කරණය කරන්න'
                        : 'Edit Broadcast Alert'
                      : isSi
                        ? 'සජීවී පිරිවෙන් නිවේදනයක් විකාශය කරන්න'
                        : 'Publish Live Broadcast Notice'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    LIVE
                  </span>
                </h3>
                <p className="text-[11px] text-blue-200/80">
                  {isSi ? 'ශිෂ්‍ය, ගුරු සහ දෙමාපිය ද්වාරවල එකවර දිස්වේ' : 'Broadcasts in real-time to all user portals'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 text-stone-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-xl transition cursor-pointer active:scale-95 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Live Mobile Banner Preview Card */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-stone-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span>{isSi ? 'සජීවී පෙරදසුන (Live Mobile Banner Preview):' : 'Live Mobile Banner Preview:'}</span>
              </label>
              <div
                style={previewStyles}
                className="p-3.5 sm:p-4 rounded-2xl text-white shadow-lg border relative overflow-hidden transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{noticeForm.customIcon || '📢'}</span>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-black text-sm text-white">
                        {noticeForm.titleSinhala || (isSi ? 'නිවේදන මාතෘකාව මෙතැන දිස්වේ' : 'Notice Title Placeholder')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 text-white">
                        {noticeForm.category || 'General'}
                      </span>
                    </div>
                    <p className="text-xs text-white/90 leading-relaxed">
                      {noticeForm.messageSinhala ||
                        (isSi
                          ? 'ඔබ විසින් සටහන් කරන නිවේදන විස්තරය සියලු ශිෂ්‍ය හා ගුරු Dashboard වල මෙසේ දිස්වනු ඇත...'
                          : 'Notice body preview will appear here in real-time...')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Template Presets */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-stone-300 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{isSi ? 'ක්ෂණික ආකෘති (Quick Templates):' : 'Quick Notice Templates:'}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTemplateClick('exam', 'purple', 'urgent')}
                  className="p-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800 text-[11px] font-bold transition cursor-pointer active:scale-95 text-center"
                >
                  📜 ප්‍රාචීන විභාග
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateClick('poya', 'amber', 'info')}
                  className="p-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] font-bold transition cursor-pointer active:scale-95 text-center"
                >
                  ☸ පෝදා වැඩසටහන්
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateClick('dana', 'rose', 'warning')}
                  className="p-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 text-[11px] font-bold transition cursor-pointer active:scale-95 text-center"
                >
                  🍛 දානමය පින්කම්
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateClick('holiday', 'blue', 'info')}
                  className="p-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] font-bold transition cursor-pointer active:scale-95 text-center"
                >
                  🎓 වාර නිවාඩුව
                </button>
              </div>
            </div>

            <form onSubmit={(e) => {
              triggerHaptic('medium');
              onSave(e);
            }} className="space-y-4 text-xs">
              {/* Category */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={isCustomCategory ? 'broadcast-custom-category-input' : 'broadcast-category-select'}
                    className="font-bold text-slate-800 dark:text-slate-200"
                  >
                    {isSi ? 'නිවේදන කාණ්ඩය (Category) *' : 'Notice Category *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isCustomCategory ? (isSi ? '📋 ලැයිස්තුවෙන් තෝරන්න' : 'Choose List') : (isSi ? '✏️ නව වර්ගයක් ලියන්න' : 'Custom Input')}
                  </button>
                </div>

                {isCustomCategory ? (
                  <input
                    id="broadcast-custom-category-input"
                    name="category"
                    type="text"
                    placeholder={isSi ? 'උදා: විශේෂ ධර්ම දේශනා, භික්ෂු විනය වැඩමුළු...' : 'e.g. Special Dhamma Sermon...'}
                    value={noticeForm.category || ''}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-blue-500 bg-blue-50/20 dark:bg-stone-800 font-bold text-slate-900 dark:text-white outline-none"
                    autoFocus
                  />
                ) : (
                  <select
                    id="broadcast-category-select"
                    name="category"
                    value={noticeForm.category || 'General Notice'}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="Pracheena Exam">📜 Pracheena Examination (ප්‍රාචීන විභාග නිවේදනය)</option>
                    <option value="Poya Program">☸ Poya Sil Program (පෝදා සීල සමාදානය)</option>
                    <option value="Dana / Alms">🍛 Sanghika Dana / Alms (කඨින / සංඝගත දක්ෂිණාව)</option>
                    <option value="Pirivena Holiday">🎓 Academic Holiday (පිරිවෙන් නිවාඩු නිවේදනය)</option>
                    <option value="General Notice">📢 General Notice (සාමාන්‍ය පිරිවෙන් නිවේදනය)</option>
                    <option value="Dhamma Deshana">🌸 Special Dhamma Sermon (විශේෂ ධර්ම දේශනා)</option>
                    <option value="Sports & Societies">🏆 Societies & Events (ශිෂ්‍ය සංගම් හා උත්සව)</option>
                  </select>
                )}
              </div>

              {/* Custom Banner Color Presets */}
              <div className="bg-slate-50 dark:bg-stone-850/60 p-3.5 rounded-2xl border border-slate-200 dark:border-stone-700 space-y-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{isSi ? 'වර්ණය සහ තේමාව (Banner Color):' : 'Banner Color Theme:'}</span>
                </label>

                <div className="flex flex-wrap items-center gap-1.5">
                  {colorPresets.map((col) => {
                    const isSelected = noticeForm.customColor === col.id || noticeForm.customColor === col.hex;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setNoticeForm({
                            ...noticeForm,
                            customColor: col.id,
                            severity: col.id === 'red' ? 'urgent' : col.id === 'amber' ? 'warning' : 'info',
                          });
                        }}
                        className={`h-8 px-3 rounded-xl text-white font-bold text-[10px] flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-xs ${
                          col.bgClass
                        } ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-105'
                            : 'opacity-85 hover:opacity-100'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Message */}
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="broadcast-title-input"
                    className="block font-bold text-slate-800 dark:text-slate-200 mb-1"
                  >
                    {isSi ? 'නිවේදන මාතෘකාව (Title) *' : 'Notice Title *'}
                  </label>
                  <input
                    id="broadcast-title-input"
                    name="titleSinhala"
                    type="text"
                    required
                    placeholder={isSi ? 'උදා: හෙට දින ප්‍රාචීන විභාග ප්‍රවේශ පත්‍ර බෙදාදීම...' : 'Notice title...'}
                    value={noticeForm.titleSinhala || ''}
                    onChange={(e) => setNoticeForm({ ...noticeForm, titleSinhala: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="broadcast-message-textarea"
                    className="block font-bold text-slate-800 dark:text-slate-200 mb-1"
                  >
                    {isSi ? 'සවිස්තරාත්මක නිවේදන පණිවිඩය (Notice Message) *' : 'Detailed Notice Message *'}
                  </label>
                  <textarea
                    id="broadcast-message-textarea"
                    name="messageSinhala"
                    required
                    rows={4}
                    placeholder={isSi ? 'සියලු සාමණේර සහ ගිහි සිසුන්ගේ අවධානය පිණිසයි...' : 'Enter message details...'}
                    value={noticeForm.messageSinhala || ''}
                    onChange={(e) => setNoticeForm({ ...noticeForm, messageSinhala: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-white outline-none focus:border-amber-500 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Target Audience & Severity Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="broadcast-audience-select"
                    className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{isSi ? 'ඉලක්කගත පාර්ශ්වය (Audience)' : 'Target Audience'}</span>
                  </label>
                  <select
                    id="broadcast-audience-select"
                    name="targetRole"
                    value={noticeForm.targetRole || 'all'}
                    onChange={(e) => setNoticeForm({ ...noticeForm, targetRole: e.target.value as 'all' | 'students' | 'teachers' })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">👥 {isSi ? 'සියලු දෙනාට (All Users)' : 'All Users'}</option>
                    <option value="students">🎓 {isSi ? 'සිසුන්ට පමණයි (Students Only)' : 'Students Only'}</option>
                    <option value="teachers">👨‍🏫 {isSi ? 'ගුරුවරුන්ට පමණයි (Teachers Only)' : 'Teachers Only'}</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="broadcast-severity-select"
                    className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1"
                  >
                    <Radio className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>{isSi ? 'හදිසිභාවය (Severity)' : 'Severity Level'}</span>
                  </label>
                  <select
                    id="broadcast-severity-select"
                    name="severity"
                    value={noticeForm.severity || 'info'}
                    onChange={(e) => setNoticeForm({ ...noticeForm, severity: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="info">ℹ️ Info ({isSi ? 'සාමාන්‍ය' : 'Normal'})</option>
                    <option value="warning">⚠️ Warning ({isSi ? 'විශේෂ අවධානයට' : 'Important'})</option>
                    <option value="urgent">🚨 Urgent ({isSi ? 'හදිසි නිවේදනය' : 'Urgent Alert'})</option>
                  </select>
                </div>
              </div>

              {/* Icon Picker Chips */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {isSi ? 'Emoji / Icon තෝරන්න:' : 'Select Emoji Icon:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickIcons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setNoticeForm({ ...noticeForm, customIcon: ic });
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition cursor-pointer active:scale-95 ${
                        noticeForm.customIcon === ic
                          ? 'bg-amber-600 text-white shadow-md scale-110'
                          : 'bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Action Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-stone-800 flex flex-col-reverse sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  disabled={isSaving}
                  className="w-full sm:flex-1 py-3 min-h-[44px] bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition cursor-pointer active:scale-95 flex items-center justify-center touch-manipulation"
                >
                  {isSi ? 'අවලංගු කරන්න' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:flex-2 py-3 min-h-[44px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 disabled:opacity-50 text-white dark:text-slate-900 font-black rounded-2xl shadow-lg transition cursor-pointer active:scale-95 flex items-center justify-center gap-2 touch-manipulation group"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white dark:text-slate-900" />
                      <span>{isSi ? 'විකාශය වෙමින් පවතී...' : 'Broadcasting...'}</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 animate-icon-bell" />
                      <span>
                        {editingNoticeId
                          ? isSi ? 'යාවත්කාලීන කරන්න' : 'Update Notice'
                          : isSi ? '📢 සජීවීව විකාශය කරන්න' : 'Broadcast Live'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
