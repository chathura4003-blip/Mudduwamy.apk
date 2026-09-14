import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Search,
  Upload,
  Eye,
  Edit3,
  Download,
  Trash2,
  FileText,
  Music,
  FileCheck2,
  Plus,
  Layers,
} from 'lucide-react';
import type { StudyMaterial, PirivenaClass, Subject } from '../../../types';
import { triggerHaptic } from '../../../utils/haptics';
import { playNotificationSound } from '../../../utils/soundHelper';
import { downloadFileFromUrl } from '../../../utils/pdfHelper';
import { resolveSubjectSinhalaName, resolveClassSinhalaName } from '../../../utils/subjectHelper';

interface MaterialsTabProps {
  filteredMaterials: StudyMaterial[];
  matSearchQuery: string;
  setMatSearchQuery: (q: string) => void;
  matClassFilter: string;
  setMatClassFilter: (cls: string) => void;
  matSubjectFilter: string;
  setMatSubjectFilter: (subj: string) => void;
  matTypeFilter: string;
  setMatTypeFilter: (type: string) => void;
  assignedClasses: PirivenaClass[];
  assignedSubjects: Subject[];
  getAssignedSubjectsForClass?: (classId?: string) => Subject[];
  classes: PirivenaClass[];
  subjects: Subject[];
  resetMaterialForm: () => void;
  matClassId: string;
  setMatClassId: (id: string) => void;
  matSubjectId: string;
  setMatSubjectId: (id: string) => void;
  setShowUploadModal: (show: boolean) => void;
  setViewingTeacherMaterial: (m: StudyMaterial | null) => void;
  handleEditMaterial: (m: StudyMaterial) => void;
  deletingMaterialId: string | null;
  setDeletingMaterialId: (id: string | null) => void;
  handleDeleteMaterial: (id: string) => void;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({
  filteredMaterials,
  matSearchQuery,
  setMatSearchQuery,
  matClassFilter,
  setMatClassFilter,
  matSubjectFilter,
  setMatSubjectFilter,
  matTypeFilter,
  setMatTypeFilter,
  assignedClasses,
  assignedSubjects,
  getAssignedSubjectsForClass,
  classes,
  subjects,
  resetMaterialForm,
  matClassId,
  setMatClassId,
  matSubjectId,
  setMatSubjectId,
  setShowUploadModal,
  setViewingTeacherMaterial,
  handleEditMaterial,
  deletingMaterialId,
  setDeletingMaterialId,
  handleDeleteMaterial,
}) => {
  const handleOpenUpload = () => {
    triggerHaptic('medium');
    playNotificationSound();
    resetMaterialForm();
    const validClass =
      matClassId &&
      (assignedClasses.some((c) => c.id === matClassId || c.code === matClassId) ||
        matClassId === 'all')
        ? matClassId
        : assignedClasses[0]?.id || 'all';
    setMatClassId(validClass);

    const validSubj =
      matSubjectId &&
      (assignedSubjects.some((s) => s.id === matSubjectId || s.code === matSubjectId) ||
        matSubjectId === 'all')
        ? matSubjectId
        : assignedSubjects[0]?.id || 'all';
    setMatSubjectId(validSubj);

    setShowUploadModal(true);
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'audio':
        return <Music className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'past_paper':
        return <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'notes':
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    }
  };

