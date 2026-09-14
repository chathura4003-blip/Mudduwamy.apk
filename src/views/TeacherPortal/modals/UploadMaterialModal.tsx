import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, FileText, Upload, CheckCircle2, Link2, Loader2, Sparkles } from 'lucide-react';
import type { StudyMaterial, PirivenaClass, Subject } from '../../../types';
import type { UploadProgressInfo } from '../../../utils/fileUpload';
import { triggerHaptic } from '../../../utils/haptics';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMaterial: StudyMaterial | null;
  assignedClasses: PirivenaClass[];
  assignedSubjects: Subject[];
  getAssignedSubjectsForClass?: (classId?: string) => Subject[];
  matTitle: string;
  setMatTitle: (val: string) => void;
  matClassId: string;
  setMatClassId: (val: string) => void;
  matSubjectId: string;
  setMatSubjectId: (val: string) => void;
  matType: string;
  setMatType: (val: string) => void;
  matFileUrl: string;
  setMatFileUrl: (val: string) => void;
  matDescription: string;
  setMatDescription: (val: string) => void;
  uploadedMatFile: File | null;
  setUploadedMatFile: (file: File | null) => void;
  matFileBase64: string | null;
  setMatFileBase64: (val: string | null) => void;
  matFileName: string;
  setMatFileName: (val: string) => void;
  matFileSize: string;
  setMatFileSize: (val: string) => void;
  isSubmittingMat: boolean;
  matUploadProgress?: UploadProgressInfo | null;
  handleMaterialFileSelect: (file: File) => void;
  handleUploadMaterial: (e: React.FormEvent) => void;
  resetMaterialForm: () => void;
}

