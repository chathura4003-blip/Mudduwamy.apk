import React, { useState, useEffect, useRef, Suspense, type ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { PublicSiteProvider } from './context/PublicSiteContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { QrStudentCardModal } from './components/QrStudentCardModal';
import { CertificateVerificationModal } from './components/CertificateVerificationModal';
import { SplashLoader } from './components/SplashLoader';
import { AnimatedAtmosphereBackground } from './components/AnimatedAtmosphereBackground';
import { PageLoadingSpinner } from './components/PageLoadingSpinner';
import { ExitConfirmationModal } from './components/ExitConfirmationModal';
import { OnboardingFlowModal } from './components/OnboardingFlowModal';
import type { User } from './types';
import { BroadcastNoticeBanner } from './components/BroadcastNoticeBanner';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';
import { BottomNavigationBar } from './components/BottomNavigationBar';
import { AppUpdateModal } from './components/AppUpdateModal';

// ERP Core View Dynamic Loaders & Eager Prefetching
import { LoginView } from './views/LoginView';
const loadAdminDashboard = () => import('./views/AdminDashboard').then((m) => ({ default: m.AdminDashboard }));
const loadTeacherPortal = () => import('./views/TeacherPortal').then((m) => ({ default: m.TeacherPortal }));
const loadStudentPortal = () => import('./views/StudentPortal').then((m) => ({ default: m.StudentPortal }));

const AdminDashboard = React.lazy(loadAdminDashboard);
const TeacherPortal = React.lazy(loadTeacherPortal);
const StudentPortal = React.lazy(loadStudentPortal);

const AiAssistantModal = React.lazy(() => import('./components/AiAssistantModal').then((m) => ({ default: m.AiAssistantModal })));
const StudentReportCardModal = React.lazy(() => import('./components/StudentReportCardModal').then((m) => ({ default: m.StudentReportCardModal })));
const UniversalFileViewerModal = React.lazy(() => import('./components/UniversalFileViewerModal').then((m) => ({ default: m.UniversalFileViewerModal })));
import type { InAppFileInfo } from './components/UniversalFileViewerModal';

// 🚀 Eagerly prefetch active user portal in background for instantaneous (0ms) first-paint
if (typeof window !== 'undefined') {
  try {
    const savedUser = localStorage.getItem('pirivena_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u?.role === 'admin' || u?.role === 'superadmin') {
        loadAdminDashboard();
      } else if (u?.role === 'teacher') {
        loadTeacherPortal();
      } else if (u?.role === 'student') {
        loadStudentPortal();
      }
    }
  } catch (_) {}
}

