import React from 'react';

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'amber' | 'stone' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: keyof JSX.IntrinsicElements;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  padding = 'md',
  as: Component = 'div',
}) => {
  const variantClass = {
    default:
      'bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 text-slate-900 dark:text-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]',
    amber:
      'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-stone-900 dark:to-stone-900 border border-amber-500/30 text-amber-950 dark:text-amber-100 shadow-xs',
    stone:
      'bg-stone-100/80 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100',
    outline:
      'bg-transparent border border-slate-200 dark:border-stone-800 text-slate-800 dark:text-slate-200',
  }[variant];

  const paddingClass = {
    none: '',
    sm: 'p-2.5 sm:p-3',
    md: 'p-3.5 sm:p-5',
    lg: 'p-4 sm:p-6',
  }[padding];

  const interactiveClass = onClick
    ? 'cursor-pointer active:scale-[0.985] transition-transform select-none touch-manipulation'
    : '';

  return (
    <Component
      onClick={onClick}
      className={`rounded-2xl sm:rounded-3xl overflow-hidden ${variantClass} ${paddingClass} ${interactiveClass} ${className}`}
    >
      {children}
    </Component>
  );
};
