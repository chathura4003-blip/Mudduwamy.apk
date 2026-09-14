import type { User } from '../types';

export const ONESIGNAL_APP_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ONESIGNAL_APP_ID) ||
  'd86127b5-1ef0-4f3e-86f2-66a5f211f30d';

class OneSignalService {
  private isInitialized = false;
  private webInitSucceeded = false;
  private currentUser: User | null = null;
  private lastSetUserId: string | null = null;

  public isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).plugins?.OneSignal ||
      (window as any).OneSignal ||
      (window as any).OneSignalDeferred ||
      (window as any).Capacitor?.isNativePlatform?.()
    );
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // 1. Check for Native Cordova / Capacitor OneSignal Plugin
      const nativeOneSignal = (window as any).plugins?.OneSignal || (window as any).OneSignal;

      if (nativeOneSignal && typeof nativeOneSignal.initialize === 'function') {
        this.setupNativeOneSignal(nativeOneSignal);
        this.isInitialized = true;
        return;
      }

      // If native environment, wait for deviceready and never load web push SDK
      const isNative =
        (window as any).cordova ||
        (window as any).Capacitor?.isNativePlatform?.() ||
        window.location.protocol === 'capacitor:' ||
        window.location.protocol === 'file:';

      if (isNative) {
        document.addEventListener(
          'deviceready',
          () => {
            const os = (window as any).plugins?.OneSignal || (window as any).OneSignal;
            if (os && typeof os.initialize === 'function') {
              this.setupNativeOneSignal(os);
              this.isInitialized = true;
              if (this.currentUser) {
                this.setUser(this.currentUser);
              }
            }
          },
          { once: true }
        );
        return;
      }

      // 2. Web Fallback (OneSignal Web SDK v16) - for Web browsers only
      this.setupWebOneSignal();
      this.isInitialized = true;
    } catch (e) {
      console.warn('OneSignal initialization error (fallback):', e);
    }
  }

  private setupNativeOneSignal(OneSignal: any) {
    console.log('🔔 Initializing Native OneSignal with App ID:', ONESIGNAL_APP_ID);
    OneSignal.initialize(ONESIGNAL_APP_ID);

    // Request Push Notification Permission (Android 13+)
    try {
      if (OneSignal.Notifications?.requestPermission) {
        OneSignal.Notifications.requestPermission(true).then((accepted: boolean) => {
          console.log('🔔 Push Notification Permission Status:', accepted);
        });
      }
    } catch (permErr) {
      console.warn('OneSignal requestPermission error:', permErr);
    }

    // Foreground Notification Handler
    try {
      if (OneSignal.Notifications?.addEventListener) {
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
          console.log('🔔 OneSignal Notification received in foreground:', event);
          try {
            // In OneSignal v5, event.getNotification() returns the notification object
            const notification = event?.getNotification ? event.getNotification() : event?.notification;
            if (notification) {
              // Notification will automatically display banner
            }
          } catch (e) {}
        });

        // Notification Click Handler (Deep linking)
        OneSignal.Notifications.addEventListener('click', (event: any) => {
          console.log('🔔 Notification Clicked:', event);
          this.handleNotificationPayload(event?.notification?.additionalData || event?.notification?.data);
        });
      }
    } catch (listenerErr) {
      console.warn('OneSignal addEventListener error:', listenerErr);
    }
  }

  public isNativeEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).Capacitor?.isNativePlatform?.() ||
      (window as any).cordova ||
      (window as any).plugins?.OneSignal ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:' ||
      navigator.userAgent.includes('wv') ||
      navigator.userAgent.includes('Capacitor')
    );
  }

  private setupWebOneSignal() {
    try {
      if (typeof window === 'undefined') return;

      // Strictly never load Web SDK inside native Android APK
      if (this.isNativeEnvironment()) {
        return;
      }

      // Only attempt Web push on secure origins with serviceWorker & Notification support
      const isPushCapable =
        'Notification' in window &&
        'serviceWorker' in navigator &&
        (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (!isPushCapable) {
        return;
      }

      // Load OneSignal Web SDK script dynamically if not present
      if (!document.getElementById('onesignal-web-sdk')) {
        const script = document.createElement('script');
        script.id = 'onesignal-web-sdk';
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.defer = true;
        document.head.appendChild(script);
      }

      (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
      (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          if (!OneSignal || typeof OneSignal.init !== 'function') return;
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
              enable: false,
            },
          });
          this.webInitSucceeded = true;

          if (OneSignal.Notifications?.addEventListener) {
            OneSignal.Notifications.addEventListener('click', (event: any) => {
              console.log('🔔 Web Notification Clicked:', event);
              this.handleNotificationPayload(event?.notification?.additionalData || event?.notification?.data);
            });
          }
        } catch (initErr: any) {
          this.webInitSucceeded = false;
          console.warn('OneSignal Web SDK init notice (handled):', initErr?.message || initErr);
        }
      });
    } catch (e) {
      console.warn('Failed to load OneSignal Web SDK:', e);
    }
  }

  private handleNotificationPayload(additionalData: any) {
    if (!additionalData) return;
    try {
      if (additionalData.action === 'open_chat' || additionalData.roomId) {
        window.dispatchEvent(new CustomEvent('open-pirivena-chat', { detail: additionalData }));
      } else if (additionalData.action === 'open_material' || additionalData.materialId) {
        window.dispatchEvent(new CustomEvent('open-study-material', { detail: additionalData }));
      } else if (additionalData.action === 'open_exam' || additionalData.examId) {
        window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: 'exams' }));
        window.dispatchEvent(new CustomEvent('open-exam-detail', { detail: additionalData }));
      } else if (additionalData.action === 'open_results' || additionalData.submissionId) {
        window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: 'results' }));
        window.dispatchEvent(new CustomEvent('open-submission-review', { detail: additionalData }));
      } else if (additionalData.action === 'open_circular' || additionalData.circularId || additionalData.noticeId) {
        window.dispatchEvent(new CustomEvent('open-circular-notice', { detail: additionalData }));
      } else if (additionalData.action === 'open_timetable') {
        window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: 'timetable' }));
      } else if (additionalData.action === 'open_admission' || additionalData.action === 'open_donation') {
        window.dispatchEvent(new CustomEvent('switch-portal-subtab', { detail: 'admissions' }));
      } else if (additionalData.action === 'open_app_update' || additionalData.apkUrl) {
        window.dispatchEvent(new CustomEvent('open-app-update', { detail: additionalData }));
      }
    } catch (e) {
      console.warn('Error handling notification click:', e);
    }
  }

  public async setUser(user: User | null): Promise<void> {
    this.currentUser = user;
    if (typeof window === 'undefined') return;

    try {
      const nativeOneSignal = (window as any).plugins?.OneSignal || (window as any).OneSignal;

      if (user && (user.id || user.customId)) {
        const externalId = String(user.id || user.customId);

        // Avoid re-authenticating same user repeatedly on every render
        if (this.lastSetUserId === externalId) {
          return;
        }
        this.lastSetUserId = externalId;

        console.log('🔔 Setting OneSignal External User ID:', externalId);

        const tags: Record<string, string> = {
          is_logged_in: 'true',
          user_id: externalId,
          userId: externalId,
          external_id: externalId,
          role: user.role || 'student',
          name: user.name || '',
          classId: (user as any).classId || (user as any).gradeClass || 'all',
          portal:
            user.role === 'admin' || user.role === 'superadmin'
              ? 'admin'
              : user.role === 'teacher'
              ? 'teacher'
              : 'student',
        };

        // 1. Native Plugin
        if (nativeOneSignal) {
          try {
            if (nativeOneSignal.User?.pushSubscription?.optIn) {
              nativeOneSignal.User.pushSubscription.optIn();
            }
          } catch (e) {}

          if (typeof nativeOneSignal.login === 'function') {
            nativeOneSignal.login(externalId);
          } else if (typeof nativeOneSignal.setExternalUserId === 'function') {
            nativeOneSignal.setExternalUserId(externalId);
          }

          if (nativeOneSignal.User?.addTags) {
            nativeOneSignal.User.addTags(tags);
          } else if (typeof nativeOneSignal.sendTags === 'function') {
            nativeOneSignal.sendTags(tags);
          }
        }

        // 2. Web SDK (Only invoke if Web SDK successfully initialized)
        if (this.webInitSucceeded && (window as any).OneSignalDeferred) {
          (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
            try {
              if (!OneSignal || !OneSignal.User) return;
              if (typeof OneSignal.login === 'function') {
                try {
                  const p = OneSignal.login(externalId);
                  if (p && typeof p.catch === 'function') {
                    await p.catch(() => {});
                  }
                } catch (_) {}
              }
              if (OneSignal.User?.addTags) {
                try {
                  const p = OneSignal.User.addTags(tags);
                  if (p && typeof p.catch === 'function') {
                    await p.catch(() => {});
                  }
                } catch (_) {}
              }
            } catch (e) {}
          });
        }
      } else {
        this.lastSetUserId = null;
        await this.logout();
      }
    } catch (e) {
      console.warn('OneSignal setUser error:', e);
    }
  }

  public async logout(): Promise<void> {
    this.currentUser = null;
    this.lastSetUserId = null;
    if (typeof window === 'undefined') return;

    try {
      const nativeOneSignal = (window as any).plugins?.OneSignal || (window as any).OneSignal;

      console.log('🔕 OneSignal: Opting out and unlinking user on logout');

      // Native Plugin Logout
      if (nativeOneSignal) {
        try {
          // 1. Opt out from receiving push notifications while logged out
          if (nativeOneSignal.User?.pushSubscription?.optOut) {
            nativeOneSignal.User.pushSubscription.optOut();
          } else if (typeof nativeOneSignal.disablePush === 'function') {
            nativeOneSignal.disablePush(true);
          }

          // 2. Remove all identity tags or mark logged out
          if (nativeOneSignal.User?.removeTags) {
            nativeOneSignal.User.removeTags(['user_id', 'userId', 'external_id', 'role', 'name', 'classId', 'portal']);
            nativeOneSignal.User.addTags({ is_logged_in: 'false' });
          } else if (typeof nativeOneSignal.deleteTags === 'function') {
            nativeOneSignal.deleteTags(['user_id', 'userId', 'external_id', 'role', 'name', 'classId', 'portal']);
            nativeOneSignal.sendTags({ is_logged_in: 'false' });
          }

          // 3. Unlink user identity
          if (typeof nativeOneSignal.logout === 'function') {
            nativeOneSignal.logout();
          } else if (typeof nativeOneSignal.removeExternalUserId === 'function') {
            nativeOneSignal.removeExternalUserId();
          }
        } catch (logoutErr) {
          console.warn('Native OneSignal logout error:', logoutErr);
        }
      }

      // Web SDK Logout (Only invoke if Web SDK successfully initialized)
      if (this.webInitSucceeded && (window as any).OneSignalDeferred) {
        (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
          try {
            if (!OneSignal || !OneSignal.User) return;
            if (OneSignal.User?.pushSubscription?.optOut) {
              const p = OneSignal.User.pushSubscription.optOut();
              if (p && typeof p.catch === 'function') await p.catch(() => {});
            }
            if (OneSignal.User?.removeTags) {
              const p = OneSignal.User.removeTags(['user_id', 'userId', 'external_id', 'role', 'name', 'classId', 'portal']);
              if (p && typeof p.catch === 'function') await p.catch(() => {});
              const p2 = OneSignal.User.addTags({ is_logged_in: 'false' });
              if (p2 && typeof p2.catch === 'function') await p2.catch(() => {});
            }
            if (typeof OneSignal.logout === 'function') {
              const p = OneSignal.logout();
              if (p && typeof p.catch === 'function') await p.catch(() => {});
            }
          } catch (e) {}
        });
      }
    } catch (e) {
      console.warn('OneSignal logout error:', e);
    }
  }
}

export const oneSignalService = new OneSignalService();