import { FloatingPirivenaChat } from './components/FloatingPirivenaChat';
import { useMobileNativeEnhancements } from './hooks/useMobileNativeEnhancements';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';
import { notificationService } from './services/notificationService';
import { oneSignalService } from './services/oneSignalService';
import { liveUpdateService, isAutoLiveUpdateEnabled } from './services/liveUpdateService';
import { WifiOff, RefreshCw } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('pirivena_user');
      const savedToken = localStorage.getItem('pirivena_token');
      const savedTab = localStorage.getItem('pirivena_current_tab') || sessionStorage.getItem('pirivena_current_tab');

      if (savedToken && savedUser) {
        if (savedTab && savedTab !== 'login' && savedTab !== 'home' && savedTab !== 'portal') {
          return savedTab;
        }
        const u = JSON.parse(savedUser);
        if (u.role === 'admin' || u.role === 'superadmin') return 'admin_portal';
        if (u.role === 'teacher') return 'teacher_portal';
        return 'student_portal';
      }
      return 'login';
    } catch (e) {
      return 'login';
    }
  });
  const [adminEditorTab, setAdminEditorTab] = useState<string>(() => {
    try {
      return sessionStorage.getItem('pirivena_admin_tab') || 'overview';
    } catch (e) {
      return 'overview';
    }
  });

  // Onboarding & Exit Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pirivena_onboarding_completed') !== 'true';
    } catch (e) {
      return false;
    }
  });
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrUser, setQrUser] = useState<User | null>(null);

  // Student Report Card Modal
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [reportCardUser, setReportCardUser] = useState<User | null>(null);

  // Universal In-App Document & File Viewer Modal
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [activeViewerFile, setActiveViewerFile] = useState<InAppFileInfo | null>(null);

  // Dynamic Header Height Tracking (Memoized to prevent render loops)
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(64);

  useEffect(() => {
    if (!headerRef.current) return;
    const updateHeight = () => {
      if (headerRef.current) {
        const h = Math.ceil(headerRef.current.getBoundingClientRect().height);
        setHeaderHeight((prev) => (prev !== h ? h : prev));
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [user, currentTab]);

  // Listen for open-modal global events from child tabs & overview
  useEffect(() => {
    const handleOpenAi = () => setIsAiModalOpen(true);
    const handleOpenCert = () => setIsCertModalOpen(true);
    const handleOpenQr = (e: any) => {
      if (e?.detail) setQrUser(e.detail);
      setIsQrModalOpen(true);
    };
    const handleOpenReportCard = (e: any) => {
      if (e?.detail) setReportCardUser(e.detail);
      setIsReportCardOpen(true);
    };
    const handleOpenFileViewer = (e: any) => {
      if (e?.detail) setActiveViewerFile(e.detail);
      setIsFileViewerOpen(true);
    };

    const handleSwitchSubTab = (e: any) => {
      if (e?.detail) setAdminEditorTab(e.detail);
    };

    const handleOpenOnboarding = () => setIsOnboardingOpen(true);

    window.addEventListener('open-ai-assistant-modal', handleOpenAi);
    window.addEventListener('open-cert-modal', handleOpenCert);
    window.addEventListener('open-qr-modal', handleOpenQr as EventListener);
    window.addEventListener('open-report-card-modal', handleOpenReportCard as EventListener);
    window.addEventListener('open-in-app-file-viewer', handleOpenFileViewer as EventListener);
    window.addEventListener('open-onboarding-modal', handleOpenOnboarding);
    window.addEventListener('switch-portal-subtab', handleSwitchSubTab as EventListener);

    return () => {
      window.removeEventListener('open-ai-assistant-modal', handleOpenAi);
      window.removeEventListener('open-cert-modal', handleOpenCert);
      window.removeEventListener('open-qr-modal', handleOpenQr as EventListener);
      window.removeEventListener('open-report-card-modal', handleOpenReportCard as EventListener);
      window.removeEventListener('open-in-app-file-viewer', handleOpenFileViewer as EventListener);
      window.removeEventListener('open-onboarding-modal', handleOpenOnboarding);
      window.removeEventListener('switch-portal-subtab', handleSwitchSubTab as EventListener);
    };
  }, []);

  // Ensure scroll is liberated and reset to top when switching portal roles / tabs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      document.body.style.pointerEvents = '';
    }
  }, [currentTab]);

  // Initialize Android Notification Channels, OneSignal, LiveOTA Updates & Action Listeners
  useEffect(() => {
    notificationService.initializeChannels();
    notificationService.setupNotificationListeners();
    oneSignalService.initialize();

    liveUpdateService.initialize().then(() => {
      const isAuto = isAutoLiveUpdateEnabled();
      liveUpdateService.checkForLiveUpdate({ autoApply: isAuto });
    });

    const handleAutoUpdateSetting = (e: any) => {
      if (e?.detail?.enabled) {
        liveUpdateService.checkForLiveUpdate({ autoApply: true, force: true });
      }
    };
    window.addEventListener('auto-update-setting-changed', handleAutoUpdateSetting);

    if (user) {
      notificationService.requestPermission();
      oneSignalService.setUser(user);
    } else {
      oneSignalService.logout();
    }

    return () => {
      window.removeEventListener('auto-update-setting-changed', handleAutoUpdateSetting);
    };
  }, [user]);

  // Smoothly hide native Capacitor splash screen once initial load completes
  useEffect(() => {
    if (!isLoading) {
      import('@capacitor/splash-screen')
        .then(({ SplashScreen }) => {
          SplashScreen.hide().catch(() => {});
        })
        .catch(() => {});
    }
  }, [isLoading]);

  // Close active modal on Android Back navigation event
  useEffect(() => {
    const handleCloseModal = () => {
      if (isAiModalOpen) setIsAiModalOpen(false);
      if (isCertModalOpen) setIsCertModalOpen(false);
      if (isQrModalOpen) setIsQrModalOpen(false);
      if (isReportCardOpen) setIsReportCardOpen(false);
      if (isFileViewerOpen) setIsFileViewerOpen(false);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
        document.body.style.overflowY = '';
        document.body.style.pointerEvents = '';
      }
    };
    window.addEventListener('close-active-modal', handleCloseModal);
    return () => window.removeEventListener('close-active-modal', handleCloseModal);
  }, [isAiModalOpen, isCertModalOpen, isQrModalOpen, isReportCardOpen, isFileViewerOpen]);

  const handleBackToOverview = React.useCallback(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: 'overview' }));
    } else if (user?.role === 'teacher') {
      window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: 'overview' }));
    } else {
      window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: 'dashboard' }));
    }
  }, [user]);

  // Layered Android Hardware Back Button Priority Stack
  useAndroidBackButton({
    isFileViewerOpen,
    closeFileViewer: () => setIsFileViewerOpen(false),
    isAiModalOpen,
    closeAiModal: () => setIsAiModalOpen(false),
    isReportCardOpen,
    closeReportCard: () => setIsReportCardOpen(false),
    isQrModalOpen,
    closeQrModal: () => setIsQrModalOpen(false),
    isCertModalOpen,
    closeCertModal: () => setIsCertModalOpen(false),
    isExitModalOpen,
    closeExitModal: () => setIsExitModalOpen(false),
    openExitConfirm: () => setIsExitModalOpen(true),
  });

  // Mobile Native Enhancements
  const { isOnline, showOfflineToast } =
    useMobileNativeEnhancements({
      onBackToOverview: handleBackToOverview,
      isSubTabActive: adminEditorTab !== 'overview' && adminEditorTab !== 'dashboard',
      onRefreshData: () => {
        window.dispatchEvent(new CustomEvent('refresh-portal-data'));
      },
    });

  // Sync currentTab to storage and scroll window to top instantly on tab change
  React.useEffect(() => {
    try {
      localStorage.setItem('pirivena_current_tab', currentTab);
      sessionStorage.setItem('pirivena_current_tab', currentTab);
    } catch (e) {}
    window.scrollTo(0, 0);
  }, [currentTab]);

  // Sync admin subtab changes
  React.useEffect(() => {
    const handleSubTabNav = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        setAdminEditorTab(e.detail);
        try {
          localStorage.setItem('pirivena_admin_tab', e.detail);
        } catch (err) {}
      }
    };
    window.addEventListener('switch-portal-subtab', handleSubTabNav);
    return () => window.removeEventListener('switch-portal-subtab', handleSubTabNav);
  }, []);

  // Auto-redirect logged in users to their respective portal dashboard
  React.useEffect(() => {
    if (isLoading) return; // Prevent premature redirect while verifying auth

    if (user) {
      if (user.role === 'admin' || user.role === 'superadmin') {
        if (currentTab !== 'admin_portal') setCurrentTab('admin_portal');
      } else if (user.role === 'teacher') {
        if (currentTab !== 'teacher_portal') setCurrentTab('teacher_portal');
      } else {
        if (currentTab !== 'student_portal') setCurrentTab('student_portal');
      }
    } else {
      if (currentTab !== 'login') {
        setCurrentTab('login');
      }
    }
  }, [user, currentTab, isLoading]);

  const handleOpenQrForUser = (u: User) => {
    setQrUser(u);
    setIsQrModalOpen(true);
  };

  const handleOpenReportCardForUser = (u?: User) => {
    setReportCardUser(u || user);
    setIsReportCardOpen(true);
  };

  const renderPortalView = () => {
    if (isLoading && !user) {
      return (
        <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
          <PageLoadingSpinner message="පද්ධතිය පූරණය වෙමින් පවතී..." />
        </div>
      );
    }

    if (!user) {
      return (
        <LoginView
          onSuccess={() => {
            const stored = localStorage.getItem('pirivena_user');
            if (stored) {
              try {
                const u = JSON.parse(stored);
                if (u.role === 'admin' || u.role === 'superadmin') setCurrentTab('admin_portal');
                else if (u.role === 'teacher') setCurrentTab('teacher_portal');
                else setCurrentTab('student_portal');
              } catch (e) {
                console.error(e);
              }
            }
          }}
        />
      );
    }

    if (user.role === 'admin' || user.role === 'superadmin') {
      return (
        <AdminDashboard
          onSelectStudentQr={handleOpenQrForUser}
          onSelectStudentReportCard={handleOpenReportCardForUser}
          initialTab={adminEditorTab}
        />
      );
    }

    if (user.role === 'teacher') {
      return (
        <TeacherPortal
          onSelectStudentReportCard={handleOpenReportCardForUser}
          onSelectStudentQr={handleOpenQrForUser}
        />
      );
    }

    return (
      <StudentPortal
        onOpenQrModal={() => handleOpenQrForUser(user)}
        onOpenCertModal={() => setIsCertModalOpen(true)}
        onOpenReportCardModal={() => handleOpenReportCardForUser(user)}
      />
    );
  };

  return (
    <div className="min-h-screen min-h-screen-dvh bg-[#f4f6f9] dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 flex flex-col selection:bg-amber-300 selection:text-amber-950 relative transition-colors duration-300">
      {/* 🌟 SYSTEM-WIDE AMBIENT ATMOSPHERIC BACKGROUND ANIMATIONS */}
      <AnimatedAtmosphereBackground />

      {/* 📱 FIRST-LAUNCH ONBOARDING FLOW MODAL */}
      <OnboardingFlowModal
        isOpen={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />

      {/* 🛑 ANDROID HARDWARE EXIT CONFIRMATION MODAL */}
      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
      />

      {/* 📡 REAL-TIME OFFLINE & CONNECTIVITY STATUS BANNER */}
      <NetworkStatusBanner />

      {/* INITIAL ANIMATED SPLASH LOADER */}
      <SplashLoader />

      {/* UNIFIED LOCKED HEADER TOP STACK - Permanently Fixed to Viewport Top */}
      {user && (
        <>
          <div
            ref={headerRef}
            className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-stone-800 pt-safe shadow-xs w-full"
          >
            {/* Live Emergency & Broadcast Alert Notice Banner */}
            <BroadcastNoticeBanner user={user} />

            <Navbar
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              onOpenAiAssistant={() => setIsAiModalOpen(true)}
              onOpenCertModal={() => setIsCertModalOpen(true)}
              onOpenQrModal={() => setIsQrModalOpen(true)}
              onOpenReportCardModal={() => setIsReportCardOpen(true)}
            />
          </div>
          {/* Header Clearance Spacer - Dynamically sized to EXACT pixel height */}
          <div style={{ height: `${headerHeight}px` }} className="shrink-0 w-full" aria-hidden="true" />
        </>
      )}

      <main className="flex-1 relative pb-32 sm:pb-12 pb-safe overflow-x-clip max-w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.995 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full min-h-full"
          >
            <Suspense fallback={<PageLoadingSpinner />}>
              {renderPortalView()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 📱 2026 MODERN MOBILE BOTTOM NAVIGATION BAR */}
      {user && (currentTab === 'admin_portal' || currentTab === 'teacher_portal' || currentTab === 'student_portal') && (
        <BottomNavigationBar />
      )}

      {/* Global Modals */}
      <Suspense fallback={null}>
        <AiAssistantModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      </Suspense>

      {isQrModalOpen && (
        <QrStudentCardModal
          user={qrUser || user}
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}

      {isCertModalOpen && (
        <CertificateVerificationModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
        />
      )}

      <Suspense fallback={null}>
        {isReportCardOpen && (
          <StudentReportCardModal
            student={reportCardUser || user}
            currentUser={user}
            isOpen={isReportCardOpen}
            onClose={() => setIsReportCardOpen(false)}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {isFileViewerOpen && (
          <UniversalFileViewerModal
            isOpen={isFileViewerOpen}
            fileInfo={activeViewerFile}
            onClose={() => setIsFileViewerOpen(false)}
          />
        )}
      </Suspense>


      {/* ⚡ Live OTA Update Modal (Global In-App Auto/Manual Update Dialog) */}
      <AppUpdateModal />

      {/* 💬 WhatsApp-Style Floating Ephemeral Chat Hub (Visible ONLY on user's authorized dashboard & auto-hidden on popups) */}
      {user && (currentTab === 'admin_portal' || currentTab === 'teacher_portal' || currentTab === 'student_portal') && (
        <FloatingPirivenaChat
          user={user}
          isHidden={isAiModalOpen || isCertModalOpen || isQrModalOpen || isReportCardOpen || isFileViewerOpen}
        />
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('App ErrorBoundary caught an exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-stone-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-stone-800 p-6 rounded-2xl border border-amber-600/40 text-center space-y-4 shadow-xl">
            <h2 className="text-xl font-bold font-serif text-amber-400">☸️ Sri Sumana Pirivena ERP</h2>
            <p className="text-xs text-stone-300">
              පද්ධතියේ කුඩා දෝෂයක් මතු විය. කරුණාකර පිටුව නැවුම් (Refresh) කරන්න.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              🔄 Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AccessibilityProvider>
          <LanguageProvider>
            <AuthProvider>
              <PublicSiteProvider>
                <ToastProvider>
                  <SocketProvider>
                    <MainAppContent />
                  </SocketProvider>
                </ToastProvider>
              </PublicSiteProvider>
            </AuthProvider>
          </LanguageProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
