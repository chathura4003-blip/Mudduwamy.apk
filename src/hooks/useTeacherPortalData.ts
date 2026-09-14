import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PirivenaClass, Subject, User, Exam, StudyMaterial } from '../types';
import { classesApi, subjectsApi, examsApi, materialsApi, studentsApi, teachersApi } from '../api';
import { appLifecycleManager } from '../services/appLifecycleManager';

export interface UseTeacherPortalDataParams {
  classId?: string;
  subjectId?: string;
  autoRefreshIntervalMs?: number;
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

export function useTeacherPortalData({
  classId,
  subjectId,
  autoRefreshIntervalMs = 0,
}: UseTeacherPortalDataParams = {}): UseTeacherPortalDataReturn {
  const { user } = useAuth();

  const [classes, setClasses] = useState<PirivenaClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Main data fetching function
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      // Determine query scope for API calls
      const effectiveClassId = classId && classId !== 'all' ? classId : undefined;
      const effectiveSubjectId = subjectId && subjectId !== 'all' ? subjectId : undefined;

      const [cData, subData, eData, uData, mData] = await Promise.all([
        classesApi.getClasses().catch(() => []),
        subjectsApi.getSubjects().catch(() => []),
        examsApi.getExams(effectiveClassId, effectiveSubjectId).catch(() => []),
        studentsApi.getStudents({ classId: effectiveClassId }).catch(() => []),
        materialsApi.getMaterials(effectiveClassId, effectiveSubjectId).catch(() => []),
      ]);

      if (Array.isArray(cData)) setClasses(cData);
      if (Array.isArray(subData)) setSubjects(subData);
      if (Array.isArray(eData)) setExams(eData);
      if (Array.isArray(uData)) setStudents(uData);
      if (Array.isArray(mData)) setMaterials(mData);
    } catch (err: any) {
      console.error('Error fetching teacher data:', err);
      setError(err?.message || 'Failed to fetch teacher portal data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, classId, subjectId]);

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
    window.addEventListener('refresh-portal-data', handleWindowSync);
    window.addEventListener('pirivena-classes-updated', handleWindowSync);
    window.addEventListener('pirivena-subjects-updated', handleWindowSync);
    window.addEventListener('pirivena-users-updated', handleWindowSync);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (cleanupPoll) cleanupPoll();
      window.removeEventListener('refresh-portal-data', handleWindowSync);
      window.removeEventListener('pirivena-classes-updated', handleWindowSync);
      window.removeEventListener('pirivena-subjects-updated', handleWindowSync);
      window.removeEventListener('pirivena-users-updated', handleWindowSync);
    };
  }, [fetchData, autoRefreshIntervalMs]);

  // Filtered assigned students — students strictly belonging to teacher's assigned classes from teacher_assignments
  const assignedStudents = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return students;

    if (assignedClasses.length === 0) {
      return [];
    }

    const assignedClassKeys = new Set(
      assignedClasses.flatMap((c) =>
        [c.id, c.code, c.name, c.nameSinhala, (c as any).className, (c as any).classNameSinhala]
          .filter(Boolean)
          .map((k) => String(k).trim().toLowerCase())
      )
    );

    return students.filter((s) => {
      const sClass = String(s.classId || s.pirivenaClass || (s as any).className || '').trim().toLowerCase();
      return Boolean(sClass && assignedClassKeys.has(sClass));
    });
  }, [students, assignedClasses, user]);

  // Filtered assigned exams — STRICT TEACHER ISOLATION:
  // Admins & superadmins can view all exams.
  // For teachers: each teacher ONLY sees exams they created (prevents co-teachers from seeing or modifying each other's exams).
  const assignedExams = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return exams;

    const teacherKeys = new Set(
      [user.id, user.customId, user.name, user.monkName, user.email]
        .filter(Boolean)
        .map((k) => String(k).trim().toLowerCase())
    );

    return exams.filter((e) => {
      const eTeacher = String(e.teacherId || (e as any).createdBy || (e as any).uploadedByTeacherId || '').trim().toLowerCase();
      return Boolean(eTeacher && teacherKeys.has(eTeacher));
    });
  }, [exams, user]);

  // Filtered assigned study materials — STRICT TEACHER ISOLATION:
  // Admins & superadmins can view all materials.
  // For teachers: each teacher ONLY sees materials they uploaded (prevents co-teachers from seeing or modifying each other's materials).
  const assignedMaterials = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return materials;

    const teacherKeys = new Set(
      [user.id, user.customId, user.name, user.monkName, user.email]
        .filter(Boolean)
        .map((k) => String(k).trim().toLowerCase())
    );

    return materials.filter((m) => {
      const uploaderId = String(
        m.uploadedByTeacherId || (m as any).uploadedBy || (m as any).uploaderId || (m as any).teacherId || (m as any).createdBy || ''
      ).trim().toLowerCase();
      return Boolean(uploaderId && teacherKeys.has(uploaderId));
    });
  }, [materials, user]);

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
