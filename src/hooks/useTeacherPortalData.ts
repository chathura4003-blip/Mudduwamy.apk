import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PirivenaClass, Subject, User, Exam, StudyMaterial } from '../types';
import { examsApi, materialsApi, studentsApi } from '../api';
import { appLifecycleManager } from '../services/appLifecycleManager';
import {
  getCachedOrFetchClasses,
  getCachedOrFetchSubjects,
  invalidateMetadataCache,
} from './useStudentPortalData';

export interface UseTeacherPortalDataParams {
  classId?: string;
  subjectId?: string;
  autoRefreshIntervalMs?: number;
}

export interface TeacherPortalDataState {
  classes: PirivenaClass[];
  subjects: Subject[];
  students: User[];
  exams: Exam[];
  materials: StudyMaterial[];
  isLoading: boolean;
  error: string | null;
}

export interface UseTeacherPortalDataReturn {
  classes: PirivenaClass[];
  subjects: Subject[];
  students: User[];
  exams: Exam[];
  materials: StudyMaterial[];
  assignedClasses: PirivenaClass[];
  assignedSubjects: Subject[];
  assignedStudents: User[];
  assignedExams: Exam[];
  assignedMaterials: StudyMaterial[];
  getAssignedSubjectsForClass: (selectedClassId?: string) => Subject[];
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  setMaterials: React.Dispatch<React.SetStateAction<StudyMaterial[]>>;
  setClasses: React.Dispatch<React.SetStateAction<PirivenaClass[]>>;
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  setStudents: React.Dispatch<React.SetStateAction<User[]>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoped Students Cache per Class ID (5-minute TTL)
// Prevents repeatedly downloading entire student lists on every render or tab switch
// ─────────────────────────────────────────────────────────────────────────────
const STUDENTS_CACHE_TTL_MS = 5 * 60 * 1000;
const scopedStudentsCache = new Map<string, { data: User[]; timestamp: number }>();

export function invalidateTeacherStudentsCache(classId?: string) {
  if (classId) {
    scopedStudentsCache.delete(classId);
  } else {
    scopedStudentsCache.clear();
  }
}

async function fetchScopedStudents(classId?: string): Promise<User[]> {
  const cacheKey = classId || '__ALL__';
  const cached = scopedStudentsCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < STUDENTS_CACHE_TTL_MS) {
    return cached.data;
  }
  const result = await studentsApi.getStudents(classId ? { classId } : undefined).catch(() => []);
  const safeResult = Array.isArray(result) ? result : [];
  scopedStudentsCache.set(cacheKey, { data: safeResult, timestamp: now });
  return safeResult;
}

