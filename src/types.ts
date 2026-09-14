export type UserRole = 'admin' | 'teacher' | 'student' | 'public' | 'superadmin';

export interface User {
  id: string;
  customId: string;
  username?: string;
  indexNumber?: string;
  name: string;
  nameSinhala?: string;
  email: string;
  password?: string;
  plain_password?: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  monkStatus?: 'monk' | 'lay' | 'upasampada' | 'external' | string;
  monkName?: string;
  nicOrBirthCert?: string;
  address?: string;
  joinedDate?: string;
  educationCategory?: string;
  classLevel?: string;
  classId?: string;
  pirivenaClass?: string;
  academicYear?: string;
  classTeacherId?: string;
  subjectsAssigned?: string[];
  enrolledSubjects?: string[];
  studentSubjects?: StudentSubjectAssignment[];
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  guardianAddress?: string;
  templeName?: string;
  qrCodeToken?: string;
  classesAssigned?: string[];
  subjectsTaught?: string[];
  categoriesTaught?: string[];
  teacherAssignments?: TeacherAssignment[];
  qualification?: string;
  customRemarks?: string;
  customConduct?: any;
  evaluationTerm?: string;
}

export interface TeacherAssignment {
  id?: string;
  teacherId?: string;
  classId: string;
  subjectId: string;
  className?: string;
  subjectName?: string;
}

export interface StudentSubjectAssignment {
  id?: string;
  studentId?: string;
  classId: string;
  subjectId: string;
}

export type Student = User;
export type Teacher = User;

export interface ClassTimetableSlot {
  id: string;
  classId?: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
  room?: string;
  note?: string;
}

export interface PirivenaClass {
  id: string;
  code?: string;
  name: string;
  nameSinhala?: string;
  category: string;
  levelName?: string;
  gradeLevel?: string;
  academicYear?: string;
  teacherInChargeId?: string;
  subjects?: string[];
  studentCount?: number;
  roomNumber?: string;
  timetable?: ClassTimetableSlot[];
}

export interface Subject {
  id: string;
  code?: string;
  name: string;
  nameSinhala?: string;
  category?: string;
  medium?: string;
  description?: string;
  credits?: number;
  assignedTeacherIds?: string[];
}

export interface Question {
  id: string;
  question?: string;
  questionSinhala?: string;
  text?: string;
  textSinhala?: string;
  type?: 'mcq' | 'true_false' | 'essay' | 'short_answer' | 'matching' | string;
  options?: string[];
  optionsSinhala?: string[];
  correctAnswer?: number | string;
  explanation?: string;
  explanationSinhala?: string;
  marks?: number;
  imageUrl?: string;
  required?: boolean;
}

export interface Exam {
  id: string;
  examCode?: string;
  title: string;
  titleSinhala?: string;
  subjectId: string;
  subject?: string;
  classId?: string;
  gradeClass?: string;
  teacherId?: string;
  createdBy?: string;
  durationMinutes: number;
  duration?: number;
  totalMarks: number;
  passMarks?: number;
  passingMarks?: number;
  passMark?: number;
  questions: Question[];
  status?: 'draft' | 'published' | 'archived' | string;
  published?: boolean;
  instructions?: string;
  instructionsSinhala?: string;
  attemptsAllowed?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentId: string;
  classId?: string;
  answers: Record<string, any>;
  score: number;
  passed?: boolean;
  submittedAt?: string;
  teacherFeedback?: string;
  status?: string;
  startedAt?: string;
  certificateId?: string;
  graded?: boolean;
}

export interface StudyMaterial {
  id: string;
  title: string;
  titleSinhala?: string;
  description?: string;
  type: 'pdf' | 'notes' | 'past_paper' | 'audio' | 'video' | 'other' | string;
  subjectId: string;
  classId?: string;
  uploadedByTeacherId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  dateUploaded?: string;
}

