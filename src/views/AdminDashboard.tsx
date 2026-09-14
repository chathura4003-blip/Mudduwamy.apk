import React, { useState, useEffect, useMemo, useRef, useCallback, startTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type {
  User,
  PirivenaClass,
  Subject,
  NewsArticle,
  SystemAuditLog,
  Exam,
  ExamSubmission,
  OnlineAdmission,
} from '../types';
import { PublicSiteEditor } from '../components/PublicSiteEditor';
import { AdminDonationsManager } from '../components/AdminDonationsManager';
import { AdminWelcomeModal } from '../components/AdminWelcomeModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { PullToRefreshWrapper } from '../components/PullToRefreshWrapper';
import { usePublicSite, triggerRealtimeSync } from '../context/PublicSiteContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import { cachedFetch, getCachedData, invalidateCache } from '../utils/dataCache';
import { generateSmartSubjectCode } from '../utils/subjectHelper';
import { copyToClipboard } from '../utils/clipboardHelper';
import { navigationHistoryManager } from '../services/navigationHistoryManager';
import { appLifecycleManager } from '../services/appLifecycleManager';
import {
  usersApi,
  classesApi,
  subjectsApi,
  examsApi,
  settingsApi,
  contentApi,
  backupApi,
  broadcastApi,
  auditApi,
} from '../api';
import { uploadFile } from '../utils/fileUpload';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Edit,
  QrCode,
  Settings,
  Key,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Bot,
  Camera,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  Mail,
  Copy,
  Check,
  Award,
  BarChart2,
  ClipboardList,
  CheckCircle2,
  HelpCircle,
  UserCheck,
  FileCheck,
  Layers,
  Filter,
  Sparkles,
  Star,
  BookOpenCheck,
  PieChart,
  Heart,
  Printer,
  Phone,
  School,
  Database,
  Server,
  HardDrive,
  AlertTriangle,
  Globe,
  AlertCircle,
  ExternalLink,
  Save,
  X,
  Smartphone,
  Fingerprint,
  Clock,
  Laptop,
  Sliders,
  ShieldAlert,
  Zap,
  ChevronRight,
  ChevronLeft,
  Newspaper,
} from 'lucide-react';

import {
  PIRIVENA_CATEGORIES,
  SUBJECT_CATEGORIES,
  generateClassDefaults,
} from './AdminDashboard/constants';

import {
  AdminTab,
  SecConfig,
  ActiveSession,
  SecAuditLog,
  BackupPreviewData,
  StudentFormState,
  TeacherFormState,
  ClassFormState,
  SubjectFormState,
  BroadcastNoticeFormState,
  ApiKeyFormState,
  AdminSettingsFormState,
} from './AdminDashboard/types';

import {
  OverviewTab,
  StudentsTab,
  TeachersTab,
  ClassesTab,
  AdmissionsTab,
  AuditTab,
  ExamReviewsTab,
  SettingsTab,
} from './AdminDashboard/tabs';

import {
  AddStudentModal,
  AddTeacherModal,
  ClassModal,
  SubjectModal,
  BroadcastNoticeModal,
  BackupPreviewModal,
} from './AdminDashboard/modals';

export { PIRIVENA_CATEGORIES, SUBJECT_CATEGORIES, generateClassDefaults };

