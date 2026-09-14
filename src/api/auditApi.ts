import { apiClient } from './apiClient';
import type { SystemAuditLog, ActivityItem, ActivityCategory } from '../types';

export const auditApi = {
  getLogs: () => apiClient<SystemAuditLog[]>('/api/audit-logs'),
  clearLogs: () => apiClient<{ success: boolean }>('/api/audit-logs', { method: 'DELETE' }),
  getActivities: (params?: { category?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiClient<{ activities: ActivityItem[]; totalCount: number; liveConnections: number }>(`/api/activities${qs}`);
  },
  simulateActivity: (data: { type: ActivityCategory | string; actor?: string; customName?: string; score?: number }) =>
    apiClient<{ success: boolean; activity: ActivityItem }>('/api/activities/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

