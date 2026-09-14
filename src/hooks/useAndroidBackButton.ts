import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { navigationHistoryManager } from '../services/navigationHistoryManager';

interface BackButtonStackOptions {
  isFileViewerOpen: boolean;
  closeFileViewer: () => void;
  isAiModalOpen: boolean;
  closeAiModal: () => void;
  isReportCardOpen: boolean;
  closeReportCard: () => void;
  isQrModalOpen: boolean;
  closeQrModal: () => void;
  isCertModalOpen: boolean;
  closeCertModal: () => void;
  isExitModalOpen: boolean;
  closeExitModal: () => void;
  openExitConfirm: () => void;
}

export function useAndroidBackButton(options: BackButtonStackOptions) {
  const {
    isFileViewerOpen,
    closeFileViewer,
    isAiModalOpen,
    closeAiModal,
    isReportCardOpen,
    closeReportCard,
    isQrModalOpen,
    closeQrModal,
    isCertModalOpen,
    closeCertModal,
    isExitModalOpen,
    closeExitModal,
    openExitConfirm,
  } = options;

  // Sync Exit Modal state & handlers with manager
  useEffect(() => {
    navigationHistoryManager.setExitModalHandlers(openExitConfirm, closeExitModal);
    navigationHistoryManager.setExitModalState(isExitModalOpen);
  }, [isExitModalOpen, openExitConfirm, closeExitModal]);

  // Sync registered modals with manager
  useEffect(() => {
    if (isFileViewerOpen) {
      navigationHistoryManager.pushModal('file_viewer', closeFileViewer, 50);
    } else {
      navigationHistoryManager.removeModal('file_viewer');
    }
  }, [isFileViewerOpen, closeFileViewer]);

  useEffect(() => {
    if (isAiModalOpen) {
      navigationHistoryManager.pushModal('ai_modal', closeAiModal, 40);
    } else {
      navigationHistoryManager.removeModal('ai_modal');
    }
  }, [isAiModalOpen, closeAiModal]);

  useEffect(() => {
    if (isReportCardOpen) {
      navigationHistoryManager.pushModal('report_card', closeReportCard, 30);
    } else {
      navigationHistoryManager.removeModal('report_card');
    }
  }, [isReportCardOpen, closeReportCard]);

  useEffect(() => {
    if (isQrModalOpen) {
      navigationHistoryManager.pushModal('qr_modal', closeQrModal, 25);
    } else {
      navigationHistoryManager.removeModal('qr_modal');
    }
  }, [isQrModalOpen, closeQrModal]);

  useEffect(() => {
    if (isCertModalOpen) {
      navigationHistoryManager.pushModal('cert_modal', closeCertModal, 20);
    } else {
      navigationHistoryManager.removeModal('cert_modal');
    }
  }, [isCertModalOpen, closeCertModal]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ensure a baseline history state exists without creating an un-interacted skippable history item
    try {
      if (!window.history.state || !window.history.state.pirivenaInit) {
        window.history.replaceState({ pirivenaInit: true, page: 'portal' }, '');
      }
    } catch (_) {}

    const onHardwareBack = (): boolean => {
      return navigationHistoryManager.handleBack();
    };

    // 1. Capacitor native back button listener
    let backListener: any = null;
    try {
      CapacitorApp.addListener('backButton', () => {
        onHardwareBack();
      })
        .then((listener) => {
          backListener = listener;
        })
        .catch(() => {});
    } catch (e) {}

    // 2. Web browser popstate listener
    const handlePopState = (e: PopStateEvent) => {
      const handled = onHardwareBack();
      if (handled) {
        // Prevent default browser exit if handled internally by app stack
        try {
          window.history.pushState({ pirivenaInit: true, page: 'portal' }, '');
        } catch (err) {}
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      if (backListener && typeof backListener.remove === 'function') {
        backListener.remove();
      }
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
