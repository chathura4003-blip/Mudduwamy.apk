import { apiClient } from './apiClient';
import type { StudyMaterial } from '../types';

export const materialsApi = {
  getMaterials: async (classId?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (classId && classId !== 'all') params.set('classId', classId);
    if (subjectId && subjectId !== 'all') params.set('subjectId', subjectId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<StudyMaterial[] | { success?: boolean; data?: StudyMaterial[]; materials?: StudyMaterial[] }>(`/api/materials${query}`);
    return Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.materials) ? (res as any).materials : []));
  },

  createMaterial: (data: Partial<StudyMaterial>) =>
    apiClient<StudyMaterial>('/api/materials', {
      method: 'POST',
      body: data,
    }),

  updateMaterial: (id: string, data: Partial<StudyMaterial>) =>
    apiClient<StudyMaterial>(`/api/materials/${id}`, {
      method: 'PUT',
      body: data,
    }),

  deleteMaterial: (id: string) =>
    apiClient<{ success: boolean; id: string }>(`/api/materials/${id}`, {
      method: 'DELETE',
    }),
};
