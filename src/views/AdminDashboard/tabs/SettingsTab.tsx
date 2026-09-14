import React, { useState } from 'react';
import {
  Settings,
  Key,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Copy,
  Check,
  Phone,
  School,
  Database,
  Server,
  HardDrive,
  AlertTriangle,
  Globe,
  Save,
  CheckCircle,
  XCircle,
  Smartphone,
  Fingerprint,
  Clock,
  Laptop,
  Sliders,
  ShieldAlert,
  Zap,
  Sparkles,
  Code2,
  Award,
  Cpu,
  Info,
  Layers,
  Shield,
  Activity,
  FileCode,
  Type,
  Bell,
  Volume2,
  ExternalLink,
  FileArchive,
  Trash2,
  FileCheck,
  Users,
  GraduationCap,
  BookOpen,
  Crown,
  LogOut,
  Search,
  UserCheck,
} from 'lucide-react';
import { useAccessibility, TEXT_SIZE_SCALES, TextSizeOption } from '../../../context/AccessibilityContext';
import { useToast } from '../../../context/ToastContext';
import { notificationService } from '../../../services/notificationService';
import { triggerHaptic } from '../../../utils/haptics';
import { NotificationSettingsControl } from '../../../components/NotificationSettingsControl';
import { settingsApi } from '../../../api';
import {
  CURRENT_APP_VERSION,
  useAppVersion,
  compareSemanticVersions,
  extractGoogleDriveFileId,
  getGoogleDriveDirectDownloadUrl,
} from '../../../utils/appVersion';
import type { User } from '../../../types';
import {
  AdminSettingsFormState,
  ApiKeyFormState,
  SecConfig,
  ActiveSession,
  SecAuditLog,
  BackupPreviewData,
} from '../types';

interface SettingsTabProps {
  user?: User | null;
  adminSettingsForm: AdminSettingsFormState;
  setAdminSettingsForm: React.Dispatch<React.SetStateAction<AdminSettingsFormState>>;
  handleSaveAdminSettings: (e: React.FormEvent) => Promise<void>;
  adminSaveSuccess: boolean;

  secConfig: SecConfig;
  setSecConfig: React.Dispatch<React.SetStateAction<SecConfig>>;
  handleSaveMasterPin: () => void;

  activeSessions: ActiveSession[];
  handleRevokeSingleSession: (sessionId: string, deviceName: string) => void;
  handleRevokeOtherSessions: () => void;
  handleRefreshSessions: () => void;

  secAuditLogs: SecAuditLog[];
  auditLogFilter: 'all' | 'success' | 'warning' | 'info';
  setAuditLogFilter: (filter: 'all' | 'success' | 'warning' | 'info') => void;
  handleClearSecAuditLogs: () => void;
  handleExportAuditLogs: () => void;

  apiKeyForm: ApiKeyFormState;
  setApiKeyForm: React.Dispatch<React.SetStateAction<ApiKeyFormState>>;
  showGeminiKey: boolean;
  setShowGeminiKey: React.Dispatch<React.SetStateAction<boolean>>;
  showOpenRouterKey: boolean;
  setShowOpenRouterKey: React.Dispatch<React.SetStateAction<boolean>>;
  testingGemini: boolean;
  geminiTestResult: { valid: boolean; message: string } | null;
  handleTestGemini: () => Promise<void>;
  isSavingGeminiKey: boolean;
  geminiSaveSuccess: boolean;
  geminiSaveError: string | null;
  handleSaveGeminiKeyOnly: () => Promise<void>;

  testingOpenRouter: boolean;
  openRouterTestResult: { valid: boolean; message: string } | null;
  handleTestOpenRouter: () => Promise<void>;
  isSavingOpenRouterKey: boolean;
  openRouterSaveSuccess: boolean;
  openRouterSaveError: string | null;
  handleSaveOpenRouterKeyOnly: () => Promise<void>;

  isSavingAllKeys: boolean;
  allKeysSaveSuccess: boolean;
  handleSaveApiKeys: (e?: React.FormEvent) => Promise<void>;

  systemStatusInfo: any;
  isDownloadingBackup: boolean;
  handleDownloadFullBackup: () => Promise<void>;
  handleDownloadMysqlDump: () => Promise<void>;
  handleSelectBackupFileForPreview: (event: React.ChangeEvent<HTMLInputElement>) => void;
  restoreFileInputRef: React.RefObject<HTMLInputElement>;
  backupRestoreMsg: { type: 'success' | 'error'; text: string } | null;
  isCheckingUpdates: boolean;
  setIsCheckingUpdates: (val: boolean) => void;
  updateStatusMsg: string | null;
  setUpdateStatusMsg: (msg: string | null) => void;
  fetchSystemStatus: () => Promise<void>;
  copiedKey: string | null;
  handleCopy: (text: string, label: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = React.memo(({
  user,
  adminSettingsForm,
  setAdminSettingsForm,
  handleSaveAdminSettings,
  adminSaveSuccess,
  secConfig,
  setSecConfig,
  handleSaveMasterPin,
  activeSessions,
  handleRevokeSingleSession,
  handleRevokeOtherSessions,
  handleRefreshSessions,
  secAuditLogs,
  auditLogFilter,
  setAuditLogFilter,
  handleClearSecAuditLogs,
  handleExportAuditLogs,
  apiKeyForm,
  setApiKeyForm,
  showGeminiKey,
  setShowGeminiKey,
  showOpenRouterKey,
  setShowOpenRouterKey,
  testingGemini,
  geminiTestResult,
  handleTestGemini,
  isSavingGeminiKey,
  geminiSaveSuccess,
  geminiSaveError,
  handleSaveGeminiKeyOnly,
  testingOpenRouter,
  openRouterTestResult,
  handleTestOpenRouter,
  isSavingOpenRouterKey,
  openRouterSaveSuccess,
  openRouterSaveError,
  handleSaveOpenRouterKeyOnly,
  isSavingAllKeys,
  allKeysSaveSuccess,
  handleSaveApiKeys,
  systemStatusInfo,
  isDownloadingBackup,
  handleDownloadFullBackup,
  handleDownloadMysqlDump,
  handleSelectBackupFileForPreview,
  restoreFileInputRef,
  backupRestoreMsg,
  isCheckingUpdates,
  setIsCheckingUpdates,
  updateStatusMsg,
  setUpdateStatusMsg,
  fetchSystemStatus,
  copiedKey,
  handleCopy,
}) => {
  const { appTextSize, setAppTextSize, notifTextSize, setNotifTextSize } = useAccessibility();
  const appVersion = useAppVersion();
  const [activeSettingsSection, setActiveSettingsSection] = useState<
    'credentials' | 'security' | 'sessions' | 'ai' | 'app_update' | 'accessibility' | 'backup' | 'app_info'
  >(() => {
    try {
      const saved = localStorage.getItem('pirivena_settings_section');
      return (saved as any) || 'credentials';
    } catch (e) {
      return 'credentials';
    }
  });

  const getNextVersion = (baseVer: string) => {
    const clean = (baseVer || CURRENT_APP_VERSION).replace(/^v/i, '').trim();
    const parts = clean.split('.').map((p) => parseInt(p, 10) || 0);
    if (parts.length >= 3) {
      parts[2] += 1;
      return parts.join('.');
    }
    return `${clean}.1`;
  };

  // APK & Live OTA Update Management State
  const [apkUpdateForm, setApkUpdateForm] = useState({
    version: getNextVersion(CURRENT_APP_VERSION),
    liveUpdateZipUrl: '',
    releaseNotes: 'ශ්‍රී සුමන මහා පිරිවෙන් ජංගම යෙදුමේ නව විශේෂාංග සහ වේගවත් කාර්යක්ෂමතාව.\n- Capgo Live OTA ක්ෂණික යාවත්කාලීන සහාය.\n- UI & Push Notification වැඩිදියුණු කිරීම්.',
    forceUpdate: false,
  });
  const toast = useToast();
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [isDraggingZip, setIsDraggingZip] = useState(false);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const [isPublishingApk, setIsPublishingApk] = useState(false);
  const [apkPublishSuccess, setApkPublishSuccess] = useState<string | null>(null);
  const [apkPublishError, setApkPublishError] = useState<string | null>(null);
  // Active Users & Device Sessions Filter State
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [sessionRoleFilter, setSessionRoleFilter] = useState<'all' | 'students' | 'teachers' | 'admins'>('all');
  const [isBulkLoggingOut, setIsBulkLoggingOut] = useState<string | null>(null);

  const handleBulkLogoutRole = async (role: 'students' | 'teachers') => {
    const roleName = role === 'students' ? 'සියලුම සිසුන් (All Students)' : 'සියලුම ගුරුවරුන් (All Teachers)';
    if (!window.confirm(`ඔබට ${roleName} පද්ධතියෙන් එකවර Log Out කර දැමීමට අවශ්‍ය බව සහතිකද?`)) {
      return;
    }
    try {
      setIsBulkLoggingOut(role);
      triggerHaptic('heavy');
      await settingsApi.forceLogoutRole(role);
      handleRefreshSessions();
      toast.success(`${roleName} සාර්ථකව Log Out කරන ලදී!`);
    } catch (e) {
      toast.error('සමූහ Logout කිරීම අසාර්ථක විය.');
    } finally {
      setIsBulkLoggingOut(null);
    }
  };

  const filteredActiveSessions = React.useMemo(() => {
    return activeSessions.filter((sess) => {
      // 1. Role Filter
      if (sessionRoleFilter === 'students' && sess.role !== 'student') return false;
      if (sessionRoleFilter === 'teachers' && sess.role !== 'teacher') return false;
      if (sessionRoleFilter === 'admins' && sess.role !== 'admin' && sess.role !== 'superadmin') return false;

      // 2. Search Query Filter
      if (sessionSearchQuery.trim()) {
        const q = sessionSearchQuery.toLowerCase().trim();
        const nameMatch = (sess.name || '').toLowerCase().includes(q);
        const monkNameMatch = (sess.monkName || '').toLowerCase().includes(q);
        const idMatch = (sess.userId || sess.id || '').toLowerCase().includes(q);
        const deviceMatch = (sess.device || '').toLowerCase().includes(q);
        const classMatch = (sess.class || '').toLowerCase().includes(q);
        return nameMatch || monkNameMatch || idMatch || deviceMatch || classMatch;
      }
      return true;
    });
  }, [activeSessions, sessionRoleFilter, sessionSearchQuery]);

  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_settings_section', activeSettingsSection);
    } catch (e) { }

    if (activeSettingsSection === 'app_update') {
      settingsApi
        .getSiteSettings()
        .then((data: any) => {
          if (data) {
            const rawVer = data.liveUpdateVersion || data.appLatestVersion || CURRENT_APP_VERSION;
            const isLowerOrEqual = compareSemanticVersions(rawVer, CURRENT_APP_VERSION) <= 0;
            const suggestedVer = isLowerOrEqual ? getNextVersion(CURRENT_APP_VERSION) : rawVer;

            setApkUpdateForm({
              version: suggestedVer,
              liveUpdateZipUrl: data.liveUpdateZipUrl || data.appOtaZipUrl || '',
              releaseNotes:
                data.appReleaseNotes ||
                'ශ්‍රී සුමන මහා පිරිවෙන් ජංගම යෙදුමේ නව විශේෂාංග සහ වේගවත් කාර්යක්ෂමතාව.\n- Capgo Live OTA ක්ෂණික යාවත්කාලීන සහාය.\n- UI & Push Notification වැඩිදියුණු කිරීම්.',
              forceUpdate: data.appForceUpdate === true || data.appForceUpdate === 'true',
            });
          }
        })
        .catch(() => { });
    }
  }, [activeSettingsSection]);

