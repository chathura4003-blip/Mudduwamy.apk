import { apiClient } from './apiClient';
import type { Student } from '../types';

const mapStudent = (s: any): Student => {
  if (!s) return s;
  const fallbackNum = s.id ? String(s.id).replace(/[^0-9]/g, '').slice(-3) || '001' : '001';
  let customId = s.customId || s.indexNumber || s.admissionNo;
  if (!customId || customId.startsWith('usr-') || (!customId.startsWith('STD-') && !customId.startsWith('STU-'))) {
    customId = `STD-2026-${fallbackNum.padStart(3, '0')}`;
  }
  const status = s.status || 'active';
  const classId = s.classId || s.pirivenaClass || s.gradeClass || null;
  const sanitized = { ...s };
  delete (sanitized as any).password;
  delete (sanitized as any).plain_password;

  return {
    ...sanitized,
    role: 'student',
    customId,
    indexNumber: customId,
    admissionNo: s.admissionNo || customId,
    status,
    classId,
    pirivenaClass: classId,
    enrolledSubjects: s.enrolledSubjects || s.subjectsAssigned || [],
  };
};

export interface StudentFilterParams {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  status?: string;
  search?: string;
}

export const studentsApi = {
  getStudents: async (filters?: StudentFilterParams | string) => {
    const params = new URLSearchParams();
    if (typeof filters === 'string') {
      params.set('classId', filters);
    } else if (filters) {
      if (filters.classId) params.set('classId', filters.classId);
      if (filters.subjectId) params.set('subjectId', filters.subjectId);
      if (filters.teacherId) params.set('teacherId', filters.teacherId);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<Student[]>(`/api/students${query}`);
    return Array.isArray(res) ? res.map(mapStudent) : [];
  },

  getStudentById: async (id: string) => {
    const res = await apiClient<Student>(`/api/students/${encodeURIComponent(id)}`);
    return mapStudent(res);
  },

  createStudent: async (studentData: Partial<Student>) => {
    const res = await apiClient<{ success?: boolean; student?: Student } | Student>('/api/students', {
      method: 'POST',
      body: {
        ...studentData,
        role: 'student',
      },
    });
    const studentObj = (res as any)?.student || (res as any)?.user || res;
    return mapStudent(studentObj);
  },

  updateStudent: async (id: string, studentData: Partial<Student>) => {
    const res = await apiClient<{ success?: boolean; student?: Student } | Student>(`/api/students/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: studentData,
    });
    const studentObj = (res as any)?.student || (res as any)?.user || (res && (res as any).id ? res : null);
    if (studentObj) {
      return mapStudent(studentObj);
    }
    return studentsApi.getStudentById(id);
  },

  deleteStudent: (id: string) =>
    apiClient<{ success: boolean; id: string }>(`/api/students/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
