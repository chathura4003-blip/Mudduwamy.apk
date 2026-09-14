import { apiClient } from './apiClient';
import type { BroadcastNotice } from '../types';

export const broadcastApi = {
  getNotices: async () => {
    try {
      const data = await apiClient<BroadcastNotice[] | { error?: string; message?: string; notices?: BroadcastNotice[]; data?: BroadcastNotice[] } >('/api/broadcast-notices');
      if (Array.isArray(data)) {
        return data;
      }
      if (Array.isArray(data?.notices)) {
        return data.notices;
      }
      if (Array.isArray(data?.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  },

  createNotice: (data: Partial<BroadcastNotice>) =>
    apiClient<BroadcastNotice>('/api/broadcast-notices', {
      method: 'POST',
      body: data,
    }),

  updateNotice: (id: string, data: Partial<BroadcastNotice>) =>
    apiClient<BroadcastNotice>(`/api/broadcast-notices/${id}`, {
      method: 'PUT',
      body: data,
    }),

  deleteNotice: (id: string) =>
    apiClient<{ success: boolean; id: string }>(`/api/broadcast-notices/${id}`, {
      method: 'DELETE',
    }),
};
