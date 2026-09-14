import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const storedTheme = localStorage.getItem('pirivena_theme') as ThemeMode | null;
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('pirivena_theme', theme);
    } catch (e) {}

    const root = document.documentElement;
    const body = document.body;
    root.classList.add('theme-switching');
    if (body) body.classList.add('theme-switching');

    if (theme === 'dark') {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      if (body) body.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      if (body) body.setAttribute('data-theme', 'light');
    }

    const timer = setTimeout(() => {
      root.classList.remove('theme-switching');
      if (body) body.classList.remove('theme-switching');
    }, 60);

    // Sync mobile viewport status bar / theme-color meta tag
    try {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#1c1917' : '#ffffff');
      }
    } catch (e) {}

    // Safely sync Capacitor Native Android/iOS Status Bar if active
    try {
      import('@capacitor/core').then(({ Capacitor }) => {
        if (Capacitor.isNativePlatform()) {
          import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
            StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light }).catch(() => {});
            StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
            StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#1c1917' : '#ffffff' }).catch(() => {});
          }).catch(() => {});
        }
      }).catch(() => {});
    } catch (e) {}

    return () => clearTimeout(timer);
  }, [theme]);

  const setTheme = React.useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDarkMode: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
