import { apiClient } from './apiClient';
import type { LibraryBook } from '../types';

export const libraryApi = {
  getLibraryItems: (category?: string) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return apiClient<LibraryBook[]>(`/api/library${query}`);
  },

  getLibraryItemById: (id: string) => apiClient<LibraryBook>(`/api/library/${id}`),

  createLibraryItem: (item: Partial<LibraryBook>) =>
    apiClient<LibraryBook>('/api/library', {
      method: 'POST',
      body: item,
    }),

  updateLibraryItem: (id: string, item: Partial<LibraryBook>) =>
    apiClient<LibraryBook>(`/api/library/${id}`, {
      method: 'PUT',
      body: item,
    }),

  deleteLibraryItem: (id: string) =>
    apiClient<{ success: boolean; id: string }>(`/api/library/${id}`, {
      method: 'DELETE',
    }),
};
