import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PirivenaClass, Subject, User, Exam, StudyMaterial, ExamSubmission } from '../types';
import { classesApi, subjectsApi, examsApi, materialsApi, teachersApi } from '../api';
import { appLifecycleManager } from '../services/appLifecycleManager';

export interface UseStudentPortalDataParams {
  classId?: string;
  subjectId?: string;
  autoRefreshIntervalMs?: number;
}

export interface StudentPortalDataState {
  exams: Exam[];
  materials: StudyMaterial[];
  classes: PirivenaClass[];
  subjects: Subject[];
  teachers: User[];
  completedSubmissions: ExamSubmission[];
  completedExamIds: string[];
  isLoading: boolean;
  error: string | null;
}

export interface UseStudentPortalDataReturn {
  exams: Exam[];
  materials: StudyMaterial[];
  classes: PirivenaClass[];
  subjects: Subject[];
  teachers: User[];
  completedSubmissions: ExamSubmission[];
  completedExamIds: string[];
  studentClass: PirivenaClass | null;
  availableSubjects: Subject[];
  availableExams: Exam[];
  availableMaterials: StudyMaterial[];
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setCompletedExamIds: React.Dispatch<React.SetStateAction<string[]>>;
  setCompletedSubmissions: React.Dispatch<React.SetStateAction<ExamSubmission[]>>;
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  setMaterials: React.Dispatch<React.SetStateAction<StudyMaterial[]>>;
  setClasses?: React.Dispatch<React.SetStateAction<PirivenaClass[]>>;
  setSubjects?: React.Dispatch<React.SetStateAction<Subject[]>>;
  setTeachers?: React.Dispatch<React.SetStateAction<User[]>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Memory Shared Metadata Cache for Static Pirivena ERP Data (Classes, Subjects, Teachers)
// Avoids redownloading static datasets on every student refresh.
// ─────────────────────────────────────────────────────────────────────────────
interface MetadataCacheItem<T> {
  data: T;
  timestamp: number;
}

const METADATA_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

let classesCache: MetadataCacheItem<PirivenaClass[]> | null = null;
let subjectsCache: MetadataCacheItem<Subject[]> | null = null;
let teachersCache: MetadataCacheItem<User[]> | null = null;

export function invalidateMetadataCache(key?: 'classes' | 'subjects' | 'teachers' | 'all') {
  if (!key || key === 'all') {
    classesCache = null;
    subjectsCache = null;
    teachersCache = null;
  } else if (key === 'classes') {
    classesCache = null;
  } else if (key === 'subjects') {
    subjectsCache = null;
  } else if (key === 'teachers') {
    teachersCache = null;
  }
}

export async function getCachedOrFetchClasses(): Promise<PirivenaClass[]> {
  const now = Date.now();
  if (classesCache && now - classesCache.timestamp < METADATA_CACHE_TTL_MS) {
    return classesCache.data;
  }
  const data = await classesApi.getClasses().catch(() => []);
  const safeData = Array.isArray(data) ? data : [];
  if (safeData.length > 0) {
    classesCache = { data: safeData, timestamp: now };
  }
  return safeData;
}

export async function getCachedOrFetchSubjects(): Promise<Subject[]> {
  const now = Date.now();
  if (subjectsCache && now - subjectsCache.timestamp < METADATA_CACHE_TTL_MS) {
    return subjectsCache.data;
  }
  const data = await subjectsApi.getSubjects().catch(() => []);
  const safeData = Array.isArray(data) ? data : [];
  if (safeData.length > 0) {
    subjectsCache = { data: safeData, timestamp: now };
  }
  return safeData;
}

export async function getCachedOrFetchTeachers(): Promise<User[]> {
  const now = Date.now();
  if (teachersCache && now - teachersCache.timestamp < METADATA_CACHE_TTL_MS) {
    return teachersCache.data;
  }
  const data = await teachersApi.getTeachers().catch(() => []);
  const safeData = Array.isArray(data) ? data : [];
  if (safeData.length > 0) {
    teachersCache = { data: safeData, timestamp: now };
  }
  return safeData;
}

function parseArrayField(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
      } catch {}
    }
    return trimmed.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

