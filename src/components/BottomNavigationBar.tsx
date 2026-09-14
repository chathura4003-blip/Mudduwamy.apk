import React, { useState, useEffect, useCallback, startTransition } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../utils/haptics';
import {
  Home,
  BookOpen,
  ClipboardList,
  Award,
  User,
  School,
  Users,
  GraduationCap,
  Settings,
} from 'lucide-react';

interface BottomNavTabItem {
  id: string;
  labelSi: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const BottomNavigationBar: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isSi = language === 'si';

  const getInitialTab = useCallback(() => {
    try {
      if (user?.role === 'admin' || user?.role === 'superadmin') {
        return sessionStorage.getItem('pirivena_admin_tab') || 'overview';
      } else if (user?.role === 'teacher') {
        return sessionStorage.getItem('pirivena_teacher_tab') || 'overview';
      } else {
        return sessionStorage.getItem('pirivena_student_tab') || 'overview';
      }
    } catch {
      return 'overview';
    }
  }, [user]);

  const [activeSubTab, setActiveSubTab] = useState<string>(getInitialTab);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isModalOrChatActive, setIsModalOrChatActive] = useState(false);

  // Sync state whenever portal tab or user changes
  useEffect(() => {
    setActiveSubTab(getInitialTab());
  }, [user, getInitialTab]);

  useEffect(() => {
    const handleSubTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && typeof customEvent.detail === 'string') {
        setActiveSubTab(customEvent.detail);
      }
    };
    window.addEventListener('switch-portal-subtab', handleSubTabChange);
    return () => window.removeEventListener('switch-portal-subtab', handleSubTabChange);
  }, []);

  // 📱 Detect Virtual Keyboard & Active Fullscreen Modals/Chat to auto-hide Bottom Nav Bar (Ignoring Splash & Backgrounds)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialScreenHeight = Math.max(window.screen?.height || 0, window.innerHeight || 0);
    let rafId: number | null = null;

    const updateKeyboardAndModalState = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // 1. Check Virtual Keyboard
        const vvHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const fullHeight = Math.max(initialScreenHeight, window.innerHeight);
        const isKb = fullHeight - vvHeight > 140;
        setIsKeyboardVisible((prev) => (prev !== isKb ? isKb : prev));

        // 2. Check Active Modals (excluding splash screen and loaders)
        try {
          const hasOpenModal = !!document.querySelector(
            '[data-modal="true"], [role="dialog"]:not([data-splash="true"]), #pirivena-chat-root .fixed.inset-0'
          );
          setIsModalOrChatActive((prev) => (prev !== hasOpenModal ? hasOpenModal : prev));
        } catch (e) {
          setIsModalOrChatActive(false);
        }
      });
    };

    updateKeyboardAndModalState();
    window.visualViewport?.addEventListener('resize', updateKeyboardAndModalState, { passive: true });
    window.addEventListener('resize', updateKeyboardAndModalState, { passive: true });

    // Focus / blur handlers for mobile inputs
    const handleFocusIn = (e: FocusEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        setIsKeyboardVisible(true);
      }
    };
    const handleFocusOut = () => {
      setTimeout(updateKeyboardAndModalState, 100);
    };

    document.addEventListener('focusin', handleFocusIn, { passive: true });
    document.addEventListener('focusout', handleFocusOut, { passive: true });

    // Capacitor Native Keyboard listeners
    let capKeyboardShowSub: any;
    let capKeyboardHideSub: any;
    try {
      const CapKeyboard = (window as any).Capacitor?.Plugins?.Keyboard;
      if (CapKeyboard) {
        capKeyboardShowSub = CapKeyboard.addListener('keyboardWillShow', () => {
          setIsKeyboardVisible(true);
        });
        capKeyboardHideSub = CapKeyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardVisible(false);
        });
      }
    } catch (e) {}

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.visualViewport?.removeEventListener('resize', updateKeyboardAndModalState);
      window.removeEventListener('resize', updateKeyboardAndModalState);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      try {
        capKeyboardShowSub?.remove?.();
        capKeyboardHideSub?.remove?.();
      } catch (e) {}
    };
  }, []);

  if (!user || isKeyboardVisible || isModalOrChatActive) return null;

  // 1. ADMIN BOTTOM NAVIGATION TABS (5 High-Value Core Tabs)
  let navItems: BottomNavTabItem[] = [];

  if (user.role === 'admin' || user.role === 'superadmin') {
    navItems = [
      { id: 'overview', labelSi: 'මුල් පිටුව', labelEn: 'Overview', icon: Home },
      { id: 'students', labelSi: 'ශිෂ්‍යයන්', labelEn: 'Students', icon: GraduationCap },
      { id: 'teachers', labelSi: 'ගුරුවරුන්', labelEn: 'Teachers', icon: Users },
      { id: 'classes', labelSi: 'පන්ති', labelEn: 'Classes', icon: School },
      { id: 'settings', labelSi: 'සැකසුම්', labelEn: 'Settings', icon: Settings },
    ];
  } else if (user.role === 'teacher') {
    // 2. TEACHER BOTTOM NAVIGATION TABS
    navItems = [
      { id: 'overview', labelSi: 'මුල් පිටුව', labelEn: 'Home', icon: Home },
      { id: 'roster', labelSi: 'පන්ති', labelEn: 'Classes', icon: School },
      { id: 'exams', labelSi: 'විභාග', labelEn: 'Exams', icon: ClipboardList },
      { id: 'materials', labelSi: 'පාඩම්', labelEn: 'Lessons', icon: BookOpen },
      { id: 'settings', labelSi: 'ගිණුම', labelEn: 'Profile', icon: User },
    ];
  } else {
    // 3. STUDENT BOTTOM NAVIGATION TABS
    navItems = [
      { id: 'overview', labelSi: 'මුල් පිටුව', labelEn: 'Home', icon: Home },
      { id: 'materials', labelSi: 'පාඩම්', labelEn: 'Lessons', icon: BookOpen },
      { id: 'exams', labelSi: 'විභාග', labelEn: 'Exams', icon: ClipboardList },
      { id: 'results', labelSi: 'ප්‍රතිඵල', labelEn: 'Results', icon: Award },
      { id: 'settings', labelSi: 'ගිණුම', labelEn: 'Profile', icon: User },
    ];
  }

  const handleNavClick = (tabId: string) => {
    // 1. Instant visual response
    startTransition(() => {
      setActiveSubTab(tabId);
    });
    triggerHaptic('light');

    // 2. Persist tab to session
    try {
      if (user.role === 'admin' || user.role === 'superadmin') {
        sessionStorage.setItem('pirivena_admin_tab', tabId);
      } else if (user.role === 'teacher') {
        sessionStorage.setItem('pirivena_teacher_tab', tabId);
      } else {
        sessionStorage.setItem('pirivena_student_tab', tabId);
      }
    } catch {}

    // 3. Dispatch global subtab navigation event immediately (0ms lag)
    window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: tabId }));

    // 4. Reset scroll if needed
    if (window.pageYOffset > 50 || document.documentElement.scrollTop > 50) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const isCurrentActive = (item: BottomNavTabItem) => {
    if (item.id === 'overview') {
      return (
        activeSubTab === 'overview' ||
        activeSubTab === 'dashboard' ||
        activeSubTab === '' ||
        !activeSubTab
      );
    }
    if (item.id === 'students') {
      return activeSubTab === 'students' || activeSubTab === 'admissions';
    }
    if (item.id === 'teachers') {
      return activeSubTab === 'teachers';
    }
    if (item.id === 'classes') {
      return activeSubTab === 'classes';
    }
    if (item.id === 'settings') {
      return (
        activeSubTab === 'settings' ||
        activeSubTab === 'site_settings' ||
        activeSubTab === 'audit' ||
        activeSubTab === 'site_editor'
      );
    }
    return activeSubTab === item.id;
  };

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-[9980] bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border-t border-amber-500/20 dark:border-stone-800 pb-safe shadow-[0_-10px_35px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_35px_rgba(0,0,0,0.6)] select-none transition-colors transform-gpu print:hidden"
    >
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around gap-1.5">
        {navItems.map((item) => {
          const isActive = isCurrentActive(item);
          const Icon = item.icon;
          const label = isSi ? item.labelSi : item.labelEn;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex-1 min-h-[48px] py-1 px-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer active:scale-95 touch-manipulation relative ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400 font-black'
                  : 'text-slate-500 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 font-medium'
              }`}
            >
              {/* Material 3 Active Pill Indicator */}
              <div
                className={`px-4 py-1 rounded-full transition-all duration-150 flex items-center justify-center relative ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 text-amber-600 dark:text-amber-300 ring-1 ring-amber-400/40 shadow-xs'
                    : 'bg-transparent text-slate-500 dark:text-stone-400'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 stroke-[2.6] animate-icon-pulse-glow' : 'stroke-[1.8]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 bg-amber-500 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.9)]" />
                )}
              </div>

              <span className="text-[10px] xs:text-[10.5px] sm:text-[11px] tracking-tight w-full text-center px-0.5 truncate leading-tight font-sans font-bold pt-0.5">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
