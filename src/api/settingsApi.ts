import { apiClient } from './apiClient';
import { SiteSettings } from '../context/PublicSiteContext';

export const settingsApi = {
  getSiteSettings: () => apiClient<SiteSettings>('/api/site-settings'),

  updateSiteSettings: (settings: Partial<SiteSettings>) =>
    apiClient<SiteSettings>('/api/site-settings', {
      method: 'PUT',
      body: settings,
    }),

  getSystemStatus: () => apiClient<any>('/api/site-settings/system-status'),

  testGeminiKey: (apiKey?: string) =>
    apiClient<{ success: boolean; message?: string }>('/api/site-settings/test-gemini-key', {
      method: 'POST',
      body: { apiKey },
    }),

  testOpenRouterKey: (apiKey?: string) =>
    apiClient<{ success: boolean; message?: string }>('/api/site-settings/test-openrouter-key', {
      method: 'POST',
      body: { apiKey },
    }),

  publishAppUpdate: (updateData: {
    version: string;
    apkUrl?: string;
    liveUpdateZipUrl?: string;
    releaseNotes: string;
    forceUpdate?: boolean;
  }) =>
    apiClient<{ success: boolean; message: string; version: string; directDownloadUrl?: string; liveUpdateZipUrl?: string }>(
      '/api/site-settings/publish-app-update',
      {
        method: 'POST',
        body: updateData,
      }
    ),

  uploadLiveUpdateBundle: (formData: FormData) =>
    apiClient<{
      success: boolean;
      message: string;
      version: string;
      liveUpdateZipUrl: string;
      fileSize: string;
      cleanedOldFilesCount?: number;
      freedSpace?: string;
    }>('/api/site-settings/upload-live-bundle', {
      method: 'POST',
      body: formData,
    }),

  getActiveSessions: () =>
    apiClient<{
      success: boolean;
      totalActive: number;
      sessions: any[];
    }>('/api/site-settings/active-sessions'),

  forceLogoutUser: (userId: string) =>
    apiClient<{
      success: boolean;
      message: string;
    }>('/api/site-settings/force-logout-user', {
      method: 'POST',
      body: { userId },
    }),

  forceLogoutRole: (role: string) =>
    apiClient<{
      success: boolean;
      message: string;
    }>('/api/site-settings/force-logout-role', {
      method: 'POST',
      body: { role },
    }),
};
