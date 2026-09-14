import { triggerHaptic } from '../utils/haptics';

export interface ModalAction {
  id: string;
  close: () => void;
  priority?: number; // Higher number = closes first
}

class NavigationHistoryManager {
  private modalStack: ModalAction[] = [];
  private tabHistory: string[] = [];
  private currentTab: string = 'overview';
  private exitModalOpen: boolean = false;
  private closeExitModalFn: (() => void) | null = null;
  private openExitModalFn: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('switch-portal-subtab', (e: any) => {
        if (e.detail && typeof e.detail === 'string') {
          this.recordTabNavigation(e.detail);
        }
      });
    }
  }

  // Register the Exit Modal functions
  public setExitModalHandlers(openFn: () => void, closeFn: () => void) {
    this.openExitModalFn = openFn;
    this.closeExitModalFn = closeFn;
  }

  public setExitModalState(isOpen: boolean) {
    this.exitModalOpen = isOpen;
  }

  // Record a tab transition (e.g., 'overview' -> 'timetable' -> 'materials')
  public recordTabNavigation(newTab: string) {
    const cleanTab = newTab.trim().toLowerCase();
    if (!cleanTab || cleanTab === this.currentTab) return;

    // If navigating to 'overview' or 'dashboard', reset deep history to keep stack clean
    if (cleanTab === 'overview' || cleanTab === 'dashboard') {
      this.tabHistory = [];
    } else {
      // Don't push if already at top of history
      if (this.tabHistory[this.tabHistory.length - 1] !== this.currentTab) {
        this.tabHistory.push(this.currentTab);
      }
      // Limit history to 15 entries
      if (this.tabHistory.length > 15) {
        this.tabHistory.shift();
      }
    }

    this.currentTab = cleanTab;
  }

  // Set the current tab directly (e.g. on initial mount or role switch)
  public setCurrentTab(tab: string) {
    this.currentTab = tab.trim().toLowerCase();
  }

  public getCurrentTab(): string {
    return this.currentTab;
  }

  // Clear all history stacks (e.g. on logout or login)
  public clearHistory() {
    this.modalStack = [];
    this.tabHistory = [];
    this.currentTab = 'overview';
    this.exitModalOpen = false;
  }

  // Push a modal onto the modal stack
  public pushModal(id: string, close: () => void, priority: number = 10) {
    // Remove if already exists with same id
    this.modalStack = this.modalStack.filter((m) => m.id !== id);
    this.modalStack.push({ id, close, priority });

    // Push browser history state so physical back button doesn't pop the page URL
    if (typeof window !== 'undefined') {
      try {
        if (!window.history.state?.modalId || window.history.state.modalId !== id) {
          window.history.pushState({ modalId: id, app: 'pirivena' }, '');
        }
      } catch (_) {}
    }
  }

  // Remove a modal when it is closed normally by user click
  public removeModal(id: string) {
    this.modalStack = this.modalStack.filter((m) => m.id !== id);
  }

  // Check if any modal is currently registered or open in DOM
  public hasOpenModals(): boolean {
    if (this.exitModalOpen) return true;
    if (this.modalStack.length > 0) return true;

    if (typeof document !== 'undefined') {
      const activeDomModals = document.querySelectorAll(
        '[data-modal="true"], [role="dialog"], .fixed.inset-0.z-\\[99999\\], .fixed.inset-0.z-\\[999999\\], .fixed.inset-0.z-\\[100000\\], .fixed.inset-0.bg-black\\/80, .fixed.inset-0.bg-black\\/85, .fixed.inset-0.bg-black\\/90, .fixed.inset-0.bg-stone-950\\/80'
      );
      if (activeDomModals.length > 0) return true;
    }

    return false;
  }

  // Execute one step of hierarchical Back navigation
  public handleBack(): boolean {
    triggerHaptic('light');

    // 1. If Exit Modal is open -> close Exit Modal
    if (this.exitModalOpen) {
      if (this.closeExitModalFn) {
        this.closeExitModalFn();
      }
      this.exitModalOpen = false;
      return true;
    }

    // 2. Pop highest priority modal from modal stack
    if (this.modalStack.length > 0) {
      // Sort by priority descending
      this.modalStack.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      const topModal = this.modalStack.pop();
      if (topModal && typeof topModal.close === 'function') {
        topModal.close();
        return true;
      }
    }

    // 3. Fallback: Close generic DOM modal via event & Escape key trigger
    if (typeof document !== 'undefined') {
      const activeDomModals = document.querySelectorAll(
        '[data-modal="true"], [role="dialog"], .fixed.inset-0.z-\\[99999\\], .fixed.inset-0.z-\\[999999\\], .fixed.inset-0.z-\\[100000\\], .fixed.inset-0.bg-black\\/80, .fixed.inset-0.bg-black\\/85, .fixed.inset-0.bg-black\\/90, .fixed.inset-0.bg-stone-950\\/80'
      );
      if (activeDomModals.length > 0) {
        window.dispatchEvent(new CustomEvent('close-active-modal'));
        try {
          const escEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true,
          });
          window.dispatchEvent(escEvent);
          document.dispatchEvent(escEvent);
        } catch (_) {}
        return true;
      }
    }

    // 4. Sub-tab History: Pop previous tab if available
    if (this.tabHistory.length > 0) {
      const prevTab = this.tabHistory.pop();
      if (prevTab && prevTab !== this.currentTab && prevTab !== 'overview' && prevTab !== 'dashboard') {
        this.currentTab = prevTab;
        window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: prevTab }));
        return true;
      }
    }

    // 5. Dynamically detect if student/teacher/admin is currently on a subtab
    let activeSubtab = this.currentTab;
    try {
      const studentTab = localStorage.getItem('pirivena_student_tab');
      const teacherTab = localStorage.getItem('pirivena_teacher_tab');
      const adminTab = localStorage.getItem('pirivena_admin_tab');
      if (studentTab && studentTab !== 'overview' && studentTab !== 'dashboard') {
        activeSubtab = studentTab;
      } else if (teacherTab && teacherTab !== 'overview' && teacherTab !== 'dashboard') {
        activeSubtab = teacherTab;
      } else if (adminTab && adminTab !== 'overview' && adminTab !== 'dashboard') {
        activeSubtab = adminTab;
      }
    } catch (_) {}

    // If currently in any subtab other than 'overview' / 'dashboard', return to 'overview' first
    if (activeSubtab !== 'overview' && activeSubtab !== 'dashboard') {
      this.currentTab = 'overview';
      this.tabHistory = [];
      try {
        localStorage.setItem('pirivena_student_tab', 'overview');
        localStorage.setItem('pirivena_teacher_tab', 'overview');
        localStorage.setItem('pirivena_admin_tab', 'overview');
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: 'overview' }));
      return true;
    }

    // 6. Root Overview reached -> Open Exit Confirmation Modal in Sinhala
    if (this.openExitModalFn) {
      this.openExitModalFn();
      this.exitModalOpen = true;
      return true;
    }

    return false;
  }
}

export const navigationHistoryManager = new NavigationHistoryManager();
