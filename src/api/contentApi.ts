import { apiClient } from './apiClient';
import type {
  NewsArticle,
  PirivenaEvent,
  GalleryItem,
  OnlineAdmission,
  DonationRecord,
} from '../types';

export const contentApi = {
  // News
  getNews: () => apiClient<NewsArticle[]>('/api/news'),
  createNews: (item: Partial<NewsArticle>) =>
    apiClient<NewsArticle>('/api/news', { method: 'POST', body: item }),
  updateNews: (id: string, item: Partial<NewsArticle>) =>
    apiClient<NewsArticle>(`/api/news/${id}`, { method: 'PUT', body: item }),
  deleteNews: (id: string) =>
    apiClient<{ success: boolean }>(`/api/news/${id}`, { method: 'DELETE' }),

  // Events
  getEvents: () => apiClient<PirivenaEvent[]>('/api/events'),
  createEvent: (item: Partial<PirivenaEvent>) =>
    apiClient<PirivenaEvent>('/api/events', { method: 'POST', body: item }),
  updateEvent: (id: string, item: Partial<PirivenaEvent>) =>
    apiClient<PirivenaEvent>(`/api/events/${id}`, { method: 'PUT', body: item }),
  deleteEvent: (id: string) =>
    apiClient<{ success: boolean }>(`/api/events/${id}`, { method: 'DELETE' }),

  // Gallery
  getGallery: () => apiClient<GalleryItem[]>('/api/gallery'),
  createGalleryItem: (item: Partial<GalleryItem>) => {
    const payload = {
      ...item,
      imageUrl: item.imageUrl || item.url || '',
      url: item.url || item.imageUrl || '',
    };
    return apiClient<GalleryItem>('/api/gallery', { method: 'POST', body: payload });
  },
  updateGalleryItem: (id: string, item: Partial<GalleryItem>) => {
    const payload = {
      ...item,
      imageUrl: item.imageUrl || item.url,
      url: item.url || item.imageUrl,
    };
    return apiClient<GalleryItem>(`/api/gallery/${id}`, { method: 'PUT', body: payload });
  },
  deleteGalleryItem: (id: string) =>
    apiClient<{ success: boolean }>(`/api/gallery/${id}`, { method: 'DELETE' }),

  // Admissions
  getAdmissions: () => apiClient<OnlineAdmission[]>('/api/admissions'),
  createAdmission: (item: Partial<OnlineAdmission>) =>
    apiClient<OnlineAdmission>('/api/admissions', { method: 'POST', body: item, skipAuth: true }),
  updateAdmissionStatus: (id: string, status: string) =>
    apiClient<OnlineAdmission>(`/api/admissions/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  deleteAdmission: (id: string) =>
    apiClient<{ success: boolean }>(`/api/admissions/${id}`, { method: 'DELETE' }),

  // Donations
  getDonations: () => apiClient<DonationRecord[]>('/api/donations'),
  createDonation: (item: Partial<DonationRecord>) =>
    apiClient<DonationRecord>('/api/donations', { method: 'POST', body: item, skipAuth: true }),
  updateDonationStatus: (id: string, status: string) =>
    apiClient<DonationRecord>(`/api/donations/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteDonation: (id: string) =>
    apiClient<{ success: boolean }>(`/api/donations/${id}`, { method: 'DELETE' }),
};
