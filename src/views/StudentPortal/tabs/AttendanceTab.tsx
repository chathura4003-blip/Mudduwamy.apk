import React from 'react';
import { UserCheck, CheckCircle2, Calendar, Clock, AlertCircle } from 'lucide-react';

interface AttendanceTabProps {
  isSi: boolean;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ isSi }) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4 animate-fade-in select-none">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-2xs font-bold">
            <UserCheck className="w-5 h-5 animate-icon-bounce" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-serif font-black text-slate-900 dark:text-white">
              {isSi ? 'ශිෂ්‍ය පැමිණීමේ වාර්තාව' : 'Student Attendance Record'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isSi ? 'වත්මන් අධ්‍යයන වාරයේ දෛනික පැමිණීමේ ප්‍රගතිය' : 'Academic term daily attendance analytics'}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-gradient-to-br from-emerald-50/90 to-teal-50/40 dark:from-emerald-950/40 dark:to-stone-850 border border-emerald-300/80 dark:border-emerald-800/60 rounded-2xl text-center space-y-1 shadow-2xs">
          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider">
            {isSi ? 'පැමිණීමේ ප්‍රතිශතය' : 'Attendance Rate'}
          </span>
          <p className="text-2xl font-mono font-black text-emerald-700 dark:text-emerald-300">96.5%</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-stone-850 border border-slate-200/90 dark:border-stone-700/80 rounded-2xl text-center space-y-1 shadow-2xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{isSi ? 'මුළු පාසල් දින' : 'Total Days'}</span>
          <p className="text-2xl font-mono font-black text-slate-900 dark:text-white">120</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-stone-850 border border-slate-200/90 dark:border-stone-700/80 rounded-2xl text-center space-y-1 shadow-2xs">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{isSi ? 'පැමිණි දින ගණන' : 'Present'}</span>
          <p className="text-2xl font-mono font-black text-teal-600 dark:text-teal-400">116</p>
        </div>

        <div className="p-4 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 rounded-2xl text-center space-y-1 shadow-2xs">
          <span className="text-[10px] text-rose-800 dark:text-rose-300 font-bold uppercase tracking-wider">{isSi ? 'නිවාඩු දින' : 'Absent'}</span>
          <p className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">4</p>
        </div>
      </div>
    </div>
  );
};
