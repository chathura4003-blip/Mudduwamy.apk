/**
 * User-Specific Notification Settings Manager for Sri Sumana Maha Pirivena ERP
 * Manages persisted Sound and Vibration preferences for Teacher and Student accounts.
 * Defaults: Sound = OFF (false), Vibration = OFF (false)
 */

export interface UserNotificationSettings {
  sound: boolean;
  vibration: boolean;
  chatNotifications: boolean;
}

const DEFAULT_SETTINGS: UserNotificationSettings = {
  sound: false,
  vibration: false,
  chatNotifications: true,
};

function getStorageKey(userId?: string): string {
  if (userId) return `pirivena_notification_settings_${userId}`;
  try {
    const rawUser = localStorage.getItem('pirivena_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u?.id) return `pirivena_notification_settings_${u.id}`;
    }
  } catch {}
  return 'pirivena_notification_settings_default';
}

/**
 * Get notification settings for a specific user (or currently active user)
 */
export function getUserNotificationSettings(userId?: string): UserNotificationSettings {
  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        sound: Boolean(parsed.sound),
        vibration: Boolean(parsed.vibration),
        chatNotifications:
          parsed.chatNotifications !== undefined ? Boolean(parsed.chatNotifications) : true,
      };
    }
  } catch (e) {
    console.warn('Failed to load user notification settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save notification settings for a specific user
 */
export function saveUserNotificationSettings(
  userId: string,
  settings: Partial<UserNotificationSettings>
): UserNotificationSettings {
  try {
    const current = getUserNotificationSettings(userId);
    const updated: UserNotificationSettings = {
      sound: settings.sound !== undefined ? settings.sound : current.sound,
      vibration: settings.vibration !== undefined ? settings.vibration : current.vibration,
      chatNotifications:
        settings.chatNotifications !== undefined
          ? settings.chatNotifications
          : current.chatNotifications,
    };
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));

    // Dispatch event so active views & service update in real-time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('user-notification-settings-changed', {
          detail: { userId, settings: updated },
        })
      );
    }
    return updated;
  } catch (e) {
    console.warn('Failed to save user notification settings:', e);
    return { ...DEFAULT_SETTINGS, ...settings };
  }
}
