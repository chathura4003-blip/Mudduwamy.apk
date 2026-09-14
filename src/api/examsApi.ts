import { apiClient } from './apiClient';
import type { Exam, ExamSubmission } from '../types';

export const examsApi = {
  getExams: async (classId?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (classId && classId !== 'all') params.set('classId', classId);
    if (subjectId && subjectId !== 'all') params.set('subjectId', subjectId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<Exam[] | { success?: boolean; data?: Exam[]; exams?: Exam[] }>(`/api/exams${query}`);
    return Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.exams) ? (res as any).exams : []));
  },

  getExamById: async (id: string) => {
    const res = await apiClient<Exam | { success?: boolean; data?: Exam; exam?: Exam }>(`/api/exams/${id}`);
    return (res as any)?.data || (res as any)?.exam || res;
  },

  createExam: (examData: Partial<Exam>) =>
    apiClient<Exam>('/api/exams', {
      method: 'POST',
      body: examData,
    }),

  updateExam: (id: string, examData: Partial<Exam>) =>
    apiClient<Exam>(`/api/exams/${id}`, {
      method: 'PUT',
      body: examData,
    }),

  deleteExam: (id: string) =>
    apiClient<{ success: boolean; id: string }>(`/api/exams/${id}`, {
      method: 'DELETE',
    }),

  getSubmissions: async (examId?: string, studentId?: string, classId?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (examId) params.set('examId', examId);
    if (studentId) params.set('studentId', studentId);
    if (classId && classId !== 'all') params.set('classId', classId);
    if (subjectId && subjectId !== 'all') params.set('subjectId', subjectId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<ExamSubmission[] | { success?: boolean; data?: ExamSubmission[]; submissions?: ExamSubmission[] }>(`/api/submissions${query}`);
    return Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.submissions) ? (res as any).submissions : []));
  },

  submitExam: (examId: string, submissionData: any) =>
    apiClient<{ success: boolean; submission: ExamSubmission }>(`/api/exams/${examId}/submit`, {
      method: 'POST',
      body: submissionData,
    }),

  updateSubmission: (id: string, submissionData: any) =>
    apiClient<{ success: boolean; submission: ExamSubmission }>(`/api/submissions/${id}`, {
      method: 'PUT',
      body: submissionData,
    }),

  getMonitoringData: (examId: string) => apiClient<any>(`/api/exams/${examId}/monitoring`),
};
