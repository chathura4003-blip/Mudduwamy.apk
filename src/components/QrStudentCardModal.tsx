import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils/haptics';
import { handleAvatarError, getImageUrl } from '../utils/imageHelper';
import { PirivenaLogo } from './PirivenaLogo';
import type { User, PirivenaClass, Subject } from '../types';
import { X, Printer, ShieldCheck, QrCode, Loader2, Award, BookOpen, UserCheck, ShieldAlert } from 'lucide-react';
import { usersApi, classesApi, subjectsApi } from '../api';
import { triggerUniversalPrint } from '../utils/printHelper';

interface QrStudentCardModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QrStudentCardModal: React.FC<QrStudentCardModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const [fullUser, setFullUser] = useState<User | null>(user);
  const [classList, setClassList] = useState<PirivenaClass[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    setFullUser(user);
    setIsLoading(true);

    Promise.all([
      user.id ? usersApi.getUserById(user.id).catch(() => null) : Promise.resolve(null),
      classesApi.getClasses().catch(() => []),
      subjectsApi.getSubjects().catch(() => []),
    ])
      .then(([fetchedUser, fetchedClasses, fetchedSubjects]) => {
        if (fetchedUser) {
          setFullUser((prev) => ({ ...prev, ...fetchedUser }));
        }
        if (Array.isArray(fetchedClasses)) {
          setClassList(fetchedClasses);
        }
        if (Array.isArray(fetchedSubjects)) {
          setSubjectList(fetchedSubjects);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, user?.id]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentUser = fullUser || user;
  const userRole = currentUser?.role || 'student';
  const isMonk = currentUser?.monkStatus === 'monk' || currentUser?.monkStatus === 'upasampada';
  const displayName = currentUser?.monkName || currentUser?.nameSinhala || currentUser?.name || '';

  // Resolve user's actual class name from classList
  const userClass = classList.find(
    (c) =>
      c.id === currentUser.classId ||
      c.code === currentUser.classId ||
      c.name === currentUser.classId ||
      c.nameSinhala === currentUser.classId ||
      c.id === (currentUser as any).pirivenaClass ||
      c.code === (currentUser as any).pirivenaClass
  );
  const displayClassName = userClass
    ? `${userClass.nameSinhala || userClass.name}${userClass.code ? ` (${userClass.code})` : ''}`
    : currentUser.classLevel
      ? currentUser.classLevel
      : currentUser.educationCategory
        ? `${currentUser.educationCategory}`
        : 'මූලික පිරිවෙන් පන්තිය (Primary Pirivena Grade)';

  // Resolve teacher subjects from teacherAssignments
  const teacherAssignments = currentUser.teacherAssignments || [];
  const assignedSubjectIds = new Set<string>();
  const assignedClassIds = new Set<string>();
  teacherAssignments.forEach((a) => {
    if (a.subjectId) assignedSubjectIds.add(String(a.subjectId).trim());
    if (a.classId) assignedClassIds.add(String(a.classId).trim());
  });

  const resolvedSubjects = Array.from(assignedSubjectIds)
    .map((subId) => {
      const found = subjectList.find((s) => s.id === subId || s.code === subId || s.name === subId);
      return found ? (found.nameSinhala || found.name) : subId;
    })
    .filter(Boolean);

  // Resolve assigned classes for teacher from teacherAssignments
  const resolvedClasses = Array.from(assignedClassIds)
    .map((clsId) => {
      const found = classList.find((c) => c.id === clsId || c.code === clsId || c.name === clsId);
      return found ? (found.nameSinhala || found.name) : clsId;
    })
    .filter(Boolean);

  // QR Code Token & URL
  const qrToken = currentUser.qrCodeToken || `VERIFY-${userRole.toUpperCase().slice(0, 3)}-${currentUser.customId || currentUser.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrToken)}&color=451a03&bgcolor=ffffff`;

  const handlePrint = () => {
    triggerUniversalPrint(`ඩිජිටල්_හැඳුනුම්පත_${currentUser.monkName || currentUser.name || 'ID_Card'}`);
  };

  // Dynamic Modal Header Info & Theme according to Role
  let modalTitle = 'ඩිජිටල් ශිෂ්‍ය හැඳුනුම්පත (Student Identity Card)';
  let printBtnLabel = 'මුද්‍රණය කරන්න (Print Student ID)';
  let roleBadgeLabel = 'ගිහි ශිෂ්‍ය (Lay Student)';

  if (userRole === 'admin' || userRole === 'superadmin') {
    modalTitle = 'පරිපාලන ඩිජිටල් හැඳුනුම්පත (Administrator Identity Card)';
    printBtnLabel = 'මුද්‍රණය කරන්න (Print Admin ID)';
    roleBadgeLabel = userRole === 'superadmin' ? '👑 අග්‍රාධිකාරී පරිපාලක (Super Admin)' : '🛡️ පිරිවෙන් පරිපාලක (Executive Admin)';
  } else if (userRole === 'teacher') {
    modalTitle = 'ගුරු ඩිජිටල් හැඳුනුම්පත (Academic Staff Identity Card)';
    printBtnLabel = 'මුද්‍රණය කරන්න (Print Teacher ID)';
    roleBadgeLabel = isMonk ? '🪷 ගුරු හිමි (Academic Staff Monk)' : '🎓 ගුරුභවතා (Academic Lecturer)';
  } else {
    if (isMonk) {
      roleBadgeLabel = '🪷 සාමණේර පිරිවෙන් හිමි (Monastic Student)';
    }
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && user && (
        <div
          data-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto select-none pt-safe pb-safe print-container print:p-0 print:bg-white print:static"
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="relative bg-white dark:bg-stone-900 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] w-full max-w-md overflow-hidden border border-slate-200 dark:border-stone-800 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto text-slate-900 dark:text-stone-100 flex flex-col mobile-bottom-sheet print-modal-content print:shadow-none print:border-none print:w-full print:rounded-none"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Mobile Bottom Sheet Drag Indicator */}
          <div className="bottom-sheet-drag-handle sm:hidden" />

          {/* Top Accent Strip */}
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 shrink-0" />

          {/* Modal Top Bar */}
          <div className="bg-amber-950 dark:bg-stone-950 text-amber-100 p-4 flex items-center justify-between border-b border-amber-800/80 dark:border-stone-800 shrink-0">
            <div className="flex items-center gap-2 font-serif font-bold text-sm">
              {userRole === 'admin' || userRole === 'superadmin' ? (
                <ShieldAlert className="w-4 h-4 text-amber-400 animate-icon-pulse-glow" />
              ) : userRole === 'teacher' ? (
                <Award className="w-4 h-4 text-emerald-400 animate-icon-sparkle" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-amber-400 animate-icon-pulse-glow" />
              )}
              <span>{modalTitle}</span>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1 hover:bg-amber-900 dark:hover:bg-stone-800 rounded-xl transition cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5 text-amber-200" />
            </button>
          </div>

        <div className="p-5 sm:p-6 bg-stone-100 dark:bg-stone-950 space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 py-1">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>තොරතුරු යාවත්කාලීන වෙමින් පවතී...</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* PRINTABLE IDENTITY CARD - DYNAMICALLY STYLED PER ROLE      */}
          {/* ========================================================= */}
          
          {/* 1. ADMIN / SUPERADMIN ID CARD */}
          {(userRole === 'admin' || userRole === 'superadmin') && (
            <div
              id="printable-admin-id-card"
              className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 border-2 border-amber-400 rounded-2xl p-5 shadow-xl shadow-amber-950/40 relative overflow-hidden text-amber-50 space-y-4"
            >
              {/* Background Watermark */}
              <div className="absolute -right-8 -bottom-8 opacity-15 text-amber-400 font-serif text-9xl pointer-events-none select-none print:hidden">
                ☸
              </div>

              {/* Header */}
              <div className="text-center border-b border-amber-500/40 pb-3">
                <div className="text-amber-400 text-[10px] font-bold font-serif tracking-widest uppercase">
                  SRI LANKA MINISTRY OF EDUCATION • PIRIVENA MANAGEMENT DIVISION
                </div>
                <h2 className="text-amber-100 font-serif font-extrabold text-base leading-tight mt-0.5">
                  ශ්‍රී සුමන මහා පිරිවෙන
                </h2>
                <p className="text-[11px] font-semibold text-amber-300/90">
                  මුද්දුව, රත්නපුර | Sri Sumana Maha Pirivena, Ratnapura
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-extrabold uppercase shadow-xs">
                  {roleBadgeLabel}
                </div>
              </div>

              {/* Content Body */}
              <div className="flex gap-4 items-center">
                {/* Photo Avatar */}
                <div className="w-22 h-26 rounded-xl bg-stone-800 border-2 border-amber-400 flex flex-col items-center justify-center text-amber-200 overflow-hidden shadow-inner shrink-0 relative">
                  {currentUser.avatar ? (
                    <img
                      src={getImageUrl(currentUser.avatar)}
                      alt={currentUser.name}
                      onError={handleAvatarError}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl">🛡️</span>
                      <span className="text-[9px] font-bold text-amber-300 block mt-1">
                        EXECUTIVE
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs min-w-0 flex-1">
                  <div>
                    <span className="text-[9px] text-amber-400 block uppercase font-bold tracking-wider">
                      Admin ID / පරිපාලක අංකය
                    </span>
                    <span className="font-mono font-extrabold text-amber-100 text-sm">
                      {currentUser.customId || currentUser.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-amber-400 block uppercase font-bold tracking-wider">
                      Full Name / පරිපාලකගේ නම
                    </span>
                    <span className="font-bold text-amber-50 text-sm leading-tight block truncate">
                      {displayName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-amber-400 block uppercase font-bold tracking-wider">
                      Designation / තනතුර
                    </span>
                    <span className="font-semibold text-amber-200 block truncate">
                      {currentUser.qualification || (userRole === 'superadmin' ? 'අග්‍රාධිකාරී / ප්‍රධාන පරිපාලක (Super Admin)' : 'පිරිවෙන් විධායක පරිපාලක (Pirivena Executive)')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-amber-400 block uppercase font-bold tracking-wider">
                      Department / අංශය
                    </span>
                    <span className="font-medium text-amber-100/90 block truncate">
                      පරිපාලන හා පාලක මණ්ඩල අංශය (Executive Board)
                    </span>
                  </div>

                  {(currentUser.phone || currentUser.email) && (
                    <div>
                      <span className="text-[9px] text-amber-400 block uppercase font-bold tracking-wider">
                        Contact / සම්බන්ධතාව
                      </span>
                      <span className="font-mono text-[11px] text-amber-200/90 block truncate">
                        {currentUser.phone || currentUser.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code & Verification Token */}
              <div className="pt-3 border-t border-amber-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-16 h-16 bg-white p-1 border-2 border-amber-400 rounded-xl flex items-center justify-center shadow-xs shrink-0 overflow-hidden relative">
                    <img
                      src={qrCodeUrl}
                      alt="Digital Admin QR Code"
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <QrCode className="w-12 h-12 text-stone-900 hidden" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-amber-300 uppercase">
                      Security Verification Token
                    </div>
                    <div className="text-[9px] font-mono font-bold text-amber-100 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/60 truncate max-w-[140px] my-0.5">
                      {qrToken}
                    </div>
                    <div className="text-[9px] text-amber-400 font-extrabold flex items-center gap-0.5 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      <span>OFFICIAL EXECUTIVE DIGITAL ID</span>
                    </div>
                  </div>
                </div>

                {/* Official Seal */}
                <div className="text-center flex flex-col items-center">
                  <PirivenaLogo size={46} variant="icon" />
                  <span className="text-[8px] text-amber-300 block mt-1 font-semibold">
                    මුද්දුව - රත්නපුර
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. TEACHER ID CARD */}
          {userRole === 'teacher' && (
            <div
              id="printable-teacher-id-card"
              className="bg-gradient-to-br from-emerald-50 via-white to-teal-100 dark:from-stone-900 dark:via-stone-900 dark:to-teal-950/80 border-2 border-emerald-500 dark:border-emerald-400 rounded-2xl p-5 shadow-lg dark:shadow-emerald-950/40 relative overflow-hidden text-stone-900 dark:text-stone-100 space-y-4"
            >
              {/* Background Watermark */}
              <div className="absolute -right-8 -bottom-8 opacity-10 dark:opacity-20 text-emerald-900 dark:text-emerald-400 font-serif text-9xl pointer-events-none select-none print:hidden">
                ☸
              </div>

              {/* Header */}
              <div className="text-center border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
                <div className="text-emerald-800 dark:text-emerald-400 text-[10px] font-bold font-serif tracking-widest uppercase">
                  SRI LANKA MINISTRY OF EDUCATION • PIRIVENA EDUCATION BOARD
                </div>
                <h2 className="text-emerald-950 dark:text-emerald-100 font-serif font-extrabold text-base leading-tight mt-0.5">
                  ශ්‍රී සුමන මහා පිරිවෙන
                </h2>
                <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                  මුද්දුව, රත්නපුර | Sri Sumana Maha Pirivena, Ratnapura
                </p>
                <div className="mt-1.5 inline-block px-3 py-0.5 rounded-full bg-emerald-200/90 dark:bg-emerald-900/90 text-emerald-950 dark:text-emerald-100 text-[10px] font-bold border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                  {roleBadgeLabel}
                </div>
              </div>

              {/* Content Body */}
              <div className="flex gap-4 items-center">
                {/* Photo Avatar */}
                <div className="w-22 h-26 rounded-xl bg-emerald-100 dark:bg-stone-800 border-2 border-emerald-500 dark:border-emerald-400 flex flex-col items-center justify-center text-emerald-900 dark:text-emerald-200 overflow-hidden shadow-inner shrink-0 relative">
                  {currentUser.avatar ? (
                    <img
                      src={getImageUrl(currentUser.avatar)}
                      alt={currentUser.name}
                      onError={handleAvatarError}
                      className="w-full h-full object-cover"
                    />
                  ) : isMonk ? (
                    <div className="text-center">
                      <span className="text-3xl">🪷</span>
                      <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 block mt-1">
                        TEACHER MONK
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl">🎓</span>
                      <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 block mt-1">
                        LECTURER
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs min-w-0 flex-1">
                  <div>
                    <span className="text-[9px] text-emerald-800 dark:text-emerald-400 block uppercase font-semibold">
                      Staff ID / ගුරු ලියාපදිංචි අංකය
                    </span>
                    <span className="font-mono font-extrabold text-emerald-950 dark:text-emerald-100 text-sm">
                      {currentUser.customId || currentUser.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-emerald-800 dark:text-emerald-400 block uppercase font-semibold">
                      Full Name / ගුරුභවතාගේ නම
                    </span>
                    <span className="font-bold text-emerald-950 dark:text-emerald-100 leading-tight block truncate">
                      {displayName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-emerald-800 dark:text-emerald-400 block uppercase font-semibold">
                      Qualifications / තත්ත්වය හා සුදුසුකම්
                    </span>
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200 block truncate">
                      {currentUser.qualification || 'රාජකීය පණ්ඩිත / ජ්‍යෙෂ්ඨ ආචාර්ය (Academic Staff)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-emerald-800 dark:text-emerald-400 block uppercase font-semibold">
                      Subjects / උගන්වන විෂයයන්
                    </span>
                    <span className="font-medium text-emerald-950 dark:text-emerald-100 block truncate">
                      {resolvedSubjects.length > 0
                        ? resolvedSubjects.join(', ')
                        : 'පාලි, සංස්කෘත, බුද්ධ ධර්මය හා ත්‍රිපිටකය (Dhamma & Pali Studies)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-emerald-800 dark:text-emerald-400 block uppercase font-semibold">
                      Assigned Classes / පන්ති
                    </span>
                    <span className="font-medium text-emerald-900 dark:text-emerald-200 block truncate">
                      {resolvedClasses.length > 0
                        ? resolvedClasses.join(', ')
                        : 'ප්‍රාරම්භ, මධ්‍යම හා අවසාන පන්ති (All Pirivena Grades)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-emerald-800 dark:text-emerald-400 block uppercase font-semibold">
                      Contact / සම්බන්ධතාව
                    </span>
                    <span className="font-mono text-[11px] text-stone-700 dark:text-stone-300 block truncate font-semibold">
                      {currentUser.phone || currentUser.email || '+94 77 123 4567'}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Code & Verification Token */}
              <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-16 h-16 bg-white p-1 border-2 border-emerald-400 dark:border-emerald-400 rounded-xl flex items-center justify-center shadow-xs shrink-0 overflow-hidden relative">
                    <img
                      src={qrCodeUrl}
                      alt="Digital Teacher QR Code"
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <QrCode className="w-12 h-12 text-emerald-950 hidden" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                      Academic Verification Token
                    </div>
                    <div className="text-[9px] font-mono font-bold text-emerald-950 dark:text-emerald-100 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 truncate max-w-[140px] my-0.5">
                      {qrToken}
                    </div>
                    <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-0.5 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>VERIFIED ACADEMIC STAFF ID</span>
                    </div>
                  </div>
                </div>

                {/* Official Seal */}
                <div className="text-center">
                  <div className="w-11 h-11 rounded-full border-2 border-emerald-400 bg-emerald-400/20 flex flex-col items-center justify-center text-emerald-200 font-serif font-bold text-[9px] mx-auto leading-tight p-0.5">
                    <span>SEAL</span>
                    <span className="text-[7px]">ACADEMIC</span>
                  </div>
                  <span className="text-[8px] text-emerald-300 block mt-1 font-semibold">
                    Ratnapura
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. STUDENT ID CARD */}
          {userRole !== 'admin' && userRole !== 'superadmin' && userRole !== 'teacher' && (
            <div
              id="printable-student-id-card"
              className="bg-gradient-to-br from-amber-50 via-white to-amber-100 dark:from-stone-900 dark:via-stone-900 dark:to-amber-950/80 border-2 border-amber-400 dark:border-amber-500/80 rounded-2xl p-5 shadow-lg dark:shadow-amber-950/40 relative overflow-hidden text-stone-900 dark:text-stone-100 space-y-4"
            >
              {/* Background Watermark */}
              <div className="absolute -right-8 -bottom-8 opacity-10 dark:opacity-20 text-amber-900 dark:text-amber-400 font-serif text-9xl pointer-events-none select-none print:hidden">
                ☸
              </div>

              {/* Header */}
              <div className="text-center border-b border-amber-200 dark:border-amber-800/60 pb-3">
                <div className="text-amber-800 dark:text-amber-400 text-[10px] font-bold font-serif tracking-widest uppercase">
                  SRI LANKA MINISTRY OF EDUCATION • REGISTERED PIRIVENA
                </div>
                <h2 className="text-amber-950 dark:text-amber-100 font-serif font-extrabold text-base leading-tight mt-0.5">
                  ශ්‍රී සුමන මහා පිරිවෙන
                </h2>
                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  මුද්දුව, රත්නපුර | Sri Sumana Maha Pirivena, Ratnapura
                </p>
                <div className="mt-1.5 inline-block px-3 py-0.5 rounded-full bg-amber-200/90 dark:bg-amber-900/90 text-amber-950 dark:text-amber-100 text-[10px] font-bold border border-amber-300 dark:border-amber-700 shadow-2xs">
                  {roleBadgeLabel}
                </div>
              </div>

              {/* Content Body */}
              <div className="flex gap-4 items-center">
                {/* Photo Avatar */}
                <div className="w-22 h-26 rounded-xl bg-amber-200 dark:bg-stone-800 border-2 border-amber-500 dark:border-amber-400 flex flex-col items-center justify-center text-amber-900 dark:text-amber-200 overflow-hidden shadow-inner shrink-0 relative">
                  {currentUser.avatar ? (
                    <img
                      src={getImageUrl(currentUser.avatar)}
                      alt={currentUser.name}
                      onError={handleAvatarError}
                      className="w-full h-full object-cover"
                    />
                  ) : isMonk ? (
                    <div className="text-center">
                      <span className="text-3xl">🪷</span>
                      <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 block mt-1">
                        SAMANERA
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl">👤</span>
                      <span className="text-[9px] font-bold text-amber-800 dark:text-amber-300 block mt-1">
                        SCHOLAR
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs min-w-0 flex-1">
                  <div>
                    <span className="text-[9px] text-amber-700 dark:text-amber-400 block uppercase font-semibold">
                      Student ID / ලියාපදිංචි අංකය
                    </span>
                    <span className="font-mono font-extrabold text-amber-950 dark:text-amber-100 text-sm">
                      {currentUser.customId || currentUser.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-amber-700 dark:text-amber-400 block uppercase font-semibold">
                      Full Name / ශිෂ්‍ය නාමය
                    </span>
                    <span className="font-bold text-amber-950 dark:text-amber-100 leading-tight block truncate">
                      {displayName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-amber-700 dark:text-amber-400 block uppercase font-semibold">
                      Grade / Class (පන්තිය)
                    </span>
                    <span className="font-semibold text-amber-900 dark:text-amber-200 block truncate">
                      {displayClassName}
                    </span>
                  </div>

                  {(currentUser.guardianName || currentUser.templeName) && (
                    <div>
                      <span className="text-[9px] text-amber-700 dark:text-amber-400 block uppercase font-semibold">
                        {isMonk ? 'Temple / Incumbent (විහාරස්ථානය)' : 'Guardian (භාරකරු)'}
                      </span>
                      <span className="font-semibold text-amber-900 dark:text-amber-200 block truncate">
                        {currentUser.guardianName || currentUser.templeName}{' '}
                        {currentUser.guardianPhone ? `(${currentUser.guardianPhone})` : ''}
                      </span>
                    </div>
                  )}

                  {currentUser.nicOrBirthCert && (
                    <div>
                      <span className="text-[9px] text-amber-700 dark:text-amber-400 block uppercase font-semibold">
                        NIC / Birth Cert No.
                      </span>
                      <span className="font-mono font-semibold text-stone-700 dark:text-stone-300 block">
                        {currentUser.nicOrBirthCert}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code & Verification Token */}
              <div className="pt-3 border-t border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-16 h-16 bg-white p-1 border-2 border-amber-300 dark:border-amber-400 rounded-xl flex items-center justify-center shadow-xs shrink-0 overflow-hidden relative">
                    <img
                      src={qrCodeUrl}
                      alt="Digital Student QR Code"
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <QrCode className="w-12 h-12 text-amber-950 hidden" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase">
                      Verification Token
                    </div>
                    <div className="text-[9px] font-mono font-bold text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800/60 truncate max-w-[140px] my-0.5">
                      {qrToken}
                    </div>
                    <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-0.5 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>AUTHENTICATED DIGITAL ID</span>
                    </div>
                  </div>
                </div>

                {/* Official Seal */}
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full border border-amber-500/40 dark:border-amber-400/60 bg-amber-500/10 dark:bg-amber-400/20 flex flex-col items-center justify-center text-amber-800 dark:text-amber-300 font-serif font-bold text-[9px] mx-auto leading-tight">
                    <span>SEAL</span>
                  </div>
                  <span className="text-[8px] text-amber-800 dark:text-amber-300 block mt-0.5 font-semibold">
                    Mudduwa Pirivena
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handlePrint}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer text-white shadow-sm group ${
                userRole === 'admin' || userRole === 'superadmin'
                  ? 'bg-amber-900 hover:bg-amber-950 dark:bg-amber-800 dark:hover:bg-amber-700'
                  : userRole === 'teacher'
                    ? 'bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600'
                    : 'bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600'
              }`}
            >
              <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>{printBtnLabel}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-amber-200 hover:bg-amber-300 text-amber-950 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-amber-200 dark:border dark:border-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              වසා දමන්න
            </button>
          </div>
        </div>
        </motion.div>
      </div>
    )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
