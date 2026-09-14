import React from 'react';
import { BookOpen, Search, Eye, Download, FileText, Sparkles, Filter } from 'lucide-react';
import type { StudyMaterial, Subject, User } from '../../../types';
import { triggerHaptic } from '../../../utils/haptics';
import { resolveSubjectSinhalaName } from '../../../utils/subjectHelper';

interface MaterialsTabProps {
  filteredMaterials: StudyMaterial[];
  subjects: Subject[];
  teachers: User[];
  availableStudentSubjects: Subject[];
  matSearch: string;
  setMatSearch: (v: string) => void;
  matTypeFilter: string;
  setMatTypeFilter: (v: string) => void;
  matSubjectFilter: string;
  setMatSubjectFilter: (v: string) => void;
  handleOpenMaterialViewer: (material: StudyMaterial) => void;
  getMaterialTypeBadge: (material: StudyMaterial) => React.ReactNode;
  isImageResource: (url?: string, filename?: string) => boolean;
  isSi: boolean;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({
  filteredMaterials,
  subjects,
  teachers,
  availableStudentSubjects,
  matSearch,
  setMatSearch,
  matTypeFilter,
  setMatTypeFilter,
  matSubjectFilter,
  setMatSubjectFilter,
  handleOpenMaterialViewer,
  getMaterialTypeBadge,
  isImageResource,
  isSi,
}) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-5 animate-fade-in select-none">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 shadow-2xs font-bold">
            <BookOpen className="w-5 h-5 animate-icon-float" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-serif font-black text-slate-900 dark:text-white">
                {isSi ? 'අධ්‍යයන ආධාරක සහ සටහන්' : 'Study Materials & Notes'}
              </h2>
              <span className="px-2.5 py-0.5 bg-sky-500/15 text-sky-800 dark:text-sky-300 font-mono font-bold text-xs rounded-full border border-sky-500/30">
                {filteredMaterials.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isSi ? 'ගුරුවරුන් විසින් නිකුත් කළ පාඩම් සටහන්, PDF සහ Video බලන්න' : 'Access PDFs, Notes & Tutorials'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter / Search Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={matSearch}
            onChange={(e) => setMatSearch(e.target.value)}
            placeholder={isSi ? 'සටහන් සොයන්න (Search)...' : 'Search by title...'}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-stone-800/80 border border-slate-200 dark:border-stone-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden transition"
          />
        </div>

        <div>
          <select
            value={matTypeFilter}
            onChange={(e) => setMatTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-stone-800/80 border border-slate-200 dark:border-stone-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 outline-hidden transition cursor-pointer"
          >
            <option value="all">{isSi ? 'සියලු වර්ග (All Types)' : 'All Resource Types'}</option>
            <option value="pdf">📄 PDF Documents</option>
            <option value="video">🎥 Videos & Lectures</option>
            <option value="audio">🎧 Audio Lessons</option>
            <option value="image">🖼️ Diagram / Image</option>
            <option value="doc">📝 Word / Notes</option>
          </select>
        </div>

        <div>
          <select
            value={matSubjectFilter}
            onChange={(e) => setMatSubjectFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-stone-800/80 border border-slate-200 dark:border-stone-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 outline-hidden transition cursor-pointer"
          >
            <option value="all">{isSi ? 'සියලු විෂයයන් (All Subjects)' : 'All Subjects'}</option>
            {availableStudentSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nameSinhala || (s as any).subjectNameSinhala || s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-stone-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-stone-700 space-y-2">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto animate-icon-float" />
          <h3 className="font-serif font-bold text-slate-900 dark:text-white text-sm">
            {isSi ? 'සටහන් කිසිවක් හමු නොවුණි' : 'No Study Materials Found'}
          </h3>
          <p className="text-xs text-slate-400">
            {isSi ? 'වෙනත් සෙවුම් වචනයක් හෝ Filter එකක් උත්සාහ කරන්න' : 'Try adjusting your search query or filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMaterials.map((m) => {
            const matchedSubject = subjects.find(
              (s) => s.id === m.subjectId || s.code === m.subjectId || s.name === m.subjectId || s.nameSinhala === m.subjectId
            );
            const matchedTeacher = teachers.find(
              (t) => t.id === m.uploadedByTeacherId || t.customId === m.uploadedByTeacherId
            );
            const cleanSubj = matchedSubject?.nameSinhala || (matchedSubject as any)?.subjectNameSinhala || matchedSubject?.name || resolveSubjectSinhalaName(m.subjectId || (m as any).subject);

            return (
              <div
                key={m.id}
                className="p-4 bg-white dark:bg-stone-850 border border-slate-200/90 dark:border-stone-700/80 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl flex flex-col justify-between space-y-3.5 transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-1.5">
                    {getMaterialTypeBadge(m)}
                    <span className="text-[10px] text-slate-400 font-mono font-medium">{m.dateUploaded}</span>
                  </div>

                  {isImageResource(m.fileUrl, m.fileName) && (
                    <div
                      onClick={() => {
                        triggerHaptic('light');
                        handleOpenMaterialViewer(m);
                      }}
                      className="w-full h-32 rounded-xl overflow-hidden bg-stone-950 border border-slate-200 dark:border-stone-700 relative cursor-pointer group/thumb shadow-inner"
                    >
                      <img
                        src={m.fileUrl}
                        alt={m.title}
                        className="w-full h-full object-cover object-center group-hover/thumb:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {m.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                    <span className="px-2 py-0.5 bg-sky-500/15 text-sky-800 dark:text-sky-300 rounded-md border border-sky-500/30">
                      📚 {cleanSubj}
                    </span>
                    {matchedTeacher && (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-stone-750 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-stone-700">
                        👨‍🏫 {matchedTeacher.monkName || matchedTeacher.name}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    handleOpenMaterialViewer(m);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/20 active:scale-95 group"
                >
                  <Eye className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
                  <span>{isSi ? 'කියවන්න / අධ්‍යයනය කරන්න' : 'View & Study Note'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
