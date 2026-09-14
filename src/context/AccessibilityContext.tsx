import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type TextSizeOption = 'small' | 'normal' | 'large' | 'extra_large';

export const TEXT_SIZE_SCALES: Record<TextSizeOption, { scale: number; labelSi: string; labelEn: string; desc: string }> = {
  small: {
    scale: 0.90,
    labelSi: 'කුඩා (90%)',
    labelEn: 'Small (90%)',
    desc: 'වැඩි තොරතුරු ප්‍රමාණයක් තිරයේ දැකීමට සුදුසුයි',
  },
  normal: {
    scale: 1.00,
    labelSi: 'සාමාන්‍ය (100%)',
    labelEn: 'Normal (100%)',
    desc: 'නිර්දේශිත සම්මත අකුරු ප්‍රමාණය',
  },
  large: {
    scale: 1.15,
    labelSi: 'විශාල (115%)',
    labelEn: 'Large (115%)',
    desc: 'පැහැදිලිව පහසුවෙන් කියවීමට සුදුසුයි',
  },
  extra_large: {
    scale: 1.30,
    labelSi: 'ඉතා විශාල (130%)',
    labelEn: 'Extra Large (130%)',
    desc: 'උපරිම පැහැදිලි කියවීමේ ප්‍රවේශ්‍යතාව',
  },
};

interface AccessibilityContextType {
  appTextSize: TextSizeOption;
  setAppTextSize: (size: TextSizeOption) => void;
  notifTextSize: TextSizeOption;
  setNotifTextSize: (size: TextSizeOption) => void;
  appTextScale: number;
  notifTextScale: number;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appTextSize, setAppTextSizeState] = useState<TextSizeOption>(() => {
    try {
      const saved = localStorage.getItem('pirivena_app_text_size');
      if (saved && (saved in TEXT_SIZE_SCALES)) {
        return saved as TextSizeOption;
      }
    } catch (e) {}
    return 'normal';
  });

  const [notifTextSize, setNotifTextSizeState] = useState<TextSizeOption>(() => {
    try {
      const saved = localStorage.getItem('pirivena_notif_text_size');
      if (saved && (saved in TEXT_SIZE_SCALES)) {
        return saved as TextSizeOption;
      }
    } catch (e) {}
    return 'normal';
  });

  const appTextScale = TEXT_SIZE_SCALES[appTextSize].scale;
  const notifTextScale = TEXT_SIZE_SCALES[notifTextSize].scale;

  // Apply CSS root variables whenever text scale changes
  useEffect(() => {
    try {
      localStorage.setItem('pirivena_app_text_size', appTextSize);
      localStorage.setItem('pirivena_notif_text_size', notifTextSize);
    } catch (e) {}

    const root = document.documentElement;
    root.style.setProperty('--app-text-scale', appTextScale.toString());
    root.style.setProperty('--notif-text-scale', notifTextScale.toString());
    root.style.setProperty('--app-font-base', `${16 * appTextScale}px`);

    // Add or replace class on root for CSS targeting
    root.classList.remove('text-scale-small', 'text-scale-normal', 'text-scale-large', 'text-scale-extra_large');
    root.classList.add(`text-scale-${appTextSize}`);

    window.dispatchEvent(new CustomEvent('pirivena-text-scale-changed', { detail: { appTextSize, appTextScale } }));
  }, [appTextSize, notifTextSize, appTextScale, notifTextScale]);

  const setAppTextSize = useCallback((size: TextSizeOption) => {
    setAppTextSizeState(size);
  }, []);

  const setNotifTextSize = useCallback((size: TextSizeOption) => {
    setNotifTextSizeState(size);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        appTextSize,
        setAppTextSize,
        notifTextSize,
        setNotifTextSize,
        appTextScale,
        notifTextScale,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
