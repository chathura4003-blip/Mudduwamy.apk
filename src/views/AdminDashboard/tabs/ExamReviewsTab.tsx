import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  Filter,
  Sparkles,
  Star,
  Eye,
  BookOpenCheck,
  CheckCircle2,
  XCircle,
  Search,
  School,
  BookOpen,
  Users,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
  Check,
  X,
  GraduationCap,
  Layers,
  FileText,
  Trophy,
  SlidersHorizontal,
} from 'lucide-react';
import { Exam as OnlineExam, ExamSubmission, User, PirivenaClass, Subject } from '../../../types';
import { triggerUniversalPrint } from '../../../utils/printHelper';

interface ExamReviewsTabProps {
  exams: OnlineExam[];
  submissions: ExamSubmission[];
  teachers: User[];
  students: User[];
  classes: PirivenaClass[];
  subjects: Subject[];
  teacherExamsMap: Map<string, OnlineExam[]>;
  examsByClassSubjectMap: Map<string, OnlineExam[]>;
  submissionsByExamMap: Map<string, ExamSubmission[]>;
  teacherByIdMap: Map<string, User>;
}

type MobileSegment = 'exams' | 'classes' | 'teachers' | 'results';

export const ExamReviewsTab: React.FC<ExamReviewsTabProps> = React.memo(({
  exams = [],
  submissions = [],
  teachers = [],
  students = [],
  classes = [],
  subjects = [],
  teacherExamsMap,
  examsByClassSubjectMap,
  submissionsByExamMap,
  teacherByIdMap,
}) => {
  const [activeSegment, setActiveSegment] = useState<MobileSegment>(() => {
    try {
      const saved = localStorage.getItem('pirivena_exam_reviews_segment');
      return (saved as MobileSegment) || 'exams';
    } catch (e) {
      return 'exams';
    }
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reviewClassFilter, setReviewClassFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('pirivena_exam_reviews_class_filter') || 'all';
    } catch (e) {
      return 'all';
    }
  });
  const [reviewSubjectFilter, setReviewSubjectFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('pirivena_exam_reviews_subj_filter') || 'all';
    } catch (e) {
      return 'all';
    }
  });
  const [reviewTeacherFilter, setReviewTeacherFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('pirivena_exam_reviews_teacher_filter') || 'all';
    } catch (e) {
      return 'all';
    }
  });
  const [showOnlyConductedExams, setShowOnlyConductedExams] = useState<boolean>(true);
  const [selectedExamForDetail, setSelectedExamForDetail] = useState<OnlineExam | null>(null);
  const [selectedSubmissionForDetail, setSelectedSubmissionForDetail] = useState<ExamSubmission | null>(null);
  const [showMobileFilterSheet, setShowMobileFilterSheet] = useState<boolean>(false);

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_exam_reviews_segment', activeSegment);
    } catch (e) {}
  }, [activeSegment]);

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_exam_reviews_class_filter', reviewClassFilter);
    } catch (e) {}
  }, [reviewClassFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_exam_reviews_subj_filter', reviewSubjectFilter);
    } catch (e) {}
  }, [reviewSubjectFilter]);

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_exam_reviews_teacher_filter', reviewTeacherFilter);
    } catch (e) {}
  }, [reviewTeacherFilter]);

  // Helper to match exams to a class and subject flexibly
  const getExamsForClassAndSubject = (cls: PirivenaClass, subj: Subject) => {
    return exams.filter((e: any) => {
      const eClass = String(e.classId || e.gradeClass || '').trim();
      const eSubj = String(e.subjectId || e.subject || '').trim();

      const classMatches =
        !eClass ||
        eClass === 'all' ||
        eClass === cls.id ||
        eClass === cls.code ||
        eClass === cls.name ||
        eClass === cls.nameSinhala;

      const subjMatches =
        !eSubj ||
        eSubj === 'all' ||
        eSubj === subj.id ||
        eSubj === subj.code ||
        eSubj === subj.name ||
        eSubj === subj.nameSinhala;

      return classMatches && subjMatches;
    });
  };

  const getTeacherExams = (t: User) => {
    return exams.filter((e: any) => {
      const tid = String(e.teacherId || e.createdBy || e.teacher_id || '').trim();
      return tid && (tid === t.id || tid === t.customId || tid === t.name || tid === t.monkName);
    });
  };

  const selectedTeacher =
    reviewTeacherFilter !== 'all' ? teacherByIdMap.get(reviewTeacherFilter) : null;

  const availableClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (!selectedTeacher) return true;
      const assignments = Array.isArray(selectedTeacher.teacherAssignments) ? selectedTeacher.teacherAssignments : [];
      const assignedClassIds = new Set(assignments.map((a) => a.classId).filter(Boolean));
      return (
        assignedClassIds.has(cls.id) ||
        (cls.code && assignedClassIds.has(cls.code)) ||
        (cls.name && assignedClassIds.has(cls.name)) ||
        cls.teacherInChargeId === selectedTeacher.id ||
        cls.teacherInChargeId === selectedTeacher.customId
      );
    });
  }, [classes, selectedTeacher]);

  const availableSubjects = useMemo(() => {
    return subjects.filter((subj) => {
      if (!selectedTeacher) return true;
      const assignments = Array.isArray(selectedTeacher.teacherAssignments) ? selectedTeacher.teacherAssignments : [];
      const assignedSubjIds = new Set(assignments.map((a) => a.subjectId).filter(Boolean));
      return (
        assignedSubjIds.has(subj.id) ||
        (subj.code && assignedSubjIds.has(subj.code)) ||
        (subj.name && assignedSubjIds.has(subj.name))
      );
    });
  }, [subjects, selectedTeacher]);

  const handleTeacherFilterChange = (teacherId: string) => {
    setReviewTeacherFilter(teacherId);
    setReviewClassFilter('all');
    setReviewSubjectFilter('all');
  };

  const getClassStudentCount = (cls: PirivenaClass) => {
    return students.filter(
      (s) =>
        s.classId === cls.id ||
        s.classId === cls.code ||
        s.classId === cls.name ||
        s.pirivenaClass === cls.name ||
        s.pirivenaClass === cls.nameSinhala
    ).length;
  };

  // Overall Performance KPIs
  const overallStats = useMemo(() => {
    const allScores = submissions
      .map((s) => s.score)
      .filter((s): s is number => typeof s === 'number');
    const totalSubmissions = submissions.length;
    const avgScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;
    const passedCount = allScores.filter((s) => s >= 50).length;
    const passRate =
      allScores.length > 0 ? Math.round((passedCount / allScores.length) * 100) : 0;

    return {
      totalExams: exams.length,
      totalSubmissions,
      avgScore,
      passRate,
    };
  }, [exams, submissions]);

  // Filtered Exams List for the 'exams' tab
  const filteredExamsList = useMemo(() => {
    return exams.filter((ex) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const titleMatch =
          ex.title?.toLowerCase().includes(q) ||
          ex.titleSinhala?.toLowerCase().includes(q) ||
          (ex as any).category?.toLowerCase().includes(q) ||
          (ex as any).term?.toLowerCase().includes(q);
        const classObj = classes.find((c) => c.id === ex.classId || c.code === ex.classId);
        const classMatch =
          classObj?.name?.toLowerCase().includes(q) ||
          classObj?.nameSinhala?.toLowerCase().includes(q) ||
          ex.classId?.toLowerCase().includes(q);
        const subjObj = subjects.find((s) => s.id === ex.subjectId || s.code === ex.subjectId);
        const subjMatch =
          subjObj?.name?.toLowerCase().includes(q) ||
          subjObj?.nameSinhala?.toLowerCase().includes(q) ||
          ex.subjectId?.toLowerCase().includes(q);
        const teacherObj = teachers.find(
          (t) => t.id === ex.teacherId || t.customId === ex.teacherId
        );
        const teacherMatch =
          teacherObj?.name?.toLowerCase().includes(q) ||
          teacherObj?.monkName?.toLowerCase().includes(q);

        if (!titleMatch && !classMatch && !subjMatch && !teacherMatch) {
          return false;
        }
      }

      if (reviewClassFilter !== 'all' && ex.classId !== reviewClassFilter) {
        const cObj = classes.find((c) => c.id === reviewClassFilter);
        if (ex.classId !== cObj?.code && ex.classId !== cObj?.name) {
          return false;
        }
      }

      if (reviewSubjectFilter !== 'all' && ex.subjectId !== reviewSubjectFilter) {
        const sObj = subjects.find((s) => s.id === reviewSubjectFilter);
        if (ex.subjectId !== sObj?.code && ex.subjectId !== sObj?.name) {
          return false;
        }
      }

      if (reviewTeacherFilter !== 'all') {
        const tid = String(ex.teacherId || (ex as any).createdBy || (ex as any).teacher_id || '').trim();
        if (tid !== reviewTeacherFilter) {
          const tObj = teachers.find((t) => t.id === reviewTeacherFilter);
          if (tid !== tObj?.customId && tid !== tObj?.name && tid !== tObj?.monkName) {
            return false;
          }
        }
      }

      return true;
    });
  }, [exams, searchQuery, reviewClassFilter, reviewSubjectFilter, reviewTeacherFilter, classes, subjects, teachers]);

  const activeFiltersCount =
    (reviewClassFilter !== 'all' ? 1 : 0) +
    (reviewSubjectFilter !== 'all' ? 1 : 0) +
    (reviewTeacherFilter !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    setReviewClassFilter('all');
    setReviewSubjectFilter('all');
    setReviewTeacherFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-3 sm:space-y-5 pb-16 select-none animate-fade-in">
      {/* 📱 1. MOBILE NATIVE APP BAR & QUICK METRICS BANNER */}
      <div className="bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 rounded-3xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        {/* Background Ambient Icons */}
        <div className="absolute right-2 -bottom-2 text-white/10 text-8xl pointer-events-none select-none font-serif">
          🏆
        </div>

        <div className="relative z-10 space-y-3.5">
          {/* Top Title & Instant Badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl shrink-0 shadow-inner">
                📊
              </div>
              <div className="min-w-0">
                <h2 className="font-serif font-black text-base sm:text-xl text-white tracking-tight leading-tight truncate">
                  විභාග සහ ලකුණු පාලන මැදිරිය
                </h2>
                <p className="text-[11px] text-purple-200 truncate">
                  Online Examinations & Academic Marks Review Hub
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10.5px] font-mono font-black border border-white/30 shadow-2xs">
                {overallStats.totalExams} විභාග
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/30 backdrop-blur-md text-emerald-200 text-[10.5px] font-mono font-black border border-emerald-400/40 shadow-2xs">
                {overallStats.totalSubmissions} පිළිතුරු
              </span>
            </div>
          </div>

          {/* 4-Bento Mobile KPI Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/15">
              <span className="text-[10px] text-purple-200 uppercase font-black block tracking-wider">
                විභාග ගණන
              </span>
              <span className="text-xl sm:text-2xl font-serif font-black text-white">
                {overallStats.totalExams}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/15">
              <span className="text-[10px] text-purple-200 uppercase font-black block tracking-wider">
                සමස්ත පිළිතුරු
              </span>
              <span className="text-xl sm:text-2xl font-serif font-black text-white">
                {overallStats.totalSubmissions}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/15">
              <span className="text-[10px] text-purple-200 uppercase font-black block tracking-wider">
                සාමාන්‍ය ලකුණ
              </span>
              <span className="text-xl sm:text-2xl font-serif font-black text-amber-300">
                {overallStats.avgScore}%
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/15">
              <span className="text-[10px] text-purple-200 uppercase font-black block tracking-wider">
                සමත් ප්‍රතිශතය
              </span>
              <span className="text-xl sm:text-2xl font-serif font-black text-emerald-300">
                {overallStats.passRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 📱 2. MOBILE NATIVE SEGMENTED CONTROL TABS */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto scrollbar-none sticky top-14 z-20 backdrop-blur-md bg-white/95 dark:bg-stone-900/95">
        <button
          type="button"
          onClick={() => setActiveSegment('exams')}
          className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl font-black text-xs transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
            activeSegment === 'exams'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 animate-icon-sparkle" />
          <span>සියලු විභාග</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[9px] ${
              activeSegment === 'exams' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-stone-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {filteredExamsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSegment('classes')}
          className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl font-black text-xs transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
            activeSegment === 'classes'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800'
          }`}
        >
          <School className="w-3.5 h-3.5 animate-icon-pulse-glow" />
          <span>පන්ති & විෂය</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSegment('teachers')}
          className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl font-black text-xs transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
            activeSegment === 'teachers'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 animate-icon-bounce" />
          <span>ගුරු මණ්ඩලය</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSegment('results')}
          className={`flex-1 min-w-[105px] py-2 px-3 rounded-xl font-black text-xs transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
            activeSegment === 'results'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-stone-800'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 animate-icon-sparkle" />
          <span>ප්‍රතිඵල</span>
        </button>
      </div>

      {/* 📱 3. QUICK SEARCH & TOUCH FILTERS STRIP */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input id="examreviewstab-input-1" name="examreviewstab-input-1"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="විභාගය, පන්තිය, විෂයය හෝ ආචාර්ය නාමයෙන් සොයන්න..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-purple-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Modal Trigger for Mobile */}
          <button
            type="button"
            onClick={() => setShowMobileFilterSheet(!showMobileFilterSheet)}
            className={`px-3 py-2.5 rounded-xl border font-black text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0 ${
              activeFiltersCount > 0
                ? 'bg-purple-50 dark:bg-purple-950/80 border-purple-300 text-purple-700 dark:text-purple-300'
                : 'bg-slate-100 dark:bg-stone-800 border-slate-200 dark:border-stone-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline">පෙරහන්</span>
            {activeFiltersCount > 0 && (
              <span className="w-4.5 h-4.5 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Mobile Filters Drawer */}
        {showMobileFilterSheet && (
          <div className="pt-2 border-t border-slate-100 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-fade-in">
            {/* Teacher Select */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block text-[10.5px] mb-1">
                👨‍🏫 ආචාර්යවරයා (Teacher)
              </label>
              <select id="examreviewstab-select-2" name="examreviewstab-select-2"
                value={reviewTeacherFilter}
                onChange={(e) => handleTeacherFilterChange(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-stone-800 font-bold text-xs outline-none focus:border-purple-500"
              >
                <option value="all">සියලුම ආචාර්ය මණ්ඩලය (All Teachers)</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.monkStatus === 'monk' ? '🪷 ' : '👨‍🏫 '}
                    {t.monkName || t.name} ({t.customId})
                  </option>
                ))}
              </select>
            </div>

            {/* Class Select */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block text-[10.5px] mb-1">
                🏛️ පන්තිය (Class)
              </label>
              <select id="examreviewstab-select-3" name="examreviewstab-select-3"
                value={reviewClassFilter}
                onChange={(e) => setReviewClassFilter(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-stone-800 font-bold text-xs outline-none focus:border-purple-500"
              >
                <option value="all">සියලුම පන්ති (All Classes)</option>
                {availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameSinhala || c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Select */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block text-[10.5px] mb-1">
                📚 විෂයය (Subject)
              </label>
              <select id="examreviewstab-select-4" name="examreviewstab-select-4"
                value={reviewSubjectFilter}
                onChange={(e) => setReviewSubjectFilter(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-stone-800 font-bold text-xs outline-none focus:border-purple-500"
              >
                <option value="all">සියලුම විෂයයන් (All Subjects)</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameSinhala || s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Action */}
            {activeFiltersCount > 0 && (
              <div className="col-span-full flex justify-end pt-1">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-purple-600 dark:text-purple-400 font-black hover:underline cursor-pointer"
                >
                  පෙරහන් සියල්ල ඉවත් කරන්න (Clear All Filters)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 📱 4. TAB CONTENT PANELS */}

      {/* TAB A: ALL EXAMS HUB (MOBILE-FIRST CARDS) */}
      {activeSegment === 'exams' && (
        <div className="space-y-3">
          {filteredExamsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredExamsList.map((ex) => {
                const exSubs = submissionsByExamMap.get(ex.id) || [];
                const exScores = exSubs
                  .map((s) => s.score)
                  .filter((s): s is number => typeof s === 'number');
                const exAvg =
                  exScores.length > 0
                    ? Math.round(exScores.reduce((a, b) => a + b, 0) / exScores.length)
                    : 0;
                const passCount = exScores.filter((s) => s >= 50).length;
                const passRate =
                  exScores.length > 0 ? Math.round((passCount / exScores.length) * 100) : 0;

                const classObj = classes.find((c) => c.id === ex.classId || c.code === ex.classId);
                const subjObj = subjects.find((s) => s.id === ex.subjectId || s.code === ex.subjectId);
                const teacherObj = teachers.find(
                  (t) => t.id === ex.teacherId || t.customId === ex.teacherId
                );

                return (
                  <div
                    key={ex.id}
                    className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5 hover:border-purple-300 dark:hover:border-purple-700/60 transition flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges: Class & Subject */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-mono font-black text-[10.5px] px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                          <School className="w-3 h-3" />
                          <span>{classObj?.nameSinhala || classObj?.name || ex.classId || 'පන්තිය'}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 font-mono font-black text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stone-700">
                          <BookOpen className="w-3 h-3 text-indigo-500" />
                          <span>{subjObj?.nameSinhala || subjObj?.name || ex.subjectId || 'විෂයය'}</span>
                        </span>
                      </div>

                      {/* Main Exam Title */}
                      <div>
                        <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                          {ex.title}
                        </h3>
                        {ex.titleSinhala && ex.titleSinhala !== ex.title && (
                          <p className="text-xs text-purple-700 dark:text-purple-300 font-bold mt-0.5">
                            {ex.titleSinhala}
                          </p>
                        )}
                      </div>

                      {/* Lecturer Info Strip */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-stone-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 flex items-center justify-center text-[10px] shrink-0 font-black">
                          {teacherObj?.monkStatus === 'monk' ? '🪷' : '👨‍🏫'}
                        </div>
                        <span className="truncate">
                          {teacherObj ? (teacherObj.monkName || teacherObj.name) : 'ආචාර්ය මණ්ඩලය'}
                        </span>
                      </div>

                      {/* Key Stats Strip */}
                      <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-1">
                        <div className="bg-slate-50 dark:bg-stone-850 p-2 rounded-xl border border-slate-100 dark:border-stone-800">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">කාලය</span>
                          <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-xs">
                            {ex.durationMinutes || 45} min
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-stone-850 p-2 rounded-xl border border-slate-100 dark:border-stone-800">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">පිළිතුරු</span>
                          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
                            {exSubs.length}
                          </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-stone-850 p-2 rounded-xl border border-slate-100 dark:border-stone-800">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">සාමාන්‍යය</span>
                          <span
                            className={`font-mono font-black text-xs ${
                              exAvg >= 75
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : exAvg >= 50
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {exScores.length > 0 ? `${exAvg}%` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => setSelectedExamForDetail(ex)}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ලකුණු විස්තරය බලන්න (Review Marks)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 rounded-3xl p-8 text-center space-y-3 shadow-2xs">
              <div className="text-4xl">🔍</div>
              <p className="font-serif font-black text-base text-slate-800 dark:text-slate-200">
                පරීක්ෂණ හෝ ලකුණු වාර්තා හමු නොවීය
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                ඔබ ඇතුළත් කළ පෙරහන් හෝ සෙවුම් පදයට ගැළපෙන විභාග කිසිවක් නැත.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 bg-purple-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition active:scale-95"
              >
                සියලු පෙරහන් ඉවත් කරන්න
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB B: CLASSES & SUBJECTS HIERARCHICAL MATRIX */}
      {activeSegment === 'classes' && (
        <div className="space-y-4">
          {availableClasses
            .filter((cls) => reviewClassFilter === 'all' || cls.id === reviewClassFilter)
            .map((cls) => {
              const classSubjectIds =
                cls.subjects && cls.subjects.length > 0 ? cls.subjects : subjects.map((s) => s.id);
              const classSubjects = availableSubjects.filter(
                (s) =>
                  classSubjectIds.includes(s.id) &&
                  (reviewSubjectFilter === 'all' || s.id === reviewSubjectFilter)
              );

              if (classSubjects.length === 0) return null;

              return (
                <div
                  key={cls.id}
                  className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4"
                >
                  {/* Class Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-stone-800 pb-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 font-mono font-black text-xs">
                          {cls.code}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {cls.category || 'පිරිවෙන් අංශය'} • {cls.roomNumber}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-serif font-black text-slate-900 dark:text-white mt-1">
                        {cls.nameSinhala || cls.name}
                      </h3>
                    </div>

                    <span className="px-3 py-1 bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 rounded-xl font-mono font-bold text-xs border border-slate-200 dark:border-stone-700">
                      සිසුන්: {getClassStudentCount(cls)}
                    </span>
                  </div>

                  {/* Subjects inside Class */}
                  <div className="space-y-3">
                    {classSubjects.map((subj) => {
                      const classExams = getExamsForClassAndSubject(cls, subj);
                      const matchingExams =
                        reviewTeacherFilter === 'all'
                          ? classExams
                          : classExams.filter((e: any) => {
                              const tid = String(e.teacherId || e.createdBy || e.teacher_id || '').trim();
                              return tid === reviewTeacherFilter;
                            });

                      const classSubmissions = matchingExams.flatMap((e) =>
                        submissions.filter((s) => s.examId === e.id)
                      );
                      const scores = classSubmissions
                        .map((s) => s.score)
                        .filter((s): s is number => typeof s === 'number');
                      const avgScore =
                        scores.length > 0
                          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                          : 0;

                      return (
                        <div
                          key={subj.id}
                          className="bg-slate-50/80 dark:bg-stone-850/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-stone-800 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <span className="font-mono text-[10px] font-bold text-purple-700 dark:text-purple-300">
                                {subj.code}
                              </span>
                              <h4 className="font-serif font-black text-sm text-slate-900 dark:text-white">
                                {subj.nameSinhala || subj.name}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-white dark:bg-stone-800 rounded-lg text-xs font-bold border border-slate-200 dark:border-stone-700">
                                {matchingExams.length} විභාග
                              </span>
                              <span className="px-2 py-0.5 bg-white dark:bg-stone-800 rounded-lg text-xs font-bold border border-slate-200 dark:border-stone-700">
                                {classSubmissions.length} පිළිතුරු
                              </span>
                              {scores.length > 0 && (
                                <span className="px-2 py-0.5 bg-purple-600 text-white rounded-lg text-xs font-mono font-black">
                                  {avgScore}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Exams List under Subject */}
                          {matchingExams.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {matchingExams.map((ex) => {
                                const exSubs = submissionsByExamMap.get(ex.id) || [];
                                return (
                                  <div
                                    key={ex.id}
                                    className="bg-white dark:bg-stone-900 p-3 rounded-xl border border-slate-200 dark:border-stone-750 flex items-center justify-between gap-2 shadow-2xs"
                                  >
                                    <div className="min-w-0">
                                      <h5 className="font-serif font-black text-xs text-slate-900 dark:text-white truncate">
                                        {ex.title}
                                      </h5>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {exSubs.length} Submissions • {ex.durationMinutes} min
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedExamForDetail(ex)}
                                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>බලන්න</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-center py-2 text-xs text-slate-400 italic">
                              මෙම විෂය සඳහා තවම මාර්ගගත පරීක්ෂණ පවත්වා නොමැත.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* TAB C: LECTURER PERFORMANCE CARDS */}
      {activeSegment === 'teachers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {teachers.map((t) => {
            const teacherExams = getTeacherExams(t);
            const teacherSubs = teacherExams.flatMap((e) =>
              submissions.filter((s) => s.examId === e.id)
            );
            const scores = teacherSubs
              .map((s) => s.score)
              .filter((s): s is number => typeof s === 'number');
            const avgScore =
              scores.length > 0
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                : 0;

            return (
              <div
                key={t.id}
                className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3"
              >
                {/* Teacher Top Info */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-serif font-black text-xl shrink-0">
                    {t.monkStatus === 'monk' ? '🪷' : '👨‍🏫'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {t.monkName || t.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {t.customId} | {(t as any).designation || 'ආචාර්ය මණ්ඩලය'}
                    </p>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-1 border-t border-slate-100 dark:border-stone-800">
                  <div className="bg-slate-50 dark:bg-stone-850 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">විභාග</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                      {teacherExams.length}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-stone-850 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">පිළිතුරු</span>
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      {teacherSubs.length}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-stone-850 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">සාමාන්‍යය</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {scores.length > 0 ? `${avgScore}%` : '-'}
                    </span>
                  </div>
                </div>

                {/* Filter by this teacher button */}
                <button
                  type="button"
                  onClick={() => {
                    handleTeacherFilterChange(t.id);
                    setActiveSegment('exams');
                  }}
                  className="w-full py-2 px-3 bg-purple-50 dark:bg-purple-950/80 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-black text-xs rounded-xl border border-purple-200 dark:border-purple-800 transition cursor-pointer active:scale-95"
                >
                  මෙම ආචාර්යතුමාගේ විභාග බලන්න →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB D: RESULTS LEADERBOARD & RECENT SUBMISSIONS */}
      {activeSegment === 'results' && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-stone-800 pb-3">
            <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>සිසුන්ගේ විභාග පිළිතුරු සහ ලකුණු ශ්‍රේණිගත කිරීම</span>
            </h3>
            <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-mono font-black">
              {submissions.length} Submissions
            </span>
          </div>

          <div className="space-y-2">
            {submissions.slice(0, 30).map((sub, idx) => {
              const examObj = exams.find((e) => e.id === sub.examId);
              const studentObj = students.find(
                (u) => u.id === sub.studentId || u.customId === sub.studentId
              );
              const totalMarks = examObj?.totalMarks || 100;
              const passingMarks = examObj?.passingMarks || 40;
              const scorePct =
                sub.score !== undefined ? Math.round((sub.score / totalMarks) * 100) : 0;
              const passed = (sub.score || 0) >= passingMarks;

              return (
                <div
                  key={sub.id || idx}
                  className="bg-slate-50/80 dark:bg-stone-850/60 p-3 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-purple-300 dark:hover:border-purple-700/60 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                      {studentObj?.monkStatus === 'monk' ? '🪷' : '👤'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-serif font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {studentObj?.monkName || studentObj?.name || (sub as any).studentName || sub.studentId}
                      </h4>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                        {examObj?.title || 'මාර්ගගත පරීක්ෂණය'} | {studentObj?.customId || sub.studentId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-stone-750">
                    <div className="text-right">
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white block">
                        {sub.score !== undefined ? `${sub.score}/${totalMarks}` : '-'}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.2 rounded-full inline-block ${
                          passed
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {scorePct}% • {passed ? 'සමර්ථයි' : 'අසමත්'}
                      </span>
                    </div>

                    {examObj && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExamForDetail(examObj);
                          setSelectedSubmissionForDetail(sub);
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-2xs cursor-pointer active:scale-95"
                      >
                        පත්‍රය බලන්න
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📱 5. DETAILED EXAM REVIEW & SUBMISSION MODAL */}
      {selectedExamForDetail &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-fade-in select-none">
            <div
              className="bg-white dark:bg-stone-900 text-slate-900 dark:text-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-stone-800 shadow-2xl overflow-hidden my-auto print-modal-content select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-stone-800 bg-slate-50/90 dark:bg-stone-850 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center text-xl shrink-0">
                    📑
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 dark:text-white truncate">
                      {selectedExamForDetail.title}
                    </h3>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 font-bold truncate">
                      {selectedExamForDetail.titleSinhala || 'මාර්ගගත විභාග සමාලෝචනය'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 no-print">
                  <button
                    type="button"
                    onClick={() => {
                      triggerUniversalPrint(`විභාග_ප්‍රතිඵල_සමාලෝචනය_${selectedExamForDetail?.title || 'Exam_Review'}`);
                    }}
                    className="px-3 py-2 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-stone-700 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-purple-600" />
                    <span className="hidden sm:inline">Print / PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExamForDetail(null);
                      setSelectedSubmissionForDetail(null);
                    }}
                    className="w-9 h-9 rounded-2xl bg-white dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-200 dark:border-stone-700 shadow-2xs transition cursor-pointer active:scale-90"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
                {/* Meta Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-stone-850 p-3 rounded-2xl border border-slate-200/80 dark:border-stone-800 text-xs">
                  <div>
                    <span className="text-[9.5px] text-slate-400 uppercase font-black block">පන්තිය</span>
                    <span className="font-black text-slate-900 dark:text-white truncate block">
                      {classes.find((c) => c.id === selectedExamForDetail.classId || c.code === selectedExamForDetail.classId)?.name || selectedExamForDetail.classId}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9.5px] text-slate-400 uppercase font-black block">විෂයය</span>
                    <span className="font-black text-slate-900 dark:text-white truncate block">
                      {subjects.find((s) => s.id === selectedExamForDetail.subjectId || s.code === selectedExamForDetail.subjectId)?.name || selectedExamForDetail.subjectId}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9.5px] text-slate-400 uppercase font-black block">මුළු ලකුණු</span>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                      {selectedExamForDetail.totalMarks || 100} Marks
                    </span>
                  </div>

                  <div>
                    <span className="text-[9.5px] text-slate-400 uppercase font-black block">සමත් ලකුණ</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {selectedExamForDetail.passingMarks || 40} Marks
                    </span>
                  </div>
                </div>

                {/* Submissions Roster */}
                <div className="space-y-2.5">
                  <h4 className="font-serif font-black text-sm text-slate-900 dark:text-white flex items-center justify-between">
                    <span>සිසුන් ලබාගත් ලකුණු ලේඛනය</span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-mono font-bold">
                      {submissions.filter((s) => s.examId === selectedExamForDetail.id).length} Submissions
                    </span>
                  </h4>

                  <div className="space-y-2">
                    {submissions
                      .filter((s) => s.examId === selectedExamForDetail.id)
                      .map((sub) => {
                        const std = students.find(
                          (u) =>
                            u.id === sub.studentId ||
                            u.customId === sub.studentId ||
                            u.customId === (sub as any).studentCustomId
                        );
                        const totalMarks = selectedExamForDetail.totalMarks || 100;
                        const passingMarks = selectedExamForDetail.passingMarks || 40;
                        const scorePct =
                          sub.score !== undefined ? Math.round((sub.score / totalMarks) * 100) : 0;
                        const passed = (sub.score || 0) >= passingMarks;

                        return (
                          <div
                            key={sub.id}
                            className="bg-slate-50 dark:bg-stone-850/80 p-3 rounded-2xl border border-slate-200/70 dark:border-stone-800 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                                {std?.monkStatus === 'monk' ? '🪷' : '👤'}
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-serif font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                  {std?.monkName || std?.name || (sub as any).studentName || sub.studentId}
                                </h5>
                                <span className="text-[10px] font-mono text-slate-500 block">
                                  {std?.customId || sub.studentId}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <span className="font-mono font-black text-xs text-slate-900 dark:text-white block">
                                  {sub.score !== undefined ? `${sub.score}/${totalMarks}` : '-'}
                                </span>
                                <span
                                  className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-full ${
                                    passed
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {scorePct}%
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedSubmissionForDetail(sub)}
                                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer active:scale-95"
                              >
                                පිළිතුරු
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Selected Submission Question Answer Breakdown */}
                {selectedSubmissionForDetail && (
                  <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-3xl border border-purple-200 dark:border-purple-800/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-200/60 dark:border-purple-800/60 pb-2">
                      <h5 className="font-serif font-black text-xs sm:text-sm text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                        <BookOpenCheck className="w-4 h-4 text-purple-600" />
                        <span>ශිෂ්‍ය පිළිතුරු පත්‍රය (Student Answer Sheet)</span>
                      </h5>
                      <button
                        type="button"
                        onClick={() => setSelectedSubmissionForDetail(null)}
                        className="text-purple-700 dark:text-purple-300 font-bold text-xs hover:underline cursor-pointer"
                      >
                        පත්‍රය වසන්න
                      </button>
                    </div>

                    {(() => {
                      const rawAnswers =
                        selectedSubmissionForDetail.answers ??
                        (selectedSubmissionForDetail as any).answersJson;
                      let ansObj: Record<string, any> = {};
                      if (typeof rawAnswers === 'string') {
                        try {
                          ansObj = JSON.parse(rawAnswers);
                        } catch (e) {
                          ansObj = {};
                        }
                      } else if (typeof rawAnswers === 'object' && rawAnswers !== null) {
                        ansObj = rawAnswers;
                      }

                      const questions =
                        selectedExamForDetail.questions ||
                        (selectedSubmissionForDetail as any).questions ||
                        [];

                      return (
                        <div className="space-y-3">
                          {questions.map((q: any, idx: number) => {
                            const studentAns =
                              ansObj[q.id] ??
                              ansObj[q._id] ??
                              ansObj[`q-${idx}`] ??
                              ansObj[`q-${idx + 1}`] ??
                              ansObj[`q${idx + 1}`] ??
                              ansObj[idx] ??
                              ansObj[String(idx)];
                            const correctAns = q.correctAnswer;

                            const resolveOptIndex = (val: any, optionsList?: string[]): number | null => {
                              if (val === undefined || val === null || val === '') return null;
                              if (typeof val === 'number' && !isNaN(val)) return val;
                              const str = String(val).trim();
                              const lower = str.toLowerCase();

                              if (optionsList && optionsList.length > 0) {
                                const textIdx = optionsList.findIndex(
                                  (opt) => opt && opt.trim().toLowerCase() === lower
                                );
                                if (textIdx !== -1) return textIdx;
                              }

                              const letterMatch = lower.match(/(?:opt|option|vikalpaya|විකල්පය|පිළිතුර|op)?\s*([a-z])\b/);
                              if (letterMatch) {
                                const code = letterMatch[1].charCodeAt(0) - 97;
                                if (code >= 0 && code < 26) return code;
                              }

                              const num = Number(lower);
                              if (!isNaN(num)) {
                                const numOpts = optionsList && optionsList.length > 0 ? optionsList.length : 10;
                                if (num >= 0 && num < numOpts) return num;
                                if (num >= 1 && num <= numOpts) return num - 1;
                              }
                              return null;
                            };

                            const correctIndex = resolveOptIndex(correctAns, q.options);
                            const studentIndex = resolveOptIndex(studentAns, q.options);

                            let isCorrect = false;
                            if (q.type === 'mcq') {
                              isCorrect =
                                correctIndex !== null &&
                                studentIndex !== null &&
                                correctIndex === studentIndex;
                            } else if (q.type === 'true_false') {
                              const norm = (v: any) => {
                                const s = String(v).trim().toLowerCase();
                                if (s === 'true' || s === 't' || s === '1' || s.includes('සත්‍ය')) return 'true';
                                if (s === 'false' || s === 'f' || s === '0' || s.includes('අසත්‍ය')) return 'false';
                                return s;
                              };
                              isCorrect =
                                studentAns !== undefined &&
                                studentAns !== null &&
                                norm(studentAns) === norm(correctAns);
                            } else if (q.type === 'short_answer' || q.type === 'structured') {
                              const uStr = String(studentAns ?? '').trim().toLowerCase();
                              const cStr = String(correctAns ?? '').trim().toLowerCase();
                              isCorrect =
                                uStr !== '' &&
                                cStr !== '' &&
                                (uStr === cStr ||
                                  cStr.split(/[,/|]/).map((a) => a.trim()).filter(Boolean).includes(uStr));
                            }

                            return (
                              <div
                                key={q.id || `exam-q-${idx}`}
                                className={`p-3.5 rounded-2xl border space-y-2.5 ${
                                  isCorrect
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                                    : 'bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-800'
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                                  <span className="text-xs sm:text-sm">
                                    Q{idx + 1}. {q.textSinhala || q.text}
                                  </span>
                                  <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                      isCorrect
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                                    }`}
                                  >
                                    {isCorrect ? '✓ නිවැරදියි' : '✕ වැරදියි'}
                                  </span>
                                </div>

                                {q.type === 'mcq' && q.options && q.options.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                    {q.options.map((optText: string, optIdx: number) => {
                                      const optSinhala = q.optionsSinhala?.[optIdx] || optText;
                                      const isCorrectOpt = optIdx === correctIndex;
                                      const isStudentOpt = optIdx === studentIndex;
                                      const prefixLetter = String.fromCharCode(65 + optIdx);

                                      let optClass = 'bg-slate-50 dark:bg-stone-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-stone-700';
                                      if (isCorrectOpt && isStudentOpt) {
                                        optClass = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold';
                                      } else if (isStudentOpt && !isCorrectOpt) {
                                        optClass = 'bg-rose-100 dark:bg-rose-950 border-rose-400 text-rose-950 dark:text-rose-100 font-bold';
                                      } else if (isCorrectOpt) {
                                        optClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200';
                                      }

                                      return (
                                        <div
                                          key={optIdx}
                                          className={`p-2 rounded-xl border flex items-center justify-between gap-1.5 ${optClass}`}
                                        >
                                          <span className="flex items-center gap-1.5">
                                            <span className="w-4.5 h-4.5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center font-mono font-black text-[9.5px]">
                                              {prefixLetter}
                                            </span>
                                            <span>{optSinhala}</span>
                                          </span>

                                          {isCorrectOpt && isStudentOpt ? (
                                            <span className="text-[9.5px] font-black text-emerald-700">✓ නිවැරදි තේරීම</span>
                                          ) : isStudentOpt ? (
                                            <span className="text-[9.5px] font-black text-rose-700">✕ ශිෂ්‍ය තේරීම</span>
                                          ) : isCorrectOpt ? (
                                            <span className="text-[9.5px] font-black text-emerald-700">✓ නිවැරදි පිළිතුර</span>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-stone-800 bg-slate-50/90 dark:bg-stone-850 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExamForDetail(null);
                    setSelectedSubmissionForDetail(null);
                  }}
                  className="px-5 py-2.5 bg-slate-200 dark:bg-stone-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                >
                  වසන්න (Close)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
});

