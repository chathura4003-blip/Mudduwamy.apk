import { apiClient } from './apiClient';
import type { Exam, ExamSubmission } from '../types';

export const examsApi = {
  getExams: (classId?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (classId && classId !== 'all') params.set('classId', classId);
    if (subjectId && subjectId !== 'all') params.set('subjectId', subjectId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Exam[]>(`/api/exams${query}`);
  },

  getExamById: (id: string) => apiClient<Exam>(`/api/exams/${id}`),

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

  getSubmissions: (examId?: string, studentId?: string, classId?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (examId) params.set('examId', examId);
    if (studentId) params.set('studentId', studentId);
    if (classId && classId !== 'all') params.set('classId', classId);
    if (subjectId && subjectId !== 'all') params.set('subjectId', subjectId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<ExamSubmission[]>(`/api/submissions${query}`);
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
