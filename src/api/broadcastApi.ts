import { apiClient } from './apiClient';
import type { BroadcastNotice } from '../types';

export const broadcastApi = {
  getNotices: async () => {
    const data = await apiClient<
      BroadcastNotice[] | { error?: string; message?: string; notices?: BroadcastNotice[]; data?: BroadcastNotice[] }
    >('/api/broadcast-notices');
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray((data as any)?.notices)) {
      return (data as any).notices;
    }
    if (Array.isArray((data as any)?.data)) {
      return (data as any).data;
    }
    return [];
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
