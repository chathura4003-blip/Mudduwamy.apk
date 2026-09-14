import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PirivenaLogo } from './PirivenaLogo';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Menu,
  X,
  BarChart3,
  Users,
  School,
  UserCheck,
  Award,
  Heart,
  Bot,
  ShieldCheck,
  FileBadge,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Sparkles,
  BookOpen,
  ClipboardList,
  Globe,
  ArrowLeft,
  QrCode,
  FileText,
  ExternalLink,
  Calendar,
  Newspaper,
  Image as ImageIcon,
} from 'lucide-react';

import { triggerHaptic } from '../utils/haptics';
import { navigationHistoryManager } from '../services/navigationHistoryManager';
import { CURRENT_APP_VERSION, useAppVersion } from '../utils/appVersion';
import { getImageUrl, handleAvatarError } from '../utils/imageHelper';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAiAssistant: () => void;
  onOpenCertModal?: () => void;
  onOpenQrModal?: () => void;
  onOpenReportCardModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = React.memo(({
  onOpenAiAssistant,
  onOpenCertModal,
  onOpenQrModal,
  onOpenReportCardModal,
}) => {
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const appVersion = useAppVersion();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
    try {
      if (user?.role === 'admin' || user?.role === 'superadmin') {
        return sessionStorage.getItem('pirivena_admin_tab') || 'overview';
      } else if (user?.role === 'teacher') {
        return sessionStorage.getItem('pirivena_teacher_tab') || 'overview';
      } else {
        return sessionStorage.getItem('pirivena_student_tab') || 'overview';
      }
    } catch (e) {
      return 'overview';
    }
  });

  // Sync activeSubTab whenever user or user role changes
  useEffect(() => {
    try {
      if (user?.role === 'admin' || user?.role === 'superadmin') {
        setActiveSubTab(sessionStorage.getItem('pirivena_admin_tab') || 'overview');
      } else if (user?.role === 'teacher') {
        setActiveSubTab(sessionStorage.getItem('pirivena_teacher_tab') || 'overview');
      } else if (user?.role === 'student') {
        setActiveSubTab(sessionStorage.getItem('pirivena_student_tab') || 'overview');
      }
    } catch {
      setActiveSubTab('overview');
    }
  }, [user?.role, user?.id]);

  // Connect mobile menu drawer with Android back button
  useEffect(() => {
    if (isDrawerOpen) {
      navigationHistoryManager.pushModal('navbar_drawer', () => setIsDrawerOpen(false), 60);
    } else {
      navigationHistoryManager.removeModal('navbar_drawer');
    }
    return () => {
      navigationHistoryManager.removeModal('navbar_drawer');
    };
  }, [isDrawerOpen]);

  const [portalStats, setPortalStats] = useState<{
    materialsCount?: number;
    examsCount?: number;
    resultsCount?: number;
    libraryCount?: number;
  }>({});

  useEffect(() => {
    const handleSubTabChange = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        const clean = e.detail === 'dashboard' ? 'overview' : e.detail;
        setActiveSubTab(clean);
      }
    };
    const handleStats = (e: any) => {
      if (e.detail && typeof e.detail === 'object') {
        setPortalStats(e.detail);
      }
    };
    window.addEventListener('switch-portal-subtab', handleSubTabChange);
    window.addEventListener('student-portal-stats', handleStats);
    window.dispatchEvent(new CustomEvent('request-student-portal-stats'));

    return () => {
      window.removeEventListener('switch-portal-subtab', handleSubTabChange);
      window.removeEventListener('student-portal-stats', handleStats);
    };
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
    };
  }, [isDrawerOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  if (!user) return null;

  const handleSubTabNav = (subTabId: string) => {
    triggerHaptic('light');
    const target = subTabId === 'dashboard' ? 'overview' : subTabId;
    setActiveSubTab(target);
    setIsDrawerOpen(false);

    setTimeout(() => {
      try {
        if (user?.role === 'admin' || user?.role === 'superadmin') {
          sessionStorage.setItem('pirivena_admin_tab', target);
        } else if (user?.role === 'teacher') {
          sessionStorage.setItem('pirivena_teacher_tab', target);
        } else {
          sessionStorage.setItem('pirivena_student_tab', target);
        }
      } catch (e) { }
      window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: target }));
      if (window.pageYOffset > 50 || document.documentElement.scrollTop > 50) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, 0);
  };

  const isSi = language === 'si';

  const roleText =
    user.role === 'admin' || user.role === 'superadmin'
      ? isSi ? 'පරිපාලක' : 'Administrator'
      : user.role === 'teacher'
        ? isSi ? 'ගුරුභවත්' : 'Teacher'
        : isSi ? 'ශිෂ්‍ය' : 'Student';

  // Role-Specific Bilingual Mobile Modules
  const getModulesForRole = () => {
    if (user.role === 'admin' || user.role === 'superadmin') {
      return [
        { id: 'overview', label: isSi ? 'ප්‍රධාන පුවරුව' : 'Dashboard Overview', icon: BarChart3, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
        { id: 'students', label: isSi ? 'ශිෂ්‍ය කළමනාකරණය' : 'Students Directory', icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
        { id: 'teachers', label: isSi ? 'ගුරු කළමනාකරණය' : 'Teachers Directory', icon: Users, color: 'text-stone-600 bg-stone-100 dark:bg-stone-800' },
        { id: 'classes', label: isSi ? 'පන්ති & විෂයයන්' : 'Classes & Curriculum', icon: School, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
        { id: 'admissions', label: isSi ? 'නව ඇතුළත් කිරීම්' : 'Online Admissions', icon: UserCheck, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' },
        { id: 'exam_reviews', label: isSi ? 'විභාග සහ ලකුණු' : 'Examinations & Marks', icon: Award, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
        { id: 'donations_manager', label: isSi ? 'පින්කම් අරමුදල' : 'Pinkama Donations', icon: Heart, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
        { id: 'site_news', label: isSi ? 'පුවත් සහ නිවේදන' : 'News & Announcements', icon: Newspaper, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
        { id: 'site_events', label: isSi ? 'උත්සව & දින දර්ශනය' : 'Events & Calendar', icon: Calendar, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
        { id: 'site_gallery', label: isSi ? 'ඡායාරූප ගැලරිය' : 'Photo Gallery', icon: ImageIcon, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/60' },
        { id: 'site_library', label: isSi ? 'ඩිජිටල් පුස්තකාලය' : 'Digital Library', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
        { id: 'site_general', label: isSi ? 'වෙබ් අඩවි තොරතුරු' : 'Site Settings', icon: Globe, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
        { id: 'site_about', label: isSi ? 'අප ගැන විස්තර' : 'About Us Content', icon: FileText, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/60' },
        { id: 'audit', label: isSi ? 'ආරක්ෂක සටහන්' : 'Security Audit Trail', icon: ShieldCheck, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60' },
        { id: 'settings', label: isSi ? 'පද්ධති සැකසුම් හා Backup' : 'System Settings & Backup', icon: Settings, color: 'text-slate-600 bg-slate-100 dark:bg-stone-800' },
      ];
    } else if (user.role === 'teacher') {
      return [
        { id: 'overview', label: isSi ? 'ප්‍රධාන පුවරුව' : 'Teacher Dashboard', icon: BarChart3, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
        { id: 'timetable', label: isSi ? 'මගේ කාලසටහන' : 'My Timetable', icon: Calendar, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
        { id: 'monitoring', label: isSi ? 'සජීවී විභාග අධීක්ෂණය' : 'Live Exam Monitoring', icon: Award, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
        { id: 'roster', label: isSi ? 'ශිෂ්‍ය නාමාවලිය' : 'Student Roster', icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
        { id: 'exams', label: isSi ? 'විභාග කළමනාකරණය' : 'Exam Management', icon: ClipboardList, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
        { id: 'materials', label: isSi ? 'අධ්‍යයන නිබන්ධන' : 'Study Resources', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
        { id: 'settings', label: isSi ? 'ගිණුම් සැකසුම් & තොරතුරු' : 'Settings & Info', icon: Settings, color: 'text-slate-600 bg-slate-100 dark:bg-stone-800' },
      ];
    } else {
      return [
        { id: 'overview', label: isSi ? 'ප්‍රධාන පුවරුව' : 'Student Overview', icon: BarChart3, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
        { id: 'materials', label: isSi ? 'අධ්‍යයන නිබන්ධන' : 'Study Materials', icon: BookOpen, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
        { id: 'exams', label: isSi ? 'මාර්ගගත විභාග' : 'Online Exams', icon: ClipboardList, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
        { id: 'results', label: isSi ? 'විභාග ප්‍රතිඵල & විග්‍රහ' : 'Exam Results & Review', icon: Award, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
        { id: 'library', label: isSi ? 'ඩිජිටල් පුස්තකාලය' : 'Digital E-Library', icon: School, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
        { id: 'timetable', label: isSi ? 'පන්ති කාලසටහන' : 'Class Timetable', icon: Calendar, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' },
        { id: 'settings', label: isSi ? 'සැකසුම් & APK විස්තර' : 'Settings & APK Info', icon: Settings, color: 'text-slate-600 bg-slate-100 dark:bg-stone-800' },
      ];
    }
  };

  const currentModules = getModulesForRole();

  const isSubTab = activeSubTab !== 'overview' && activeSubTab !== 'dashboard';
  const activeModule =
    currentModules.find((m) => m.id === activeSubTab) ||
    (isSubTab
      ? {
        id: activeSubTab,
        label: isSi ? 'පද්ධති අංශය' : 'Section',
        icon: BarChart3,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60',
      }
      : undefined);

  return (
    <>
      {/* 📱 1. ULTRA CLEAN NATIVE MOBILE APP HEADER */}
      <header className="w-full select-none transition-colors">
        <div className="px-2.5 sm:px-5 py-1.5 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2.5">
          {/* Left: Logged-in User Profile vs Sub-Tab Back Navigation */}
          {isSubTab && activeModule ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={() => handleSubTabNav('overview')}
                className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-2xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-900 dark:text-white flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 border border-slate-200/80 dark:border-stone-700 shadow-2xs"
                title={isSi ? 'ආපසු ප්‍රධාන පුවරුවට' : 'Back to Dashboard'}
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.4]" />
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
                <div
                  className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${activeModule.color}`}
                >
                  <activeModule.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <span className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight">
                  {activeModule.label}
                </span>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 min-w-0 flex-1 truncate select-none"
            >
              {/* User Avatar with Active Dot */}
              <div className="relative shrink-0">
                {user.avatar ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt={user.name}
                    onError={handleAvatarError}
                    className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-2xl object-cover border border-amber-500/40 shadow-xs"
                  />
                ) : (
                  <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 dark:from-amber-700 dark:to-amber-500 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-xs border border-amber-300/40">
                    {user.monkStatus === 'monk' || user.monkName ? (
                      <span className="inline-block animate-icon-pulse-glow">🪷</span>
                    ) : (
                      (user.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-500 border-2 border-white dark:border-stone-900 rounded-full animate-pulse" />
              </div>

              {/* User Name & Role Status */}
              <div className="min-w-0 flex-1 truncate">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block leading-snug">
                  {user.monkName || user.name || (isSi ? 'පරිශීලක' : 'User')}
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 truncate block leading-normal">
                  {roleText} {user.customId ? `• ${user.customId}` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Right: Clean Touch Icons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* AI Assistant Icon */}
            {!isSubTab && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenAiAssistant();
                }}
                className="w-8.5 h-8.5 sm:w-10 sm:h-10 min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] touch-manipulation rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 hover:text-white flex items-center justify-center shadow-xs transition cursor-pointer active:scale-90 group border border-amber-400/40 p-1.5"
                title={isSi ? 'AI ධර්ම සහකාර' : 'AI Dharma Copilot'}
                aria-label="AI Assistant"
              >
                <Bot className="w-full h-full animate-icon-pulse-glow group-hover:scale-110 transition-transform" />
              </button>
            )}

            {/* Language Switch Button (Always visible on header for seamless 1-tap switch) */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setLanguage(isSi ? 'en' : 'si');
              }}
              className="h-8.5 sm:h-10 min-h-[34px] sm:min-h-[36px] px-2 sm:px-3 touch-manipulation rounded-2xl text-[10px] sm:text-[11px] font-black border border-slate-200 dark:border-stone-700 bg-slate-100 dark:bg-stone-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition cursor-pointer active:scale-95 flex items-center justify-center shadow-2xs shrink-0 leading-none"
              title={isSi ? 'Switch to English' : 'සිංහල භාෂාවට මාරු වන්න'}
              aria-label="Switch Language"
            >
              <span>{isSi ? 'EN' : 'සිංහල'}</span>
            </button>

            {/* Dark / Light Toggle - hidden on extra small screens (<360px) to avoid crowding, fully accessible in drawer */}
            {!isSubTab && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  toggleTheme();
                }}
                className="hidden xs:flex w-8.5 h-8.5 sm:w-10 sm:h-10 min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] touch-manipulation rounded-2xl items-center justify-center border border-slate-200 dark:border-stone-700 bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer active:scale-90 shadow-2xs group"
                title={
                  isDarkMode
                    ? isSi
                      ? 'දිවා මාදිලිය'
                      : 'Light Mode'
                    : isSi
                      ? 'රාත්‍රී මාදිලිය'
                      : 'Dark Mode'
                }
                aria-label="Toggle Theme"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 animate-icon-spin-slow group-hover:rotate-90 transition-transform" strokeWidth={2.2} />
                ) : (
                  <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700 animate-icon-float group-hover:rotate-12 transition-transform" strokeWidth={2.2} />
                )}
              </button>
            )}

            {/* [☰ Menu] Button (Always on the Right Side!) */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsDrawerOpen(true);
              }}
              className="w-8.5 h-8.5 sm:w-10 sm:h-10 min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] touch-manipulation rounded-2xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-900 dark:text-white flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0 border border-slate-200/80 dark:border-stone-700 shadow-2xs"
              title={isSi ? 'මෙනුව විවෘත කරන්න' : 'Open Navigation Menu'}
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.4]" />
            </button>
          </div>
        </div>
      </header>

      {/* 📱 2. PORTALED SLIDE-OUT MOBILE APP DRAWER (RIGHT-SIDE OPENING) */}
      {isDrawerOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-sm flex justify-end select-none animate-fade-in"
            onClick={() => setIsDrawerOpen(false)}
          >
            <div
              className="w-[88vw] max-w-sm bg-white dark:bg-stone-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-stone-800 rounded-l-[32px] overflow-hidden pt-safe pb-safe"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Top Header: User Profile & Close Button */}
              <div className="p-4 border-b border-slate-100 dark:border-stone-800 bg-slate-50/80 dark:bg-stone-850 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {user.avatar ? (
                      <img
                        src={getImageUrl(user.avatar)}
                        alt={user.name}
                        onError={handleAvatarError}
                        className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xs"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 dark:from-amber-700 dark:to-amber-500 text-white flex items-center justify-center font-black text-base shadow-xs border border-amber-300/40">
                        {user.monkStatus === 'monk' || user.monkName
                          ? '🪷'
                          : (user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-stone-900 rounded-full" />
                  </div>

                  <div className="min-w-0 flex-1 truncate">
                    <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white truncate">
                      {user.monkName || user.name || (isSi ? 'පරිශීලක' : 'User')}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase inline-block">
                        {roleText}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold inline-block">
                        v{appVersion}
                      </span>
                      {user.customId && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          {user.customId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-9 h-9 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-stone-800 rounded-2xl flex items-center justify-center transition cursor-pointer active:scale-90 border border-slate-200/80 dark:border-stone-700 shadow-2xs shrink-0"
                  title={isSi ? 'වසන්න' : 'Close'}
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Drawer Scrollable Nav Links */}
              <div className="p-3.5 space-y-1.5 overflow-y-auto flex-1 scrollbar-thin">
                <div className="text-[10px] font-black text-slate-400 uppercase px-3 py-1 tracking-wider">
                  {isSi ? 'ප්‍රධාන මොඩියුල' : 'MAIN MODULES'}
                </div>

                {currentModules.map((mod) => {
                  const Icon = mod.icon;
                  const isActive = activeSubTab === mod.id;

                  let countBadge: number | undefined;
                  if (mod.id === 'materials' && portalStats.materialsCount) countBadge = portalStats.materialsCount;
                  if (mod.id === 'exams' && portalStats.examsCount) countBadge = portalStats.examsCount;
                  if (mod.id === 'results' && portalStats.resultsCount) countBadge = portalStats.resultsCount;
                  if (mod.id === 'library' && portalStats.libraryCount) countBadge = portalStats.libraryCount;

                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleSubTabNav(mod.id)}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer active:scale-95 text-left ${isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-md'
                        : 'bg-slate-50/80 dark:bg-stone-800/60 hover:bg-slate-100 text-slate-800 dark:text-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isActive
                            ? 'bg-white/20 dark:bg-slate-900/20'
                            : mod.color
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs truncate font-bold">{mod.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {countBadge !== undefined && countBadge > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${isActive
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              }`}
                          >
                            {countBadge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-white dark:text-slate-900 opacity-100' : 'opacity-40'
                            }`}
                        />
                      </div>
                    </button>
                  );
                })}

                <div className="text-[10px] font-black text-slate-400 uppercase px-3 pt-3 pb-1 tracking-wider">
                  {isSi ? 'විශේෂාංග & සේවා' : 'SMART TOOLS'}
                </div>

                {/* AI Copilot in Drawer */}
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenAiAssistant();
                  }}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 text-slate-900 dark:text-white flex items-center justify-between gap-3 transition cursor-pointer active:scale-95 text-left border border-blue-500/20 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 animate-icon-pulse-glow" />
                    </div>
                    <span className="text-xs font-black">
                      {isSi ? 'AI ධර්ම සහකාර' : 'AI Dharma Copilot'}
                    </span>
                  </div>
                  <Sparkles className="w-4 h-4 text-blue-500 shrink-0 animate-icon-sparkle" />
                </button>

                {/* Academic Report Card Modal */}
                {onOpenReportCardModal && (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenReportCardModal();
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50/80 dark:bg-stone-800/60 hover:bg-slate-100 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-3 transition cursor-pointer active:scale-95 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4 animate-icon-bounce" />
                      </div>
                      <span className="text-xs font-bold">
                        {isSi ? 'ප්‍රගති වාර්තාව' : 'Academic Report Card'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Certificate Verification */}
                {onOpenCertModal && (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenCertModal();
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50/80 dark:bg-stone-800/60 hover:bg-slate-100 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-3 transition cursor-pointer active:scale-95 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                        <FileBadge className="w-4 h-4 animate-icon-sparkle" />
                      </div>
                      <span className="text-xs font-bold">
                        {isSi ? 'සහතික සත්‍යාපනය' : 'Verify Certificate'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                {/* Student QR Modal */}
                {onOpenQrModal && (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenQrModal();
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50/80 dark:bg-stone-800/60 hover:bg-slate-100 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-3 transition cursor-pointer active:scale-95 text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <QrCode className="w-4 h-4 animate-icon-pulse-glow" />
                      </div>
                      <span className="text-xs font-bold">
                        {isSi ? 'මගේ QR හැඳුනුම්පත' : 'My QR ID Card'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3.5 pb-safe border-t border-slate-100 dark:border-stone-800 bg-slate-50/80 dark:bg-stone-900/90 shrink-0 space-y-2.5">
                {/* Theme & Language Quick Switchers */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Theme Switch */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      toggleTheme();
                    }}
                    className="py-2.5 px-3 min-h-[44px] touch-manipulation rounded-2xl bg-white dark:bg-stone-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-stone-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-2xs group"
                    title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  >
                    {isDarkMode ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-400 animate-icon-spin-slow" />
                        <span>{isSi ? 'දිවා මාදිලිය' : 'Light'}</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-slate-700 animate-icon-float" />
                        <span>{isSi ? 'රාත්‍රී මාදිලිය' : 'Dark'}</span>
                      </>
                    )}
                  </button>

                  {/* Language Switch */}
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setLanguage(isSi ? 'en' : 'si');
                    }}
                    className="py-2.5 px-3 min-h-[44px] touch-manipulation rounded-2xl bg-white dark:bg-stone-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-stone-700 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-2xs group"
                    title="Toggle Language"
                  >
                    <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-icon-spin-slow" />
                    <span>{isSi ? 'English' : 'සිංහල'}</span>
                  </button>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    logout();
                  }}
                  className="w-full py-3 min-h-[44px] touch-manipulation bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 border border-rose-200 dark:border-rose-800 shadow-2xs group"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>{isSi ? 'පද්ධතියෙන් ඉවත් වන්න' : 'Sign Out of ERP'}</span>
                </button>

                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-mono font-bold">
                  {isSi ? `ශ්‍රී සුමන මහා පිරිවෙන් ERP v${appVersion}` : `Sri Sumana Pirivena ERP v${appVersion}`}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
});

Navbar.displayName = 'Navbar';