export function useTeacherPortalData({
  classId,
  subjectId,
  autoRefreshIntervalMs = 0,
}: UseTeacherPortalDataParams = {}): UseTeacherPortalDataReturn {
  const { user } = useAuth();

  // Consolidated single atomic state for Teacher Portal data
  const [portalState, setPortalState] = useState<TeacherPortalDataState>(() => ({
    classes: [],
    subjects: [],
    students: [],
    exams: [],
    materials: [],
    isLoading: true,
    error: null,
  }));

  const { classes, subjects, students, exams, materials, isLoading, error } = portalState;

  // Authoritative teacher assignments (teacher_assignments tuple relation)
  const teacherAssignments = useMemo(() => {
    if (!user || !Array.isArray(user.teacherAssignments)) return [];
    return user.teacherAssignments.filter((a) => Boolean(a && a.classId && a.subjectId));
  }, [user]);

  // Compute all assigned classes based strictly on teacher_assignments
  const assignedClasses = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return classes;

    const matchedClassIds = new Set<string>();
    teacherAssignments.forEach((a) => {
      if (a.classId) matchedClassIds.add(String(a.classId).trim());
    });

    if (matchedClassIds.size === 0) return [];

    return classes.filter(
      (c) =>
        matchedClassIds.has(c.id) ||
        (c.code && matchedClassIds.has(c.code)) ||
        (c.name && matchedClassIds.has(c.name))
    );
  }, [classes, user, teacherAssignments]);

  // Compute all assigned subjects strictly from teacher_assignments
  const assignedSubjects = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return subjects;

    const matchedSubjIds = new Set<string>();
    teacherAssignments.forEach((a) => {
      if (a.subjectId) matchedSubjIds.add(String(a.subjectId).trim());
    });

    if (matchedSubjIds.size === 0) return [];

    return subjects.filter(
      (s) =>
        matchedSubjIds.has(s.id) ||
        (s.code && matchedSubjIds.has(s.code)) ||
        (s.name && matchedSubjIds.has(s.name))
    );
  }, [subjects, user, teacherAssignments]);

  // Precomputed Teacher Identity Keys Set for O(1) creator matching
  const teacherKeysSet = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(
      [user.id, user.customId, user.name, user.monkName, user.email]
        .filter(Boolean)
        .map((k) => String(k).trim().toLowerCase())
    );
  }, [user?.id, user?.customId, user?.name, user?.monkName, user?.email]);

  // Precomputed Assigned Class Keys Set for O(1) class matching
  const assignedClassKeysSet = useMemo(() => {
    const keys: string[] = [];
    for (const c of assignedClasses) {
      if (c.id) keys.push(c.id.toLowerCase().trim());
      if (c.code) keys.push(c.code.toLowerCase().trim());
      if (c.name) keys.push(c.name.toLowerCase().trim());
      if (c.nameSinhala) keys.push(c.nameSinhala.toLowerCase().trim());
      if ((c as any).className) keys.push(String((c as any).className).toLowerCase().trim());
      if ((c as any).classNameSinhala) keys.push(String((c as any).classNameSinhala).toLowerCase().trim());
    }
    return new Set(keys);
  }, [assignedClasses]);

  // Helper to get subjects specifically assigned to teacher for a given class ID (tuple: classId -> subjectId)
  const getAssignedSubjectsForClass = useCallback(
    (selectedClassId?: string): Subject[] => {
      if (!selectedClassId || selectedClassId === 'all' || selectedClassId === 'ALL') {
        return assignedSubjects;
      }

      if (!user || user.role === 'admin' || user.role === 'superadmin') {
        const cls = classes.find(
          (c) => c.id === selectedClassId || c.code === selectedClassId || c.name === selectedClassId
        );
        if (cls && cls.subjects && cls.subjects.length > 0) {
          const cSubjKeys = new Set(cls.subjects.map((s) => String(s).trim()));
          return subjects.filter(
            (s) => cSubjKeys.has(s.id) || (s.code && cSubjKeys.has(s.code)) || (s.name && cSubjKeys.has(s.name))
          );
        }
        return subjects;
      }

      const targetCls = classes.find(
        (c) => c.id === selectedClassId || c.code === selectedClassId || c.name === selectedClassId
      );
      const targetClassKeys = new Set(
        [selectedClassId, targetCls?.id, targetCls?.code, targetCls?.name].filter(Boolean).map(String)
      );

      const classSubjIds = new Set<string>();
      teacherAssignments.forEach((a) => {
        const aClass = String(a.classId || '').trim();
        if (targetClassKeys.has(aClass) && a.subjectId) {
          classSubjIds.add(String(a.subjectId).trim());
        }
      });

      return subjects.filter(
        (s) =>
          classSubjIds.has(s.id) ||
          (s.code && classSubjIds.has(s.code)) ||
          (s.name && classSubjIds.has(s.name))
      );
    },
    [user, assignedSubjects, classes, subjects, teacherAssignments]
  );

  // Authorization check strictly based on teacher_assignments tuples: (teacher_id, class_id, subject_id)
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    if (user.role !== 'teacher') return false;

    const hasClass = Boolean(classId && classId !== 'all' && classId !== 'ALL');
    const hasSubj = Boolean(subjectId && subjectId !== 'all' && subjectId !== 'ALL');

    if (!hasClass && !hasSubj) return true;

    // Both class and subject provided -> MUST match exact tuple together
    if (hasClass && hasSubj) {
      return teacherAssignments.some((a) => {
        const aClass = String(a.classId || '').trim();
        const aSubj = String(a.subjectId || '').trim();
        return aClass === classId && aSubj === subjectId;
      });
    }

    // Only class provided
    if (hasClass) {
      return teacherAssignments.some((a) => String(a.classId || '').trim() === classId);
    }

    // Only subject provided
    if (hasSubj) {
      return teacherAssignments.some((a) => String(a.subjectId || '').trim() === subjectId);
    }

    return true;
  }, [user, classId, subjectId, teacherAssignments]);

  // Main data fetching function utilizing cached metadata & scoped API calls
  const fetchData = useCallback(async () => {
    if (!user) return;
    setPortalState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const effectiveClassId = classId && classId !== 'all' ? classId : undefined;
      const effectiveSubjectId = subjectId && subjectId !== 'all' ? subjectId : undefined;

      // Determine student scope: for teacher, only query assigned classes if not admin
      let studentsPromise: Promise<User[]>;
      if (effectiveClassId) {
        studentsPromise = fetchScopedStudents(effectiveClassId);
      } else if (user.role === 'admin' || user.role === 'superadmin') {
        studentsPromise = fetchScopedStudents(undefined);
      } else if (teacherAssignments.length > 0) {
        const assignedClassIds = Array.from(
          new Set(teacherAssignments.map((a) => String(a.classId || '').trim()).filter(Boolean))
        );
        if (assignedClassIds.length === 1) {
          studentsPromise = fetchScopedStudents(assignedClassIds[0]);
        } else if (assignedClassIds.length > 1) {
          studentsPromise = Promise.all(assignedClassIds.map((cid) => fetchScopedStudents(cid))).then(
            (arrays) => {
              const seen = new Set<string>();
              const combined: User[] = [];
              for (const arr of arrays) {
                for (const stu of arr) {
                  const sId = stu.id || stu.customId;
                  if (sId && !seen.has(sId)) {
                    seen.add(sId);
                    combined.push(stu);
                  }
                }
              }
              return combined;
            }
          );
        } else {
          studentsPromise = Promise.resolve([]);
        }
      } else {
        studentsPromise = Promise.resolve([]);
      }

      const [cData, subData, eData, uData, mData] = await Promise.all([
        getCachedOrFetchClasses(),
        getCachedOrFetchSubjects(),
        examsApi.getExams(effectiveClassId, effectiveSubjectId).catch(() => []),
        studentsPromise.catch(() => []),
        materialsApi.getMaterials(effectiveClassId, effectiveSubjectId).catch(() => []),
      ]);

      setPortalState((prev) => ({
        ...prev,
        classes: Array.isArray(cData) ? cData : prev.classes,
        subjects: Array.isArray(subData) ? subData : prev.subjects,
        exams: Array.isArray(eData) ? eData : prev.exams,
        students: Array.isArray(uData) ? uData : prev.students,
        materials: Array.isArray(mData) ? mData : prev.materials,
        isLoading: false,
        error: null,
      }));
    } catch (err: any) {
      console.error('Error fetching teacher data:', err);
      setPortalState((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to fetch teacher portal data',
      }));
    }
  }, [user?.id, user?.role, classId, subjectId, teacherAssignments]);

  // Initial load and live sync hooks
  useEffect(() => {
    fetchData();

    // Auto-polling interval managed via AppLifecycleManager (strictly pauses on background)
    let cleanupPoll: (() => void) | null = null;
    if (autoRefreshIntervalMs > 0) {
      cleanupPoll = appLifecycleManager.registerPollTask(
        'teacher_portal_data_poll',
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
      invalidateTeacherStudentsCache();
      debouncedFetch();
    };

    window.addEventListener('refresh-portal-data', handleWindowSync);
    window.addEventListener('pirivena-classes-updated', handleClassesUpdated);
    window.addEventListener('pirivena-subjects-updated', handleSubjectsUpdated);
    window.addEventListener('pirivena-users-updated', handleUsersUpdated);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (cleanupPoll) cleanupPoll();
      window.removeEventListener('refresh-portal-data', handleWindowSync);
      window.removeEventListener('pirivena-classes-updated', handleClassesUpdated);
      window.removeEventListener('pirivena-subjects-updated', handleSubjectsUpdated);
      window.removeEventListener('pirivena-users-updated', handleUsersUpdated);
    };
  }, [fetchData, autoRefreshIntervalMs]);

  // Filtered assigned students — students strictly belonging to teacher's assigned classes (O(1) Set lookup)
  const assignedStudents = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return students;
    if (assignedClassKeysSet.size === 0) return [];

    return students.filter((s) => {
      const sClass = String(s.classId || s.pirivenaClass || (s as any).className || '').trim().toLowerCase();
      return Boolean(sClass && assignedClassKeysSet.has(sClass));
    });
  }, [students, assignedClassKeysSet, user]);

  // Filtered assigned exams — STRICT TEACHER ISOLATION with O(1) Set lookup
  const assignedExams = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return exams;

    return exams.filter((e) => {
      const eTeacher = String(e.teacherId || (e as any).createdBy || (e as any).uploadedByTeacherId || '').trim().toLowerCase();
      return Boolean(eTeacher && teacherKeysSet.has(eTeacher));
    });
  }, [exams, user, teacherKeysSet]);

  // Filtered assigned study materials — STRICT TEACHER ISOLATION with O(1) Set lookup
  const assignedMaterials = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return materials;

    return materials.filter((m) => {
      const uploaderId = String(
        m.uploadedByTeacherId || (m as any).uploadedBy || (m as any).uploaderId || (m as any).teacherId || (m as any).createdBy || ''
      ).trim().toLowerCase();
      return Boolean(uploaderId && teacherKeysSet.has(uploaderId));
    });
  }, [materials, user, teacherKeysSet]);

  // Dedicated atomic setters
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

  const setStudents = useCallback<React.Dispatch<React.SetStateAction<User[]>>>((action) => {
    setPortalState((prev) => ({
      ...prev,
      students: typeof action === 'function' ? action(prev.students) : action,
    }));
  }, []);

  return {
    classes,
    subjects,
    students,
    exams,
    materials,
    assignedClasses,
    assignedSubjects,
    assignedStudents,
    assignedExams,
    assignedMaterials,
    getAssignedSubjectsForClass,
    isAuthorized,
    isLoading,
    error,
    refetch: fetchData,
    setExams,
    setMaterials,
    setClasses,
    setSubjects,
    setStudents,
  };
}
