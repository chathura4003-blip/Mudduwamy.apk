import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  School,
  BookOpen,
  Users,
  GraduationCap,
  Sparkles,
  Layers,
  Check,
  Calendar,
} from 'lucide-react';
import { PirivenaClass, Subject, User } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { ClassTimetableModal } from '../modals';
import { classesApi } from '../../../api/classesApi';

interface ClassesTabProps {
  classes: PirivenaClass[];
  subjects: Subject[];
  teachers: User[];
  students: User[];
  onOpenNewClass: () => void;
  onOpenEditClass: (cls: PirivenaClass) => void;
  onDeleteClass: (id: string) => void;
  onOpenNewSubject: () => void;
  onOpenEditSubject: (subj: Subject) => void;
  onDeleteSubject: (id: string) => void;
}

export const ClassesTab: React.FC<ClassesTabProps> = React.memo(({
  classes = [],
  subjects = [],
  teachers = [],
  students = [],
  onOpenNewClass,
  onOpenEditClass,
  onDeleteClass,
  onOpenNewSubject,
  onOpenEditSubject,
  onDeleteSubject,
}) => {
  const { language } = useLanguage();
  const [subView, setSubView] = useState<'classes' | 'subjects'>(() => {
    try {
      const saved = localStorage.getItem('pirivena_classes_subview');
      return (saved as 'classes' | 'subjects') || 'classes';
    } catch (e) {
      return 'classes';
    }
  });
  const [categoryFilter, setCategoryFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('pirivena_classes_category_filter') || 'all';
    } catch (e) {
      return 'all';
    }
  });
  const [timetableClass, setTimetableClass] = useState<PirivenaClass | null>(null);

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_classes_subview', subView);
    } catch (e) {}
  }, [subView]);

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_classes_category_filter', categoryFilter);
    } catch (e) {}
  }, [categoryFilter]);

  // Memoized O(1) Class Student Count Map
  const classStudentCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const clsId = s.classId || s.pirivenaClass;
      if (clsId) {
        map.set(clsId, (map.get(clsId) || 0) + 1);
      }
    }
    return map;
  }, [students]);

  const getClassStudentCount = (cls: PirivenaClass) => {
    return (
      classStudentCountMap.get(cls.id) ||
      classStudentCountMap.get(cls.code || '') ||
      classStudentCountMap.get(cls.name || '') ||
      classStudentCountMap.get(cls.nameSinhala || '') ||
      0
    );
  };

  const subjectClassesMap = useMemo(() => {
    const map = new Map<string, PirivenaClass[]>();
    for (const subj of subjects) {
      const matching = classes.filter(
        (c) =>
          (c.subjects &&
            (c.subjects.includes(subj.id) ||
              c.subjects.includes(subj.code || '') ||
              c.subjects.includes(subj.name || ''))) ||
          (subj.category && c.category && c.category === subj.category)
      );
      map.set(subj.id, matching);
    }
    return map;
  }, [classes, subjects]);

  const getSubjectClasses = (subj: Subject) => {
    return subjectClassesMap.get(subj.id) || [];
  };

  const getSubjectStudentCount = (subj: Subject) => {
    const matchingClasses = getSubjectClasses(subj);
    const classIdentifiers = new Set<string>();
    matchingClasses.forEach((c) => {
      if (c.id) classIdentifiers.add(c.id);
      if (c.code) classIdentifiers.add(c.code);
      if (c.name) classIdentifiers.add(c.name);
      if (c.nameSinhala) classIdentifiers.add(c.nameSinhala);
    });

    let count = 0;
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (
        (s as any).subjectsEnrolled &&
        ((s as any).subjectsEnrolled.includes(subj.id) ||
          (s as any).subjectsEnrolled.includes(subj.code) ||
          (s as any).subjectsEnrolled.includes(subj.name))
      ) {
        count++;
        continue;
      }
      const sClass = s.classId || s.pirivenaClass || '';
      if (sClass && classIdentifiers.has(sClass)) {
        count++;
      }
    }
    return count;
  };

  const subjectTeachersMap = useMemo(() => {
    const map = new Map<string, User[]>();
    for (const subj of subjects) {
      const matching = teachers.filter((t) => {
        const taughtList = t.subjectsTaught || [];
        const assignments = t.teacherAssignments?.map((a) => a.subjectId) || [];
        return (
          taughtList.includes(subj.id) ||
          taughtList.includes(subj.code || '') ||
          taughtList.includes(subj.name || '') ||
          assignments.includes(subj.id) ||
          assignments.includes(subj.code || '') ||
          assignments.includes(subj.name || '')
        );
      });
      map.set(subj.id, matching);
    }
    return map;
  }, [subjects, teachers]);

  const getSubjectTeachers = (subj: Subject) => {
    return subjectTeachersMap.get(subj.id) || [];
  };

  // Distinct categories for quick filter pills
  const availableCategories = useMemo(() => {
    const list = subView === 'classes' ? classes : subjects;
    const cats = new Set<string>();
    list.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [subView, classes, subjects]);

  const filteredClasses = useMemo(() => {
    if (categoryFilter === 'all') return classes;
    return classes.filter((c) => c.category === categoryFilter);
  }, [classes, categoryFilter]);

  const filteredSubjects = useMemo(() => {
    if (categoryFilter === 'all') return subjects;
    return subjects.filter((s) => s.category === categoryFilter);
  }, [subjects, categoryFilter]);

  return (
    <div className="space-y-3 pb-12 select-none animate-fade-in">
      {/* 1. TOP TOOLBAR: SWITCHER + ADD BUTTON (Responsive under all font scales) */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Segmented Switch */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-stone-800 rounded-xl text-xs font-black gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setSubView('classes');
              setCategoryFilter('all');
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              subView === 'classes'
                ? 'bg-indigo-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="text-sm">🏛️</span>
            <span>{language === 'si' ? 'පන්ති කාමර' : 'Classes'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                subView === 'classes'
                  ? 'bg-white/25 text-white font-bold'
                  : 'bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {classes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubView('subjects');
              setCategoryFilter('all');
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              subView === 'subjects'
                ? 'bg-cyan-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="text-sm">📚</span>
            <span>{language === 'si' ? 'විෂය නිර්දේශය' : 'Subjects'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                subView === 'subjects'
                  ? 'bg-white/25 text-white font-bold'
                  : 'bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {subjects.length}
            </span>
          </button>
        </div>

        {/* Primary Add Button (Always visible and comfortably sized) */}
        <button
          type="button"
          onClick={subView === 'classes' ? onOpenNewClass : onOpenNewSubject}
          className={`w-full sm:w-auto px-4 py-2.5 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer active:scale-95 shrink-0 min-h-[42px] text-white group ${
            subView === 'classes'
              ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
              : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[3] shrink-0 group-hover:rotate-90 transition-transform" />
          <span>
            {subView === 'classes'
              ? language === 'si' ? '+ නව පන්තියක් සාදන්න' : '+ Add Class'
              : language === 'si' ? '+ නව විෂයයක් එක් කරන්න' : '+ Add Subject'}
          </span>
        </button>
      </div>

      {/* 2. CATEGORY FILTER CHIPS (IF CATEGORIES EXIST) */}
      {availableCategories.length > 1 && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-2 sm:p-2.5 shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition cursor-pointer active:scale-95 ${
              categoryFilter === 'all'
                ? subView === 'classes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-stone-700'
            }`}
          >
            🏛️ සියල්ල (All)
          </button>
          {availableCategories.map((cat) => {
            const isSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer active:scale-95 ${
                  isSelected
                    ? subView === 'classes'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'bg-cyan-600 text-white shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-stone-700'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. SQUIRCLE COMPACT CARDS GRID */}
      {subView === 'classes' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full py-10 px-4 text-center rounded-2xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 space-y-2 shadow-2xs">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-stone-800 flex items-center justify-center text-lg">
                🏛️
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'si' ? 'පන්ති කාමර කිසිවක් හමු නොවීය.' : 'No classes found.'}
              </p>
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const studentCount = getClassStudentCount(cls);
              const teacherInCharge = teachers.find((t) => t.id === cls.teacherInChargeId);

              return (
                <div
                  key={cls.id}
                  className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700/80"
                >
                  <div className="space-y-2">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono font-black text-[9.5px] border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                        {cls.code || 'CLS'}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-[9.5px] flex items-center gap-1 border border-blue-200 dark:border-blue-700 shadow-2xs">
                        <Users className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 animate-icon-pulse-glow" />
                        <span>{studentCount} {language === 'si' ? 'සිසුන්' : 'Students'}</span>
                      </span>
                    </div>

                    {/* Class Name */}
                    <div>
                      <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                        {cls.nameSinhala || cls.name}
                      </h3>
                      {cls.name && cls.nameSinhala && cls.name !== cls.nameSinhala && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {cls.name}
                        </p>
                      )}
                    </div>

                    {/* In-Charge & Category metadata */}
                    <div className="pt-0.5 space-y-1 text-[10px]">
                      {teacherInCharge ? (
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 text-[10px]">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 animate-icon-bounce" />
                          <span className="truncate">පන්තිභාර: {teacherInCharge.monkName || teacherInCharge.name}</span>
                        </div>
                      ) : (
                        <div className="text-[9.5px] text-slate-400 italic">
                          පන්තිභාර ආචාර්යවරයෙකු නම් කර නැත
                        </div>
                      )}

                      {cls.category && (
                        <div className="text-[9.5px] font-bold text-slate-500 flex items-center gap-1">
                          <span>කාණ්ඩය:</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stone-700">
                            {cls.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => setTimetableClass(cls)}
                      className="py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs group"
                      title="පන්ති කාලසටහන (Timetable)"
                    >
                      <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                      <span>කාලසටහන</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEditClass(cls)}
                      className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs group"
                    >
                      <Edit className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      <span>{language === 'si' ? 'සංස්කරණය' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteClass(cls.id)}
                      className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800 transition cursor-pointer active:scale-95 shadow-2xs group"
                      title="මකන්න"
                    >
                      <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredSubjects.length === 0 ? (
            <div className="col-span-full py-10 px-4 text-center rounded-2xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 space-y-2 shadow-2xs">
              <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-stone-800 flex items-center justify-center text-lg">
                📚
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'si' ? 'විෂයයන් කිසිවක් හමු නොවීය.' : 'No subjects found.'}
              </p>
            </div>
          ) : (
            filteredSubjects.map((subj) => {
              const studentCount = getSubjectStudentCount(subj);
              const subjectClasses = getSubjectClasses(subj);
              const subjectTeachers = getSubjectTeachers(subj);

              return (
                <div
                  key={subj.id}
                  className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-cyan-300 dark:hover:border-cyan-700/80"
                >
                  <div className="space-y-2">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 font-mono font-black text-[9.5px] border border-cyan-200 dark:border-cyan-800 shadow-2xs">
                          {subj.code || 'SUBJ'}
                        </span>
                        {subj.category && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 font-bold text-[9.5px] border border-slate-200 dark:border-stone-700 shadow-2xs">
                            {subj.category}
                          </span>
                        )}
                      </div>

                      {/* Student Count Pill */}
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-black text-[10px] border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                        <Users className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-icon-pulse-glow" />
                        <span>{studentCount} ශිෂ්‍යයන්</span>
                      </span>
                    </div>

                    {/* Subject Name */}
                    <div>
                      <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                        {subj.nameSinhala || subj.name}
                      </h3>
                      {subj.name && subj.nameSinhala && subj.name !== subj.nameSinhala && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {subj.name}
                        </p>
                      )}
                    </div>

                    {/* Classes & Teachers Metadata Tray */}
                    <div className="pt-0.5 space-y-1 text-[10px]">
                      {subjectClasses.length > 0 && (
                        <div className="flex items-center gap-1.5 font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-50/70 dark:bg-cyan-950/50 p-1.5 rounded-lg border border-cyan-200/60 dark:border-cyan-800/60 text-[10px]">
                          <School className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 animate-icon-pulse-glow" />
                          <span className="truncate">
                            පන්ති: {subjectClasses.map((c) => c.nameSinhala || c.name).join(', ')}
                          </span>
                        </div>
                      )}

                      {subjectTeachers.length > 0 && (
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/50 p-1.5 rounded-lg border border-amber-200/60 dark:border-amber-800/60 text-[10px]">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-icon-bounce" />
                          <span className="truncate">
                            ආචාර්ය: {subjectTeachers.map((t) => t.monkName || t.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => onOpenEditSubject(subj)}
                      className="flex-1 py-1.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 transition cursor-pointer active:scale-95 border border-cyan-200/80 dark:border-cyan-800/80 shadow-2xs group"
                    >
                      <Edit className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      <span>{language === 'si' ? 'සංස්කරණය' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSubject(subj.id)}
                      className="p-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800 transition cursor-pointer active:scale-95 shadow-2xs group"
                      title="මකන්න"
                    >
                      <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Class Timetable Modal */}
      {timetableClass && (
        <ClassTimetableModal
          isOpen={!!timetableClass}
          onClose={() => setTimetableClass(null)}
          targetClass={timetableClass}
          subjects={subjects}
          teachers={teachers}
          onSaveTimetable={async (classId, slots) => {
            await classesApi.updateTimetable(classId, slots);
            if (timetableClass) {
              timetableClass.timetable = slots;
            }
            try {
              localStorage.setItem(`pirivena_timetable_${classId}`, JSON.stringify(slots));
              localStorage.setItem('pirivena_classes_sync', String(Date.now()));
              const bc = new BroadcastChannel('pirivena-admin-sync');
              bc.postMessage({ type: 'classes-updated', classId });
              bc.close();
            } catch (e) {}
          }}
        />
      )}
    </div>
  );
});

