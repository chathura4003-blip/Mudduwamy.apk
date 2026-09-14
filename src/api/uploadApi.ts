import { apiClient } from './apiClient';

export const uploadApi = {
  uploadFile: (formData: FormData) =>
    apiClient<{ fileUrl: string; originalName?: string }>('/api/upload', {
      method: 'POST',
      body: formData,
      skipAuth: true,
    }),
};
