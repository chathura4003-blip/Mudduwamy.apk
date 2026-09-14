import React, { useState, useEffect, useMemo, useRef, startTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import type { Exam, StudyMaterial, PirivenaClass, Subject, User, LibraryBook, ClassTimetableSlot } from '../types';
import { useStudentPortalData } from '../hooks/useStudentPortalData';
import { OnlineExamView } from './OnlineExamView';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';
import { PageLoadingSpinner } from '../components/PageLoadingSpinner';
import { openPdfInBlobTab, getPdfObjectUrl, openInAppFileViewer } from '../utils/pdfHelper';
import { resolveSubjectSinhalaName } from '../utils/subjectHelper';
import { useToast } from '../context/ToastContext';
import { triggerHaptic } from '../utils/haptics';
import { copyToClipboard } from '../utils/clipboardHelper';
import { playNotificationSound } from '../utils/soundHelper';
import { notificationService } from '../services/notificationService';
import { navigationHistoryManager } from '../services/navigationHistoryManager';
import { getSriLankaDate, getSriLankaDateString, getSriLankaMinutesOfDay, getSriLankaDayKey, formatSriLankaDateTime, formatSriLankaTime } from '../utils/sriLankaTime';
import { libraryApi } from '../api';
import {
  FileText,
  BookOpen,
  FileCode,
  Music,
  Video,
  Image as ImageIcon,
} from 'lucide-react';

// Eager Overview Tab for Instant 0ms First-Paint
import { OverviewTab } from './StudentPortal/tabs/OverviewTab';

// Dynamic Lazy Loaders for Secondary Tabs
const MaterialsTab = React.lazy(() => import('./StudentPortal/tabs/MaterialsTab').then((m) => ({ default: m.MaterialsTab })));
const ExamsTab = React.lazy(() => import('./StudentPortal/tabs/ExamsTab').then((m) => ({ default: m.ExamsTab })));
const LibraryTab = React.lazy(() => import('./StudentPortal/tabs/LibraryTab').then((m) => ({ default: m.LibraryTab })));
const TimetableTab = React.lazy(() => import('./StudentPortal/tabs/TimetableTab').then((m) => ({ default: m.TimetableTab })));
const SettingsTab = React.lazy(() => import('./StudentPortal/tabs/SettingsTab').then((m) => ({ default: m.SettingsTab })));

// Dynamic Lazy Loaders for Heavy Student Modals
const SubmissionReviewModal = React.lazy(() => import('./StudentPortal/components/SubmissionReviewModal').then((m) => ({ default: m.SubmissionReviewModal })));
const MaterialViewerModal = React.lazy(() => import('./StudentPortal/components/MaterialViewerModal').then((m) => ({ default: m.MaterialViewerModal })));
const BookReaderModal = React.lazy(() => import('./StudentPortal/components/BookReaderModal').then((m) => ({ default: m.BookReaderModal })));

interface StudentPortalProps {
  onOpenQrModal: () => void;
  onOpenCertModal: () => void;
  onOpenReportCardModal?: () => void;
}

type StudentPortalTab =
  | 'overview'
  | 'materials'
  | 'exams'
  | 'results'
  | 'library'
  | 'timetable'
  | 'settings';

export const StudentPortal: React.FC<StudentPortalProps> = ({
  onOpenQrModal,
  onOpenCertModal,
  onOpenReportCardModal,
}) => {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const isSi = language === 'si';
  const toast = useToast();

  // Navigation tab state
  const [activePortalTab, setActivePortalTab] = useState<StudentPortalTab>(() => {
    try {
      const saved = sessionStorage.getItem('pirivena_student_tab');
      if (saved === 'dashboard' || saved === 'overview') return 'overview';
      if (saved === 'materials') return 'materials';
      if (saved === 'exams') return 'exams';
      if (saved === 'results') return 'results';
      if (saved === 'library') return 'library';
      if (saved === 'timetable') return 'timetable';
      if (saved === 'settings') return 'settings';
      return 'overview';
    } catch (e) {
      return 'overview';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('pirivena_student_tab', activePortalTab);
      localStorage.removeItem('pirivena_student_tab');
    } catch (e) { }
    navigationHistoryManager.recordTabNavigation(activePortalTab);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      document.body.style.pointerEvents = '';
    }
  }, [activePortalTab]);

  const switchSubTab = (tab: StudentPortalTab) => {
    triggerHaptic('light');
    navigationHistoryManager.recordTabNavigation(tab);
    startTransition(() => {
      setActivePortalTab(tab);
    });
    window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: tab }));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e.detail) {
        const tab = String(e.detail);
        let target: StudentPortalTab | null = null;
        if (tab === 'dashboard' || tab === 'overview') target = 'overview';
        else if (tab === 'materials') target = 'materials';
        else if (tab === 'exams') target = 'exams';
        else if (tab === 'results') target = 'results';
        else if (tab === 'library') target = 'library';
        else if (tab === 'timetable') target = 'timetable';
        else if (tab === 'settings') target = 'settings';

        if (target) {
          startTransition(() => {
            setActivePortalTab((prev) => (prev !== target ? target! : prev));
          });
        }
      }
    };
    window.addEventListener('switch-portal-subtab', handleSwitch);
    return () => window.removeEventListener('switch-portal-subtab', handleSwitch);
  }, []);

  // Materials filter & search state
  const [matSearch, setMatSearch] = useState('');
  const [matTypeFilter, setMatTypeFilter] = useState<string>('all');
  const [matSubjectFilter, setMatSubjectFilter] = useState<string>('all');

  // Library Books State
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState<boolean>(false);
  const [librarySearch, setLibrarySearch] = useState<string>('');
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<string>('all');
  const [viewingLibraryBook, setViewingLibraryBook] = useState<LibraryBook | null>(null);

  // Timetable State
  const [selectedTimetableDay, setSelectedTimetableDay] = useState<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  >('monday');
  const [isWeeklyGridView, setIsWeeklyGridView] = useState<boolean>(false);

  // Scoped Data Fetching Hook
  const {
    exams,
    materials,
    classes,
    subjects,
    teachers,
    completedExamIds,
    completedSubmissions,
    isAuthorized,
    refetch: fetchData,
    setCompletedExamIds,
    setCompletedSubmissions,
  } = useStudentPortalData({
    classId: user?.classId || (user as any)?.pirivenaClass || user?.classLevel || undefined,
    subjectId: matSubjectFilter !== 'all' ? matSubjectFilter : undefined,
  });

  // Fetch Library Books only when student navigates to the Library tab
  useEffect(() => {
    if (activeTab !== 'library') return;
    let isMounted = true;
    const fetchBooks = async () => {
      setIsLibraryLoading(true);
      try {
        const books = await libraryApi.getLibraryItems();
        if (isMounted) setLibraryBooks(Array.isArray(books) ? books : []);
      } catch (err) {
        if (isMounted) setLibraryBooks([]);
      } finally {
        if (isMounted) setIsLibraryLoading(false);
      }
    };
    fetchBooks();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const [viewingSubmissionReview, setViewingSubmissionReview] = useState<any | null>(null);

  // Active exam state
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [lastExamResult, setLastExamResult] = useState<any>(null);

  // Viewing material modal
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);
  const [decodedTextNote, setDecodedTextNote] = useState<string | null>(null);
  const [copiedNote, setCopiedNote] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);

  const handleOpenMaterialViewer = (material: StudyMaterial) => {
    triggerHaptic('light');
    if (
      material.type === 'pdf' ||
      (material.fileUrl && (material.fileUrl.endsWith('.pdf') || material.fileUrl.includes('.pdf')))
    ) {
      const cleanSubj = resolveSubjectSinhalaName(material.subjectId || (material as any).subject);
      openInAppFileViewer({
        url: material.fileUrl,
        title: material.title,
        subtitle: cleanSubj ? `විෂය: ${cleanSubj}` : undefined,
        fileType: 'pdf',
        downloadFileName: material.fileName || `${material.title}.pdf`,
      });
      return;
    }
    setViewingMaterial(material);
    if (material.type === 'notes' || material.fileUrl?.startsWith('data:text/')) {
      if (material.fileUrl?.startsWith('data:text/')) {
        try {
          const parts = material.fileUrl.split(',');
          setDecodedTextNote(decodeURIComponent(escape(atob(parts[1] || ''))));
        } catch {
          setDecodedTextNote(material.description || '');
        }
      } else {
        setDecodedTextNote(material.description || '');
      }
    } else {
      setDecodedTextNote(null);
    }
  };

  // Connect modals & active exam view with Android back button stack
  useEffect(() => {
    if (activeExam) {
      navigationHistoryManager.pushModal(
        'active_exam',
        () => {
          // Dispatch confirmation event to OnlineExamView instead of abruptly discarding progress
          window.dispatchEvent(new CustomEvent('request-exam-exit-confirm'));
        },
        45
      );
    } else {
      navigationHistoryManager.removeModal('active_exam');
    }
    return () => navigationHistoryManager.removeModal('active_exam');
  }, [activeExam]);

  useEffect(() => {
    if (viewingSubmissionReview) {
      navigationHistoryManager.pushModal('submission_review', () => setViewingSubmissionReview(null), 35);
    } else {
      navigationHistoryManager.removeModal('submission_review');
    }
    return () => navigationHistoryManager.removeModal('submission_review');
  }, [viewingSubmissionReview]);

  useEffect(() => {
    if (viewingMaterial) {
      navigationHistoryManager.pushModal('viewing_material', () => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setViewingMaterial(null);
      }, 35);
    } else {
      navigationHistoryManager.removeModal('viewing_material');
    }
    return () => navigationHistoryManager.removeModal('viewing_material');
  }, [viewingMaterial]);

  useEffect(() => {
    if (viewingLibraryBook) {
      navigationHistoryManager.pushModal('viewing_library_book', () => setViewingLibraryBook(null), 35);
    } else {
      navigationHistoryManager.removeModal('viewing_library_book');
    }
    return () => navigationHistoryManager.removeModal('viewing_library_book');
  }, [viewingLibraryBook]);

  const isImageResource = (fileUrl?: string, fileName?: string): boolean => {
    if (!fileUrl) return false;
    if (fileUrl.startsWith('data:image/')) return true;
    const lowerUrl = fileUrl.toLowerCase();
    const lowerName = (fileName || '').toLowerCase();
    const imgRegex = /\.(jpeg|jpg|jpe|png|webp|gif|bmp|svg)($|\?)/i;
    return imgRegex.test(lowerUrl) || imgRegex.test(lowerName);
  };

  const isExamCompleted = (examId: string) => {
    if (!examId) return false;
    if (completedExamIds.includes(examId)) return true;
    if (completedSubmissions.some((s: any) => s.examId === examId)) return true;
    return false;
  };

  const isCorrectAnswerMatch = (studentAns: any, correctAns: any, q?: any): boolean => {
    if (studentAns === undefined || studentAns === null || studentAns === '') return false;
    if (correctAns === undefined || correctAns === null || correctAns === '') return false;

    if (q?.type === 'true_false') {
      const norm = (v: any) => {
        const s = String(v).trim().toLowerCase();
        if (s === 'true' || s === 't' || s === '1' || s.includes('සත්‍ය')) return 'true';
        if (s === 'false' || s === 'f' || s === '0' || s.includes('අසත්‍ය')) return 'false';
        return s;
      };
      return norm(studentAns) === norm(correctAns);
    }

    if (q?.type === 'mcq') {
      let sIdx: number | null = null;
      if (typeof studentAns === 'number' && !isNaN(studentAns)) {
        sIdx = studentAns;
      } else {
        const uStr = String(studentAns).trim().toLowerCase();
        const uNum = Number(uStr);
        if (!isNaN(uNum) && uNum >= 0 && q.options && uNum < q.options.length) {
          sIdx = uNum;
        } else if (uStr === 'a') sIdx = 0;
        else if (uStr === 'b') sIdx = 1;
        else if (uStr === 'c') sIdx = 2;
        else if (uStr === 'd') sIdx = 3;
        else if (Array.isArray(q.options)) {
          const matched = q.options.findIndex((o: string) => String(o).trim().toLowerCase() === uStr);
          if (matched !== -1) sIdx = matched;
        }
      }

      let cIdx: number | null = null;
      if (typeof correctAns === 'number' && !isNaN(correctAns)) {
        cIdx = correctAns;
      } else {
        const cStr = String(correctAns).trim().toLowerCase();
        const cNum = Number(cStr);
        if (!isNaN(cNum) && cNum >= 0 && q.options && cNum < q.options.length) {
          cIdx = cNum;
        } else if (cStr === 'a' || cStr === 'opt a' || cStr === 'option a') cIdx = 0;
        else if (cStr === 'b' || cStr === 'opt b' || cStr === 'option b') cIdx = 1;
        else if (cStr === 'c' || cStr === 'opt c' || cStr === 'option c') cIdx = 2;
        else if (cStr === 'd' || cStr === 'opt d' || cStr === 'option d') cIdx = 3;
        else if (Array.isArray(q.options)) {
          const matched = q.options.findIndex((o: string) => String(o).trim().toLowerCase() === cStr);
          if (matched !== -1) cIdx = matched;
        }
      }

      if (sIdx !== null && cIdx !== null) {
        return sIdx === cIdx;
      }
    }

    const sStr = String(studentAns).trim().toLowerCase();
    const cStr = String(correctAns).trim().toLowerCase();
    if (sStr === cStr) return true;

    const accepted = cStr.split(/[,/|]/).map((a) => a.trim()).filter(Boolean);
    return accepted.includes(sStr);
  };

  const resolveStudentAnswer = (answersObj: any, q: any, qIdx: number) => {
    if (!answersObj) return undefined;
    let parsedAns = answersObj;
    if (typeof answersObj === 'string') {
      try {
        parsedAns = JSON.parse(answersObj);
      } catch (e) {
        parsedAns = {};
      }
    }
    if (typeof parsedAns !== 'object' || parsedAns === null) return undefined;

    const candidates = [
      q.id,
      String(q.id),
      qIdx,
      String(qIdx),
      `q-${qIdx}`,
      `q-${q.id}`,
      q.text,
      q.question,
    ];

    for (const key of candidates) {
      if (key !== undefined && key !== null && parsedAns[key] !== undefined) {
        return parsedAns[key];
      }
    }

    return undefined;
  };

  const handleFinishExam = (result: any) => {
    const finishedExamId = result?.submission?.examId || result?.examId || activeExam?.id;

    if (finishedExamId) {
      setCompletedExamIds((prev) => Array.from(new Set([...prev, finishedExamId])));

      if (result && result.submission) {
        setCompletedSubmissions((prev) => [
          result.submission,
          ...prev.filter((s) => s.examId !== finishedExamId),
        ]);
      }
    }

    setActiveExam(null);
    setLastExamResult(result?.submission || result);
  };

  const studentClass = useMemo(() => {
    if (!user) return null;
    const targetClassStr =
      user.classId || (user as any).pirivenaClass || user.classLevel || user.educationCategory;

    if (targetClassStr) {
      const directMatch = classes.find(
        (c) =>
          c.id === targetClassStr ||
          c.code === targetClassStr ||
          c.name === targetClassStr ||
          c.nameSinhala === targetClassStr ||
          (c as any).className === targetClassStr ||
          (c as any).classNameSinhala === targetClassStr
      );
      if (directMatch) return directMatch;

      const partialMatch = classes.find(
        (c) =>
          (c.name && c.name.toLowerCase().includes(targetClassStr.toLowerCase())) ||
          (c.nameSinhala && c.nameSinhala.toLowerCase().includes(targetClassStr.toLowerCase())) ||
          (targetClassStr &&
            c.nameSinhala &&
            targetClassStr.toLowerCase().includes(c.nameSinhala.toLowerCase())) ||
          (targetClassStr &&
            c.name &&
            targetClassStr.toLowerCase().includes(c.name.toLowerCase())) ||
          (c.gradeLevel && targetClassStr.toLowerCase().includes(c.gradeLevel.toLowerCase())) ||
          (c.category && targetClassStr.toLowerCase().includes(c.category.toLowerCase())) ||
          (c.code && targetClassStr.toLowerCase().includes(c.code.toLowerCase()))
      );
      if (partialMatch) return partialMatch;
    }

    if (user.educationCategory && user.classLevel) {
      const catLevelMatch = classes.find(
        (c) =>
          (c.category === user.educationCategory ||
            (!c.category && user.educationCategory === 'Pracheena')) &&
          (c.levelName === user.classLevel ||
            c.gradeLevel === user.classLevel ||
            c.name === user.classLevel)
      );
      if (catLevelMatch) return catLevelMatch;
    }

    if (user.classLevel) {
      const levelMatch = classes.find(
        (c) =>
          c.levelName === user.classLevel ||
          c.gradeLevel === user.classLevel ||
          c.name === user.classLevel ||
          c.id === user.classLevel
      );
      if (levelMatch) return levelMatch;
    }

    return null;
  }, [classes, user]);

  const availableStudentSubjects = useMemo(() => {
    const rawClassSubjs: any = studentClass?.subjects || [];
    let parsedClassSubjs: any[] = [];
    if (typeof rawClassSubjs === 'string') {
      try {
        parsedClassSubjs = JSON.parse(rawClassSubjs);
      } catch {
        parsedClassSubjs = (rawClassSubjs as string).split(',');
      }
    } else if (Array.isArray(rawClassSubjs)) {
      parsedClassSubjs = rawClassSubjs;
    }
    const classSubjs = parsedClassSubjs.map((x) => String(x).trim()).filter(Boolean);
    const classSubjSet = new Set(classSubjs);

    const rawExplicit =
      user?.subjectsAssigned && user.subjectsAssigned.length > 0
        ? user.subjectsAssigned
        : (user as any)?.studentSubjects && (user as any).studentSubjects.length > 0
        ? (user as any).studentSubjects.map((s: any) => s.subjectId || s)
        : [];
    const explicitSubjs = Array.isArray(rawExplicit)
      ? rawExplicit.map((x: any) => String(x).trim()).filter(Boolean)
      : [];
    const explicitSet = new Set(explicitSubjs);

    const combinedKeys = new Set([...classSubjSet, ...explicitSet]);

    if (combinedKeys.size > 0) {
      const matched = subjects.filter((s) => {
        const sKeys = [
          s.id,
          s.code,
          s.name,
          s.nameSinhala,
          (s as any).subjectName,
          (s as any).subjectNameSinhala,
        ]
          .filter(Boolean)
          .map((k) => String(k).trim());
        return sKeys.some((k) => combinedKeys.has(k));
      });
      if (matched.length > 0) return matched;
    }

    if (!studentClass || classSubjs.length === 0) {
      return subjects;
    }
    return subjects.filter((s) => {
      const sKeys = [
        s.id,
        s.code,
        s.name,
        s.nameSinhala,
        (s as any).subjectName,
        (s as any).subjectNameSinhala,
      ]
        .filter(Boolean)
        .map((k) => String(k).trim());
      return sKeys.some((k) => classSubjSet.has(k));
    });
  }, [subjects, studentClass, user]);

  const availableStudentExams = useMemo(() => {
    const studentClassKeys = new Set(
      [
        user?.classId,
        (user as any)?.pirivenaClass,
        user?.classLevel,
        user?.educationCategory,
        studentClass?.id,
        studentClass?.code,
        studentClass?.name,
        studentClass?.nameSinhala,
        studentClass?.levelName,
        studentClass?.gradeLevel,
        (studentClass as any)?.className,
        (studentClass as any)?.classNameSinhala,
      ]
        .filter(Boolean)
        .map((k) => String(k).trim().toLowerCase())
    );

    const authorizedSubjectKeys = new Set(
      availableStudentSubjects.flatMap((s) =>
        [s.id, s.code, s.name, s.nameSinhala, (s as any).subjectName, (s as any).subjectNameSinhala]
          .filter(Boolean)
          .map((k) => String(k).trim().toLowerCase())
      )
    );

    return exams.filter((e) => {
      const isPub =
        e.published === true ||
        (e as any).published === 1 ||
        (e as any).published === '1' ||
        e.status === 'published' ||
        e.status === 'active' ||
        (e.published === undefined && e.status !== 'draft');
      if (!isPub) return false;

      const rawClass = String(e.classId || (e as any).gradeClass || '').trim();
      const lowerClass = rawClass.toLowerCase();

      let matchesClass = false;
      if (!rawClass || lowerClass === 'all' || lowerClass === 'all classes' || lowerClass.includes('සියලු')) {
        matchesClass = true;
      } else if (studentClassKeys.size > 0) {
        matchesClass = studentClassKeys.has(lowerClass);
        if (!matchesClass) {
          for (const key of studentClassKeys) {
            if (key && (lowerClass.includes(key) || key.includes(lowerClass))) {
              matchesClass = true;
              break;
            }
          }
        }
      } else {
        matchesClass = true;
      }

      const rawSubj = String(e.subjectId || (e as any).subject || '').trim();
      const lowerSubj = rawSubj.toLowerCase();

      let matchesSubject = false;
      if (
        !rawSubj ||
        lowerSubj === 'all' ||
        lowerSubj === 'all subjects' ||
        lowerSubj === 'general' ||
        lowerSubj.includes('සියලු') ||
        lowerSubj.includes('පොදු')
      ) {
        matchesSubject = true;
      } else if (authorizedSubjectKeys.size > 0) {
        matchesSubject = authorizedSubjectKeys.has(lowerSubj);
        if (!matchesSubject) {
          for (const key of authorizedSubjectKeys) {
            if (key && (lowerSubj.includes(key) || key.includes(lowerSubj))) {
              matchesSubject = true;
              break;
            }
          }
        }
      } else {
        matchesSubject = true;
      }

      return matchesClass && matchesSubject;
    });
  }, [exams, studentClass, user, availableStudentSubjects]);

  const filteredMaterials = useMemo(() => {
    const studentClassKeys = new Set(
      [
        user?.classId,
        (user as any)?.pirivenaClass,
        user?.classLevel,
        user?.educationCategory,
        studentClass?.id,
        studentClass?.code,
        studentClass?.name,
        studentClass?.nameSinhala,
        studentClass?.levelName,
        studentClass?.gradeLevel,
        (studentClass as any)?.className,
        (studentClass as any)?.classNameSinhala,
      ]
        .filter(Boolean)
        .map((k) => String(k).trim().toLowerCase())
    );

    return materials.filter((m) => {
      const rawClass = String(m.classId || (m as any).gradeClass || '').trim();
      const lowerClass = rawClass.toLowerCase();

      let matchesClass = false;
      if (!rawClass || lowerClass === 'all' || lowerClass === 'all classes' || lowerClass.includes('සියලු')) {
        matchesClass = true;
      } else if (studentClassKeys.size > 0) {
        matchesClass = studentClassKeys.has(lowerClass);
        if (!matchesClass) {
          for (const key of studentClassKeys) {
            if (key && (lowerClass.includes(key) || key.includes(lowerClass))) {
              matchesClass = true;
              break;
            }
          }
        }
      } else {
        matchesClass = true;
      }

      if (!matchesClass) return false;

      const term = matSearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        m.title.toLowerCase().includes(term) ||
        (m.titleSinhala && m.titleSinhala.toLowerCase().includes(term)) ||
        (m.description && m.description.toLowerCase().includes(term)) ||
        (m.fileName && m.fileName.toLowerCase().includes(term));

      const matchesType = matTypeFilter === 'all' || m.type === matTypeFilter;

      let matchesSubject = true;
      if (matSubjectFilter !== 'all') {
        const selectedSubjObj = subjects.find(
          (s) => s.id === matSubjectFilter || s.code === matSubjectFilter || s.name === matSubjectFilter
        );
        const matSubjObj = subjects.find(
          (s) => s.id === m.subjectId || s.code === m.subjectId || s.name === m.subjectId
        );

        matchesSubject =
          m.subjectId === matSubjectFilter ||
          m.subjectId === 'all' ||
          m.subjectId === 'ALL' ||
          !m.subjectId ||
          (selectedSubjObj && matSubjObj && selectedSubjObj.id === matSubjObj.id) ||
          (selectedSubjObj &&
            (m.subjectId === selectedSubjObj.code || m.subjectId === selectedSubjObj.name));
      }

      return matchesClass && matchesSearch && matchesType && matchesSubject;
    });
  }, [materials, user, studentClass, subjects, matSearch, matTypeFilter, matSubjectFilter]);

  // Filtered Library Books
  const filteredLibraryBooks = useMemo(() => {
    return libraryBooks.filter((book) => {
      const term = librarySearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        book.title.toLowerCase().includes(term) ||
        (book.titleSinhala && book.titleSinhala.toLowerCase().includes(term)) ||
        (book.author && book.author.toLowerCase().includes(term)) ||
        (book.category && book.category.toLowerCase().includes(term));

      const matchesCategory =
        selectedLibraryCategory === 'all' ||
        book.category === selectedLibraryCategory ||
        (selectedLibraryCategory === 'Past Papers' &&
          (book.category === 'Past Papers' || (book as any).paperType));

      return matchesSearch && matchesCategory;
    });
  }, [libraryBooks, librarySearch, selectedLibraryCategory]);

  const libraryCategories = useMemo(() => {
    const defaultCats = [
      'Tripitaka',
      'Pali Grammar',
      'Pracheena',
      'Past Papers',
      'Dhamma',
      'General',
    ];
    const catSet = new Set(defaultCats);
    libraryBooks.forEach((b) => {
      if (b.category && b.category.trim() !== '') catSet.add(b.category.trim());
    });
    return Array.from(catSet);
  }, [libraryBooks]);

  // Timetable Slots for student's class
  const classTimetableSlots = useMemo(() => {
    if (!studentClass) return [] as ClassTimetableSlot[];

    let rawTt: any = studentClass.timetable;
    if (!rawTt) {
      try {
        const cached = localStorage.getItem(`pirivena_timetable_${studentClass.id}`);
        if (cached) rawTt = JSON.parse(cached);
      } catch (e) { }
    }

    if (typeof rawTt === 'string') {
      try {
        rawTt = JSON.parse(rawTt);
      } catch (e) {
        rawTt = [];
      }
    }

    if (Array.isArray(rawTt)) return rawTt as ClassTimetableSlot[];
    return [] as ClassTimetableSlot[];
  }, [studentClass]);

  const DEFAULT_PERIODS_META = [
    { period: 1, startTime: '07:40 AM', endTime: '08:20 AM', startMin: 460, endMin: 500 },
    { period: 2, startTime: '08:20 AM', endTime: '09:00 AM', startMin: 500, endMin: 540 },
    { period: 3, startTime: '09:00 AM', endTime: '09:40 AM', startMin: 540, endMin: 580 },
    { period: 4, startTime: '09:40 AM', endTime: '10:20 AM', startMin: 580, endMin: 620 },
    { period: 5, startTime: '10:20 AM', endTime: '11:00 AM', startMin: 620, endMin: 660 },
    { period: 6, startTime: '11:00 AM', endTime: '11:40 AM', startMin: 660, endMin: 700 },
    { period: 7, startTime: '12:00 PM', endTime: '12:45 PM', startMin: 720, endMin: 765 },
    { period: 8, startTime: '12:45 PM', endTime: '01:30 PM', startMin: 765, endMin: 810 },
  ];

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentLiveTimeStr, setCurrentLiveTimeStr] = useState<string>(() =>
    formatSriLankaTime(null, true)
  );
  const [currentSecTick, setCurrentSecTick] = useState<number>(() => Date.now());

  // Live Clock locked to Sri Lanka Standard Time (Asia/Colombo) - updates every 1s (second-by-second)
  useEffect(() => {
    const updateTime = () => {
      setCurrentLiveTimeStr(formatSriLankaTime(null, true));
      setCurrentSecTick(Date.now());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const [currentLivePeriod, setCurrentLivePeriod] = useState<{
    day: string;
    periodNumber?: number;
    isMorningPuja?: boolean;
    isInterval?: boolean;
  }>({ day: 'monday' });

  useEffect(() => {
    const checkLivePeriod = () => {
      const now = getSriLankaDate();
      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const curDay = dayNames[now.getDay()];
      const totalMinutes = now.getHours() * 60 + now.getMinutes();

      const isMorningPuja =
        curDay !== 'sunday' && curDay !== 'saturday' && totalMinutes >= 450 && totalMinutes < 460;
      const isInterval =
        curDay !== 'sunday' && curDay !== 'saturday' && totalMinutes >= 700 && totalMinutes < 720;

      const matchedP = DEFAULT_PERIODS_META.find(
        (p) => totalMinutes >= p.startMin && totalMinutes < p.endMin
      );

      setCurrentLivePeriod((prev) => {
        if (
          prev.day === curDay &&
          prev.periodNumber === matchedP?.period &&
          prev.isMorningPuja === isMorningPuja &&
          prev.isInterval === isInterval
        ) {
          return prev; // Same reference -> NO Re-render!
        }
        return {
          day: curDay,
          periodNumber: matchedP?.period,
          isMorningPuja,
          isInterval,
        };
      });
    };

    checkLivePeriod();
    const interval = setInterval(() => {
      if (!document.hidden) {
        checkLivePeriod();
      }
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const getSubjectIconAndColor = (name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('පාලි') || n.includes('pali')) {
      return {
        icon: '🪷',
        color: 'text-amber-700 dark:text-amber-300',
        bg: 'bg-amber-500/15',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-500/30',
      };
    }
    if (
      n.includes('ධර්ම') ||
      n.includes('ත්‍රිපිටක') ||
      n.includes('dhamma') ||
      n.includes('buddhism') ||
      n.includes('සූත්‍ර') ||
      n.includes('අභිධර්ම')
    ) {
      return {
        icon: '☸',
        color: 'text-amber-800 dark:text-amber-200',
        bg: 'bg-amber-500/20',
        text: 'text-amber-800 dark:text-amber-200',
        border: 'border-amber-500/40',
      };
    }
    if (n.includes('සිංහල') || n.includes('sinhala')) {
      return {
        icon: '✍️',
        color: 'text-rose-700 dark:text-rose-300',
        bg: 'bg-rose-500/15',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/30',
      };
    }
    if (n.includes('සංස්කෘත') || n.includes('sanskrit')) {
      return {
        icon: '📜',
        color: 'text-orange-700 dark:text-orange-300',
        bg: 'bg-orange-500/15',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-500/30',
      };
    }
    if (n.includes('ඉංග්‍රීසි') || n.includes('english')) {
      return {
        icon: '🌐',
        color: 'text-blue-700 dark:text-blue-300',
        bg: 'bg-blue-500/15',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-500/30',
      };
    }
    if (n.includes('ඉතිහාස') || n.includes('history')) {
      return {
        icon: '🏛️',
        color: 'text-stone-700 dark:text-stone-300',
        bg: 'bg-stone-500/15',
        text: 'text-stone-700 dark:text-stone-300',
        border: 'border-stone-500/30',
      };
    }
    if (n.includes('ගණිත') || n.includes('math')) {
      return {
        icon: '📐',
        color: 'text-cyan-700 dark:text-cyan-300',
        bg: 'bg-cyan-500/15',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-500/30',
      };
    }
    if (n.includes('විද්‍යා') || n.includes('science')) {
      return {
        icon: '🔬',
        color: 'text-emerald-700 dark:text-emerald-300',
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/30',
      };
    }
    if (n.includes('තොරතුරු') || n.includes('ict') || n.includes('computer')) {
      return {
        icon: '💻',
        color: 'text-indigo-700 dark:text-indigo-300',
        bg: 'bg-indigo-500/15',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-500/30',
      };
    }
    return {
      icon: '📖',
      color: 'text-slate-700 dark:text-slate-300',
      bg: 'bg-slate-500/15',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-500/30',
    };
  };

  const dailyTimetableSlots = useMemo(() => {
    const rawSlots = classTimetableSlots
      .filter((s) => s.day?.toLowerCase() === selectedTimetableDay.toLowerCase())
      .sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));

    return rawSlots.map((slot) => {
      let subjName = slot.subjectName;
      if (!subjName || subjName === slot.subjectId) {
        const foundSubj = subjects.find(
          (s) =>
            s.id === slot.subjectId ||
            s.code === slot.subjectId ||
            s.name === slot.subjectId ||
            s.nameSinhala === slot.subjectId
        );
        if (foundSubj) {
          subjName = isSi ? foundSubj.nameSinhala || foundSubj.name : foundSubj.name;
        }
      }

      let tName = slot.teacherName;
      if (!tName || tName === slot.teacherId) {
        const foundT = teachers.find(
          (t) =>
            t.id === slot.teacherId ||
            t.customId === slot.teacherId ||
            t.name === slot.teacherId
        );
        if (foundT) {
          tName = foundT.monkName || foundT.name;
        }
      }

      return {
        ...slot,
        subjectName: subjName,
        teacherName: tName,
      };
    });
  }, [classTimetableSlots, selectedTimetableDay, subjects, teachers, isSi]);

  const todayDayKey = useMemo(() => {
    return getSriLankaDayKey() || 'monday';
  }, []);

  const todaySlotsForStudent = useMemo(() => {
    const raw = classTimetableSlots
      .filter((s) => s.day?.toLowerCase() === todayDayKey.toLowerCase())
      .sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));

    return raw.map((slot) => {
      let subjName = slot.subjectName;
      if (!subjName || subjName === slot.subjectId) {
        const foundSubj = subjects.find(
          (s) =>
            s.id === slot.subjectId ||
            s.code === slot.subjectId ||
            s.name === slot.subjectId ||
            s.nameSinhala === slot.subjectId
        );
        if (foundSubj) {
          subjName = isSi ? foundSubj.nameSinhala || foundSubj.name : foundSubj.name;
        }
      }

      let tName = slot.teacherName;
      if (!tName || tName === slot.teacherId) {
        const foundT = teachers.find(
          (t) =>
            t.id === slot.teacherId ||
            t.customId === slot.teacherId ||
            t.name === slot.teacherId
        );
        if (foundT) {
          tName = foundT.monkName || foundT.name;
        }
      }

      const defaultMeta = DEFAULT_PERIODS_META.find((p) => p.period === slot.periodNumber);
      const startTime =
        slot.startTime && slot.startTime !== '08:00'
          ? slot.startTime
          : defaultMeta?.startTime || '07:40 AM';
      const endTime =
        slot.endTime && slot.endTime !== '08:40'
          ? slot.endTime
          : defaultMeta?.endTime || '08:20 AM';

      return {
        ...slot,
        subjectName: subjName,
        teacherName: tName,
        startTime,
        endTime,
      };
    });
  }, [classTimetableSlots, todayDayKey, subjects, teachers, isSi]);

  // Live Active Period & Next Upcoming Period Calculation (locked to 1-second ticks)
  const { activeOngoingPeriod, upcomingNextPeriod } = useMemo(() => {
    const now = getSriLankaDate();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const currentSecs = now.getSeconds();
    const totalCurrentSecs = currentMins * 60 + currentSecs;

    // 1. Find currently active period
    const currentPeriod = DEFAULT_PERIODS_META.find(
      (p) => totalCurrentSecs >= p.startMin * 60 && totalCurrentSecs < p.endMin * 60
    );

    let activeData = null;
    let nextData = null;

    if (currentPeriod) {
      const slot = todaySlotsForStudent.find((s) => s.periodNumber === currentPeriod.period) || null;
      const periodTotalSecs = (currentPeriod.endMin - currentPeriod.startMin) * 60;
      const elapsedSecs = Math.max(0, totalCurrentSecs - currentPeriod.startMin * 60);
      const remainingSecs = Math.max(0, currentPeriod.endMin * 60 - totalCurrentSecs);
      const remainingMins = Math.floor(remainingSecs / 60);
      const remainingSecStr = String(remainingSecs % 60).padStart(2, '0');
      const progressPercent = Math.min(100, Math.max(0, (elapsedSecs / periodTotalSecs) * 100));

      activeData = {
        period: currentPeriod,
        slot,
        remainingMins,
        remainingSecs,
        remainingSecStr,
        progressPercent,
      };
    }

    // 2. Find next upcoming period
    const nextPeriod = DEFAULT_PERIODS_META.find((p) => p.startMin * 60 > totalCurrentSecs);
    if (nextPeriod) {
      const slot = todaySlotsForStudent.find((s) => s.periodNumber === nextPeriod.period) || null;
      const startsInSecs = Math.max(0, nextPeriod.startMin * 60 - totalCurrentSecs);
      const startsInMins = Math.floor(startsInSecs / 60);
      const startsInSecStr = String(startsInSecs % 60).padStart(2, '0');

      nextData = {
        period: nextPeriod,
        slot,
        startsInMins,
        startsInSecs,
        startsInSecStr,
      };
    }

    return {
      activeOngoingPeriod: activeData,
      upcomingNextPeriod: nextData,
    };
  }, [todaySlotsForStudent, currentLivePeriod, currentSecTick]);

  // 🔔 Timetable Period Reminder Notifications State
  const [periodAlertsEnabled, setPeriodAlertsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pirivena_student_period_notifications') === 'true';
    } catch (e) {
      return false;
    }
  });

  const lastNotifiedPeriodRef = useRef<number | null>(null);

  // Automated Period Notification Trigger (Chime + Toast + Native Notification)
  useEffect(() => {
    if (!periodAlertsEnabled || !activeOngoingPeriod || !activeOngoingPeriod.slot) return;

    const currentPeriodNum = activeOngoingPeriod.period.period;
    const todayStr = getSriLankaDateString();
    const sessionKey = `pirivena_student_notified_${todayStr}_p${currentPeriodNum}_${activeOngoingPeriod.slot.classId || 'cls'}`;

    if (lastNotifiedPeriodRef.current === currentPeriodNum || sessionStorage.getItem(sessionKey)) {
      lastNotifiedPeriodRef.current = currentPeriodNum;
      return;
    }

    lastNotifiedPeriodRef.current = currentPeriodNum;
    try {
      sessionStorage.setItem(sessionKey, 'true');
    } catch (e) {}

    const msg = isSi
      ? `🔔 ${currentPeriodNum} වන කාලච්ඡේදය ආරම්භ විය: ${
          activeOngoingPeriod.slot.subjectName || 'දේශනය'
        }${
          activeOngoingPeriod.slot.teacherName
            ? ` (${activeOngoingPeriod.slot.teacherName})`
            : ''
        }`
      : `🔔 Period ${currentPeriodNum} Started: ${
          activeOngoingPeriod.slot.subjectName || 'Lecture'
        }${
          activeOngoingPeriod.slot.teacherName
            ? ` (${activeOngoingPeriod.slot.teacherName})`
            : ''
        }`;

    toast.info(msg);

    notificationService.scheduleNotification({
      stableKey: `student_period_${currentPeriodNum}_${activeOngoingPeriod.slot.classId || 'cls'}_${todayStr}`,
      title: 'ශ්‍රී සුමන පිරිවෙන් කාලසටහන',
      body: msg,
      sound: true,
    });
  }, [periodAlertsEnabled, activeOngoingPeriod, isSi, toast]);

  const handleTogglePeriodNotifications = async () => {
    triggerHaptic('medium');
    const nextState = !periodAlertsEnabled;
    setPeriodAlertsEnabled(nextState);

    try {
      localStorage.setItem('pirivena_student_period_notifications', nextState ? 'true' : 'false');
    } catch (e) { }

    if (nextState) {
      playNotificationSound();
      toast.success(
        isSi
          ? '✓ කාලච්ඡේද මතක් කිරීමේ දැනුම්දීම් සක්‍රීය විය! සෑම කාලච්ඡේදයකදීම ශබ්දයක් සහ පණිවිඩයක් ලැබෙනු ඇත.'
          : '✓ Period reminder alerts enabled! You will be notified with a chime when periods start.'
      );

      await notificationService.requestPermission();
    } else {
      toast.info(isSi ? '🔕 කාලච්ඡේද දැනුම්දීම් අක්‍රිය කරන ලදී.' : '🔕 Period alerts muted.');
    }
  };

  // ⏰ Dashboard Live Timetable Visibility Window: 07:30 AM to 01:30 PM on Weekdays
  const isDashboardTimetableVisible = useMemo(() => {
    const dayKey = getSriLankaDayKey();
    if (!dayKey) return false;
    const currentMins = getSriLankaMinutesOfDay();
    return currentMins >= 450 && currentMins <= 810;
  }, [currentSecTick]);

  // Performance Metrics Calculation
  const studentPerformance = useMemo(() => {
    if (completedSubmissions.length === 0) {
      return { totalAttempted: 0, avgScore: 0, highestScore: 0, passedCount: 0, passedRate: 0 };
    }
    const scores = completedSubmissions.map((s) => s.score || 0);
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const avg = Math.round(sum / scores.length);
    const high = Math.max(...scores);
    const passed = completedSubmissions.filter((s) => {
      const exam = exams.find((e) => e.id === s.examId);
      const passing = exam?.passingMarks || 40;
      return (s.score || 0) >= passing;
    }).length;
    const rate = Math.round((passed / completedSubmissions.length) * 100);

    return {
      totalAttempted: completedSubmissions.length,
      avgScore: avg,
      highestScore: high,
      passedCount: passed,
      passedRate: rate,
    };
  }, [completedSubmissions, exams]);

  const getMaterialTypeBadge = (mat: {
    type: StudyMaterial['type'];
    fileUrl?: string;
    fileName?: string;
  }) => {
    if (isImageResource(mat.fileUrl, mat.fileName)) {
      return (
        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-bold text-[10px] rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
          <ImageIcon className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
          <span>{isSi ? 'ඡායාරූප සටහන' : 'Photo Note'}</span>
        </span>
      );
    }
    switch (mat.type) {
      case 'pdf':
        return (
          <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 font-bold text-[10px] rounded-lg border border-rose-300 dark:border-rose-800 flex items-center gap-1">
            <FileText className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>PDF</span>
          </span>
        );
      case 'notes':
        return (
          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold text-[10px] rounded-lg border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-amber-700 dark:text-amber-400" />
            <span>{isSi ? 'විෂය සටහන්' : 'Notes'}</span>
          </span>
        );
      case 'past_paper':
        return (
          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 font-bold text-[10px] rounded-lg border border-purple-300 dark:border-purple-800 flex items-center gap-1">
            <FileCode className="w-3 h-3 text-purple-700 dark:text-purple-400" />
            <span>{isSi ? 'ප්‍රශ්න පත්‍ර' : 'Past Paper'}</span>
          </span>
        );
      case 'audio':
        return (
          <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-300 font-bold text-[10px] rounded-lg border border-sky-300 dark:border-sky-800 flex items-center gap-1">
            <Music className="w-3 h-3 text-sky-700 dark:text-sky-400" />
            <span>{isSi ? 'හඬපට' : 'Audio'}</span>
          </span>
        );
      case 'video':
        return (
          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 font-bold text-[10px] rounded-lg border border-indigo-300 dark:border-indigo-800 flex items-center gap-1">
            <Video className="w-3 h-3 text-indigo-700 dark:text-indigo-400" />
            <span>{isSi ? 'වීඩියෝ' : 'Video'}</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-300 font-bold text-[10px] rounded-lg">
            {isSi ? 'ගොනුව' : 'File'}
          </span>
        );
    }
  };

  // Broadcast stats to Navbar
  useEffect(() => {
    const notify = () => {
      window.dispatchEvent(
        new CustomEvent('student-portal-stats', {
          detail: {
            materialsCount: filteredMaterials.length,
            examsCount: availableStudentExams.filter((e) => !isExamCompleted(e.id)).length,
            resultsCount: completedSubmissions.length,
            libraryCount: libraryBooks.length,
          },
        })
      );
    };

    notify();
    const handleReq = () => notify();
    window.addEventListener('request-student-portal-stats', handleReq);
    return () => window.removeEventListener('request-student-portal-stats', handleReq);
  }, [
    filteredMaterials.length,
    availableStudentExams,
    completedExamIds,
    completedSubmissions,
    libraryBooks.length,
  ]);

  if (activeExam) {
    return (
      <OnlineExamView
        exam={activeExam}
        studentUser={user}
        onFinishExam={handleFinishExam}
        onCancel={() => setActiveExam(null)}
      />
    );
  }

  const activeUnattemptedExams = availableStudentExams.filter((e) => !isExamCompleted(e.id));

  const handlePullRefresh = async () => {
    try {
      await fetchData();
    } catch (e) {}
  };

  return (
    <PullToRefreshWrapper onRefresh={handlePullRefresh} className="min-h-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-12 space-y-4 sm:space-y-6 overflow-x-clip">
        <div
          key={activePortalTab}
          className="w-full space-y-4 sm:space-y-6 animate-fade-in-fast"
        >
          {/* ─────────────────────────────────────────────────────────────
              TAB 1: OVERVIEW / PROFILE VIEW
              ───────────────────────────────────────────────────────────── */}
          {activePortalTab === 'overview' && (
            <OverviewTab
              user={user}
              studentClass={studentClass}
              filteredMaterials={filteredMaterials}
              activeUnattemptedExams={activeUnattemptedExams}
              completedSubmissions={completedSubmissions}
              libraryBooks={libraryBooks}
              studentPerformance={studentPerformance}
              isDashboardTimetableVisible={isDashboardTimetableVisible}
              setIsDashboardTimetableVisible={() => {}}
              currentLivePeriod={currentLivePeriod}
              currentLiveTimeStr={currentLiveTimeStr}
              activeOngoingPeriod={activeOngoingPeriod}
              upcomingNextPeriod={upcomingNextPeriod}
              periodAlertsEnabled={periodAlertsEnabled}
              handleTogglePeriodNotifications={handleTogglePeriodNotifications}
              switchSubTab={switchSubTab}
              onOpenQrModal={onOpenQrModal}
              onOpenCertModal={onOpenCertModal}
              onOpenReportCardModal={onOpenReportCardModal}
              isSi={isSi}
              getSubjectIconAndColor={getSubjectIconAndColor}
            />
          )}

          {/* ─────────────────────────────────────────────────────────────
              SECONDARY SUB-TABS (LAZY-LOADED WITH SUSPENSE)
              ───────────────────────────────────────────────────────────── */}
          <React.Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center"><PageLoadingSpinner message="අංශය පූරණය වෙමින් පවතී..." /></div>}>
            {/* TAB 2: STUDY MATERIALS & CLASS NOTES */}
            {activePortalTab === 'materials' && (
              <MaterialsTab
                filteredMaterials={filteredMaterials}
                subjects={subjects}
                teachers={teachers}
                availableStudentSubjects={availableStudentSubjects}
                matSearch={matSearch}
                setMatSearch={setMatSearch}
                matTypeFilter={matTypeFilter}
                setMatTypeFilter={setMatTypeFilter}
                matSubjectFilter={matSubjectFilter}
                setMatSubjectFilter={setMatSubjectFilter}
                handleOpenMaterialViewer={handleOpenMaterialViewer}
                getMaterialTypeBadge={getMaterialTypeBadge}
                isImageResource={isImageResource}
                isSi={isSi}
              />
            )}

            {/* TAB 3 & 4: ONLINE EXAMINATIONS & RESULTS */}
            {(activePortalTab === 'exams' || activePortalTab === 'results') && (
              <ExamsTab
                activeUnattemptedExams={activeUnattemptedExams}
                completedSubmissions={completedSubmissions}
                exams={exams}
                subjects={subjects}
                studentPerformance={studentPerformance}
                setActiveExam={setActiveExam}
                setViewingSubmissionReview={setViewingSubmissionReview}
                switchSubTab={switchSubTab}
                activeSubTab={activePortalTab}
                isSi={isSi}
              />
            )}

            {/* TAB 5: DIGITAL LIBRARY & DHAMMA E-BOOKS */}
            {activePortalTab === 'library' && (
              <LibraryTab
                libraryBooks={libraryBooks}
                filteredLibraryBooks={filteredLibraryBooks}
                librarySearch={librarySearch}
                setLibrarySearch={setLibrarySearch}
                selectedLibraryCategory={selectedLibraryCategory}
                setSelectedLibraryCategory={setSelectedLibraryCategory}
                libraryCategories={libraryCategories}
                setViewingLibraryBook={setViewingLibraryBook}
                isSi={isSi}
              />
            )}

            {/* TAB 6: CLASS TIMETABLE (පන්ති කාලසටහන) */}
            {activePortalTab === 'timetable' && (
              <TimetableTab
                studentClass={studentClass}
                dailyTimetableSlots={dailyTimetableSlots}
                classTimetableSlots={classTimetableSlots}
                selectedTimetableDay={selectedTimetableDay}
                setSelectedTimetableDay={setSelectedTimetableDay}
                isWeeklyGridView={isWeeklyGridView}
                setIsWeeklyGridView={setIsWeeklyGridView}
                currentLivePeriod={currentLivePeriod}
                currentLiveTimeStr={currentLiveTimeStr}
                activeOngoingPeriod={activeOngoingPeriod}
                upcomingNextPeriod={upcomingNextPeriod}
                getSubjectIconAndColor={getSubjectIconAndColor}
                isSi={isSi}
              />
            )}

            {/* TAB 7: SETTINGS & APK DETAILS (සැකසුම් සහ යෙදුම් තොරතුරු) */}
            {activePortalTab === 'settings' && (
              <SettingsTab
                user={user}
                studentClass={studentClass}
                language={language}
                setLanguage={setLanguage}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                periodAlertsEnabled={periodAlertsEnabled}
                handleTogglePeriodNotifications={handleTogglePeriodNotifications}
                playNotificationSound={playNotificationSound}
                onOpenQrModal={onOpenQrModal}
                onOpenReportCardModal={onOpenReportCardModal}
                isSi={isSi}
              />
            )}
          </React.Suspense>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL DIALOGS (LAZY LOADED WITH SUSPENSE)
          ───────────────────────────────────────────────────────────── */}
      <React.Suspense fallback={null}>
        {/* MODAL 1: COMPLETE ANSWER PAPER REVIEW MODAL */}
        {viewingSubmissionReview && (
          <SubmissionReviewModal
            review={viewingSubmissionReview}
            user={user}
            studentClass={studentClass}
            onClose={() => setViewingSubmissionReview(null)}
            isSi={isSi}
            resolveStudentAnswer={resolveStudentAnswer}
            isCorrectAnswerMatch={isCorrectAnswerMatch}
          />
        )}

        {/* MODAL 2: STUDY MATERIAL VIEWER MODAL */}
        {viewingMaterial && (
          <MaterialViewerModal
            viewingMaterial={viewingMaterial}
            onClose={() => setViewingMaterial(null)}
            getMaterialTypeBadge={getMaterialTypeBadge}
            isImageResource={isImageResource}
            getPdfObjectUrl={getPdfObjectUrl}
            openPdfInBlobTab={openPdfInBlobTab}
            decodedTextNote={decodedTextNote || ''}
            isSi={isSi}
          />
        )}

        {/* MODAL 3: DIGITAL LIBRARY E-BOOK READER MODAL */}
        {viewingLibraryBook && (
          <BookReaderModal
            viewingLibraryBook={viewingLibraryBook}
            onClose={() => setViewingLibraryBook(null)}
            getPdfObjectUrl={getPdfObjectUrl}
            openPdfInBlobTab={openPdfInBlobTab}
            isSi={isSi}
          />
        )}
      </React.Suspense>
    </PullToRefreshWrapper>
  );
};
