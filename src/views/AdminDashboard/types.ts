import {
  User,
  PirivenaClass,
  Subject as BaseSubject,
  NewsArticle,
  SystemAuditLog,
  Exam,
  ExamSubmission,
  OnlineAdmission,
  DonationRecord,
  TeacherAssignment,
} from '../../types';

export type Subject = BaseSubject & {
  assignedTeacherIds?: string[];
};

export type OnlineExam = Exam;
export type AuditLog = SystemAuditLog;
export type PirivenaDonation = DonationRecord;

export type AdminTab =
  | 'overview'
  | 'students'
  | 'admissions'
  | 'teachers'
  | 'classes'
  | 'content'
  | 'audit'
  | 'exam_reviews'
  | 'site_editor'
  | 'site_news'
  | 'site_events'
  | 'site_gallery'
  | 'site_library'
  | 'site_general'
  | 'site_about'
  | 'donations_manager'
  | 'settings';

export interface SecConfig {
  enable2FA: boolean;
  masterPin: string;
  showMasterPin?: boolean;
  autoLogoutMinutes: number;
  ipWhitelistEnabled: boolean;
  allowedIps: string;
  blockSuspiciousLogins: boolean;
}

export interface ActiveSession {
  id: string;
  userId?: string;
  name?: string;
  monkName?: string;
  role?: 'admin' | 'teacher' | 'student' | string;
  class?: string;
  avatar?: string;
  device: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet' | 'native_app';
  os?: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  browser: string;
  fingerprint?: string;
  loginTime?: string;
  screenRes?: string;
  status?: 'active' | 'idle' | 'revoked';
}

export interface SecAuditLog {
  id: string;
  action: string;
  ip: string;
  time: string;
  severity: 'info' | 'warning' | 'success' | 'danger';
  details: string;
}

export interface BackupPreviewData {
  fileName: string;
  fileSizeKb: string;
  timestamp?: string;
  appName?: string;
  version?: string;
  totalRecords: number;
  tableDetails: { tableName: string; count: number }[];
  rawPayload: any;
  isSql?: boolean;
}

export interface StudentFormState {
  customId: string;
  name: string;
  monkStatus: 'monk' | 'lay';
  monkName: string;
  email: string;
  password: string;
  avatar: string;
  phone: string;
  educationCategory: string;
  classLevel: string;
  classId: string;
  academicYear: string;
  classTeacherId: string;
  subjectsAssigned: string[];
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  guardianAddress: string;
  templeName: string;
  nicOrBirthCert: string;
  status: 'active' | 'inactive';
  showPassword: boolean;
}

export interface TeacherFormState {
  customId: string;
  name: string;
  monkStatus: 'monk' | 'lay';
  monkName: string;
  email: string;
  password: string;
  avatar: string;
  phone: string;
  qualification: string;
  classesAssigned: string[];
  subjectsTaught: string[];
  categoriesTaught: string[];
  teacherAssignments: TeacherAssignment[];
  status: 'active' | 'inactive';
  showPassword: boolean;
}

export interface ClassFormState {
  category: string;
  isCustomCategory: boolean;
  customCategory: string;
  levelName: string;
  isCustomLevel: boolean;
  customLevelName: string;
  code: string;
  name: string;
  nameSinhala: string;
  teacherInChargeId: string;
  roomNumber: string;
  academicYear: string;
  studentCount: number;
  subjects: string[];
}

export interface SubjectFormState {
  code: string;
  name: string;
  nameSinhala: string;
  category: string;
  description: string;
  credits: number;
  assignedTeacherIds: string[];
}

export interface BroadcastNoticeFormState {
  title: string;
  titleSinhala: string;
  message: string;
  messageSinhala: string;
  severity: 'info' | 'warning' | 'urgent';
  targetRole: 'all' | 'students' | 'teachers';
  category: string;
  customColor: string;
  customIcon: string;
  expiryDate: string;
}

export interface ApiKeyFormState {
  geminiApiKey: string;
  openRouterApiKey: string;
  primaryProvider: string;
  fallbackProvider: string;
  geminiModel: string;
  openRouterModel: string;
  activeAiProvider: string;
}

export interface AdminSettingsFormState {
  name: string;
  nameSinhala: string;
  email: string;
  password: string;
  showPassword: boolean;
  phone: string;
  monkStatus: string;
  address: string;
}
