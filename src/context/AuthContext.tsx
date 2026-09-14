import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { authApi, usersApi, onUnauthorized } from '../api';
import { invalidateCache } from '../utils/dataCache';
import { appLifecycleManager } from '../services/appLifecycleManager';
import { notificationService } from '../services/notificationService';
import { oneSignalService } from '../services/oneSignalService';
import { navigationHistoryManager } from '../services/navigationHistoryManager';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password?: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateUser: (updatedData: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedToken = localStorage.getItem('pirivena_token');
      const savedUser = localStorage.getItem('pirivena_user');
      if (savedToken && savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.warn('Failed to parse cached pirivena_user:', e);
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pirivena_token'));
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('pirivena_user') && !!localStorage.getItem('pirivena_token');
    } catch (e) {
      return false;
    }
  });

  const logout = useCallback(() => {
    // 1. Immediately stop all background pollers and timers
    appLifecycleManager.stopAllTasks();
    notificationService.clearDeliveredKeys();
    oneSignalService.logout().catch(() => {});

    // 2. Invalidate API request & cache
    authApi.logout().catch(() => {});
    setToken(null);
    setUser(null);

    // 3. Reset and clear navigation history stack so back button never exposes authenticated screens
    navigationHistoryManager.clearHistory();
    if (typeof window !== 'undefined' && window.history) {
      try {
        window.history.replaceState({ pirivenaAuth: false, page: 'login' }, '', '/');
      } catch (_) {}
    }

    // 4. Clear auth session keys & cache (preserving theme, text size, and offline settings)
    localStorage.removeItem('pirivena_token');
    localStorage.removeItem('pirivena_user');
    localStorage.removeItem('pirivena_admin_tab');
    localStorage.removeItem('pirivena_teacher_tab');
    localStorage.removeItem('pirivena_student_tab');
    localStorage.removeItem('pirivena_current_tab');
    sessionStorage.clear();
    invalidateCache();
    window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: 'overview' }));
  }, []);

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('pirivena_token');
    if (!savedToken) return;
    try {
      const data = await authApi.getMe();
      if (data?.user) {
        if (data.user.status === 'inactive') {
          logout();
          return;
        }
        setUser(data.user);
        localStorage.setItem('pirivena_user', JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        console.warn('Session expired or user deleted:', e);
        logout();
      } else {
        console.info('Network unavailable or offline during refreshUser; maintaining cached session.');
      }
    }
  };

  // Clear session on 401 Unauthorized responses from apiClient
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      console.warn('Session expired or unauthorized request triggered logout');
      logout();
    });
    return unsubscribe;
  }, [logout]);

  const userRef = React.useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Listen for admin update events and live sync current user profile
  useEffect(() => {
    const handleSync = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.action === 'delete') {
        const storedUserJson = localStorage.getItem('pirivena_user');
        let currentId = userRef.current?.id;
        let currentCustomId = userRef.current?.customId;
        if (storedUserJson) {
          try {
            const parsed = JSON.parse(storedUserJson);
            currentId = parsed.id;
            currentCustomId = parsed.customId;
          } catch (err) {}
        }
        if (
          (detail.deletedUserId && (currentId === detail.deletedUserId || currentCustomId === detail.deletedUserId)) ||
          (detail.deletedCustomId && (currentId === detail.deletedCustomId || currentCustomId === detail.deletedCustomId))
        ) {
          logout();
          return;
        }
      }
      refreshUser();
    };

    window.addEventListener('pirivena-users-updated', handleSync as EventListener);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pirivena_admin_sync' || e.key === 'pirivena_user') {
        handleSync();
      }
    };
    window.addEventListener('storage', handleStorage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('pirivena-admin-sync');
      bc.onmessage = (event) => {
        if (
          event.data?.type === 'users-updated' ||
          event.data?.type === 'user-updated' ||
          event.data?.type === 'teacher-added' ||
          event.data?.type === 'student-added' ||
          event.data?.type === 'data-updated'
        ) {
          if (event.data?.action === 'delete') {
            const storedUserJson = localStorage.getItem('pirivena_user');
            let currentId = userRef.current?.id;
            let currentCustomId = userRef.current?.customId;
            if (storedUserJson) {
              try {
                const parsed = JSON.parse(storedUserJson);
                currentId = parsed.id;
                currentCustomId = parsed.customId;
              } catch (err) {}
            }
            if (
              (event.data.deletedUserId && (currentId === event.data.deletedUserId || currentCustomId === event.data.deletedUserId)) ||
              (event.data.deletedCustomId && (currentId === event.data.deletedCustomId || currentCustomId === event.data.deletedCustomId))
            ) {
              logout();
              return;
            }
          }
          handleSync();
        }
      };
    } catch (e) {}

    return () => {
      window.removeEventListener('pirivena-users-updated', handleSync as EventListener);
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, [logout]);

  // Verify JWT token with backend on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('pirivena_token');
      const savedUser = localStorage.getItem('pirivena_user');

      let currentParsedUser: User | null = null;
      if (savedToken && savedUser) {
        try {
          currentParsedUser = JSON.parse(savedUser);
          setUser(currentParsedUser);
        } catch (e) {
          localStorage.removeItem('pirivena_user');
        }
      } else if (!savedToken) {
        localStorage.removeItem('pirivena_user');
        setUser(null);
      }

      if (savedToken) {
        try {
          const data = await authApi.getMe();
          if (data?.user) {
            if (data.user.status === 'inactive') {
              logout();
              return;
            }
            setUser(data.user);
            localStorage.setItem('pirivena_user', JSON.stringify(data.user));
          } else {
            logout();
          }
        } catch (e: any) {
          // If server explicitly returned 401 Unauthorized, token is expired/invalid
          if (e?.status === 401 || e?.message?.includes('401') || e?.message?.includes('Unauthorized')) {
            logout();
          } else {
            console.warn('Network issue during session revalidation, preserving offline session:', e);
          }
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const updateUser = async (updatedData: Partial<User>): Promise<boolean> => {
    let targetId = user?.id;
    if (!targetId) {
      const saved = localStorage.getItem('pirivena_user');
      if (saved) {
        try {
          targetId = JSON.parse(saved).id;
        } catch (e) {}
      }
    }

    // Update local state for snappy UI
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('pirivena_user', JSON.stringify(updated));
      return updated;
    });

    if (targetId) {
      try {
        const updatedUserFromDb = await usersApi.updateUser(targetId, updatedData);
        setUser(updatedUserFromDb);
        localStorage.setItem('pirivena_user', JSON.stringify(updatedUserFromDb));
        invalidateCache('/api/users');
        return true;
      } catch (err) {
        console.warn('Failed to persist user update to database:', err);
      }
    }
    return false;
  };

  const login = async (
    identifier: string,
    password?: string,
    role?: UserRole
  ): Promise<boolean> => {
    try {
      const data = await authApi.login(identifier, password, role);
      if (data?.user && data?.token) {
        React.startTransition(() => {
          setToken(data.token);
          setUser(data.user);
        });
        localStorage.setItem('pirivena_token', data.token);
        localStorage.setItem('pirivena_user', JSON.stringify(data.user));
        
        // Reset subtabs and clear navigation history stack on fresh login
        navigationHistoryManager.clearHistory();
        localStorage.setItem('pirivena_admin_tab', 'overview');
        localStorage.setItem('pirivena_teacher_tab', 'overview');
        localStorage.setItem('pirivena_student_tab', 'dashboard');
        
        invalidateCache();
        window.dispatchEvent(
          new CustomEvent('switch-portal-subtab', {
            detail: data.user.role === 'student' ? 'dashboard' : 'overview',
          })
        );
        return true;
      }
      throw new Error('ලොග් වීම අසාර්ථක විය. (Authentication failed)');
    } catch (err: any) {
      const errorMessage = err.message || 'ලොග් වීම අසාර්ථක විය. (Authentication failed)';
      throw new Error(errorMessage);
    }
  };

  // logout is defined via useCallback at the top of this component

  const switchRole = async (_targetRole: UserRole) => {
    console.warn('Role switching is disabled. Users must authenticate with valid credentials.');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, switchRole, updateUser, refreshUser, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  login: async () => false,
  logout: () => {},
  switchRole: async () => {},
  updateUser: async () => false,
  refreshUser: async () => {},
  isLoading: false,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthContext;
  }
  return context;
};
