// Suppress third-party browser extension & external SDK non-critical errors (e.g. IDM M_ID, OneSignal LoginManager Qe)
if (typeof window !== 'undefined') {
  const isIgnoredError = (msg: string, stack: string) =>
    msg.includes('M_ID') ||
    msg.includes("reading 'M_ID'") ||
    msg.includes("reading 'Qe'") ||
    msg.includes('LoginManager') ||
    msg.includes('Qe') ||
    stack.includes('OneSignal') ||
    stack.includes('LoginManager') ||
    stack.includes('200.js') ||
    stack.includes('chrome-extension');

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    const stack = reason?.stack || '';
    if (isIgnoredError(msg, stack)) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    const stack = event.error?.stack || '';
    if (isIgnoredError(msg, stack)) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
    }
  });
}

// Ensure window.fetch has a setter in iframe environments to avoid getter-only assignment errors
if (typeof window !== 'undefined' && window.fetch) {
  try {
    let currentFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get: () => currentFetch,
      set: (val) => {
        currentFetch = val;
      },
      configurable: true,
      enumerable: true,
    });
  } catch (e) {
    // Ignore if already patched or non-configurable
  }
}

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);
