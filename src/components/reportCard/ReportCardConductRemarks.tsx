import React from 'react';
import { UserCheck, ShieldCheck } from 'lucide-react';

export interface ConductState {
  duties: string;
  recitation: string;
  discipline: string;
}

interface ReportCardConductRemarksProps {
  customConduct: ConductState;
  customRemarks: string;
  isEditing: boolean;
  onConductChange: (field: keyof ConductState, value: string) => void;
  onRemarksChange: (value: string) => void;
}

export const ReportCardConductRemarks: React.FC<ReportCardConductRemarksProps> = ({
  customConduct,
  customRemarks,
  isEditing,
  onConductChange,
  onRemarksChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:grid-cols-1">
      {/* Monastic Conduct & Vinaya Assessment */}
      <div className="bg-white dark:bg-stone-900 border border-amber-200 dark:border-stone-800 rounded-3xl p-5 shadow-xs space-y-3">
        <h4 className="font-serif font-bold text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>ශික්ෂණය හා විනය ඇගයීම (Monastic Conduct)</span>
        </h4>
        <ul className="space-y-2 text-xs text-stone-700 dark:text-stone-300 font-medium">
          <li className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 dark:bg-stone-950">
            <span>වත්ත සිරිත හා පිරිවෙන් වගකීම්:</span>
            {isEditing ? (
              <input autoComplete="name" id="reportcardconductremarks-duties" name="duties"
                type="text"
                value={customConduct.duties}
                onChange={(e) => onConductChange('duties', e.target.value)}
                className="p-1 border border-amber-400 rounded bg-amber-50 text-stone-900 text-xs font-bold text-right"
              />
            ) : (
              <strong className="text-emerald-700 dark:text-emerald-400">
                {customConduct.duties}
              </strong>
            )}
          </li>
          <li className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 dark:bg-stone-950">
            <span>ත්‍රිපිටක හා වන්දනා සජ්ඣායනා:</span>
            {isEditing ? (
              <input autoComplete="name" id="reportcardconductremarks-recitation" name="recitation"
                type="text"
                value={customConduct.recitation}
                onChange={(e) => onConductChange('recitation', e.target.value)}
                className="p-1 border border-amber-400 rounded bg-amber-50 text-stone-900 text-xs font-bold text-right"
              />
            ) : (
              <strong className="text-emerald-700 dark:text-emerald-400">
                {customConduct.recitation}
              </strong>
            )}
          </li>
          <li className="flex items-center justify-between p-2 rounded-xl bg-amber-50/50 dark:bg-stone-950">
            <span>භික්ෂු ශික්ෂාකාමීත්වය:</span>
            {isEditing ? (
              <input autoComplete="name" id="reportcardconductremarks-discipline" name="discipline"
                type="text"
                value={customConduct.discipline}
                onChange={(e) => onConductChange('discipline', e.target.value)}
                className="p-1 border border-amber-400 rounded bg-amber-50 text-stone-900 text-xs font-bold text-right"
              />
            ) : (
              <strong className="text-emerald-700 dark:text-emerald-400">
                {customConduct.discipline}
              </strong>
            )}
          </li>
        </ul>
      </div>

      {/* Lecturer Remarks */}
      <div className="bg-white dark:bg-stone-900 border border-amber-200 dark:border-stone-800 rounded-3xl p-5 shadow-xs space-y-3 w-full">
        <h4 className="font-serif font-bold text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-800 dark:text-amber-400" />
          <span>ආචාර්ය අනුශාසනාව (Lecturer Remarks)</span>
        </h4>
        {isEditing ? (
          <textarea autoComplete="name" id="reportcardconductremarks-customRemarks" name="customRemarks"
            rows={4}
            value={customRemarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            className="w-full p-3 rounded-xl border-2 border-amber-500 bg-amber-50 text-xs font-serif text-stone-900 focus:outline-hidden"
          />
        ) : (
          <p className="text-xs text-stone-700 dark:text-stone-300 italic font-serif leading-relaxed bg-amber-50/50 dark:bg-stone-950 p-3.5 rounded-2xl border border-amber-200 dark:border-stone-800">
            "{customRemarks}"
          </p>
        )}
      </div>
    </div>
  );
};
