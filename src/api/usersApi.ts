import { apiClient } from './apiClient';
import type { User } from '../types';

const mapUser = (u: any): User => {
  if (!u) return u;
  let rawRole = String(u.role || '').toLowerCase().trim();
  const cId = String(u.customId || u.indexNumber || u.id || '');
  if (!rawRole || rawRole === 'undefined') {
    if (cId.startsWith('TCH-')) rawRole = 'teacher';
    else if (cId.startsWith('ADM-') || cId.startsWith('usr-admin')) rawRole = 'admin';
    else rawRole = 'student';
  } else if (cId.startsWith('TCH-') && rawRole === 'student') {
    rawRole = 'teacher';
  } else if ((cId.startsWith('STD-') || cId.startsWith('STU-')) && rawRole === 'teacher') {
    rawRole = 'student';
  }
  const role = rawRole as 'superadmin' | 'admin' | 'teacher' | 'student';
  const prefix = role === 'teacher' ? 'TCH' : (role === 'admin' || role === 'superadmin' ? 'ADM' : 'STD');
  const fallbackNum = u.id ? String(u.id).replace(/[^0-9]/g, '').slice(-3) || '001' : '001';
  let customId = u.customId || u.indexNumber;
  if (
    !customId ||
    customId.startsWith('usr-') ||
    (role === 'teacher' && !customId.startsWith('TCH-')) ||
    (role === 'student' && !customId.startsWith('STD-') && !customId.startsWith('STU-'))
  ) {
    customId = `${prefix}-2026-${fallbackNum.padStart(3, '0')}`;
  }
  const status = u.status || 'active';
  const classId = u.classId || u.pirivenaClass || u.gradeClass || null;
  const sanitized = { ...u };
  delete (sanitized as any).password;
  delete (sanitized as any).plain_password;
  return {
    ...sanitized,
    role,
    customId,
    indexNumber: customId,
    status,
    classId,
    pirivenaClass: classId,
  };
};

export const usersApi = {
  getUsers: async (role?: string, classId?: string) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (classId) params.set('classId', classId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient<User[] | { success?: boolean; data?: User[]; users?: User[] }>(`/api/users${query}`);
    const items = Array.isArray(res) ? res : (Array.isArray((res as any)?.data) ? (res as any).data : (Array.isArray((res as any)?.users) ? (res as any).users : []));
    return items.map(mapUser);
  },

  getUserById: async (id: string) => {
    const res = await apiClient<User | { success?: boolean; data?: User; user?: User }>(`/api/users/${encodeURIComponent(id)}`);
    const item = (res as any)?.data || (res as any)?.user || res;
    return mapUser(item);
  },

  createUser: async (userData: Partial<User>) => {
    const res = await apiClient<{ success?: boolean; user?: User } | User>('/api/users', {
      method: 'POST',
      body: userData,
    });
    const userObj = (res as any)?.user || res;
    return mapUser(userObj);
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const res = await apiClient<{ success?: boolean; user?: User } | User>(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: userData,
    });
    const userObj = (res as any)?.user || (res && (res as any).id ? res : null);
    if (userObj) {
      return mapUser(userObj);
    }
    return usersApi.getUserById(id);
  },

  deleteUser: (id: string) =>
    apiClient<{ success: boolean; id: string }>(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
