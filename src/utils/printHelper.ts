import { triggerHaptic } from './haptics';

/**
 * Universal Print Helper for Sri Sumana Maha Pirivena ERP
 * Seamlessly handles:
 * 1. Automatic Dark Mode -> Pure Light Mode switch for ink-friendly, clean PDF/Prints
 * 2. Android Native Print Spooler (via AndroidPrinter JavascriptInterface)
 * 3. Standard Web Browser window.print()
 * 4. Automatic Theme Restoration upon print completion
 */
export function triggerUniversalPrint(jobName = 'ශ්‍රී සුමන මහා පිරිවෙන - ලේඛනය (Document)'): void {
  triggerHaptic('light');

  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    const body = document.body;

    // Check if the user is currently using Dark Mode
    const isDark =
      root.classList.contains('dark') ||
      (body && body.classList.contains('dark')) ||
      root.getAttribute('data-theme') === 'dark';

    // 1. Temporarily switch DOM to Light Mode so all Tailwind classes render pristine white backgrounds and dark text
    if (isDark) {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      if (body) {
        body.classList.remove('dark');
        body.setAttribute('data-theme', 'light');
      }
    }

    // Add multiple active printing markers so all CSS print hooks engage reliably
    body.classList.add('printing-active', 'printing-report', 'printing-report-card', 'printing-id-card');

    const originalTitle = document.title;
    if (jobName) {
      document.title = jobName;
    }

    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;

      // Remove print classes
      body.classList.remove('printing-active', 'printing-report', 'printing-report-card', 'printing-id-card');
      document.title = originalTitle;
      window.removeEventListener('afterprint', cleanup);

      // Restore Dark Mode if it was originally enabled
      if (isDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        if (body) {
          body.classList.add('dark');
          body.setAttribute('data-theme', 'dark');
        }
      }
    };

    window.addEventListener('afterprint', cleanup);

    // 2. Check for Android Native Print Interface (Capacitor Android Native Webview)
    if (
      (window as any).AndroidPrinter &&
      typeof (window as any).AndroidPrinter.printPage === 'function'
    ) {
      try {
        setTimeout(() => {
          (window as any).AndroidPrinter.printPage(jobName);
        }, 150);

        // Keep light mode and print classes active for 10s to allow Android Print Spooler to render
        setTimeout(() => {
          cleanup();
        }, 10000);
        return;
      } catch (e) {
        console.warn('AndroidPrinter call failed, falling back to window.print():', e);
      }
    }

    // 3. Standard Web Browser Fallback (Chrome, Safari, Firefox, Edge)
    try {
      setTimeout(() => {
        window.print();
      }, 150);
    } catch (err) {
      console.error('window.print() error:', err);
    } finally {
      // 8-second safety fallback cleanup
      setTimeout(() => {
        cleanup();
      }, 8000);
    }
  }
}
