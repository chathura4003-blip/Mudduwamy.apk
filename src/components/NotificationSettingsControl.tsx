import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Vibrate, Bell, Sparkles } from 'lucide-react';
import { triggerHaptic, setHapticFeedbackEnabled } from '../utils/haptics';
import { playNotificationSound } from '../utils/soundHelper';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import {
  getUserNotificationSettings,
  saveUserNotificationSettings,
  type UserNotificationSettings,
} from '../utils/userNotificationSettings';

interface NotificationSettingsControlProps {
  userId?: string;
  className?: string;
}

export const NotificationSettingsControl: React.FC<NotificationSettingsControlProps> = ({
  userId,
  className = '',
}) => {
  const { language } = useLanguage();
  const isSi = language === 'si';
  const toast = useToast();

  const [settings, setSettings] = useState<UserNotificationSettings>(() =>
    getUserNotificationSettings(userId)
  );

  useEffect(() => {
    setSettings(getUserNotificationSettings(userId));

    const handleSettingsChanged = (e: any) => {
      if (!e.detail?.userId || e.detail.userId === userId) {
        setSettings(getUserNotificationSettings(userId));
      }
    };

    window.addEventListener('user-notification-settings-changed', handleSettingsChanged);
    return () => {
      window.removeEventListener('user-notification-settings-changed', handleSettingsChanged);
    };
  }, [userId]);

  const handleToggleSound = () => {
    const nextSound = !settings.sound;
    const updated = saveUserNotificationSettings(userId || 'current', { sound: nextSound });
    setSettings(updated);
    triggerHaptic('light');

    if (nextSound) {
      playNotificationSound();
      toast.success(
        isSi
          ? '🔊 නිවේදන නාදය සක්‍රිය කරන ලදී (Notification Sound ON)'
          : '🔊 Notification Sound ON'
      );
    } else {
      toast.info(
        isSi
          ? '🔕 නිවේදන නාදය අක්‍රිය කරන ලදී (Notification Sound OFF)'
          : '🔕 Notification Sound OFF'
      );
    }
  };

  const handleToggleVibration = () => {
    const nextVibration = !settings.vibration;
    const updated = saveUserNotificationSettings(userId || 'current', { vibration: nextVibration });
    setSettings(updated);
    setHapticFeedbackEnabled(nextVibration);

    if (nextVibration) {
      triggerHaptic('medium', true);
      toast.success(
        isSi
          ? '📳 නිවේදන කම්පනය සක්‍රිය කරන ලදී (Notification Vibration ON)'
          : '📳 Notification Vibration ON'
      );
    } else {
      toast.info(
        isSi
          ? '📴 නිවේදන කම්පනය අක්‍රිය කරන ලදී (Notification Vibration OFF)'
          : '📴 Notification Vibration OFF'
      );
    }
  };

  const handleToggleChat = () => {
    const nextChat = !settings.chatNotifications;
    const updated = saveUserNotificationSettings(userId || 'current', {
      chatNotifications: nextChat,
    });
    setSettings(updated);

    if (nextChat) {
      triggerHaptic('light');
      toast.success(
        isSi
          ? '💬 චැට් පණිවිඩ නිවේදන සක්‍රිය කරන ලදී (Chat Alerts ON)'
          : '💬 Chat Message Alerts ON'
      );
    } else {
      triggerHaptic('light');
      toast.info(
        isSi
          ? '🔕 චැට් පණිවිඩ නිවේදන අක්‍රිය කරන ලදී (Chat Alerts OFF)'
          : '🔕 Chat Message Alerts OFF'
      );
    }
  };

  return (
    <div
      className={`bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-stone-800 pb-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
          <Bell className="w-4.5 h-4.5 animate-icon-bell" />
        </div>
        <div>
          <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>{isSi ? 'නිවේදන සැකසුම්' : 'Notifications'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isSi
              ? 'නිවේදන නාදය, කම්පනය, සහ චැට් පණිවිඩ නිවේදන කළමනාකරණය'
              : 'Configure notification sound, vibration, and chat message alerts'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* 🔊 1. Notification Sound Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200/80 dark:border-stone-700/80 transition-all hover:border-amber-400/40">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                settings.sound
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 shadow-2xs'
                  : 'bg-slate-200/70 dark:bg-stone-700 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-stone-600'
              }`}
            >
              {settings.sound ? (
                <Volume2 className="w-5 h-5 animate-icon-pulse-glow" />
              ) : (
                <VolumeX className="w-5 h-5 opacity-60" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <span>{isSi ? 'නිවේදන නාදය' : 'Notification Sound'}</span>
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {isSi ? 'නිවේදන ලැබෙන විට ශබ්දය වාදනය කරන්න' : 'Receive notification sounds'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={settings.sound}
              onClick={handleToggleSound}
              className={`w-13 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center focus:outline-hidden ${
                settings.sound ? 'bg-amber-600' : 'bg-slate-300 dark:bg-stone-700'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center text-[9px] font-black font-sans ${
                  settings.sound
                    ? 'translate-x-6 text-amber-700'
                    : 'translate-x-0 text-slate-500'
                }`}
              >
                {settings.sound ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* 📳 2. Notification Vibration Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200/80 dark:border-stone-700/80 transition-all hover:border-emerald-400/40">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                settings.vibration
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-2xs'
                  : 'bg-slate-200/70 dark:bg-stone-700 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-stone-600'
              }`}
            >
              <Vibrate className={`w-5 h-5 ${settings.vibration ? 'animate-icon-bounce' : 'opacity-60'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <span>{isSi ? 'නිවේදන කම්පනය' : 'Notification Vibration'}</span>
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {isSi ? 'නිවේදන ලැබෙන විට දුරකථනය කම්පනය කරන්න' : 'Vibrate when notifications arrive'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={settings.vibration}
              onClick={handleToggleVibration}
              className={`w-13 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center focus:outline-hidden ${
                settings.vibration ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-stone-700'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center text-[9px] font-black font-sans ${
                  settings.vibration
                    ? 'translate-x-6 text-emerald-700'
                    : 'translate-x-0 text-slate-500'
                }`}
              >
                {settings.vibration ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* 💬 3. Chat Message Alerts Switch (Separate Toggle) */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-stone-800/60 border border-slate-200/80 dark:border-stone-700/80 transition-all hover:border-blue-400/40">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                settings.chatNotifications
                  ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 shadow-2xs'
                  : 'bg-slate-200/70 dark:bg-stone-700 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-stone-600'
              }`}
            >
              <span className="text-base leading-none">💬</span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-serif font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <span>{isSi ? 'චැට් පණිවිඩ නිවේදන' : 'Chat Message Alerts'}</span>
              </h4>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {isSi ? 'නව චැට් පණිවිඩ ලැබෙන විට Notification පෙන්වන්න' : 'Show alerts for incoming chat messages'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={settings.chatNotifications}
              onClick={handleToggleChat}
              className={`w-13 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer flex items-center focus:outline-hidden ${
                settings.chatNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-stone-700'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out flex items-center justify-center text-[9px] font-black font-sans ${
                  settings.chatNotifications
                    ? 'translate-x-6 text-blue-700'
                    : 'translate-x-0 text-slate-500'
                }`}
              >
                {settings.chatNotifications ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
