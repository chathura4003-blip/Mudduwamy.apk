import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater, BundleInfo } from '@capgo/capacitor-updater';
import { settingsApi } from '../api';
import {
  CURRENT_APP_VERSION,
  compareSemanticVersions,
  setActiveAppVersion,
  resolveDownloadUrl,
} from '../utils/appVersion';

export interface LiveUpdateProgress {
  percent: number;
  status: 'idle' | 'checking' | 'downloading' | 'ready' | 'error';
  version?: string;
  error?: string;
}

type ProgressListener = (progress: LiveUpdateProgress) => void;

class LiveUpdateService {
  private isInitialized = false;
  private currentBundle: BundleInfo | null = null;
  private listeners: Set<ProgressListener> = new Set();
  private activeUpdatePromise: Promise<BundleInfo | null> | null = null;
  private currentProgress: LiveUpdateProgress = {
    percent: 0,
    status: 'idle',
  };

  public isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized || !this.isAvailable()) return;

    try {
      // 1. Notify that current app bundle loaded successfully (prevents automatic rollback)
      await CapacitorUpdater.notifyAppReady();
      const currentRes = await CapacitorUpdater.current();
      this.currentBundle = (currentRes as any)?.bundle || null;
      if (this.currentBundle?.version) {
        setActiveAppVersion(this.currentBundle.version);
      }
      console.log('🚀 Capgo LiveUpdater initialized. Current bundle:', currentRes);

      // 2. Listen to download progress events
      await CapacitorUpdater.addListener('download', (info: any) => {
        const percent = Math.min(100, Math.max(0, Math.round(info?.percent || 0)));
        this.updateProgress({
          percent,
          status: percent >= 100 ? 'ready' : 'downloading',
        });
      });

      this.isInitialized = true;
    } catch (err) {
      console.warn('Capgo LiveUpdater init warning:', err);
    }
  }

  public subscribe(listener: ProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.currentProgress);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getProgress(): LiveUpdateProgress {
    return this.currentProgress;
  }

  private updateProgress(update: Partial<LiveUpdateProgress>) {
    this.currentProgress = { ...this.currentProgress, ...update };
    this.listeners.forEach((fn) => fn(this.currentProgress));
  }

  /**
   * Check if a live update bundle is available on server and download/apply it.
   * Uses singleton promise concurrency lock to prevent duplicate overlapping downloads.
   */
  public async checkForLiveUpdate(options?: { autoApply?: boolean; force?: boolean }): Promise<BundleInfo | null> {
    if (!this.isAvailable()) return null;

    if (this.activeUpdatePromise) {
      console.log('Live update already in progress, sharing active promise');
      return this.activeUpdatePromise;
    }

    this.activeUpdatePromise = (async () => {
      try {
        this.updateProgress({ status: 'checking', percent: 0 });

        const settings = await settingsApi.getSiteSettings();
        if (!settings) {
          this.updateProgress({ status: 'idle' });
          return null;
        }

        // Check server live update bundle URL and version
        const serverOtaVersion = String((settings as any).liveUpdateVersion || (settings as any).appLatestVersion || '').trim();
        const rawOtaUrl = String((settings as any).liveUpdateZipUrl || (settings as any).appOtaZipUrl || '').trim();
        const currentVersion = String(this.currentBundle?.version || CURRENT_APP_VERSION).trim();

        if (!rawOtaUrl || !serverOtaVersion) {
          this.updateProgress({ status: 'idle' });
          return null;
        }

        // Resolve relative path or Google Drive link to absolute direct HTTPS URL
        const otaBundleUrl = resolveDownloadUrl(rawOtaUrl);

        // Check if server has newer semantic version or version string mismatch
        const isNewer = compareSemanticVersions(serverOtaVersion, currentVersion) > 0;
        const isDifferent = serverOtaVersion.replace(/^v/i, '') !== currentVersion.replace(/^v/i, '');
        const shouldUpdate = isNewer || (isDifferent && options?.force) || Boolean(options?.force);

        if (shouldUpdate) {
          console.log(`✨ New OTA Live Update available: ${serverOtaVersion} (installed: ${currentVersion}) from ${otaBundleUrl}`);
          this.updateProgress({
            status: 'downloading',
            percent: 10,
            version: serverOtaVersion,
          });

          // Download the web bundle zip via Capgo LiveUpdater
          const bundle = await CapacitorUpdater.download({
            url: otaBundleUrl,
            version: serverOtaVersion,
          });

          console.log('✓ OTA bundle downloaded successfully:', bundle);

          // Apply bundle for next launch or instant reload
          await CapacitorUpdater.set(bundle);
          setActiveAppVersion(serverOtaVersion);

          this.updateProgress({
            status: 'ready',
            percent: 100,
            version: serverOtaVersion,
          });

          const shouldAutoApply = options?.autoApply ?? isAutoLiveUpdateEnabled();
          if (shouldAutoApply) {
            await this.restartApp();
          }

          return bundle;
        } else {
          if (serverOtaVersion) {
            setActiveAppVersion(serverOtaVersion);
          }
          this.updateProgress({ status: 'idle', percent: 100 });
          return null;
        }
      } catch (err: any) {
        console.warn('OTA Live Update check failed:', err);
        this.updateProgress({
          status: 'error',
          error: err?.message || 'Update check failed',
        });
        return null;
      } finally {
        this.activeUpdatePromise = null;
      }
    })();

    return this.activeUpdatePromise;
  }

  public isCriticalActionActive(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      if (sessionStorage.getItem('pirivena_exam_active') === 'true') return true;
      if (sessionStorage.getItem('pirivena_upload_active') === 'true') return true;
    } catch (_) {}
    return false;
  }

  /**
   * Instantly reloads the application to activate the newly downloaded live update bundle
   * Guaranteed not to interrupt active exams or ongoing uploads.
   */
  public async restartApp(): Promise<void> {
    if (this.isCriticalActionActive()) {
      console.log('⏸️ Live update restart deferred: Student is taking an exam or upload is active.');
      return;
    }
    try {
      if (this.isAvailable()) {
        await CapacitorUpdater.reload();
      } else {
        window.location.reload();
      }
    } catch (err) {
      window.location.reload();
    }
  }

  /**
   * Reset to native bundle built into the APK
   */
  public async resetToBuiltin(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await CapacitorUpdater.reset();
      await this.restartApp();
    } catch (err) {
      console.warn('Failed to reset to builtin bundle:', err);
    }
  }
}

export function isAutoLiveUpdateEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem('pirivena_auto_live_update');
    return val !== 'false'; // Default enabled (true)
  } catch {
    return true;
  }
}

export function setAutoLiveUpdateEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('pirivena_auto_live_update', enabled ? 'true' : 'false');
    window.dispatchEvent(
      new CustomEvent('auto-update-setting-changed', { detail: { enabled } })
    );
  } catch {}
}

export const liveUpdateService = new LiveUpdateService();
