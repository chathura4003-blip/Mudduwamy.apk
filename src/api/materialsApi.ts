import { apiClient } from './apiClient';
import type { StudyMaterial } from '../types';

export const materialsApi = {
  getMaterials: (classId?: string, subjectId?: string) => {
    const params = new URLSearchParams();
    if (classId && classId !== 'all') params.set('classId', classId);
    if (subjectId && subjectId !== 'all') params.set('subjectId', subjectId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient<StudyMaterial[]>(`/api/materials${query}`);
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
