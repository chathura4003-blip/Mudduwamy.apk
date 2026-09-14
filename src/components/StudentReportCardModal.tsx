import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { User } from '../types';
import { PirivenaLogo } from './PirivenaLogo';
import { X, Award, CheckCircle2, Printer, Edit, Save, Share2 } from 'lucide-react';
import { useReportCardPrint } from '../hooks/useReportCardPrint';
import { shareContent } from '../utils/shareHelper';
import { triggerHaptic } from '../utils/haptics';
import { ReportCardStudentHeader, StudentHeaderData } from './reportCard/ReportCardStudentHeader';
import { ReportCardTable, ReportRow } from './reportCard/ReportCardTable';
import { ReportCardConductRemarks, ConductState } from './reportCard/ReportCardConductRemarks';
import { ReportCardSignatures } from './reportCard/ReportCardSignatures';
import { usersApi, examsApi, subjectsApi, apiClient } from '../api';
import { getCleanSubjectCode, formatCleanSubjectName } from '../utils/subjectHelper';
import { usePublicSite } from '../context/PublicSiteContext';
import { navigationHistoryManager } from '../services/navigationHistoryManager';

interface StudentReportCardModalProps {
  student: User | null;
  currentUser?: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const StudentReportCardInner: React.FC<{
  student: User;
  currentUser?: User | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ student, currentUser, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  const { handlePrint } = useReportCardPrint();

  const { siteSettings } = usePublicSite();
  const currentAcademicTermLabel = `${siteSettings.currentAcademicYear || '2026'} ${siteSettings.currentAcademicTermSinhala || 'ප්‍රථම වාරය'}`;

  // Header state
  const [headerData, setHeaderData] = useState<StudentHeaderData>({
    studentName: student.monkName || student.name || '',
    studentCustomId: student.customId || 'STD-2026-001',
    educationCategory: student.educationCategory || 'ප්‍රාචීන අධ්‍යයන අංශය (Oriental Section)',
    classLevel: student.classLevel || 'ප්‍රාචීන ප්‍රථම වසර (Level 01)',
    evaluationTerm: student.evaluationTerm || currentAcademicTermLabel,
  });

  const [principalName, setPrincipalName] = useState('Ven. Mahavalathanne Kalyana damma thero');
  const [teacherName, setTeacherName] = useState('පූජ්‍ය ශාස්ත්‍රවේදී පාලි හා ධර්මාචාර්ය හිමි (Senior Lecturer)');

  // Table rows & remarks state
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [customRemarks, setCustomRemarks] = useState(
    'ශ්‍රී සුමන මහා පිරිවෙනේ සාමණේර හිමියන් පාලි, ත්‍රිපිටක හා ප්‍රාචීන විෂයයන්හි ඉහළම දක්ෂතාවයක් දක්වයි. ධර්මධර, විනයධර සංඝ සමාජයට ආදර්ශමත් සාමණේර නමකි.'
  );
  const [customConduct, setCustomConduct] = useState<ConductState>({
    duties: 'උසස් (Excellent)',
    recitation: 'ආදර්ශමත් (Exemplary)',
    discipline: 'විශිෂ්ට (Distinguished)',
  });

  const userRole = currentUser?.role || 'admin';
  const isAdminOrTeacher = userRole === 'admin' || userRole === 'superadmin' || userRole === 'teacher' || !currentUser;
  const isStudent = userRole === 'student' && !!currentUser;

  const calculateGrade = (score: number) => {
    if (score >= 85) return 'Distinction (A+)';
    if (score >= 75) return 'Very Good (A)';
    if (score >= 65) return 'Credit Pass (B)';
    if (score >= 50) return 'Ordinary Pass (C)';
    if (score >= 40) return 'Weak Pass (S)';
    return 'Re-attempt (F)';
  };

  // Register with Android & browser back button stack
  useEffect(() => {
    navigationHistoryManager.pushModal('student_report_card_modal', onClose, 35);
    return () => navigationHistoryManager.removeModal('student_report_card_modal');
  }, [onClose]);

  // Lock body scroll and attach ESC key listener
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerHaptic('light');
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.body.style.overflowY = '';
      document.body.style.pointerEvents = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    setIsLoading(true);
    setShowSaveMessage(false);

    // Read cached custom report card data if available
    try {
      const cached = localStorage.getItem(`report_card_data_${student.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.headerData) setHeaderData((prev) => ({ ...prev, ...parsed.headerData }));
        if (parsed.customRemarks) setCustomRemarks(parsed.customRemarks);
        if (parsed.customConduct) setCustomConduct(parsed.customConduct);
        if (parsed.principalName) setPrincipalName(parsed.principalName);
        if (parsed.teacherName) setTeacherName(parsed.teacherName);
        if (Array.isArray(parsed.reportRows) && parsed.reportRows.length > 0) {
          setReportRows(parsed.reportRows);
        }
      }
    } catch (_) {}

    Promise.all([
      apiClient<any[]>(`/api/submissions?studentId=${student.id}`).catch(() => []),
      examsApi.getExams().catch(() => []),
      subjectsApi.getSubjects().catch(() => []),
      usersApi.getUserById(student.id).catch(() => null),
    ])
      .then(([submissionsData, allExams, allSubjects, fullStudentObj]) => {
        if (fullStudentObj) {
          setHeaderData((prev) => ({
            ...prev,
            studentName: fullStudentObj.monkName || fullStudentObj.name || prev.studentName,
            studentCustomId: fullStudentObj.customId || fullStudentObj.indexNumber || prev.studentCustomId,
            educationCategory: fullStudentObj.educationCategory || prev.educationCategory,
            classLevel: fullStudentObj.classLevel || prev.classLevel,
          }));
        }

        const validSubmissions = Array.isArray(submissionsData) ? submissionsData : [];
        const studentSubmissions = validSubmissions.filter(
          (s) => s.studentId === student.id || s.userId === student.id
        );

        if (studentSubmissions.length > 0) {
          const rows: ReportRow[] = studentSubmissions.map((sub, idx) => {
            const matchedExam = Array.isArray(allExams)
              ? allExams.find((e) => e.id === sub.examId)
              : null;
            const matchedSubject = Array.isArray(allSubjects)
              ? allSubjects.find(
                  (sb) =>
                    sb.id === matchedExam?.subjectId ||
                    sb.code === matchedExam?.subjectId ||
                    sb.name === matchedExam?.subjectId
                )
              : null;

            const cleanCode = getCleanSubjectCode(
              matchedSubject?.code || matchedExam?.subjectId || `SUB-${idx + 1}`
            );
            const cleanName = formatCleanSubjectName(
              matchedSubject?.nameSinhala ||
                matchedSubject?.name ||
                matchedExam?.title ||
                `විෂය ${idx + 1}`
            );
            const score = typeof sub.score === 'number' ? sub.score : Number(sub.score) || 0;

            return {
              id: sub.id || `row-${idx}`,
              code: cleanCode,
              name: typeof cleanName === 'string' ? cleanName : cleanName.name || `විෂය ${idx + 1}`,
              marks: score,
              grade: calculateGrade(score),
              date: sub.submittedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            };
          });

          setReportRows(rows);
        } else {
          // Default template rows
          const fallbackRows: ReportRow[] = [
            {
              id: 'row-1',
              code: 'PL-01',
              name: 'පාලි භාෂාව හා සාහිත්‍යය (Pali)',
              marks: 88,
              grade: 'Distinction (A+)',
              date: new Date().toISOString().split('T')[0],
            },
            {
              id: 'row-2',
              code: 'SK-02',
              name: 'සංස්කෘත භාෂාව හා ව්‍යාකරණ (Sanskrit)',
              marks: 78,
              grade: 'Very Good (A)',
              date: new Date().toISOString().split('T')[0],
            },
            {
              id: 'row-3',
              code: 'SI-03',
              name: 'සිංහල සාහිත්‍යය හා පද්‍ය (Sinhala)',
              marks: 92,
              grade: 'Distinction (A+)',
              date: new Date().toISOString().split('T')[0],
            },
            {
              id: 'row-4',
              code: 'DH-04',
              name: 'ත්‍රිපිටක ධර්මය හා බෞද්ධ සංස්කෘතිය',
              marks: 85,
              grade: 'Distinction (A+)',
              date: new Date().toISOString().split('T')[0],
            },
            {
              id: 'row-5',
              code: 'EN-05',
              name: 'ඉංග්‍රීසි භාෂාව (English)',
              marks: 70,
              grade: 'Credit Pass (B)',
              date: new Date().toISOString().split('T')[0],
            },
          ];
          setReportRows(fallbackRows);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [student.id]);

  const handleHeaderChange = (field: keyof StudentHeaderData, value: string) => {
    setHeaderData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRowChange = (id: string, field: keyof ReportRow, value: any) => {
    setReportRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };
          if (field === 'marks') {
            const num = Number(value) || 0;
            updated.marks = num;
            updated.grade = calculateGrade(num);
          }
          return updated;
        }
        return row;
      })
    );
  };

  const handleAddRow = () => {
    const newId = `custom-${Date.now()}`;
    setReportRows((prev) => [
      ...prev,
      {
        id: newId,
        code: `NEW-${prev.length + 1}`,
        name: 'නව විෂයය',
        marks: 75,
        grade: 'Very Good (A)',
        date: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const handleDeleteRow = (id: string) => {
    setReportRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveReportCard = () => {
    triggerHaptic('success');
    try {
      const payload = {
        headerData,
        customRemarks,
        customConduct,
        principalName,
        teacherName,
        reportRows,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(`report_card_data_${student.id}`, JSON.stringify(payload));
    } catch (_) {}

    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 4000);
  };

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic('light');
          onClose();
        }
      }}
      onContextMenu={(e) => {
        if (isStudent) e.preventDefault();
      }}
      data-modal="true"
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-xs p-2.5 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static pt-safe pb-safe print-container ${isStudent ? 'select-none' : ''}`}
    >
      <div
        className={`bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border-2 border-amber-500/80 my-auto text-stone-900 dark:text-stone-100 animate-fade-in print:shadow-none print:border-none print:w-full print:rounded-none print-modal-container print-modal-content max-h-[calc(100dvh-2rem)] flex flex-col mobile-bottom-sheet ${isStudent ? 'select-none' : ''}`}
      >
        {/* Mobile Bottom Sheet Drag Indicator */}
        <div className="bottom-sheet-drag-handle sm:hidden print:hidden" />

        {/* Modal Controls Header */}
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-stone-950 text-white p-3.5 sm:p-5 flex flex-col gap-3 border-b-2 border-amber-500 shadow-md print:hidden shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-inner">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 animate-icon-sparkle" />
              </div>
              <div className="min-w-0">
                <span className="text-[9.5px] sm:text-[10px] font-serif font-bold uppercase tracking-wider text-amber-400 block truncate">
                  ශ්‍රී සුමන මහා පිරිවෙන • නිල ලකුණු ප්‍රගති වාර්තාව
                </span>
                <h3 className="font-serif font-extrabold text-sm sm:text-lg text-amber-100 leading-snug truncate">
                  {headerData.studentName || 'Student Progress Report Card'}
                </h3>
              </div>
            </div>

            {/* Prominent High-Visibility Close Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onClose();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-900/90 hover:bg-rose-700 text-amber-200 hover:text-white flex items-center justify-center shrink-0 border border-amber-400/50 shadow-md transition cursor-pointer active:scale-90"
              title="Close Report Card"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 font-bold" />
            </button>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-amber-800/60">
            {isAdminOrTeacher && (
              <>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleSaveReportCard}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow ring-2 ring-emerald-300 animate-bounce cursor-pointer active:scale-95"
                    title="Save Report Card Changes"
                  >
                    <Save className="w-3.5 h-3.5 animate-icon-pulse-glow" />
                    <span>💾 සුරකින්න</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsEditing(!isEditing);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer active:scale-95 group ${
                    isEditing
                      ? 'bg-amber-400 text-amber-950 font-extrabold ring-2 ring-amber-300'
                      : 'bg-amber-900 hover:bg-amber-800 text-amber-100 border border-amber-400/50'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  <span>{isEditing ? 'සංස්කරණය අවසන්' : 'සංස්කරණය (Edit)'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                shareContent({
                  title: `ප්‍රගති වාර්තාව - ${headerData.studentName}`,
                  text: `📜 ශ්‍රී සුමන මහා පිරිවෙන (මුද්දුව, රත්නපුර)\nනිල ශිෂ්‍ය ප්‍රගති වාර්තාව (Progress Report Card)\n\n👤 ශිෂ්‍ය නාමය: ${headerData.studentName}\n🔢 ලියාපදිංචි අංකය: ${headerData.studentCustomId}\n🏫 පන්තිය: ${headerData.classLevel}\n🗓️ ඇගයීම් වාරය: ${headerData.evaluationTerm}`,
                });
              }}
              className="px-3 py-1.5 bg-amber-800/80 hover:bg-amber-700 text-amber-100 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow border border-amber-500/40 cursor-pointer active:scale-95 group"
              title="Share Report Card"
            >
              <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                handlePrint(headerData.studentName);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow border border-amber-300 cursor-pointer active:scale-95"
              title="Print or Save PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨️ මුද්‍රණය (Print / PDF)</span>
            </button>
          </div>
        </div>

        {/* Save Toast Notification */}
        {showSaveMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs font-bold font-serif flex items-center justify-center gap-2 animate-fade-in print:hidden">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              ✨ ශිෂ්‍ය ලකුණු ප්‍රගති වාර්තාව සාර්ථකව පද්ධතියට සුරැකිණි! (Report Card Saved
              Successfully!)
            </span>
          </div>
        )}