export interface OnlineAdmission {
  id: string;
  applicantName: string;
  titlePrefix?: string;
  monkStatus?: 'monk' | 'lay' | 'upasampada' | 'external' | string;
  monkName?: string;
  dob?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  guardianAddress?: string;
  phone?: string;
  whatsappPhone?: string;
  address?: string;
  district?: string;
  templeName?: string;
  nikayaChapter?: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  submittedAt?: string;
  submittedDate?: string;
  dateSubmitted?: string;
  trackingId?: string;
  appliedClass?: string;
  preferredSection?: string;
  calculatedAge?: number;
  previousSchool?: string;
  hostelRequired?: string | boolean;
  specialTalents?: string;
  additionalNotes?: string;
  nicOrBirthCert?: string;
}

export interface DonationRecord {
  id: string;
  donorName: string;
  amount?: number;
  cause?: string;
  date: string;
  receiptNo?: string;
  contactNumber?: string;
  notes?: string;
  status?: string;
  type?: any;
  amountOrItems?: string;
  amountNumeric?: number;
  dedicationWish?: string;
  contactPhone?: string;
  slipUrl?: string;
  slipFileName?: string;
  receiptId?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  titleSinhala?: string;
  summary?: string;
  summarySinhala?: string;
  content: string;
  contentSinhala?: string;
  imageUrl?: string;
  category?: string;
  date?: string;
  publishedDate?: string;
  author?: string;
}

export interface PirivenaEvent {
  id: string;
  title: string;
  titleSinhala?: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  descriptionSinhala?: string;
  imageUrl?: string;
  category?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  titleSinhala?: string;
  category: string;
  type?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  url?: string;
  caption?: string;
  date?: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  titleSinhala?: string;
  author: string;
  category: string;
  educationCategory?: string;
  paperType?: string;
  paperYear?: string;
  paperTerm?: string;
  medium?: string;
  pdfUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  isDigital?: boolean;
  physicalCopiesCount?: number;
  availableCopiesCount?: number;
  gradeLevel?: string;
  isbn?: string;
  copies?: number;
  availableCopies?: number;
  coverImage?: string;
  description?: string;
}

export interface BroadcastNotice {
  id: string;
  title?: string;
  titleSinhala?: string;
  message: string;
  messageSinhala?: string;
  type?: 'info' | 'warning' | 'urgent' | string;
  severity?: string;
  targetAudience?: 'all' | 'students' | 'teachers' | string;
  targetRole?: string;
  category?: string;
  attachmentUrl?: string;
  createdAt: string;
  createdBy?: string;
  active: boolean;
  customColor?: string;
  customIcon?: string;
  expiryDate?: string;
}

export type ActivityCategory =
  | 'enrollment'
  | 'grades'
  | 'exam'
  | 'material'
  | 'admission'
  | 'attendance'
  | 'notice'
  | 'system';

export interface ActivityItem {
  id: string;
  actor: string;
  userName?: string;
  actorRole?: 'admin' | 'teacher' | 'student' | 'donor' | 'public' | 'system';
  action: string;
  details?: string;
  category: ActivityCategory;
  timestamp: string;
  created_at?: string;
  metadata?: {
    studentName?: string;
    studentId?: string;
    examTitle?: string;
    score?: number | string;
    className?: string;
    subjectName?: string;
    trackingId?: string;
    materialTitle?: string;
    [key: string]: any;
  };
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  actor?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  category?: ActivityCategory;
  actorRole?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface CertificateInfo {
  certificateId: string;
  studentName: string;
  studentCustomId?: string;
  customId: string;
  courseName?: string;
  courseTitle?: string;
  issueDate: string;
  verified?: boolean;
  verifiedType?: string;
  avatar?: string;
  role?: string;
  grade?: string;
  nicOrBirthCert?: string;
  issuedBy?: string;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'admin' | 'superadmin' | 'teacher' | 'student' | string;
  sender_avatar?: string | null;
  message_type: 'text' | 'image' | 'file' | 'link';
  content: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: string | null;
  reactions?: ChatReaction[];
  reply_to_id?: string | null;
  reply_to_name?: string | null;
  reply_to_content?: string | null;
  is_pinned?: boolean;
  created_at: string;
  expires_at: string;
}

