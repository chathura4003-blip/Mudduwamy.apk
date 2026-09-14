import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  School,
  BookOpen,
  GraduationCap,
  Sparkles,
  Layers,
  Check,
  X,
  Calendar,
  MapPin,
  Tag,
  Hash,
} from 'lucide-react';
import { PirivenaClass, Subject, User } from '../../../types';
import { PIRIVENA_CATEGORIES } from '../constants';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingClass: PirivenaClass | null;
  classForm: Partial<PirivenaClass> & {
    isCustomCategory?: boolean;
    customCategory?: string;
    isCustomLevel?: boolean;
    customLevelName?: string;
  };
  setClassForm: React.Dispatch<
    React.SetStateAction<
      Partial<PirivenaClass> & {
        isCustomCategory?: boolean;
        customCategory?: string;
        isCustomLevel?: boolean;
        customLevelName?: string;
      }
    >
  >;
  subjects: Subject[];
  teachers?: User[];
  onSaveClass?: (e: React.FormEvent) => void;
  onSave?: (e: React.FormEvent) => void;
  generateClassDefaults?: (catKey: string, lvl: string) => { code: string; name: string; nameSinhala: string };
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  editingClass,
  classForm,
  setClassForm,
  subjects = [],
  teachers = [],
  onSaveClass,
  onSave,
  generateClassDefaults = (catKey: string, lvl: string) => ({
    code: `${catKey.toUpperCase().substring(0, 3)}-${lvl}`,
    name: `${lvl} Class`,
    nameSinhala: `${lvl} පන්තිය`,
  }),
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

  const handleSave = onSaveClass || onSave || ((e) => e.preventDefault());

  const currentSubjects: string[] = (() => {
    const raw = classForm.subjects;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && (raw as string).trim()) {
      const trimmed = (raw as string).trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  })();

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 select-none overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-6 max-w-lg w-full border border-slate-200/90 dark:border-stone-800 shadow-2xl space-y-3.5 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-slate-100 my-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-lg shrink-0">
              🏛️
            </div>
            <div>
              <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                {editingClass ? 'පන්ති කාමරය සංස්කරණය (Edit Class)' : 'නව පන්ති කාමරයක් (Add Class)'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                ශ්‍රී සුමන මහා පිරිවෙන • පන්ති සහ ශ්‍රේණි මට්ටම් කළමනාකරණය
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center font-bold text-sm transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          {/* 1. Category & Level Selection */}
          <div className="bg-slate-50/90 dark:bg-stone-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-stone-700/80 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Category */}
              <div>
                <label
                  htmlFor={!classForm.isCustomCategory ? 'modal-class-category' : 'modal-class-custom-category'}
                  className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1"
                >
                  <Tag className="w-3 h-3 text-indigo-500" />
                  <span>අධ්‍යාපන අංශය (Category)</span>
                </label>
                {!classForm.isCustomCategory ? (
                  <select
                    autoComplete="off"
                    id="modal-class-category"
                    name="category"
                    value={classForm.category}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Custom') {
                        setClassForm((prev) => ({
                          ...prev,
                          isCustomCategory: true,
                          customCategory: '',
                        }));
                      } else {
                        const catConfig = PIRIVENA_CATEGORIES.find((c) => c.key === val);
                        const defaultLvl = catConfig ? catConfig.levels[0] : 'Level 1';
                        const defaults = generateClassDefaults(val, defaultLvl);
                        setClassForm((prev) => ({
                          ...prev,
                          category: val,
                          levelName: defaultLvl,
                          code: defaults.code,
                          name: defaults.name,
                          nameSinhala: defaults.nameSinhala,
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-white dark:bg-stone-900 font-bold cursor-pointer text-xs outline-none focus:border-indigo-500"
                  >
                    {PIRIVENA_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name}
                      </option>
                    ))}
                    <option value="Custom">➕ වෙනත් අලුත් අංශයක් (Custom)...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      autoComplete="name"
                      id="modal-class-custom-category"
                      name="customCategory"
                      type="text"
                      required
                      value={classForm.customCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClassForm((prev) => ({
                          ...prev,
                          customCategory: val,
                          name: `${val} - ${prev.levelName}`,
                          nameSinhala: `${val} - ${prev.levelName}`,
                        }));
                      }}
                      placeholder="e.g. Special Diploma"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-white dark:bg-stone-900 font-bold text-xs outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const defaults = generateClassDefaults('Mulika Pirivena', 'Level 1');
                        setClassForm((prev) => ({
                          ...prev,
                          isCustomCategory: false,
                          category: 'Mulika Pirivena',
                          levelName: 'Level 1',
                          code: defaults.code,
                          name: defaults.name,
                          nameSinhala: defaults.nameSinhala,
                        }));
                      }}
                      className="px-2.5 py-2 bg-slate-200 dark:bg-stone-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 text-[10px] shrink-0 cursor-pointer"
                    >
                      Standard
                    </button>
                  </div>
                )}
              </div>

              {/* Class Level */}
              <div>
                <label
                  htmlFor={!classForm.isCustomLevel ? 'modal-class-level' : 'modal-class-custom-level'}
                  className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1"
                >
                  <Layers className="w-3 h-3 text-indigo-500" />
                  <span>ශ්‍රේණිය / මට්ටම (Class Level)</span>
                </label>
                {!classForm.isCustomLevel ? (
                  <select
                    autoComplete="off"
                    id="modal-class-level"
                    name="levelName"
                    value={classForm.levelName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Custom') {
                        setClassForm((prev) => ({
                          ...prev,
                          isCustomLevel: true,
                          customLevelName: '',
                        }));
                      } else {
                        const currentCat = classForm.isCustomCategory
                          ? classForm.customCategory
                          : classForm.category;
                        const defaults = generateClassDefaults(currentCat || 'Mulika Pirivena', val);
                        setClassForm((prev) => ({
                          ...prev,
                          levelName: val,
                          code: defaults.code,
                          name: defaults.name,
                          nameSinhala: defaults.nameSinhala,
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-white dark:bg-stone-900 font-bold cursor-pointer text-xs outline-none focus:border-indigo-500"
                  >
                    {(
                      PIRIVENA_CATEGORIES.find((c) => c.key === classForm.category)?.levels || [
                        'Level 1',
                        'Level 2',
                        'Level 3',
                        'Level 4',
                        'Level 5',
                      ]
                    ).map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                    <option value="Custom">➕ වෙනත් මට්ටමක් (Custom)...</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      autoComplete="name"
                      id="modal-class-custom-level"
                      name="customLevelName"
                      type="text"
                      required
                      value={classForm.customLevelName}
                      onChange={(e) => {
                        const val = e.target.value;
                        const currentCat = classForm.isCustomCategory
                          ? classForm.customCategory
                          : classForm.category;
                        setClassForm((prev) => ({
                          ...prev,
                          customLevelName: val,
                          name: `${currentCat} - ${val}`,
                          nameSinhala: `${currentCat} - ${val}`,
                        }));
                      }}
                      placeholder="e.g. Research Year"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-white dark:bg-stone-900 font-bold text-xs outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentCat = classForm.isCustomCategory
                          ? classForm.customCategory
                          : classForm.category;
                        const defaults = generateClassDefaults(currentCat || 'Mulika Pirivena', 'Level 1');
                        setClassForm((prev) => ({
                          ...prev,
                          isCustomLevel: false,
                          levelName: 'Level 1',
                          code: defaults.code,
                          name: defaults.name,
                          nameSinhala: defaults.nameSinhala,
                        }));
                      }}
                      className="px-2.5 py-2 bg-slate-200 dark:bg-stone-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 text-[10px] shrink-0 cursor-pointer"
                    >
                      Standard
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Class Code & Hall / Room */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="modal-class-code" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                <Hash className="w-3 h-3 text-indigo-500" />
                <span>පන්ති කේතය (Code) *</span>
              </label>
              <input
                autoComplete="name"
                id="modal-class-code"
                name="code"
                type="text"
                required
                value={classForm.code || ''}
                onChange={(e) => setClassForm({ ...classForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. MUL-L01"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-white dark:bg-stone-900 font-mono font-bold text-xs outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="modal-class-room" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3 text-indigo-500" />
                <span>දේශන ශාලාව (Hall/Room)</span>
              </label>
              <input
                autoComplete="name"
                id="modal-class-room"
                name="roomNumber"
                type="text"
                value={classForm.roomNumber || ''}
                onChange={(e) => setClassForm({ ...classForm, roomNumber: e.target.value })}
                placeholder="e.g. මූලික ශාලාව 01"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-white dark:bg-stone-900 text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 3. Class Names (Sinhala & English) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="modal-class-name-sinhala" className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                පන්ති නාමය - සිංහල (Sinhala Title) *
              </label>
              <input
                autoComplete="name"
                id="modal-class-name-sinhala"
                name="nameSinhala"
                type="text"
                required
                value={classForm.nameSinhala || ''}
                onChange={(e) => setClassForm({ ...classForm, nameSinhala: e.target.value })}
                placeholder="e.g. මූලික පිරිවෙන - 01 ශ්‍රේණිය"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-white dark:bg-stone-900 font-bold text-xs outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="modal-class-name-english" className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                Class Title - English
              </label>
              <input
                autoComplete="name"
                id="modal-class-name-english"
                name="name"
                type="text"
                value={classForm.name || ''}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                placeholder="e.g. Mulika Pirivena - Level 1"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-white dark:bg-stone-900 text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 4. Class Teacher In-Charge & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="modal-class-teacher-in-charge" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                <span>පන්තිභාර ආචාර්ය (In-Charge)</span>
              </label>
              <select
                autoComplete="off"
                id="modal-class-teacher-in-charge"
                name="teacherInChargeId"
                value={classForm.teacherInChargeId || ''}
                onChange={(e) => setClassForm({ ...classForm, teacherInChargeId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-white dark:bg-stone-900 font-bold text-xs outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">-- ආචාර්යවරයෙක් තෝරන්න (None) --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.monkStatus === 'monk' ? '🪷 ' : '👨‍🏫 '}
                    {t.monkName || t.name} {t.customId ? `(${t.customId})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="modal-class-academic-year" className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>අධ්‍යයන වර්ෂය (Academic Year) *</span>
              </label>
              <input
                autoComplete="name"
                id="modal-class-academic-year"
                name="academicYear"
                type="text"
                required
                value={classForm.academicYear || ''}
                onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                placeholder="2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-white dark:bg-stone-900 font-bold text-xs outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 5. Subjects Checklist for Class */}
          <div className="bg-slate-50/90 dark:bg-stone-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-stone-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-cyan-500" />
                <span>උගන්වන විෂයන් (Subjects Taught)</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black">
                  {currentSubjects.length}
                </span>
              </span>
              <div className="space-x-2 text-[10px]">
                <button
                  type="button"
                  onClick={() =>
                    setClassForm({ ...classForm, subjects: subjects.map((s) => s.id) })
                  }
                  className="text-indigo-600 dark:text-indigo-400 underline font-bold hover:opacity-80 cursor-pointer"
                >
                  සියල්ල (Select All)
                </button>
                <span className="text-slate-400">•</span>
                <button
                  type="button"
                  onClick={() => setClassForm({ ...classForm, subjects: [] })}
                  className="text-slate-500 underline font-bold hover:text-slate-700 cursor-pointer"
                >
                  හිස් කරන්න (Clear)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-white dark:bg-stone-900 rounded-xl border border-slate-200 dark:border-stone-700 scrollbar-none">
              {subjects.map((subj) => {
                const isSubjMatch = (id: string) =>
                  id === subj.id ||
                  id === subj.code ||
                  id === (subj as any).subjectCode ||
                  id === subj.name ||
                  id === (subj as any).subjectName ||
                  id === subj.nameSinhala ||
                  id === (subj as any).subjectNameSinhala;
                const checked = currentSubjects.some(isSubjMatch);
                return (
                  <label
                    htmlFor={`classmodal-chk-${subj.id}`}
                    key={subj.id}
                    className={`flex items-center gap-1.5 cursor-pointer text-[10.5px] p-1.5 rounded-lg transition ${
                      checked
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200/60 dark:border-indigo-800/60'
                        : 'hover:bg-slate-50 dark:hover:bg-stone-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      id={`classmodal-chk-${subj.id}`}
                      name={`classmodal-chk-${subj.id}`}
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? currentSubjects.filter((id) => !isSubjMatch(id))
                          : [...currentSubjects, subj.id];
                        setClassForm({ ...classForm, subjects: next });
                      }}
                      className="accent-indigo-600 rounded cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="truncate">
                      {(subj as any).subjectNameSinhala || subj.nameSinhala || (subj as any).subjectName || subj.name || subj.id}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-stone-700 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center touch-manipulation"
            >
              අවලංගු කරන්න
            </button>
            <button
              type="submit"
              className="w-full sm:flex-1 py-2.5 min-h-[44px] bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-indigo-500/20 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 touch-manipulation group"
            >
              <Check className="w-4 h-4 stroke-[3] animate-icon-pulse-glow" />
              <span>{editingClass ? 'පන්ති තොරතුරු සුරකින්න (Update Class)' : 'නව පන්තිය නිර්මාණය කරන්න (Save Class)'}</span>
            </button>
          </div>
        </form>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