  const handlePublishApkUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerHaptic('heavy');
    if (!apkUpdateForm.version.trim()) {
      setApkPublishError('කරුණාකර නව Version අංකයක් ඇතුළත් කරන්න.');
      return;
    }
    if (!selectedZipFile && !apkUpdateForm.liveUpdateZipUrl.trim()) {
      setApkPublishError('කරුණාකර dist.zip ගොනුව තෝරන්න (හෝ Direct Zip URL එකක් ඇතුළත් කරන්න).');
      return;
    }

    setIsPublishingApk(true);
    setApkPublishSuccess(null);
    setApkPublishError(null);

    try {
      if (selectedZipFile) {
        // Direct dist.zip file upload
        const formData = new FormData();
        formData.append('bundleZip', selectedZipFile);
        formData.append('version', apkUpdateForm.version.trim());
        formData.append('releaseNotes', apkUpdateForm.releaseNotes.trim());
        formData.append('forceUpdate', apkUpdateForm.forceUpdate ? 'true' : 'false');

        const res = await settingsApi.uploadLiveUpdateBundle(formData);
        if (res && res.success) {
          const cleanupNotice = res.cleanedOldFilesCount && res.cleanedOldFilesCount > 0
            ? ` 🧹 (පැරණි Update ගොනු ${res.cleanedOldFilesCount}ක් Server එකෙන් ඉවත් කර ඉඩ ${res.freedSpace || ''} නිදහස් කරන ලදී)`
            : '';
          setApkPublishSuccess(
            `⚡ dist.zip ගොනුව සාර්ථකව Server එකට Upload විය! (v${res.version} - ${res.fileSize}).${cleanupNotice} OneSignal Push Notification එක සියලුම පරිශීලකයින් වෙත යවන ලදී!`
          );
          setApkUpdateForm((prev) => ({
            ...prev,
            liveUpdateZipUrl: res.liveUpdateZipUrl || prev.liveUpdateZipUrl,
          }));
          setSelectedZipFile(null);
          triggerHaptic('success');
        } else {
          setApkPublishError(res?.message || 'dist.zip upload කිරීම අසාර්ථක විය.');
        }
      } else {
        // Manual Zip URL publish
        const res = await settingsApi.publishAppUpdate({
          version: apkUpdateForm.version.trim(),
          liveUpdateZipUrl: apkUpdateForm.liveUpdateZipUrl.trim(),
          releaseNotes: apkUpdateForm.releaseNotes.trim(),
          forceUpdate: apkUpdateForm.forceUpdate,
        });

        if (res && res.success) {
          setApkPublishSuccess(
            `නව Live OTA Update එක (v${res.version || apkUpdateForm.version}) සාර්ථකව නිකුත් කර OneSignal Push Notification එක සියලුම පරිශීලකයින් වෙත යවන ලදී!`
          );
          triggerHaptic('success');
        } else {
          setApkPublishError(res?.message || 'Update එක නිකුත් කිරීමට නොහැකි විය.');
        }
      }
    } catch (err: any) {
      setApkPublishError(err?.message || 'Update එක publish කිරීමේදී දෝෂයක් ඇති විය.');
    } finally {
      setIsPublishingApk(false);
    }
  };

  const filteredSecLogs = secAuditLogs.filter((log) => {
    if (auditLogFilter === 'all') return true;
    return log.severity === auditLogFilter;
  });

  return (
    <div className="space-y-3 pb-12 select-none animate-fade-in text-slate-900 dark:text-white">
      {/* 1. SINGLE-LINE SETTINGS SUB-TABS NAVIGATION (TOUCH & MOBILE OPTIMIZED) */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-2xl p-1.5 sm:p-2.5 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-stone-800 rounded-xl overflow-x-auto scrollbar-none touch-pan-x">
          {[
            { id: 'credentials', label: 'පරිපාලක ගිණුම', icon: Key, color: 'blue' },
            { id: 'security', label: 'Master PIN', icon: ShieldCheck, color: 'emerald' },
            { id: 'sessions', label: 'සක්‍රීය උපාංග (Sessions)', icon: Smartphone, color: 'teal' },
            { id: 'ai', label: 'AI API Keys', icon: Zap, color: 'purple' },
            { id: 'app_update', label: '⚡ Live OTA Updates', icon: Zap, color: 'amber' },
            { id: 'accessibility', label: '🔊 ශබ්ද, කම්පන & අකුරු', icon: Volume2, color: 'amber' },
            { id: 'backup', label: 'දත්ත Backup & Cloud DB', icon: Database, color: 'rose' },
            { id: 'app_info', label: '📱 පද්ධති & සංවර්ධක', icon: Sparkles, color: 'amber' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSettingsSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveSettingsSection(item.id as any);
                }}
                className={`flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg font-black text-xs transition cursor-pointer active:scale-95 shrink-0 whitespace-nowrap ${isActive
                    ? item.color === 'blue'
                      ? 'bg-blue-600 text-white shadow-sm font-black'
                      : item.color === 'emerald'
                        ? 'bg-emerald-600 text-white shadow-sm font-black'
                        : item.color === 'teal'
                          ? 'bg-teal-600 text-white shadow-sm font-black'
                          : item.color === 'purple'
                            ? 'bg-purple-600 text-white shadow-sm font-black'
                            : item.color === 'amber'
                              ? 'bg-amber-600 text-stone-950 shadow-sm font-black'
                              : 'bg-rose-600 text-white shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1: Admin Account Credentials */}
      {activeSettingsSection === 'credentials' && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 dark:border-stone-800 pb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-xs uppercase border border-blue-200 dark:border-blue-800">
              ප්‍රධාන ගිණුම් සැකසුම්
            </span>
            <h2 className="text-base sm:text-xl font-serif font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>පරිපාලක ගිණුම් විස්තර හා මුරපද (Superadmin Credentials)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              පද්ධති පරිපාලකගේ පිවිසුම් විද්‍යුත් තැපෑල (Email), මුරපදය (Password) සහ පෞද්ගලික තොරතුරු යාවත්කාලීන කරන්න.
            </p>
          </div>

          <form onSubmit={handleSaveAdminSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  පරිපාලක නාමය (English Name / Monk Name) *
                </label>
                <input id="settingstab-input-1" name="settingstab-input-1"
                  type="text"
                  required
                  value={adminSettingsForm.name}
                  onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  පරිපාලක නාමය (සිංහලෙන්)
                </label>
                <input id="settingstab-input-2" name="settingstab-input-2"
                  type="text"
                  value={adminSettingsForm.nameSinhala}
                  onChange={(e) =>
                    setAdminSettingsForm({ ...adminSettingsForm, nameSinhala: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  විද්‍යුත් තැපෑල (Login Email) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input id="settingstab-input-3" name="settingstab-input-3"
                    type="email"
                    required
                    value={adminSettingsForm.email}
                    onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  නව මුරපදය (New Password - හිස්ව තැබිය හැක)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input id="settingstab-input-4" name="settingstab-input-4"
                    type={adminSettingsForm.showPassword ? 'text' : 'password'}
                    value={adminSettingsForm.password}
                    onChange={(e) =>
                      setAdminSettingsForm({ ...adminSettingsForm, password: e.target.value })
                    }
                    placeholder="වෙනස් කිරීමට පමණක් ඇතුළත් කරන්න"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setAdminSettingsForm({
                        ...adminSettingsForm,
                        showPassword: !adminSettingsForm.showPassword,
                      })
                    }
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {adminSettingsForm.showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  දුරකථන අංකය (Contact Phone)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input id="settingstab-input-5" name="settingstab-input-5"
                    type="text"
                    value={adminSettingsForm.phone}
                    onChange={(e) => setAdminSettingsForm({ ...adminSettingsForm, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  පැවිදි / ගිහි භාවය (Monk or Lay Status)
                </label>
                <select id="settingstab-select-6" name="settingstab-select-6"
                  value={adminSettingsForm.monkStatus}
                  onChange={(e) =>
                    setAdminSettingsForm({ ...adminSettingsForm, monkStatus: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="monk">පැවිදි හිමිපාණන් වහන්සේ (Monk)</option>
                  <option value="lay">ගිහි භවතා (Lay / Non-Monk)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  පන්සල / ආයතනයේ ලිපිනය (Temple / Office Address)
                </label>
                <input id="settingstab-input-7" name="settingstab-input-7"
                  type="text"
                  value={adminSettingsForm.address}
                  onChange={(e) =>
                    setAdminSettingsForm({ ...adminSettingsForm, address: e.target.value })
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-stone-800">
              {adminSaveSuccess ? (
                <div className="flex items-center gap-2 text-xs font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>පරිපාලක තොරතුරු සාර්ථකව යාවත්කාලීන විය!</span>
                </div>
              ) : (
                <div />
              )}
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>සුරකින්න (Save Credentials)</span>
              </button>
            </div>
          </form>

          {/* Sound & Haptic Vibration Toggle Controls */}
          <div className="pt-5 border-t border-slate-100 dark:border-stone-800">
            <NotificationSettingsControl userId={user?.id} />
          </div>
        </div>
      )}

      {/* Section 2: Master PIN & Security PIN */}
      {activeSettingsSection === 'security' && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 dark:border-stone-800 pb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase border border-emerald-200 dark:border-emerald-800">
              ආරක්ෂක PIN පද්ධතිය
            </span>
            <h2 className="text-base sm:text-xl font-serif font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>ප්‍රධාන ආරක්ෂක Master Security PIN සැකසුම</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ගිණුම් මකාදැමීම්, දත්ත නැවත පිහිටුවීම් (Reset) සහ උසස් පරිපාලන ක්‍රියාකාරකම් ආරක්ෂා කිරීමට 6-Digit Master Security PIN එකක් භාවිත කරන්න.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-black text-xs text-emerald-950 dark:text-emerald-200">
                    Master Security PIN අංකය
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                  Critical Security
                </span>
              </div>

              <div className="relative">
                <input
                  id="settingstab-masterpin-input"
                  name="settingstab-masterpin-input"
                  type={secConfig.showMasterPin ? 'text' : 'password'}
                  maxLength={10}
                  value={secConfig.masterPin || ''}
                  onChange={(e) => setSecConfig({ ...secConfig, masterPin: e.target.value })}
                  placeholder="Master PIN (උදා: 778899)"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700/80 rounded-xl font-mono text-sm tracking-wider font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSecConfig({
                      ...secConfig,
                      showMasterPin: !secConfig.showMasterPin,
                    })
                  }
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {secConfig.showMasterPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
                මෙම PIN අංකය වැදගත් ශිෂ්‍ය/ගුරු දත්ත මකාදැමීම්, Restore කිරීම් සහ විශේෂ පද්ධති වෙනස්කම් සිදුකිරීමේදී විමසනු ලැබේ.
              </p>
            </div>

            {/* Additional Security Rules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-850 border border-slate-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-800 dark:text-slate-200">
                    ස්වයංක්‍රීය Logout කාලය
                  </span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <select
                  value={secConfig.autoLogoutMinutes || 60}
                  onChange={(e) =>
                    setSecConfig({ ...secConfig, autoLogoutMinutes: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer outline-none"
                >
                  <option value={15}>විනාඩි 15 (ඉහළ ආරක්ෂාව)</option>
                  <option value={30}>විනාඩි 30</option>
                  <option value={60}>පැය 1 (සාමාන්‍ය)</option>
                  <option value={120}>පැය 2</option>
                  <option value={480}>පැය 8</option>
                </select>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  පද්ධතිය භාවිත නොකරන විට ඉබේ Logout වන කාලය
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-850 border border-slate-200 dark:border-stone-800 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-800 dark:text-slate-200">
                    සැකකටයුතු පිවිසුම් වැළැක්වීම
                  </span>
                  <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={secConfig.blockSuspiciousLogins ?? true}
                    onChange={(e) =>
                      setSecConfig({ ...secConfig, blockSuspiciousLogins: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ස්වයංක්‍රීය Brute-Force හා අනවසර පිවිසුම් අවහිර කරන්න
                  </span>
                </label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  නොදන්නා Device/IP මඟින් අසාර්ථක උත්සාහයන් සීමා කෙරේ
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('heavy');
                  handleSaveMasterPin();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Master PIN සුරකින්න (Save PIN)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Active Logged-in Users & APK Device Sessions Management Center */}
      {activeSettingsSection === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-7 shadow-xs space-y-6">
            
            {/* 🛡️ Luxury Header with Status & Action Toolbar */}
            <div className="border-b border-slate-100 dark:border-stone-800 pb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/15 text-teal-700 dark:text-teal-300 font-black text-xs uppercase border border-teal-300/60 dark:border-teal-700/60 flex items-center gap-1.5 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>සජීවී පරිශීලක හා උපාංග පාලක මැදිරිය</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Real-Time Sync Active</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  <span>සක්‍රීය උපාංග හා පිවිසුම් සැසි (Active Login Sessions)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                  ශ්‍රී සුමන ERP Mobile APK යෙදුම සහ වෙබ් අඩවියට දැනට Log වී සිටින සියලුම ශිෂ්‍ය, ගුරු හා පරිපාලක ගිණුම් සජීවීව පරීක්ෂා කර ඕනෑම අයෙකු ක්ෂණිකව දුරස්ථව Logout කළ හැක.
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    handleRefreshSessions();
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-slate-700 dark:text-slate-200 font-black text-xs rounded-xl flex items-center gap-2 transition cursor-pointer active:scale-95 border border-slate-200 dark:border-stone-700 shadow-2xs"
                  title="සජීවීව අලුත් කරන්න"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  disabled={isBulkLoggingOut !== null}
                  onClick={() => handleBulkLogoutRole('students')}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 dark:text-blue-300 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95 border border-blue-200 dark:border-blue-800 shadow-2xs disabled:opacity-50"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>සියලු සිසුන් Logout</span>
                </button>

                <button
                  type="button"
                  disabled={isBulkLoggingOut !== null}
                  onClick={() => handleBulkLogoutRole('teachers')}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95 border border-emerald-200 dark:border-emerald-800 shadow-2xs disabled:opacity-50"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>සියලු ගුරුවරුන් Logout</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('heavy');
                    if (window.confirm('ඔබ හැර අනෙකුත් සියලුම පරිශීලකයින් එකවර පද්ධතියෙන් Logout කර දැමීමට අවශ්‍ය බව සහතිකද?')) {
                      handleRevokeOtherSessions();
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs rounded-xl flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-md shadow-rose-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>අනෙක් සියලුම දෙනා Logout</span>
                </button>
              </div>
            </div>

            {/* 📊 4 Interactive Luxury Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSessionRoleFilter('all');
                }}
                className={`p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                  sessionRoleFilter === 'all'
                    ? 'bg-gradient-to-br from-teal-500/15 via-teal-500/5 to-transparent border-teal-500 ring-2 ring-teal-500/30 shadow-sm'
                    : 'bg-slate-50/80 dark:bg-stone-850 border-slate-200/80 dark:border-stone-800 hover:border-teal-300 dark:hover:border-teal-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">සියලුම පිවිසුම්</span>
                  <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-black text-slate-900 dark:text-white mt-2">
                  {activeSessions.length} <span className="text-xs font-normal text-slate-400 font-sans">Accounts</span>
                </div>
                <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-1">
                  100% Total Online Load
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSessionRoleFilter('students');
                }}
                className={`p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                  sessionRoleFilter === 'students'
                    ? 'bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border-blue-500 ring-2 ring-blue-500/30 shadow-sm'
                    : 'bg-slate-50/80 dark:bg-stone-850 border-slate-200/80 dark:border-stone-800 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-700 dark:text-blue-400">සක්‍රීය සිසුන්</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-black text-slate-900 dark:text-white mt-2">
                  {activeSessions.filter((s) => s.role === 'student').length}{' '}
                  <span className="text-xs font-normal text-slate-400 font-sans">Students</span>
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                  ශිෂ්‍ය ජංගම යෙදුම් සැසි
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSessionRoleFilter('teachers');
                }}
                className={`p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                  sessionRoleFilter === 'teachers'
                    ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                    : 'bg-slate-50/80 dark:bg-stone-850 border-slate-200/80 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">සක්‍රීය ගුරුවරුන්</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-black text-slate-900 dark:text-white mt-2">
                  {activeSessions.filter((s) => s.role === 'teacher').length}{' '}
                  <span className="text-xs font-normal text-slate-400 font-sans">Teachers</span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  ගුරු අධ්‍යයන පුවරු සැසි
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSessionRoleFilter('admins');
                }}
                className={`p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer ${
                  sessionRoleFilter === 'admins'
                    ? 'bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent border-purple-500 ring-2 ring-purple-500/30 shadow-sm'
                    : 'bg-slate-50/80 dark:bg-stone-850 border-slate-200/80 dark:border-stone-800 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-700 dark:text-purple-400">පරිපාලකයින්</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-serif font-black text-slate-900 dark:text-white mt-2">
                  {activeSessions.filter((s) => s.role === 'admin' || s.role === 'superadmin').length}{' '}
                  <span className="text-xs font-normal text-slate-400 font-sans">Admins</span>
                </div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-1">
                  Superadmin පාලන සැසි
                </div>
              </button>
            </div>

            {/* 🔍 Search Bar & Category Filter Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="ශිෂ්‍ය නම, Student ID (STD-...), ගුරු ID, හෝ පන්තිය අනුව සොයන්න..."
                  value={sessionSearchQuery}
                  onChange={(e) => setSessionSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-teal-500 transition shadow-inner"
                />
                {sessionSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSessionSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-1 py-0.5 rounded"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none touch-pan-x">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSessionRoleFilter('all');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                    sessionRoleFilter === 'all'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  සියල්ල ({activeSessions.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSessionRoleFilter('students');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                    sessionRoleFilter === 'students'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🎓 සිසුන් ({activeSessions.filter((s) => s.role === 'student').length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSessionRoleFilter('teachers');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                    sessionRoleFilter === 'teachers'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  👨‍🏫 ගුරුවරුන් ({activeSessions.filter((s) => s.role === 'teacher').length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSessionRoleFilter('admins');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                    sessionRoleFilter === 'admins'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  👑 පරිපාලක ({activeSessions.filter((s) => s.role === 'admin' || s.role === 'superadmin').length})
                </button>
              </div>
            </div>

            {/* 📱 Active User Sessions Cards List */}
            <div className="space-y-3">
              {filteredActiveSessions.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-stone-850 rounded-2xl border border-slate-200/80 dark:border-stone-800 space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-stone-800 text-slate-400 mx-auto flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-black text-slate-800 dark:text-slate-200">
                    කිසිදු සක්‍රීය පරිශීලකයෙකු හමු නොවීය.
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {sessionSearchQuery
                      ? 'සෙවුම් පදය පරීක්ෂා කර නැවත උත්සාහ කරන්න.'
                      : 'දැනට කිසිදු ගිණුමක් පද්ධතියට Log වී නොමැත.'}
                  </p>
                </div>
              ) : (
                filteredActiveSessions.map((sess) => {
                  const isCurrent = sess.isCurrent;
                  const isStudent = sess.role === 'student';
                  const isTeacher = sess.role === 'teacher';
                  const isAdmin = sess.role === 'admin' || sess.role === 'superadmin';

                  return (
                    <div
                      key={sess.id}
                      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-emerald-500/[0.08] via-teal-500/[0.05] to-transparent border-emerald-300 dark:border-emerald-700 shadow-xs ring-1 ring-emerald-400/30'
                          : 'bg-slate-50/90 dark:bg-stone-850/90 border-slate-200/80 dark:border-stone-800 hover:border-slate-300 dark:hover:border-stone-700 hover:shadow-xs'
                      }`}
                    >
                      {/* Left colored role indicator bar */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                          isCurrent
                            ? 'bg-emerald-500'
                            : isStudent
                            ? 'bg-blue-500'
                            : isTeacher
                            ? 'bg-teal-500'
                            : 'bg-purple-500'
                        }`}
                      />

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pl-1.5">
                        
                        {/* User Identity & Avatar */}
                        <div className="flex items-start gap-3.5">
                          <div className="relative shrink-0">
                            {sess.avatar ? (
                              <img
                                src={sess.avatar}
                                alt={sess.name}
                                className="w-13 h-13 rounded-2xl object-cover border-2 border-white dark:border-stone-750 shadow-sm"
                              />
                            ) : (
                              <div
                                className={`w-13 h-13 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${
                                  isAdmin
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                    : isTeacher
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                }`}
                              >
                                {isStudent ? (
                                  <GraduationCap className="w-7 h-7" />
                                ) : isTeacher ? (
                                  <BookOpen className="w-7 h-7" />
                                ) : (
                                  <Crown className="w-7 h-7" />
                                )}
                              </div>
                            )}

                            {/* Live Radar Pulse Indicator */}
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-stone-900 shadow-2xs"></span>
                            </span>
                          </div>

                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                                {sess.name || sess.userId}
                              </span>

                              {sess.monkName && (
                                <span className="text-xs text-amber-700 dark:text-amber-400 font-serif font-black bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                                  ({sess.monkName})
                                </span>
                              )}

                              {/* Role Badge */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wide ${
                                  isAdmin
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800'
                                    : isTeacher
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                                }`}
                              >
                                {isAdmin ? '👑 Admin' : isTeacher ? '👨‍🏫 ගුරුභවතා' : '🎓 ශිෂ්‍ය'}
                              </span>

                              {/* Class Badge */}
                              {sess.class && (
                                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] font-bold border border-slate-200 dark:border-stone-700">
                                  {sess.class} පන්තිය
                                </span>
                              )}

                              {isCurrent && (
                                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-[10px] font-black border border-emerald-300 dark:border-emerald-700">
                                  මෙම පරිපාලක ගිණුම (You)
                                </span>
                              )}
                            </div>

                            {/* Device and Network Details */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-stone-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-stone-700">
                                ID: {sess.userId || sess.id}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                <Smartphone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                <span>{sess.device || 'Android APK App'}</span>
                              </span>
                              <span>•</span>
                              <span className="font-mono">IP: {sess.ip}</span>
                              <span>•</span>
                              <span className="text-teal-700 dark:text-teal-300 font-bold flex items-center gap-1 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800/60">
                                <Clock className="w-3 h-3" />
                                <span>{sess.lastActive}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Force Logout Action Button */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-stone-800">
                          {isCurrent ? (
                            <span className="w-full md:w-auto px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-black border border-emerald-500/30 flex items-center justify-center gap-1.5 shadow-2xs">
                              <UserCheck className="w-4 h-4" />
                              <span>Current Active Session</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('heavy');
                                const targetName = sess.name || sess.userId || 'User';
                                if (window.confirm(`ඔබට '${targetName}' පරිශීලකයාගේ APK / Web සැසිය වහාම Logout කර දැමීමට අවශ්‍යද?`)) {
                                  handleRevokeSingleSession(sess.id, targetName);
                                }
                              }}
                              className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer active:scale-95 shadow-sm shadow-rose-500/25 flex items-center justify-center gap-2"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Force Logout (ඉවත් කරන්න)</span>
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 🛡️ Quick Security Helper Advice Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/5 via-emerald-500/5 to-transparent border border-teal-500/20 text-xs text-teal-950 dark:text-teal-200 flex items-start gap-3.5 shadow-2xs">
              <div className="p-2 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="font-black text-teal-900 dark:text-teal-200 text-xs">
                  දුරස්ථව Logout කිරීමේ ක්‍රියාකාරීත්වය (Remote Session Revocation Engine):
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  ඔබ යම් ශිෂ්‍යයෙකු හෝ ගුරුවරයෙකු ඉදිරියෙන් ඇති <strong className="text-rose-600 dark:text-rose-400 font-black">"Force Logout"</strong> එබූ සැණින්, එම පුද්ගලයාගේ Server Session Token එක වහාම අවලංගු වන අතර, ඔහුගේ ජංගම දුරකථනයේ APK එකෙන් හෝ Browser එකෙන් ඔහු ක්ෂණිකව පිවිසුම් තිරය (Login Screen) වෙත හරවා යවනු ලැබේ.
                </p>
              </div>
            </div>

          </div>

          {/* Security Audit Trail */}
          <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-serif font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>ආරක්ෂක සිදුවීම් සටහන (Security Audit Trail)</span>
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select id="settingstab-select-9" name="settingstab-select-9"
                  value={auditLogFilter}
                  onChange={(e) => setAuditLogFilter(e.target.value as any)}
                  className="px-2.5 py-1 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <option value="all">සියලුම සටහන් (All)</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
                <button
                  type="button"
                  onClick={handleExportAuditLogs}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-stone-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                >
                  <Download className="w-3 h-3" />
                  <span>Export JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearSecAuditLogs}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  Clear Trail
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-stone-800 text-xs">
              {filteredSecLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${log.severity === 'success'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : log.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          }`}
                      >
                        {log.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {log.details} • IP: {log.ip}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Google AI & API Keys */}
      {activeSettingsSection === 'ai' && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 dark:border-stone-800 pb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase border border-purple-200 dark:border-purple-800">
              AI තාක්ෂණික සැකසුම්
            </span>
            <h2 className="text-base sm:text-xl font-serif font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Google Gemini & OpenRouter AI Key Configuration</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              පිරිවෙන් විභාග ප්‍රශ්න පත්‍ර ස්වයංක්‍රීයව සැකසීම, බහුභාෂා පරිවර්තන සහ AI උපකාරක මෙවලම් සඳහා API Keys වින්‍යාස කරන්න.
            </p>
          </div>

          <form onSubmit={handleSaveApiKeys} className="space-y-5 text-xs">
            {/* Google Gemini Card */}
            <div className="p-4 bg-slate-50 dark:bg-stone-850 rounded-2xl border border-slate-200 dark:border-stone-750 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Google Gemini API Key (Primary Provider)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400">Google AI Studio</span>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input id="settingstab-input-10" name="settingstab-input-10"
                    type={showGeminiKey ? 'text' : 'password'}
                    value={apiKeyForm.geminiApiKey}
                    onChange={(e) => setApiKeyForm({ ...apiKeyForm, geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full pl-3 pr-10 py-2.5 border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={testingGemini || !apiKeyForm.geminiApiKey}
                    onClick={handleTestGemini}
                    className="w-full sm:w-auto px-3.5 py-2 bg-slate-200 dark:bg-stone-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition disabled:opacity-50 cursor-pointer active:scale-95 text-center"
                  >
                    {testingGemini ? 'පරීක්ෂා කරමින්...' : 'Test Connection'}
                  </button>
                  <button
                    type="button"
                    disabled={isSavingGeminiKey}
                    onClick={handleSaveGeminiKeyOnly}
                    className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition disabled:opacity-50 cursor-pointer active:scale-95 shadow-2xs text-center"
                  >
                    {isSavingGeminiKey ? 'සුරකිමින්...' : 'Save Gemini Key'}
                  </button>
                </div>

                {geminiTestResult && (
                  <span
                    className={`font-black flex items-center gap-1 text-xs ${geminiTestResult.valid ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                  >
                    {geminiTestResult.valid ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{geminiTestResult.message}</span>
                  </span>
                )}
              </div>
            </div>

            {/* OpenRouter Fallback Card */}
            <div className="p-4 bg-slate-50 dark:bg-stone-850 rounded-2xl border border-slate-200 dark:border-stone-750 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-500" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    OpenRouter API Key (Fallback Provider)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400">openrouter.ai</span>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input id="settingstab-input-11" name="settingstab-input-11"
                    type={showOpenRouterKey ? 'text' : 'password'}
                    value={apiKeyForm.openRouterApiKey}
                    onChange={(e) =>
                      setApiKeyForm({ ...apiKeyForm, openRouterApiKey: e.target.value })
                    }
                    placeholder="sk-or-v1-..."
                    className="w-full pl-3 pr-10 py-2.5 border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-xl font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-purple-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showOpenRouterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={testingOpenRouter || !apiKeyForm.openRouterApiKey}
                    onClick={handleTestOpenRouter}
                    className="w-full sm:w-auto px-3.5 py-2 bg-slate-200 dark:bg-stone-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition disabled:opacity-50 cursor-pointer active:scale-95 text-center"
                  >
                    {testingOpenRouter ? 'පරීක්ෂා කරමින්...' : 'Test Connection'}
                  </button>
                  <button
                    type="button"
                    disabled={isSavingOpenRouterKey}
                    onClick={handleSaveOpenRouterKeyOnly}
                    className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl transition disabled:opacity-50 cursor-pointer active:scale-95 shadow-2xs text-center"
                  >
                    {isSavingOpenRouterKey ? 'සුරකිමින්...' : 'Save OpenRouter Key'}
                  </button>
                </div>

                {openRouterTestResult && (
                  <span
                    className={`font-black flex items-center gap-1 text-xs ${openRouterTestResult.valid ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                  >
                    {openRouterTestResult.valid ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{openRouterTestResult.message}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Provider Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  ප්‍රධාන AI මාදිලිය (Primary Provider)
                </label>
                <select id="settingstab-select-12" name="settingstab-select-12"
                  value={apiKeyForm.primaryProvider}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, primaryProvider: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer outline-none focus:border-purple-500"
                >
                  <option value="gemini">Google Gemini AI (Direct SDK)</option>
                  <option value="openrouter">OpenRouter AI Gateway</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  දෙවන AI මාදිලිය (Fallback Provider)
                </label>
                <select id="settingstab-select-13" name="settingstab-select-13"
                  value={apiKeyForm.fallbackProvider}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, fallbackProvider: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-bold text-slate-900 dark:text-white cursor-pointer outline-none focus:border-purple-500"
                >
                  <option value="openrouter">OpenRouter AI Gateway</option>
                  <option value="gemini">Google Gemini AI</option>
                  <option value="none">No Fallback (Disabled)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-stone-800">
              {allKeysSaveSuccess && (
                <span className="font-black text-emerald-600 flex items-center justify-center sm:justify-start gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>සියලුම AI සැකසුම් සුරකින ලදී!</span>
                </span>
              )}
              <button
                type="submit"
                disabled={isSavingAllKeys}
                className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer sm:ml-auto"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingAllKeys ? 'සුරකිමින්...' : 'සියලුම AI සැකසුම් සුරකින්න'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 5: Live OTA Updates Manager */}
      {activeSettingsSection === 'app_update' && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 dark:border-stone-800 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase border border-amber-200 dark:border-amber-800 flex items-center gap-1 self-start">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Capgo Live OTA Instant Updates</span>
              </span>
              <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 self-start sm:self-auto">
                වත්මන් Version: <span className="text-amber-600 font-black">v{appVersion}</span>
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-serif font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Live OTA Update Manager (dist.zip 1-Click Uploader)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Frontend වෙනස්කම් සිදුකළ පසු <span className="font-mono font-bold text-amber-600">dist</span> ෆෝල්ඩරයේ <span className="font-mono font-bold text-amber-600">.zip</span> ගොනුව මෙතැනට Upload කර, සියලුම පරිශීලකයින්ට කිසිදු APK බාගත කිරීමකින් තොරව තත්පර 2කින් Live Update ලබා දෙන්න.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handlePublishApkUpdate} className="space-y-5 text-xs">
            {/* Version & Force Update row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  නව අනුවාදය (New Version Number) *
                </label>
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <input id="settingstab-input-14" name="settingstab-input-14"
                    type="text"
                    required
                    placeholder="උදා: 2.5.0"
                    value={apkUpdateForm.version}
                    onChange={(e) => setApkUpdateForm({ ...apkUpdateForm, version: e.target.value })}
                    className="flex-1 min-w-[140px] px-3.5 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-bold font-mono text-slate-900 dark:text-white outline-none focus:border-amber-500 transition"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const parts = apkUpdateForm.version.replace(/^v/i, '').split('.').map(p => parseInt(p, 10) || 0);
                        if (parts.length >= 3) {
                          parts[2] += 1;
                          setApkUpdateForm({ ...apkUpdateForm, version: parts.join('.') });
                        } else if (parts.length >= 2) {
                          parts[1] += 1;
                          parts[2] = 0;
                          setApkUpdateForm({ ...apkUpdateForm, version: parts.join('.') });
                        }
                      }}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px] transition cursor-pointer"
                      title="Increment Version (+0.0.1)"
                    >
                      +0.0.1
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const parts = apkUpdateForm.version.replace(/^v/i, '').split('.').map(p => parseInt(p, 10) || 0);
                        if (parts.length >= 2) {
                          parts[1] += 1;
                          parts[2] = 0;
                          setApkUpdateForm({ ...apkUpdateForm, version: parts.join('.') });
                        }
                      }}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px] transition cursor-pointer"
                      title="Increment Minor Version (+0.1.0)"
                    >
                      +0.1.0
                    </button>
                  </div>
                </div>
                {compareSemanticVersions(apkUpdateForm.version, appVersion) <= 0 ? (
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1.5 flex items-start gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
                    <span>
                      ⚠️ අවධානය: මෙම අංකය (v{apkUpdateForm.version}) දැනට ඇති Version (v{appVersion}) ට සමාන හෝ අඩුය. ජංගම යෙදුමට Update එක ලැබීමට නම් ඊට වඩා වැඩි අංකයක් (උදා: v{getNextVersion(appVersion)}) ලබා දෙන්න.
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span>
                      ✓ වලංගු නව අනුවාදයකි (v{apkUpdateForm.version} &gt; v{appVersion}). සියලුම APK යෙදුම්වලට Update එක ලැබෙනු ඇත.
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">
                  අනිවාර්ය යාවත්කාලීනයක්ද? (Force Update)
                </label>
                <button
                  type="button"
                  onClick={() => setApkUpdateForm({ ...apkUpdateForm, forceUpdate: !apkUpdateForm.forceUpdate })}
                  className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-between transition cursor-pointer ${apkUpdateForm.forceUpdate
                      ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-stone-800 dark:border-stone-700 dark:text-slate-300'
                    }`}
                >
                  <span>{apkUpdateForm.forceUpdate ? '⚠️ අනිවාර්යයි (Mandatory)' : 'නැත (Optional / Skipable)'}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${apkUpdateForm.forceUpdate ? 'bg-rose-600 border-rose-600' : 'border-slate-400'}`}>
                    {apkUpdateForm.forceUpdate && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Direct dist.zip Drag & Drop Upload Zone */}
            <div className="space-y-2">
              <label className="block font-black text-slate-700 dark:text-slate-300">
                dist.zip ගොනුව (Web Bundle Zip) *
              </label>

              {selectedZipFile ? (
                /* Selected File Card */
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-md shadow-emerald-500/20">
                      <FileArchive className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 truncate">
                          {selectedZipFile.name}
                        </span>
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      </div>
                      <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-bold block">
                        {(selectedZipFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Upload කිරීමට සූදානම්
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedZipFile(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer shrink-0"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Drag & Drop Input Zone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingZip(true);
                  }}
                  onDragLeave={() => setIsDraggingZip(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingZip(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      if (file.name.toLowerCase().endsWith('.zip')) {
                        setSelectedZipFile(file);
                        triggerHaptic('selection');
                      } else {
                        setApkPublishError('කරුණාකර වලංගු .zip ගොනුවක් පමණක් තෝරන්න.');
                      }
                    }
                  }}
                  className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${isDraggingZip
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 scale-[1.01]'
                      : 'border-slate-300 dark:border-stone-700 bg-slate-50 dark:bg-stone-800/50 hover:bg-amber-50/40 dark:hover:bg-stone-800 hover:border-amber-400'
                    }`}
                  onClick={() => {
                    const input = document.getElementById('dist-zip-file-input');
                    if (input) input.click();
                  }}
                >
                  <input
                    id="dist-zip-file-input"
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.name.toLowerCase().endsWith('.zip')) {
                          setSelectedZipFile(file);
                          triggerHaptic('selection');
                        } else {
                          setApkPublishError('කරුණාකර වලංගු .zip ගොනුවක් පමණක් තෝරන්න.');
                        }
                      }
                    }}
                  />

                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-stone-950 transition-all shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm block">
                      📁 මෙතැනට ඔබගේ <span className="text-amber-600 dark:text-amber-400 font-mono">dist.zip</span> ගොනුව Drag කර දමන්න
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                      හෝ පරිගණකයෙන් තෝරා ගැනීමට මෙතැන Click කරන්න (Click to Browse)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-stone-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold">
                      Direct 1-Click Server Upload
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Auto-Cleanup (පැරණි Update ගොනු Server එකෙන් Auto මැකේ)
                    </span>
                  </div>
                </div>
              )}

              {/* Toggle manual URL input */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>{showManualUrlInput ? '▲ Manual Zip URL සඟවන්න' : '▼ හෝ Direct Zip Link එකක් ඇතුළත් කරන්න'}</span>
                </button>

                {showManualUrlInput && (
                  <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 space-y-1">
                    <label className="font-black text-slate-700 dark:text-slate-300 text-[11px]">
                      Live OTA Zip URL (External Direct Link)
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-domain.com/updates/dist-v2.5.0.zip හෝ GitHub Release raw zip link"
                      value={apkUpdateForm.liveUpdateZipUrl}
                      onChange={(e) => setApkUpdateForm({ ...apkUpdateForm, liveUpdateZipUrl: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-xl font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 transition"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Release Notes / What's New */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-black text-slate-700 dark:text-slate-300">
                  යාවත්කාලීනයේ අලුත් දේවල් (What's New / Release Notes)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setApkUpdateForm({
                      ...apkUpdateForm,
                      releaseNotes: `ශ්‍රී සුමන මහා පිරිවෙන් ජංගම යෙදුමේ නව v${apkUpdateForm.version} Live Update යාවත්කාලීනය.\n- Capgo Live OTA ක්ෂණික යාවත්කාලීන සහාය.\n- UI & Push Notification වැඩිදියුණු කිරීම්.\n- දෝෂ නිවැරදි කිරීම් සහ වේගවත් ක්‍රියාකාරීත්වය.`,
                    });
                  }}
                  className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  නියැදි විස්තරය පුරවන්න
                </button>
              </div>
              <textarea id="settingstab-textarea-16" name="settingstab-textarea-16"
                rows={4}
                value={apkUpdateForm.releaseNotes}
                onChange={(e) => setApkUpdateForm({ ...apkUpdateForm, releaseNotes: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-800 rounded-xl font-medium text-slate-900 dark:text-white outline-none focus:border-amber-500 transition leading-relaxed"
                placeholder="මෙම යාවත්කාලීනයේ ඇති නව විශේෂාංග සහ දෝෂ නිවැරදි කිරීම් විස්තර කරන්න..."
              />
            </div>

            {/* Success & Error alerts */}
            {apkPublishSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 font-bold">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{apkPublishSuccess}</span>
              </div>
            )}

            {apkPublishError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-2.5 font-bold">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{apkPublishError}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-app-update'))}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-slate-50 hover:bg-slate-100 dark:bg-stone-800 dark:hover:bg-stone-750 text-slate-700 dark:text-slate-300 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Smartphone className="w-4 h-4 text-amber-500" />
                <span>📱 Preview Live Update Modal</span>
              </button>

              <button
                type="submit"
                disabled={isPublishingApk}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 text-stone-950 font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isPublishingApk ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>dist.zip Upload වී Update එක නිකුත් වෙමින් පවතී...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-stone-950" />
                    <span>⚡ Upload dist.zip & Publish Live Update</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 6: Accessibility & Permissions Center */}
      {activeSettingsSection === 'accessibility' && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 dark:border-stone-800 pb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase border border-amber-200 dark:border-amber-800">
              ප්‍රවේශ්‍යතාව සහ අකුරු සැකසුම්
            </span>
            <h2 className="text-base sm:text-xl font-serif font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <Type className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>යෙදුම් අකුරු ප්‍රමාණය සහ දැනුම්දීම් පාලනය (Accessibility Center)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              තිරයේ දිස්වන සියලුම අන්තර්ගතයන් සහ දැනුම්දීම් වල අකුරු ප්‍රමාණයන් ඔබගේ පහසුව පරිදි සකසන්න.
            </p>
          </div>

          {/* Sound & Haptic Vibration Toggle Controls */}
          <NotificationSettingsControl userId={user?.id} />

          {/* 1. APP TEXT SIZE */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-500" />
              <span>ප්‍රධාන යෙදුම් අකුරු ප්‍රමාණය (Application Text Scale)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.keys(TEXT_SIZE_SCALES) as TextSizeOption[]).map((key) => {
                const opt = TEXT_SIZE_SCALES[key];
                const isSelected = appTextSize === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setAppTextSize(key);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${isSelected
                        ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-sm ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-800/60 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {opt.labelSi}
                      </span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-amber-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. NOTIFICATION TEXT SIZE */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>දැනුම්දීම් අකුරු ප්‍රමාණය (Notification Cards Text Scale)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.keys(TEXT_SIZE_SCALES) as TextSizeOption[]).map((key) => {
                const opt = TEXT_SIZE_SCALES[key];
                const isSelected = notifTextSize === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setNotifTextSize(key);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${isSelected
                        ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 shadow-sm ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-800/60 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {opt.labelSi}
                      </span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-amber-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1">
                      In-app toasts & alerts text scale
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. NATIVE NOTIFICATIONS & PERMISSIONS TEST */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-stone-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Android පද්ධති අවසර තත්ත්වය (System Permissions & Tests)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    Native Local Notifications
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-stone-400">
                    Android 13+ POST_NOTIFICATIONS
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    triggerHaptic('medium');
                    await notificationService.requestPermission();
                    notificationService.scheduleNotification({
                      title: 'ශ්‍රී සුමන පිරිවෙන - පරීක්ෂණ දැනුම්දීම',
                      body: 'දැනුම්දීම් පද්ධතිය සාර්ථකව ක්‍රියාත්මක වේ (System Test Passed).',
                      sound: true,
                    });
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition cursor-pointer text-center"
                >
                  පරීක්ෂා කරන්න (Test)
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    Notification Sound Chime
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-stone-400">
                    Web Audio Synthesis Engine
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    notificationService.scheduleNotification({
                      title: 'Chime Test',
                      body: 'Audio check',
                      sound: true,
                    });
                  }}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>ශබ්දය (Play)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 7: Full Database Backup & System Status */}
      {activeSettingsSection === 'backup' && (
        <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 dark:border-stone-800 pb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase border border-rose-200 dark:border-rose-800">
              දත්ත ගබඩාව හා ප්‍රතිසාධනය
            </span>
            <h2 className="text-base sm:text-xl font-serif font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <Database className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span>සම්පූර්ණ පද්ධති දත්ත උපස්ථය (Full Database Backup & Restore)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              පිරිවෙන් පද්ධතියේ සියලුම ශිෂ්‍ය, ගුරු, විභාග, පන්ති හා වෙබ් අඩවි දත්ත JSON හෝ MySQL SQL Dump ගොනුවක් ලෙස බාගත කරගැනීම හා Restore කිරීම.
            </p>
          </div>

          {backupRestoreMsg && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-black flex items-center gap-2 ${backupRestoreMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                }`}
            >
              {backupRestoreMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{backupRestoreMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Export Backup Card */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-stone-850 rounded-2xl border border-slate-200 dark:border-stone-750 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-xl">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">
                      දත්ත Backup ගොනුව බාගත කරන්න
                    </h3>
                    <p className="text-[11px] text-slate-400">JSON හෝ MySQL SQL dump බාගැනීම</p>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  පද්ධතියේ ඇති සියලුම වගු (Tables) සහ දත්ත ආරක්ෂිතව පරිගණකයට බාගත කර තබාගන්න.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDownloadingBackup}
                  onClick={handleDownloadFullBackup}
                  className="w-full sm:flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingBackup ? 'බාගත වෙමින්...' : 'JSON Backup (.json)'}</span>
                </button>

                <button
                  type="button"
                  disabled={isDownloadingBackup}
                  onClick={handleDownloadMysqlDump}
                  className="w-full sm:flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-stone-750 dark:hover:bg-stone-700 active:scale-95 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer border border-slate-700 text-center"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>MySQL Dump (.sql)</span>
                </button>
              </div>
            </div>

            {/* Restore Backup Card */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-stone-850 rounded-2xl border border-slate-200 dark:border-stone-750 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">
                      Backup ගොනුවක් මගින් Restore කරන්න
                    </h3>
                    <p className="text-[11px] text-slate-400">JSON හෝ .sql dump මගින් ප්‍රතිසාධනය</p>
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  කලින් ලබාගත් Backup ගොනුවක් තෝරා එහි අන්තර්ගතය පෙරදසුන් (Preview) කර Restore කරන්න.
                </p>
              </div>

              <div>
                <input id="settingstab-input-17" name="settingstab-input-17"
                  ref={restoreFileInputRef}
                  type="file"
                  accept=".json,.sql"
                  onChange={handleSelectBackupFileForPreview}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => restoreFileInputRef.current?.click()}
                  className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Backup ගොනුව තෝරන්න (Select Backup)</span>
                </button>
              </div>
            </div>
          </div>

          {/* System Health / Status info */}
          {systemStatusInfo && (
            <div className="p-4 bg-slate-50 dark:bg-stone-850 rounded-2xl border border-slate-200 dark:border-stone-750 text-xs">
              <h4 className="font-black text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-blue-600" />
                <span>පද්ධති තත්ත්වය (System Health & Version Info)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Version</span>
                  <span className="font-black font-mono">{systemStatusInfo.version || 'v2.4.0'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Database</span>
                  <span className="font-black">{systemStatusInfo.database || 'MySQL Production'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Status</span>
                  <span className="font-black text-emerald-600">● Online / Healthy</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Server Time</span>
                  <span className="font-mono font-bold text-[11px]">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 8: App Info, Developer Attribution & System Architecture */}
      {activeSettingsSection === 'app_info' && (
        <div className="space-y-4 animate-fade-in">
          {/* Main App Hero Badge */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                    <School className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/30 uppercase tracking-wide">
                      Enterprise Release 2026
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active & Stable
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-xl font-black text-white mt-1">
                    ශ්‍රී සුමන මහා පිරිවෙන් ERP කළමනාකරණ පද්ධතිය
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-300 font-medium line-clamp-2 sm:line-clamp-none">
                    Sri Sumana Maha Pirivena Enterprise Resource Planning & Student Management System
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto shrink-0">
                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-1 bg-white/5 border border-white/10 rounded-2xl p-2.5 sm:px-4 shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">App Version</span>
                  <span className="text-base sm:text-xl font-black text-amber-400 font-mono">v{appVersion} PRO</span>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Build 2026.08.20.PROD</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    window.dispatchEvent(new CustomEvent('open-onboarding-modal'));
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95 group w-full"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-icon-sparkle" />
                  <span>පද්ධති හැඳින්වීම (Tour & Permissions)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid Layout: Developer Details & System Tech Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 👨‍💻 CARD 1: LEAD DEVELOPER PROFILE */}
            <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-stone-800 pb-3">
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      ප්‍රධාන මෘදුකාංග සංවර්ධක (Lead Developer)
                    </h3>
                    <p className="text-[10px] text-slate-400">System Architect & Software Engineer</p>
                  </div>
                </div>

                {/* Developer Profile Banner */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-stone-800/80 dark:to-stone-800/40 border border-blue-200/80 dark:border-stone-750 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Lead System Engineer
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        චතුර ධනංජය (Chathura Dananjaya)
                      </h4>
                    </div>
                    <span className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                      <Award className="w-5 h-5" />
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    ශ්‍රී සුමන මහා පිරිවෙන් Cloud ERP, Student Information System (SIS), StackCP MySQL Architecture සහ Mobile Android APK යෙදුමේ ප්‍රධාන නිර්මාණකරු සහ පද්ධති ඉංජිනේරු.
                  </p>
                </div>

                {/* Badges / Roles */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700">
                    <span className="font-bold text-slate-600 dark:text-slate-400">වගකීම (Role):</span>
                    <span className="font-black text-slate-900 dark:text-white">Full-Stack & Systems Architect</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700">
                    <span className="font-bold text-slate-600 dark:text-slate-400">ආරක්ෂක සහතිකය:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Official Verified License
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-stone-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Developer: Chathura Dananjaya</span>
                <span className="font-mono">© 2026 All Rights Reserved</span>
              </div>
            </div>

            {/* ⚙️ CARD 2: SYSTEM & TECHNICAL SPECIFICATIONS */}
            <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-stone-800 pb-3">
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      තාක්ෂණික පිරිවිතර (Technical Specs)
                    </h3>
                    <p className="text-[10px] text-slate-400">Frameworks, Backend & Database Architecture</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">Frontend UI</span>
                    <span className="font-black text-slate-900 dark:text-white">React 19 + Vite 6</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">Programming</span>
                    <span className="font-black text-slate-900 dark:text-white">TypeScript 5.8</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">Backend API</span>
                    <span className="font-black text-slate-900 dark:text-white">PHP 8.4 REST API</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">Cloud Database</span>
                    <span className="font-black text-slate-900 dark:text-white">MySQL 8.0</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">Mobile Platform</span>
                    <span className="font-black text-slate-900 dark:text-white">Android APK / PWA</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">Security Protocol</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">256-Bit SSL/TLS</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-amber-900 dark:text-amber-300 text-[11px] font-bold">
                <span>Cloud Server Node: StackCP Production</span>
                <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> 100% Uptime
                </span>
              </div>
            </div>
          </div>

          {/* 🏛️ CARD 3: OFFICIAL INSTITUTION PROFILE & CREDENTIALS */}
          <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-2xs space-y-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-stone-800 pb-2">
              <School className="w-4 h-4 text-amber-600" />
              <span>පිරිවෙන් නිල ආයතනික තොරතුරු (Official Institution Registry)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700">
                <span className="text-[10px] text-slate-400 font-bold block">පිරිවෙන් නාමය</span>
                <span className="font-black text-slate-900 dark:text-white text-xs">ශ්‍රී සුමන මහා පිරිවෙන</span>
                <span className="text-[10px] text-slate-500 block">Sri Sumana Maha Pirivena</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700">
                <span className="text-[10px] text-slate-400 font-bold block">පිහිටීම / ලිපිනය</span>
                <span className="font-black text-slate-900 dark:text-white text-xs">මුද්දුව, රත්නපුර</span>
                <span className="text-[10px] text-slate-500 block">Mudduwa, Ratnapura, Sri Lanka</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800 border border-slate-200/80 dark:border-stone-700">
                <span className="text-[10px] text-slate-400 font-bold block">අධ්‍යාපන අංශය</span>
                <span className="font-black text-slate-900 dark:text-white text-xs">ප්‍රාචීන හා මූලික පිරිවෙන්</span>
                <span className="text-[10px] text-slate-500 block">Ministry of Education Approved</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