  const getTypeName = (type?: string) => {
    switch (type) {
      case 'audio':
        return 'ශ්‍රව්‍ය ගාථා (Audio)';
      case 'past_paper':
        return 'පසුගිය ප්‍රශ්න පත්‍ර (Past Paper)';
      case 'notes':
        return 'දේශන සටහන් (Notes)';
      default:
        return 'PDF ලේඛනය (PDF)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 sm:space-y-5 pb-12 select-none"
    >
      {/* ========================================================= */}
      {/* 📱 1. CLEAN TOP HERO BAR                                   */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-[#2a0c04] via-[#381307] to-[#1e0701] text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-black text-base sm:text-lg text-white tracking-tight">
              අධ්‍යයන නිබන්ධන සහ සටහන්
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
              {filteredMaterials.length} සටහන්
            </span>
          </div>
          <p className="text-[11px] text-amber-200/80">
            සිසුන් සඳහා PDF ලේඛන, දේශන සටහන් සහ ශ්‍රව්‍ය ගාථා
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenUpload}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0 min-h-[42px] group"
        >
          <Upload className="w-4 h-4 text-stone-950 animate-icon-float group-hover:-translate-y-1 transition-transform" />
          <span>+ නව සටහනක් එක්කරන්න</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 🔍 2. SEARCH & SINGLE CLASS FILTER BAR                     */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input id="materialstab-input-1" name="materialstab-input-1"
              type="text"
              value={matSearchQuery}
              onChange={(e) => setMatSearchQuery(e.target.value)}
              placeholder="මාතෘකාව හෝ විස්තරයෙන් සොයන්න..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 rounded-2xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
            />
            {matSearchQuery && (
              <button
                type="button"
                onClick={() => setMatSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Class Filter */}
          <div>
            <select id="materialstab-select-2" name="materialstab-select-2"
              value={matClassFilter}
              onChange={(e) => {
                triggerHaptic('light');
                setMatClassFilter(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-stone-800/60 border border-slate-200 dark:border-stone-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-hidden cursor-pointer"
            >
              <option value="all">🏫 සියලුම පන්ති (All Classes)</option>
              {assignedClasses.map((c) => (
                <option key={`mat-c-${c.id}`} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filters: Subject & Type Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-stone-800">
          {/* Subject Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setMatSubjectFilter('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 ${
                matSubjectFilter === 'all'
                  ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              සියලු විෂයයන්
            </button>
            {assignedSubjects.map((s) => (
              <button
                key={`mat-s-${s.id}`}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setMatSubjectFilter(s.id);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-95 ${
                  matSubjectFilter === s.id
                    ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Type Filter Select */}
          <div className="shrink-0">
            <select id="materialstab-select-3" name="materialstab-select-3"
              value={matTypeFilter}
              onChange={(e) => {
                triggerHaptic('light');
                setMatTypeFilter(e.target.value);
              }}
              className="w-full sm:w-auto px-3 py-1.5 bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-stone-700 cursor-pointer"
            >
              <option value="all">📂 සියලු වර්ග</option>
              <option value="pdf">📄 PDF ගොනු</option>
              <option value="notes">📝 සටහන් (Notes)</option>
              <option value="past_paper">📜 ප්‍රශ්න පත්‍ර (Papers)</option>
              <option value="audio">🎧 ශ්‍රව්‍ය (Audio)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📱 3. STUDY MATERIALS CARD LIST                            */}
      {/* ========================================================= */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-slate-200 dark:border-stone-800 space-y-3 p-6">
          <BookOpen className="w-10 h-10 text-amber-600/50 mx-auto animate-icon-float" />
          <h4 className="font-serif font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
            අධ්‍යයන සටහන් කිසිවක් හමු නොවීය
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            ඉහළ ඇති '+ නව සටහනක් එක්කරන්න' බොත්තම මඟින් පළමු සටහන හෝ ලේඛනය උඩුගත කරන්න.
          </p>
          <button
            type="button"
            onClick={handleOpenUpload}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95 group"
          >
            <Upload className="w-3.5 h-3.5 animate-icon-float" />
            <span>+ සටහනක් එක්කරන්න</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredMaterials.map((m, idx) => {
          const targetClass = classes.find((c) => c.id === m.classId || c.code === m.classId || c.name === m.classId || c.nameSinhala === m.classId);
          const targetSubj = subjects.find((s) => s.id === m.subjectId || s.code === m.subjectId || s.name === m.subjectId || s.nameSinhala === m.subjectId);
          const cleanClass = targetClass?.nameSinhala || targetClass?.name || resolveClassSinhalaName(m.classId);
          const cleanSubj = targetSubj?.nameSinhala || targetSubj?.name || resolveSubjectSinhalaName(m.subjectId || (m as any).subject);

          return (
            <div
              key={`mat-card-${m.id || idx}`}
              className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 p-4 rounded-3xl transition shadow-2xs space-y-3.5 flex flex-col justify-between hover:border-amber-300 dark:hover:border-stone-700"
            >
              <div className="space-y-2.5">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 text-[10px] font-black border border-slate-200 dark:border-stone-700 flex items-center gap-1.5">
                    {getTypeIcon(m.type)}
                    <span>{getTypeName(m.type)}</span>
                  </span>

                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    #{m.id}
                  </span>
                </div>

                {/* Title and Description */}
                <div>
                  <h4 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                    {m.title}
                  </h4>
                  {m.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>
                  )}
                </div>

                {/* Class and Subject Tags */}
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold pt-0.5">
                  <span className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-stone-700">
                    🏫 {cleanClass}
                  </span>
                  <span className="bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-stone-700">
                    📚 {cleanSubj}
                  </span>
                  {m.fileSize && (
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800 font-mono">
                      💾 {m.fileSize}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Hub */}
              <div className="pt-2 border-t border-slate-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                {/* Left Actions: View, Download, Edit, Delete */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setViewingTeacherMaterial(m);
                    }}
                    className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 transition flex items-center gap-1 cursor-pointer active:scale-95 min-h-[34px] group"
                    title="සටහන බලන්න"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>බලන්න</span>
                  </button>

                  {m.fileUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        downloadFileFromUrl(m.fileUrl, m.fileName || `${m.title}.pdf`);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition flex items-center gap-1 active:scale-95 min-h-[34px] cursor-pointer group"
                      title="බාගත කරන්න"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 group-hover:translate-y-0.5 transition-transform" />
                      <span>Download</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      handleEditMaterial(m);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95 min-h-[34px] group"
                    title="සංස්කරණය"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 group-hover:rotate-12 transition-transform" />
                    <span>Edit</span>
                  </button>

                  {/* Delete Button / Inline Confirmation */}
                  {deletingMaterialId === m.id ? (
                    <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950 p-1 rounded-xl border border-rose-300 dark:border-rose-800">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('heavy');
                          handleDeleteMaterial(m.id);
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition active:scale-95"
                      >
                        මකන්න
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingMaterialId(null)}
                        className="px-1.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 font-bold text-xs"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setDeletingMaterialId(m.id);
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200/60 dark:border-rose-900/60 transition cursor-pointer active:scale-95 min-h-[34px] flex items-center justify-center group"
                      title="සටහන මකන්න"
                    >
                      <Trash2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </motion.div>
  );
};
