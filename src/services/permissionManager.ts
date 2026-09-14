import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { triggerHaptic } from '../utils/haptics';

export interface AppPermissionsStatus {
  notifications: 'granted' | 'denied' | 'prompt' | 'unsupported';
  camera: 'granted' | 'denied' | 'prompt' | 'unsupported';
  isNative: boolean;
}

class PermissionManager {
  /**
   * Check if running on Android/iOS native runtime
   */
  public isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Check all key permissions at once
   */
  public async checkAllPermissions(): Promise<AppPermissionsStatus> {
    const isNat = this.isNative();

    let notifStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';
    let camStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';

    // 1. Check Notifications
    try {
      if (isNat && Capacitor.isPluginAvailable('LocalNotifications')) {
        const res = await LocalNotifications.checkPermissions();
        notifStatus = res.display === 'granted' ? 'granted' : res.display === 'denied' ? 'denied' : 'prompt';
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = Notification.permission;
        notifStatus = perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : 'prompt';
      } else {
        notifStatus = 'unsupported';
      }
    } catch (e) {
      notifStatus = 'prompt';
    }

    // 2. Check Camera
    try {
      const capCamera = (window as any)?.Capacitor?.Plugins?.Camera;
      if (isNat && capCamera && typeof capCamera.checkPermissions === 'function') {
        const camRes = await capCamera.checkPermissions();
        camStatus = camRes.camera === 'granted' ? 'granted' : camRes.camera === 'denied' ? 'denied' : 'prompt';
      } else if (typeof navigator !== 'undefined' && navigator.permissions && typeof (navigator.permissions as any).query === 'function') {
        try {
          const p = await (navigator.permissions as any).query({ name: 'camera' });
          camStatus = p.state === 'granted' ? 'granted' : p.state === 'denied' ? 'denied' : 'prompt';
        } catch {
          camStatus = 'prompt';
        }
      } else {
        camStatus = 'prompt';
      }
    } catch (e) {
      camStatus = 'prompt';
    }

    return {
      notifications: notifStatus,
      camera: camStatus,
      isNative: isNat,
    };
  }

  /**
   * Request Notification Permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    triggerHaptic('light');
    try {
      if (this.isNative() && Capacitor.isPluginAvailable('LocalNotifications')) {
        const res = await LocalNotifications.requestPermissions();
        return res.display === 'granted';
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        const res = await Notification.requestPermission();
        return res === 'granted';
      }
    } catch (e) {
      console.info('[PermissionManager] Notification permission request ended:', e);
    }
    return false;
  }

  /**
   * Request Camera Permission
   */
  public async requestCameraPermission(): Promise<boolean> {
    triggerHaptic('light');
    try {
      const capCamera = (window as any)?.Capacitor?.Plugins?.Camera;
      if (this.isNative() && capCamera && typeof capCamera.requestPermissions === 'function') {
        const res = await capCamera.requestPermissions({ permissions: ['camera'] });
        return res.camera === 'granted';
      }

      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop());
          return true;
        } catch (mediaErr: any) {
          // Handled gracefully: NotAllowedError, NotFoundError (no webcam), etc.
          if (mediaErr?.name === 'NotAllowedError' || mediaErr?.name === 'PermissionDeniedError') {
            console.info('[PermissionManager] Camera permission dismissed or blocked by user.');
          } else if (mediaErr?.name === 'NotFoundError' || mediaErr?.name === 'DevicesNotFoundError') {
            console.info('[PermissionManager] No video input device (camera) found on this system.');
          } else {
            console.info('[PermissionManager] Camera access not available:', mediaErr?.name || mediaErr);
          }
          return false;
        }
      }
    } catch (e) {
      console.info('[PermissionManager] Camera permission request ended:', e);
    }
    return false;
  }
}

export const permissionManager = new PermissionManager();