export function useStudentPortalData({
  classId,
  subjectId,
  autoRefreshIntervalMs = 0,
}: UseStudentPortalDataParams = {}): UseStudentPortalDataReturn {
  const { user } = useAuth();

  // Consolidated single atomic state holding all student portal data
  const [portalState, setPortalState] = useState<StudentPortalDataState>(() => ({
    exams: [],
    materials: [],
    classes: classesCache?.data || [],
    subjects: subjectsCache?.data || [],
    teachers: teachersCache?.data || [],
    completedSubmissions: [],
    completedExamIds: [],
    isLoading: true,
    error: null,
  }));

  const {
    exams,
    materials,
    classes,
    subjects,
    teachers,
    completedSubmissions,
    completedExamIds,
    isLoading,
    error,
  } = portalState;

  // Determine student's enrolled class object
  const studentClass = useMemo(() => {
    if (!user) return null;
    const stuClassId = String(user.classId || user.pirivenaClass || '').trim();
    if (!stuClassId) return null;
    return (
      classes.find((c) => {
        const classKeys = [
          c.id,
          c.code,
          c.name,
          c.nameSinhala,
          (c as any).className,
          (c as any).classNameSinhala,
        ]
          .filter(Boolean)
          .map((k) => String(k).trim());
        return classKeys.includes(stuClassId);
      }) || null
    );
  }, [classes, user]);

  // Compute student's authorized enrolled subjects (Dynamic Live Class Subjects + Electives)
  const availableSubjects = useMemo(() => {
    if (!user) return [];

    // 1. Get all subjects assigned to student's Class
    const classSubjs = parseArrayField(studentClass?.subjects);
    const classSubjSet = new Set(classSubjs.map((k: any) => String(k).trim()));

    // 2. Also get any individually assigned/elective subjects
    let explicitSubjIds = parseArrayField(user.subjectsAssigned);
    if (explicitSubjIds.length === 0 && (user as any)?.studentSubjects) {
      const stuSubjs = (user as any).studentSubjects;
      if (Array.isArray(stuSubjs)) {
        explicitSubjIds = stuSubjs.map((s: any) => s.subjectId || s).filter(Boolean).map(String);
      }
    }
    const explicitSet = new Set(explicitSubjIds.map((k: any) => String(k).trim()));

    // 3. Union of Class Subjects + Student Electives
    const combinedKeys = new Set([...classSubjSet, ...explicitSet]);

    if (combinedKeys.size > 0) {
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
        return sKeys.some((k) => combinedKeys.has(k));
      });
    }

    // Strict Security: No unsafe fallback to all subjects when authorization data is missing
    return [];
  }, [subjects, studentClass, user]);

  // 1. Precomputed Normalized Student Class Keys Set for O(1) matching
  const studentClassKeySet = useMemo(() => {
    if (!user) return new Set<string>();
    const keys = [
      user.classId,
      (user as any).pirivenaClass,
      studentClass?.id,
      studentClass?.code,
      studentClass?.name,
      studentClass?.nameSinhala,
      (studentClass as any)?.className,
      (studentClass as any)?.classNameSinhala,
    ]
      .filter(Boolean)
      .map((k) => String(k).trim().toLowerCase());
    return new Set(keys);
  }, [user?.classId, (user as any)?.pirivenaClass, studentClass]);

  // 2. Precomputed Normalized Authorized Subject Keys Set for O(1) matching
  const authorizedSubjectKeySet = useMemo(() => {
    const keys: string[] = [];
    for (const s of availableSubjects) {
      if (s.id) keys.push(s.id.toLowerCase().trim());
      if (s.code) keys.push(s.code.toLowerCase().trim());
      if (s.name) keys.push(s.name.toLowerCase().trim());
      if (s.nameSinhala) keys.push(s.nameSinhala.toLowerCase().trim());
      if ((s as any).subjectName) keys.push(String((s as any).subjectName).toLowerCase().trim());
      if ((s as any).subjectNameSinhala) keys.push(String((s as any).subjectNameSinhala).toLowerCase().trim());
    }
    return new Set(keys);
  }, [availableSubjects]);

  // Verify session credentials & authorization for the requested classId & subjectId parameters
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    if (user.role !== 'student') return false;

    // If a specific classId parameter is requested, ensure student belongs to it
    if (classId && classId !== 'all' && classId !== 'ALL') {
      const targetClassKey = String(classId).trim().toLowerCase();
      if (!studentClassKeySet.has(targetClassKey)) {
        return false;
      }
    }

    // If a specific subjectId parameter is requested, ensure student is enrolled in it
    if (subjectId && subjectId !== 'all' && subjectId !== 'ALL') {
      const targetSubjectKey = String(subjectId).trim().toLowerCase();
      if (!authorizedSubjectKeySet.has(targetSubjectKey)) {
        return false;
      }
    }

    return true;
  }, [user, classId, subjectId, studentClassKeySet, authorizedSubjectKeySet]);

  // Main data fetching routine: utilizes cached static metadata and fetches dynamic student data in parallel
  const fetchData = useCallback(async () => {
    if (!user) return;
    setPortalState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const studentId = user.id || user.customId || 'user-student-01';
      const effectiveClassId = classId && classId !== 'all' ? classId : (user.classId || user.pirivenaClass || undefined);
      const effectiveSubjectId = subjectId && subjectId !== 'all' ? subjectId : undefined;

      const [examsData, matsData, classesData, subjsData, serverSubs, teachersData] =
        await Promise.all([
          examsApi.getExams(effectiveClassId, effectiveSubjectId).catch(() => []),
          materialsApi.getMaterials(effectiveClassId, effectiveSubjectId).catch(() => []),
          getCachedOrFetchClasses(),
          getCachedOrFetchSubjects(),
          examsApi.getSubmissions(undefined, studentId, effectiveClassId, effectiveSubjectId).catch(() => []),
          getCachedOrFetchTeachers(),
        ]);

      const resolvedSubmissions = Array.isArray(serverSubs) ? serverSubs : [];
      const serverExamIds = resolvedSubmissions.map((s: any) => s.examId).filter(Boolean);

      setPortalState((prev) => ({
        ...prev,
        exams: Array.isArray(examsData) ? examsData : prev.exams,
        materials: Array.isArray(matsData) ? matsData : prev.materials,
        classes: Array.isArray(classesData) ? classesData : prev.classes,
        subjects: Array.isArray(subjsData) ? subjsData : prev.subjects,
        teachers: Array.isArray(teachersData) ? teachersData : prev.teachers,
        completedSubmissions: resolvedSubmissions,
        completedExamIds: serverExamIds,
        isLoading: false,
        error: null,
      }));
    } catch (err: any) {
      console.error('Error fetching student portal data:', err);
      setPortalState((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to fetch student portal data',
      }));
    }
  }, [user?.id, user?.customId, user?.classId, user?.pirivenaClass, classId, subjectId]);

  // Setup auto-refresh and broadcast event listeners
  useEffect(() => {
    fetchData();

    let cleanupPoll: (() => void) | null = null;
    if (autoRefreshIntervalMs > 0) {
      cleanupPoll = appLifecycleManager.registerPollTask(
        'student_portal_data_poll',
        fetchData,
        autoRefreshIntervalMs,
        { runImmediately: false, runImmediatelyOnResume: true, allowBackground: false }
      );
    }

    let debounceTimer: any = null;
    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchData();
      }, 300);
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('pirivena_realtime_channel');
      bc.onmessage = (event) => {
        if (event.data === 'refresh-portal-data') {
          debouncedFetch();
        }
      };
    } catch (e) {}

    const handleWindowSync = () => debouncedFetch();

    const handleClassesUpdated = () => {
      invalidateMetadataCache('classes');
      debouncedFetch();
    };

    const handleSubjectsUpdated = () => {
      invalidateMetadataCache('subjects');
      debouncedFetch();
    };

    const handleUsersUpdated = () => {
      invalidateMetadataCache('teachers');
      debouncedFetch();
    };

    window.addEventListener('refresh-portal-data', handleWindowSync);
    window.addEventListener('pirivena-classes-updated', handleClassesUpdated);
    window.addEventListener('pirivena-subjects-updated', handleSubjectsUpdated);
    window.addEventListener('pirivena-users-updated', handleUsersUpdated);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (cleanupPoll) cleanupPoll();
      if (bc) bc.close();
      window.removeEventListener('refresh-portal-data', handleWindowSync);
      window.removeEventListener('pirivena-classes-updated', handleClassesUpdated);
      window.removeEventListener('pirivena-subjects-updated', handleSubjectsUpdated);
      window.removeEventListener('pirivena-users-updated', handleUsersUpdated);
    };
  }, [fetchData, autoRefreshIntervalMs]);

  // Filtered available exams strictly authorized for this student (O(1) Set lookups)
  const availableStudentExams = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return exams;
    if (studentClassKeySet.size === 0) return [];

    return exams.filter((e) => {
      const isPub =
        e.published === true ||
        (e as any).published === 1 ||
        (e as any).published === '1' ||
        e.status === 'published' ||
        e.status === 'active' ||
        (e.published === undefined && e.status !== 'draft');
      if (!isPub) return false;

      const rawClass = String(e.classId || (e as any).gradeClass || '').trim().toLowerCase();
      const isUniversalClass = !rawClass || rawClass === 'all' || rawClass === 'all classes' || rawClass === 'general' || rawClass.includes('සියලු');
      const matchesClass = isUniversalClass || studentClassKeySet.has(rawClass);
      if (!matchesClass) return false;

      const rawSubj = String(e.subjectId || (e as any).subject || '').trim().toLowerCase();
      const isUniversalSubj = !rawSubj || rawSubj === 'all' || rawSubj === 'all subjects' || rawSubj === 'general' || rawSubj.includes('සියලු');
      const matchesSubject = isUniversalSubj || authorizedSubjectKeySet.has(rawSubj);

      return matchesSubject;
    });
  }, [exams, user, studentClassKeySet, authorizedSubjectKeySet]);

  // Filtered available study materials strictly authorized for this student (O(1) Set lookups)
  const availableStudentMaterials = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return materials;
    if (studentClassKeySet.size === 0) return [];

    return materials.filter((m) => {
      const mClass = String(m.classId || '').trim().toLowerCase();
      const isUniversal = !mClass || mClass === 'all' || mClass === 'all classes' || mClass.includes('සියලු');
      if (!isUniversal && !studentClassKeySet.has(mClass)) {
        return false;
      }

      const mSubj = String(m.subjectId || '').trim().toLowerCase();
      const isUniversalSubj = !mSubj || mSubj === 'all' || mSubj === 'all subjects' || mSubj.includes('සියලු');
      if (!isUniversalSubj && !authorizedSubjectKeySet.has(mSubj)) {
        return false;
      }

      return true;
    });
  }, [materials, user, studentClassKeySet, authorizedSubjectKeySet]);

  // Dedicated setters updating the consolidated state atomically
  const setExams = useCallback<React.Dispatch<React.SetStateAction<Exam[]>>>((action) => {
    setPortalState((prev) => ({
      ...prev,
      exams: typeof action === 'function' ? action(prev.exams) : action,
    }));
  }, []);

  const setMaterials = useCallback<React.Dispatch<React.SetStateAction<StudyMaterial[]>>>((action) => {
    setPortalState((prev) => ({
      ...prev,
      materials: typeof action === 'function' ? action(prev.materials) : action,
    }));
  }, []);

  const setCompletedSubmissions = useCallback<React.Dispatch<React.SetStateAction<ExamSubmission[]>>>((action) => {
    setPortalState((prev) => ({
      ...prev,
      completedSubmissions: typeof action === 'function' ? action(prev.completedSubmissions) : action,
    }));
  }, []);

  const setCompletedExamIds = useCallback<React.Dispatch<React.SetStateAction<string[]>>>((action) => {
    setPortalState((prev) => ({
      ...prev,
      completedExamIds: typeof action === 'function' ? action(prev.completedExamIds) : action,
    }));
  }, []);

  const setClasses = useCallback<React.Dispatch<React.SetStateAction<PirivenaClass[]>>>((action) => {
    setPortalState((prev) => ({
      ...prev,
      classes: typeof action === 'function' ? action(prev.classes) : action,
    }));
  }, []);

  const setSubjects = useCallback<React.Dispatch<React.SetStateAction<Subject[]>>>((action) => {
    setPortalState((prev) => ({
      ...prev,
      subjects: typeof action === 'function' ? action(prev.subjects) : action,
    }));
  }, []);

  const setTeachers = useCallback<React.Dispatch<React.SetStateAction<User[]>>>((action) => {
    setPortalState((prev) => ({
      ...prev,
      teachers: typeof action === 'function' ? action(prev.teachers) : action,
    }));
  }, []);

  return {
    exams,
    materials,
    classes,
    subjects,
    teachers,
    completedSubmissions,
    completedExamIds,
    studentClass,
    availableSubjects,
    availableExams: availableStudentExams,
    availableMaterials: availableStudentMaterials,
    isAuthorized,
    isLoading,
    error,
    refetch: fetchData,
    setCompletedExamIds,
    setCompletedSubmissions,
    setExams,
    setMaterials,
    setClasses,
    setSubjects,
    setTeachers,
  };
}
