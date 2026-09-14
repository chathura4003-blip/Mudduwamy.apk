import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface SecurityLockContextType {
  isLockEnabled: boolean;
  isLocked: boolean;
  hasPinSet: boolean;
  setLockEnabled: (enabled: boolean) => void;
  setPin: (pin: string) => boolean;
  verifyPin: (inputPin: string) => boolean;
  unlockApp: () => void;
  lockApp: () => void;
}

const SecurityLockContext = createContext<SecurityLockContextType | undefined>(undefined);

export const SecurityLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLockEnabled, setIsLockEnabledState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pirivena_app_lock_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const [hasPinSet, setHasPinSet] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('pirivena_app_lock_pin');
    } catch {
      return false;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const enabled = localStorage.getItem('pirivena_app_lock_enabled') === 'true';
      const pin = localStorage.getItem('pirivena_app_lock_pin');
      return enabled && !!pin;
    } catch {
      return false;
    }
  });

  const setLockEnabled = useCallback((enabled: boolean) => {
    setIsLockEnabledState(enabled);
    try {
      localStorage.setItem('pirivena_app_lock_enabled', enabled ? 'true' : 'false');
      if (!enabled) {
        setIsLocked(false);
      }
    } catch {}
  }, []);

  const setPin = useCallback((pin: string) => {
    if (!pin || pin.length < 4) return false;
    try {
      localStorage.setItem('pirivena_app_lock_pin', pin);
      setHasPinSet(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const verifyPin = useCallback((inputPin: string): boolean => {
    try {
      const savedPin = localStorage.getItem('pirivena_app_lock_pin');
      if (!savedPin || savedPin === inputPin) {
        setIsLocked(false);
        triggerHaptic('success');
        return true;
      }
    } catch {}
    triggerHaptic('heavy');
    return false;
  }, []);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
    triggerHaptic('success');
  }, []);

  const lockApp = useCallback(() => {
    if (isLockEnabled && hasPinSet) {
      setIsLocked(true);
      triggerHaptic('medium');
    }
  }, [isLockEnabled, hasPinSet]);

  return (
    <SecurityLockContext.Provider
      value={{
        isLockEnabled,
        isLocked,
        hasPinSet,
        setLockEnabled,
        setPin,
        verifyPin,
        unlockApp,
        lockApp,
      }}
    >
      {children}
    </SecurityLockContext.Provider>
  );
};

export const useSecurityLock = () => {
  const context = useContext(SecurityLockContext);
  if (!context) {
    throw new Error('useSecurityLock must be used within a SecurityLockProvider');
  }
  return context;
};
