import { apiClient } from './apiClient';
import type { PirivenaClass, Subject } from '../types';
import { getCleanSubjectCode, generateSmartSubjectCode } from '../utils/subjectHelper';

const parseSubjectsArray = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    const trimmed = val.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const parseTimetableArray = (val: any, classId?: string): any[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  if (classId) {
    try {
      const cached = localStorage.getItem(`pirivena_timetable_${classId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return [];
};

const mapClass = (c: any): PirivenaClass => {
  if (!c) return c;
  const name = c.name || c.classNameSinhala || c.className || 'ප්‍රාරම්භ පන්තිය';
  const nameSinhala = c.nameSinhala || c.classNameSinhala || name;
  const code = c.code || (c.id ? String(c.id).toUpperCase().replace('CLS-', 'CLS-') : 'CLS-001');
  const roomNumber = c.roomNumber || 'දේශන ශාලාව 01';
  const category = c.category || c.gradeLevel || 'ප්‍රාරම්භ';
  const subjects = parseSubjectsArray(c.subjects);
  const timetable = parseTimetableArray(c.timetable, c.id);

  return {
    ...c,
    name,
    nameSinhala,
    code,
    roomNumber,
    category,
    gradeLevel: category,
    studentCount: Number(c.studentCount) || 0,
    teacherInChargeId: c.teacherInChargeId || c.classTeacher || '',
    subjects,
    timetable,
  };
};

const mapSubject = (s: any): Subject => {
  if (!s) return s;
  const name = s.name || s.subjectNameSinhala || s.subjectName || 'විෂයය';
  const nameSinhala = s.nameSinhala || s.subjectNameSinhala || name;
  const code = getCleanSubjectCode(s);
  return {
    ...s,
    name,
    nameSinhala,
    code,
  };
};

export const classesApi = {
  getClasses: async () => {
    const res = await apiClient<PirivenaClass[] | { success?: boolean; data?: PirivenaClass[]; classes?: PirivenaClass[] }>('/api/classes');
    const items = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.classes) ? (res as any).classes : []));
    return items.map(mapClass);
  },

  getClassById: async (id: string) => {
    const res = await apiClient<PirivenaClass | { success?: boolean; data?: PirivenaClass; class?: PirivenaClass }>(`/api/classes/${id}`);
    const item = (res as any)?.data || (res as any)?.class || res;
    return mapClass(item);
  },

  createClass: async (classData: Partial<PirivenaClass>) => {
    const raw = classData as any;
    const payload = {
      ...classData,
      className: classData.name || raw.className,
      classNameSinhala: classData.nameSinhala || classData.name || raw.classNameSinhala,
      gradeLevel: classData.category || classData.gradeLevel || 'ප්‍රාරම්භ',
      classTeacher: classData.teacherInChargeId || raw.classTeacher,
      timetable: classData.timetable || [],
    };
    const res = await apiClient<{ success?: boolean; class?: PirivenaClass } | PirivenaClass>('/api/classes', {
      method: 'POST',
      body: payload,
    });
    const item = (res as any)?.class || res;
    return mapClass(item);
  },

  updateClass: async (id: string, classData: Partial<PirivenaClass>) => {
    const raw = classData as any;
    const payload = {
      ...classData,
      className: classData.name || raw.className,
      classNameSinhala: classData.nameSinhala || classData.name || raw.classNameSinhala,
      gradeLevel: classData.category || classData.gradeLevel,
      classTeacher: classData.teacherInChargeId || raw.classTeacher,
      timetable: classData.timetable !== undefined ? classData.timetable : raw.timetable,
    };
    return apiClient<PirivenaClass>(`/api/classes/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  updateTimetable: async (classId: string, timetable: any[]) => {
    try {
      localStorage.setItem(`pirivena_timetable_${classId}`, JSON.stringify(timetable));
    } catch {}

    return apiClient<PirivenaClass>(`/api/classes/${classId}`, {
      method: 'PUT',
      body: {
        id: classId,
        timetable,
      },
    });
  },

  deleteClass: (id: string) =>
    apiClient<{ success: boolean; id: string }>(`/api/classes/${id}`, {
      method: 'DELETE',
    }),
};

export const subjectsApi = {
  getSubjects: async (classId?: string) => {
    const query = classId ? `?classId=${encodeURIComponent(classId)}` : '';
    const res = await apiClient<Subject[] | { success?: boolean; data?: Subject[]; subjects?: Subject[] }>(`/api/subjects${query}`);
    const items = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.subjects) ? (res as any).subjects : []));
    return items.map(mapSubject);
  },

  createSubject: async (subjectData: Partial<Subject>) => {
    const raw = subjectData as any;
    const computedCode = subjectData.code || raw.subjectCode || generateSmartSubjectCode(subjectData.category, subjectData.name, subjectData.nameSinhala);
    const payload = {
      ...subjectData,
      code: computedCode,
      subjectCode: computedCode,
      subjectName: subjectData.name || raw.subjectName,
      subjectNameSinhala: subjectData.nameSinhala || subjectData.name || raw.subjectNameSinhala,
    };
    const res = await apiClient<{ success?: boolean; subject?: Subject } | Subject>('/api/subjects', {
      method: 'POST',
      body: payload,
    });
    const item = (res as any)?.subject || res;
    return mapSubject(item);
  },

  updateSubject: async (id: string, subjectData: Partial<Subject>) => {
    const raw = subjectData as any;
    const payload = {
      ...subjectData,
      subjectCode: subjectData.code || raw.subjectCode,
      subjectName: subjectData.name || raw.subjectName,
      subjectNameSinhala: subjectData.nameSinhala || subjectData.name || raw.subjectNameSinhala,
    };
    return apiClient<Subject>(`/api/subjects/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  deleteSubject: (id: string) =>
    apiClient<{ success: boolean; id: string }>(`/api/subjects/${id}`, {
      method: 'DELETE',
    }),
};

function randNum() {
  return Math.floor(100 + Math.random() * 900);
}
