import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => (
  <div
    className={`bg-slate-200/80 dark:bg-stone-800/80 rounded-xl animate-pulse ${className}`}
  />
);

/**
 * 🌟 1. Dashboard Skeleton Loader
 */
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 w-full animate-fade-in select-none">
    {/* Header Skeleton */}
    <div className="bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-2.5 w-full sm:w-1/2">
        <SkeletonBox className="h-6 w-3/4 rounded-xl" />
        <SkeletonBox className="h-4 w-1/2 rounded-lg" />
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <SkeletonBox className="h-10 w-28 rounded-2xl" />
        <SkeletonBox className="h-10 w-28 rounded-2xl" />
      </div>
    </div>

    {/* 4 Stat Cards Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 rounded-3xl p-5 shadow-xs space-y-3"
        >
          <div className="flex justify-between items-center">
            <SkeletonBox className="w-10 h-10 rounded-2xl" />
            <SkeletonBox className="w-12 h-5 rounded-full" />
          </div>
          <SkeletonBox className="h-7 w-20 rounded-lg" />
          <SkeletonBox className="h-3.5 w-28 rounded-md" />
        </div>
      ))}
    </div>

    {/* Two Main Sections Grid Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-stone-800">
          <SkeletonBox className="h-5 w-40 rounded-lg" />
          <SkeletonBox className="h-8 w-20 rounded-xl" />
        </div>
        <ListSkeleton count={4} />
      </div>
      <div className="bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <SkeletonBox className="h-5 w-32 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-800/50 border border-slate-100 dark:border-stone-750 space-y-2"
            >
              <SkeletonBox className="h-4 w-full rounded-md" />
              <SkeletonBox className="h-3 w-3/4 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * 🃏 2. Card Skeleton Loader (Individual & Grid)
 */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full animate-fade-in select-none">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBox className="w-10 h-10 rounded-2xl" />
            <SkeletonBox className="w-16 h-5 rounded-full" />
          </div>
          <SkeletonBox className="h-5 w-3/4 rounded-lg" />
          <SkeletonBox className="h-3.5 w-full rounded-md" />
          <SkeletonBox className="h-3.5 w-2/3 rounded-md" />
        </div>
        <div className="pt-3 border-t border-slate-100 dark:border-stone-800 flex justify-between items-center gap-2">
          <SkeletonBox className="h-8 w-20 rounded-xl" />
          <SkeletonBox className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * 📋 3. List Item Skeleton Loader
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3 w-full animate-fade-in select-none">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 shadow-2xs flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <SkeletonBox className="w-10 h-10 rounded-2xl shrink-0" />
          <div className="space-y-1.5 min-w-0 flex-1">
            <SkeletonBox className="h-4 w-3/5 rounded-md" />
            <SkeletonBox className="h-3 w-2/5 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SkeletonBox className="w-14 h-6 rounded-full" />
          <SkeletonBox className="w-8 h-8 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * 👤 4. Profile / Student Card Skeleton Loader
 */
export const ProfileSkeleton: React.FC = () => (
  <div className="space-y-6 w-full animate-fade-in select-none">
    {/* Profile Card Banner */}
    <div className="bg-slate-900 dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        <SkeletonBox className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shrink-0 border-2 border-slate-700" />
        <div className="space-y-2.5 text-center sm:text-left flex-1 w-full">
          <SkeletonBox className="h-6 w-1/2 mx-auto sm:mx-0 rounded-lg" />
          <SkeletonBox className="h-4 w-1/3 mx-auto sm:mx-0 rounded-md" />
          <div className="flex justify-center sm:justify-start gap-2 pt-2">
            <SkeletonBox className="h-6 w-20 rounded-full" />
            <SkeletonBox className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>

    {/* Profile Info Details Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 rounded-3xl p-5 shadow-xs space-y-2"
        >
          <SkeletonBox className="h-3 w-1/3 rounded-md" />
          <SkeletonBox className="h-5 w-2/3 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * 📊 5. Table Skeleton Loader
 */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <div className="w-full bg-white dark:bg-stone-900 border border-slate-200/80 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs animate-fade-in select-none">
    {/* Table Header */}
    <div className="p-4 bg-slate-50 dark:bg-stone-800/70 border-b border-slate-200 dark:border-stone-750 flex items-center justify-between gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBox key={i} className="h-4 w-1/4 rounded-md" />
      ))}
    </div>
    {/* Table Rows */}
    <div className="divide-y divide-slate-100 dark:divide-stone-800">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 flex items-center justify-between gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBox key={c} className="h-4 w-1/4 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  </div>
);
