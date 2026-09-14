import { apiClient } from './apiClient';
import type { User, UserRole } from '../types';

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface MeResponse {
  user: User;
}

export const authApi = {
  login: (identifier: string, password?: string, role?: UserRole) =>
    apiClient<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { identifier, username: identifier, password, role },
    }),

  getMe: () =>
    apiClient<MeResponse>('/api/auth/me', {
      method: 'GET',
    }),

  logout: () =>
    apiClient<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),
};
