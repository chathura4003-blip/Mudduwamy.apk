import React from 'react';

export interface StudentHeaderData {
  studentName: string;
  studentCustomId: string;
  educationCategory: string;
  classLevel: string;
  evaluationTerm: string;
}

interface ReportCardStudentHeaderProps {
  headerData: StudentHeaderData;
  isEditing: boolean;
  onChange: (field: keyof StudentHeaderData, value: string) => void;
}

export const ReportCardStudentHeader: React.FC<ReportCardStudentHeaderProps> = ({
  headerData,
  isEditing,
  onChange,
}) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-amber-200 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-xs grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 text-xs font-sans">
      <div className="col-span-2 sm:col-span-1">
        <span className="text-stone-500 dark:text-stone-400 block uppercase text-[10px] font-bold">
          ශිෂ්‍ය / සාමණේර නාමය
        </span>
        {isEditing ? (
          <input autoComplete="name" id="reportcardstudentheader-studentName" name="studentName"
            type="text"
            value={headerData.studentName}
            onChange={(e) => onChange('studentName', e.target.value)}
            className="w-full p-1 border border-amber-500 rounded bg-amber-50 text-stone-900 font-bold text-xs mt-0.5"
          />
        ) : (
          <span className="font-extrabold text-amber-950 dark:text-amber-100 text-sm block mt-0.5">
            {headerData.studentName}
          </span>
        )}
      </div>

      <div>
        <span className="text-stone-500 dark:text-stone-400 block uppercase text-[10px] font-bold">
          ලියාපදිංචි අංකය (Student ID)
        </span>
        {isEditing ? (
          <input autoComplete="name" id="reportcardstudentheader-studentCustomId" name="studentCustomId"
            type="text"
            value={headerData.studentCustomId}
            onChange={(e) => onChange('studentCustomId', e.target.value)}
            className="w-full p-1 border border-amber-500 rounded bg-amber-50 text-stone-900 font-bold text-xs mt-0.5 font-mono"
          />
        ) : (
          <span className="font-mono font-bold text-amber-900 dark:text-amber-300 text-sm block mt-0.5">
            {headerData.studentCustomId}
          </span>
        )}
      </div>

      <div>
        <span className="text-stone-500 dark:text-stone-400 block uppercase text-[10px] font-bold">
          අධ්‍යාපන අංශය
        </span>
        {isEditing ? (
          <input autoComplete="name" id="reportcardstudentheader-educationCategory" name="educationCategory"
            type="text"
            value={headerData.educationCategory}
            onChange={(e) => onChange('educationCategory', e.target.value)}
            className="w-full p-1 border border-amber-500 rounded bg-amber-50 text-stone-900 font-bold text-xs mt-0.5"
          />
        ) : (
          <span className="font-bold text-stone-800 dark:text-stone-200 block mt-0.5">
            {headerData.educationCategory}
          </span>
        )}
      </div>

      <div>
        <span className="text-stone-500 dark:text-stone-400 block uppercase text-[10px] font-bold">
          පන්තිය / ශ්‍රේණිය
        </span>
        {isEditing ? (
          <input autoComplete="name" id="reportcardstudentheader-classLevel" name="classLevel"
            type="text"
            value={headerData.classLevel}
            onChange={(e) => onChange('classLevel', e.target.value)}
            className="w-full p-1 border border-amber-500 rounded bg-amber-50 text-stone-900 font-bold text-xs mt-0.5"
          />
        ) : (
          <span className="font-bold text-stone-800 dark:text-stone-200 block mt-0.5">
            {headerData.classLevel}
          </span>
        )}
      </div>

      <div>
        <span className="text-stone-500 dark:text-stone-400 block uppercase text-[10px] font-bold">
          ඇගයීම් වාරය
        </span>
        {isEditing ? (
          <input autoComplete="name" id="reportcardstudentheader-evaluationTerm" name="evaluationTerm"
            type="text"
            value={headerData.evaluationTerm}
            onChange={(e) => onChange('evaluationTerm', e.target.value)}
            className="w-full p-1 border border-amber-500 rounded bg-amber-50 text-stone-900 font-bold text-xs mt-0.5"
          />
        ) : (
          <span className="font-bold text-stone-800 dark:text-stone-200 block mt-0.5">
            {headerData.evaluationTerm}
          </span>
        )}
      </div>
    </div>
  );
};
