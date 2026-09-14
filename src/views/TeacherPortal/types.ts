export type { Exam, User, PirivenaClass, Subject, StudyMaterial, Question } from '../../types';
import type { Exam, User, PirivenaClass, Subject, StudyMaterial, Question } from '../../types';

export type ClassItem = PirivenaClass;
export type SubjectItem = Subject;

export type TeacherPortalTab = 'overview' | 'monitoring' | 'roster' | 'exams' | 'materials' | 'settings' | 'timetable';

export interface MonitoringStats {
  totalStudents: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  passCount: number;
  failCount: number;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
}

export interface StudentStatusItem {
  id: string;
  name: string;
  monkName?: string;
  monkStatus?: 'monk' | 'lay';
  customId?: string;
  status: 'completed' | 'in_progress' | 'not_started';
  score: number | null;
  submission: any | null;
}

export interface MonitoringData {
  exam: Exam;
  stats: MonitoringStats;
  studentStatuses: StudentStatusItem[];
  questionStats?: {
    questionId: string;
    text: string;
    correctCount: number;
    totalAnswers: number;
    accuracyRate: number;
  }[];
}