        {/* Report Card Printable Container */}
        <div
          id="report-card-printable"
          className="p-4 sm:p-8 bg-stone-50 dark:bg-stone-950 space-y-6 flex-1 overflow-y-auto print:max-h-none print:overflow-visible print:bg-white print:p-4 print-report-card"
        >
          {/* Header Banner */}
          <div className="bg-white dark:bg-stone-900 border border-amber-200 dark:border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xs text-center space-y-3 relative overflow-hidden print:border-none print:shadow-none">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <PirivenaLogo size={60} variant="icon" />
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-serif font-bold text-[10px] sm:text-[11px] uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 px-3 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 print:bg-stone-100 print:text-stone-900 mb-1">
                  Department of Examinations & Monastic Education
                </div>
                <h1 className="text-lg sm:text-2xl font-serif font-extrabold text-amber-950 dark:text-amber-100 tracking-tight">
                  ශ්‍රී සුමන මහා පිරිවෙන - රත්නපුර මුද්දුව
                </h1>
                <h2 className="text-xs sm:text-sm font-serif font-bold text-amber-900 dark:text-amber-300">
                  SRI SUMANA MAHA PIRIVENA - ORIENTAL ACADEMIC REPORT CARD
                </h2>
                <p className="text-[10px] sm:text-[11px] text-stone-600 dark:text-stone-400 font-sans mt-0.5">
                  Sabaragamuwa Province • Reg No: PRV/RAT/1984 • Tel: +94 45 222 3450
                </p>
              </div>
            </div>
          </div>

