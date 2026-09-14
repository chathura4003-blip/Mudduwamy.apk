import type { User } from '../types';

function getAllClasses(): any[] {
  return [];
}

function getAllSubjects(): any[] {
  return [];
}

export function isClassAssignedToTeacher(user: User, targetClassId?: string): boolean {
  if (user.role === 'admin' || user.role === 'superadmin') {
    return true;
  }

  if (!targetClassId) return true;
  const cleanTarget = targetClassId.trim().toLowerCase();
  if (
    cleanTarget === '' ||
    cleanTarget === 'all' ||
    cleanTarget === 'general' ||
    cleanTarget === 'global' ||
    cleanTarget === 'all_classes' ||
    cleanTarget === 'general_all'
  ) {
    return true;
  }

  const teacherIds = new Set([user.id, user.customId].filter(Boolean));

  // Direct list check
  const assignedList = [...(user.classesAssigned || [])];
  if (user.classId) assignedList.push(user.classId);

  // Check categories taught (e.g. ['Pracheena', 'Primary', 'GCE O/L'])
  const categories = user.categoriesTaught || [];
  const allClasses = getAllClasses();
  const targetClass = allClasses.find(
    (c) =>
      c.id.toLowerCase() === cleanTarget ||
      c.code.toLowerCase() === cleanTarget ||
      c.name.toLowerCase() === cleanTarget
  );

  if (targetClass) {
    if (
      targetClass.category &&
      categories.some((cat) => cat.toLowerCase() === targetClass.category?.toLowerCase())
    ) {
      return true;
    }
    if (targetClass.teacherInChargeId && teacherIds.has(targetClass.teacherInChargeId)) {
      return true;
    }
  }

  if (assignedList.some((item) => item.trim().toLowerCase() === cleanTarget)) {
    return true;
  }

  if (targetClass) {
    if (
      assignedList.some(
        (a) =>
          a.toLowerCase() === targetClass.id.toLowerCase() ||
          a.toLowerCase() === targetClass.code.toLowerCase() ||
          a.toLowerCase() === targetClass.name.toLowerCase()
      )
    ) {
      return true;
    }
  }

  // Check all classes where teacher is in charge
  const inChargeClasses = allClasses.filter(
    (c) => c.teacherInChargeId && teacherIds.has(c.teacherInChargeId)
  );
  if (
    inChargeClasses.some(
      (c) =>
        c.id.toLowerCase() === cleanTarget ||
        c.code.toLowerCase() === cleanTarget ||
        c.name.toLowerCase() === cleanTarget
    )
  ) {
    return true;
  }

  // Strict RBAC: If targetClassId does not match assigned list, deny access
  return false;
}

export function isSubjectAssignedToTeacher(user: User, targetSubjectId?: string): boolean {
  if (user.role === 'admin' || user.role === 'superadmin') {
    return true;
  }

  if (!targetSubjectId) return true;
  const cleanTarget = targetSubjectId.trim().toLowerCase();
  if (
    cleanTarget === '' ||
    cleanTarget === 'all' ||
    cleanTarget === 'general' ||
    cleanTarget === 'global' ||
    cleanTarget === 'all_subjects' ||
    cleanTarget === 'general_all'
  ) {
    return true;
  }

  const assignedList = [...(user.subjectsAssigned || []), ...(user.subjectsTaught || [])];

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

  // Check subjects of classes assigned to teacher
  const allClasses = getAllClasses();
  const teacherIds = new Set([user.id, user.customId].filter(Boolean));

  const teacherClasses = allClasses.filter(
    (c) =>
      (c.teacherInChargeId && teacherIds.has(c.teacherInChargeId)) ||
      (user.classesAssigned || []).some(
        (ca) =>
          ca.toLowerCase() === c.id.toLowerCase() ||
          ca.toLowerCase() === c.code.toLowerCase() ||
          ca.toLowerCase() === c.name.toLowerCase()
      ) ||
      (user.classId && user.classId.toLowerCase() === c.id.toLowerCase())
  );

  for (const cls of teacherClasses) {
    const clsSubjects = cls.subjects || [];
    if (
      clsSubjects.some(
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

  // Strict RBAC: If targetSubjectId does not match assigned list, deny access
  return false;
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
