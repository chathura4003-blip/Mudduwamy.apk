import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../../../utils/haptics';
import { User, PirivenaClass } from '../../../types';
import { StudentFormState } from '../types';
import { PIRIVENA_CATEGORIES } from '../constants';
import { uploadApi } from '../../../api/uploadApi';
import { getImageUrl, handleAvatarError } from '../../../utils/imageHelper';
import {
  Users,
  School,
  Lock,
  Check,
  Camera,
  Upload,
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
} from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStudent: User | null;
  studentForm: StudentFormState;
  setStudentForm: React.Dispatch<React.SetStateAction<StudentFormState>>;
  studentFormStep?: number;
  setStudentFormStep?: React.Dispatch<React.SetStateAction<number>>;
  step?: number;
  setStep?: React.Dispatch<React.SetStateAction<number>>;
  classes: PirivenaClass[];
  subjects?: any[];
  teachers?: User[];
  copiedKey?: string | null;
  onCopy?: (text: string, key: string) => void;
  onGenerateRandomPassword?: (role: string) => void;
  onImageFileChange?: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  onClassSelectForStudent?: (classId: string) => void;
  onSaveStudent?: (e: React.FormEvent) => void;
  onSave?: (e: React.FormEvent) => void;
  toast?: any;
  isSaving?: boolean;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  editingStudent,
  studentForm,
  setStudentForm,
  studentFormStep: propStudentFormStep,
  setStudentFormStep: propSetStudentFormStep,
  step = 1,
  setStep,
  classes,
  subjects = [],
  teachers = [],
  copiedKey,
  onCopy,
  onGenerateRandomPassword,
  onImageFileChange,
  onClassSelectForStudent,
  onCategoryChangeForStudent,
  onSaveStudent: propOnSaveStudent,
  onSave,
  toast: propToast,
  isSaving = false,
}) => {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const studentFormStep = propStudentFormStep || step || 1;
  const setStudentFormStep = propSetStudentFormStep || setStep || (() => {});
  const onSaveStudent = propOnSaveStudent || onSave || ((e) => e.preventDefault());
  const toast = propToast || {
    error: (msg: string) => console.error(msg),
    success: (msg: string) => console.log(msg),
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

  const handleClassSelect = (classIdOrKey: string) => {
    if (onClassSelectForStudent) {
      onClassSelectForStudent(classIdOrKey);
      return;
    }
    const targetClass = classes.find(
      (c) =>
        c.id === classIdOrKey ||
        c.code === classIdOrKey ||
        c.name === classIdOrKey ||
        c.nameSinhala === classIdOrKey ||
        (c as any).className === classIdOrKey ||
        (c as any).classNameSinhala === classIdOrKey
    );
    const classSubjs = (targetClass?.subjects && targetClass.subjects.length > 0)
      ? targetClass.subjects
      : subjects.map((s) => s.id);

    setStudentForm((prev) => ({
      ...prev,
      classId: targetClass?.id || classIdOrKey,
      educationCategory: targetClass?.category || prev.educationCategory,
      classLevel: targetClass?.levelName || targetClass?.name || prev.classLevel,
      classTeacherId: targetClass?.teacherInChargeId || prev.classTeacherId,
      subjectsAssigned: classSubjs,
    }));
  };

  const handleCategoryChange = (category: string) => {
    if (onCategoryChangeForStudent) {
      onCategoryChangeForStudent(category);
      return;
    }
    setStudentForm((prev) => ({ ...prev, educationCategory: category }));
  };

  const handleInternalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (typeof onImageFileChange === 'function') {
      onImageFileChange(e, (url: string) => {
        setStudentForm((prev) => ({ ...prev, avatar: url }));
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
                  formData.append('file', blob, 'student_avatar.jpg');
                  try {
                    const res = await uploadApi.uploadFile(formData);
                    if (res && res.fileUrl) {
                      setStudentForm((prev) => ({ ...prev, avatar: res.fileUrl }));
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
                setStudentForm((prev) => ({ ...prev, avatar: dataUrl }));
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
      console.error('Student photo upload failed:', err);
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
            onClose();
          }}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-slate-200 dark:border-stone-800 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] overflow-hidden my-auto text-slate-900 dark:text-stone-100"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Top Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 shrink-0" />

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-md border-b border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-2xl shadow-inner shrink-0 text-blue-300">
                {studentForm.monkStatus === 'monk' ? '🪷' : '🎓'}
              </div>
              <div>
                <h3 className="font-serif font-black text-base sm:text-lg text-white leading-tight">
                  {editingStudent
                    ? 'ශිෂ්‍ය ගිණුම යාවත්කාලීන කිරීම (Edit Student)'
                    : 'නව සාමාජික ශිෂ්‍ය හිමි/සිසු ලියාපදිංචිය (Add Student Scholar)'}
                </h3>
                <p className="text-[11px] text-blue-200/80 font-medium">
                  පියවර {studentFormStep} / 3:{' '}
                  {studentFormStep === 1
                    ? 'සාමාන්‍ය තොරතුරු හා ඡායාරූපය'
                    : studentFormStep === 2
                    ? 'අධ්‍යාපන අංශය හා පන්ති කාමරය'
                    : 'ERP පද්ධති ගිණුම් තොරතුරු'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer active:scale-95"
            >
              ✕
            </button>
          </div>

          {/* Stepper Header Navigation */}
          <div className="bg-slate-50 dark:bg-stone-850 px-4 py-2.5 border-b border-slate-200/70 dark:border-stone-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          {[
            { step: 1, title: '1. මූලික තොරතුරු', sub: 'Profile & Photo', icon: Users },
            { step: 2, title: '2. පන්ති කාමරය', sub: 'Class Assignment', icon: School },
            { step: 3, title: '3. ERP ගිණුම', sub: 'Credentials & Login', icon: Lock },
          ].map((s) => {
            const isActive = studentFormStep === s.step;
            const isPassed = studentFormStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  if (s.step === studentFormStep) return;
                  if (s.step < studentFormStep) {
                    setStudentFormStep(s.step);
                    return;
                  }
                  // Check validations before skipping ahead
                  if (!studentForm.name.trim() && !studentForm.monkName.trim()) {
                    toast.error('කරුණාකර පළමු පියවරේ ශිෂ්‍යයාගේ නම ඇතුළත් කරන්න.');
                    return;
                  }
                  if (s.step === 3 && !studentForm.classId) {
                    toast.error('කරුණාකර දෙවන පියවරේ පන්තිය/පන්ති කාමරය තෝරන්න.');
                    return;
                  }
                  setStudentFormStep(s.step);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl transition-all text-left shrink-0 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/20 ring-2 ring-blue-400/40'
                    : isPassed
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-300/80 dark:border-emerald-800'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-blue-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-xl flex items-center justify-center text-[11px] shrink-0 font-black ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
                </div>
                <div>
                  <p className="text-[11px] leading-tight font-black">{s.title}</p>
                  <p className="text-[9px] opacity-80 hidden sm:block font-medium">{s.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Content */}
        <form
          onSubmit={onSaveStudent}
          className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-stone-800 dark:text-stone-200 flex-1"
        >
          {/* STEP 1: Basic Profile & Photo */}
          {studentFormStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Photo & Status Toggles */}
              <div className="bg-stone-50/70 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Avatar preview box */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-stone-900 border-2 border-amber-400/80 overflow-hidden flex items-center justify-center shadow-md relative">
                      {isUploadingPhoto ? (
                        <div className="flex flex-col items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-[9px] font-bold">Uploading...</span>
                        </div>
                      ) : studentForm.avatar ? (
                        <img
                          src={getImageUrl(studentForm.avatar)}
                          alt="Student avatar"
                          onError={handleAvatarError}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">
                          {studentForm.monkStatus === 'monk' ? '🪷' : '👤'}
                        </span>
                      )}
                    </div>
                    <label
                      htmlFor="student-photo-file-modal"
                      className="absolute -bottom-1 -right-1 bg-amber-800 hover:bg-amber-900 text-white p-1.5 rounded-xl cursor-pointer shadow-md transition active:scale-95"
                      title="Upload Photo"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </label>
                    <input autoComplete="off" name="student-photo-file"
                      id="student-photo-file-modal"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleInternalImageUpload}
                    />
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <label
                        htmlFor="student-photo-file-modal"
                        className="px-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded-xl cursor-pointer text-[11px] inline-flex items-center gap-1.5 transition shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {studentForm.avatar
                            ? 'ඡායාරූපය වෙනස් කරන්න'
                            : 'ඡායාරූපයක් එක් කරන්න'}
                        </span>
                      </label>
                      {studentForm.avatar && (
                        <button
                          type="button"
                          onClick={() => setStudentForm({ ...studentForm, avatar: '' })}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-[11px] border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                        >
                          ඉවත් කරන්න
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400">
                      ශිෂ්‍ය ඩිජිටල් හැඳුනුම්පත සඳහා ඡායාරූපය භාවිතා වේ. (Max 5MB)
                    </p>
                  </div>
                </div>

                {/* Interactive Pill Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-200/80 dark:border-stone-700">
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1.5 text-[11px]">
                      ගිහි / පැවිදි භාවය (Clergy Status) <span className="text-red-500">*</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStudentForm({ ...studentForm, monkStatus: 'monk' })}
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          studentForm.monkStatus === 'monk'
                            ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-300'
                        }`}
                      >
                        <span>🪷 පැවිදි හිමි</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentForm({ ...studentForm, monkStatus: 'lay' })}
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          studentForm.monkStatus === 'lay'
                            ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-300'
                        }`}
                      >
                        <span>👤 ගිහි සිසු</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1.5 text-[11px]">
                      ගිණුමේ තත්ත්වය (Account Status)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStudentForm({ ...studentForm, status: 'active' })}
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          studentForm.status === 'active'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-300'
                        }`}
                      >
                        <span>🟢 සක්‍රීය</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentForm({ ...studentForm, status: 'inactive' })}
                        className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          studentForm.status === 'inactive'
                            ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-rose-300'
                        }`}
                      >
                        <span>🔴 අක්‍රීය</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Identity */}
              <div className="bg-white dark:bg-stone-800/80 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 space-y-3">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs flex items-center gap-2 border-b border-stone-100 dark:border-stone-700 pb-2">
                  <span>📝</span>
                  <span>ශිෂ්‍ය නාමික තොරතුරු (Student Names & Identity)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-student-name" className="font-bold text-stone-800 dark:text-stone-200 block mb-1 text-[11px]">
                      සම්පූර්ණ නම - ඉංග්‍රීසියෙන් (Full Name - English) <span className="text-red-500">*</span>
                    </label>
                    <input autoComplete="name"
                      id="modal-student-name"
                      name="name"
                      type="text"
                      required
                      value={studentForm.name}
                      onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                      placeholder="e.g. Ven. Mudduwe Nanda Samanera"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 bg-stone-50/50 dark:bg-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-student-monk-name" className="font-bold text-stone-800 dark:text-stone-200 block mb-1 text-[11px]">
                      පැවිදි නම / සිංහල නම (Monastic Title / Sinhala Name)
                    </label>
                    <input autoComplete="name"
                      id="modal-student-monk-name"
                      name="monkName"
                      type="text"
                      value={studentForm.monkName}
                      onChange={(e) => setStudentForm({ ...studentForm, monkName: e.target.value })}
                      placeholder="උදා: පූජ්‍ය මුද්දුවේ නන්ද සාමණේර හිමි"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 bg-stone-50/50 dark:bg-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-student-phone" className="font-bold text-stone-800 dark:text-stone-200 block mb-1 text-[11px]">
                      දුරකථන අංකය (Contact Phone)
                    </label>
                    <input autoComplete="tel"
                      id="modal-student-phone"
                      name="phone"
                      type="text"
                      value={studentForm.phone}
                      onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                      placeholder="0771234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 bg-stone-50/50 dark:bg-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="modal-student-nic" className="font-bold text-stone-800 dark:text-stone-200 block mb-1 text-[11px]">
                      ජා.හැ. අංකය / උප්පැන්න අංකය (NIC / Birth Cert)
                    </label>
                    <input autoComplete="name"
                      id="modal-student-nic"
                      name="nicOrBirthCert"
                      type="text"
                      value={studentForm.nicOrBirthCert}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, nicOrBirthCert: e.target.value })
                      }
                      placeholder="200589100234"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 bg-stone-50/50 dark:bg-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Guardian & Temple Details */}
              <div className="bg-amber-50/60 dark:bg-stone-800/90 p-4 rounded-2xl border border-amber-200/80 dark:border-stone-700 space-y-3">
                <div className="flex items-center gap-2 border-b border-amber-200/80 dark:border-stone-700 pb-2">
                  <Users className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                  <h4 className="font-bold text-amber-950 dark:text-amber-100 text-xs">
                    විහාරාධිපති ස්වාමීන් වහන්සේ / භාරකාර තොරතුරු (Temple Incumbent / Guardian Details)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label htmlFor="modal-student-guardian-name" className="font-bold text-amber-950 dark:text-amber-100 block mb-1 text-[11px]">
                      භාරකරු / විහාරාධිපති හිමිගේ නම (Guardian / Incumbent Name)
                    </label>
                    <input autoComplete="name"
                      id="modal-student-guardian-name"
                      name="guardianName"
                      type="text"
                      value={studentForm.guardianName}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, guardianName: e.target.value })
                      }
                      placeholder="උදා: පූජ්‍ය රාජකීය පණ්ඩිත නායක හිමි"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-student-guardian-phone" className="font-bold text-amber-950 dark:text-amber-100 block mb-1 text-[11px]">
                      භාරකරුගේ දුරකථන අංකය (Guardian Contact Phone)
                    </label>
                    <input autoComplete="tel"
                      id="modal-student-guardian-phone"
                      name="guardianPhone"
                      type="text"
                      value={studentForm.guardianPhone}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, guardianPhone: e.target.value })
                      }
                      placeholder="0771234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-student-guardian-relation" className="font-bold text-amber-950 dark:text-amber-100 block mb-1 text-[11px]">
                      භාරකාර සම්බන්ධතාවය (Relationship)
                    </label>
                    <select autoComplete="off"
                      id="modal-student-guardian-relation"
                      name="guardianRelation"
                      value={studentForm.guardianRelation}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, guardianRelation: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-bold"
                    >
                      <option value="විහාරාධිපති ස්වාමීන් වහන්සේ">විහාරාධිපති ස්වාමීන් වහන්සේ (Chief Incumbent)</option>
                      <option value="නියෝජ්‍ය / අනුනායක හිමි">නියෝජ්‍ය / අනුනායක හිමි (Deputy Incumbent)</option>
                      <option value="මව්පියන්">මව්පියන් (Parent / Mother / Father)</option>
                      <option value="ගුරු හිමි">ගුරු හිමි (Teacher Monk)</option>
                      <option value="වෙනත් භාරකරු">වෙනත් භාරකරු (Other Guardian)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="modal-student-temple-name" className="font-bold text-amber-950 dark:text-amber-100 block mb-1 text-[11px]">
                      වැඩවසන විහාරස්ථානය / පිරිවෙන (Temple Name)
                    </label>
                    <input autoComplete="name"
                      id="modal-student-temple-name"
                      name="templeName"
                      type="text"
                      value={studentForm.templeName}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, templeName: e.target.value })
                      }
                      placeholder="උදා: ශ්‍රී රතනජෝති මහා විහාරය"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="modal-student-guardian-address" className="font-bold text-amber-950 dark:text-amber-100 block mb-1 text-[11px]">
                      විහාරස්ථානයේ / භාරකරුගේ ලිපිනය (Temple / Guardian Address)
                    </label>
                    <input autoComplete="name"
                      id="modal-student-guardian-address"
                      name="guardianAddress"
                      type="text"
                      value={studentForm.guardianAddress}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, guardianAddress: e.target.value })
                      }
                      placeholder="උදා: ශ්‍රී රතනජෝති මහා විහාරය, මුද්දුව, රත්නපුර"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Class Assignment & Academic Category */}
          {studentFormStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white dark:bg-stone-800/80 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700 pb-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 text-xs tracking-wide">
                      අධ්‍යාපන අංශය හා පන්ති අනුයුක්තය (Classroom Assignment)
                    </h4>
                  </div>
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-stone-900 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-stone-700 shrink-0">
                    ⚡ පන්තිය අනුව විෂයයන් ස්වයංක්‍රීයව අනුයුක්ත වේ
                  </span>
                </div>

                <div className="bg-amber-50/70 dark:bg-stone-900 p-4 rounded-2xl border border-amber-200 dark:border-stone-700 space-y-2">
                  <label htmlFor="addstudentmodal-select-2" className="font-extrabold text-amber-950 dark:text-amber-100 block text-xs">
                    🏫 අනුයුක්ත කරන පන්තිය / පන්ති කාමරය (Assigned Class Room){' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <select autoComplete="off" id="addstudentmodal-select-2" name="select-2"
                    required
                    value={
                      classes.find(
                        (c) =>
                          c.id === studentForm.classId ||
                          c.code === studentForm.classId ||
                          c.name === studentForm.classId ||
                          c.nameSinhala === studentForm.classId
                      )?.id || studentForm.classId
                    }
                    onChange={(e) => handleClassSelect(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border-2 border-amber-500 dark:border-amber-600 text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-600 shadow-2xs cursor-pointer"
                  >
                    <option value="">-- පන්තිය / පන්ති කාමරය තෝරන්න (Select Class) --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {(c as any).classNameSinhala || c.nameSinhala || c.name} • {c.category || 'පිරිවෙන් අංශය'} (
                        {c.code || c.roomNumber || 'Class'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-stone-600 dark:text-stone-400 italic">
                    💡 පන්තිය තෝරාගත් පසු අධ්‍යාපන අංශය, පන්ති මට්ටම, භාර ගුරු හිමි සහ විෂයයන් ස්වයංක්‍රීයව අනුයුක්ත වේ.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label htmlFor="addstudentmodal-educationCategory" className="font-bold text-stone-800 dark:text-stone-200 block mb-1 text-[11px]">
                      අධ්‍යාපන අංශය (Category)
                    </label>
                    <select autoComplete="off" id="addstudentmodal-educationCategory" name="educationCategory"
                      value={studentForm.educationCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      {PIRIVENA_CATEGORIES.map((cat) => (
                        <option key={cat.key} value={cat.key}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="addstudentmodal-classTeacherId" className="font-bold text-stone-800 dark:text-stone-200 block mb-1 text-[11px]">
                      පාරිවේණික භාර ගුරු හිමි (Class Teacher)
                    </label>
                    <select autoComplete="off" id="addstudentmodal-classTeacherId" name="classTeacherId"
                      value={studentForm.classTeacherId}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, classTeacherId: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      <option value="">-- ගුරුභවතුන් තෝරන්න --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.monkName || t.name} ({t.customId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="addstudentmodal-academicYear" className="font-bold text-stone-800 dark:text-stone-200 block mb-1 text-[11px]">
                      අධ්‍යයන වර්ෂය (Academic Year)
                    </label>
                    <input autoComplete="name" id="addstudentmodal-academicYear" name="academicYear"
                      type="text"
                      value={studentForm.academicYear}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, academicYear: e.target.value })
                      }
                      placeholder="2026"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                {/* Class Enrolled Subjects Preview */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="modal-student-custom-id" className="font-bold text-stone-800 dark:text-stone-200 text-[11px] block">
                      පන්තියට අදාළ විෂයයන් (Enrolled Subjects for this Class):
                    </label>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                      ✓ මෙම පන්තියේ සියලු විෂයයන් ශිෂ්‍යයාට ස්වයංක්‍රීයව හිමිවේ
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 max-h-32 overflow-y-auto">
                    {(() => {
                      const targetClass = classes.find(
                        (c) =>
                          c.id === studentForm.classId ||
                          c.code === studentForm.classId ||
                          c.name === studentForm.classId ||
                          c.nameSinhala === studentForm.classId ||
                          (c as any).className === studentForm.classId ||
                          (c as any).classNameSinhala === studentForm.classId
                      );
                      const subIds = targetClass?.subjects && targetClass.subjects.length > 0
                        ? targetClass.subjects
                        : studentForm.subjectsAssigned && studentForm.subjectsAssigned.length > 0
                        ? studentForm.subjectsAssigned
                        : subjects.map((s) => s.id);
                      
                      const matchedSubjs = subjects.filter((s) =>
                        subIds.includes(s.id) ||
                        (s.code && subIds.includes(s.code)) ||
                        (s.name && subIds.includes(s.name)) ||
                        (s.nameSinhala && subIds.includes(s.nameSinhala))
                      );

                      if (matchedSubjs.length === 0) {
                        return <span className="text-[11px] text-stone-400 italic">පන්තියක් තෝරාගත් විට අදාළ සියලු විෂයයන් මෙහි දිස්වේ</span>;
                      }

                      return matchedSubjs.map((subj) => (
                        <span
                          key={subj.id}
                          className="inline-flex items-center gap-1 text-[11px] bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700 font-medium shadow-2xs"
                        >
                          <BookOpen className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                          <span>{subj.nameSinhala || (subj as any).subjectNameSinhala || subj.name}</span>
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ERP Login Credentials */}
          {studentFormStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-amber-50/60 dark:bg-stone-800/80 p-4.5 rounded-2xl border border-amber-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-stone-700 pb-2">
                  <h4 className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5 text-xs">
                    <Lock className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                    <span>ERP පද්ධති ගිණුම් තොරතුරු (ERP Student Login Credentials)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      onCopy(
                        `ID: ${studentForm.customId} | Email: ${studentForm.email} | Pass: ${studentForm.password}`,
                        'student-creds'
                      )
                    }
                    className="text-[10px] bg-white dark:bg-stone-900 border border-amber-300 dark:border-stone-700 hover:bg-amber-50 text-amber-900 dark:text-amber-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    {copiedKey === 'student-creds' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'student-creds' ? 'Copied!' : 'Copy Credentials'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="modal-student-custom-id" className="font-bold text-amber-950 dark:text-amber-100 block mb-1 text-[11px]">
                      ලියාපදිංචි අංකය (Student Reg ID) <span className="text-red-500">*</span>
                    </label>
                    <input autoComplete="name"
                      id="modal-student-custom-id"
                      name="customId"
                      type="text"
                      required
                      value={studentForm.customId}
                      onChange={(e) => setStudentForm({ ...studentForm, customId: e.target.value })}
                      placeholder="STD-2026-001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-stone-700 font-mono font-bold text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="modal-student-email" className="font-bold text-amber-950 dark:text-amber-100 block text-[11px]">
                        ප්‍රවේශ විද්‍යුත් තැපෑල (Gmail / Email) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const cleanId = (studentForm.customId || `STD-2026-${Math.floor(1000 + Math.random() * 9000)}`).toLowerCase().replace(/[^a-z0-9]/g, '');
                          setStudentForm({ ...studentForm, email: `${cleanId}@gmail.com` });
                        }}
                        className="text-[10px] text-amber-800 dark:text-amber-400 hover:text-amber-950 font-bold underline flex items-center gap-0.5 cursor-pointer"
                        title="Auto-Generate Gmail Address"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>✨ Gmail සාදන්න</span>
                      </button>
                    </div>
                    <input autoComplete="email"
                      id="modal-student-email"
                      name="email"
                      type="email"
                      required
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      placeholder="std2026001@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="modal-student-password" className="font-bold text-amber-950 dark:text-amber-100 block text-[11px]">
                        මුරපදය (Password) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => onGenerateRandomPassword('student')}
                        className="text-[10px] text-amber-800 dark:text-amber-400 hover:text-amber-950 font-bold underline flex items-center gap-0.5 cursor-pointer"
                        title="Generate Random Secure Password"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>🎲 අහඹු මුරපදයක්</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input autoComplete="name"
                        id="modal-student-password"
                        name="password"
                        type={studentForm.showPassword ? 'text' : 'password'}
                        required={!editingStudent}
                        value={studentForm.password}
                        onChange={(e) =>
                          setStudentForm({ ...studentForm, password: e.target.value })
                        }
                        placeholder={editingStudent ? "නව මුරපදයක් ඇතුළත් කරන්න (වෙනස් කිරීමට)" : "Samanera@2026"}
                        className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-amber-300 dark:border-stone-700 text-amber-950 dark:text-amber-100 bg-white dark:bg-stone-900 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setStudentForm({
                            ...studentForm,
                            showPassword: !studentForm.showPassword,
                          })
                        }
                        className="absolute right-2.5 top-3 text-stone-500 hover:text-stone-800 cursor-pointer"
                        title={studentForm.showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {studentForm.showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Stepper Footer */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-stone-200 dark:border-stone-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 disabled:opacity-50 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center touch-manipulation"
            >
              අවලංගු කරන්න
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {studentFormStep > 1 && (
                <button
                  type="button"
                  onClick={() => setStudentFormStep((prev) => Math.max(1, prev - 1))}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-stone-700 transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>පෙර පියවර</span>
                </button>
              )}

              {studentFormStep < 3 ? (
                <button
                  key={`student-next-step-${studentFormStep}`}
                  type="button"
                  disabled={isSaving}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (studentFormStep === 1 && !studentForm.name.trim() && !studentForm.monkName.trim()) {
                      toast.error('කරුණාකර ශිෂ්‍යයාගේ නම ඇතුළත් කරන්න.');
                      return;
                    }
                    if (studentFormStep === 2 && !studentForm.classId) {
                      toast.error('කරුණාකර පන්තියක් තෝරන්න.');
                      return;
                    }
                    setStudentFormStep((prev) => Math.min(3, prev + 1));
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation group"
                >
                  <span>ඊළඟ පියවර</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <button
                  key="student-submit-step-3"
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-black text-xs rounded-xl transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 touch-manipulation group"
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
                        {editingStudent
                          ? 'ලියාපදිංචිය යාවත්කාලීන කරන්න'
                          : '✓ ශිෂ්‍ය සාමාජිකයා ලියාපදිංචි කරන්න'}
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