          {/* Student Header */}
          <ReportCardStudentHeader
            headerData={headerData}
            isEditing={isEditing}
            onChange={handleHeaderChange}
          />

          {/* Data Table */}
          <ReportCardTable
            reportRows={reportRows}
            isLoading={isLoading}
            isEditing={isEditing}
            isAdminOrTeacher={isAdminOrTeacher}
            onRowChange={handleRowChange}
            onAddRow={handleAddRow}
            onDeleteRow={handleDeleteRow}
          />

          {/* Bottom Conduct, Remarks, Signatures */}
          <div className="space-y-4 print-bottom-container mt-auto">
            <ReportCardConductRemarks
              customConduct={customConduct}
              customRemarks={customRemarks}
              isEditing={isEditing}
              onConductChange={(field, val) =>
                setCustomConduct((prev) => ({ ...prev, [field]: val }))
              }
              onRemarksChange={setCustomRemarks}
            />

            <ReportCardSignatures
              principalName={principalName}
              teacherName={teacherName}
              isEditing={isEditing}
              student={student}
              onPrincipalNameChange={setPrincipalName}
              onTeacherNameChange={setTeacherName}
            />
          </div>
        </div>

        {/* Modal Footer with Close Button for Mobile Convenience */}
        <div className="p-3 bg-stone-100 dark:bg-stone-900 border-t border-slate-200 dark:border-stone-800 flex items-center justify-between gap-2 print:hidden shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            ESC යතුරෙන් හෝ Close බොත්තමෙන් වසන්න
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
            <span>වාර්තාව වසන්න (Close)</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export const StudentReportCardModal: React.FC<StudentReportCardModalProps> = (props) => {
  if (!props.isOpen || !props.student) return null;
  return (
    <StudentReportCardInner
      student={props.student}
      currentUser={props.currentUser}
      isOpen={props.isOpen}
      onClose={props.onClose}
    />
  );
};
