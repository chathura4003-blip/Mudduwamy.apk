import React from 'react';
import { RefreshCw, FolderOpen, Inbox, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { useLanguage } from '../context/LanguageContext';

export interface EmptyStateProps {
  title?: string;
  titleSi?: string;
  description?: string;
  descriptionSi?: string;
  icon?: React.FC<{ className?: string }>;
  iconBg?: string;
  actionText?: string;
  actionTextSi?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Items Found',
  titleSi = 'දත්ත කිසිවක් හමු නොවීය',
  description = 'There are currently no items available to display.',
  descriptionSi = 'මෙම අංශයේ ප්‍රදර්ශනය කිරීමට මේ මොහොතේ දත්ත කිසිවක් නොමැත.',
  icon: Icon = Inbox,
  iconBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  actionText = 'Refresh',
  actionTextSi = 'නැවත පූරණය කරන්න',
  onAction,
  isLoading = false,
}) => {
  const { language } = useLanguage();
  const isSi = language === 'si';

  const handleActionClick = () => {
    triggerHaptic('medium');
    if (onAction) {
      onAction();
    } else {
      window.dispatchEvent(new CustomEvent('refresh-portal-data'));
    }
  };

  return (
    <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center animate-fade-in select-none">
      <div className="relative mb-4">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-amber-500/15 dark:bg-amber-500/10 rounded-3xl blur-xl" />

        {/* Icon Emblem */}
        <div
          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center border shadow-md ${iconBg}`}
        >
          <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
      </div>

      {/* Title */}
      <h3 className="font-serif font-black text-base sm:text-lg text-slate-800 dark:text-stone-100 mb-1.5 tracking-tight">
        {isSi ? titleSi : title}
      </h3>

      {/* Description */}
      <p className="font-sans text-xs sm:text-sm text-slate-500 dark:text-stone-400 max-w-sm mb-5 leading-relaxed font-medium">
        {isSi ? descriptionSi : description}
      </p>

      {/* Action / Refresh Button */}
      <button
        onClick={handleActionClick}
        disabled={isLoading}
        className="px-5 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-md shadow-amber-500/20 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95 border border-amber-400/40"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{isSi ? actionTextSi : actionText}</span>
      </button>
    </div>
  );
};
