import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { PirivenaClass, Subject, User, Exam, StudyMaterial, ExamSubmission } from '../types';
import { classesApi, subjectsApi, examsApi, materialsApi, teachersApi, studentsApi } from '../api';
import { appLifecycleManager } from '../services/appLifecycleManager';

export interface UseStudentPortalDataParams {
  classId?: string;
  subjectId?: string;
  autoRefreshIntervalMs?: number;
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
}

export function useStudentPortalData({
  classId,
  subjectId,
  autoRefreshIntervalMs = 8000,
}: UseStudentPortalDataParams = {}): UseStudentPortalDataReturn {
  const { user } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [classes, setClasses] = useState<PirivenaClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [completedSubmissions, setCompletedSubmissions] = useState<ExamSubmission[]>([]);
  const [completedExamIds, setCompletedExamIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      const sKeys = [s.id, s.code, s.name, s.nameSinhala, (s as any).subjectName, (s as any).subjectNameSinhala]
        .filter(Boolean)
        .map((k) => String(k).trim());
      return sKeys.some((k) => classSubjSet.has(k));
    });
  }, [subjects, studentClass, user]);

  // Verify session credentials & authorization for the requested classId & subjectId parameters
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    if (user.role !== 'student') return false;

    const stuClassId = String(user.classId || user.pirivenaClass || '').trim();

    // If a specific classId parameter is requested, ensure student belongs to it
    if (classId && classId !== 'all' && classId !== 'ALL') {
      const targetClassKey = String(classId).trim();
      const studentClassKeys = new Set(
        [
          stuClassId,
          studentClass?.id,
          studentClass?.code,
          studentClass?.name,
          studentClass?.nameSinhala,
          (studentClass as any)?.className,
          (studentClass as any)?.classNameSinhala,
        ]
          .filter(Boolean)
          .map((k) => String(k).trim())
      );
      if (!studentClassKeys.has(targetClassKey)) {
        return false;
      }
    }

    // If a specific subjectId parameter is requested, ensure student is enrolled in it
    if (subjectId && subjectId !== 'all' && subjectId !== 'ALL') {
      const targetSubjectKey = String(subjectId).trim();
      const authorizedSubjectKeys = new Set(
        availableSubjects.flatMap((s) =>
          [s.id, s.code, s.name, s.nameSinhala, (s as any).subjectName, (s as any).subjectNameSinhala]
            .filter(Boolean)
            .map((k) => String(k).trim())
        )
      );
      if (!authorizedSubjectKeys.has(targetSubjectKey)) {
        return false;
      }
    }

    return true;
  }, [user, classId, subjectId, studentClass, availableSubjects]);

  // Main data fetching routine with mandatory parameters
  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const studentId = user.id || user.customId || 'user-student-01';
      const effectiveClassId = classId && classId !== 'all' ? classId : (user.classId || user.pirivenaClass || undefined);
      const effectiveSubjectId = subjectId && subjectId !== 'all' ? subjectId : undefined;

      const [examsData, matsData, classesData, subjsData, serverSubs, teachersData] =
        await Promise.all([
          examsApi.getExams(effectiveClassId, effectiveSubjectId).catch(() => []),
          materialsApi.getMaterials(effectiveClassId, effectiveSubjectId).catch(() => []),
          classesApi.getClasses().catch(() => []),
          subjectsApi.getSubjects().catch(() => []),
          examsApi.getSubmissions(undefined, studentId, effectiveClassId, effectiveSubjectId).catch(() => []),
          teachersApi.getTeachers().catch(() => []),
        ]);

      if (Array.isArray(examsData)) setExams(examsData);
      if (Array.isArray(matsData)) setMaterials(matsData);
      if (Array.isArray(classesData)) setClasses(classesData);
      if (Array.isArray(subjsData)) setSubjects(subjsData);
      if (Array.isArray(teachersData)) setTeachers(teachersData);

      if (Array.isArray(serverSubs)) {
        setCompletedSubmissions(serverSubs);
        const serverExamIds = serverSubs.map((s: any) => s.examId);
        setCompletedExamIds(serverExamIds);
      }
    } catch (err: any) {
      console.error('Error fetching student portal data:', err);
      setError(err?.message || 'Failed to fetch student portal data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.customId, user?.classId, user?.pirivenaClass, classId, subjectId]);

  // Setup auto-refresh and broadcast event listeners
  useEffect(() => {
    fetchData();

    const cleanupPoll = appLifecycleManager.registerPollTask(
      'student_portal_data_poll',
      fetchData,
      autoRefreshIntervalMs,
      { runImmediately: false, runImmediatelyOnResume: true, allowBackground: true, backgroundIntervalMs: 30000 }
    );

    let bc: BroadcastChannel | null = null;
    let bc2: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('pirivena-admin-sync');
      bc.onmessage = (event) => {
        if (
          event.data?.type === 'users-updated' ||
          event.data?.type === 'student-added' ||
          event.data?.type === 'classes-updated' ||
          event.data?.type === 'subjects-updated' ||
          event.data?.type === 'curriculum-updated' ||
          event.data?.type === 'exams-updated' ||
          event.data?.type === 'data-updated'
        ) {
          fetchData();
        }
      };
    } catch (e) {}

    try {
      bc2 = new BroadcastChannel('pirivena_realtime_channel');
      bc2.onmessage = () => {
        fetchData();
      };
    } catch (e) {}

    const handleStorageSync = (e: StorageEvent) => {
      if (
        e.key === 'pirivena_admin_sync' ||
        e.key === 'pirivena_classes_sync' ||
        e.key === 'pirivena_subjects_sync'
      ) {
        fetchData();
      }
    };
    window.addEventListener('storage', handleStorageSync);

    const handleWindowSync = () => fetchData();
    window.addEventListener('refresh-portal-data', handleWindowSync);
    window.addEventListener('site-data-updated', handleWindowSync);
    window.addEventListener('users-data-updated', handleWindowSync);
    window.addEventListener('database-changed', handleWindowSync);
    window.addEventListener('classes-updated', handleWindowSync);
    window.addEventListener('subjects-updated', handleWindowSync);
    window.addEventListener('curriculum-updated', handleWindowSync);
    window.addEventListener('exams-updated', handleWindowSync);
    window.addEventListener('materials-updated', handleWindowSync);
    window.addEventListener('pirivena-users-updated', handleWindowSync);
    window.addEventListener('pirivena-classes-updated', handleWindowSync);
    window.addEventListener('pirivena-subjects-updated', handleWindowSync);

    return () => {
      cleanupPoll();
      if (bc) bc.close();
      if (bc2) bc2.close();
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('refresh-portal-data', handleWindowSync);
      window.removeEventListener('site-data-updated', handleWindowSync);
      window.removeEventListener('users-data-updated', handleWindowSync);
      window.removeEventListener('database-changed', handleWindowSync);
      window.removeEventListener('classes-updated', handleWindowSync);
      window.removeEventListener('subjects-updated', handleWindowSync);
      window.removeEventListener('curriculum-updated', handleWindowSync);
      window.removeEventListener('exams-updated', handleWindowSync);
      window.removeEventListener('materials-updated', handleWindowSync);
      window.removeEventListener('pirivena-users-updated', handleWindowSync);
      window.removeEventListener('pirivena-classes-updated', handleWindowSync);
      window.removeEventListener('pirivena-subjects-updated', handleWindowSync);
    };
  }, [fetchData, autoRefreshIntervalMs]);

  // Filtered available exams strictly authorized for this student
  const availableStudentExams = useMemo(() => {
    const studentClassKeys = new Set(
      [
        user?.classId,
        user?.pirivenaClass,
        (user as any)?.classLevel,
        (user as any)?.gradeLevel,
        (user as any)?.educationCategory,
        studentClass?.id,
        studentClass?.code,
        studentClass?.name,
        studentClass?.nameSinhala,
        (studentClass as any)?.className,
        (studentClass as any)?.classNameSinhala,
        (studentClass as any)?.levelName,
      ]
        .filter(Boolean)
        .map((k) => String(k).trim().toLowerCase())
    );

    const authorizedSubjectKeys = new Set(
      availableSubjects.flatMap((s) =>
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
      if (!rawClass || lowerClass === 'all' || lowerClass === 'all classes' || lowerClass.includes('සියලු') || lowerClass === 'general') {
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
  }, [exams, user, studentClass, availableSubjects]);

  // Filtered available study materials strictly authorized for this student
  const availableStudentMaterials = useMemo(() => {
    const studentClassKeys = new Set(
      [
        user?.classId,
        user?.pirivenaClass,
        studentClass?.id,
        studentClass?.code,
        studentClass?.name,
        studentClass?.nameSinhala,
        (studentClass as any)?.className,
        (studentClass as any)?.classNameSinhala,
      ]
        .filter(Boolean)
        .map((k) => String(k).trim())
    );

    const authorizedSubjectKeys = new Set(
      availableSubjects.flatMap((s) =>
        [s.id, s.code, s.name, s.nameSinhala, (s as any).subjectName, (s as any).subjectNameSinhala]
          .filter(Boolean)
          .map((k) => String(k).trim())
      )
    );

    return materials.filter((m) => {
      const mClass = String(m.classId || '').trim();
      const isUniversal = !mClass || mClass.toLowerCase() === 'all';
      if (isUniversal) return true;

      if (studentClassKeys.size > 0 && !studentClassKeys.has(mClass)) {
        return false;
      }

      const mSubj = String(m.subjectId || '').trim();
      if (!mSubj || mSubj.toLowerCase() === 'all') return true;

      return authorizedSubjectKeys.has(mSubj);
    });
  }, [materials, user, studentClass, availableSubjects]);

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
  };
}
