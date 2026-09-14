import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  QrCode,
  FileCheck2,
  Search,
  Users,
  GraduationCap,
  Copy,
  Check,
  Phone,
  School,
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Key,
  Lock,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Shield,
  Calendar,
  Sparkles,
  Share2,
} from 'lucide-react';
import { User, PirivenaClass, Subject } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { TeacherTimetableModal } from '../../../components/TeacherTimetableModal';
import { getPublicShareUrl } from '../../../utils/urlHelper';
import { shareContent, shareToWhatsApp } from '../../../utils/shareHelper';
import { getImageUrl, handleAvatarError } from '../../../utils/imageHelper';

interface StudentsTabProps {
  students: User[];
  teachers?: User[];
  classes: PirivenaClass[];
  subjects?: Subject[];
  initialDirectoryType?: 'students' | 'teachers';
  onOpenNewStudent: () => void;
  onOpenEditStudent: (student: User) => void;
  onOpenNewTeacher?: () => void;
  onOpenEditTeacher?: (teacher: User) => void;
  onToggleStatus: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onSelectStudentQr: (user: User) => void;
  onSelectStudentReportCard?: (student: User) => void;
  copiedKey: string | null;
  handleCopy: (text: string, label: string, customMessage?: string) => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = React.memo(({
  students = [],
  teachers = [],
  classes = [],
  subjects = [],
  initialDirectoryType = 'students',
  onOpenNewStudent,
  onOpenEditStudent,
  onOpenNewTeacher,
  onOpenEditTeacher,
  onToggleStatus,
  onDeleteUser,
  onSelectStudentQr,
  onSelectStudentReportCard,
  copiedKey,
  handleCopy,
}) => {
  const { language } = useLanguage();
  const [activeSegment, setActiveSegment] = useState<'students' | 'teachers'>(() => {
    try {
      if (initialDirectoryType === 'teachers' || initialDirectoryType === 'students') {
        return initialDirectoryType;
      }
      const saved = localStorage.getItem('pirivena_directory_segment');
      return (saved as 'students' | 'teachers') || 'students';
    } catch (e) {
      return initialDirectoryType || 'students';
    }
  });
  const [selectedTimetableTeacher, setSelectedTimetableTeacher] = useState<User | null>(null);
  const [classFilter, setClassFilter] = useState<string>(() => {
    try {
      return localStorage.getItem('pirivena_students_class_filter') || 'all';
    } catch (e) {
      return 'all';
    }
  });

  React.useEffect(() => {
    if (initialDirectoryType === 'students' || initialDirectoryType === 'teachers') {
      setActiveSegment(initialDirectoryType);
      try {
        localStorage.setItem('pirivena_directory_segment', initialDirectoryType);
      } catch (e) {}
    }
  }, [initialDirectoryType]);

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_directory_segment', activeSegment);
    } catch (e) {}
  }, [activeSegment]);

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_students_class_filter', classFilter);
    } catch (e) {}
  }, [classFilter]);

  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [expandedCardMap, setExpandedCardMap] = useState<Record<string, boolean>>({});

  const toggleShowPassword = (userId: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const toggleCardExpand = (userId: string) => {
    setExpandedCardMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleShareCredentials = async (user: User) => {
    const loginUrl = getPublicShareUrl();
    const text = `🪷 ශ්‍රී සුමන මහා පිරිවෙන - ERP පිවිසුම් ගිණුම\n👤 නම: ${user.monkName || user.name}\n🆔 User ID: ${user.customId}\n📧 Email: ${user.email || 'N/A'}\n🌐 Login Link: ${loginUrl}`;
    
    handleCopy(text, `share-${user.id}`);

    await shareContent({
      title: `ශ්‍රී සුමන පිරිවෙන - ${user.monkName || user.name} ගිණුම් විස්තර`,
      text,
      url: loginUrl,
      dialogTitle: `Login විස්තර Share කරන්න (${user.monkName || user.name})`,
    });
  };

  const handleDirectWhatsAppShare = (user: User) => {
    const loginUrl = getPublicShareUrl();
    const text = `🪷 ශ්‍රී සුමන මහා පිරිවෙන - ERP පිවිසුම් ගිණුම\n👤 නම: ${user.monkName || user.name}\n🆔 User ID: ${user.customId}\n📧 Email: ${user.email || 'N/A'}\n🌐 Login: ${loginUrl}`;
    const phone = user.phone || user.guardianPhone || (user as any).whatsappNumber;
    shareToWhatsApp(text, phone);
  };

  // Pre-compute student counts per class in O(N) single pass instead of O(N*M) inner loops
  const classCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const sClassId = s.classId || (s as any).pirivenaClass;
      if (sClassId) {
        map.set(sClassId, (map.get(sClassId) || 0) + 1);
      }
    }
    return map;
  }, [students]);

  // Filtered Students: Filtered ONLY by selected class
  const filteredStudents = useMemo(() => {
    if (classFilter === 'all') return students;
    return students.filter((s) => {
      const sClassId = s.classId || (s as any).pirivenaClass;
      return sClassId === classFilter;
    });
  }, [students, classFilter]);

  // Filtered Teachers: Clean, unfiltered full list
  const filteredTeachers = teachers;

  const currentList = activeSegment === 'students' ? filteredStudents : filteredTeachers;

  return (
    <div className="space-y-3 pb-12 animate-fade-in">
      {/* 1. TOP TOOLBAR: SWITCHER + ADD BUTTON (Responsive under all font scales) */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Segmented Switch */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-stone-800 rounded-xl text-xs font-black gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveSegment('students');
              setClassFilter('all');
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              activeSegment === 'students'
                ? 'bg-blue-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="text-sm">🎓</span>
            <span>{language === 'si' ? 'ශිෂ්‍ය සාමාජිකයන්' : 'Students'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeSegment === 'students'
                  ? 'bg-white/25 text-white font-bold'
                  : 'bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment('teachers')}
            className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
              activeSegment === 'teachers'
                ? 'bg-emerald-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="text-sm">👨‍🏫</span>
            <span>{language === 'si' ? 'ගුරු මණ්ඩලය' : 'Teachers'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeSegment === 'teachers'
                  ? 'bg-white/25 text-white font-bold'
                  : 'bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {teachers.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeSegment === 'students') {
              onOpenNewStudent();
            } else if (onOpenNewTeacher) {
              onOpenNewTeacher();
            }
          }}
          className={`w-full sm:w-auto px-4 py-2.5 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer active:scale-95 shrink-0 min-h-[42px] text-white group ${
            activeSegment === 'students'
              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[3] shrink-0 group-hover:rotate-90 transition-transform" />
          <span>
            {activeSegment === 'students'
              ? language === 'si' ? '+ නව ශිෂ්‍යයෙකු ඇතුළත් කරන්න' : '+ Enroll Student'
              : language === 'si' ? '+ නව ආචාර්යවරයෙකු එක් කරන්න' : '+ Add Teacher'}
          </span>
        </button>
      </div>

      {activeSegment === 'students' && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-2 sm:p-2.5 shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setClassFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition cursor-pointer active:scale-95 ${
              classFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-stone-700'
            }`}
          >
            🏛️ සියලු පන්ති ({students.length})
          </button>
          {classes.map((c) => {
            const isSelected = classFilter === c.id;
            const countInClass = classCountMap.get(c.id) || 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setClassFilter(c.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-stone-700'
                }`}
              >
                <span>{c.nameSinhala || c.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9.5px] ${
                    isSelected
                      ? 'bg-white/25 text-white font-black'
                      : 'bg-white dark:bg-stone-700 text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {countInClass}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-2.5">
        {currentList.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-3xl bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 space-y-2 shadow-xs">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-stone-800 flex items-center justify-center text-lg">
              🔍
            </div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'si' ? 'මෙම පන්තියේ කිසිදු ශිෂ්‍යයෙකු හමු නොවීය.' : 'No members found in this class.'}
            </p>
            <button
              onClick={() => setClassFilter('all')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              සියලු ශිෂ්‍යයන් පෙන්වන්න
            </button>
          </div>
        ) : (
          currentList.map((user) => {
            const isTeacher = user.role === 'teacher' || activeSegment === 'teachers';
            const isMonk = user.monkStatus === 'monk' || user.monkStatus === 'upasampada';

            const assignedClass = classes.find(
              (c) =>
                c.id === user.classId ||
                c.id === (user as any).pirivenaClass ||
                c.code === user.classId
            );

            const teacherClassesInCharge = classes.filter(
              (c) => c.teacherInChargeId === user.id || (user.classesAssigned && user.classesAssigned.includes(c.id))
            );
            const teacherAllClasses = classes.filter(
              (c) =>
                c.teacherInChargeId === user.id ||
                (user.classesAssigned && user.classesAssigned.includes(c.id)) ||
                (user.teacherAssignments && user.teacherAssignments.some((ta) => ta.classId === c.id))
            );
            const teacherSubjectsTaught = subjects.filter(
              (s) =>
                (user.subjectsTaught && (user.subjectsTaught.includes(s.id) || user.subjectsTaught.includes(s.name) || user.subjectsTaught.includes(s.nameSinhala))) ||
                (user.teacherAssignments && user.teacherAssignments.some((ta) => ta.subjectId === s.id))
            );

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-stone-900 hover:bg-slate-50/80 dark:hover:bg-stone-850/80 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs transition-all duration-200 flex flex-col gap-2.5 relative"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-2xs border ${
                          isMonk
                            ? 'bg-gradient-to-tr from-amber-500/20 via-amber-100/40 to-amber-50 dark:from-amber-950/50 dark:to-stone-800 border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-300'
                            : 'bg-gradient-to-tr from-blue-500/20 via-blue-100/40 to-blue-50 dark:from-blue-950/50 dark:to-stone-800 border-blue-300 dark:border-blue-700/80 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        {user.avatar ? (
                          <img
                            src={getImageUrl(user.avatar)}
                            alt={user.name}
                            onError={handleAvatarError}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">{isMonk ? '🪷' : isTeacher ? '👨‍🏫' : '🎓'}</span>
                        )}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-stone-900 ${
                          user.status === 'active' ? 'bg-emerald-500 shadow-xs' : 'bg-slate-400'
                        }`}
                      />
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border shadow-2xs ${
                            isMonk
                              ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                              : isTeacher
                              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                              : 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                          }`}
                        >
                          {isMonk ? '🪷 සාමණේර' : isTeacher ? '👨‍🏫 ආචාර්ය' : '👤 ගිහි'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopy(user.customId, `id-${user.id}`)}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-[9.5px] font-mono font-bold flex items-center gap-1 transition cursor-pointer border border-slate-200 dark:border-stone-700 shadow-2xs active:scale-95"
                          title="Copy ID"
                        >
                          <span>{user.customId || 'NO-ID'}</span>
                          {copiedKey === `id-${user.id}` ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600 font-bold" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-60" />
                          )}
                        </button>
                      </div>

                      <h3 className="font-serif font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate leading-tight">
                        {user.monkName || user.name}
                      </h3>

                      {isMonk && user.name && user.name !== user.monkName && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          ගිහි නම: {user.name}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                        {!isTeacher && assignedClass && (
                          <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-stone-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-stone-700 text-[9.5px]">
                            <School className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 animate-icon-pulse-glow" />
                            <span>{assignedClass.nameSinhala || assignedClass.name}</span>
                          </span>
                        )}

                        {isTeacher && (
                          <>
                            {teacherClassesInCharge.length > 0 ? (
                              teacherClassesInCharge.map((cls) => (
                                <span
                                  key={cls.id}
                                  className="inline-flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-[9.5px]"
                                >
                                  <School className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 animate-icon-pulse-glow" />
                                  <span>පන්තිභාර: {cls.nameSinhala || cls.name}</span>
                                </span>
                              ))
                            ) : teacherAllClasses.length > 0 ? (
                              teacherAllClasses.map((cls) => (
                                <span
                                  key={cls.id}
                                  className="inline-flex items-center gap-1 font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 text-[9.5px]"
                                >
                                  <School className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400 animate-icon-pulse-glow" />
                                  <span>{cls.nameSinhala || cls.name}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[9.5px] text-slate-400 italic">
                                පන්ති අනුයුක්ත කර නැත
                              </span>
                            )}

                            {teacherSubjectsTaught.slice(0, 2).map((sub) => (
                              <span
                                key={sub.id}
                                className="inline-flex items-center gap-1 font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800 text-[9.5px]"
                              >
                                <BookOpen className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400 animate-icon-float" />
                                <span>{sub.nameSinhala || sub.name}</span>
                              </span>
                            ))}
                            {teacherSubjectsTaught.length > 2 && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-stone-800 px-1 py-0.5 rounded">
                                +{teacherSubjectsTaught.length - 2}
                              </span>
                            )}
                          </>
                        )}
                        {user.phone && (
                          <span className="flex items-center gap-1 font-mono text-[9.5px] text-slate-600 dark:text-slate-300">
                            <Phone className="w-2.5 h-2.5 text-slate-400" />
                            <span>{user.phone}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-stone-800 w-full sm:w-auto justify-end">
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => setSelectedTimetableTeacher(user)}
                        className="p-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 transition cursor-pointer active:scale-90 shadow-2xs group"
                        title="ගුරු පෞද්ගලික කාලසටහන (Timetable)"
                      >
                        <Calendar className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectStudentQr(user)}
                      className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition cursor-pointer active:scale-90 shadow-2xs group"
                      title="QR හැඳුනුම්පත"
                    >
                      <QrCode className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    </button>

                    {!isTeacher && onSelectStudentReportCard && (
                      <button
                        type="button"
                        onClick={() => onSelectStudentReportCard(user)}
                        className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition cursor-pointer active:scale-90 shadow-2xs group"
                        title="ලකුණු වාර්තා පොත (Term Marksheet)"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (activeSegment === 'students') {
                          onOpenEditStudent(user);
                        } else if (onOpenEditTeacher) {
                          onOpenEditTeacher(user);
                        }
                      }}
                      className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-500/30 transition cursor-pointer active:scale-90 shadow-2xs group"
                      title="සංස්කරණය (Edit)"
                    >
                      <Edit className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteUser(user.id)}
                      className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition cursor-pointer active:scale-90 shadow-2xs"
                      title="මකන්න (Delete)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 🔑 CREDENTIALS & QUICK ACCESS TRAY (Compact Single-Row Strip) */}
                <div className="pt-2 border-t border-slate-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-1.5 bg-slate-50/90 dark:bg-stone-800/60 p-2 rounded-xl border border-slate-200/70 dark:border-stone-700/70 min-w-0 max-w-full overflow-hidden">
                  {/* Email & Password */}
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0 max-w-full">
                    {/* User ID / Email */}
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-stone-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-stone-700 shadow-2xs min-w-0 max-w-full">
                      <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">{user.email || user.customId}</span>
                    </span>

                    {/* Password Status / Reset Action */}
                    <button
                      type="button"
                      onClick={() => onOpenEditStudent(user)}
                      className="flex items-center gap-1.5 px-2 py-0.5 bg-white dark:bg-stone-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg border border-slate-200 dark:border-stone-700 text-[10px] font-mono shadow-2xs shrink-0 transition text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer active:scale-95"
                      title="මුරපදය වෙනස් කරන්න (Reset/Change Password)"
                    >
                      <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="font-bold tracking-widest text-slate-400">••••••••</span>
                      <span className="text-[9px] font-sans font-semibold text-amber-700 dark:text-amber-400">වෙනස් කරන්න</span>
                    </button>
                  </div>

                  {/* Actions: Share Credentials & Details Tray */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleShareCredentials(user)}
                      className="px-2.5 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[9.5px] flex items-center gap-1 transition cursor-pointer active:scale-95 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs"
                      title="Share Login Credentials (WhatsApp / Social Media / SMS)"
                    >
                      <Share2 className="w-2.5 h-2.5 text-blue-500" />
                      <span>{copiedKey === `share-${user.id}` ? '✓ Copied / Shared' : 'Share විස්තර'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCardExpand(user.id)}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-stone-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-[9.5px] flex items-center gap-0.5 transition cursor-pointer active:scale-95 border border-slate-200 dark:border-stone-700 shadow-2xs"
                    >
                      <span>{expandedCardMap[user.id] ? 'අඩු විස්තර' : 'වැඩි විස්තර'}</span>
                      {expandedCardMap[user.id] ? (
                        <ChevronUp className="w-2.5 h-2.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 📋 EXPANDABLE FULL DETAILS TRAY (Compact) */}
                {expandedCardMap[user.id] && (
                  <div className="pt-2 border-t border-dashed border-slate-200 dark:border-stone-700/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[10px] animate-fadeIn">
                    {/* Temple Name */}
                    <div className="p-2 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                      <span className="text-[9px] font-black text-amber-900 dark:text-amber-300 block mb-0.5">
                        🛕 වැඩවසන විහාරස්ථානය:
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {user.templeName || 'ශ්‍රී සුමන මහා පිරිවෙන'}
                      </p>
                    </div>

                    {/* Guardian / Incumbent */}
                    <div className="p-2 bg-slate-50 dark:bg-stone-800/80 rounded-xl border border-slate-200/60 dark:border-stone-700">
                      <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 block mb-0.5">
                        👨‍👦 {isTeacher ? 'හදිසි ඇමතුම් / භාරකරු:' : 'භාරකරු / විහාරාධිපති හිමි:'}
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {user.guardianName || 'තොරතුරු ඇතුළත් කර නැත'} {user.guardianPhone ? `(${user.guardianPhone})` : ''}
                      </p>
                    </div>

                    {/* Address */}
                    <div className="p-2 bg-slate-50 dark:bg-stone-800/80 rounded-xl border border-slate-200/60 dark:border-stone-700">
                      <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 block mb-0.5">
                        📍 ලිපිනය:
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {user.guardianAddress || user.address || 'ලිපිනය ඇතුළත් කර නැත'}
                      </p>
                    </div>

                    {/* NIC / Birth Certificate */}
                    <div className="p-2 bg-slate-50 dark:bg-stone-800/80 rounded-xl border border-slate-200/60 dark:border-stone-700">
                      <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 block mb-0.5">
                        🪪 ජා.හැ. / උප්පැන්න අංකය:
                      </span>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {user.nicOrBirthCert || 'ඇතුළත් කර නැත'}
                      </p>
                    </div>

                    {/* Academic Year / Category */}
                    <div className="p-2 bg-slate-50 dark:bg-stone-800/80 rounded-xl border border-slate-200/60 dark:border-stone-700">
                      <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 block mb-0.5">
                        📅 {isTeacher ? 'උගන්වන අංශ / විෂයයන්:' : 'අධ්‍යයන වර්ෂය & අංශය:'}
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {isTeacher
                          ? (user.categoriesTaught?.join(', ') || user.qualification || 'පිරිවෙන් ආචාර්ය')
                          : `${user.academicYear || '2026'} • ${user.educationCategory || 'පිරිවෙන් අංශය'}`}
                      </p>
                    </div>

                    {/* Quick Direct Actions in Tray */}
                    <div className="col-span-full pt-1 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleDirectWhatsAppShare(user)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                      >
                        <span>💬 WhatsApp යවන්න</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareCredentials(user)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Social Apps වෙත Share</span>
                      </button>
                    </div>

                    {/* Status & Account Info */}
                    <div className="p-2 bg-slate-50 dark:bg-stone-800/80 rounded-xl border border-slate-200/60 dark:border-stone-700">
                      <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 block mb-0.5">
                        ⚡ ගිණුම් තත්ත්වය:
                      </span>
                      <span className={`inline-flex items-center gap-1 font-bold text-[9.5px] ${
                        user.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {user.status === 'active' ? 'සක්‍රීය (Active)' : 'අක්‍රීය (Inactive)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Teacher Timetable Modal */}
      {selectedTimetableTeacher && (
        <TeacherTimetableModal
          isOpen={!!selectedTimetableTeacher}
          onClose={() => setSelectedTimetableTeacher(null)}
          teacher={selectedTimetableTeacher}
          classes={classes}
          subjects={subjects}
        />
      )}
    </div>
  );
});

