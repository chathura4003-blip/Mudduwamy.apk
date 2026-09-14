import React from 'react';
import { BookOpen, Plus, FileText, Trash2, Award, Percent, Hash } from 'lucide-react';

export interface ReportRow {
  id: string;
  code: string;
  name: string;
  marks: number;
  grade: string;
  date: string;
}

interface ReportCardTableProps {
  reportRows: ReportRow[];
  isLoading: boolean;
  isEditing: boolean;
  isAdminOrTeacher: boolean;
  onRowChange: (id: string, field: keyof ReportRow, val: any) => void;
  onAddRow: () => void;
  onDeleteRow: (id: string) => void;
}

export const ReportCardTable: React.FC<ReportCardTableProps> = ({
  reportRows,
  isLoading,
  isEditing,
  isAdminOrTeacher,
  onRowChange,
  onAddRow,
  onDeleteRow,
}) => {
  const totalScoreSum = reportRows.reduce((sum, r) => sum + r.marks, 0);
  const avgMarks = reportRows.length > 0 ? Math.round(totalScoreSum / reportRows.length) : 0;

  const getGradeBadgeStyle = (g: string) => {
    const gradeUpper = (g || '').toUpperCase();
    if (gradeUpper.includes('A+'))
      return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs';
    if (gradeUpper.includes('A'))
      return 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800 shadow-xs';
    if (gradeUpper.includes('B'))
      return 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800 shadow-xs';
    if (gradeUpper.includes('C'))
      return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 shadow-xs';
    if (gradeUpper.includes('S'))
      return 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800 shadow-xs';
    return 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 shadow-xs';
  };

  const getMarksBadgeColor = (m: number) => {
    if (m >= 75) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800';
    if (m >= 65) return 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-800';
    if (m >= 50) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800';
    if (m >= 35) return 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-800';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800';
  };

  return (
    <div className="bg-white dark:bg-stone-900 border-2 border-amber-500/30 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-lg space-y-4 print-middle-expand flex-1 relative overflow-hidden">
      {/* Header / Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/60 dark:border-stone-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-amber-800 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-serif font-extrabold text-sm sm:text-base text-amber-950 dark:text-amber-100 flex items-center gap-2 tracking-tight">
              <span>විෂයයන් හා ලකුණු සටහන (Academic Scores)</span>
            </h3>
            <span className="text-[10.5px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-sans block">
              සාමාන්‍ය ඇගයීම් හා සාමාර්ථ ප්‍රගති විස්තරය
            </span>
          </div>
        </div>
        {isEditing && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onAddRow}
              className="w-full sm:w-auto px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ නව විෂයයක් එක් කරන්න (Add Row)</span>
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-xs font-bold text-stone-500 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <span>ලකුණු වාර්තාව ලබාගනිමින්... (Loading exam scores...)</span>
        </div>
      ) : reportRows.length === 0 && !isEditing ? (
        <div className="p-8 bg-amber-50/40 dark:bg-stone-950 rounded-2xl border-2 border-dashed border-amber-300 dark:border-stone-800 text-center space-y-2.5">
          <FileText className="w-10 h-10 text-amber-700 mx-auto opacity-70" />
          <h4 className="font-serif font-bold text-amber-950 dark:text-amber-200 text-sm">
            තවම කිසිදු මාර්ගගත පරීක්ෂණ සටහනක් (Online Exam Submission) ලැබී නොමැත
          </h4>
          {isAdminOrTeacher && (
            <button
              onClick={onAddRow}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              + ලකුණු පුවරුවට විෂයයන් අතින් එක් කරන්න (Add Custom Subjects)
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* 📱 1. MOBILE CARDS VIEW (< sm, print:hidden)             */}
          {/* ========================================================= */}
          <div className="block sm:hidden print:hidden space-y-3">
            {reportRows.map((s, idx) => (
              <div
                key={s.id}
                className="bg-stone-50 dark:bg-stone-950/70 border border-amber-200/80 dark:border-stone-800 rounded-2xl p-3.5 shadow-xs space-y-2.5 transition"
              >
                {isEditing ? (
                  /* Mobile Edit Form for this row */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-amber-900 dark:text-amber-400 uppercase">
                        විෂය #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteRow(s.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-bold block">විෂය නාමය (Subject Name):</label>
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => onRowChange(s.id, 'name', e.target.value)}
                        placeholder="උදා: බෞද්ධ ධර්මය හා දර්ශනය"
                        className="w-full p-2 font-bold border border-amber-400 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-stone-500 font-bold block">කේතය:</label>
                        <input
                          type="text"
                          value={s.code}
                          onChange={(e) => onRowChange(s.id, 'code', e.target.value)}
                          placeholder="SIN-01"
                          className="w-full p-2 font-mono font-bold border border-amber-400 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 font-bold block">ලකුණු (%):</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={s.marks}
                          onChange={(e) => onRowChange(s.id, 'marks', Number(e.target.value))}
                          placeholder="85"
                          className="w-full p-2 text-center font-bold border-2 border-amber-500 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 font-bold block">සාමාර්ථය:</label>
                        <input
                          type="text"
                          value={s.grade}
                          onChange={(e) => onRowChange(s.id, 'grade', e.target.value)}
                          placeholder="A+"
                          className="w-full p-2 text-center font-bold border border-amber-400 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mobile Read-Only Card */
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md font-mono font-extrabold text-[10.5px] bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            {s.code || `SUB-${idx + 1}`}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 mt-1 leading-snug">
                          {s.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-100 dark:border-stone-800/80 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">ලකුණු:</span>
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black border ${getMarksBadgeColor(s.marks)}`}>
                          {s.marks}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">සාමාර්ථය:</span>
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border uppercase ${getGradeBadgeStyle(s.grade)}`}>
                          {s.grade}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Mobile Total Average Card */}
            <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-stone-950 text-white rounded-2xl p-4 shadow-md space-y-2 border border-amber-500/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300/80 uppercase font-bold tracking-wider block">
                      Overall Average
                    </span>
                    <span className="font-serif font-bold text-xs text-amber-100">
                      සාමාන්‍ය ලකුණු ප්‍රතිශතය
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-mono font-black text-amber-300">
                    {avgMarks}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-700/50 flex items-center justify-between text-xs">
                <span className="text-amber-200/90 font-medium text-[11px]">සමස්ත ඇගයීම:</span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full font-bold text-[10.5px]">
                  {avgMarks >= 75
                    ? 'විශිෂ්ඨ සාමාර්ථය (Distinction)'
                    : avgMarks >= 50
                      ? 'සාමාන්‍ය සාමාර්ථය (Pass)'
                      : 'ඇගයීම් මට්ටම'}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 💻 2. DESKTOP & PRINT TABLE VIEW (hidden on mobile)       */}
          {/* ========================================================= */}
          <div className="hidden sm:block print:block border border-amber-200/80 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs relative">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans border-collapse print-table-container">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 uppercase font-bold text-[10.5px] tracking-wider border-b border-amber-800/60 sticky top-0 z-10">
                    <th className="p-3.5 pl-4 w-32 border-r border-amber-900/60">විෂය කේතය</th>
                    <th className="p-3.5 border-r border-amber-900/60">
                      විෂය / පරීක්ෂණ නාමය (Subject Name)
                    </th>
                    <th className="p-3.5 text-right w-36 pr-6 border-r border-amber-900/60">
                      ලකුණු (Marks %)
                    </th>
                    <th className="p-3.5 text-center w-44 border-r border-amber-900/60">
                      සාමාර්ථය (Grade)
                    </th>
                    {isEditing && <th className="p-3.5 text-center w-20">ක්‍රියා (Actions)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/70 dark:divide-stone-800 font-medium">
                  {reportRows.map((s, idx) => (
                    <tr
                      key={s.id}
                      className={`transition-colors duration-150 ${idx % 2 === 0
                          ? 'bg-white dark:bg-stone-900'
                          : 'bg-amber-50/30 dark:bg-stone-950/40'
                        } hover:bg-amber-100/40 dark:hover:bg-amber-950/40`}
                    >
                      <td className="p-3.5 pl-4 font-mono font-extrabold text-amber-900 dark:text-amber-300 text-xs">
                        {isEditing ? (
                          <input
                            type="text"
                            value={s.code}
                            onChange={(e) => onRowChange(s.id, 'code', e.target.value)}
                            className="w-24 p-1 font-mono font-bold border border-amber-400 rounded bg-amber-50 text-stone-900 text-xs shadow-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                        ) : (
                          s.code
                        )}
                      </td>
                      <td className="p-3.5 text-stone-900 dark:text-stone-100 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            value={s.name}
                            onChange={(e) => onRowChange(s.id, 'name', e.target.value)}
                            className="w-full p-1 font-bold border border-amber-400 rounded bg-amber-50 text-stone-900 text-xs shadow-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                        ) : (
                          <span className="font-semibold">{s.name}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right pr-6 font-bold text-amber-950 dark:text-amber-100">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={s.marks}
                            onChange={(e) => onRowChange(s.id, 'marks', Number(e.target.value))}
                            className="w-20 p-1 text-center font-bold border-2 border-amber-500 rounded-lg bg-amber-50 text-stone-900 shadow-xs focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                          />
                        ) : (
                          <span className="text-sm font-mono font-black tracking-tight">
                            {s.marks}%
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            value={s.grade}
                            onChange={(e) => onRowChange(s.id, 'grade', e.target.value)}
                            className="w-36 p-1 text-center font-bold border border-amber-400 rounded bg-amber-50 text-stone-900 text-xs shadow-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                            placeholder="e.g. A+ / Distinction"
                          />
                        ) : (
                          <span
                            className={`inline-block px-3 py-1 font-black rounded-lg text-[11px] border tracking-wide uppercase ${getGradeBadgeStyle(s.grade)}`}
                          >
                            {s.grade}
                          </span>
                        )}
                      </td>
                      {isEditing && (
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => onDeleteRow(s.id)}
                            className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition-all duration-150 shadow-xs active:scale-90"
                            title="Delete Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 dark:from-amber-950 dark:via-stone-900 dark:to-amber-950 border-t-2 border-amber-300 dark:border-amber-800 font-bold text-amber-950 dark:text-amber-100">
                  <tr>
                    <td
                      colSpan={2}
                      className="p-3.5 pl-4 text-right font-serif text-xs font-bold tracking-tight"
                    >
                      මාර්ගගත විභාග සාමාන්‍ය ලකුණු ප්‍රතිශතය (Overall Average):
                    </td>
                    <td className="p-3.5 text-right pr-6 text-base font-mono font-black text-emerald-700 dark:text-emerald-400">
                      {avgMarks}%
                    </td>
                    <td colSpan={isEditing ? 2 : 1} className="p-3.5 text-center">
                      <span className="inline-block px-3 py-1 bg-emerald-700 dark:bg-emerald-900 text-white font-extrabold text-[11px] rounded-lg shadow-xs uppercase tracking-wider">
                        {avgMarks >= 75
                          ? 'විශිෂ්ඨ සාමාර්ථය (Distinction Pass)'
                          : avgMarks >= 50
                            ? 'සාමාන්‍ය සාමාර්ථය (Pass)'
                            : 'ඇගයීම් මට්ටම'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
