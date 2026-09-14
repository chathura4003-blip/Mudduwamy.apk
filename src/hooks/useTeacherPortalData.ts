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
  autoRefreshIntervalMs = 30000,
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

  // Compute all assigned classes based strictly on teacher's assigned credentials in Teacher Management
  const assignedClasses = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return classes;

    const matchedKeys = new Set<string>();

    if (user.teacherAssignments && Array.isArray(user.teacherAssignments)) {
      user.teacherAssignments.forEach((a: any) => {
        if (a && a.classId) matchedKeys.add(String(a.classId).trim());
      });
    }

    parseArrayField(user.classesAssigned).forEach((cKey) => {
      if (cKey) matchedKeys.add(String(cKey).trim());
    });
    if (user.classId) {
      matchedKeys.add(String(user.classId).trim());
    }

    classes.forEach((c) => {
      const isTeacherInCharge =
        (c.teacherInChargeId && (c.teacherInChargeId === user.id || c.teacherInChargeId === user.customId)) ||
        ((c as any).classTeacher && ((c as any).classTeacher === user.name || (user.monkName && (c as any).classTeacher === user.monkName)));
      
      if (isTeacherInCharge) {
        matchedKeys.add(c.id);
        if (c.code) matchedKeys.add(c.code);
        if (c.name) matchedKeys.add(c.name);
        if (c.nameSinhala) matchedKeys.add(c.nameSinhala);
      }
    });

    if (matchedKeys.size > 0) {
      const matched = classes.filter(
        (c) =>
          matchedKeys.has(c.id) ||
          (c.code && matchedKeys.has(c.code)) ||
          (c.name && matchedKeys.has(c.name)) ||
          (c.nameSinhala && matchedKeys.has(c.nameSinhala)) ||
          ((c as any).className && matchedKeys.has((c as any).className)) ||
          ((c as any).classNameSinhala && matchedKeys.has((c as any).classNameSinhala))
      );
      if (matched.length > 0) return matched;
    }

    return classes;
  }, [classes, user]);

  // Compute all assigned subjects strictly from teacher's assignments in Teacher Management
  const assignedSubjects = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return subjects;

    const teacherSubjSet = new Set<string>();

    if (user.teacherAssignments && Array.isArray(user.teacherAssignments)) {
      user.teacherAssignments.forEach((a: any) => {
        if (a && a.subjectId) teacherSubjSet.add(String(a.subjectId).trim());
      });
    }

    parseArrayField(user.subjectsTaught).forEach((s) => {
      if (s) teacherSubjSet.add(String(s).trim());
    });
    parseArrayField(user.subjectsAssigned).forEach((s) => {
      if (s) teacherSubjSet.add(String(s).trim());
    });

    // Also match if the teacher is assigned in Subject Management (assignedTeacherIds)
    subjects.forEach((s) => {
      const teacherIds = parseArrayField(s.assignedTeacherIds);
      if (
        teacherIds.includes(user.id) ||
        (user.customId && teacherIds.includes(user.customId)) ||
        (user.name && teacherIds.includes(user.name)) ||
        (user.monkName && teacherIds.includes(user.monkName))
      ) {
        teacherSubjSet.add(s.id);
        if (s.code) teacherSubjSet.add(s.code);
        if (s.name) teacherSubjSet.add(s.name);
        if (s.nameSinhala) teacherSubjSet.add(s.nameSinhala);
      }
    });

    if (teacherSubjSet.size > 0) {
      const matched = subjects.filter(
        (s) =>
          teacherSubjSet.has(s.id) ||
          (s.code && teacherSubjSet.has(s.code)) ||
          (s.name && teacherSubjSet.has(s.name)) ||
          (s.nameSinhala && teacherSubjSet.has(s.nameSinhala)) ||
          ((s as any).subjectName && teacherSubjSet.has((s as any).subjectName)) ||
          ((s as any).subjectNameSinhala && teacherSubjSet.has((s as any).subjectNameSinhala))
      );
      if (matched.length > 0) return matched;
    }

    return subjects;
  }, [subjects, user]);

  // Helper to get subjects specifically assigned to teacher for a given class ID
  const getAssignedSubjectsForClass = useCallback(
    (selectedClassId?: string): Subject[] => {
      if (!selectedClassId || selectedClassId === 'all' || selectedClassId === 'ALL') {
        return assignedSubjects.length > 0 ? assignedSubjects : subjects;
      }

      if (!user || user.role === 'admin' || user.role === 'superadmin') {
        const cls = classes.find(
          (c) => c.id === selectedClassId || c.code === selectedClassId || c.name === selectedClassId
        );
        if (cls && cls.subjects && cls.subjects.length > 0) {
          const cSubjKeys = new Set(cls.subjects.map((s) => String(s).trim()));
          const matched = subjects.filter(
            (s) => cSubjKeys.has(s.id) || (s.code && cSubjKeys.has(s.code)) || (s.name && cSubjKeys.has(s.name))
          );
          if (matched.length > 0) return matched;
        }
        return subjects;
      }

      const classSubjSet = new Set<string>();

      if (user.teacherAssignments && Array.isArray(user.teacherAssignments)) {
        user.teacherAssignments.forEach((a: any) => {
          const aClassId = String(a.classId || a.class_id || '').trim();
          const targetCls = classes.find((c) => c.id === selectedClassId);
          if (
            aClassId === selectedClassId ||
            (targetCls && (aClassId === targetCls.code || aClassId === targetCls.name))
          ) {
            if (a.subjectId) classSubjSet.add(String(a.subjectId).trim());
          }
        });
      }

      if (classSubjSet.size > 0) {
        const matched = subjects.filter(
          (s) =>
            classSubjSet.has(s.id) ||
            (s.code && classSubjSet.has(s.code)) ||
            (s.name && classSubjSet.has(s.name)) ||
            (s.nameSinhala && classSubjSet.has(s.nameSinhala)) ||
            ((s as any).subjectName && classSubjSet.has((s as any).subjectName))
        );
        if (matched.length > 0) return matched;
      }

      // Check if the class object itself has subjects mapped
      const cls = classes.find(
        (c) => c.id === selectedClassId || c.code === selectedClassId || c.name === selectedClassId
      );
      if (cls && cls.subjects && cls.subjects.length > 0) {
        const cSubjKeys = new Set(cls.subjects.map((s) => String(s).trim()));
        const matched = assignedSubjects.filter(
          (s) => cSubjKeys.has(s.id) || (s.code && cSubjKeys.has(s.code)) || (s.name && cSubjKeys.has(s.name))
        );
        if (matched.length > 0) return matched;
      }

      return assignedSubjects.length > 0 ? assignedSubjects : subjects;
    },
    [user, assignedSubjects, classes, subjects]
  );

  // Authorization check for the requested classId & subjectId
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'superadmin') return true;
    if (user.role !== 'teacher') return false;

    // Check class authorization if specified
    if (classId && classId !== 'all' && classId !== 'ALL') {
      const assignedClassKeys = new Set(
        assignedClasses.flatMap((c) => [c.id, c.code, c.name, c.nameSinhala, (c as any).className].filter(Boolean))
      );
      if (!assignedClassKeys.has(classId)) {
        return false;
      }
    }

    // Check subject authorization if specified
    if (subjectId && subjectId !== 'all' && subjectId !== 'ALL') {
      const assignedSubjKeys = new Set(
        assignedSubjects.flatMap((s) => [s.id, s.code, s.name, s.nameSinhala].filter(Boolean))
      );
      if (!assignedSubjKeys.has(subjectId)) {
        return false;
      }
    }

    return true;
  }, [user, classId, subjectId, assignedClasses, assignedSubjects]);

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
    const cleanupPoll = appLifecycleManager.registerPollTask(
      'teacher_portal_data_poll',
      fetchData,
      autoRefreshIntervalMs,
      { runImmediately: false, runImmediatelyOnResume: true, allowBackground: false }
    );

    // Cross-tab broadcast sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('pirivena_realtime_channel');
      bc.onmessage = (event) => {
        if (event.data === 'refresh-portal-data') {
          debouncedFetch();
        }
      };
    } catch (e) {}

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
      cleanupPoll();
      if (bc) bc.close();
      window.removeEventListener('refresh-portal-data', handleWindowSync);
      window.removeEventListener('pirivena-classes-updated', handleWindowSync);
      window.removeEventListener('pirivena-subjects-updated', handleWindowSync);
      window.removeEventListener('pirivena-users-updated', handleWindowSync);
    };
  }, [fetchData, autoRefreshIntervalMs]);

  // Filtered assigned students — students in teacher's classes OR enrolled in teacher's subjects
  const assignedStudents = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'superadmin') return students;

    const assignedClassKeys = new Set(
      assignedClasses.flatMap((c) =>
        [c.id, c.code, c.name, c.nameSinhala, (c as any).className, (c as any).classNameSinhala]
          .filter(Boolean)
          .map((k) => String(k).trim())
      )
    );
    const teacherKeys = new Set(
      [user.id, user.customId, user.name, user.monkName].filter(Boolean).map((k) => String(k).trim())
    );
    const assignedSubjKeys = new Set(
      assignedSubjects.flatMap((s) =>
        [s.id, s.code, s.name, s.nameSinhala, (s as any).subjectName, (s as any).subjectNameSinhala]
          .filter(Boolean)
          .map((k) => String(k).trim())
      )
    );

    const hasSpecificAssignments =
      (user.teacherAssignments && Array.isArray(user.teacherAssignments) && user.teacherAssignments.length > 0) ||
      (Array.isArray(user.classesAssigned) && user.classesAssigned.length > 0) ||
      (Array.isArray(user.subjectsTaught) && user.subjectsTaught.length > 0);

    const matched = students.filter((s) => {
      // 1. Direct class match
      const sClass = String(s.classId || s.pirivenaClass || (s as any).className || '').trim();
      const isClassMatch = sClass ? (assignedClassKeys.has(sClass) || assignedClassKeys.size === 0) : false;

      // 2. Class teacher match
      const isTeacherMatch = s.classTeacherId
        ? teacherKeys.has(String(s.classTeacherId).trim())
        : false;

      // 3. Subject match: student is enrolled in a subject taught by this teacher
      const studentSubjs = parseArrayField(s.subjectsAssigned);
      if (studentSubjs.length === 0 && (s as any)?.studentSubjects) {
        const rawStuSubjs = (s as any).studentSubjects;
        if (Array.isArray(rawStuSubjs)) {
          rawStuSubjs.forEach((sub: any) => {
            if (sub && (sub.subjectId || sub.id)) {
              studentSubjs.push(String(sub.subjectId || sub.id).trim());
            }
          });
        }
      }
      const isSubjectMatch = studentSubjs.some((subId) => assignedSubjKeys.has(subId));

      return isClassMatch || isTeacherMatch || isSubjectMatch;
    });

    if (matched.length > 0) {
      return matched;
    }

    // Fallback: If teacher has general access or no strict matches, show all pirivena students
    if (!hasSpecificAssignments || matched.length === 0) {
      return students;
    }

    return matched;
  }, [students, assignedClasses, assignedSubjects, user]);

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
