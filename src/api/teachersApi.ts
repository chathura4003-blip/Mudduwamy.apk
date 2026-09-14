import { apiClient } from './apiClient';
import type { Teacher } from '../types';

const mapTeacher = (t: any): Teacher => {
  if (!t) return t;
  const fallbackNum = t.id ? String(t.id).replace(/[^0-9]/g, '').slice(-3) || '001' : '001';
  let customId = t.customId || t.indexNumber;
  if (!customId || customId.startsWith('usr-') || !customId.startsWith('TCH-')) {
    customId = `TCH-2026-${fallbackNum.padStart(3, '0')}`;
  }
  const status = t.status || 'active';
  const classId = t.classId || t.pirivenaClass || t.gradeClass || null;
  const sanitized = { ...t };
  delete (sanitized as any).password;
  delete (sanitized as any).plain_password;

  return {
    ...sanitized,
    role: 'teacher',
    customId,
    indexNumber: customId,
    status,
    classId,
    pirivenaClass: classId,
    assignedClasses: t.assignedClasses || t.classesAssigned || [],
    assignedSubjects: t.assignedSubjects || t.subjectsTaught || [],
  };
};

export interface TeacherFilterParams {
  classId?: string;
  subjectId?: string;
  status?: string;
  search?: string;
}

export const teachersApi = {
  getTeachers: async (filters?: TeacherFilterParams) => {
    const params = new URLSearchParams();
    if (filters?.classId) params.set('classId', filters.classId);
    if (filters?.subjectId) params.set('subjectId', filters.subjectId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<Teacher[] | { success?: boolean; data?: Teacher[]; teachers?: Teacher[] }>(`/api/teachers${query}`);
    const items = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.teachers) ? (res as any).teachers : []));
    return items.map(mapTeacher);
  },

  getTeacherById: async (id: string) => {
    const res = await apiClient<Teacher | { success?: boolean; data?: Teacher; teacher?: Teacher }>(`/api/teachers/${encodeURIComponent(id)}`);
    const item = (res as any)?.data || (res as any)?.teacher || res;
    return mapTeacher(item);
  },

  createTeacher: async (teacherData: Partial<Teacher>) => {
    const res = await apiClient<{ success?: boolean; teacher?: Teacher } | Teacher>('/api/teachers', {
      method: 'POST',
      body: {
        ...teacherData,
        role: 'teacher',
      },
    });
    const teacherObj = (res as any)?.teacher || (res as any)?.user || res;
    return mapTeacher(teacherObj);
  },

  updateTeacher: async (id: string, teacherData: Partial<Teacher>) => {
    const res = await apiClient<{ success?: boolean; teacher?: Teacher } | Teacher>(`/api/teachers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: teacherData,
    });
    const teacherObj = (res as any)?.teacher || (res as any)?.user || (res && (res as any).id ? res : null);
    if (teacherObj) {
      return mapTeacher(teacherObj);
    }
    return teachersApi.getTeacherById(id);
  },

  deleteTeacher: (id: string) =>
    apiClient<{ success: boolean; id: string }>(`/api/teachers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
