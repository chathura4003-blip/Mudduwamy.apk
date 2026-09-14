import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, Check, X, Tag, Hash } from 'lucide-react';
import { Subject, User } from '../../../types';
import { SUBJECT_CATEGORIES } from '../constants';
import { generateSmartSubjectCode } from '../../../utils/subjectHelper';
import { triggerHaptic } from '../../../utils/haptics';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSubject: Subject | null;
  subjectForm: Partial<Subject>;
  setSubjectForm: React.Dispatch<React.SetStateAction<Partial<Subject>>>;
  subjects?: Subject[];
  teachers?: User[];
  onSaveSubject?: (e: React.FormEvent) => void;
  onSave?: (e: React.FormEvent) => void;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  editingSubject,
  subjectForm,
  setSubjectForm,
  subjects = [],
  teachers = [],
  onSaveSubject,
  onSave,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = onSaveSubject || onSave || ((e) => e.preventDefault());

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto select-none"
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden my-auto text-slate-900 dark:text-stone-100 flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Top Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-cyan-600 via-teal-500 to-indigo-600 shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-stone-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                📚
              </div>
              <div>
                <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-stone-100 leading-tight">
                  {editingSubject ? 'විෂයය සංශෝධනය (Edit Subject)' : 'නව විෂයයක් එක් කරන්න (Add Subject)'}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-stone-400 font-medium">
                  ශ්‍රී සුමන මහා පිරිවෙන • විෂය නිර්දේශ කළමනාකරණය
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 transition rounded-xl bg-slate-100 dark:bg-stone-800 cursor-pointer active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1">
            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {/* Quick Select Preset Pills */}
              <div className="bg-slate-50 dark:bg-stone-800 p-3 rounded-2xl border border-slate-200 dark:border-stone-700 space-y-2">
                <label className="font-bold text-slate-800 dark:text-stone-200 flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>විෂය තෝරන්න / Quick Select Preset</span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {SUBJECT_CATEGORIES.map((cat) => {
                    const isSelected =
                      subjectForm.category === cat.key &&
                      subjectForm.nameSinhala === cat.nameSinhala;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          const nextCode = generateSmartSubjectCode(cat.key, cat.name, cat.nameSinhala, (subjects || []).length);
                          setSubjectForm({
                            ...subjectForm,
                            category: cat.key as any,
                            nameSinhala: cat.nameSinhala,
                            name: cat.name,
                            code: nextCode,
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow-xs font-black'
                            : 'bg-white dark:bg-stone-900 text-slate-700 dark:text-stone-300 border border-slate-200 dark:border-stone-700 hover:bg-slate-100 dark:hover:bg-stone-750'
                        }`}
                      >
                        {cat.nameSinhala}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      const nextCode = generateSmartSubjectCode('Other', subjectForm.name, subjectForm.nameSinhala, (subjects || []).length);
                      setSubjectForm({
                        ...subjectForm,
                        category: 'Other',
                        nameSinhala: '',
                        name: '',
                        code: nextCode,
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition border border-dashed cursor-pointer active:scale-95 ${
                      subjectForm.category === 'Other' && !subjectForm.nameSinhala
                        ? 'bg-cyan-700 text-white border-cyan-700'
                        : 'bg-white dark:bg-stone-900 text-slate-600 dark:text-stone-300 border-slate-300 dark:border-stone-700 hover:bg-slate-100 dark:hover:bg-stone-750'
                    }`}
                  >
                    ✏️ වෙනත් අලුත් විෂයයක් (Custom)
                  </button>
                </div>
              </div>

              {/* Subject Sinhala Name */}
              <div>
                <label htmlFor="modal-subject-name-sinhala" className="font-bold text-slate-800 dark:text-stone-200 block mb-1">
                  විෂය නම - සිංහල (Subject Title) *
                </label>
                <input
                  autoComplete="name"
                  id="modal-subject-name-sinhala"
                  name="nameSinhala"
                  type="text"
                  required
                  value={subjectForm.nameSinhala || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoCode = generateSmartSubjectCode(subjectForm.category, subjectForm.name || val, val, (subjects || []).length);
                    setSubjectForm({
                      ...subjectForm,
                      nameSinhala: val,
                      name: subjectForm.name || val,
                      code: (!subjectForm.code || subjectForm.code.startsWith('SUB-')) ? autoCode : subjectForm.code,
                    });
                  }}
                  placeholder="උදා: තොරතුරු හා සන්නිවේදන තාක්ෂණය (ICT)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 bg-white dark:bg-stone-800 font-bold text-xs outline-none focus:border-cyan-500"
                />
              </div>

              {/* Subject English Name */}
              <div>
                <label htmlFor="modal-subject-name-english" className="font-bold text-slate-800 dark:text-stone-200 block mb-1">
                  Subject Name - English (Optional)
                </label>
                <input
                  autoComplete="name"
                  id="modal-subject-name-english"
                  name="name"
                  type="text"
                  value={subjectForm.name || ''}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="e.g. Information & Communication Technology (ICT)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 bg-white dark:bg-stone-800 text-xs outline-none focus:border-cyan-500"
                />
              </div>

              {/* Subject Code & Category */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="modal-subject-code" className="font-bold text-slate-800 dark:text-stone-200 flex items-center gap-1 mb-1">
                    <Hash className="w-3 h-3 text-cyan-500" />
                    <span>විෂය කේතය (Code) *</span>
                  </label>
                  <input
                    autoComplete="name"
                    id="modal-subject-code"
                    name="code"
                    type="text"
                    required
                    value={subjectForm.code || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ICT-108 or PALI-101"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 bg-white dark:bg-stone-800 font-mono font-bold text-xs outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor="modal-subject-category" className="font-bold text-slate-800 dark:text-stone-200 flex items-center gap-1 mb-1">
                    <Tag className="w-3 h-3 text-cyan-500" />
                    <span>විෂය කාණ්ඩය (Category)</span>
                  </label>
                  <select
                    autoComplete="off"
                    id="modal-subject-category"
                    name="category"
                    value={subjectForm.category || 'Core Pirivena'}
                    onChange={(e) => {
                      const newCatKey = e.target.value;
                      const selectedCat = SUBJECT_CATEGORIES.find((c) => c.key === newCatKey);
                      if (selectedCat) {
                        const nextCode = generateSmartSubjectCode(newCatKey, selectedCat.name, selectedCat.nameSinhala, (subjects || []).length);
                        setSubjectForm({
                          ...subjectForm,
                          category: newCatKey as any,
                          nameSinhala: selectedCat.nameSinhala,
                          name: selectedCat.name,
                          code: nextCode,
                        });
                      } else {
                        setSubjectForm({ ...subjectForm, category: newCatKey as any });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-stone-100 bg-white dark:bg-stone-800 font-bold text-xs outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {SUBJECT_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key} className="bg-white dark:bg-stone-850 text-slate-900 dark:text-stone-100">
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-stone-700 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 shadow-2xs border border-slate-200 dark:border-stone-700 flex items-center justify-center touch-manipulation"
                >
                  අවලංගු කරන්න
                </button>
                <button
                  type="submit"
                  onClick={() => triggerHaptic('medium')}
                  className="w-full sm:flex-1 py-2.5 min-h-[44px] bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 touch-manipulation group"
                >
                  <Check className="w-4 h-4 stroke-[3] animate-icon-pulse-glow" />
                  <span>{editingSubject ? 'විෂය තොරතුරු සුරකින්න (Update)' : 'නව විෂයය සුරකින්න (Save)'}</span>
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
