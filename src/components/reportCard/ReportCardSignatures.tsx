import React from 'react';
import { Award, QrCode, CheckCheck } from 'lucide-react';
import type { User } from '../../types';
import { getSriLankaDateString } from '../../utils/sriLankaTime';

interface ReportCardSignaturesProps {
  principalName: string;
  teacherName?: string;
  dateIssued?: string;
  isEditing: boolean;
  student: User;
  onPrincipalNameChange: (val: string) => void;
  onTeacherNameChange?: (val: string) => void;
  onDateIssuedChange?: (val: string) => void;
}

export const ReportCardSignatures: React.FC<ReportCardSignaturesProps> = ({
  principalName,
  teacherName = 'පූජ්‍ය පාලි හා ධර්මාචාර්ය ස්වාමීන් වහන්සේ',
  dateIssued = getSriLankaDateString(),
  isEditing,
  student,
  onPrincipalNameChange,
  onTeacherNameChange,
  onDateIssuedChange,
}) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-amber-200 dark:border-stone-800 rounded-3xl p-5 shadow-xs space-y-4 font-serif">
      <div className="grid grid-cols-2 gap-8 text-center text-xs">
        <div className="flex flex-col justify-end">
          <div className="border-b border-stone-300 dark:border-stone-700 pb-6 mb-2">
            {isEditing ? (
              <input autoComplete="name" id="reportcardsignatures-teacherName" name="teacherName"
                type="text"
                value={teacherName}
                onChange={(e) => onTeacherNameChange && onTeacherNameChange(e.target.value)}
                className="w-full text-center font-bold text-amber-900 border border-amber-400 rounded bg-amber-50 text-[11px]"
                placeholder="ආචාර්ය හිමි/ගුරුභවතාගේ නම"
              />
            ) : (
              <span className="font-bold text-amber-900 dark:text-amber-300 block font-serif text-[11px]">
                {teacherName}
              </span>
            )}
          </div>
          <span className="font-bold text-amber-950 dark:text-amber-100 block">
            පූජ්‍ය ශාස්ත්‍රවේදී ආචාර්ය මණ්ඩලය
          </span>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">
            Senior Dhamma Lecturer / Class Head
          </span>
        </div>
        <div className="flex flex-col justify-end relative">
          {/* Official Gold Seal Graphic Badge */}
          <div className="absolute right-2 -top-4 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 text-white p-0.5 shadow-md flex items-center justify-center border-2 border-amber-200 print:right-0">
            <div className="w-full h-full rounded-full border border-dashed border-amber-100 flex flex-col items-center justify-center text-[7px] font-bold leading-none text-center">
              <span>OFFICIAL</span>
              <Award className="w-3.5 h-3.5 text-amber-100 my-0.5" />
              <span>SEAL</span>
            </div>
          </div>
          <div className="border-b border-stone-300 dark:border-stone-700 pb-6 mb-2">
            {isEditing ? (
              <input autoComplete="name" id="reportcardsignatures-principalName" name="principalName"
                type="text"
                value={principalName}
                onChange={(e) => onPrincipalNameChange(e.target.value)}
                className="w-full text-center font-bold text-amber-900 border border-amber-400 rounded bg-amber-50 text-[11px]"
                placeholder="පරිවේණාධිපති ස්වාමීන් වහන්සේගේ නම"
              />
            ) : (
              <span className="font-bold text-amber-900 dark:text-amber-300 block font-serif text-[11px]">
                {principalName}
              </span>
            )}
          </div>
          <span className="font-bold text-amber-950 dark:text-amber-100 block">
            කෘත්‍යාධිකාරී හා පරිවේණාධිපති ස්වාමීන් වහන්සේ
          </span>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">
            Chief Incumbent & Principal • Monastic Seal
          </span>
        </div>
      </div>

      {/* Official Digital Verification Footer */}
      <div className="border-t border-amber-100 dark:border-stone-800 pt-3 flex items-center justify-between text-[9.5px] text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white p-0.5 border border-amber-300 dark:border-amber-400 rounded shrink-0 overflow-hidden relative">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`PIRIVENA-REPORT-${student.customId || student.id}`)}&color=451a03&bgcolor=ffffff`}
              alt="Report Card QR"
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
                const fb = e.currentTarget.nextElementSibling as HTMLElement;
                if (fb) fb.style.display = 'block';
              }}
            />
            <QrCode className="w-6 h-6 text-amber-800 dark:text-amber-400 shrink-0 hidden" />
          </div>
          <div>
            <span className="font-bold text-stone-700 dark:text-stone-300 block">
              සත්‍යාපිත ශිෂ්‍ය ප්‍රගති වාර්තාව • ERP DIGITAL VERIFIED
            </span>
            <span className="font-mono text-[8.5px]">
              DOC-ID: PIRIVENA-2026-REG-{student.id?.slice(-4) || '8842'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCheck className="w-3 h-3" />
            නිල අධ්‍යාපන වාර්තා පද්ධතිය මගින් නිකුත් කරන ලදී
          </span>
          <span className="block text-[8.5px] text-stone-400">
            Sri Sumana Pirivena Official Academic Portal
          </span>
        </div>
      </div>
    </div>
  );
};
