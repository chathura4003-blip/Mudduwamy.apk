/**
 * Notification Service for Sri Sumana Maha Pirivena ERP
 * Manages Native Android Local Notifications, Android 13+ runtime permissions,
 * Lock Screen Heads-Up Channels, and Chat Deep-Linking.
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { triggerHaptic } from '../utils/haptics';
import { playNotificationSound } from '../utils/soundHelper';
import { getUserNotificationSettings } from '../utils/userNotificationSettings';

export interface LocalNotificationPayload {
  id?: number;
  stableKey?: string;
  title: string;
  body: string;
  channelId?: 'pirivena_announcements' | 'pirivena_chat_channel';
  sound?: boolean;
  extra?: Record<string, any>;
  scheduleAt?: Date;
}

class NotificationService {
  private deliveredKeys: Set<string> = new Set();
  private hasRequestedPermission = false;
  private isListenersInitialized = false;

  public isNative(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications');
  }

  /**
   * Initialize Android Notification Channels with High Importance (Heads-up)
   * and Public Lock Screen visibility for Android 8 - 15.
   */
  public async initializeChannels(): Promise<void> {
    if (!this.isNative()) return;
    try {
      // 1. Announcements Channel
      await LocalNotifications.createChannel({
        id: 'pirivena_announcements',
        name: 'පිරිවෙන් නිවේදන (Pirivena Announcements)',
        description: 'විභාග, පැමිණීම් සහ අධ්‍යයන නිවේදන සඳහා',
        importance: 4, // High importance (Heads-up banner & Lock Screen)
        visibility: 1, // VISIBILITY_PUBLIC (Shows on Lock Screen)
        sound: 'res_custom_notification.wav',
        vibration: true,
        lights: true,
        lightColor: '#D97706',
      });

      // 2. Real-Time Chat & Messages Channel
      await LocalNotifications.createChannel({
        id: 'pirivena_chat_channel',
        name: 'පිරිවෙන් පණිවිඩ (Pirivena Chat Messages)',
        description: 'ගුරු-සිසු සජීවී පණිවිඩ සහ සාකච්ඡා සඳහා',
        importance: 4, // High importance (Heads-up banner & Lock Screen)
        visibility: 1, // VISIBILITY_PUBLIC (Shows on Lock Screen)
        sound: 'res_custom_notification.wav',
        vibration: true,
        lights: true,
        lightColor: '#F59E0B',
      });
    } catch (e) {
      console.warn('Failed to create notification channels:', e);
    }
  }

  /**
   * Setup Action Listeners for tapping on notifications (Deep-Linking)
   */
  public setupNotificationListeners(): void {
    if (!this.isNative() || this.isListenersInitialized) return;
    this.isListenersInitialized = true;

    try {
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const extra = action.notification.extra;
        if (extra?.type === 'chat_message') {
          // Dispatch event to open chat room directly
          window.dispatchEvent(
            new CustomEvent('open-pirivena-chat', {
              detail: {
                roomId: extra.roomId || 'general',
                senderId: extra.senderId,
                senderName: extra.senderName,
              },
            })
          );
        }
      });
    } catch (e) {
      console.warn('Failed to register notification action listeners:', e);
    }
  }

  /**
   * Check current native notification permission status
   */
  public async getPermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unsupported' | string> {
    if (!this.isNative()) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission as any;
      }
      return 'unsupported';
    }

    try {
      const status: PermissionStatus = await LocalNotifications.checkPermissions();
      return status.display;
    } catch (err) {
      console.warn('Failed to check native notification permission:', err);
      return 'unsupported';
    }
  }

  /**
   * Request Android 13+ POST_NOTIFICATIONS runtime permission
   */
  public async requestPermission(): Promise<boolean> {
    this.hasRequestedPermission = true;

    if (this.isNative()) {
      try {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } catch (err) {
        console.warn('Native notification permission request failed:', err);
        return false;
      }
    }

    // Web fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch (e) {
        return false;
      }
    }

    return false;
  }

  /**
   * Trigger or schedule a local notification with deduplication & lock screen support.
   * Strictly blocked if no authenticated user session exists.
   */
  public async scheduleNotification(payload: LocalNotificationPayload): Promise<boolean> {
    // 0. Strict session guard: Only deliver notifications when a user is actively authenticated
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('pirivena_token');
        const savedUser = localStorage.getItem('pirivena_user');
        if (!token || !savedUser) {
          console.log('🔕 Dropping notification because user is currently logged out.');
          return false;
        }
      } catch (e) {
        return false;
      }
    }

    const {
      title,
      body,
      stableKey,
      sound = true,
      scheduleAt,
      channelId = 'pirivena_announcements',
      extra,
    } = payload;

    // 1. Deduplication check
    if (stableKey) {
      if (this.deliveredKeys.has(stableKey)) {
        return false; // Already delivered
      }
      if (this.deliveredKeys.size > 200) {
        const firstKey = this.deliveredKeys.values().next().value;
        if (firstKey) this.deliveredKeys.delete(firstKey);
      }
      this.deliveredKeys.add(stableKey);
    }

    // 2. User-Specific Sound & Vibration Settings Check
    const userSettings = getUserNotificationSettings();
    if (userSettings.sound && sound !== false) {
      playNotificationSound();
    }
    if (userSettings.vibration) {
      triggerHaptic('medium');
    }

    // 3. Native Capacitor Local Notification (Android Heads-up & Lock Screen)
    if (this.isNative()) {
      try {
        const permission = await this.getPermissionStatus();
        if (permission === 'granted') {
          const numericId = payload.id || Math.floor(Math.random() * 1000000);
          await LocalNotifications.schedule({
            notifications: [
              {
                id: numericId,
                title,
                body,
                channelId,
                schedule: scheduleAt ? { at: scheduleAt } : undefined,
                extra: extra || {},
                smallIcon: 'ic_launcher',
                iconColor: '#D97706',
              },
            ],
          });
          return true;
        }
      } catch (err) {
        console.warn('Failed to schedule native local notification:', err);
      }
    }

    return true;
  }

  /**
   * Clear deduplication cache & cancel all delivered/pending notifications (e.g., on logout)
   */
  public async clearDeliveredKeys() {
    this.deliveredKeys.clear();
    if (this.isNative()) {
      try {
        await LocalNotifications.removeAllDeliveredNotifications();
        const pending = await LocalNotifications.getPending();
        if (pending?.notifications?.length > 0) {
          await LocalNotifications.cancel(pending);
        }
      } catch (e) {
        console.warn('Failed to clear native local notifications:', e);
      }
    }
  }
}

export const notificationService = new NotificationService();