interface AdminDashboardProps {
  onSelectStudentQr: (user: User) => void;
  onSelectStudentReportCard?: (user: User) => void;
  initialTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSelectStudentQr,
  onSelectStudentReportCard,
  initialTab,
}) => {
  const { admissions, donations = [], updateAdmissionStatus, deleteAdmission } = usePublicSite();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { isConnected } = useSocket();

  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    try {
      const seen = sessionStorage.getItem('pirivena_admin_welcome_seen');
      if (!seen) {
        sessionStorage.setItem('pirivena_admin_welcome_seen', 'true');
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  });

  // Dynamic Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => Promise<void> | void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'ඔව්, ඉවත් කරන්න',
    cancelText: 'අවලංගු කරන්න',
    variant: 'danger',
    onConfirm: () => { },
    isLoading: false,
  });

  const askConfirmation = useCallback(
    ({
      title,
      message,
      confirmText = 'ඔව්, ඉවත් කරන්න',
      cancelText = 'අවලංගු කරන්න',
      variant = 'danger',
      action,
    }: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      variant?: 'danger' | 'warning' | 'info';
      action: () => Promise<void> | void;
    }) => {
      setConfirmConfig({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        onConfirm: async () => {
          setConfirmConfig((prev) => ({ ...prev, isLoading: true }));
          try {
            await action();
          } finally {
            setConfirmConfig((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          }
        },
        isLoading: false,
      });
    },
    []
  );

  // Connect Admin confirm modal with Android hardware & browser back button
  useEffect(() => {
    if (confirmConfig.isOpen) {
      navigationHistoryManager.pushModal('admin_confirm', () => setConfirmConfig((prev) => ({ ...prev, isOpen: false })), 60);
    } else {
      navigationHistoryManager.removeModal('admin_confirm');
    }
    return () => navigationHistoryManager.removeModal('admin_confirm');
  }, [confirmConfig.isOpen]);

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    try {
      const saved = sessionStorage.getItem('pirivena_admin_tab');
      return (saved as AdminTab) || (initialTab as AdminTab) || 'overview';
    } catch (e) {
      return (initialTab as AdminTab) || 'overview';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('pirivena_admin_tab', activeTab);
      localStorage.removeItem('pirivena_admin_tab');
    } catch (e) { }
  }, [activeTab]);

  // Core Entities State
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<PirivenaClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);

  // Derived teacher and student lists with smart fallback
  const teachers = useMemo(() => users.filter((u) => {
    const r = String(u.role || '').toLowerCase();
    const cId = String(u.customId || u.indexNumber || u.id || '');
    return r === 'teacher' || (!r && cId.startsWith('TCH-')) || (cId.startsWith('TCH-') && r !== 'admin' && r !== 'superadmin');
  }), [users]);

  const students = useMemo(() => users.filter((u) => {
    const r = String(u.role || '').toLowerCase();
    const cId = String(u.customId || u.indexNumber || u.id || '');
    return r === 'student' || (!r && cId.startsWith('STD-')) || (cId.startsWith('STD-') && r !== 'teacher' && r !== 'admin' && r !== 'superadmin');
  }), [users]);

  // Maps for fast lookups
  const teacherExamsMap = useMemo(() => {
    const map = new Map<string, Exam[]>();
    exams.forEach((exam) => {
      if (exam.teacherId) {
        if (!map.has(exam.teacherId)) map.set(exam.teacherId, []);
        map.get(exam.teacherId)!.push(exam);
      }
    });
    return map;
  }, [exams]);

  const examsByClassSubjectMap = useMemo(() => {
    const map = new Map<string, Exam[]>();
    exams.forEach((exam) => {
      const key = `${exam.classId || ''}_${exam.subjectId || ''}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(exam);
    });
    return map;
  }, [exams]);

  const submissionsByExamMap = useMemo(() => {
    const map = new Map<string, ExamSubmission[]>();
    submissions.forEach((sub) => {
      if (sub.examId) {
        if (!map.has(sub.examId)) map.set(sub.examId, []);
        map.get(sub.examId)!.push(sub);
      }
    });
    return map;
  }, [submissions]);

  const teacherByIdMap = useMemo(() => {
    const map = new Map<string, User>();
    teachers.forEach((t) => {
      if (t.id) map.set(t.id, t);
      if (t.customId) map.set(t.customId, t);
    });
    return map;
  }, [teachers]);

  const switchSubTab = (tab: AdminTab) => {
    navigationHistoryManager.recordTabNavigation(tab);
    React.startTransition(() => {
      setActiveTab(tab);
    });
    try {
      localStorage.setItem('pirivena_admin_tab', tab);
    } catch (e) { }
    window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: tab }));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const handleSubTabNav = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        let target = e.detail as AdminTab;
        if (e.detail === 'dashboard') target = 'overview';
        if (e.detail === 'exams') target = 'exam_reviews';
        if (e.detail === 'donations') target = 'donations_manager';
        if (e.detail === 'site_news' || e.detail === 'news') target = 'site_news';
        if (e.detail === 'site_events' || e.detail === 'events') target = 'site_events';
        if (e.detail === 'site_gallery' || e.detail === 'gallery') target = 'site_gallery';
        if (e.detail === 'site_library' || e.detail === 'library') target = 'site_library';
        if (e.detail === 'site_general' || e.detail === 'general' || e.detail === 'site_settings') target = 'site_general';
        if (e.detail === 'site_about' || e.detail === 'about') target = 'site_about';

        React.startTransition(() => {
          setActiveTab((prev) => (prev !== target ? target : prev));
        });
        try {
          localStorage.setItem('pirivena_admin_tab', target);
        } catch (err) { }
      }
    };
    window.addEventListener('switch-portal-subtab', handleSubTabNav);
    return () => window.removeEventListener('switch-portal-subtab', handleSubTabNav);
  }, []);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopy = async (text: string, label: string, customMessage?: string) => {
    try {
      const ok = await copyToClipboard(text);
      if (ok) {
        setCopiedKey(label);

        let msg = customMessage;
        if (!msg) {
          if (label.startsWith('id-')) {
            msg = `✓ හැඳුනුම්පත් අංකය (${text}) සාර්ථකව Copy විය!`;
          } else if (label.startsWith('pwd-') || label.startsWith('tch-pass-') || label.startsWith('pass-')) {
            msg = `✓ ප්‍රවේශ මුරපදය (Password) සාර්ථකව Copy විය!`;
          } else if (label.startsWith('share-') || label.startsWith('cred-')) {
            msg = `✓ සම්පූර්ණ ප්‍රවේශ තොරතුරු (Login Credentials) සාර්ථකව Copy විය!`;
          } else if (label.startsWith('phone-')) {
            msg = `✓ දුරකථන අංකය (${text}) සාර්ථකව Copy විය!`;
          } else if (label.startsWith('email-')) {
            msg = `✓ විද්‍යුත් තැපෑල (${text}) සාර්ථකව Copy විය!`;
          } else {
            msg = `✓ ${label} සාර්ථකව පිටපත් කරගන්නා ලදී (Copied)!`;
          }
        }
        toast.success(msg);
        setTimeout(() => setCopiedKey(null), 2500);
      } else {
        toast.error('පිටපත් කිරීමට නොහැකි විය.');
      }
    } catch (e) {
      toast.error('පිටපත් කිරීමට නොහැකි විය.');
    }
  };

  // Admin Settings Form State
  const [adminSettingsForm, setAdminSettingsForm] = useState<AdminSettingsFormState>({
    name: user?.monkName || user?.name || '',
    nameSinhala: user?.nameSinhala || '',
    email: user?.email || '',
    password: '',
    showPassword: false,
    phone: user?.phone || '',
    monkStatus: user?.monkStatus || 'monk',
    address: user?.address || '',
  });

  useEffect(() => {
    if (user) {
      setAdminSettingsForm((prev) => ({
        ...prev,
        name: user.monkName || user.name || prev.name,
        nameSinhala: user.nameSinhala || prev.nameSinhala,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        monkStatus: user.monkStatus || prev.monkStatus,
        address: user.address || prev.address,
      }));
    }
  }, [user]);

  const [adminSaveSuccess, setAdminSaveSuccess] = useState(false);

  // Advanced Security & Account Settings State
  const [secConfig, setSecConfig] = useState<SecConfig>(() => {
    try {
      const saved = localStorage.getItem('pirivena_sec_config');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {
      enable2FA: false,
      masterPin: '778899',
      autoLogoutMinutes: 60,
      ipWhitelistEnabled: false,
      allowedIps: '',
      blockSuspiciousLogins: true,
    };
  });

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(() => {
    let os = 'Windows 11';
    let browser = 'Google Chrome';
    let device = 'Desktop PC';
    let deviceType: 'mobile' | 'desktop' | 'tablet' | 'native_app' = 'desktop';

    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      const isNative = !!((window as any).Capacitor?.isNativePlatform?.() || (window as any).isNativeApp);
      
      if (/android/i.test(ua)) {
        os = 'Android 14';
        device = isNative ? 'Sri Sumana ERP Mobile App (APK)' : 'Android Smartphone';
        deviceType = isNative ? 'native_app' : 'mobile';
      } else if (/iPad|iPhone|iPod/.test(ua)) {
        os = 'Apple iOS 18';
        device = /iPad/.test(ua) ? 'Apple iPad' : 'Apple iPhone';
        deviceType = /iPad/.test(ua) ? 'tablet' : 'mobile';
      } else if (/Windows/i.test(ua)) {
        os = 'Windows 11 / 10 PC';
        device = 'Windows Workstation';
        deviceType = 'desktop';
      } else if (/Macintosh|Mac OS X/i.test(ua)) {
        os = 'macOS Sonoma';
        device = 'Apple Mac';
        deviceType = 'desktop';
      } else if (/Linux/i.test(ua)) {
        os = 'Linux OS';
        device = 'Linux Workstation';
        deviceType = 'desktop';
      }

      if (isNative) browser = 'Capacitor Native Engine';
      else if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
      else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
      else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
      else if (/Safari\//i.test(ua)) browser = 'Apple Safari';
    }

    return [
      {
        id: 'sess_current',
        device: `${device} • ${browser}`,
        deviceType,
        os,
        ip: '175.157.22.10',
        location: 'Ratnapura, Sri Lanka',
        isCurrent: true,
        lastActive: 'සක්‍රීයයි (Active Now)',
        browser,
        fingerprint: 'FP-SUMANA-8821',
        loginTime: 'අද පෙ.ව. 08:30 (Today)',
        screenRes: typeof window !== 'undefined' ? `${window.screen.width} × ${window.screen.height}` : '1920 × 1080',
        status: 'active',
      },
      {
        id: 'sess_backup_pc',
        device: 'Windows 11 Office PC • Firefox 128',
        deviceType: 'desktop',
        os: 'Windows 11 Pro',
        ip: '112.134.18.42',
        location: 'Colombo, Sri Lanka',
        isCurrent: false,
        lastActive: 'මීට මිනිත්තු 25 කට පෙර',
        browser: 'Mozilla Firefox',
        fingerprint: 'FP-SUMANA-3490',
        loginTime: 'ඊයේ ප.ව. 04:15 (Yesterday)',
        screenRes: '1920 × 1080',
        status: 'idle',
      },
    ];
  });

  const [secAuditLogs, setSecAuditLogs] = useState<SecAuditLog[]>([
    {
      id: 'log_1',
      action: 'Superadmin Login Success',
      ip: '175.157.22.10',
      time: 'මීට මිනිත්තු 2 කට පෙර',
      severity: 'success',
      details: 'Chrome Browser via Android Device',
    },
    {
      id: 'log_2',
      action: 'Master Security PIN Verified',
      ip: '175.157.22.10',
      time: 'මීට මිනිත්තු 15 කට පෙර',
      severity: 'info',
      details: 'Elevated Superadmin Permissions Granted',
    },
    {
      id: 'log_3',
      action: 'Google Gemini AI Key Synced',
      ip: '175.157.22.10',
      time: 'මීට පැයකට පෙර',
      severity: 'success',
      details: 'Primary AI Model: gemini-2.5-flash',
    },
  ]);

  const [auditLogFilter, setAuditLogFilter] = useState<'all' | 'success' | 'warning' | 'info'>('all');

  const handleSaveMasterPin = () => {
    if (!secConfig.masterPin || secConfig.masterPin.length < 4) {
      toast.error('Master PIN එක සඳහා අවම වශයෙන් ලකුණු 4ක් ඇතුළත් කරන්න.');
      return;
    }
    try {
      localStorage.setItem('pirivena_sec_config', JSON.stringify(secConfig));
      toast.success('Master Security PIN එක සාර්ථකව සුරකින ලදී!');
      setSecAuditLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          action: 'Master Security PIN Updated',
          ip: '175.157.22.10',
          time: 'දැන් (Just now)',
          severity: 'info',
          details: `Master PIN changed to [****${secConfig.masterPin.slice(-2)}]`,
        },
        ...prev,
      ]);
    } catch (e) {
      toast.error('Master PIN එක සුරැකීමට නොහැකි විය.');
    }
  };

  const fetchActiveSessions = useCallback(async () => {
    try {
      const res = await settingsApi.getActiveSessions();
      if (res?.sessions && res.sessions.length > 0) {
        setActiveSessions(res.sessions);
      }
    } catch (e) {
      console.warn('Could not fetch active sessions from server:', e);
    }
  }, []);

  useEffect(() => {
    fetchActiveSessions();
    // 🔄 Auto-sync active sessions gently (30s) only when tab is active
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchActiveSessions();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveSessions]);

  const handleRevokeSingleSession = async (sessionId: string, userName: string) => {
    try {
      await settingsApi.forceLogoutUser(sessionId);
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId && s.userId !== sessionId));
      
      // Real-time broadcast to immediately kick user back to login screen on mobile/web
      window.dispatchEvent(new CustomEvent('pirivena-users-updated', {
        detail: { action: 'delete', deletedUserId: sessionId }
      }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('pirivena-admin-sync');
        bc.postMessage({ type: 'users-updated', action: 'delete', deletedUserId: sessionId });
        bc.close();
      }

      toast.success(`${userName} ගිණුම සාර්ථකව Log Out කරන ලදී! (User session terminated)`);
      setSecAuditLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          action: 'Force Logout Executed',
          ip: '175.157.22.10',
          time: 'දැන් (Just now)',
          severity: 'warning',
          details: `User [${userName} / ${sessionId}] was logged out by Admin`,
        },
        ...prev,
      ]);
    } catch (e) {
      toast.error('Session එක අක්‍රිය කිරීමට නොහැකි විය.');
    }
  };

  const handleRevokeOtherSessions = async () => {
    try {
      await settingsApi.forceLogoutRole('all_others');
      setActiveSessions((prev) => prev.filter((s) => s.isCurrent));
      
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('pirivena-admin-sync');
        bc.postMessage({ type: 'users-updated', action: 'delete' });
        bc.close();
      }

      toast.success('අනෙකුත් සියලුම පරිශීලකයින් සාර්ථකව Log Out කරන ලදී!');
      setSecAuditLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          action: 'Mass Session Termination',
          ip: '175.157.22.10',
          time: 'දැන් (Just now)',
          severity: 'danger',
          details: 'All other active sessions revoked by Admin',
        },
        ...prev,
      ]);
    } catch (e) {
      toast.error('සැසි අක්‍රිය කිරීම අසාර්ථක විය.');
    }
  };

  const handleRefreshSessions = async () => {
    await fetchActiveSessions();
    toast.success('සක්‍රීය පරිශීලක ලැයිස්තුව සාර්ථකව යාවත්කාලීන කරන ලදී!');
  };

  const handleClearSecAuditLogs = () => {
    setSecAuditLogs([
      {
        id: `log_${Date.now()}`,
        action: 'Audit Log Cleared by Superadmin',
        ip: '175.157.22.10',
        time: 'දැන් (Just now)',
        severity: 'info',
        details: 'System Security Audit Trail reset',
      },
    ]);
    toast.success('ආරක්ෂක සිදුවීම් සටහන (Audit Log) පිරිසිදු කරන ලදී!');
  };

  const handleExportAuditLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(secAuditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pirivena_security_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('ආරක්ෂක සිදුවීම් සටහන JSON ගොනුවක් ලෙස Download විය!');
  };

  // API Keys Form State
  const defaultEnvGeminiKey =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GEMINI_API_KEY)) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    '';
  const defaultEnvOpenRouterKey =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_OPENROUTER_API_KEY || import.meta.env?.OPENROUTER_API_KEY)) ||
    (typeof process !== 'undefined' && process.env?.OPENROUTER_API_KEY) ||
    '';
  const defaultEnvPrimaryProvider =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_PRIMARY_PROVIDER || import.meta.env?.PRIMARY_PROVIDER)) ||
    (typeof process !== 'undefined' && process.env?.PRIMARY_PROVIDER) ||
    'gemini';
  const defaultEnvFallbackProvider =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_FALLBACK_PROVIDER || import.meta.env?.FALLBACK_PROVIDER)) ||
    (typeof process !== 'undefined' && process.env?.FALLBACK_PROVIDER) ||
    'openrouter';
  const defaultEnvGeminiModel =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GEMINI_MODEL || import.meta.env?.GEMINI_MODEL)) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_MODEL) ||
    'gemini-2.5-flash';
  const defaultEnvOpenRouterModel =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_OPENROUTER_MODEL || import.meta.env?.OPENROUTER_MODEL)) ||
    (typeof process !== 'undefined' && process.env?.OPENROUTER_MODEL) ||
    'google/gemini-2.0-flash-001';

  const [apiKeyForm, setApiKeyForm] = useState<ApiKeyFormState>({
    geminiApiKey: defaultEnvGeminiKey,
    openRouterApiKey: defaultEnvOpenRouterKey,
    primaryProvider: defaultEnvPrimaryProvider,
    fallbackProvider: defaultEnvFallbackProvider,
    geminiModel: defaultEnvGeminiModel,
    openRouterModel: defaultEnvOpenRouterModel,
    activeAiProvider: defaultEnvPrimaryProvider,
  });
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [openRouterTestResult, setOpenRouterTestResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [isSavingGeminiKey, setIsSavingGeminiKey] = useState(false);
  const [geminiSaveSuccess, setGeminiSaveSuccess] = useState(false);
  const [geminiSaveError, setGeminiSaveError] = useState<string | null>(null);

  const [isSavingOpenRouterKey, setIsSavingOpenRouterKey] = useState(false);
  const [openRouterSaveSuccess, setOpenRouterSaveSuccess] = useState(false);
  const [openRouterSaveError, setOpenRouterSaveError] = useState<string | null>(null);

  const [isSavingAllKeys, setIsSavingAllKeys] = useState(false);
  const [allKeysSaveSuccess, setAllKeysSaveSuccess] = useState(false);

  // Form Submission Hardening & In-Flight Re-entrancy Guards
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [isSavingClass, setIsSavingClass] = useState(false);
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [isSavingNotice, setIsSavingNotice] = useState(false);

  const handleSaveGeminiKeyOnly = async () => {
    setIsSavingGeminiKey(true);
    setGeminiSaveSuccess(false);
    setGeminiSaveError(null);
    try {
      await settingsApi.updateSiteSettings({
        geminiApiKey: apiKeyForm.geminiApiKey,
        activeAiProvider: apiKeyForm.activeAiProvider as any,
      });
      try {
        const curr = localStorage.getItem('pirivena_site_settings');
        const parsed = curr ? JSON.parse(curr) : {};
        parsed.geminiApiKey = apiKeyForm.geminiApiKey;
        parsed.activeAiProvider = apiKeyForm.activeAiProvider;
        localStorage.setItem('pirivena_site_settings', JSON.stringify(parsed));
      } catch (e) { }
      triggerRealtimeSync();

      setGeminiSaveSuccess(true);
      toast.success('Gemini API Key එක සාර්ථකව සුරකින ලදී!');
      setTimeout(() => setGeminiSaveSuccess(false), 5000);
    } catch (e: any) {
      const msg = e?.message || e?.error || 'සම්බන්ධතා දෝෂයකි';
      setGeminiSaveError(msg);
      toast.error(`Gemini API Key සුරැකීමට නොහැකි විය: ${msg}`);
    } finally {
      setIsSavingGeminiKey(false);
    }
  };

  const handleSaveOpenRouterKeyOnly = async () => {
    setIsSavingOpenRouterKey(true);
    setOpenRouterSaveSuccess(false);
    setOpenRouterSaveError(null);
    try {
      await settingsApi.updateSiteSettings({
        openRouterApiKey: apiKeyForm.openRouterApiKey,
        activeAiProvider: apiKeyForm.activeAiProvider as any,
      });
      try {
        const curr = localStorage.getItem('pirivena_site_settings');
        const parsed = curr ? JSON.parse(curr) : {};
        parsed.openRouterApiKey = apiKeyForm.openRouterApiKey;
        parsed.activeAiProvider = apiKeyForm.activeAiProvider;
        localStorage.setItem('pirivena_site_settings', JSON.stringify(parsed));
      } catch (e) { }
      triggerRealtimeSync();

      setOpenRouterSaveSuccess(true);
      toast.success('OpenRouter API Key එක සාර්ථකව සුරකින ලදී!');
      setTimeout(() => setOpenRouterSaveSuccess(false), 5000);
    } catch (e: any) {
      const msg = e?.message || e?.error || 'සම්බන්ධතා දෝෂයකි';
      setOpenRouterSaveError(msg);
      toast.error(`OpenRouter API Key සුරැකීමට නොහැකි විය: ${msg}`);
    } finally {
      setIsSavingOpenRouterKey(false);
    }
  };

  // System Updates & Full Database Backup State
  const [systemStatusInfo, setSystemStatusInfo] = useState<any>(null);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupRestoreMsg, setBackupRestoreMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateStatusMsg, setUpdateStatusMsg] = useState<string | null>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBackupPreview, setSelectedBackupPreview] = useState<BackupPreviewData | null>(null);

  const fetchSystemStatus = async () => {
    try {
      const data = await settingsApi.getSystemStatus();
      setSystemStatusInfo(data);
    } catch (e) {
      console.error('Failed to fetch system status', e);
    }
  };

  const fetchApiKeysAndSettings = async () => {
    try {
      const data = await settingsApi.getSiteSettings();
      if (data) {
        setApiKeyForm((prev) => ({
          ...prev,
          geminiApiKey: data.geminiApiKey || prev.geminiApiKey || defaultEnvGeminiKey || '',
          openRouterApiKey: data.openRouterApiKey || prev.openRouterApiKey || defaultEnvOpenRouterKey || '',
          primaryProvider: data.primaryProvider || prev.primaryProvider || defaultEnvPrimaryProvider || 'gemini',
          fallbackProvider: data.fallbackProvider || prev.fallbackProvider || defaultEnvFallbackProvider || 'openrouter',
          geminiModel: data.geminiModel || prev.geminiModel || defaultEnvGeminiModel || 'gemini-2.5-flash',
          openRouterModel: data.openRouterModel || prev.openRouterModel || defaultEnvOpenRouterModel || 'google/gemini-2.0-flash-001',
          activeAiProvider: data.primaryProvider || prev.activeAiProvider || defaultEnvPrimaryProvider || 'gemini',
        }));
      }
    } catch (e) {
      console.error('Failed to fetch site settings', e);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const data = await settingsApi.testGeminiKey(apiKeyForm.geminiApiKey);
      setGeminiTestResult({
        valid: !!data.success,
        message: data.message || 'Gemini key validation completed',
      });
    } catch (e: any) {
      setGeminiTestResult({ valid: false, message: e.message || 'Gemini connection failed' });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestOpenRouter = async () => {
    setTestingOpenRouter(true);
    setOpenRouterTestResult(null);
    try {
      const data = await settingsApi.testOpenRouterKey(apiKeyForm.openRouterApiKey);
      setOpenRouterTestResult({
        valid: !!data.success,
        message: data.message || 'OpenRouter key validation completed',
      });
    } catch (e: any) {
      setOpenRouterTestResult({
        valid: false,
        message: e.message || 'OpenRouter connection failed',
      });
    } finally {
      setTestingOpenRouter(false);
    }
  };

  const handleSaveApiKeys = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingAllKeys(true);
    setAllKeysSaveSuccess(false);
    try {
      await settingsApi.updateSiteSettings({
        geminiApiKey: apiKeyForm.geminiApiKey,
        openRouterApiKey: apiKeyForm.openRouterApiKey,
        primaryProvider: apiKeyForm.primaryProvider,
        fallbackProvider: apiKeyForm.fallbackProvider,
        geminiModel: apiKeyForm.geminiModel,
        openRouterModel: apiKeyForm.openRouterModel,
        activeAiProvider: apiKeyForm.primaryProvider as any,
      });
      try {
        const curr = localStorage.getItem('pirivena_site_settings');
        const parsed = curr ? JSON.parse(curr) : {};
        parsed.geminiApiKey = apiKeyForm.geminiApiKey;
        parsed.openRouterApiKey = apiKeyForm.openRouterApiKey;
        parsed.primaryProvider = apiKeyForm.primaryProvider;
        parsed.fallbackProvider = apiKeyForm.fallbackProvider;
        parsed.geminiModel = apiKeyForm.geminiModel;
        parsed.openRouterModel = apiKeyForm.openRouterModel;
        parsed.activeAiProvider = apiKeyForm.primaryProvider;
        localStorage.setItem('pirivena_site_settings', JSON.stringify(parsed));
      } catch (e) { }
      triggerRealtimeSync();

      setAllKeysSaveSuccess(true);
      toast.success('සියලුම AI API Keys සහ සැකසුම් සාර්ථකව සුරකින ලදී!');
      setTimeout(() => setAllKeysSaveSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error saving AI settings:', err);
      const msg = err?.message || err?.error || 'සම්බන්ධතා දෝෂයකි';
      toast.error(`AI Keys සුරැකීමට නොහැකි විය: ${msg}`);
    } finally {
      setIsSavingAllKeys(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSystemStatus();
      fetchApiKeysAndSettings();
    }
  }, [activeTab]);

  const handleDownloadFullBackup = async () => {
    setIsDownloadingBackup(true);
    setBackupRestoreMsg(null);
    try {
      const data = await backupApi.exportBackup();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `Pirivena_ERP_Full_Backup_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupRestoreMsg({
        type: 'success',
        text: '✅ සියලුම පද්ධති දත්ත Backup ගොනුව සාර්ථකව Download විය!',
      });
    } catch (e: any) {
      setBackupRestoreMsg({
        type: 'error',
        text: `❌ Backup ලබාගැනීමට අපොහොසත් විය: ${e.message}`,
      });
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  const handleDownloadMysqlDump = async () => {
    setIsDownloadingBackup(true);
    setBackupRestoreMsg(null);
    try {
      const sqlText = await backupApi.exportMysqlDump();
      const blob = new Blob([typeof sqlText === 'string' ? sqlText : JSON.stringify(sqlText)], {
        type: 'text/plain;charset=utf-8',
      });
      const downloadUrl = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', downloadUrl);
      downloadAnchor.setAttribute(
        'download',
        `Pirivena_ERP_MySQL_Dump_${new Date().toISOString().split('T')[0]}.sql`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(downloadUrl);
      setBackupRestoreMsg({
        type: 'success',
        text: '✅ phpMyAdmin / cPanel සඳහා MySQL (.sql) Dump ගොනුව සාර්ථකව Download විය!',
      });
    } catch (e: any) {
      setBackupRestoreMsg({
        type: 'error',
        text: `❌ MySQL Dump ලබාගැනීමට අපොහොසත් විය: ${e.message}`,
      });
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  const handleSelectBackupFileForPreview = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBackupRestoreMsg(null);
    const fileSizeKb = (file.size / 1024).toFixed(1) + ' KB';
    const fileName = file.name;

    const reader = new FileReader();
    reader.onerror = () => {
      setBackupRestoreMsg({
        type: 'error',
        text: '❌ ගොනුව කියවීමේදී දෝෂයක් සිදු විය (Failed to read backup file).',
      });
      event.target.value = '';
    };

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        if (fileName.toLowerCase().endsWith('.sql')) {
          setSelectedBackupPreview({
            fileName,
            fileSizeKb,
            timestamp: new Date(file.lastModified).toLocaleString('si-LK'),
            appName: 'MySQL Database Dump',
            version: 'SQL Schema/Data',
            totalRecords: 0,
            tableDetails: [{ tableName: 'SQL Dump Commands', count: 1 }],
            rawPayload: content,
            isSql: true,
          });
          return;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(content);
        } catch (_) {
          throw new Error('තෝරාගත් ගොනුව නිවැරදි JSON Backup හෝ SQL Dump ගොනුවක් නොවේ (Invalid JSON or SQL file).');
        }

        const tablesObj =
          parsed.tables ||
          parsed.data ||
          parsed.backupData?.tables ||
          parsed.backupData?.data ||
          parsed;

        if (!tablesObj || typeof tablesObj !== 'object') {
          throw new Error('තෝරාගත් Backup ගොනුවේ දත්ත වගු (Database Tables) අඩංගු නොවේ.');
        }

        const tableDetails: { tableName: string; count: number }[] = [];
        let totalRecords = 0;

        for (const [key, val] of Object.entries(tablesObj)) {
          if (Array.isArray(val)) {
            const cnt = val.length;
            totalRecords += cnt;
            tableDetails.push({ tableName: key, count: cnt });
          }
        }

        if (tableDetails.length === 0) {
          throw new Error('තෝරාගත් Backup ගොනුවේ වලංගු දත්ත වගු (Tables with records) හමු නොවිණි.');
        }

        setSelectedBackupPreview({
          fileName,
          fileSizeKb,
          timestamp: parsed.timestamp || new Date(file.lastModified).toLocaleString('si-LK'),
          appName: parsed.appName || 'Sri Sumana Maha Pirivena ERP',
          version: parsed.version || 'v2.4',
          totalRecords,
          tableDetails,
          rawPayload: parsed,
        });
      } catch (err: any) {
        setBackupRestoreMsg({ type: 'error', text: `❌ ${err.message}` });
      } finally {
        event.target.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmExecuteRestore = async () => {
    if (!selectedBackupPreview) return;

    setIsRestoringBackup(true);
    setBackupRestoreMsg(null);
    try {
      let message = '';
      if (selectedBackupPreview.isSql) {
        const resData = await backupApi.restoreMysqlDump(selectedBackupPreview.rawPayload);
        message = resData.message || 'MySQL Database restored successfully from SQL dump';
      } else {
        const resData = await backupApi.restoreBackup(selectedBackupPreview.rawPayload);
        const countsSummary = resData.restoredCounts
          ? Object.entries(resData.restoredCounts)
            .filter(([_, cnt]) => (cnt as number) > 0)
            .map(([tbl, cnt]) => `${tbl}: ${cnt}`)
            .join(', ')
          : 'All tables restored';
        message = `පද්ධති දත්ත සාර්ථකව Restore විය! (${countsSummary || 'සියලුම වගු යාවත්කාලීන විය'})`;
      }

      setBackupRestoreMsg({
        type: 'success',
        text: `🎉 ${message}`,
      });

      setSelectedBackupPreview(null);
      fetchSystemStatus();

      window.dispatchEvent(new CustomEvent('site-data-updated'));

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setBackupRestoreMsg({ type: 'error', text: `❌ Restore සාර්ථක නොවීය: ${err.message}` });
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleSaveAdminSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({
        name: adminSettingsForm.name,
        nameSinhala: adminSettingsForm.nameSinhala,
        monkName: adminSettingsForm.name,
        email: adminSettingsForm.email,
        password: adminSettingsForm.password,
        phone: adminSettingsForm.phone,
        monkStatus: adminSettingsForm.monkStatus as any,
        address: adminSettingsForm.address,
      });
      invalidateCache('/api/users');
      fetchDashboardMetrics();
      setAdminSaveSuccess(true);
      toast.success('පරිපාලක සැකසුම් සාර්ථකව සුරකින ලදී!');
      setTimeout(() => setAdminSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error updating admin settings:', err);
      toast.error(`පරිපාලක සැකසුම් සුරැකීමට නොහැකි විය: ${err.message || err}`);
    }
  };

function isSameDataArray(prev: any[], next: any[]): boolean {
  if (prev === next) return true;
  if (!prev || !next || prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const p = prev[i];
    const n = next[i];
    if (p?.id !== n?.id) return false;
    if (p?.updatedAt !== n?.updatedAt) return false;
    if (p?.status !== n?.status) return false;
    if (p?.active !== n?.active) return false;
  }
  return true;
}

  const isFetchingMetricsRef = useRef(false);
  const debounceMetricsTimerRef = useRef<any>(null);

  const fetchDashboardMetrics = useCallback(async () => {
    if (isFetchingMetricsRef.current) return;
    isFetchingMetricsRef.current = true;
    try {
      const [uData, cData, sData, eData, subData, nData, aData, bData] = await Promise.allSettled([
        usersApi.getUsers(),
        classesApi.getClasses(),
        subjectsApi.getSubjects(),
        examsApi.getExams(),
        examsApi.getSubmissions(),
        contentApi.getNews ? contentApi.getNews() : Promise.resolve([]),
        auditApi.getLogs ? auditApi.getLogs() : Promise.resolve([]),
        broadcastApi.getNotices ? broadcastApi.getNotices() : Promise.resolve([]),
      ]);

      if (uData.status === 'fulfilled' && Array.isArray(uData.value)) {
        setUsers((prev) => (isSameDataArray(prev, uData.value) ? prev : uData.value));
      }
      if (cData.status === 'fulfilled' && Array.isArray(cData.value)) {
        setClasses((prev) => (isSameDataArray(prev, cData.value) ? prev : cData.value));
      }
      if (sData.status === 'fulfilled' && Array.isArray(sData.value)) {
        setSubjects((prev) => (isSameDataArray(prev, sData.value) ? prev : sData.value));
      }
      if (eData.status === 'fulfilled' && Array.isArray(eData.value)) {
        setExams((prev) => (isSameDataArray(prev, eData.value) ? prev : eData.value));
      }
      if (subData.status === 'fulfilled' && Array.isArray(subData.value)) {
        setSubmissions((prev) => (isSameDataArray(prev, subData.value) ? prev : subData.value));
      }
      if (nData.status === 'fulfilled' && Array.isArray(nData.value)) {
        setNewsList((prev) => (isSameDataArray(prev, nData.value) ? prev : nData.value));
      }
      if (aData.status === 'fulfilled' && Array.isArray(aData.value)) {
        setAuditLogs((prev) => (isSameDataArray(prev, aData.value) ? prev : aData.value));
      }
      if (bData.status === 'fulfilled' && Array.isArray(bData.value)) {
        setBroadcastNotices((prev) => (isSameDataArray(prev, bData.value) ? prev : bData.value));
      }
    } catch (e) {
      console.warn('Dashboard Metrics fetch error:', e);
    } finally {
      isFetchingMetricsRef.current = false;
    }
  }, []);

  const debouncedFetchMetrics = useCallback(() => {
    if (debounceMetricsTimerRef.current) {
      clearTimeout(debounceMetricsTimerRef.current);
    }
    debounceMetricsTimerRef.current = setTimeout(() => {
      fetchDashboardMetrics();
    }, 350);
  }, [fetchDashboardMetrics]);

  useEffect(() => {
    fetchDashboardMetrics();

    const cleanupPoll = appLifecycleManager.registerPollTask(
      'admin_dashboard_metrics_poll',
      debouncedFetchMetrics,
      45000,
      { runImmediately: false, runImmediatelyOnResume: true, allowBackground: true, backgroundIntervalMs: 120000 }
    );

    const handleSync = () => debouncedFetchMetrics();
    window.addEventListener('refresh-portal-data', handleSync);
    window.addEventListener('site-data-updated', handleSync);
    window.addEventListener('users-data-updated', handleSync);
    window.addEventListener('database-changed', handleSync);
    window.addEventListener('curriculum-updated', handleSync);
    window.addEventListener('exams-updated', handleSync);
    window.addEventListener('materials-updated', handleSync);
    window.addEventListener('notices-updated', handleSync);
    window.addEventListener('admissions-updated', handleSync);

    return () => {
      cleanupPoll();
      window.removeEventListener('refresh-portal-data', handleSync);
      window.removeEventListener('site-data-updated', handleSync);
      window.removeEventListener('users-data-updated', handleSync);
      window.removeEventListener('database-changed', handleSync);
      window.removeEventListener('curriculum-updated', handleSync);
      window.removeEventListener('exams-updated', handleSync);
      window.removeEventListener('materials-updated', handleSync);
      window.removeEventListener('notices-updated', handleSync);
      window.removeEventListener('admissions-updated', handleSync);
      if (debounceMetricsTimerRef.current) {
        clearTimeout(debounceMetricsTimerRef.current);
      }
    };
  }, [fetchDashboardMetrics, debouncedFetchMetrics]);

  useEffect(() => {
    if (initialTab) {
      startTransition(() => {
        setActiveTab(initialTab as AdminTab);
      });
    }
  }, [initialTab]);

  useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        let tab = e.detail;
        if (tab === 'dashboard') tab = 'overview';
        startTransition(() => {
          setActiveTab((prev) => (prev !== tab ? (tab as AdminTab) : prev));
        });
      }
    };
    window.addEventListener('switch-portal-subtab', handleSwitch);
    return () => window.removeEventListener('switch-portal-subtab', handleSwitch);
  }, []);

  // Broadcast Notices State & Handlers
  const [broadcastNotices, setBroadcastNotices] = useState<any[]>([]);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeForm, setNoticeForm] = useState<BroadcastNoticeFormState>({
    title: '',
    titleSinhala: '',
    message: '',
    messageSinhala: '',
    severity: 'urgent',
    targetRole: 'all',
    category: 'Pracheena Exam',
    customColor: 'red',
    customIcon: 'radio',
    expiryDate: '',
  });

  const handleOpenCreateNoticeModal = () => {
    setEditingNoticeId(null);
    setNoticeForm({
      title: '',
      titleSinhala: '',
      message: '',
      messageSinhala: '',
      severity: 'urgent',
      targetRole: 'all',
      category: 'General Notice',
      customColor: 'amber',
      customIcon: 'radio',
      expiryDate: '',
    });
    setShowNoticeModal(true);
  };

  const handleOpenEditNoticeModal = (notice: any) => {
    setEditingNoticeId(notice.id);
    setNoticeForm({
      title: notice.title || notice.titleSinhala || '',
      titleSinhala: notice.titleSinhala || notice.title || '',
      message: notice.message || notice.messageSinhala || '',
      messageSinhala: notice.messageSinhala || notice.message || '',
      severity: notice.severity || 'urgent',
      targetRole: notice.targetRole || 'all',
      category: notice.category || 'General Notice',
      customColor: notice.customColor || 'amber',
      customIcon: notice.customIcon || 'radio',
      expiryDate: notice.expiryDate ? notice.expiryDate.split('T')[0] : '',
    });
    setShowNoticeModal(true);
  };

  const handleApplyNoticeTemplate = (tplKey: string) => {
    switch (tplKey) {
      case 'pracheena':
        setNoticeForm((prev) => ({
          ...prev,
          title: 'Pracheena Examination 2026 Registration Open',
          titleSinhala: '2026 ප්‍රාචීන ප්‍රාරම්භ හා මධ්‍යම විභාග අයදුම්පත් කැඳවීම සක්‍රීයයි.',
          message:
            'All Samanera student monks are hereby notified to submit their exam applications before the deadline.',
          messageSinhala:
            'සියලුම සාමණේර හිමිවරුන් හා ශිෂ්‍යයන් තමන්ගේ විභාග අයදුම්පත් පිරිවෙන් ලේඛකාධිකාරී කාර්යාලය වෙත භාරදිය යුතුය.',
          severity: 'urgent',
          targetRole: 'all',
          category: 'Pracheena Exam',
          customColor: 'red',
          customIcon: 'shield',
        }));
      case 'poya':
        setNoticeForm((prev) => ({
          ...prev,
          title: 'Nikini Full Moon Poya Dhamma Program',
          titleSinhala: 'නිකිණි පෝදා සාමණේර සීල සමාදානය හා ත්‍රිපිටක ධර්ම දේශනාව.',
          message: 'Special Poya Sil program and Tripitaka Chanting will be held at the Main Dhamma Hall.',
          messageSinhala: 'පූර්ණ දවස පුරා පැවැත්වෙන පෝදා වැඩසටහනට සහභාගී වන්න.',
          severity: 'info',
          targetRole: 'all',
          category: 'Poya Program',
          customColor: 'amber',
          customIcon: '☸',
        }));
        break;
      case 'dana':
        setNoticeForm((prev) => ({
          ...prev,
          title: 'Sanghika Maha Dana Program',
          titleSinhala: 'සංඝගත මහා දක්ෂිණාව හා කඨින පින්කම් නිවේදනය.',
          message: 'Annual almsgiving program and blessing ceremony.',
          messageSinhala: 'මහා සංඝරත්නය උදෙසා පිරිනැමෙන දානමය පුණ්‍යකර්මය සඳහා දායකත්වය ලබාදිය හැක.',
          severity: 'warning',
          targetRole: 'all',
          category: 'Dana / Alms',
          customColor: 'orange',
          customIcon: '🍛',
        }));
        break;
      case 'holiday':
        setNoticeForm((prev) => ({
          ...prev,
          title: 'Pirivena Academic Term Vacation Notice',
          titleSinhala: 'පළමු පාසල් වාර නිවාඩුව ආරම්භ වීම පිළිබඳ නිවේදනය.',
          message: 'Academic classes will be suspended for vacation and resume on scheduled date.',
          messageSinhala: 'නියමිත දිනට පෙර සියලුම ශිෂ්‍ය හිමිවරුන් නේවාසිකාගාර වෙත වාර්තා කළ යුතුය.',
          severity: 'info',
          targetRole: 'all',
          category: 'Pirivena Holiday',
          customColor: 'blue',
          customIcon: '🎓',
        }));
        break;
      default:
        break;
    }
  };

  const triggerNoticeSync = () => {
    window.dispatchEvent(new CustomEvent('broadcast-notices-updated'));
    window.dispatchEvent(new CustomEvent('site-data-updated'));
    try {
      const bc = new BroadcastChannel('pirivena-admin-sync');
      bc.postMessage({ type: 'notices-updated' });
      bc.close();
    } catch (e) { }
    try {
      const bc2 = new BroadcastChannel('pirivena_realtime_channel');
      bc2.postMessage({ type: 'notices-updated' });
      bc2.close();
    } catch (e) { }
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingNotice) return;
    setIsSavingNotice(true);
    try {
      if (editingNoticeId) {
        await broadcastApi.updateNotice(editingNoticeId, noticeForm);
        toast.success('නිවේදනය සාර්ථකව යාවත්කාලීන කරන ලදී!');
      } else {
        await broadcastApi.createNotice(noticeForm);
        toast.success('නව සජීවී නිවේදනය සාර්ථකව විකාශනය කරන ලදී!');
      }
      setShowNoticeModal(false);
      triggerNoticeSync();
      fetchDashboardMetrics();
    } catch (e: any) {
      toast.error('නිවේදනය සුරැකීමට නොහැකි විය: ' + e.message);
    } finally {
      setIsSavingNotice(false);
    }
  };

  const handleToggleNotice = async (id: string, active: boolean) => {
    try {
      await broadcastApi.updateNotice(id, { active });
      triggerNoticeSync();
      fetchDashboardMetrics();
      toast.success(active ? 'නිවේදනය සක්‍රීය කරන ලදී' : 'නිවේදනය අක්‍රිය කරන ලදී');
    } catch (e: any) {
      toast.error('යාවත්කාලීන කිරීමට නොහැකි විය: ' + e.message);
    }
  };

  const handleDeleteNotice = (id: string) => {
    askConfirmation({
      title: 'නිවේදනය ඉවත් කිරීම',
      message: 'ඔබට මෙම සජීවී විකාශන නිවේදනය ස්ථිරවම ඉවත් කිරීමට අවශ්‍යද?',
      action: async () => {
        try {
          await broadcastApi.deleteNotice(id);
          triggerNoticeSync();
          fetchDashboardMetrics();
          toast.success('නිවේදනය සාර්ථකව ඉවත් කරන ලදී!');
        } catch (e: any) {
          toast.error('ඉවත් කිරීමට නොහැකි විය: ' + e.message);
        }
      },
    });
  };

  // Student Form & Modals State
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [studentFormStep, setStudentFormStep] = useState(1);
  const [studentForm, setStudentForm] = useState<StudentFormState>({
    customId: '',
    name: '',
    monkStatus: 'monk',
    monkName: '',
    email: '',
    password: '',
    avatar: '',
    phone: '',
    educationCategory: 'Mulika Pirivena',
    classLevel: 'Level 1',
    classId: '',
    academicYear: '2026',
    classTeacherId: '',
    subjectsAssigned: [],
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'නායක හිමිපාණන්',
    guardianAddress: '',
    templeName: '',
    nicOrBirthCert: '',
    status: 'active',
    showPassword: false,
  });

  const handleOpenNewStudent = () => {
    const newCustomId = `STD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanId = newCustomId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const autoGmail = `${cleanId}@gmail.com`;
    setEditingStudent(null);
    setStudentFormStep(1);
    setStudentForm({
      customId: newCustomId,
      name: '',
      monkStatus: 'monk',
      monkName: '',
      email: autoGmail,
      password: Math.random().toString(36).slice(-8) + '@Piri',
      avatar: '',
      phone: '',
      educationCategory: 'Mulika Pirivena',
      classLevel: 'Level 1',
      classId: classes[0]?.id || '',
      academicYear: '2026',
      classTeacherId: '',
      subjectsAssigned: [],
      guardianName: '',
      guardianPhone: '',
      guardianRelation: 'නායක හිමිපාණන්',
      guardianAddress: '',
      templeName: 'ශ්‍රී සුමන මහා පිරිවෙන් විහාරස්ථානය',
      nicOrBirthCert: '',
      status: 'active',
      showPassword: false,
    });
    setShowStudentModal(true);
  };

  const handleOpenEditStudent = (student: User) => {
    setEditingStudent(student);
    setStudentFormStep(1);
    setStudentForm({
      customId: student.customId || '',
      name: student.name || '',
      monkStatus: (student.monkStatus === 'lay' ? 'lay' : 'monk') as 'monk' | 'lay',
      monkName: student.monkName || student.name || '',
      email: student.email || '',
      password: '',
      avatar: student.avatar || '',
      phone: student.phone || '',
      educationCategory: student.educationCategory || 'Mulika Pirivena',
      classLevel: student.classLevel || 'Level 1',
      classId: student.classId || student.pirivenaClass || '',
      academicYear: student.academicYear || '2026',
      classTeacherId: student.classTeacherId || '',
      subjectsAssigned: student.subjectsAssigned || [],
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      guardianRelation: student.guardianRelation || 'නායක හිමිපාණන්',
      guardianAddress: student.guardianAddress || '',
      templeName: student.templeName || '',
      nicOrBirthCert: student.nicOrBirthCert || '',
      status: (student.status as any) || 'active',
      showPassword: false,
    });
    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingStudent) return;
    setIsSavingStudent(true);
    try {
      const targetClass = classes.find(
        (c) =>
          c.id === studentForm.classId ||
          c.code === studentForm.classId ||
          c.name === studentForm.classId ||
          c.nameSinhala === studentForm.classId ||
          (c as any).className === studentForm.classId ||
          (c as any).classNameSinhala === studentForm.classId
      );

      const finalSubjects =
        targetClass?.subjects && targetClass.subjects.length > 0
          ? targetClass.subjects
          : (studentForm.subjectsAssigned && studentForm.subjectsAssigned.length > 0
            ? studentForm.subjectsAssigned
            : subjects.map((s) => s.id));

      const isMonk = studentForm.monkStatus === 'monk';
      const studentPayload: Partial<User> = {
        role: 'student',
        customId: studentForm.customId,
        name: isMonk && studentForm.monkName ? studentForm.monkName : studentForm.name,
        monkName: isMonk ? studentForm.monkName : '',
        monkStatus: studentForm.monkStatus || 'lay',
        email: studentForm.email || `std${studentForm.customId.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
        password: studentForm.password,
        avatar: studentForm.avatar,
        phone: studentForm.phone,
        educationCategory: targetClass?.category || studentForm.educationCategory,
        classLevel: targetClass?.levelName || targetClass?.name || studentForm.classLevel,
        classId: targetClass?.id || studentForm.classId,
        pirivenaClass: targetClass?.nameSinhala || (targetClass as any)?.classNameSinhala || targetClass?.name || studentForm.classId,
        academicYear: studentForm.academicYear,
        classTeacherId: targetClass?.teacherInChargeId || studentForm.classTeacherId,
        subjectsAssigned: finalSubjects,
        studentSubjects: finalSubjects.map((sid) => ({
          classId: targetClass?.id || studentForm.classId,
          subjectId: sid,
        })),
        guardianName: studentForm.guardianName,
        guardianPhone: studentForm.guardianPhone,
        guardianRelation: studentForm.guardianRelation,
        guardianAddress: studentForm.guardianAddress,
        templeName: studentForm.templeName,
        nicOrBirthCert: studentForm.nicOrBirthCert,
        status: studentForm.status,
      };

      if (editingStudent) {
        const updated = await usersApi.updateUser(editingStudent.id, studentPayload);
        setUsers((prev) => prev.map((u) => (u.id === editingStudent.id ? { ...u, ...updated } : u)));
        toast.success('ශිෂ්‍ය තොරතුරු සාර්ථකව යාවත්කාලීන කරන ලදී!');
      } else {
        const created = await usersApi.createUser(studentPayload);
        setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id && u.customId !== created.customId)]);
        toast.success('නව ශිෂ්‍යයා සාර්ථකව ලියාපදිංචි කරන ලදී!');
      }

      setShowStudentModal(false);
      invalidateCache('/api/users');
      invalidateCache('/api/students');
      window.dispatchEvent(new CustomEvent('users-data-updated'));
      window.dispatchEvent(new CustomEvent('students-data-updated'));
      window.dispatchEvent(new CustomEvent('site-data-updated'));
    } catch (err: any) {
      toast.error('ශිෂ්‍ය තොරතුරු සුරැකීමට නොහැකි විය: ' + err.message);
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    askConfirmation({
      title: 'පරිශීලකයා ඉවත් කිරීම',
      message: `ඔබට "${name}" පරිශීලකයා පද්ධතියෙන් ස්ථිරවම ඉවත් කිරීමට අවශ්‍යද?`,
      action: async () => {
        try {
          // Optimistic local state update for zero-delay UI responsiveness
          setUsers((prev) => prev.filter((u) => u.id !== id && u.customId !== id));
          await usersApi.deleteUser(id);
          invalidateCache('/api/users');
          window.dispatchEvent(new CustomEvent('users-data-updated'));
          window.dispatchEvent(new CustomEvent('site-data-updated'));
          fetchDashboardMetrics();
          toast.success('පරිශීලකයා සාර්ථකව ඉවත් කරන ලදී!');
        } catch (err: any) {
          fetchDashboardMetrics();
          toast.error('ඉවත් කිරීමට නොහැකි විය: ' + err.message);
        }
      },
    });
  };

  const handleToggleStudentStatus = async (student: User) => {
    try {
      const nextStatus = student.status === 'active' ? 'inactive' : 'active';
      await usersApi.updateUser(student.id, { status: nextStatus });
      invalidateCache('/api/users');
      fetchDashboardMetrics();
      toast.success(nextStatus === 'active' ? 'ශිෂ්‍ය ගිණුම සක්‍රීය කරන ලදී' : 'ශිෂ්‍ය ගිණුම අක්‍රිය කරන ලදී');
    } catch (err: any) {
      toast.error('තත්ත්වය වෙනස් කිරීමට නොහැකි විය: ' + err.message);
    }
  };

  const handleConvertToStudent = (adm: OnlineAdmission) => {
    const newCustomId = `STD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanId = (adm.trackingId || newCustomId).toLowerCase().replace(/[^a-z0-9]/g, '');
    const autoGmail = `${cleanId}@gmail.com`;
    setEditingStudent(null);
    setStudentFormStep(1);
    setStudentForm({
      customId: newCustomId,
      name: adm.applicantName || '',
      monkStatus: adm.monkStatus === 'monk' ? 'monk' : 'lay',
      monkName: adm.monkName || adm.applicantName || '',
      email: autoGmail,
      password: Math.random().toString(36).slice(-8) + '@Piri',
      avatar: '',
      phone: adm.phone || '',
      educationCategory: adm.preferredSection || 'Mulika Pirivena',
      classLevel: 'Level 1',
      classId: classes[0]?.id || '',
      academicYear: '2026',
      classTeacherId: '',
      subjectsAssigned: [],
      guardianName: adm.guardianName || '',
      guardianPhone: adm.guardianPhone || '',
      guardianRelation: 'භාරකරු',
      guardianAddress: adm.address || '',
      templeName: adm.templeName || '',
      nicOrBirthCert: adm.nicOrBirthCert || '',
      status: 'active',
      showPassword: false,
    });
    setShowStudentModal(true);
  };

  // Teacher Form & Modal State
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [teacherFormStep, setTeacherFormStep] = useState(1);
  const [teacherForm, setTeacherForm] = useState<TeacherFormState>({
    customId: '',
    name: '',
    monkStatus: 'monk',
    monkName: '',
    email: '',
    password: '',
    avatar: '',
    phone: '',
    qualification: 'ප්‍රාචීන පණ්ඩිත, බෞද්ධ හා පාලි විශ්වවිද්‍යාලය',
    classesAssigned: [],
    subjectsTaught: [],
    categoriesTaught: ['Mulika Pirivena'],
    teacherAssignments: [],
    status: 'active',
    showPassword: false,
  });

  const handleOpenNewTeacher = () => {
    const newCustomId = `TCH-2026-${Math.floor(100 + Math.random() * 900)}`;
    const cleanId = newCustomId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const autoGmail = `${cleanId}@gmail.com`;
    setEditingTeacher(null);
    setTeacherFormStep(1);
    setTeacherForm({
      customId: newCustomId,
      name: '',
      monkStatus: 'monk',
      monkName: '',
      email: autoGmail,
      password: Math.random().toString(36).slice(-8) + '@Teach',
      avatar: '',
      phone: '',
      qualification: 'ප්‍රාචීන පණ්ඩිත උපාධිය',
      classesAssigned: [],
      subjectsTaught: [],
      categoriesTaught: ['Mulika Pirivena'],
      teacherAssignments: [],
      status: 'active',
      showPassword: false,
    });
    setShowTeacherModal(true);
  };

  const handleOpenEditTeacher = (teacher: User) => {
    setEditingTeacher(teacher);
    setTeacherFormStep(1);
    setTeacherForm({
      customId: teacher.customId || '',
      name: teacher.name || '',
      monkStatus: (teacher.monkStatus === 'lay' ? 'lay' : 'monk') as 'monk' | 'lay',
      monkName: teacher.monkName || teacher.name || '',
      email: teacher.email || '',
      password: '',
      avatar: teacher.avatar || '',
      phone: teacher.phone || '',
      qualification: teacher.qualification || (teacher as any).qualifications || '',
      classesAssigned: teacher.classesAssigned || [],
      subjectsTaught: teacher.subjectsTaught || [],
      categoriesTaught: teacher.categoriesTaught || ['Mulika Pirivena'],
      teacherAssignments: teacher.teacherAssignments || [],
      status: (teacher.status as any) || 'active',
      showPassword: false,
    });
    setShowTeacherModal(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingTeacher) return;
    setIsSavingTeacher(true);
    try {
      const finalTeacherAssignments = teacherForm.teacherAssignments || [];
      const derivedClasses = Array.from(
        new Set([
          ...(teacherForm.classesAssigned || []),
          ...finalTeacherAssignments.map((a) => a.classId),
        ].filter(Boolean))
      );
      const derivedSubjects = Array.from(
        new Set([
          ...(teacherForm.subjectsTaught || []),
          ...finalTeacherAssignments.map((a) => a.subjectId),
        ].filter(Boolean))
      );

      const isTeacherMonk = teacherForm.monkStatus === 'monk';
      const teacherPayload: Partial<User> = {
        role: 'teacher',
        customId: teacherForm.customId,
        name: isTeacherMonk && teacherForm.monkName ? teacherForm.monkName : teacherForm.name,
        monkName: isTeacherMonk ? teacherForm.monkName : '',
        monkStatus: teacherForm.monkStatus || 'lay',
        email: teacherForm.email || `tch${teacherForm.customId.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
        password: teacherForm.password,
        avatar: teacherForm.avatar,
        phone: teacherForm.phone,
        qualification: teacherForm.qualification,
        classesAssigned: derivedClasses,
        subjectsTaught: derivedSubjects,
        categoriesTaught: teacherForm.categoriesTaught,
        teacherAssignments: finalTeacherAssignments,
        status: teacherForm.status,
      };

      if (editingTeacher) {
        const updated = await usersApi.updateUser(editingTeacher.id, teacherPayload);
        setUsers((prev) => prev.map((u) => (u.id === editingTeacher.id ? { ...u, ...updated } : u)));
        toast.success('ගුරු තොරතුරු සාර්ථකව යාවත්කාලීන කරන ලදී!');
      } else {
        const created = await usersApi.createUser(teacherPayload);
        setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id && u.customId !== created.customId)]);
        toast.success('නව ගුරු භවතා සාර්ථකව ලියාපදිංචි කරන ලදී!');
      }

      setShowTeacherModal(false);
      invalidateCache('/api/users');
      invalidateCache('/api/teachers');
      window.dispatchEvent(new CustomEvent('users-data-updated'));
      window.dispatchEvent(new CustomEvent('teachers-data-updated'));
      window.dispatchEvent(new CustomEvent('site-data-updated'));
    } catch (err: any) {
      toast.error('ගුරු තොරතුරු සුරැකීමට නොහැකි විය: ' + err.message);
    } finally {
      setIsSavingTeacher(false);
    }
  };

  // Class Form & Modal State
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<PirivenaClass | null>(null);
  const [classForm, setClassForm] = useState<ClassFormState>({
    category: 'Mulika Pirivena',
    isCustomCategory: false,
    customCategory: '',
    levelName: 'Level 1',
    isCustomLevel: false,
    customLevelName: '',
    code: 'MUL-L01',
    name: 'Mulika Pirivena - Level 1',
    nameSinhala: 'මූලික පිරිවෙන - 01 ශ්‍රේණිය',
    teacherInChargeId: '',
    roomNumber: 'R-101',
    academicYear: '2026',
    studentCount: 0,
    subjects: [],
  });

  const handleOpenNewClass = () => {
    setEditingClass(null);
    const defaults = generateClassDefaults('Mulika Pirivena', 'Level 1');
    setClassForm({
      category: 'Mulika Pirivena',
      isCustomCategory: false,
      customCategory: '',
      levelName: 'Level 1',
      isCustomLevel: false,
      customLevelName: '',
      code: defaults.code,
      name: defaults.name,
      nameSinhala: defaults.nameSinhala,
      teacherInChargeId: teachers[0]?.id || '',
      roomNumber: 'R-101',
      academicYear: '2026',
      studentCount: 0,
      subjects: [],
    });
    setShowClassModal(true);
  };

  const handleOpenEditClass = (cls: PirivenaClass) => {
    setEditingClass(cls);
    setClassForm({
      category: cls.category || 'Mulika Pirivena',
      isCustomCategory: false,
      customCategory: '',
      levelName: cls.levelName || 'Level 1',
      isCustomLevel: false,
      customLevelName: '',
      code: cls.code || '',
      name: cls.name || '',
      nameSinhala: cls.nameSinhala || '',
      teacherInChargeId: cls.teacherInChargeId || '',
      roomNumber: cls.roomNumber || '',
      academicYear: cls.academicYear || '2026',
      studentCount: cls.studentCount || 0,
      subjects: Array.isArray(cls.subjects)
        ? cls.subjects
        : typeof cls.subjects === 'string' && (cls.subjects as string).trim()
          ? (cls.subjects as string).trim().startsWith('[')
            ? (() => { try { return JSON.parse(cls.subjects as any); } catch { return []; } })()
            : (cls.subjects as string).split(',').map((s) => s.trim()).filter(Boolean)
          : [],
    });
    setShowClassModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingClass) return;
    setIsSavingClass(true);
    try {
      const payload: Partial<PirivenaClass> = {
        code: classForm.code,
        name: classForm.name,
        nameSinhala: classForm.nameSinhala,
        category: classForm.isCustomCategory ? classForm.customCategory : classForm.category,
        levelName: classForm.isCustomLevel ? classForm.customLevelName : classForm.levelName,
        teacherInChargeId: classForm.teacherInChargeId,
        roomNumber: classForm.roomNumber,
        academicYear: classForm.academicYear,
        subjects: classForm.subjects,
      };

      if (editingClass) {
        const updated = await classesApi.updateClass(editingClass.id, payload);
        setClasses((prev) => prev.map((c) => (c.id === editingClass.id ? { ...c, ...updated } : c)));
        toast.success('පන්ති කාමරය සාර්ථකව යාවත්කාලීන කරන ලදී!');
      } else {
        const created = await classesApi.createClass(payload);
        setClasses((prev) => [created, ...prev.filter((c) => c.id !== created.id && c.code !== created.code)]);
        toast.success('නව පන්ති කාමරය සාර්ථකව නිර්මාණය කරන ලදී!');
      }

      setShowClassModal(false);
      invalidateCache('/api/classes');
      try {
        const bc = new BroadcastChannel('pirivena-admin-sync');
        bc.postMessage({ type: 'classes-updated', timestamp: Date.now() });
        bc.close();
      } catch (e) { }
      try {
        localStorage.setItem('pirivena_admin_sync', `classes_updated_${Date.now()}`);
      } catch (e) { }
      window.dispatchEvent(new CustomEvent('classes-updated'));
      window.dispatchEvent(new CustomEvent('pirivena-classes-updated'));
      window.dispatchEvent(new CustomEvent('curriculum-updated'));
      window.dispatchEvent(new CustomEvent('site-data-updated'));
    } catch (err: any) {
      toast.error('පන්ති කාමරය සුරැකීමට නොහැකි විය: ' + err.message);
    } finally {
      setIsSavingClass(false);
    }
  };

  const handleDeleteClass = (id: string) => {
    askConfirmation({
      title: 'පන්ති කාමරය ඉවත් කිරීම',
      message: 'ඔබට මෙම පන්ති කාමරය පද්ධතියෙන් ඉවත් කිරීමට අවශ්‍යද?',
      action: async () => {
        try {
          setClassForm((prev) => prev);
          setClasses((prev) => prev.filter((c) => c.id !== id));
          await classesApi.deleteClass(id);
          invalidateCache('/api/classes');
          try {
            const bc = new BroadcastChannel('pirivena-admin-sync');
            bc.postMessage({ type: 'classes-updated', timestamp: Date.now() });
            bc.close();
          } catch (e) { }
          try {
            localStorage.setItem('pirivena_admin_sync', `classes_updated_${Date.now()}`);
          } catch (e) { }
          window.dispatchEvent(new CustomEvent('classes-updated'));
          window.dispatchEvent(new CustomEvent('pirivena-classes-updated'));
          window.dispatchEvent(new CustomEvent('site-data-updated'));
          toast.success('පන්ති කාමරය සාර්ථකව ඉවත් කරන ලදී!');
        } catch (err: any) {
          toast.error('ඉවත් කිරීමට නොහැකි විය: ' + err.message);
        }
      },
    });
  };

  // Subject Form & Modal State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState<SubjectFormState>({
    code: '',
    name: '',
    nameSinhala: '',
    category: 'Buddhism',
    description: '',
    credits: 3,
    assignedTeacherIds: [],
  });

  const handleOpenNewSubject = () => {
    setEditingSubject(null);
    const newCode = generateSmartSubjectCode('Buddhism', '', '', subjects.length);
    setSubjectForm({
      code: newCode,
      name: '',
      nameSinhala: '',
      category: 'Buddhism',
      description: '',
      credits: 3,
      assignedTeacherIds: [],
    });
    setShowSubjectModal(true);
  };

  const handleOpenEditSubject = (subj: Subject) => {
    setEditingSubject(subj);
    setSubjectForm({
      code: subj.code || '',
      name: subj.name || '',
      nameSinhala: subj.nameSinhala || '',
      category: subj.category || 'Buddhism',
      description: subj.description || '',
      credits: subj.credits || 3,
      assignedTeacherIds: subj.assignedTeacherIds || [],
    });
    setShowSubjectModal(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingSubject) return;
    setIsSavingSubject(true);
    try {
      const payload: Partial<Subject> = {
        code: subjectForm.code,
        name: subjectForm.name,
        nameSinhala: subjectForm.nameSinhala,
        category: subjectForm.category,
        description: subjectForm.description,
        credits: Number(subjectForm.credits) || 3,
        assignedTeacherIds: subjectForm.assignedTeacherIds,
      };

      if (editingSubject) {
        const updated = await subjectsApi.updateSubject(editingSubject.id, payload);
        setSubjects((prev) => prev.map((s) => (s.id === editingSubject.id ? { ...s, ...updated } : s)));
        toast.success('විෂයය සාර්ථකව යාවත්කාලීන කරන ලදී!');
      } else {
        const created = await subjectsApi.createSubject(payload);
        setSubjects((prev) => [created, ...prev.filter((s) => s.id !== created.id && s.code !== created.code)]);
        toast.success('නව විෂයය සාර්ථකව නිර්මාණය කරන ලදී!');
      }

      setShowSubjectModal(false);
      invalidateCache('/api/subjects');
      try {
        const bc = new BroadcastChannel('pirivena-admin-sync');
        bc.postMessage({ type: 'subjects-updated', timestamp: Date.now() });
        bc.close();
      } catch (e) { }
      try {
        localStorage.setItem('pirivena_admin_sync', `subjects_updated_${Date.now()}`);
      } catch (e) { }
      window.dispatchEvent(new CustomEvent('subjects-updated'));
      window.dispatchEvent(new CustomEvent('pirivena-subjects-updated'));
      window.dispatchEvent(new CustomEvent('curriculum-updated'));
      window.dispatchEvent(new CustomEvent('site-data-updated'));
    } catch (err: any) {
      toast.error('විෂයය සුරැකීමට නොහැකි විය: ' + err.message);
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleDeleteSubject = (id: string) => {
    askConfirmation({
      title: 'විෂයය ඉවත් කිරීම',
      message: 'ඔබට මෙම විෂයය පද්ධතියෙන් ඉවත් කිරීමට අවශ්‍යද?',
      action: async () => {
        try {
          setSubjects((prev) => prev.filter((s) => s.id !== id));
          await subjectsApi.deleteSubject(id);
          invalidateCache('/api/subjects');
          try {
            const bc = new BroadcastChannel('pirivena-admin-sync');
            bc.postMessage({ type: 'subjects-updated', timestamp: Date.now() });
            bc.close();
          } catch (e) { }
          try {
            localStorage.setItem('pirivena_admin_sync', `subjects_updated_${Date.now()}`);
          } catch (e) { }
          window.dispatchEvent(new CustomEvent('subjects-updated'));
          window.dispatchEvent(new CustomEvent('pirivena-subjects-updated'));
          window.dispatchEvent(new CustomEvent('site-data-updated'));
          fetchDashboardMetrics();
          toast.success('විෂයය සාර්ථකව ඉවත් කරන ලදී!');
        } catch (err: any) {
          fetchDashboardMetrics();
          toast.error('ඉවත් කිරීමට නොහැකි විය: ' + err.message);
        }
      },
    });
  };

  const handleClearAuditLogs = () => {
    askConfirmation({
      title: 'ආරක්ෂක සටහන් පිරිසිදු කිරීම',
      message: 'ඔබට සියලුම පද්ධති ආරක්ෂක සටහන් (Audit Logs) පිරිසිදු කිරීමට අවශ්‍යද?',
      action: async () => {
        try {
          if (auditApi.clearLogs) {
            await auditApi.clearLogs();
          }
          setAuditLogs([]);
          toast.success('ආරක්ෂක සටහන් පිරිසිදු කරන ලදී!');
        } catch (e: any) {
          toast.error('පිරිසිදු කිරීමට නොහැකි විය: ' + e.message);
        }
      },
    });
  };

  // Tab Item Configurations
  const navTabs: {
    id: AdminTab;
    label: string;
    labelSinhala: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
      {
        id: 'overview',
        label: 'Overview',
        labelSinhala: 'සාරාංශය',
        icon: BarChart2,
      },
      {
        id: 'students',
        label: 'Students',
        labelSinhala: 'ශිෂ්‍ය කළමනාකරණය',
        icon: GraduationCap,
        badge: students.length,
        badgeColor: 'bg-amber-100 text-amber-900',
      },
      {
        id: 'teachers',
        label: 'Teachers',
        labelSinhala: 'ගුරු කළමනාකරණය',
        icon: Users,
        badge: teachers.length,
        badgeColor: 'bg-stone-100 text-stone-900',
      },
      {
        id: 'classes',
        label: 'Classes & Subjects',
        labelSinhala: 'පන්ති හා විෂයයන්',
        icon: School,
        badge: classes.length,
      },
      {
        id: 'admissions',
        label: 'Admissions',
        labelSinhala: 'නව ඇතුළත් කිරීම්',
        icon: UserCheck,
        badge: admissions.filter((a) => a.status === 'pending').length || undefined,
        badgeColor: 'bg-rose-500 text-white animate-pulse',
      },
      {
        id: 'exam_reviews',
        label: 'Exam Reviews',
        labelSinhala: 'විභාග ප්‍රතිඵල සමාලෝචනය',
        icon: Award,
        badge: exams.length || undefined,
      },
      {
        id: 'site_news',
        label: 'News & Announcements',
        labelSinhala: 'පුවත් සහ නිවේදන',
        icon: Newspaper,
      },
      {
        id: 'site_events',
        label: 'Events & Calendar',
        labelSinhala: 'උත්සව & දින දර්ශනය',
        icon: Calendar,
      },
      {
        id: 'site_gallery',
        label: 'Photo Gallery',
        labelSinhala: 'ඡායාරූප ගැලරිය',
        icon: ImageIcon,
      },
      {
        id: 'site_library',
        label: 'Digital Library',
        labelSinhala: 'ඩිජිටල් පුස්තකාලය',
        icon: BookOpen,
      },
      {
        id: 'site_general',
        label: 'Site Settings & AI',
        labelSinhala: 'වෙබ් අඩවි තොරතුරු & AI',
        icon: Globe,
      },
      {
        id: 'site_about',
        label: 'About Us Content',
        labelSinhala: 'අප ගැන විස්තර',
        icon: FileText,
      },
      {
        id: 'site_editor',
        label: 'Public Site Editor',
        labelSinhala: 'වෙබ් අඩවි සංස්කාරකය',
        icon: Globe,
      },
      {
        id: 'donations_manager',
        label: 'Donations',
        labelSinhala: 'ආධාර හා සම්මාදම්',
        icon: Heart,
        badge: donations.length || undefined,
      },
      {
        id: 'audit',
        label: 'Audit Trail',
        labelSinhala: 'ආරක්ෂක සටහන්',
        icon: ShieldCheck,
      },
      {
        id: 'settings',
        label: 'Settings & Backup',
        labelSinhala: 'පද්ධති සැකසුම් හා Backup',
        icon: Settings,
      },
    ];

  // Connect all Admin modals with Android hardware & browser back button
  useEffect(() => {
    if (showStudentModal) {
      navigationHistoryManager.pushModal('admin_student_modal', () => setShowStudentModal(false), 40);
    } else {
      navigationHistoryManager.removeModal('admin_student_modal');
    }
    return () => navigationHistoryManager.removeModal('admin_student_modal');
  }, [showStudentModal]);

  useEffect(() => {
    if (showTeacherModal) {
      navigationHistoryManager.pushModal('admin_teacher_modal', () => setShowTeacherModal(false), 40);
    } else {
      navigationHistoryManager.removeModal('admin_teacher_modal');
    }
    return () => navigationHistoryManager.removeModal('admin_teacher_modal');
  }, [showTeacherModal]);

  useEffect(() => {
    if (showClassModal) {
      navigationHistoryManager.pushModal('admin_class_modal', () => setShowClassModal(false), 40);
    } else {
      navigationHistoryManager.removeModal('admin_class_modal');
    }
    return () => navigationHistoryManager.removeModal('admin_class_modal');
  }, [showClassModal]);

  useEffect(() => {
    if (showSubjectModal) {
      navigationHistoryManager.pushModal('admin_subject_modal', () => setShowSubjectModal(false), 40);
    } else {
      navigationHistoryManager.removeModal('admin_subject_modal');
    }
    return () => navigationHistoryManager.removeModal('admin_subject_modal');
  }, [showSubjectModal]);

  useEffect(() => {
    if (showNoticeModal) {
      navigationHistoryManager.pushModal('admin_notice_modal', () => setShowNoticeModal(false), 40);
    } else {
      navigationHistoryManager.removeModal('admin_notice_modal');
    }
    return () => navigationHistoryManager.removeModal('admin_notice_modal');
  }, [showNoticeModal]);

  useEffect(() => {
    if (selectedBackupPreview) {
      navigationHistoryManager.pushModal('admin_backup_modal', () => setSelectedBackupPreview(null), 40);
    } else {
      navigationHistoryManager.removeModal('admin_backup_modal');
    }
    return () => navigationHistoryManager.removeModal('admin_backup_modal');
  }, [selectedBackupPreview]);

  useEffect(() => {
    if (isWelcomeModalOpen) {
      navigationHistoryManager.pushModal(
        'admin_welcome_modal',
        () => {
          try {
            sessionStorage.setItem('pirivena_admin_welcome_shown', 'true');
            localStorage.setItem('pirivena_admin_welcome_shown', 'true');
          } catch (e) {}
          setIsWelcomeModalOpen(false);
        },
        30
      );
    } else {
      navigationHistoryManager.removeModal('admin_welcome_modal');
    }
    return () => navigationHistoryManager.removeModal('admin_welcome_modal');
  }, [isWelcomeModalOpen]);

  // Ensure body scroll is always liberated and smooth whenever tabs change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      document.body.style.pointerEvents = '';
    }
  }, [activeTab]);

  const handlePullRefresh = async () => {
    try {
      invalidateCache('/api/users');
      invalidateCache('/api/classes');
      invalidateCache('/api/subjects');
      invalidateCache('/api/exams');
      await fetchDashboardMetrics();
    } catch (e) {}
  };

  return (
    <PullToRefreshWrapper onRefresh={handlePullRefresh} className="min-h-full">
      <div className="min-h-full bg-stone-50/50 dark:bg-stone-950 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:pb-12">
        {/* Main Tab Content Container */}
        <div className="max-w-7xl mx-auto px-2 sm:px-8 pt-2 sm:pt-4">
          <div
            key={activeTab}
            className="w-full space-y-4 sm:space-y-6 animate-fade-in-fast"
          >
            {activeTab === 'overview' && (
              <OverviewTab
                students={students}
                teachers={teachers}
                classes={classes}
                exams={exams}
                submissions={submissions}
                admissions={admissions}
                donations={donations as any}
                auditLogs={auditLogs}
                broadcastNotices={broadcastNotices}
                onOpenWelcomeModal={() => setIsWelcomeModalOpen(true)}
                onSwitchSubTab={switchSubTab}
                onOpenCreateNoticeModal={handleOpenCreateNoticeModal}
                onOpenEditNoticeModal={handleOpenEditNoticeModal}
                onToggleNotice={handleToggleNotice}
                onDeleteNotice={handleDeleteNotice}
                onClearAuditLogs={handleClearAuditLogs}
              />
            )}

            {(activeTab === 'students' || activeTab === 'teachers') && (
              <StudentsTab
                key={activeTab}
                students={students}
                teachers={teachers}
                classes={classes}
                subjects={subjects}
                initialDirectoryType={activeTab === 'teachers' ? 'teachers' : 'students'}
                onOpenNewStudent={handleOpenNewStudent}
                onOpenEditStudent={handleOpenEditStudent}
                onOpenNewTeacher={handleOpenNewTeacher}
                onOpenEditTeacher={handleOpenEditTeacher}
                onToggleStatus={handleToggleStudentStatus}
                onDeleteUser={(id) => {
                  const u = students.find((s) => s.id === id) || teachers.find((t) => t.id === id);
                  handleDeleteUser(id, u?.monkName || u?.name || 'සාමාජිකයා');
                }}
                onSelectStudentQr={onSelectStudentQr}
                onSelectStudentReportCard={onSelectStudentReportCard}
                copiedKey={copiedKey}
                handleCopy={handleCopy}
              />
            )}

            {activeTab === 'classes' && (
              <ClassesTab
                classes={classes}
                subjects={subjects}
                teachers={teachers}
                students={students}
                onOpenNewClass={handleOpenNewClass}
                onOpenEditClass={handleOpenEditClass}
                onDeleteClass={handleDeleteClass}
                onOpenNewSubject={handleOpenNewSubject}
                onOpenEditSubject={handleOpenEditSubject}
                onDeleteSubject={handleDeleteSubject}
              />
            )}

            {activeTab === 'admissions' && (
              <AdmissionsTab
                admissions={admissions}
                onUpdateStatus={updateAdmissionStatus}
                onDeleteAdmission={(id) => {
                  askConfirmation({
                    title: 'අයදුම්පත ඉවත් කිරීම',
                    message: 'මෙම ඇතුළත් වීමේ අයදුම්පත ඉවත් කිරීමට අවශ්‍යද?',
                    action: () => deleteAdmission(id),
                  });
                }}
                onConvertToStudent={handleConvertToStudent}
              />
            )}

            {activeTab === 'exam_reviews' && (
              <ExamReviewsTab
                exams={exams as any}
                submissions={submissions}
                teachers={teachers}
                students={students}
                classes={classes}
                subjects={subjects}
                teacherExamsMap={teacherExamsMap as any}
                examsByClassSubjectMap={examsByClassSubjectMap as any}
                submissionsByExamMap={submissionsByExamMap}
                teacherByIdMap={teacherByIdMap}
              />
            )}

            {activeTab === 'site_editor' && (
              <div className="animate-fade-in">
                <PublicSiteEditor />
              </div>
            )}

            {activeTab === 'site_news' && (
              <div className="animate-fade-in">
                <PublicSiteEditor forcedTab="news" />
              </div>
            )}

            {activeTab === 'site_events' && (
              <div className="animate-fade-in">
                <PublicSiteEditor forcedTab="events" />
              </div>
            )}

            {activeTab === 'site_gallery' && (
              <div className="animate-fade-in">
                <PublicSiteEditor forcedTab="gallery" />
              </div>
            )}

            {activeTab === 'site_library' && (
              <div className="animate-fade-in">
                <PublicSiteEditor forcedTab="library" />
              </div>
            )}

            {activeTab === 'site_general' && (
              <div className="animate-fade-in">
                <PublicSiteEditor forcedTab="general" />
              </div>
            )}

            {activeTab === 'site_about' && (
              <div className="animate-fade-in">
                <PublicSiteEditor forcedTab="about" />
              </div>
            )}

            {activeTab === 'donations_manager' && (
              <div className="animate-fade-in">
                <AdminDonationsManager />
              </div>
            )}

            {activeTab === 'audit' && (
              <AuditTab auditLogs={auditLogs as any} />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                user={user}
                adminSettingsForm={adminSettingsForm}
                setAdminSettingsForm={setAdminSettingsForm}
                handleSaveAdminSettings={handleSaveAdminSettings}
                adminSaveSuccess={adminSaveSuccess}
                secConfig={secConfig}
                setSecConfig={setSecConfig}
                handleSaveMasterPin={handleSaveMasterPin}
                activeSessions={activeSessions}
                handleRevokeSingleSession={handleRevokeSingleSession}
                handleRevokeOtherSessions={handleRevokeOtherSessions}
                handleRefreshSessions={handleRefreshSessions}
                secAuditLogs={secAuditLogs}
                auditLogFilter={auditLogFilter}
                setAuditLogFilter={setAuditLogFilter}
                handleClearSecAuditLogs={handleClearSecAuditLogs}
                handleExportAuditLogs={handleExportAuditLogs}
                apiKeyForm={apiKeyForm}
                setApiKeyForm={setApiKeyForm}
                showGeminiKey={showGeminiKey}
                setShowGeminiKey={setShowGeminiKey}
                showOpenRouterKey={showOpenRouterKey}
                setShowOpenRouterKey={setShowOpenRouterKey}
                testingGemini={testingGemini}
                geminiTestResult={geminiTestResult}
                handleTestGemini={handleTestGemini}
                isSavingGeminiKey={isSavingGeminiKey}
                geminiSaveSuccess={geminiSaveSuccess}
                geminiSaveError={geminiSaveError}
                handleSaveGeminiKeyOnly={handleSaveGeminiKeyOnly}
                testingOpenRouter={testingOpenRouter}
                openRouterTestResult={openRouterTestResult}
                handleTestOpenRouter={handleTestOpenRouter}
                isSavingOpenRouterKey={isSavingOpenRouterKey}
                openRouterSaveSuccess={openRouterSaveSuccess}
                openRouterSaveError={openRouterSaveError}
                handleSaveOpenRouterKeyOnly={handleSaveOpenRouterKeyOnly}
                isSavingAllKeys={isSavingAllKeys}
                allKeysSaveSuccess={allKeysSaveSuccess}
                handleSaveApiKeys={handleSaveApiKeys}
                systemStatusInfo={systemStatusInfo}
                isDownloadingBackup={isDownloadingBackup}
                handleDownloadFullBackup={handleDownloadFullBackup}
                handleDownloadMysqlDump={handleDownloadMysqlDump}
                handleSelectBackupFileForPreview={handleSelectBackupFileForPreview}
                restoreFileInputRef={restoreFileInputRef as any}
                backupRestoreMsg={backupRestoreMsg}
                isCheckingUpdates={isCheckingUpdates}
                setIsCheckingUpdates={setIsCheckingUpdates}
                updateStatusMsg={updateStatusMsg}
                setUpdateStatusMsg={setUpdateStatusMsg}
                fetchSystemStatus={fetchSystemStatus}
                copiedKey={copiedKey}
                handleCopy={handleCopy}
              />
            )}
          </div>
        </div>

      {/* Modals - Conditionally rendered for maximum tab switching performance */}
      {isWelcomeModalOpen && (
        <AdminWelcomeModal
          isOpen={isWelcomeModalOpen}
          onClose={() => {
            try {
              sessionStorage.setItem('pirivena_admin_welcome_shown', 'true');
              localStorage.setItem('pirivena_admin_welcome_shown', 'true');
            } catch (e) {}
            setIsWelcomeModalOpen(false);
          }}
          user={user}
          totalStudents={students.length}
          totalTeachers={teachers.length}
          totalClasses={classes.length}
          totalExams={exams.length}
          totalSubjects={subjects.length}
          totalNews={newsList.length}
          pendingAdmissionsCount={admissions.filter((a) => a.status === 'pending').length}
          pendingDonationsCount={donations.filter((d) => d.status === 'pending').length}
          onGoToSiteEditor={() => switchSubTab('site_editor')}
          onGoToAdmissions={() => switchSubTab('admissions')}
          onGoToDonations={() => switchSubTab('donations_manager')}
        />
      )}

      {confirmConfig.isOpen && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          variant={confirmConfig.variant}
          onConfirm={confirmConfig.onConfirm}
          onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
          isLoading={confirmConfig.isLoading}
        />
      )}

      {showStudentModal && (
        <AddStudentModal
          isOpen={showStudentModal}
          onClose={() => setShowStudentModal(false)}
          editingStudent={editingStudent}
          studentForm={studentForm}
          setStudentForm={setStudentForm}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          onSave={handleSaveStudent}
          step={studentFormStep}
          setStep={setStudentFormStep}
          isSaving={isSavingStudent}
        />
      )}

      {showTeacherModal && (
        <AddTeacherModal
          isOpen={showTeacherModal}
          onClose={() => setShowTeacherModal(false)}
          editingTeacher={editingTeacher}
          teacherForm={teacherForm}
          setTeacherForm={setTeacherForm}
          classes={classes}
          subjects={subjects}
          onSave={handleSaveTeacher}
          step={teacherFormStep}
          setStep={setTeacherFormStep}
          isSaving={isSavingTeacher}
        />
      )}

      {showClassModal && (
        <ClassModal
          isOpen={showClassModal}
          onClose={() => setShowClassModal(false)}
          editingClass={editingClass}
          classForm={classForm}
          setClassForm={setClassForm}
          teachers={teachers}
          subjects={subjects}
          onSave={handleSaveClass}
          isSaving={isSavingClass}
        />
      )}

      {showSubjectModal && (
        <SubjectModal
          isOpen={showSubjectModal}
          onClose={() => setShowSubjectModal(false)}
          editingSubject={editingSubject}
          subjectForm={subjectForm}
          setSubjectForm={setSubjectForm}
          teachers={teachers}
          onSave={handleSaveSubject}
          isSaving={isSavingSubject}
        />
      )}

      {showNoticeModal && (
        <BroadcastNoticeModal
          isOpen={showNoticeModal}
          onClose={() => setShowNoticeModal(false)}
          editingNoticeId={editingNoticeId}
          noticeForm={noticeForm}
          setNoticeForm={setNoticeForm}
          onSave={handleSaveNotice}
          onApplyTemplate={handleApplyNoticeTemplate}
          isSaving={isSavingNotice}
        />
      )}

      {selectedBackupPreview && (
        <BackupPreviewModal
          selectedBackupPreview={selectedBackupPreview}
          onClose={() => setSelectedBackupPreview(null)}
          onConfirmRestore={handleConfirmExecuteRestore}
          isRestoringBackup={isRestoringBackup}
        />
      )}
      </div>
    </PullToRefreshWrapper>
  );
};
