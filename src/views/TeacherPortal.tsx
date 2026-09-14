import React, { useState, useEffect, useMemo, startTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import type {
  Exam,
  User,
  PirivenaClass,
  Subject,
  StudyMaterial,
  Question,
} from '../types';
import {
  classesApi,
  subjectsApi,
  examsApi,
  materialsApi,
  usersApi,
  aiApi,
} from '../api';
import { uploadFile, uploadFileWithProgress, type UploadProgressInfo } from '../utils/fileUpload';
import { invalidateCache } from '../utils/dataCache';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { triggerHaptic } from '../utils/haptics';
import { copyToClipboard } from '../utils/clipboardHelper';
import { safeJsonParse } from '../services/ai/utils';
import { validateAndCleanQuestionsArray, formatQuestionsTo9ColumnJson } from '../services/ai/validator';
import { useTeacherPortalData } from '../hooks/useTeacherPortalData';
import { navigationHistoryManager } from '../services/navigationHistoryManager';
import { BarChart3, Activity, ClipboardList, BookOpen, Upload } from 'lucide-react';

// Modular Tabs
import { OverviewTab } from './TeacherPortal/tabs/OverviewTab';
import { MonitoringTab } from './TeacherPortal/tabs/MonitoringTab';
import { RosterTab } from './TeacherPortal/tabs/RosterTab';
import { ExamsTab } from './TeacherPortal/tabs/ExamsTab';
import { MaterialsTab } from './TeacherPortal/tabs/MaterialsTab';
import { SettingsTab } from './TeacherPortal/tabs/SettingsTab';
import { TimetableTab } from './TeacherPortal/tabs/TimetableTab';

// Modular Modals
import { CreateExamModal } from './TeacherPortal/modals/CreateExamModal';
import { SheetsPasteModal } from './TeacherPortal/modals/SheetsPasteModal';
import { RawAiJsonModal } from './TeacherPortal/modals/RawAiJsonModal';
import { UploadJsonModal } from './TeacherPortal/modals/UploadJsonModal';
import { PrintablePaperModal } from './TeacherPortal/modals/PrintablePaperModal';
import { ViewMaterialModal } from './TeacherPortal/modals/ViewMaterialModal';
import { UploadMaterialModal } from './TeacherPortal/modals/UploadMaterialModal';
import { SubmissionModal } from './TeacherPortal/modals/SubmissionModal';
import { ClassReportModal } from './TeacherPortal/modals/ClassReportModal';
import { StudentReportModal } from './TeacherPortal/modals/StudentReportModal';

interface TeacherPortalProps {
  onSelectStudentReportCard?: (user: User) => void;
  onSelectStudentQr?: (user: User) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({
  onSelectStudentReportCard,
  onSelectStudentQr,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'timetable' | 'monitoring' | 'roster' | 'exams' | 'materials' | 'settings'
  >(() => {
    try {
      const saved = sessionStorage.getItem('pirivena_teacher_tab');
      return (saved as any) || 'overview';
    } catch (e) {
      return 'overview';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('pirivena_teacher_tab', activeTab);
      localStorage.removeItem('pirivena_teacher_tab');
    } catch (e) {}
    navigationHistoryManager.recordTabNavigation(activeTab);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      document.body.style.pointerEvents = '';
    }
  }, [activeTab]);

  const handleTabNavigate = (
    tab: 'overview' | 'timetable' | 'monitoring' | 'roster' | 'exams' | 'materials' | 'settings'
  ) => {
    triggerHaptic('light');
    navigationHistoryManager.recordTabNavigation(tab);
    startTransition(() => {
      setActiveTab(tab);
    });
    try {
      localStorage.setItem('pirivena_teacher_tab', tab);
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: tab }));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        let tab = e.detail;
        if (tab === 'dashboard') tab = 'overview';
        if (tab === 'classes') tab = 'roster';
        if (
          tab === 'overview' ||
          tab === 'timetable' ||
          tab === 'monitoring' ||
          tab === 'roster' ||
          tab === 'exams' ||
          tab === 'materials' ||
          tab === 'settings'
        ) {
          startTransition(() => {
            setActiveTab((prev) => (prev !== tab ? tab : prev));
          });
          try {
            localStorage.setItem('pirivena_teacher_tab', tab);
          } catch (_) {}
        }
      }
    };
    window.addEventListener('switch-portal-subtab', handleSwitch);
    return () => window.removeEventListener('switch-portal-subtab', handleSwitch);
  }, []);

  // Core Data & Scoped Data Fetching Hook
  const {
    classes,
    subjects,
    students,
    exams,
    materials,
    assignedClasses,
    assignedSubjects,
    getAssignedSubjectsForClass,
    assignedStudents,
    assignedExams,
    assignedMaterials,
    isAuthorized,
    refetch: fetchInitialData,
    setExams,
    setMaterials,
  } = useTeacherPortalData();

  const teacherExams = assignedExams;

  // Exam Monitoring State & Detailed Reports
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [viewSubmission, setViewSubmission] = useState<any>(null);
  const [showClassReportModal, setShowClassReportModal] = useState<boolean>(false);
  const [selectedStudentReport, setSelectedStudentReport] = useState<any>(null);
  const [teacherFeedbackInput, setTeacherFeedbackInput] = useState<string>('');
  const [manualScoreInput, setManualScoreInput] = useState<string>('');
  const [isSavingFeedback, setIsSavingFeedback] = useState<boolean>(false);
  const [feedbackSaveSuccess, setFeedbackSaveSuccess] = useState<boolean>(false);
  const [isSavingExam, setIsSavingExam] = useState<boolean>(false);

  // Roster Filter State
  const [rosterClassFilter, setRosterClassFilter] = useState<string>('all');
  const [rosterSearch, setRosterSearch] = useState<string>('');

  // Advanced Exam Creator & Paper Builder State
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examTitleSinhala, setExamTitleSinhala] = useState('');
  const [instructions, setInstructions] = useState('');
  const [instructionsSinhala, setInstructionsSinhala] = useState('');
  const [examClassId, setExamClassId] = useState('');
  const [examSubjectId, setExamSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingMarks, setPassingMarks] = useState(40);
  const [attemptsAllowed, setAttemptsAllowed] = useState(2);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [paperPreviewMode, setPaperPreviewMode] = useState(false);
  const [examBuilderSubTab, setExamBuilderSubTab] = useState<
    'settings' | 'questions' | 'presets' | 'json' | 'preview'
  >('settings');
  const [showSheetsPasteModal, setShowSheetsPasteModal] = useState(false);

  // AI Photo / PDF Paper Digitizer State
  const [uploadingPaperFile, setUploadingPaperFile] = useState<File | null>(null);
  const [paperFilePreview, setPaperFilePreview] = useState<string | null>(null);
  const [isExtractingPaper, setIsExtractingPaper] = useState(false);
  const [paperExtractSuccessMsg, setPaperExtractSuccessMsg] = useState<string | null>(null);
  const [paperExtractErrorMsg, setPaperExtractErrorMsg] = useState<string | null>(null);
  const [, setExtractedPaperQuestions] = useState<Question[]>([]);

  // Raw AI Vision JSON & Dedicated JSON Upload State
  const [rawAiJsonModalOpen, setRawAiJsonModalOpen] = useState(false);
  const [rawAiJsonContent, setRawAiJsonContent] = useState<string>('');
  const [uploadJsonModalOpen, setUploadJsonModalOpen] = useState(false);
  const [jsonInputTab, setJsonInputTab] = useState<'file' | 'text'>('file');
  const [pastedJsonText, setPastedJsonText] = useState<string>('');
  const [jsonImportErrorMsg, setJsonImportErrorMsg] = useState<string | null>(null);
  const [jsonImportSuccessMsg, setJsonImportSuccessMsg] = useState<string | null>(null);
  const [copiedRawJsonSuccess, setCopiedRawJsonSuccess] = useState(false);
  const [stagedJsonQuestions, setStagedJsonQuestions] = useState<Question[] | null>(null);
  const [isRawJsonCleared, setIsRawJsonCleared] = useState(false);

  // Google Sheets / Excel Bulk Question Importer State
  const [sheetsPastedData, setSheetsPastedData] = useState<string>('');
  const [parsedCsvQuestions, setParsedCsvQuestions] = useState<Question[]>([]);
  const [csvParseSuccessMsg, setCsvParseSuccessMsg] = useState<string | null>(null);
  const [csvParseErrorMsg, setCsvParseErrorMsg] = useState<string | null>(null);

  // Printable Paper Customization State
  const [printablePaper, setPrintablePaper] = useState<Exam | null>(null);
  const [showMarkingSchemeInPrint, setShowMarkingSchemeInPrint] = useState(false);
  const [customInstituteHeader, setCustomInstituteHeader] = useState('ශ්‍රී සුමන මහා පිරිවෙන - මුද්දුව, රත්නපුර');
  const [customInstituteEnglish, setCustomInstituteEnglish] = useState('Sri Sumana Maha Pirivena - Mudduwa, Ratnapura');
  const [, setCustomPaperTitle] = useState('');

  // Deleting confirmation state
  const toast = useToast();
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);

  // Dynamic Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => Promise<void> | void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ඔව්, ඉවත් කරන්න',
    cancelText: 'අවලංගු කරන්න',
    variant: 'danger',
    onConfirm: () => {},
    isLoading: false,
  });

  const askConfirmation = (({
    title,
    message,
    confirmText = 'ඔව්, ඉවත් කරන්න',
    cancelText = 'අවලංගු කරන්න',
    variant = 'danger',
    action,
  }: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    action: () => Promise<void> | void;
  }) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isLoading: true }));
        try {
          await action();
        } finally {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
      isLoading: false,
    });
  });

  // Study Material Upload & Edit State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [isSubmittingMat, setIsSubmittingMat] = useState(false);
  const [matUploadProgress, setMatUploadProgress] = useState<UploadProgressInfo | null>(null);
  const [matTitle, setMatTitle] = useState('');
  const [matTitleSinhala, setMatTitleSinhala] = useState('');
  const [matSubjectId, setMatSubjectId] = useState('');
  const [matClassId, setMatClassId] = useState('');
  const [matType, setMatType] = useState<
    'pdf' | 'notes' | 'audio' | 'video' | 'past_paper' | 'other' | string
  >('pdf');
  const [matFileUrl, setMatFileUrl] = useState('');
  const [matDescription, setMatDescription] = useState('');

  // Direct File Upload State for Study Materials
  const [uploadedMatFile, setUploadedMatFile] = useState<File | null>(null);
  const [matFileBase64, setMatFileBase64] = useState<string | null>(null);
  const [matFileName, setMatFileName] = useState<string>('');
  const [matFileSize, setMatFileSize] = useState<string>('');
  const [viewingTeacherMaterial, setViewingTeacherMaterial] = useState<StudyMaterial | null>(null);

  // Connect TeacherPortal modals with Android hardware back button
  useEffect(() => {
    if (confirmConfig.isOpen) {
      navigationHistoryManager.pushModal('teacher_confirm', () => setConfirmConfig((prev) => ({ ...prev, isOpen: false })), 60);
    } else {
      navigationHistoryManager.removeModal('teacher_confirm');
    }
    return () => navigationHistoryManager.removeModal('teacher_confirm');
  }, [confirmConfig.isOpen]);

  useEffect(() => {
    if (showCreateExamModal) {
      navigationHistoryManager.pushModal('create_exam_modal', () => setShowCreateExamModal(false), 35);
    } else {
      navigationHistoryManager.removeModal('create_exam_modal');
    }
    return () => navigationHistoryManager.removeModal('create_exam_modal');
  }, [showCreateExamModal]);

  useEffect(() => {
    if (showUploadModal) {
      navigationHistoryManager.pushModal('upload_material_modal', () => setShowUploadModal(false), 35);
    } else {
      navigationHistoryManager.removeModal('upload_material_modal');
    }
    return () => navigationHistoryManager.removeModal('upload_material_modal');
  }, [showUploadModal]);

  useEffect(() => {
    if (viewingTeacherMaterial) {
      navigationHistoryManager.pushModal('teacher_material_viewer', () => setViewingTeacherMaterial(null), 35);
    } else {
      navigationHistoryManager.removeModal('teacher_material_viewer');
    }
    return () => navigationHistoryManager.removeModal('teacher_material_viewer');
  }, [viewingTeacherMaterial]);

  useEffect(() => {
    if (printablePaper) {
      navigationHistoryManager.pushModal('printable_paper', () => setPrintablePaper(null), 35);
    } else {
      navigationHistoryManager.removeModal('printable_paper');
    }
    return () => navigationHistoryManager.removeModal('printable_paper');
  }, [printablePaper]);

  useEffect(() => {
    if (showClassReportModal) {
      navigationHistoryManager.pushModal('class_report_modal', () => setShowClassReportModal(false), 35);
    } else {
      navigationHistoryManager.removeModal('class_report_modal');
    }
    return () => navigationHistoryManager.removeModal('class_report_modal');
  }, [showClassReportModal]);

  useEffect(() => {
    if (viewSubmission) {
      navigationHistoryManager.pushModal('teacher_view_submission', () => setViewSubmission(null), 35);
    } else {
      navigationHistoryManager.removeModal('teacher_view_submission');
    }
    return () => navigationHistoryManager.removeModal('teacher_view_submission');
  }, [viewSubmission]);

  useEffect(() => {
    if (selectedStudentReport) {
      navigationHistoryManager.pushModal('student_report_modal', () => setSelectedStudentReport(null), 35);
    } else {
      navigationHistoryManager.removeModal('student_report_modal');
    }
    return () => navigationHistoryManager.removeModal('student_report_modal');
  }, [selectedStudentReport]);

  // Material Search & Filter State
  const [matSearchQuery, setMatSearchQuery] = useState('');
  const [matClassFilter, setMatClassFilter] = useState('all');
  const [matSubjectFilter, setMatSubjectFilter] = useState('all');
  const [matTypeFilter, setMatTypeFilter] = useState('all');

  // Initialize default class and subject choices when assigned lists load
  useEffect(() => {
    if (assignedClasses.length > 0) {
      setExamClassId((prev) => prev || assignedClasses[0].id);
      setMatClassId((prev) => prev || assignedClasses[0].id);
    } else if (classes.length > 0) {
      setExamClassId((prev) => prev || classes[0].id);
      setMatClassId((prev) => prev || classes[0].id);
    }
  }, [assignedClasses, classes]);

  useEffect(() => {
    if (assignedSubjects.length > 0) {
      setExamSubjectId((prev) => prev || assignedSubjects[0].id);
      setMatSubjectId((prev) => prev || assignedSubjects[0].id);
    } else if (subjects.length > 0) {
      setExamSubjectId((prev) => prev || subjects[0].id);
      setMatSubjectId((prev) => prev || subjects[0].id);
    }
  }, [assignedSubjects, subjects]);

  useEffect(() => {
    let intervalId: any;
    if (activeTab === 'monitoring' && teacherExams.length > 0) {
      const targetExamId = selectedExamId || teacherExams[0]?.id;
      if (targetExamId) {
        if (!selectedExamId) {
          setSelectedExamId(targetExamId);
        }
        fetchExamMonitoring(targetExamId);

        intervalId = window.setInterval(() => {
          if (!document.hidden) {
            fetchExamMonitoring(targetExamId);
          }
        }, 10000);
      }
    } else if (activeTab === 'monitoring' && teacherExams.length === 0) {
      setMonitoringData(null);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedExamId, activeTab, teacherExams.length]);

  const fetchExamMonitoring = async (examId: string) => {
    if (!examId) return;
    try {
      const data = await examsApi.getMonitoringData(examId);
      if (data) {
        startTransition(() => {
          setMonitoringData(data);
        });
      }
    } catch (e: any) {
      if (e?.status === 404 || e?.message?.includes('404') || e?.message?.includes('not found')) {
        startTransition(() => {
          setSelectedExamId('');
          setMonitoringData(null);
        });
        fetchInitialData();
      }
    }
  };

  const handleDeleteSelectedExam = () => {
    if (!selectedExamId) return;
    const targetExam = exams.find((e) => e.id === selectedExamId);
    const examTitle = targetExam ? targetExam.title : 'තෝරාගත් විභාගය';
    askConfirmation({
      title: 'විභාග ප්‍රශ්න පත්‍රය ඉවත් කිරීම',
      message: `"${examTitle}" විභාගය සහ ඊට අදාළ සියලුම ලකුණු වාර්තා ඉවත් කිරීමට ඔබට විශ්වාසද?`,
      action: async () => {
        const targetId = selectedExamId;
        setSelectedExamId('');
        setMonitoringData(null);
        setExams((prev) => prev.filter((e) => e.id !== targetId));
        invalidateCache('/api/exams');
        invalidateCache('/api/submissions');
        try {
          await examsApi.deleteExam(targetId);
          toast.success('විභාග ප්‍රශ්න පත්‍රය සාර්ථකව ඉවත් කරන ලදී!');
        } catch (e) {
          console.warn('Exam deletion process completed:', e);
        } finally {
          await fetchInitialData();
        }
      },
    });
  };

  const handleOpenSubmissionModal = async (st: any) => {
    let studentSubmission = st.submission || null;
    let targetExam = exams.find((e) => e.id === selectedExamId || e.id === studentSubmission?.examId);

    // Initial instant open so UI is responsive
    setViewSubmission({
      ...st,
      submission: studentSubmission,
      exam: targetExam,
    });
    setTeacherFeedbackInput(studentSubmission?.teacherFeedback || st.submission?.teacherFeedback || '');
    setManualScoreInput(
      studentSubmission?.score !== null && studentSubmission?.score !== undefined
        ? String(studentSubmission.score)
        : (st.score !== null && st.score !== undefined ? String(st.score) : '')
    );
    setFeedbackSaveSuccess(false);

    // If no submission is directly attached to st, try to find from submissions or fetch monitoringData
    if (!studentSubmission && st.id) {
      try {
        const subList = await examsApi.getSubmissions(selectedExamId || undefined, st.id);
        if (Array.isArray(subList) && subList.length > 0) {
          studentSubmission = subList[0];
          if (!targetExam) {
            targetExam = exams.find((e) => e.id === studentSubmission.examId);
          }
        }
      } catch (e) {}
    }

    // If targetExam has no questions loaded or is missing, fetch the full exam
    if (targetExam && (!targetExam.questions || targetExam.questions.length === 0)) {
      try {
        const fullExam = await examsApi.getExamById(targetExam.id);
        if (fullExam && fullExam.questions) {
          targetExam = fullExam;
        }
      } catch (e) {}
    }

    // Update with resolved details
    setViewSubmission((prev: any) => ({
      ...prev,
      ...st,
      submission: studentSubmission || prev?.submission || st.submission,
      exam: targetExam || prev?.exam,
      score:
        studentSubmission?.score !== null && studentSubmission?.score !== undefined
          ? studentSubmission.score
          : prev?.score,
    }));
  };

  const handleSaveTeacherFeedback = async () => {
    if (!selectedExamId && !viewSubmission) return;
    setIsSavingFeedback(true);
    try {
      let updatedSub: any;
      if (viewSubmission?.submission?.id) {
        const data = await examsApi.updateSubmission(viewSubmission.submission.id, {
          teacherFeedback: teacherFeedbackInput,
          score: manualScoreInput !== '' ? Number(manualScoreInput) : undefined,
          status: 'graded',
        });
        updatedSub = (data as any).submission || data;
      } else if (selectedExamId && viewSubmission?.id) {
        const data = await examsApi.submitExam(selectedExamId, {
          studentId: viewSubmission.id,
          studentCustomId: viewSubmission.customId,
          studentName: viewSubmission.name || viewSubmission.monkName || 'ශිෂ්‍යයා',
          studentMonkName: viewSubmission.monkName || '',
          studentMonkStatus: viewSubmission.monkStatus || 'lay',
          teacherFeedback: teacherFeedbackInput,
          score: manualScoreInput !== '' ? Number(manualScoreInput) : 0,
          status: 'graded',
        });
        updatedSub = (data as any).submission || data;
      }

      if (updatedSub) {
        setViewSubmission((prev: any) => ({
          ...prev,
          score: updatedSub.score !== undefined ? updatedSub.score : prev.score,
          status: updatedSub.status || 'graded',
          submission: updatedSub,
        }));
        setFeedbackSaveSuccess(true);
        setTimeout(() => setFeedbackSaveSuccess(false), 3000);
      }
      if (selectedExamId) fetchExamMonitoring(selectedExamId);
    } catch (e) {
      console.error('Error saving feedback:', e);
    } finally {
      setIsSavingFeedback(false);
    }
  };

  // Exam Creator Modal Openers & Handlers
  const openCreateExamModal = () => {
    setEditingExamId(null);
    setExamTitle('');
    setExamTitleSinhala('');
    setInstructions(
      'Answer all questions clearly. Time limit is strictly monitored. / සියලුම ප්‍රශ්නවලට පිළිතුරු සපයන්න.'
    );
    setInstructionsSinhala('');
    setDurationMinutes(60);
    setPassingMarks(40);
    setAttemptsAllowed(2);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setPaperPreviewMode(false);
    setExamBuilderSubTab('settings');
    setUploadingPaperFile(null);
    setPaperFilePreview(null);
    setPaperExtractSuccessMsg(null);
    setPaperExtractErrorMsg(null);
    if (assignedClasses.length > 0) setExamClassId(assignedClasses[0].id);
    if (assignedSubjects.length > 0) setExamSubjectId(assignedSubjects[0].id);

    // Load default starter question
    setQuestionsList([
      {
        id: 'q-init-1',
        type: 'mcq',
        text: 'පාලි වාක්‍ය රටාවෙහි උක්තය සඳහා භාවිතා වන ප්‍රධාන විභත්තිය කුමක්ද? (What is the primary grammatical case used for the subject in Pali?)',
        options: [
          'පඨමා විභත්තිය (Nominative)',
          'දුතියා විභත්තිය (Accusative)',
          'තතියා විභත්තිය (Instrumental)',
          'ඡට්ඨී විභත්තිය (Genitive)',
        ],
        correctAnswer: 0,
        marks: 20,
        explanation: 'Nominative (Paṭhamā) case marks the grammatical subject.',
      },
    ]);
    setShowCreateExamModal(true);
  };

  const handleExportQuestionsToCsv = (qs: Question[], title = 'extracted_paper_questions') => {
    if (!qs || qs.length === 0) {
      toast.warning('Export කිරීමට කිසිදු ප්‍රශ්නයක් සොයාගත නොහැකි විය.');
      return;
    }

    const headers = [
      'Question',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Correct Answer',
      'Marks',
      'Type',
      'Explanation',
    ];

    const rows = qs.map((q) => {
      const text = (q.text || '').replace(/"/g, '""');
      const optA = (q.options?.[0] || '').replace(/"/g, '""');
      const optB = (q.options?.[1] || '').replace(/"/g, '""');
      const optC = (q.options?.[2] || '').replace(/"/g, '""');
      const optD = (q.options?.[3] || '').replace(/"/g, '""');

      let corr = '';
      if (q.type === 'mcq') {
        const num = Number(q.correctAnswer);
        if (!isNaN(num) && num >= 0 && num <= 3) {
          corr = String(num + 1);
        } else {
          corr = String(q.correctAnswer || 1).replace(/"/g, '""');
        }
      } else {
        corr = String(q.correctAnswer ?? '').replace(/"/g, '""');
      }

      const marks = String(q.marks ?? 10);
      const type = q.type || 'mcq';
      const explanation = (q.explanation || '').replace(/"/g, '""');

      return `"${text}","${optA}","${optB}","${optC}","${optD}","${corr}","${marks}","${type}","${explanation}"`;
    });

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportFromPastedGoogleSheets = (pastedText: string) => {
    if (!pastedText || !pastedText.trim()) {
      toast.warning('කරුණාකර Google Sheets හි 9-Column දත්ත පේළි මෙහි Paste කරන්න.');
      return;
    }
    const lines = pastedText.trim().split(/\r?\n/);
    const parsedQuestions: Question[] = [];

    lines.forEach((line, index) => {
      if (
        index === 0 &&
        (line.toLowerCase().includes('question') || line.toLowerCase().includes('option'))
      ) {
        return;
      }
      const parts = line.split('\t');
      if (parts.length >= 1 && parts[0].trim()) {
        const text = parts[0].trim();
        const optA = parts[1] ? parts[1].trim() : '';
        const optB = parts[2] ? parts[2].trim() : '';
        const optC = parts[3] ? parts[3].trim() : '';
        const optD = parts[4] ? parts[4].trim() : '';
        const rawAns = parts[5] ? parts[5].trim() : '';
        const marksNum = parts[6] ? Number(parts[6].trim()) : 10;
        const typeStr = parts[7] ? parts[7].trim().toLowerCase() : 'mcq';
        const explanation = parts[8] ? parts[8].trim() : '';

        let type: 'mcq' | 'true_false' | 'essay' | 'structured' = 'mcq';
        if (typeStr.includes('true') || typeStr === 'tf') type = 'true_false';
        else if (typeStr.includes('essay')) type = 'essay';
        else if (typeStr.includes('struct') || typeStr.includes('short')) type = 'structured';

        let options: string[] | undefined = undefined;
        if (type === 'mcq') {
          options = [optA || 'Option A', optB || 'Option B', optC || 'Option C', optD || 'Option D'];
        }

        let correctAnswer: any = rawAns;
        if (type === 'mcq') {
          const num = parseInt(rawAns, 10);
          if (!isNaN(num) && num >= 1 && num <= 4) {
            correctAnswer = num - 1;
          } else if (!isNaN(num) && num >= 0 && num <= 3) {
            correctAnswer = num;
          }
        }

        parsedQuestions.push({
          id: `q-pasted-${Date.now()}-${index}`,
          text,
          options,
          correctAnswer,
          marks: isNaN(marksNum) ? 10 : marksNum,
          type,
          explanation,
        });
      }
    });

    if (parsedQuestions.length > 0) {
      setQuestionsList((prev) => [...prev, ...parsedQuestions]);
      setSheetsPastedData('');
      setPaperExtractSuccessMsg(
        `📊 Google Sheets 9-Column දත්ත වෙතින් ප්‍රශ්න ${parsedQuestions.length}ක් සාර්ථකව පද්ධතියට එක් කරන ලදී!`
      );
    } else {
      toast.error('Google Sheets දත්ත කියවීමට නොහැකි විය. කරුණාකර නිවැරදි 9-Column දත්ත පිටපත් කරගෙන එන්න.');
    }
  };

  const handleResetPaperVision = () => {
    setUploadingPaperFile(null);
    setPaperFilePreview(null);
    setExtractedPaperQuestions([]);
    setPaperExtractSuccessMsg(null);
    setPaperExtractErrorMsg(null);
    setIsExtractingPaper(false);
  };

  const handleExtractPaperFromUpload = async (file: File) => {
    setUploadingPaperFile(file);
    setIsExtractingPaper(true);
    setPaperExtractSuccessMsg(null);
    setPaperExtractErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const fileBase64 = reader.result as string;
      setPaperFilePreview(file.type.startsWith('image/') ? fileBase64 : null);

      try {
        const data = await aiApi.extractPaper({
          fileBase64,
          mimeType: file.type || 'image/png',
          fileName: file.name,
        });

        if (data.success) {
          const finalTitle = data.title || examTitle || file.name.replace(/\.[^/.]+$/, '');
          const finalInstructions =
            data.instructions || instructions || 'සියලුම ප්‍රශ්නවලට පිළිතුරු සපයන්න.';

          if (data.title) setExamTitle(data.title);
          if (data.instructions) setInstructions(data.instructions);

          if (Array.isArray(data.questions) && data.questions.length > 0) {
            const freshQs = data.questions.map((q: any, idx: number) => {
              const qText = String(q.text || q.question || q.textSinhala || q.questionSinhala || '').trim();
              let opts: string[] = [];
              if (Array.isArray(q.options) && q.options.length > 0) {
                opts = q.options.map((o: any) => String(o).trim());
              } else {
                if (q.option_a) opts.push(String(q.option_a).trim());
                if (q.option_b) opts.push(String(q.option_b).trim());
                if (q.option_c) opts.push(String(q.option_c).trim());
                if (q.option_d) opts.push(String(q.option_d).trim());
              }

              let correctAns: any = q.correctAnswer ?? q.correct_answer ?? 0;
              if (typeof correctAns === 'string' && !isNaN(Number(correctAns))) {
                const n = Number(correctAns);
                if (n >= 1 && n <= (opts.length || 4)) correctAns = n - 1;
              }

              return {
                ...q,
                id: q.id || `q-ocr-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
                text: qText,
                question: qText,
                textSinhala: qText,
                questionSinhala: qText,
                options: opts.length > 0 ? opts : (q.options || ['විකල්පය A', 'විකල්පය B', 'විකල්පය C', 'විකල්පය D']),
                correctAnswer: correctAns,
                marks: Number(q.marks) || 20,
                type: q.type || (opts.length > 1 ? 'mcq' : 'essay'),
              };
            });
            setExtractedPaperQuestions(freshQs);
            setQuestionsList(freshQs);
            setRawAiJsonContent(formatQuestionsTo9ColumnJson(freshQs));

            // Do not auto-publish: load questions cleanly into Question Bank form so the teacher can review, adjust, and click Save/Publish manually
            setPaperExtractSuccessMsg(
              `✨ AI Paper Vision මඟින් ප්‍රශ්න ${freshQs.length}ක් සාර්ථකව කියවා Form එකට එකතු කරන ලදී! කරුණාකර ප්‍රශ්න පරීක්ෂා කර බලා 'Save / Publish Exam' බොත්තම ඔබන්න.`
            );
            setExamBuilderSubTab('questions');
          } else {
            setPaperExtractErrorMsg(
              data.error || 'ප්‍රශ්න පත්‍රයෙන් කිසිදු ප්‍රශ්නයක් හඳුනාගත නොහැකි විය.'
            );
          }
        } else {
          setPaperExtractErrorMsg(
            data.error ||
              'උඩුගත කරන ලද PDF / ඡායාරූප ගොනුව AI මඟින් කියවීමට නොහැකි විය. කරුණාකර පැහැදිලි අකුරු සහිත PDF එකක් හෝ ඡායාරූපයක් ලබා දෙන්න.'
          );
        }
      } catch (err: any) {
        console.error(err);
        if (
          err?.status === 401 ||
          err?.message?.includes('401') ||
          err?.message?.includes('UNAUTHENTICATED') ||
          err?.message?.includes('API Key')
        ) {
          setPaperExtractErrorMsg(
            '🔑 Admin Panel හි සකසා ඇති AI API Key සක්‍රීය හෝ වලංගු නැත. කරුණාකර Admin Panel එකෙන් API Keys පරීක්ෂා කරන්න.'
          );
        } else {
          const detail = err?.message || err?.error || '';
          setPaperExtractErrorMsg(
            detail || 'උඩුගත කරන ලද PDF / ඡායාරූප ගොනුව AI මඟින් කියවීමට නොහැකි විය. කරුණාකර පැහැදිලි අකුරු සහිත PDF එකක් හෝ ඡායාරූපයක් ලබා දෙන්න.'
          );
        }
      } finally {
        setIsExtractingPaper(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEqualizeMarks = () => {
    if (questionsList.length === 0) return;
    const perQuestionMarks = Math.max(1, Math.floor(100 / questionsList.length));
    const remainder = 100 - perQuestionMarks * questionsList.length;
    const updated = questionsList.map((q, idx) => ({
      ...q,
      marks: idx === 0 ? perQuestionMarks + remainder : perQuestionMarks,
    }));
    setQuestionsList(updated);
    setPaperExtractSuccessMsg(
      `⚡ ලකුණු 100 ප්‍රශ්න ${questionsList.length} අතර සාධාරණව බෙදා වෙන්කරන ලදී! (Marks balanced to 100 total)`
    );
  };

  const handleClearAllQuestions = () => {
    askConfirmation({
      title: 'ප්‍රශ්න ඉවත් කිරීම',
      message: 'ඔබට විභාග ප්‍රශ්න පත්‍රයේ දැනට ඇති සියලුම ප්‍රශ්න ඉවත් කිරීමට අවශ්‍යද? (Clear all questions?)',
      action: () => {
        setQuestionsList([]);
        toast.success('සියලුම ප්‍රශ්න සාර්ථකව ඉවත් කරන ලදී.');
      },
    });
  };

  const openEditExamModal = (exam: Exam) => {
    setEditingExamId(exam.id);
    setExamTitle(exam.title);
    setExamTitleSinhala(exam.titleSinhala || '');
    setInstructions(exam.instructions || 'Answer all questions clearly.');
    setInstructionsSinhala(exam.instructionsSinhala || '');
    setExamClassId(exam.classId);
    setExamSubjectId(exam.subjectId);
    setDurationMinutes(exam.durationMinutes || 60);
    setPassingMarks(exam.passingMarks || 40);
    setAttemptsAllowed(exam.attemptsAllowed || 2);
    setStartDate(
      exam.startDate ? exam.startDate.split('T')[0] : new Date().toISOString().split('T')[0]
    );
    setEndDate(
      exam.endDate
        ? exam.endDate.split('T')[0]
        : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    );
    setQuestionsList(exam.questions || []);
    setPaperPreviewMode(false);
    setShowCreateExamModal(true);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setSheetsPastedData(text);
          handleParseSheetsData(text);
        } else {
          setCsvParseErrorMsg('Clipboard එකෙහි කිසිදු පෙළක් (Text) සොයාගත නොහැකි විය.');
        }
      } else {
        setCsvParseErrorMsg(
          'ඔබේ බ්‍රවුසරයේ Clipboard Direct Access සඳහා සහය නොදක්වයි. කරුණාකර Ctrl+V මගින් Paste කරන්න.'
        );
      }
    } catch (err) {
      setCsvParseErrorMsg(
        'Clipboard දත්ත ලබාගැනීමට නොහැකි විය. කරුණාකර Textarea එකට කෙළින්ම Paste (Ctrl+V) කරන්න.'
      );
    }
  };

  const handleUpdateParsedQuestion = (index: number, updatedQ: Question) => {
    const list = [...parsedCsvQuestions];
    list[index] = updatedQ;
    setParsedCsvQuestions(list);
  };

  const handleDeleteParsedQuestion = (index: number) => {
    const list = parsedCsvQuestions.filter((_, idx) => idx !== index);
    setParsedCsvQuestions(list);
    if (list.length === 0) {
      setCsvParseSuccessMsg(null);
    }
  };

  const handleAddBlankParsedQuestion = () => {
    const newQ: Question = {
      id: `q-sheets-manual-${Date.now()}`,
      type: 'mcq',
      text: 'නව ප්‍රශ්නය ඇතුළත් කරන්න...',
      options: ['විකල්පය 1', 'විකල්පය 2', 'විකල්පය 3', 'විකල්පය 4'],
      correctAnswer: 0,
      marks: 10,
      explanation: 'Manual entry',
      required: true,
    };
    setParsedCsvQuestions((prev) => [...prev, newQ]);
  };

  const handleSetAllParsedMarks = (marks: number) => {
    setParsedCsvQuestions((prev) => prev.map((q) => ({ ...q, marks })));
  };

  const handleBalanceParsedMarks = () => {
    if (parsedCsvQuestions.length === 0) return;
    const eachMark = Math.max(1, Math.floor(100 / parsedCsvQuestions.length));
    const remainder = 100 - eachMark * parsedCsvQuestions.length;
    setParsedCsvQuestions((prev) =>
      prev.map((q, idx) => ({
        ...q,
        marks: idx === 0 ? eachMark + remainder : eachMark,
      }))
    );
  };

  // Google Sheets / Excel Data Parser Handler
  const handleParseSheetsData = (rawData: string) => {
    setCsvParseSuccessMsg(null);
    setCsvParseErrorMsg(null);
    if (!rawData || !rawData.trim()) {
      setCsvParseErrorMsg(
        'කරුණාකර Google Sheets හෝ Excel වෙතින් කොපි කරගත් දත්ත හෝ CSV ඇතුළත් කරන්න.'
      );
      return;
    }

    const parseLineToColumns = (line: string): string[] => {
      let rawCols: string[] = [];
      if (line.includes('\t')) {
        rawCols = line.split('\t');
      } else if (line.includes('|')) {
        rawCols = line
          .split('|')
          .map((s) => s.trim())
          .filter((s) => s !== '' && s !== '---' && !s.includes('---'));
      } else if (line.includes(';') && !line.includes(',')) {
        rawCols = line.split(';');
      } else {
        const cols: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(cur);
            cur = '';
          } else {
            cur += char;
          }
        }
        cols.push(cur);
        rawCols = cols;
      }

      return rawCols.map((col) => {
        let cleaned = col.trim().replace(/^["']|["']$/g, '');
        cleaned = cleaned.replace(/^col(?:umn)?\s*\d+\s*[:\-]?\s*/i, '');
        return cleaned.trim();
      });
    };

    const lines = rawData.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const parsed: Question[] = [];

    lines.forEach((line, lineIdx) => {
      const parts = parseLineToColumns(line);
      if (!parts || parts.length === 0) return;

      const firstCell = (parts[0] || '').toLowerCase();
      if (
        lineIdx === 0 &&
        (firstCell.includes('question') ||
          firstCell.includes('ප්‍රශ්න') ||
          firstCell.includes('prompt') ||
          firstCell.includes('q_text') ||
          firstCell.includes('option') ||
          firstCell.includes('col 1') ||
          firstCell.includes('col1') ||
          firstCell.includes('---'))
      ) {
        return;
      }

      const questionText = parts[0] || `Question #${lineIdx + 1}`;
      const optA = parts[1] || '';
      const optB = parts[2] || '';
      const optC = parts[3] || '';
      const optD = parts[4] || '';
      const rawCorrect = parts[5] || '0';
      const rawMarks = parts[6] || '10';
      const rawType = parts[7] ? parts[7].toLowerCase() : optA ? 'mcq' : 'essay';
      const explanation = parts[8] || '';

      let type: 'mcq' | 'true_false' | 'essay' | 'structured' = 'mcq';
      if (
        rawType.includes('true') ||
        rawType.includes('false') ||
        rawType.includes('tf') ||
        rawType.includes('සත්‍ය') ||
        rawType.includes('අසත්‍ය')
      ) {
        type = 'true_false';
      } else if (
        rawType.includes('essay') ||
        rawType.includes('පරිවර්තන') ||
        rawType.includes('විචාර')
      ) {
        type = 'essay';
      } else if (
        rawType.includes('struct') ||
        rawType.includes('short') ||
        rawType.includes('කෙටි')
      ) {
        type = 'structured';
      } else if (optA || optB) {
        type = 'mcq';
      } else {
        type = 'essay';
      }

      let options: string[] | undefined = undefined;
      let correctAnswer: any = 0;

      if (type === 'mcq') {
        options = [
          optA || 'විකල්පය A',
          optB || 'විකල්පය B',
          optC || 'විකල්පය C',
          optD || 'විකල්පය D',
        ];
        const corrLower = rawCorrect.toString().trim().toLowerCase();
        if (
          corrLower === 'a' ||
          corrLower === '1' ||
          corrLower === '0' ||
          corrLower.includes('opt a') ||
          corrLower.includes('option a')
        )
          correctAnswer = 0;
        else if (
          corrLower === 'b' ||
          corrLower === '2' ||
          corrLower.includes('opt b') ||
          corrLower.includes('option b')
        )
          correctAnswer = 1;
        else if (
          corrLower === 'c' ||
          corrLower === '3' ||
          corrLower.includes('opt c') ||
          corrLower.includes('option c')
        )
          correctAnswer = 2;
        else if (
          corrLower === 'd' ||
          corrLower === '4' ||
          corrLower.includes('opt d') ||
          corrLower.includes('option d')
        )
          correctAnswer = 3;
        else if (!isNaN(Number(corrLower))) {
          const num = Number(corrLower);
          correctAnswer = num >= 1 && num <= 4 ? num - 1 : 0;
        } else {
          const idxMatch = options.findIndex((o) => o.toLowerCase() === corrLower);
          correctAnswer = idxMatch >= 0 ? idxMatch : 0;
        }
      } else if (type === 'true_false') {
        const corrLower = rawCorrect.toString().trim().toLowerCase();
        correctAnswer =
          corrLower === 'true' ||
          corrLower === 't' ||
          corrLower === '1' ||
          corrLower.includes('සත්‍ය')
            ? 'true'
            : 'false';
      } else {
        correctAnswer = rawCorrect;
      }

      parsed.push({
        id: `q-sheets-${Date.now()}-${lineIdx}`,
        type,
        text: questionText,
        options,
        correctAnswer,
        marks: Number(rawMarks) || 10,
        explanation: explanation || 'Imported from Google Sheets / Excel',
        required: true,
      });
    });

    if (parsed.length === 0) {
      setCsvParseErrorMsg(
        'දත්ත තීරු කියවීමට නොහැකි විය. කරුණාකර නිවැරදි වගු තීරු (Table Columns) ඇතුළත් කරන්න.'
      );
      return;
    }

    setParsedCsvQuestions(parsed);
    setCsvParseSuccessMsg(
      `✓ ප්‍රශ්න ${parsed.length} ක් Google Sheets / Excel දත්තවලින් සාර්ථකව හඳුනා ගන්නා ලදී! පහත වගුවෙන් අවශ්‍ය නම් සංස්කරණය (Edit) කරන්න.`
    );
  };

  const handleConfirmImportCsvQuestions = () => {
    if (parsedCsvQuestions.length === 0) return;
    setQuestionsList((prev) => [...prev, ...parsedCsvQuestions]);
    setPaperExtractSuccessMsg(
      `📥 ප්‍රශ්න ${parsedCsvQuestions.length} ක් ප්‍රශ්න පත්‍රයට සාර්ථකව එක් කරන ලදී! (Added to Question Bank)`
    );
    setParsedCsvQuestions([]);
    setSheetsPastedData('');
    setExamBuilderSubTab('questions');
  };

  const handleLoadJsonPreview = (text: string) => {
    setJsonImportErrorMsg(null);
    setJsonImportSuccessMsg(null);

    if (!text || !text.trim()) {
      setJsonImportErrorMsg('කරුණාකර වලංගු JSON දත්ත ඇතුළත් කරන්න (Empty JSON payload).');
      return;
    }

    try {
      const parsed = safeJsonParse(text);
      if (!parsed) {
        setJsonImportErrorMsg('අවලංගු JSON ආකෘතියකි (Invalid JSON format). කරුණාකර Syntax පරීක්ෂා කරන්න.');
        return;
      }

      const questions = validateAndCleanQuestionsArray(parsed, 'JSON Import');
      if (!questions || questions.length === 0) {
        setJsonImportErrorMsg('JSON දත්තවලින් කිසිදු වලංගු ප්‍රශ්නයක් හඳුනාගත නොහැකි විය.');
        return;
      }

      const freshQs = questions.map((q, idx) => {
        const qText = String(q.text || q.question || q.textSinhala || q.questionSinhala || '').trim();
        return {
          ...q,
          id: `q-json-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          text: qText,
          question: qText,
          textSinhala: qText,
          questionSinhala: qText,
        };
      });

      startTransition(() => {
        setStagedJsonQuestions(freshQs);
        setIsRawJsonCleared(false);
        setJsonImportSuccessMsg(
          `🎉 ප්‍රශ්න ${freshQs.length} ක JSON දත්ත හඳුනා ගන්නා ලදී! පහත '➕ ප්‍රශ්න පත්‍රයට එකතු කරන්න' බොත්තම ඔබන්න.`
        );
      });
    } catch (err: any) {
      setJsonImportErrorMsg(`JSON කියවීමට අපොහොසත් විය: ${err?.message || ''}`);
    }
  };

  const handleConfirmImportStagedJson = () => {
    let questionsToImport: Question[] = [];

    if (stagedJsonQuestions && stagedJsonQuestions.length > 0) {
      questionsToImport = stagedJsonQuestions;
    } else if (rawAiJsonContent) {
      const parsed = safeJsonParse(rawAiJsonContent);
      if (parsed) {
        questionsToImport = validateAndCleanQuestionsArray(parsed, 'JSON Import');
      }
    }

    if (!questionsToImport || questionsToImport.length === 0) {
      setJsonImportErrorMsg('ප්‍රශ්න පත්‍රයට එකතු කිරීමට වලංගු JSON ප්‍රශ්න කිසිවක් නැත.');
      return;
    }

    const freshQs = questionsToImport.map((q, idx) => {
      const qText = String(q.text || q.question || q.textSinhala || q.questionSinhala || '').trim();
      let opts: string[] = [];
      if (Array.isArray(q.options) && q.options.length > 0) {
        opts = q.options.map((o: any) => String(o).trim());
      } else {
        if ((q as any).option_a) opts.push(String((q as any).option_a).trim());
        if ((q as any).option_b) opts.push(String((q as any).option_b).trim());
        if ((q as any).option_c) opts.push(String((q as any).option_c).trim());
        if ((q as any).option_d) opts.push(String((q as any).option_d).trim());
      }

      let correctAns: any = q.correctAnswer ?? (q as any).correct_answer ?? 0;
      if (typeof correctAns === 'string' && !isNaN(Number(correctAns))) {
        const n = Number(correctAns);
        if (n >= 1 && n <= (opts.length || 4)) correctAns = n - 1;
      }

      return {
        ...q,
        id: `q-import-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        text: qText,
        question: qText,
        textSinhala: qText,
        questionSinhala: qText,
        options: opts.length > 0 ? opts : (q.options || ['විකල්පය A', 'විකල්පය B', 'විකල්පය C', 'විකල්පය D']),
        correctAnswer: correctAns,
        marks: Number(q.marks) || 20,
        type: q.type || (opts.length > 1 ? 'mcq' : 'essay'),
      };
    });

    startTransition(() => {
      setQuestionsList((prev) => [...prev, ...freshQs]);
      setStagedJsonQuestions(null);
      setIsRawJsonCleared(false);
      setJsonImportSuccessMsg(`🎉 ප්‍රශ්න ${freshQs.length} ක් සාර්ථකව Question Bank (Tab 2) එකට එකතු කරන ලදී!`);
    });

    setTimeout(() => {
      setExamBuilderSubTab('questions');
      setUploadJsonModalOpen(false);
      setPastedJsonText('');
      setJsonImportSuccessMsg(null);
    }, 800);
  };

  const handleClearRawJsonData = () => {
    setRawAiJsonContent('[]');
    setStagedJsonQuestions(null);
    setIsRawJsonCleared(true);
    setJsonImportSuccessMsg('🗑️ JSON දත්ත සාර්ථකව ඉවත් කරන ලදී (Cleared).');
    setTimeout(() => setJsonImportSuccessMsg(null), 2000);
  };

  const handleFileUploadJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleLoadJsonPreview(content);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleCopyRawJsonToClipboard = async () => {
    const jsonStr = rawAiJsonContent || formatQuestionsTo9ColumnJson(questionsList);
    if (!jsonStr) return;
    try {
      const ok = await copyToClipboard(jsonStr);
      if (ok) {
        setCopiedRawJsonSuccess(true);
        toast.success('✓ විභාග ප්‍රශ්න පත්‍රයේ JSON දත්ත සාර්ථකව පිටපත් කරගන්නා ලදී (Copied)!');
        setTimeout(() => setCopiedRawJsonSuccess(false), 3000);
      } else {
        toast.error('පිටපත් කිරීමට නොහැකි විය.');
      }
    } catch (e) {
      toast.error('පිටපත් කිරීමට නොහැකි විය.');
    }
  };

  const handleDownloadRawJsonFile = () => {
    const jsonStr = rawAiJsonContent || formatQuestionsTo9ColumnJson(questionsList);
    if (!jsonStr) return;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute(
      'download',
      `Pirivena_Exam_Questions_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleFileUploadCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSheetsPastedData(content);
      handleParseSheetsData(content);
    };
    reader.readAsText(file);
  };

  const handleAddQuestionToForm = (type: 'mcq' | 'true_false' | 'essay' | 'structured' = 'mcq') => {
    const nextId = 'q-' + Date.now() + '-' + (questionsList.length + 1);
    const newQ: Question = {
      id: nextId,
      type,
      text:
        type === 'mcq'
          ? 'ප්‍රශ්නය මෙහි ඇතුළත් කරන්න (Enter question prompt...)'
          : type === 'true_false'
            ? 'ප්‍රකාශය මෙහි ඇතුළත් කරන්න (Enter True/False statement...)'
            : type === 'structured'
              ? 'සංක්ෂිප්ත ප්‍රශ්නය ඇතුළත් කරන්න (Enter short answer question...)'
              : 'ප්‍රබල ප්‍රශ්නය හෝ පරිවර්තනය මෙහි ඇතුළත් කරන්න (Enter Essay/Translation prompt...)',
      marks: type === 'essay' ? 50 : type === 'structured' ? 20 : 10,
      options: type === 'mcq' ? ['විකල්පය A', 'විකල්පය B', 'විකල්පය C', 'විකල්පය D'] : undefined,
      correctAnswer: type === 'mcq' ? 0 : type === 'true_false' ? 'true' : '',
      explanation: '',
      required: true,
    };
    setQuestionsList([...questionsList, newQ]);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questionsList.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questionsList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setQuestionsList(updated);
  };

  const handleDuplicateQuestion = (index: number) => {
    const qToDup = questionsList[index];
    const duplicated: Question = {
      ...JSON.parse(JSON.stringify(qToDup)),
      id: 'q-' + Date.now(),
    };
    const updated = [...questionsList];
    updated.splice(index + 1, 0, duplicated);
    setQuestionsList(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questionsList.length <= 1) {
      toast.warning('විභාග ප්‍රශ්න පත්‍රයේ අවම වශයෙන් එක් ප්‍රශ්නයක්වත් තිබිය යුතුය.');
      return;
    }
    setQuestionsList(questionsList.filter((_, i) => i !== index));
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingExam) return;
    setIsSavingExam(true);
    const totalMarks = questionsList.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    const safeStartDate =
      startDate && !isNaN(parsedStart.getTime())
        ? parsedStart.toISOString()
        : new Date().toISOString();
    const safeEndDate =
      endDate && !isNaN(parsedEnd.getTime())
        ? parsedEnd.toISOString()
        : new Date(Date.now() + 14 * 86400000).toISOString();

    const payload = {
      title: examTitle || 'Pracheena Examination Paper',
      titleSinhala: examTitleSinhala || examTitle,
      classId: examClassId || classes[0]?.id || 'class-pra-01',
      subjectId: examSubjectId || subjects[0]?.id || 'subj-pali-101',
      teacherId: user?.id || user?.customId || 'user-teacher-01',
      durationMinutes: Number(durationMinutes) || 60,
      startDate: safeStartDate,
      endDate: safeEndDate,
      totalMarks,
      passingMarks: Number(passingMarks) || 40,
      attemptsAllowed: Number(attemptsAllowed) || 2,
      published: true,
      instructions,
      instructionsSinhala,
      questions: questionsList,
    };

    try {
      if (editingExamId) {
        await examsApi.updateExam(editingExamId, payload);
        setSelectedExamId(editingExamId);
        fetchExamMonitoring(editingExamId);
      } else {
        const createdExam = await examsApi.createExam(payload);
        if (createdExam && createdExam.id) {
          setSelectedExamId(createdExam.id);
          fetchExamMonitoring(createdExam.id);
        }
      }
      setShowCreateExamModal(false);
      setEditingExamId(null);
      fetchInitialData();
      toast.success(editingExamId ? 'විභාග ප්‍රශ්න පත්‍රය සාර්ථකව යාවත්කාලීන කරන ලදී!' : 'නව විභාග ප්‍රශ්න පත්‍රය සාර්ථකව සුරකින ලදී!');
    } catch (e: any) {
      console.error(e);
      toast.error(`විභාගය සුරැකීමට නොහැකි විය: ${e.message || 'දෝෂයකි'}`);
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleTogglePublish = async (exam: Exam) => {
    try {
      const nextState = !exam.published;
      await examsApi.updateExam(exam.id, {
        ...exam,
        published: nextState,
        status: nextState ? 'published' : 'draft',
      });
      invalidateCache('/api/exams');
      fetchInitialData();
      if (nextState) {
        toast.success('විභාග ප්‍රශ්න පත්‍රය සාර්ථකව සක්‍රීය කරන ලදී (PUBLISHED - ශිෂ්‍යයින්ට පෙනේ)');
      } else {
        toast.info('විභාග ප්‍රශ්න පත්‍රය ⏸ DRAFT (UNPUBLISHED) තත්ත්වයට පත්කරන ලදී. ශිෂ්‍යයින්ට දිස් නොවේ.');
      }
    } catch (e: any) {
      console.error('Toggle publish error:', e);
      toast.error('ප්‍රශ්න පත්‍රයේ තත්ත්වය වෙනස් කිරීමට නොහැකි විය.');
    }
  };

  const handleDuplicateExam = async (exam: Exam) => {
    const duplicatedPayload = {
      ...exam,
      id: undefined,
      title: `${exam.title} (Copy)`,
      titleSinhala: exam.titleSinhala ? `${exam.titleSinhala} (පිටපත)` : undefined,
      teacherId: user?.id || user?.customId || 'user-teacher-01',
      published: false,
    };
    try {
      await examsApi.createExam(duplicatedPayload);
      invalidateCache('/api/exams');
      fetchInitialData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExam = (examId: string) => {
    const targetExam = exams.find((e) => e.id === examId);
    const examTitle = targetExam ? targetExam.title : 'මෙම විභාග ප්‍රශ්න පත්‍රය';
    askConfirmation({
      title: 'විභාග ප්‍රශ්න පත්‍රය ඉවත් කිරීම',
      message: `"${examTitle}" විභාග ප්‍රශ්න පත්‍රය සහ ඊට අදාළ ලකුණු වාර්තා ඉවත් කිරීමට ඔබට විශ්වාසද?`,
      action: async () => {
        setDeletingExamId(null);
        setSelectedExamId((prev) => (prev === examId ? '' : prev));
        setExams((prev) => prev.filter((e) => e.id !== examId));
        invalidateCache('/api/exams');
        invalidateCache('/api/submissions');
        try {
          await examsApi.deleteExam(examId);
          await fetchInitialData();
          toast.success('විභාග ප්‍රශ්න පත්‍රය සාර්ථකව ඉවත් කරන ලදී!');
        } catch (e: any) {
          console.error('Error deleting exam:', e);
          await fetchInitialData();
          toast.error('විභාගය ඉවත් කිරීමට නොහැකි විය');
        }
      },
    });
  };

  const handleDeleteMaterial = (matId: string) => {
    const targetMat = materials.find((m) => m.id === matId);
    const matTitleStr = targetMat ? (targetMat.titleSinhala || targetMat.title) : 'මෙම අධ්‍යයන සටහන';
    askConfirmation({
      title: 'අධ්‍යයන සටහන ඉවත් කිරීම',
      message: `"${matTitleStr}" අධ්‍යයන සටහන ඉවත් කිරීමට ඔබට විශ්වාසද?`,
      action: async () => {
        setDeletingMaterialId(null);
        setMaterials((prev) => prev.filter((m) => m.id !== matId));
        invalidateCache('/api/materials');
        try {
          await materialsApi.deleteMaterial(matId);
          fetchInitialData();
          toast.success('අධ්‍යයන සටහන සාර්ථකව ඉවත් කරන ලදී!');
        } catch (e: any) {
          console.error('Error deleting material:', e);
          fetchInitialData();
          toast.error('අධ්‍යයන සටහන ඉවත් කිරීමට නොහැකි විය');
        }
      },
    });
  };

  const handleMaterialFileSelect = (file: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error('තෝරාගත් ලිපිය 20MB ඉක්මවයි. කරුණාකර කුඩා ලිපියක් තෝරන්න.');
      return;
    }
    setUploadedMatFile(file);
    setMatFileName(file.name);

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr =
      file.size >= 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;
    setMatFileSize(sizeStr);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') setMatType('pdf');
    else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) setMatType('audio');
    else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) setMatType('video');
    else if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) setMatType('notes');
    else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) setMatType('notes');

    if (!matTitle) {
      const titleClean = file.name.replace(/\.[^/.]+$/, '');
      setMatTitle(titleClean);
      if (!matTitleSinhala) setMatTitleSinhala(titleClean);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setMatFileBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetMaterialForm = () => {
    setEditingMaterial(null);
    setMatTitle('');
    setMatTitleSinhala('');
    setMatFileUrl('');
    setMatDescription('');
    setUploadedMatFile(null);
    setMatFileBase64(null);
    setMatFileName('');
    setMatFileSize('');
    setMatUploadProgress(null);
  };

  const openUploadMaterialModal = () => {
    resetMaterialForm();
    if (assignedClasses.length > 0) setMatClassId(assignedClasses[0].id);
    if (assignedSubjects.length > 0) setMatSubjectId(assignedSubjects[0].id);
    setShowUploadModal(true);
  };

  const handleEditMaterial = (material: StudyMaterial) => {
    setEditingMaterial(material);
    setMatTitle(material.title || '');
    setMatTitleSinhala(material.titleSinhala || material.title || '');
    setMatClassId(material.classId || 'all');
    setMatSubjectId(material.subjectId || 'all');
    setMatType(material.type || 'pdf');
    setMatFileUrl(material.fileUrl || '');
    setMatDescription(material.description || '');
    setUploadedMatFile(null);
    setMatFileBase64(null);
    setMatFileName(material.fileName || '');
    setMatFileSize(material.fileSize || '');
    setMatUploadProgress(null);
    setShowUploadModal(true);
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!matTitle.trim()) {
      toast.warning('කරුණාකර අධ්‍යයන සටහනේ මාතෘකාව (Title) ඇතුළත් කරන්න.');
      return;
    }

    setIsSubmittingMat(true);
    setMatUploadProgress(null);

    try {
      let finalFileUrl = matFileUrl.trim();

      if (uploadedMatFile) {
        try {
          const uploadedUrl = await uploadFileWithProgress(uploadedMatFile, (progress) => {
            setMatUploadProgress(progress);
          });
          if (uploadedUrl) {
            finalFileUrl = uploadedUrl;
          }
        } catch (uploadErr) {
          console.warn('Backend file upload fallback to base64:', uploadErr);
          if (matFileBase64) finalFileUrl = matFileBase64;
        }
      }

      if (!finalFileUrl && matFileBase64) {
        finalFileUrl = matFileBase64;
      }

      if (!finalFileUrl) {
        finalFileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      }

      const finalClassId = matClassId || assignedClasses[0]?.id || 'all';
      const finalSubjectId = matSubjectId || assignedSubjects[0]?.id || 'all';

      const payload = {
        title: matTitle.trim(),
        titleSinhala: matTitleSinhala.trim() || matTitle.trim(),
        subjectId: finalSubjectId,
        classId: finalClassId,
        uploadedByTeacherId: editingMaterial
          ? editingMaterial.uploadedByTeacherId
          : user?.id || user?.customId || 'teacher',
        type: matType,
        fileUrl: finalFileUrl,
        fileName: matFileName || (uploadedMatFile ? uploadedMatFile.name : undefined),
        fileSize: matFileSize || undefined,
        description: matDescription.trim(),
        dateUploaded: editingMaterial
          ? editingMaterial.dateUploaded
          : new Date().toISOString().split('T')[0],
      };

      if (editingMaterial) {
        await materialsApi.updateMaterial(editingMaterial.id, payload);
      } else {
        await materialsApi.createMaterial(payload);
      }

      setShowUploadModal(false);
      resetMaterialForm();
      fetchInitialData();
      toast.success(editingMaterial ? 'අධ්‍යයන සටහන සාර්ථකව යාවත්කාලීන කරන ලදී!' : 'නව අධ්‍යයන සටහන සාර්ථකව එක් කරන ලදී!');
    } catch (e: any) {
      console.error('Failed to save study material:', e);
      toast.error(`සටහන සුරැකීමට නොහැකි විය: ${e.message || 'සර්වර් සම්බන්ධතා දෝෂයකි.'}`);
    } finally {
      setIsSubmittingMat(false);
      setMatUploadProgress(null);
    }
  };

  const filteredMaterials = React.useMemo(() => {
    return assignedMaterials.filter((m) => {
      if (matSearchQuery.trim()) {
        const q = matSearchQuery.toLowerCase().trim();
        const matchTitle =
          (m.title || '').toLowerCase().includes(q) ||
          (m.titleSinhala || '').toLowerCase().includes(q);
        const matchDesc = (m.description || '').toLowerCase().includes(q);
        const matchFile = (m.fileName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchFile) return false;
      }

      if (matClassFilter && matClassFilter !== 'all') {
        if (m.classId !== matClassFilter && m.classId !== 'all' && m.classId !== 'ALL')
          return false;
      }

      if (matSubjectFilter && matSubjectFilter !== 'all') {
        if (m.subjectId !== matSubjectFilter && m.subjectId !== 'all' && m.subjectId !== 'ALL')
          return false;
      }

      if (matTypeFilter && matTypeFilter !== 'all') {
        if (m.type !== matTypeFilter) return false;
      }

      return true;
    });
  }, [assignedMaterials, matSearchQuery, matClassFilter, matSubjectFilter, matTypeFilter]);

  // Set default form selections based on assigned scope
  useEffect(() => {
    if (assignedClasses.length > 0) {
      setExamClassId((prev) => prev || assignedClasses[0].id);
      setMatClassId((prev) => prev || assignedClasses[0].id);
    }
  }, [assignedClasses]);

  useEffect(() => {
    if (assignedSubjects.length > 0) {
      setExamSubjectId((prev) => prev || assignedSubjects[0].id);
      setMatSubjectId((prev) => prev || assignedSubjects[0].id);
    }
  }, [assignedSubjects]);

  // Computed Roster List filtered cleanly by Class, Search, and Live Exam Submissions
  const rosterViewList = React.useMemo(() => {
    let baseList = assignedStudents.map((st) => {
      const studentClass = classes.find((c) => c.id === st.classId);
      
      // Match status and submission from monitoringData if active
      const matchStatus = monitoringData?.studentStatuses?.find(
        (m: any) => m.id === st.id || (m.customId && m.customId === st.customId)
      );

      return {
        id: st.id,
        customId: st.customId || st.id,
        name: st.name,
        monkName: st.monkName,
        monkStatus: (st.monkStatus === 'monk' || (!st.monkStatus && (
          (st.monkName && /හිමි|Ven|Thero|සාමණේර/i.test(st.monkName)) ||
          (st.name && /හිමි|Ven|Thero|සාමණේර/i.test(st.name))
        ))) ? 'monk' : 'lay',
        phone: st.phone,
        email: st.email,
        avatar: st.avatar,
        className: studentClass ? studentClass.name : 'පිරිවෙන් පන්තිය',
        classCode: studentClass?.code || '',
        classId: st.classId,
        status: matchStatus?.status || 'not_started',
        score: matchStatus?.score ?? null,
        submission: matchStatus?.submission || null,
      };
    });

    // Apply Search Filter
    if (rosterSearch && rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase().trim();
      baseList = baseList.filter(
        (st) =>
          (st.name && st.name.toLowerCase().includes(q)) ||
          (st.monkName && st.monkName.toLowerCase().includes(q)) ||
          (st.customId && st.customId.toLowerCase().includes(q)) ||
          (st.id && st.id.toLowerCase().includes(q)) ||
          (st.phone && st.phone.toLowerCase().includes(q)) ||
          (st.email && st.email.toLowerCase().includes(q))
      );
    }

    // Apply Class Filter
    if (rosterClassFilter && rosterClassFilter !== 'all') {
      baseList = baseList.filter(
        (st) => st.classId === rosterClassFilter || st.className === rosterClassFilter
      );
    }

    return baseList;
  }, [assignedStudents, classes, rosterSearch, rosterClassFilter, monitoringData]);

  const handlePullRefresh = async () => {
    try {
      await fetchInitialData();
    } catch (e) {}
  };

  return (
    <PullToRefreshWrapper onRefresh={handlePullRefresh} className="min-h-full">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-12 space-y-4 sm:space-y-6 overflow-x-clip">
        <div
          key={activeTab}
          className="w-full space-y-4 sm:space-y-6 animate-fade-in-fast"
        >
          {/* 1. OVERVIEW / PROFILE TAB */}
          {activeTab === 'overview' && (
            <OverviewTab
              user={user}
              classes={classes}
              assignedClasses={assignedClasses}
              assignedSubjects={assignedSubjects}
              assignedStudents={assignedStudents}
              assignedExams={assignedExams}
              assignedMaterials={assignedMaterials}
              handleTabNavigate={handleTabNavigate}
              openUploadMaterialModal={openUploadMaterialModal}
              openCreateExamModal={openCreateExamModal}
              setRosterClassFilter={setRosterClassFilter}
              onOpenTimetable={() => handleTabNavigate('timetable')}
            />
          )}

          {/* 2. DEDICATED TIMETABLE TAB */}
          {activeTab === 'timetable' && (
            <TimetableTab
              user={user}
              classes={classes}
              assignedClasses={assignedClasses}
              assignedSubjects={assignedSubjects}
              onNavigate={handleTabNavigate}
            />
          )}

          {/* 2. EXAM MONITORING TAB */}
          {activeTab === 'monitoring' && (
            <MonitoringTab
              teacherExams={teacherExams}
              selectedExamId={selectedExamId}
              setSelectedExamId={setSelectedExamId}
              setShowClassReportModal={setShowClassReportModal}
              fetchExamMonitoring={fetchExamMonitoring}
              handleDeleteSelectedExam={handleDeleteSelectedExam}
              monitoringData={monitoringData}
              handleOpenSubmissionModal={handleOpenSubmissionModal}
              setSelectedStudentReport={setSelectedStudentReport}
            />
          )}

          {/* 3. ROSTER TAB */}
          {activeTab === 'roster' && (
            <RosterTab
              rosterViewList={rosterViewList}
              rosterSearch={rosterSearch}
              setRosterSearch={setRosterSearch}
              rosterClassFilter={rosterClassFilter}
              setRosterClassFilter={setRosterClassFilter}
              assignedClasses={assignedClasses}
              assignedExams={assignedExams}
              selectedExamId={selectedExamId}
              setSelectedExamId={setSelectedExamId}
              classes={classes}
              handleOpenSubmissionModal={handleOpenSubmissionModal}
              setSelectedStudentReport={setSelectedStudentReport}
            />
          )}

          {/* 4. EXAMS BUILDER TAB */}
          {activeTab === 'exams' && (
            <ExamsTab
              assignedExams={assignedExams}
              classes={classes}
              subjects={subjects}
              openCreateExamModal={openCreateExamModal}
              handleTogglePublish={handleTogglePublish}
              openEditExamModal={openEditExamModal}
              handleDuplicateExam={handleDuplicateExam}
              setPrintablePaper={setPrintablePaper}
              setCustomPaperTitle={setCustomPaperTitle}
              setCustomInstituteHeader={setCustomInstituteHeader}
              setCustomInstituteEnglish={setCustomInstituteEnglish}
              user={user}
              deletingExamId={deletingExamId}
              setDeletingExamId={setDeletingExamId}
              handleDeleteExam={handleDeleteExam}
              setSelectedExamId={setSelectedExamId}
              setActiveTab={setActiveTab}
            />
          )}

          {/* 5. STUDY MATERIALS TAB */}
          {activeTab === 'materials' && (
            <MaterialsTab
              filteredMaterials={filteredMaterials}
              matSearchQuery={matSearchQuery}
              setMatSearchQuery={setMatSearchQuery}
              matClassFilter={matClassFilter}
              setMatClassFilter={setMatClassFilter}
              matSubjectFilter={matSubjectFilter}
              setMatSubjectFilter={setMatSubjectFilter}
              matTypeFilter={matTypeFilter}
              setMatTypeFilter={setMatTypeFilter}
              assignedClasses={assignedClasses}
              assignedSubjects={assignedSubjects}
              getAssignedSubjectsForClass={getAssignedSubjectsForClass}
              classes={classes}
              subjects={subjects}
              resetMaterialForm={resetMaterialForm}
              matClassId={matClassId}
              setMatClassId={setMatClassId}
              matSubjectId={matSubjectId}
              setMatSubjectId={setMatSubjectId}
              setShowUploadModal={setShowUploadModal}
              setViewingTeacherMaterial={setViewingTeacherMaterial}
              handleEditMaterial={handleEditMaterial}
              deletingMaterialId={deletingMaterialId}
              setDeletingMaterialId={setDeletingMaterialId}
              handleDeleteMaterial={handleDeleteMaterial}
            />
          )}

          {/* 6. SETTINGS & APP SPECIFICATIONS TAB */}
          {activeTab === 'settings' && (
            <SettingsTab
              user={user}
              assignedClasses={assignedClasses}
              assignedSubjects={assignedSubjects}
              onOpenTimetable={() => handleTabNavigate('timetable')}
              onRefreshData={fetchInitialData}
            />
          )}
        </div>

      {/* ========================================================= */}
      {/*                   MODULAR MODAL DIALOGS                   */}
      {/* ========================================================= */}

      {/* 1. Exam Creator Modal */}
      {showCreateExamModal && (
        <CreateExamModal
          showCreateExamModal={showCreateExamModal}
          setShowCreateExamModal={setShowCreateExamModal}
          editingExamId={editingExamId}
          examBuilderSubTab={examBuilderSubTab}
          setExamBuilderSubTab={setExamBuilderSubTab}
          paperPreviewMode={paperPreviewMode}
          setPaperPreviewMode={setPaperPreviewMode}
          examTitle={examTitle}
          setExamTitle={setExamTitle}
          examTitleSinhala={examTitleSinhala}
          setExamTitleSinhala={setExamTitleSinhala}
          examClassId={examClassId}
          setExamClassId={setExamClassId}
          examSubjectId={examSubjectId}
          setExamSubjectId={setExamSubjectId}
          durationMinutes={durationMinutes}
          setDurationMinutes={setDurationMinutes}
          passingMarks={passingMarks}
          setPassingMarks={setPassingMarks}
          attemptsAllowed={attemptsAllowed}
          setAttemptsAllowed={setAttemptsAllowed}
          startDate={startDate}
          setStartDate={setStartDate}
          instructions={instructions}
          setInstructions={setInstructions}
          assignedClasses={assignedClasses}
          assignedSubjects={assignedSubjects}
          getAssignedSubjectsForClass={getAssignedSubjectsForClass}
          questionsList={questionsList}
          setQuestionsList={setQuestionsList}
          isExtractingPaper={isExtractingPaper}
          paperExtractSuccessMsg={paperExtractSuccessMsg}
          setPaperExtractSuccessMsg={setPaperExtractSuccessMsg}
          paperExtractErrorMsg={paperExtractErrorMsg}
          setPaperExtractErrorMsg={setPaperExtractErrorMsg}
          paperFilePreview={paperFilePreview}
          uploadingPaperFile={uploadingPaperFile}
          handleExtractPaperFromUpload={handleExtractPaperFromUpload}
          handleResetPaperVision={handleResetPaperVision}
          handleExportQuestionsToCsv={handleExportQuestionsToCsv}
          handleEqualizeMarks={handleEqualizeMarks}
          handleClearAllQuestions={handleClearAllQuestions}
          handleAddQuestionToForm={handleAddQuestionToForm}
          handleMoveQuestion={handleMoveQuestion}
          handleDuplicateQuestion={handleDuplicateQuestion}
          handleDeleteQuestion={handleDeleteQuestion}
          sheetsPastedData={sheetsPastedData}
          setSheetsPastedData={setSheetsPastedData}
          handlePasteFromClipboard={handlePasteFromClipboard}
          handleFileUploadCsv={handleFileUploadCsv}
          handleParseSheetsData={handleParseSheetsData}
          parsedCsvQuestions={parsedCsvQuestions}
          setParsedCsvQuestions={setParsedCsvQuestions}
          csvParseSuccessMsg={csvParseSuccessMsg}
          setCsvParseSuccessMsg={setCsvParseSuccessMsg}
          csvParseErrorMsg={csvParseErrorMsg}
          setCsvParseErrorMsg={setCsvParseErrorMsg}
          handleSetAllParsedMarks={handleSetAllParsedMarks}
          handleBalanceParsedMarks={handleBalanceParsedMarks}
          handleAddBlankParsedQuestion={handleAddBlankParsedQuestion}
          handleConfirmImportCsvQuestions={handleConfirmImportCsvQuestions}
          handleUpdateParsedQuestion={handleUpdateParsedQuestion}
          handleDeleteParsedQuestion={handleDeleteParsedQuestion}
          handleFileUploadJson={handleFileUploadJson}
          handleConfirmImportStagedJson={handleConfirmImportStagedJson}
          handleCopyRawJsonToClipboard={handleCopyRawJsonToClipboard}
          copiedRawJsonSuccess={copiedRawJsonSuccess}
          handleDownloadRawJsonFile={handleDownloadRawJsonFile}
          handleClearRawJsonData={handleClearRawJsonData}
          jsonImportSuccessMsg={jsonImportSuccessMsg}
          jsonImportErrorMsg={jsonImportErrorMsg}
          isRawJsonCleared={isRawJsonCleared}
          setIsRawJsonCleared={setIsRawJsonCleared}
          rawAiJsonContent={rawAiJsonContent}
          setRawAiJsonContent={setRawAiJsonContent}
          formatQuestionsTo9ColumnJson={formatQuestionsTo9ColumnJson}
          handleSaveExam={handleSaveExam}
          isSavingExam={isSavingExam}
        />
      )}

      {/* 2. Sheets Paste Modal */}
      {showSheetsPasteModal && (
        <SheetsPasteModal
          isOpen={showSheetsPasteModal}
          onClose={() => setShowSheetsPasteModal(false)}
          sheetsPastedData={sheetsPastedData}
          setSheetsPastedData={setSheetsPastedData}
          handleImportFromPastedGoogleSheets={handleImportFromPastedGoogleSheets}
        />
      )}

      {/* 3. Raw AI JSON Modal */}
      {rawAiJsonModalOpen && (
        <RawAiJsonModal
          isOpen={rawAiJsonModalOpen}
          onClose={() => setRawAiJsonModalOpen(false)}
          rawAiJsonContent={rawAiJsonContent}
          questionsList={questionsList}
          handleCopyRawJsonToClipboard={handleCopyRawJsonToClipboard}
          copiedRawJsonSuccess={copiedRawJsonSuccess}
          handleDownloadRawJsonFile={handleDownloadRawJsonFile}
        />
      )}

      {/* 4. Upload JSON Modal */}
      {uploadJsonModalOpen && (
        <UploadJsonModal
          isOpen={uploadJsonModalOpen}
          onClose={() => setUploadJsonModalOpen(false)}
          jsonInputTab={jsonInputTab}
          setJsonInputTab={setJsonInputTab}
          pastedJsonText={pastedJsonText}
          setPastedJsonText={setPastedJsonText}
          jsonImportSuccessMsg={jsonImportSuccessMsg}
          jsonImportErrorMsg={jsonImportErrorMsg}
          handleFileUploadJson={handleFileUploadJson}
          handleLoadJsonPreview={handleLoadJsonPreview}
        />
      )}

      {/* 5. Printable Paper Modal */}
      {printablePaper && (
        <PrintablePaperModal
          paper={printablePaper}
          onClose={() => setPrintablePaper(null)}
          subjects={subjects}
          classes={classes}
          showMarkingSchemeInPrint={showMarkingSchemeInPrint}
          setShowMarkingSchemeInPrint={setShowMarkingSchemeInPrint}
          customInstituteHeader={customInstituteHeader}
          customInstituteEnglish={customInstituteEnglish}
        />
      )}

      {/* 6. View Study Material Modal */}
      {viewingTeacherMaterial && (
        <ViewMaterialModal
          material={viewingTeacherMaterial}
          onClose={() => setViewingTeacherMaterial(null)}
        />
      )}

      {/* 7. Upload / Edit Material Modal */}
      {showUploadModal && (
        <UploadMaterialModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
            resetMaterialForm();
          }}
          editingMaterial={editingMaterial}
          assignedClasses={assignedClasses}
          assignedSubjects={assignedSubjects}
          getAssignedSubjectsForClass={getAssignedSubjectsForClass}
          matTitle={matTitle}
          setMatTitle={setMatTitle}
          matClassId={matClassId}
          setMatClassId={setMatClassId}
          matSubjectId={matSubjectId}
          setMatSubjectId={setMatSubjectId}
          matType={matType}
          setMatType={setMatType}
          matFileUrl={matFileUrl}
          setMatFileUrl={setMatFileUrl}
          matDescription={matDescription}
          setMatDescription={setMatDescription}
          uploadedMatFile={uploadedMatFile}
          setUploadedMatFile={setUploadedMatFile}
          matFileBase64={matFileBase64}
          setMatFileBase64={setMatFileBase64}
          matFileName={matFileName}
          setMatFileName={setMatFileName}
          matFileSize={matFileSize}
          setMatFileSize={setMatFileSize}
          isSubmittingMat={isSubmittingMat}
          matUploadProgress={matUploadProgress}
          handleMaterialFileSelect={handleMaterialFileSelect}
          handleUploadMaterial={handleUploadMaterial}
          resetMaterialForm={resetMaterialForm}
        />
      )}

      {/* 8. Submission Modal */}
      {viewSubmission && (
        <SubmissionModal
          submission={viewSubmission}
          monitoringData={monitoringData}
          onClose={() => setViewSubmission(null)}
          manualScoreInput={manualScoreInput}
          setManualScoreInput={setManualScoreInput}
          teacherFeedbackInput={teacherFeedbackInput}
          setTeacherFeedbackInput={setTeacherFeedbackInput}
          handleSaveTeacherFeedback={handleSaveTeacherFeedback}
          isSavingFeedback={isSavingFeedback}
          feedbackSaveSuccess={feedbackSaveSuccess}
        />
      )}

      {/* 9. Class Report Modal */}
      {showClassReportModal && (
        <ClassReportModal
          isOpen={showClassReportModal}
          onClose={() => setShowClassReportModal(false)}
          monitoringData={monitoringData}
          assignedClasses={assignedClasses}
          user={user}
        />
      )}

      {/* 10. Student Report Modal */}
      {selectedStudentReport && (
        <StudentReportModal
          student={selectedStudentReport}
          monitoringData={monitoringData}
          onClose={() => setSelectedStudentReport(null)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmConfig.isOpen && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={confirmConfig.onConfirm}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          variant={confirmConfig.variant}
          isLoading={confirmConfig.isLoading}
        />
      )}
      </div>
    </PullToRefreshWrapper>
  );
};