export const UploadMaterialModal: React.FC<UploadMaterialModalProps> = ({
  isOpen,
  onClose,
  editingMaterial,
  assignedClasses,
  assignedSubjects,
  getAssignedSubjectsForClass,
  matTitle,
  setMatTitle,
  matClassId,
  setMatClassId,
  matSubjectId,
  setMatSubjectId,
  matType,
  setMatType,
  matFileUrl,
  setMatFileUrl,
  matDescription,
  setMatDescription,
  uploadedMatFile,
  setUploadedMatFile,
  setMatFileBase64,
  matFileName,
  setMatFileName,
  matFileSize,
  setMatFileSize,
  isSubmittingMat,
  matUploadProgress,
  handleMaterialFileSelect,
  handleUploadMaterial,
  resetMaterialForm,
}) => {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'link'>(() => {
    return matFileUrl && !uploadedMatFile ? 'link' : 'file';
  });

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingMat) {
              onClose();
              resetMaterialForm();
            }
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-amber-500/30 dark:border-stone-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto text-slate-900 dark:text-stone-100"
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
          <div>
            <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
              {editingMaterial
                ? 'සටහන සංස්කරණය (Edit Resource)'
                : 'අධ්‍යයන සටහන් එක්කිරීම (Upload Resource)'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              PDF, ඡායාරූප, Google Drive හෝ ශ්‍රව්‍ය ගාථා සිසුන් සඳහා උඩුගත කරන්න
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmittingMat}
            onClick={() => {
              triggerHaptic('light');
              onClose();
              resetMaterialForm();
            }}
            className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-slate-400 hover:text-slate-800 dark:hover:text-stone-200 flex items-center justify-center cursor-pointer shrink-0 active:scale-90 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUploadMaterial} className="space-y-4">
          {/* ========================================================= */}
          {/* 📱 2 UNIFIED UPLOAD OPTIONS (FILE vs GOOGLE DRIVE / LINK) */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              උඩුගත කිරීමේ ක්‍රමය තෝරන්න (Select Upload Method):
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-stone-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-stone-700">
              <button
                type="button"
                disabled={isSubmittingMat}
                onClick={() => {
                  triggerHaptic('selection');
                  setUploadMethod('file');
                }}
                className={`py-2.5 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 min-h-[40px] ${
                  uploadMethod === 'file'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4 animate-icon-float" />
                <span>📁 File / ඡායාරූප</span>
              </button>

              <button
                type="button"
                disabled={isSubmittingMat}
                onClick={() => {
                  triggerHaptic('selection');
                  setUploadMethod('link');
                }}
                className={`py-2.5 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 min-h-[40px] ${
                  uploadMethod === 'link'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Link2 className="w-4 h-4 animate-icon-pulse-glow" />
                <span>🔗 Google Drive / Link</span>
              </button>
            </div>
          </div>

          {/* OPTION 1: DEVICE FILE / PHOTO UPLOAD */}
          {uploadMethod === 'file' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ලේඛනය හෝ ඡායාරූපය තෝරන්න:
                </span>
                <label
                  htmlFor="uploadmaterialmodal-file-camera"
                  className="cursor-pointer text-[11px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 dark:hover:bg-amber-900 px-2.5 py-1 rounded-xl border border-amber-300 dark:border-amber-700 transition flex items-center gap-1.5 active:scale-95 shadow-2xs group"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span>ඡායාරූපයක් ගන්න (Camera)</span>
                  <input
                    autoComplete="off"
                    disabled={isSubmittingMat}
                    id="uploadmaterialmodal-file-camera"
                    name="file-camera"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleMaterialFileSelect(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="border-2 border-dashed border-amber-300/80 dark:border-stone-700 hover:border-amber-500 rounded-2xl p-4 bg-amber-50/40 dark:bg-stone-800/40 text-center transition relative">
                {uploadedMatFile ? (
                  <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-3 rounded-xl border border-amber-300 dark:border-stone-700 shadow-2xs">
                    <div className="flex items-center gap-3 text-left overflow-hidden">
                      <FileText className="w-7 h-7 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {matFileName}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400">
                          {matFileSize} • {uploadedMatFile.type || 'Attached File'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label
                        htmlFor="uploadmaterialmodal-file-change"
                        className="cursor-pointer text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
                      >
                        <span>වෙනස් කරන්න</span>
                        <input
                          autoComplete="off"
                          disabled={isSubmittingMat}
                          id="uploadmaterialmodal-file-change"
                          name="file-change"
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.mp3,.mp4,.png,.jpg,.jpeg,.webp"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleMaterialFileSelect(e.target.files[0]);
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={isSubmittingMat}
                        onClick={() => {
                          setUploadedMatFile(null);
                          setMatFileBase64(null);
                          setMatFileName('');
                          setMatFileSize('');
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg cursor-pointer disabled:opacity-40"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : matFileName ? (
                  <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-3 rounded-xl border border-amber-300 dark:border-stone-700 shadow-2xs">
                    <div className="flex items-center gap-3 text-left overflow-hidden">
                      <FileText className="w-7 h-7 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {matFileName}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400">
                          Current Attached Resource File
                        </span>
                      </div>
                    </div>
                    <label
                      htmlFor="uploadmaterialmodal-file-change-current"
                      className="cursor-pointer text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
                    >
                      <span>වෙනස් කරන්න</span>
                      <input
                        autoComplete="off"
                        disabled={isSubmittingMat}
                        id="uploadmaterialmodal-file-change-current"
                        name="file-change-current"
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.mp3,.mp4,.png,.jpg,.jpeg,.webp"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleMaterialFileSelect(e.target.files[0]);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="uploadmaterialmodal-file-main"
                    className="cursor-pointer block space-y-1.5 py-3"
                  >
                    <Upload className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      ගොනුව තෝරාගැනීමට මෙතැන ස්පර්ශ කරන්න (Tap to choose file)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      PDF, Word (.docx), Notes (.txt), Photos (.jpg, .png), Audio (.mp3)
                    </span>
                    <input
                      autoComplete="off"
                      disabled={isSubmittingMat}
                      id="uploadmaterialmodal-file-main"
                      name="file-main"
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.mp3,.mp4,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleMaterialFileSelect(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* OPTION 2: GOOGLE DRIVE / WEB LINK */}
          {uploadMethod === 'link' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label
                htmlFor="upload-material-url"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 block"
              >
                Google Drive සබැඳිය හෝ Web Link (URL):
              </label>
              <div className="relative">
                <input
                  autoComplete="off"
                  disabled={isSubmittingMat}
                  id="upload-material-url"
                  name="matFileUrl"
                  type="text"
                  value={matFileUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMatFileUrl(val);
                    if (
                      (val.includes('drive.google.com') || val.includes('docs.google.com')) &&
                      !matTitle
                    ) {
                      setMatTitle('Google Drive Study Material');
                    }
                  }}
                  placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800/60 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
                />
              </div>

              {matFileUrl &&
                (matFileUrl.includes('drive.google.com') ||
                  matFileUrl.includes('docs.google.com')) && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Google Drive සබැඳිය සාර්ථකව හඳුනාගන්නා ලදී!</span>
                  </div>
                )}
            </div>
          )}

          {/* Resource Title */}
          <div>
            <label
              htmlFor="upload-material-title"
              className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1"
            >
              Resource Title / සටහනේ මාතෘකාව *
            </label>
            <input
              autoComplete="name"
              disabled={isSubmittingMat}
              id="upload-material-title"
              name="matTitle"
              type="text"
              required
              value={matTitle}
              onChange={(e) => setMatTitle(e.target.value)}
              placeholder="e.g. පාලි ව්‍යාකරණ නාම පද රූප විභාගය"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800/60 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
            />
          </div>

          {/* Class & Subject Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="upload-material-class"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1"
              >
                අදාළ පන්තිය (Target Class)
              </label>
              <select
                autoComplete="off"
                disabled={isSubmittingMat}
                id="upload-material-class"
                name="matClassId"
                value={matClassId}
                onChange={(e) => setMatClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800/60 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden cursor-pointer"
              >
                <option value="all">🌐 සියලුම පන්ති සඳහා (All Classes)</option>
                {assignedClasses.map((c, idx) => (
                  <option key={`up-mat-cls-opt-${c.id || idx}`} value={c.id}>
                    🏫 {c.name} ({c.code || c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="upload-material-subject"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1"
              >
                විෂයය (Subject)
              </label>
              <select
                autoComplete="off"
                disabled={isSubmittingMat}
                id="upload-material-subject"
                name="matSubjectId"
                value={matSubjectId}
                onChange={(e) => setMatSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800/60 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden cursor-pointer"
              >
                <option value="all">📚 සියලුම විෂයයන් (All Subjects)</option>
                {(() => {
                  const classSubjects =
                    matClassId && matClassId !== 'all' && getAssignedSubjectsForClass
                      ? getAssignedSubjectsForClass(matClassId)
                      : assignedSubjects;
                  return classSubjects.map((s, idx) => (
                    <option key={`up-mat-sbj-opt-${s.id || idx}`} value={s.id}>
                      📚 {s.name} ({s.code || s.id})
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>

          {/* Resource Category Type Badges */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              සටහනේ වර්ගය (Resource Category):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'notes', label: '📝 සටහන්', desc: 'Lecture Notes' },
                { id: 'pdf', label: '📄 PDF ලේඛනය', desc: 'PDF Document' },
                { id: 'past_paper', label: '📋 ප්‍රශ්න පත්‍රය', desc: 'Past Paper' },
                { id: 'audio', label: '🎵 ශ්‍රව්‍ය ගාථා', desc: 'Audio Recitation' },
              ].map((typeItem) => (
                <button
                  key={typeItem.id}
                  type="button"
                  disabled={isSubmittingMat}
                  onClick={() => {
                    triggerHaptic('light');
                    setMatType(typeItem.id);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-center cursor-pointer active:scale-95 ${
                    matType === typeItem.id
                      ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs font-black'
                      : 'bg-slate-50 dark:bg-stone-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700'
                  }`}
                >
                  <span className="text-xs">{typeItem.label}</span>
                  <span
                    className={`text-[9px] ${
                      matType === typeItem.id
                        ? 'text-stone-950 font-bold opacity-80'
                        : 'text-slate-400'
                    }`}
                  >
                    {typeItem.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary / Lecturer Note */}
          <div>
            <label
              htmlFor="upload-material-description"
              className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1"
            >
              සිසුන් සඳහා උපදෙස් / විස්තරය (Description / Note)
            </label>
            <textarea
              autoComplete="name"
              disabled={isSubmittingMat}
              id="upload-material-description"
              name="matDescription"
              rows={2}
              value={matDescription}
              onChange={(e) => setMatDescription(e.target.value)}
              placeholder="e.g. මෙම සටහන කියවා ඊළඟ දේශනයට සූදානම් වන්න..."
              className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800/60 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
            />
          </div>

          {/* ========================================================= */}
          {/* 📊 LIVE PROGRESS CARD WITH REAL-TIME BYTE / BIT COUNT     */}
          {/* ========================================================= */}
          {isSubmittingMat && (
            <div className="bg-amber-500/10 dark:bg-stone-800 border-2 border-amber-500/50 p-4 rounded-2xl shadow-sm space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
                  <span>
                    {matUploadProgress
                      ? 'ගොනුව සර්වර් වෙත උඩුගත වෙමින් පවතී...'
                      : 'දත්ත සුරකිමින් පවතී (Saving to Database)...'}
                  </span>
                </div>
                <span className="font-mono text-amber-700 dark:text-amber-300 font-extrabold text-sm">
                  {matUploadProgress ? `${matUploadProgress.percentage}%` : 'සකසමින්...'}
                </span>
              </div>

              {/* Real-time Progress Bar */}
              <div className="w-full h-3 bg-slate-200 dark:bg-stone-700 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 rounded-full transition-all duration-150 ease-out shadow-xs"
                  style={{
                    width: `${matUploadProgress ? matUploadProgress.percentage : 90}%`,
                  }}
                />
              </div>

              {/* Exact Bytes / Bit Count Progress Status */}
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                <span>උඩුගත කළ ප්‍රමාණය (Uploaded Bytes):</span>
                <span className="font-bold text-amber-800 dark:text-amber-300">
                  {matUploadProgress
                    ? `${matUploadProgress.loadedFormatted} / ${matUploadProgress.totalFormatted} (${matUploadProgress.loaded.toLocaleString()} Bytes)`
                    : 'දත්ත සම්ප්‍රේෂණය වෙමින් පවතී...'}
                </span>
              </div>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-stone-800">
            <button
              type="submit"
              disabled={isSubmittingMat}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 min-h-[46px]"
            >
              {isSubmittingMat ? (
                <Loader2 className="w-4 h-4 text-stone-950 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-stone-950" />
              )}
              <span>
                {isSubmittingMat
                  ? matUploadProgress
                    ? `උඩුගත වෙමින් පවතී (${matUploadProgress.percentage}%)...`
                    : 'සුරකිමින් පවතී...'
                  : editingMaterial
                    ? '💾 සටහන සුරකින්න (Save Changes)'
                    : '🚀 සටහන පළ කරන්න (Publish Resource)'}
              </span>
            </button>
            <button
              type="button"
              disabled={isSubmittingMat}
              onClick={() => {
                triggerHaptic('light');
                onClose();
                resetMaterialForm();
              }}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 disabled:opacity-40 text-slate-700 dark:text-stone-300 font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer active:scale-95 min-h-[46px]"
            >
              අවලංගු කරන්න
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
