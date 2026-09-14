import type { User } from '../types';

function getAllClasses(): any[] {
  return [];
}

function getAllSubjects(): any[] {
  return [];
}

/**
 * Strict tuple-based authorization helper for teachers:
 * Checks if the teacher is assigned to the specific (classId, subjectId) combination
 * in teacherAssignments.
 */
export function isTeacherAuthorizedForTuple(
  user: User,
  targetClassId?: string,
  targetSubjectId?: string
): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'superadmin') return true;
  if (user.role !== 'teacher') return false;

  const assignments = Array.isArray(user.teacherAssignments) ? user.teacherAssignments : [];
  if (assignments.length === 0) return false;

  const cleanClass = targetClassId?.trim().toLowerCase();
  const cleanSubject = targetSubjectId?.trim().toLowerCase();

  const isAllClass = !cleanClass || cleanClass === 'all' || cleanClass === 'general' || cleanClass === 'all_classes';
  const isAllSubject = !cleanSubject || cleanSubject === 'all' || cleanSubject === 'general' || cleanSubject === 'all_subjects';

  if (isAllClass && isAllSubject) {
    return true;
  }

  // Exact tuple matching: (classId, subjectId) must match together
  if (!isAllClass && !isAllSubject) {
    return assignments.some((a) => {
      const aClass = String(a.classId || '').trim().toLowerCase();
      const aSubj = String(a.subjectId || '').trim().toLowerCase();
      return aClass === cleanClass && aSubj === cleanSubject;
    });
  }

  // Class-only matching
  if (!isAllClass) {
    return assignments.some((a) => String(a.classId || '').trim().toLowerCase() === cleanClass);
  }

  // Subject-only matching
  if (!isAllSubject) {
    return assignments.some((a) => String(a.subjectId || '').trim().toLowerCase() === cleanSubject);
  }

  return false;
}

export function isClassAssignedToTeacher(user: User, targetClassId?: string): boolean {
  return isTeacherAuthorizedForTuple(user, targetClassId, undefined);
}

export function isSubjectAssignedToTeacher(user: User, targetSubjectId?: string): boolean {
  return isTeacherAuthorizedForTuple(user, undefined, targetSubjectId);
}

export function isClassMatchingStudent(
  studentClassId: string | undefined,
  targetClassId?: string
): boolean {
  if (
    !targetClassId ||
    targetClassId === 'all' ||
    targetClassId === 'ALL' ||
    targetClassId === ''
  ) {
    return true;
  }
  if (!studentClassId) return false;

  const cleanStudentClass = studentClassId.trim().toLowerCase();
  const cleanTargetClass = targetClassId.trim().toLowerCase();

  if (cleanStudentClass === cleanTargetClass) return true;

  const allClasses = getAllClasses();
  const studentClass = allClasses.find(
    (c) =>
      c.id.toLowerCase() === cleanStudentClass ||
      c.code.toLowerCase() === cleanStudentClass ||
      c.name.toLowerCase() === cleanStudentClass
  );

  const targetClass = allClasses.find(
    (c) =>
      c.id.toLowerCase() === cleanTargetClass ||
      c.code.toLowerCase() === cleanTargetClass ||
      c.name.toLowerCase() === cleanTargetClass
  );

  if (studentClass && targetClass) {
    return studentClass.id === targetClass.id;
  }

  if (studentClass) {
    return (
      studentClass.id.toLowerCase() === cleanTargetClass ||
      studentClass.code.toLowerCase() === cleanTargetClass ||
      studentClass.name.toLowerCase() === cleanTargetClass
    );
  }

  if (targetClass) {
    return (
      targetClass.id.toLowerCase() === cleanStudentClass ||
      targetClass.code.toLowerCase() === cleanStudentClass ||
      targetClass.name.toLowerCase() === cleanStudentClass
    );
  }

  return false;
}

export function isSubjectMatchingStudent(user: User, targetSubjectId?: string): boolean {
  if (
    !targetSubjectId ||
    targetSubjectId === 'all' ||
    targetSubjectId === 'ALL' ||
    targetSubjectId === ''
  ) {
    return true;
  }

  const cleanTarget = targetSubjectId.trim().toLowerCase();
  const assignedList = user.subjectsAssigned || [];

  if (assignedList.some((item) => item.trim().toLowerCase() === cleanTarget)) {
    return true;
  }

  const allSubjects = getAllSubjects();
  const targetSubject = allSubjects.find(
    (s) =>
      s.id.toLowerCase() === cleanTarget ||
      s.code.toLowerCase() === cleanTarget ||
      s.name.toLowerCase() === cleanTarget
  );

  if (targetSubject) {
    if (
      assignedList.some(
        (a) =>
          a.toLowerCase() === targetSubject.id.toLowerCase() ||
          a.toLowerCase() === targetSubject.code.toLowerCase() ||
          a.toLowerCase() === targetSubject.name.toLowerCase()
      )
    ) {
      return true;
    }
  }

  // If student's class contains this subject
  if (user.classId) {
    const studentClass = getAllClasses().find(
      (c) =>
        c.id.toLowerCase() === user.classId!.toLowerCase() ||
        c.code.toLowerCase() === user.classId!.toLowerCase() ||
        c.name.toLowerCase() === user.classId!.toLowerCase()
    );
    if (studentClass && studentClass.subjects) {
      if (
        studentClass.subjects.some(
          (s) =>
            s.toLowerCase() === cleanTarget ||
            (targetSubject &&
              (s.toLowerCase() === targetSubject.id.toLowerCase() ||
                s.toLowerCase() === targetSubject.code.toLowerCase()))
        )
      ) {
        return true;
      }
    }
  }

  return false;
}
