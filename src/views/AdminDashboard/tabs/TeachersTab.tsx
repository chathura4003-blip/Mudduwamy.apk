import React from 'react';
import { Plus, Edit, Trash2, QrCode, Mail, BookOpen, GraduationCap, School } from 'lucide-react';
import { User, PirivenaClass, Subject } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { triggerHaptic } from '../../../utils/haptics';
import { getImageUrl, handleAvatarError } from '../../../utils/imageHelper';

interface TeachersTabProps {
  teachers: User[];
  classes: PirivenaClass[];
  subjects: Subject[];
  onOpenNewTeacher: () => void;
  onOpenEditTeacher: (teacher: User) => void;
  onDeleteUser: (id: string) => void;
  onSelectStudentQr?: (user: User) => void;
  copiedKey: string | null;
  handleCopy: (text: string, label: string, customMessage?: string) => void;
}

export const TeachersTab: React.FC<TeachersTabProps> = ({
  teachers,
  classes,
  subjects,
  onOpenNewTeacher,
  onOpenEditTeacher,
  onDeleteUser,
  onSelectStudentQr,
  copiedKey,
  handleCopy,
}) => {
  const { language } = useLanguage();
  const isSi = language === 'si';

  return (
    <div className="space-y-3 pb-12 select-none animate-fade-in text-slate-900 dark:text-stone-100">
      {/* Top Header Toolbar */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-[10px] uppercase border border-amber-200 dark:border-amber-800">
              {isSi ? 'ආචාර්ය මණ්ඩලය' : 'Faculty Management'}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              ({teachers.length} {isSi ? 'ගුරුභවතුන්' : 'Teachers'})
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-serif font-black text-slate-900 dark:text-white mt-0.5">
            {isSi ? 'ආචාර්ය මණ්ඩල කළමනාකරණය' : 'Academic Faculty Management'}
          </h1>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenNewTeacher();
          }}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95 shrink-0 group"
        >
          <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform" />
          <span>{isSi ? 'නව ආචාර්යවරයෙක් එක් කරන්න' : 'Add New Teacher'}</span>
        </button>
      </div>

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teachers.map((tch) => {
          const categories =
            tch.categoriesTaught && tch.categoriesTaught.length > 0
              ? tch.categoriesTaught
              : ['Mulika Pirivena', 'Pracheena'];

          const teacherAssignments = Array.isArray(tch.teacherAssignments) ? tch.teacherAssignments : [];
          const assignedClassIds = new Set(teacherAssignments.map((a: any) => a.classId).filter(Boolean));
          const assignedSubjIds = new Set(teacherAssignments.map((a: any) => a.subjectId).filter(Boolean));

          const assignedClassesList = classes.filter(
            (c: any) =>
              assignedClassIds.has(c.id) ||
              (c.code && assignedClassIds.has(c.code)) ||
              (c.name && assignedClassIds.has(c.name)) ||
              c.teacherInChargeId === tch.id ||
              c.teacherInChargeId === tch.customId
          );

          const subjectsTaughtList = Array.from(assignedSubjIds)
            .map((sId) => {
              const found: any = subjects.find(
                (s: any) =>
                  s.id === sId ||
                  s.code === sId ||
                  s.subjectCode === sId ||
                  s.name === sId ||
                  s.subjectName === sId ||
                  s.nameSinhala === sId ||
                  s.subjectNameSinhala === sId
              );
              return found
                ? found.subjectNameSinhala ||
                    found.nameSinhala ||
                    found.subjectName ||
                    found.name ||
                    sId
                : sId;
            })
            .filter(Boolean);

          return (
            <div
              key={tch.id}
              className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3.5 flex flex-col justify-between shadow-2xs transition-all hover:border-amber-300 dark:hover:border-amber-700/80"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {tch.avatar ? (
                        <img
                          src={getImageUrl(tch.avatar)}
                          alt={tch.name}
                          onError={handleAvatarError}
                          className="w-full h-full object-cover"
                        />
                      ) : tch.monkStatus === 'monk' ? (
                        <span className="text-xl">🪷</span>
                      ) : (
                        <span className="text-xl">👨‍🏫</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                          {tch.customId}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-lg ${
                            (tch.status || 'active') === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {(tch.status || 'active').toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-serif font-black text-base text-slate-900 dark:text-white mt-1">
                        {tch.monkStatus === 'monk' && tch.monkName
                          ? tch.monkName
                          : tch.name || tch.monkName || 'ගුරු භවතා'}
                      </h4>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-xl shrink-0 ${
                      tch.monkStatus === 'monk'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-serif'
                        : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    {tch.monkStatus === 'monk' ? '🪷 පූජ්‍ය ආචාර්ය හිමි' : '👨‍🏫 ගිහි ආචාර්ය'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-stone-850 p-3.5 rounded-2xl border border-slate-200/80 dark:border-stone-750 space-y-2 text-xs">
                  {tch.qualification && (
                    <p className="font-semibold text-slate-800 dark:text-stone-200">
                      <span className="text-slate-500 dark:text-stone-400 font-bold">සුදුසුකම්: </span>
                      <span>{tch.qualification}</span>
                    </p>
                  )}

                  {/* Categories Taught */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 dark:text-stone-400 font-bold text-[11px]">
                      කාණ්ඩ:
                    </span>
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] font-bold bg-white dark:bg-stone-800 text-slate-700 dark:text-stone-300 border border-slate-200 dark:border-stone-700 px-2 py-0.5 rounded-lg"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Assigned Classes */}
                  {assignedClassesList.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-500 dark:text-stone-400 font-bold text-[11px]">
                        පන්ති:
                      </span>
                      {assignedClassesList.map((cls: any) => (
                        <span
                          key={cls.id}
                          className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-lg"
                        >
                          {cls.classNameSinhala || cls.nameSinhala || cls.name || cls.code || cls.id}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Teaching Subjects */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 dark:text-stone-400 font-bold text-[11px]">
                      📖 උගන්වන විෂයයන්:
                    </span>
                    {subjectsTaughtList.length > 0 ? (
                      subjectsTaughtList.map((subjName, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-lg"
                        >
                          {subjName}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] italic text-slate-400">
                        විෂයයන් පවරා නැත
                      </span>
                    )}
                  </div>

                  {/* Email & Pass */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-stone-750 flex flex-wrap items-center justify-between text-slate-600 dark:text-stone-300 text-[11px] gap-2">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {tch.email}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono bg-white dark:bg-stone-800 text-slate-800 dark:text-stone-200 px-2 py-0.5 rounded-md font-bold border border-slate-200 dark:border-stone-700 text-[10px]">
                        🔑 {tch.password}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          handleCopy(
                            `ID: ${tch.customId} | Email: ${tch.email} | Pass: ${tch.password}`,
                            `tch-pass-${tch.id}`
                          );
                        }}
                        className="text-[10px] text-amber-600 dark:text-amber-400 font-bold underline cursor-pointer"
                      >
                        {copiedKey === `tch-pass-${tch.id}` ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Bottom Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-stone-800 flex items-center justify-end gap-2">
                {onSelectStudentQr && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      onSelectStudentQr(tch);
                    }}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs group"
                    title="Teacher Digital ID Card"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 animate-icon-pulse-glow" />
                    <span>ID Card</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenEditTeacher(tch);
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 group"
                >
                  <Edit className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  <span>{isSi ? 'සංස්කරණය' : 'Edit'}</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('warning');
                    onDeleteUser(tch.id);
                  }}
                  className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-800 transition cursor-pointer active:scale-95 group"
                  title="Delete Account"
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
