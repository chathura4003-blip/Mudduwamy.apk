import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../../../utils/haptics';
import { User, PirivenaClass, Subject } from '../../../types';
import { TeacherFormState } from '../types';
import { PIRIVENA_CATEGORIES } from '../constants';
import { uploadApi } from '../../../api/uploadApi';
import { getImageUrl, handleAvatarError } from '../../../utils/imageHelper';
import {
  Users,
  BookOpen,
  Lock,
  Check,
  Camera,
  Upload,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Key,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTeacher: User | null;
  teacherForm: TeacherFormState;
  setTeacherForm: React.Dispatch<React.SetStateAction<TeacherFormState>>;
  teacherFormStep?: number;
  setTeacherFormStep?: React.Dispatch<React.SetStateAction<number>>;
  step?: number;
  setStep?: React.Dispatch<React.SetStateAction<number>>;
  classes: PirivenaClass[];
  subjects: Subject[];
  copiedKey?: string | null;
  onCopy?: (text: string, key: string) => void;
  onGenerateRandomPassword?: (role: string) => void;
  onImageFileChange?: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  onSaveTeacher?: (e: React.FormEvent) => void;
  onSave?: (e: React.FormEvent) => void;
  toast?: any;
  isSaving?: boolean;
}

export const AddTeacherModal: React.FC<AddTeacherModalProps> = ({
  isOpen,
  onClose,
  editingTeacher,
  teacherForm,
  setTeacherForm,
  teacherFormStep: propTeacherFormStep,
  setTeacherFormStep: propSetTeacherFormStep,
  step = 1,
  setStep,
  classes,
  subjects,
  copiedKey,
  onCopy,
  onGenerateRandomPassword,
  onImageFileChange,
  onSaveTeacher: propOnSaveTeacher,
  onSave,
  toast: propToast,
  isSaving = false,
}) => {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const teacherFormStep = propTeacherFormStep || step || 1;
  const setTeacherFormStep = propSetTeacherFormStep || setStep || (() => {});
  const onSaveTeacher = propOnSaveTeacher || onSave || ((e) => e.preventDefault());
  const toast = propToast || {
    error: (msg: string) => console.error(msg),
    success: (msg: string) => console.log(msg),
  };

  const handleSelectAllForClass = (cls: PirivenaClass) => {
    const classSubjects = (cls.subjects && cls.subjects.length > 0)
      ? subjects.filter((s) => cls.subjects?.includes(s.id) || cls.subjects?.includes(s.code || ''))
      : subjects;

    const current = teacherForm.teacherAssignments || [];
    const otherAssignments = current.filter(
      (a) => !(a.classId === cls.id || a.classId === cls.code || a.classId === cls.name)
    );
    const newAssignmentsForThisClass = classSubjects.map((s) => ({
      classId: cls.id,
      subjectId: s.id,
    }));

    const nextAssignments = [...otherAssignments, ...newAssignmentsForThisClass];
    const nextClasses = Array.from(new Set(nextAssignments.map((a) => a.classId)));
    const nextSubjects = Array.from(new Set(nextAssignments.map((a) => a.subjectId)));

    setTeacherForm({
      ...teacherForm,
      teacherAssignments: nextAssignments,
      classesAssigned: nextClasses,
      subjectsTaught: nextSubjects,
    });
    triggerHaptic('selection');
  };

  const handleClearAllForClass = (cls: PirivenaClass) => {
    const current = teacherForm.teacherAssignments || [];
    const nextAssignments = current.filter(
      (a) => !(a.classId === cls.id || a.classId === cls.code || a.classId === cls.name)
    );
    const nextClasses = Array.from(new Set(nextAssignments.map((a) => a.classId)));
    const nextSubjects = Array.from(new Set(nextAssignments.map((a) => a.subjectId)));

    setTeacherForm({
      ...teacherForm,
      teacherAssignments: nextAssignments,
      classesAssigned: nextClasses,
      subjectsTaught: nextSubjects,
    });
    triggerHaptic('light');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleInternalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (typeof onImageFileChange === 'function') {
      onImageFileChange(e, (url: string) => {
        setTeacherForm((prev) => ({ ...prev, avatar: url }));
      });
      return;
    }

    setIsUploadingPhoto(true);
    triggerHaptic('selection');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob(async (blob) => {
                if (blob) {
                  const formData = new FormData();
                  formData.append('file', blob, 'teacher_avatar.jpg');
                  try {
                    const res = await uploadApi.uploadFile(formData);
                    if (res && res.fileUrl) {
                      setTeacherForm((prev) => ({ ...prev, avatar: res.fileUrl }));
                      toast?.success?.('ඡායාරූපය සාර්ථකව Upload විය!');
                      setIsUploadingPhoto(false);
                      triggerHaptic('success');
                      return;
                    }
                  } catch (upErr) {
                    console.warn('Direct upload fallback to DataURL:', upErr);
                  }
                }
                const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
                setTeacherForm((prev) => ({ ...prev, avatar: dataUrl }));
                toast?.success?.('ඡායාරූපය සාර්ථකව ඇතුළත් විය.');
                setIsUploadingPhoto(false);
                triggerHaptic('success');
              }, 'image/jpeg', 0.88);
            } else {
              setIsUploadingPhoto(false);
            }
          } catch (err) {
            console.error('Canvas processing error:', err);
            setIsUploadingPhoto(false);
          }
        };
        img.onerror = () => {
          setIsUploadingPhoto(false);
          toast?.error?.('ඡායාරූපය කියවීමට නොහැකි විය.');
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Teacher photo upload failed:', err);
      setIsUploadingPhoto(false);
      toast?.error?.('ඡායාරූපය එක් කිරීම අසාර්ථක විය.');
    }
  };

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
          className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-amber-500/40 dark:border-amber-600/60 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] overflow-hidden my-auto text-slate-900 dark:text-stone-100"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Top Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shrink-0" />

          {/* Header */}
          <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-800 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
                {teacherForm.monkStatus === 'monk' ? '🪷' : '👨‍🏫'}
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-amber-50 leading-tight">
                  {editingTeacher
                    ? 'ගුරු ගිණුම යාවත්කාලීන කිරීම (Edit Teacher Profile)'
                    : 'නව ආචාර්යවරයෙකු ලියාපදිංචිය (Register Faculty)'}
                </h3>
                <p className="text-[11px] text-amber-200/80">
                  {teacherForm.monkStatus === 'monk' ? 'පූජ්‍ය ගුරු හිමිනමකගේ තොරතුරු' : 'ගිහි ආචාර්යවරයෙකුගේ තොරතුරු'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer active:scale-95"
            >
              ✕
            </button>
          </div>

        {/* Step Indicator Navigation */}
        <div className="grid grid-cols-3 bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700/80 text-xs font-bold shrink-0">
          {[
            { step: 1, title: 'මූලික තොරතුරු', sub: 'ඡායාරූපය හා විස්තර' },
            { step: 2, title: 'විෂය හා පන්ති', sub: 'ඉගැන්වීම් වගකීම්' },
            { step: 3, title: 'ගිණුම් ආරක්ෂාව', sub: 'මුරපද හා අවසර' },
          ].map((s) => {
            const isActive = teacherFormStep === s.step;
            const isPassed = teacherFormStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setTeacherFormStep(s.step)}
                className={`p-3 text-left flex items-center gap-2 border-b-2 transition ${
                  isActive
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold'
                    : isPassed
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800'
                    : 'bg-white/80 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-amber-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isActive ? 'bg-amber-600 text-white' : 'bg-stone-300'}`}>
                  {isPassed ? <Check className="w-3 h-3" /> : s.step}
                </div>
                <div>
                  <div className="text-[11px]">{s.title}</div>
                  <div className="text-[9px] opacity-70">{s.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Content */}
        <form
          onSubmit={onSaveTeacher}
          className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-stone-800 dark:text-stone-200 flex-1"
        >
          {/* STEP 1: Teacher Profile, Photo & Qualifications */}
          {teacherFormStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white dark:bg-stone-800/80 p-4 rounded-2xl border border-amber-200/80 dark:border-stone-700 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-100 dark:border-stone-700 pb-2">
                  <span className="text-base">👨‍🏫</span>
                  <h4 className="font-bold text-amber-950 dark:text-amber-100 text-xs tracking-wide">
                    1. ගුරුභවත් පැතිකඩ ඡායාරූපය හා තත්ත්වය (Teacher Photo & Status)
                  </h4>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-stone-900 border-2 border-amber-400 overflow-hidden flex items-center justify-center shadow-md relative">
                      {isUploadingPhoto ? (
                        <div className="flex flex-col items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-[9px] font-bold">Uploading...</span>
                        </div>
                      ) : teacherForm.avatar ? (
                        <img
                          src={getImageUrl(teacherForm.avatar)}
                          alt="Teacher avatar"
                          onError={handleAvatarError}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">
                          {teacherForm.monkStatus === 'monk' ? '🪷' : '👨‍🏫'}
                        </span>
                      )}
                    </div>
                    <label
                      htmlFor="teacher-photo-file-modal"
                      className="absolute -bottom-1 -right-1 bg-amber-800 hover:bg-amber-900 text-white p-1.5 rounded-xl cursor-pointer shadow-md transition active:scale-95"
                      title="Upload Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </label>
                    <input autoComplete="off" name="teacher-photo-file"
                      id="teacher-photo-file-modal"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleInternalImageUpload}
                    />
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <label
                        htmlFor="teacher-photo-file-modal"
                        className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl cursor-pointer text-[11px] inline-flex items-center gap-1.5 transition shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {teacherForm.avatar
                            ? 'ඡායාරූපය වෙනස් කරන්න (Change Photo)'
                            : 'ඡායාරූපයක් එක් කරන්න (Upload Photo)'}
                        </span>
                      </label>
                      {teacherForm.avatar && (
                        <button
                          type="button"
                          onClick={() => setTeacherForm({ ...teacherForm, avatar: '' })}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold rounded-xl text-[11px] border border-red-200 dark:border-red-800 transition cursor-pointer"
                        >
                          ඉවත් කරන්න (Remove)
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">
                      PNG, JPG or WEBP (Max 5MB). Photo appears on ERP Staff Roster.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-amber-100 dark:border-stone-700">
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1.5 text-xs">
                      ගුරුභවත් තත්ත්වය (Status) <span className="text-red-500">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl border border-amber-200/60 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => setTeacherForm({ ...teacherForm, monkStatus: 'monk' })}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          teacherForm.monkStatus === 'monk'
                            ? 'bg-amber-800 text-white shadow-xs'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                        }`}
                      >
                        <span>🪷 හිමි (Monk)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeacherForm({ ...teacherForm, monkStatus: 'lay' })}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          teacherForm.monkStatus === 'lay'
                            ? 'bg-amber-800 text-white shadow-xs'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                        }`}
                      >
                        <span>👤 ගිහි (Lay)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1.5 text-xs">
                      ගිණුමේ තත්ත්වය (Account Status)
                    </span>
                    <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-stone-900 p-1 rounded-2xl border border-amber-200/60 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => setTeacherForm({ ...teacherForm, status: 'active' })}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          teacherForm.status === 'active'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                        }`}
                      >
                        <span>🟢 සක්‍රීය</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeacherForm({ ...teacherForm, status: 'inactive' })}
                        className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          teacherForm.status === 'inactive'
                            ? 'bg-stone-700 text-white shadow-xs'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                        }`}
                      >
                        <span>🔴 අක්‍රීය</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-stone-800/80 p-4 rounded-2xl border border-amber-200/80 dark:border-stone-700 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 border-b border-amber-100 dark:border-stone-700 pb-2">
                  <span className="text-base">📜</span>
                  <h4 className="font-bold text-amber-950 dark:text-amber-100 text-xs tracking-wide">
                    2. පුද්ගලික තොරතුරු හා සුදුසුකම් (Personal Details & Qualifications)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-teacher-name" className="font-bold text-amber-950 dark:text-amber-100 block mb-1">
                      සම්පූර්ණ නම - ඉංග්‍රීසියෙන් (Full Name - English) <span className="text-red-500">*</span>
                    </label>
                    <input autoComplete="name"
                      id="modal-teacher-name"
                      name="name"
                      type="text"
                      required
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      placeholder="e.g. Ven. Sabaragamuwe Sumanasara Thero"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-stone-50/50 dark:bg-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-teacher-monk-name" className="font-bold text-amber-950 dark:text-amber-100 block mb-1">
                      ගෞරව නාමය / සිංහල නම (Honorific / Sinhala Title)
                    </label>
                    <input autoComplete="name"
                      id="modal-teacher-monk-name"
                      name="monkName"
                      type="text"
                      value={teacherForm.monkName}
                      onChange={(e) => setTeacherForm({ ...teacherForm, monkName: e.target.value })}
                      placeholder="e.g. පූජ්‍ය රාජකීය පණ්ඩිත සබරගමුවේ සුමනසාර හිමි"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-stone-50/50 dark:bg-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-teacher-phone" className="font-bold text-amber-950 dark:text-amber-100 block mb-1">
                      දුරකථන අංකය (Contact Phone)
                    </label>
                    <input autoComplete="tel"
                      id="modal-teacher-phone"
                      name="phone"
                      type="text"
                      value={teacherForm.phone}
                      onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                      placeholder="+94 71 987 6543"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-stone-50/50 dark:bg-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-teacher-qualification" className="font-bold text-amber-950 dark:text-amber-100 block mb-1">
                      අධ්‍යාපනික සුදුසුකම් (Qualifications & Titles) <span className="text-red-500">*</span>
                    </label>
                    <input autoComplete="name"
                      id="modal-teacher-qualification"
                      name="qualification"
                      type="text"
                      required
                      value={teacherForm.qualification}
                      onChange={(e) =>
                        setTeacherForm({ ...teacherForm, qualification: e.target.value })
                      }
                      placeholder="e.g. Rajakeeya Panditha, BA (Hons) Pali, MA"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-stone-50/50 dark:bg-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Categories, Classes & Teaching Subjects */}
          {teacherFormStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white dark:bg-stone-800/80 p-4 rounded-2xl border border-amber-200/80 dark:border-stone-700 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-100 dark:border-stone-700 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏫</span>
                    <h4 className="font-bold text-amber-950 dark:text-amber-100 text-xs tracking-wide">
                      පන්ති කාමර හා විෂය අනුයුක්තය (Class & Subject Assignments)
                    </h4>
                  </div>
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-stone-900 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-stone-700">
                    මුළු අනුයුක්ත: {(teacherForm.teacherAssignments || []).length}
                  </span>
                </div>

                {/* Active Assignments Badges List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950 dark:text-amber-100 block text-xs">
                      වත්මන් නිශ්චිත අනුයුක්ත ලැයිස්තුව (Active Class ➔ Subject Assignments: {(teacherForm.teacherAssignments || []).length})
                    </span>
                    {(teacherForm.teacherAssignments || []).length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setTeacherForm({
                            ...teacherForm,
                            teacherAssignments: [],
                            classesAssigned: [],
                            subjectsTaught: [],
                          })
                        }
                        className="text-[10px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>සියල්ල ඉවත් කරන්න</span>
                      </button>
                    )}
                  </div>

                  <div className="min-h-[50px] max-h-36 overflow-y-auto p-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-amber-200 dark:border-stone-700 flex flex-wrap gap-1.5 items-center">
                    {(teacherForm.teacherAssignments || []).length === 0 ? (
                      <span className="text-[11px] text-stone-500 italic p-1">
                        තවමත් පන්ති හා විෂය අනුයුක්ත කර නැත. පහත පන්ති ලැයිස්තුවෙන් අදාළ විෂයයන් තෝරා අනුයුක්ත කරන්න.
                      </span>
                    ) : (
                      (teacherForm.teacherAssignments || []).map((assignment, idx) => {
                        const targetClass = classes.find(
                          (c) => c.id === assignment.classId || c.code === assignment.classId || c.name === assignment.classId
                        );
                        const targetSubject = subjects.find(
                          (s) => s.id === assignment.subjectId || s.code === assignment.subjectId || s.name === assignment.subjectId
                        );
                        const className = targetClass?.nameSinhala || (targetClass as any)?.classNameSinhala || targetClass?.name || assignment.classId;
                        const subjectName = targetSubject?.nameSinhala || (targetSubject as any)?.subjectNameSinhala || targetSubject?.name || assignment.subjectId;

                        return (
                          <span
                            key={`${assignment.classId}-${assignment.subjectId}-${idx}`}
                            className="inline-flex items-center gap-1.5 text-[11px] bg-amber-100 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100 font-bold px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 shadow-2xs"
                          >
                            <span className="text-amber-900 dark:text-amber-200">{className}</span>
                            <span className="text-stone-400">➔</span>
                            <span className="text-amber-800 dark:text-amber-300">{subjectName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextAssignments = (teacherForm.teacherAssignments || []).filter(
                                  (_, i) => i !== idx
                                );
                                const nextClasses = Array.from(new Set(nextAssignments.map((a) => a.classId)));
                                const nextSubjects = Array.from(new Set(nextAssignments.map((a) => a.subjectId)));
                                setTeacherForm({
                                  ...teacherForm,
                                  teacherAssignments: nextAssignments,
                                  classesAssigned: nextClasses,
                                  subjectsTaught: nextSubjects,
                                });
                              }}
                              className="ml-1 text-stone-400 hover:text-red-600 font-bold cursor-pointer"
                              title="Remove assignment"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Class-by-Class Subject Assignment Cards with Search & Filters */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-amber-950 dark:text-amber-100 block text-xs">
                      පන්ති අනුව විෂයයන් තේරීම (Assign Subjects per Class)
                    </span>
                    
                    {/* Class Search */}
                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        placeholder="පන්ති නම හෝ කේතය සොයන්න..."
                        value={classSearch}
                        onChange={(e) => setClassSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1 text-[11px] rounded-lg border border-amber-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Category Quick Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryTab('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                        selectedCategoryTab === 'all'
                          ? 'bg-amber-800 text-white shadow-2xs'
                          : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-amber-100'
                      }`}
                    >
                      සියලුම පන්ති
                    </button>
                    {PIRIVENA_CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setSelectedCategoryTab(cat.key)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                          selectedCategoryTab === cat.key
                            ? 'bg-amber-800 text-white shadow-2xs'
                            : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-amber-100'
                        }`}
                      >
                        {cat.nameSinhala || cat.name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto p-2.5 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-amber-200 dark:border-stone-700">
                    {classes
                      .filter((cls) => {
                        if (selectedCategoryTab !== 'all' && (cls as any).category !== selectedCategoryTab) {
                          return false;
                        }
                        if (classSearch.trim()) {
                          const q = classSearch.toLowerCase().trim();
                          const cName = ((cls as any).classNameSinhala || cls.nameSinhala || cls.name || '').toLowerCase();
                          const cCode = (cls.code || '').toLowerCase();
                          return cName.includes(q) || cCode.includes(q);
                        }
                        return true;
                      })
                      .map((cls) => {
                        const classSubjects = (cls.subjects && cls.subjects.length > 0)
                          ? subjects.filter((s) => cls.subjects?.includes(s.id) || cls.subjects?.includes(s.code || ''))
                          : subjects;

                        const isAssigned = (subId: string) => {
                          return (teacherForm.teacherAssignments || []).some(
                            (a) =>
                              (a.classId === cls.id || a.classId === cls.code || a.classId === cls.name) &&
                              (a.subjectId === subId || a.subjectId === subjects.find((s) => s.id === subId)?.code)
                          );
                        };

                        const toggleSubjectForClass = (subId: string) => {
                          const current = teacherForm.teacherAssignments || [];
                          const assigned = isAssigned(subId);
                          let nextAssignments = [];
                          if (assigned) {
                            nextAssignments = current.filter(
                              (a) =>
                                !(
                                  (a.classId === cls.id || a.classId === cls.code || a.classId === cls.name) &&
                                  (a.subjectId === subId || a.subjectId === subjects.find((s) => s.id === subId)?.code)
                                )
                            );
                          } else {
                            nextAssignments = [...current, { classId: cls.id, subjectId: subId }];
                          }
                          const nextClasses = Array.from(new Set(nextAssignments.map((a) => a.classId)));
                          const nextSubjects = Array.from(new Set(nextAssignments.map((a) => a.subjectId)));
                          setTeacherForm({
                            ...teacherForm,
                            teacherAssignments: nextAssignments,
                            classesAssigned: nextClasses,
                            subjectsTaught: nextSubjects,
                          });
                        };

                        const assignedCountForClass = (teacherForm.teacherAssignments || []).filter(
                          (a) => a.classId === cls.id || a.classId === cls.code || a.classId === cls.name
                        ).length;

                        const isAllAssignedInClass = classSubjects.length > 0 && assignedCountForClass === classSubjects.length;

                        return (
                          <div
                            key={cls.id}
                            className="bg-white dark:bg-stone-800 p-3 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between pb-1.5 border-b border-stone-100 dark:border-stone-700 gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-amber-950 dark:text-amber-100">
                                  {(cls as any).classNameSinhala || cls.nameSinhala || (cls as any).className || cls.name}
                                </span>
                                <span className="text-[10px] font-mono text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-stone-900 px-1.5 py-0.5 rounded border border-amber-200 dark:border-stone-700">
                                  {cls.code || (cls as any).gradeLevel || 'CLS'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                  {assignedCountForClass} / {classSubjects.length} විෂය අනුයුක්තයි
                                </span>
                                {isAllAssignedInClass ? (
                                  <button
                                    type="button"
                                    onClick={() => handleClearAllForClass(cls)}
                                    className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold hover:bg-rose-100 transition cursor-pointer"
                                  >
                                    ඉවත් කරන්න
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAllForClass(cls)}
                                    className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[10px] font-bold hover:bg-amber-200 transition cursor-pointer"
                                  >
                                    + සියල්ල තෝරන්න
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {classSubjects.map((subj) => {
                                const checked = isAssigned(subj.id);
                                return (
                                  <label
                                    htmlFor={`teacher-assign-${cls.id}-${subj.id}`}
                                    key={`${cls.id}-${subj.id}`}
                                    className={`flex items-center gap-1.5 cursor-pointer text-[11px] p-1.5 rounded-lg border transition ${
                                      checked
                                        ? 'bg-amber-100/70 dark:bg-amber-950/70 border-amber-400 dark:border-amber-600 font-bold text-amber-950 dark:text-amber-100'
                                        : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:bg-amber-50 text-stone-700 dark:text-stone-300'
                                    }`}
                                  >
                                    <input
                                      id={`teacher-assign-${cls.id}-${subj.id}`}
                                      name={`teacher-assign-${cls.id}-${subj.id}`}
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleSubjectForClass(subj.id)}
                                      className="accent-amber-800 rounded w-3.5 h-3.5 cursor-pointer shrink-0"
                                    />
                                    <span className="truncate">
                                      {(subj as any).subjectNameSinhala || subj.nameSinhala || (subj as any).subjectName || subj.name}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ERP Login Credentials */}
          {teacherFormStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-amber-100/40 dark:bg-stone-800/80 p-4 rounded-2xl border border-amber-300/80 dark:border-stone-700 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-stone-700 pb-2">
                  <h4 className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5 text-xs">
                    <Lock className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                    <span>ERP පද්ධති ගිණුම් තොරතුරු (ERP Teacher Login Credentials)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(
                        `ID: ${teacherForm.customId} | Email: ${teacherForm.email} | Pass: ${teacherForm.password}`,
                        'teacher-creds'
                      )
                    }
                    className="text-[10px] bg-white dark:bg-stone-900 border border-amber-300 dark:border-stone-700 hover:bg-amber-50 text-amber-900 dark:text-amber-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    {copiedKey === 'teacher-creds' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'teacher-creds' ? 'Copied!' : 'Copy Credentials'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="modal-teacher-custom-id" className="font-bold text-amber-950 dark:text-amber-100 block mb-1">
                      ගුරු අංකය (Teacher ID) <span className="text-red-500">*</span>
                    </label>
                    <input autoComplete="name"
                      id="modal-teacher-custom-id"
                      name="customId"
                      type="text"
                      required
                      value={teacherForm.customId}
                      onChange={(e) => setTeacherForm({ ...teacherForm, customId: e.target.value })}
                      placeholder="TCH-2026-001"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-stone-700 font-mono font-bold text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="modal-teacher-email" className="font-bold text-amber-950 dark:text-amber-100 block">
                        ප්‍රවේශ විද්‍යුත් තැපෑල (Gmail / Email) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const cleanId = (teacherForm.customId || `TCH-2026-${Math.floor(100 + Math.random() * 900)}`).toLowerCase().replace(/[^a-z0-9]/g, '');
                          setTeacherForm({ ...teacherForm, email: `${cleanId}@gmail.com` });
                        }}
                        className="text-[10px] text-amber-800 dark:text-amber-400 hover:text-amber-950 font-bold underline flex items-center gap-0.5 cursor-pointer"
                        title="Auto-Generate Gmail Address"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>✨ Gmail සාදන්න</span>
                      </button>
                    </div>
                    <input autoComplete="email"
                      id="modal-teacher-email"
                      name="email"
                      type="email"
                      required
                      value={teacherForm.email}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      placeholder="tch2026001@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="modal-teacher-password" className="font-bold text-amber-950 dark:text-amber-100 block">මුරපදය (Password) <span className="text-red-500">*</span></label>
                      <button
                        type="button"
                        onClick={() => onGenerateRandomPassword('teacher')}
                        className="text-[10px] text-amber-800 dark:text-amber-400 hover:text-amber-950 font-bold underline flex items-center gap-0.5 cursor-pointer"
                        title="Generate Random Secure Password"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>🎲 අහඹු මුරපදයක්</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input autoComplete="name"
                        id="modal-teacher-password"
                        name="password"
                        type={teacherForm.showPassword ? 'text' : 'password'}
                        required={!editingTeacher}
                        value={teacherForm.password}
                        onChange={(e) =>
                          setTeacherForm({ ...teacherForm, password: e.target.value })
                        }
                        placeholder={editingTeacher ? "නව මුරපදයක් ඇතුළත් කරන්න (වෙනස් කිරීමට)" : "Panditha@2026"}
                        className="w-full pl-3 pr-9 py-2 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setTeacherForm({
                            ...teacherForm,
                            showPassword: !teacherForm.showPassword,
                          })
                        }
                        className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-800 cursor-pointer"
                        title={teacherForm.showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {teacherForm.showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-stone-900 p-2.5 rounded-xl border border-amber-200/80 dark:border-stone-700 flex items-center justify-between text-xs">
                  <span className="text-amber-950 dark:text-amber-100 font-bold text-[11px] flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>🔑 ගුරුවරයාගේ සක්‍රීය මුරපදය: <code className="bg-amber-200/70 dark:bg-stone-800 text-amber-950 dark:text-amber-200 px-1.5 py-0.5 rounded font-mono font-extrabold">{teacherForm.password || '(වෙනස් කර නැත)'}</code></span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons & Navigation */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-amber-200/80 dark:border-stone-800 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {teacherFormStep > 1 && (
                <button
                  type="button"
                  onClick={() => setTeacherFormStep((prev) => Math.max(1, prev - 1))}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 disabled:opacity-50 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>පසුපසට (Back)</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-50 text-stone-600 dark:text-stone-400 font-bold text-xs rounded-2xl transition flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
              >
                අවලංගු කරන්න (Cancel)
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {teacherFormStep < 3 ? (
                <button
                  key={`teacher-next-step-${teacherFormStep}`}
                  type="button"
                  disabled={isSaving}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (teacherFormStep === 1 && !teacherForm.name.trim() && !teacherForm.monkName.trim()) {
                      toast.error('කරුණාකර ගුරුභවතුන්ගේ නම ඇතුළත් කරන්න.');
                      return;
                    }
                    setTeacherFormStep((prev) => Math.min(3, prev + 1));
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95 touch-manipulation group"
                >
                  <span>ඊළඟ පියවර (Next Step)</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <button
                  key="teacher-submit-step-3"
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 touch-manipulation group"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>සුරැකෙමින් පවතී...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3] animate-icon-pulse-glow" />
                      <span>
                        {editingTeacher
                          ? 'ලියාපදිංචිය යාවත්කාලීන කරන්න (Update Profile)'
                          : 'ගුරුභවත් ලියාපදිංචි කරන්න (Save Academic Teacher)'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
