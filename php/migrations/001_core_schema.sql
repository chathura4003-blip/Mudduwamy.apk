-- ============================================================
-- Migration: 001_core_schema.sql
-- Description: Core Schema Initialization (Safe & Non-Destructive)
-- Target: Sri Sumana Maha Pirivena ERP
-- ============================================================

-- 1. Users Table (Core authentication & role-based access)
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(64) PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `plain_password` VARCHAR(255) DEFAULT NULL,
    `monkName` VARCHAR(255) DEFAULT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `phone` VARCHAR(50) DEFAULT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'student',
    `indexNumber` VARCHAR(50) DEFAULT NULL,
    `customId` VARCHAR(100) DEFAULT NULL,
    `nic` VARCHAR(100) DEFAULT NULL,
    `pirivenaClass` VARCHAR(100) DEFAULT NULL,
    `classId` VARCHAR(64) DEFAULT NULL,
    `avatar` MEDIUMTEXT DEFAULT NULL,
    `guardianName` VARCHAR(255) DEFAULT NULL,
    `guardianPhone` VARCHAR(50) DEFAULT NULL,
    `guardianRelation` VARCHAR(100) DEFAULT NULL,
    `guardianAddress` TEXT DEFAULT NULL,
    `emergencyContact` VARCHAR(50) DEFAULT NULL,
    `address` TEXT DEFAULT NULL,
    `token` VARCHAR(255) DEFAULT NULL,
    `status` VARCHAR(50) DEFAULT 'active',
    `monkStatus` VARCHAR(50) DEFAULT 'monk',
    `qualification` VARCHAR(255) DEFAULT NULL,
    `qualifications` VARCHAR(255) DEFAULT NULL,
    `specialization` VARCHAR(255) DEFAULT NULL,
    `registrationNumber` VARCHAR(100) DEFAULT NULL,
    `classesAssigned` TEXT DEFAULT NULL,
    `subjectsTaught` TEXT DEFAULT NULL,
    `categoriesTaught` TEXT DEFAULT NULL,
    `subjectsAssigned` TEXT DEFAULT NULL,
    `enrolledSubjects` TEXT DEFAULT NULL,
    `educationCategory` VARCHAR(100) DEFAULT NULL,
    `classLevel` VARCHAR(100) DEFAULT NULL,
    `academicYear` VARCHAR(50) DEFAULT '2025/2026',
    `classTeacherId` VARCHAR(64) DEFAULT NULL,
    `templeName` VARCHAR(255) DEFAULT NULL,
    `nicOrBirthCert` VARCHAR(100) DEFAULT NULL,
    `dateOfBirth` DATE DEFAULT NULL,
    `joinedDate` DATE DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS `students` (
    `id` VARCHAR(64) PRIMARY KEY,
    `customId` VARCHAR(100) DEFAULT NULL,
    `indexNumber` VARCHAR(100) DEFAULT NULL,
    `admissionNo` VARCHAR(100) DEFAULT NULL,
    `name` VARCHAR(255) NOT NULL,
    `monkName` VARCHAR(255) DEFAULT NULL,
    `classId` VARCHAR(64) DEFAULT NULL,
    `pirivenaClass` VARCHAR(100) DEFAULT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `phone` VARCHAR(50) DEFAULT NULL,
    `guardianName` VARCHAR(255) DEFAULT NULL,
    `guardianPhone` VARCHAR(50) DEFAULT NULL,
    `emergencyContact` VARCHAR(50) DEFAULT NULL,
    `address` TEXT DEFAULT NULL,
    `dateOfBirth` DATE DEFAULT NULL,
    `enrolledSubjects` TEXT DEFAULT NULL,
    `subjectsAssigned` TEXT DEFAULT NULL,
    `status` VARCHAR(50) DEFAULT 'active',
    `joinedDate` DATE DEFAULT NULL,
    `token` VARCHAR(255) DEFAULT NULL,
    `plain_password` VARCHAR(255) DEFAULT NULL,
    `avatar` MEDIUMTEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Teachers Table
CREATE TABLE IF NOT EXISTS `teachers` (
    `id` VARCHAR(64) PRIMARY KEY,
    `customId` VARCHAR(100) DEFAULT NULL,
    `name` VARCHAR(255) NOT NULL,
    `monkName` VARCHAR(255) DEFAULT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `phone` VARCHAR(50) DEFAULT NULL,
    `nic` VARCHAR(50) DEFAULT NULL,
    `qualifications` VARCHAR(255) DEFAULT NULL,
    `qualification` VARCHAR(255) DEFAULT NULL,
    `specialization` VARCHAR(255) DEFAULT NULL,
    `registrationNumber` VARCHAR(100) DEFAULT NULL,
    `classesAssigned` TEXT DEFAULT NULL,
    `subjectsTaught` TEXT DEFAULT NULL,
    `categoriesTaught` TEXT DEFAULT NULL,
    `status` VARCHAR(50) DEFAULT 'active',
    `plain_password` VARCHAR(255) DEFAULT NULL,
    `token` VARCHAR(255) DEFAULT NULL,
    `avatar` MEDIUMTEXT DEFAULT NULL,
    `photoUrl` VARCHAR(500) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Classes Table
CREATE TABLE IF NOT EXISTS `classes` (
    `id` VARCHAR(64) PRIMARY KEY,
    `className` VARCHAR(100) NOT NULL,
    `classNameSinhala` VARCHAR(100) NOT NULL,
    `gradeLevel` VARCHAR(50) NOT NULL,
    `classTeacher` VARCHAR(255) DEFAULT NULL,
    `studentCount` INT DEFAULT 0,
    `academicYear` VARCHAR(20) DEFAULT '2025/2026',
    `roomNumber` VARCHAR(100) DEFAULT 'දේශන ශාලාව 01',
    `code` VARCHAR(50) DEFAULT NULL,
    `subjects` LONGTEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Subjects Table
CREATE TABLE IF NOT EXISTS `subjects` (
    `id` VARCHAR(64) PRIMARY KEY,
    `subjectCode` VARCHAR(50) NOT NULL,
    `subjectName` VARCHAR(255) NOT NULL,
    `subjectNameSinhala` VARCHAR(255) NOT NULL,
    `gradeLevel` VARCHAR(50) DEFAULT 'All',
    `category` VARCHAR(100) DEFAULT 'General',
    `credits` INT DEFAULT 4,
    `description` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Teacher Assignments Table
CREATE TABLE IF NOT EXISTS `teacher_assignments` (
    `id` VARCHAR(64) PRIMARY KEY,
    `teacher_id` VARCHAR(64) NOT NULL,
    `class_id` VARCHAR(64) NOT NULL,
    `subject_id` VARCHAR(64) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Student Subjects Table
CREATE TABLE IF NOT EXISTS `student_subjects` (
    `id` VARCHAR(64) PRIMARY KEY,
    `student_id` VARCHAR(64) NOT NULL,
    `class_id` VARCHAR(64) NOT NULL,
    `subject_id` VARCHAR(64) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Exams Table
CREATE TABLE IF NOT EXISTS `exams` (
    `id` VARCHAR(64) PRIMARY KEY,
    `examCode` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(100) NOT NULL,
    `gradeClass` VARCHAR(50) NOT NULL,
    `classId` VARCHAR(64) DEFAULT NULL,
    `teacherId` VARCHAR(64) DEFAULT NULL,
    `duration` INT DEFAULT 60,
    `durationMinutes` INT DEFAULT 60,
    `passMark` INT DEFAULT 40,
    `totalMarks` INT DEFAULT 100,
    `status` VARCHAR(50) DEFAULT 'published',
    `published` TINYINT(1) DEFAULT 1,
    `questionsJson` LONGTEXT DEFAULT NULL,
    `questions` LONGTEXT DEFAULT NULL,
    `scheduledDate` DATETIME DEFAULT NULL,
    `startDate` DATETIME DEFAULT NULL,
    `endDate` DATETIME DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Exam Submissions Table
CREATE TABLE IF NOT EXISTS `exam_submissions` (
    `id` VARCHAR(64) PRIMARY KEY,
    `examId` VARCHAR(64) NOT NULL,
    `studentId` VARCHAR(64) NOT NULL,
    `studentName` VARCHAR(255) DEFAULT NULL,
    `studentAvatar` MEDIUMTEXT DEFAULT NULL,
    `answersJson` LONGTEXT DEFAULT NULL,
    `answers` LONGTEXT DEFAULT NULL,
    `marksObtained` DECIMAL(5,2) DEFAULT 0,
    `score` DECIMAL(5,2) DEFAULT 0,
    `totalMarks` INT DEFAULT 100,
    `timeTaken` INT DEFAULT NULL,
    `status` VARCHAR(50) DEFAULT 'submitted',
    `submittedAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Study Materials Table
CREATE TABLE IF NOT EXISTS `study_materials` (
    `id` VARCHAR(64) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `titleSinhala` VARCHAR(255) DEFAULT NULL,
    `subject` VARCHAR(100) NOT NULL,
    `subjectId` VARCHAR(64) DEFAULT NULL,
    `gradeClass` VARCHAR(50) DEFAULT 'All',
    `classId` VARCHAR(64) DEFAULT NULL,
    `uploadedByTeacherId` VARCHAR(64) DEFAULT NULL,
    `fileName` VARCHAR(255) DEFAULT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `fileType` VARCHAR(50) DEFAULT 'pdf',
    `type` VARCHAR(50) DEFAULT 'pdf',
    `fileSize` VARCHAR(50) DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `uploadedBy` VARCHAR(255) DEFAULT 'ආචාර්ය මණ්ඩලය',
    `dateUploaded` DATE DEFAULT NULL,
    `uploadedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Broadcast Notices Table
CREATE TABLE IF NOT EXISTS `broadcast_notices` (
    `id` VARCHAR(64) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `titleSinhala` VARCHAR(255) DEFAULT NULL,
    `message` TEXT NOT NULL,
    `messageSinhala` TEXT DEFAULT NULL,
    `severity` VARCHAR(50) DEFAULT 'info',
    `targetRole` VARCHAR(50) DEFAULT 'all',
    `category` VARCHAR(100) DEFAULT 'General',
    `active` TINYINT(1) DEFAULT 1,
    `createdBy` VARCHAR(255) DEFAULT 'පිරිවෙන් පාලක සභාව',
    `expiryDate` DATE DEFAULT NULL,
    `customColor` VARCHAR(50) DEFAULT NULL,
    `customIcon` VARCHAR(50) DEFAULT NULL,
    `attachmentUrl` VARCHAR(500) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Admissions Table
CREATE TABLE IF NOT EXISTS `admissions` (
    `id` VARCHAR(64) PRIMARY KEY,
    `trackingId` VARCHAR(50) NOT NULL UNIQUE,
    `fullName` VARCHAR(255) NOT NULL,
    `monkName` VARCHAR(255) DEFAULT NULL,
    `guardianName` VARCHAR(255) DEFAULT NULL,
    `phone` VARCHAR(50) DEFAULT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `address` TEXT DEFAULT NULL,
    `gradeApplying` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'pending',
    `dateSubmitted` DATE NOT NULL,
    `notes` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Library Table
CREATE TABLE IF NOT EXISTS `library` (
    `id` VARCHAR(64) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `titleSinhala` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(100) NOT NULL,
    `grade` VARCHAR(50) NOT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `pdfUrl` VARCHAR(500) DEFAULT NULL,
    `fileSize` VARCHAR(50) DEFAULT NULL,
    `fileType` VARCHAR(50) DEFAULT 'pdf',
    `author` VARCHAR(255) DEFAULT NULL,
    `downloadCount` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Donations Table
CREATE TABLE IF NOT EXISTS `donations` (
    `id` VARCHAR(64) PRIMARY KEY,
    `receiptId` VARCHAR(100) NOT NULL,
    `donorName` VARCHAR(255) NOT NULL,
    `donorPhone` VARCHAR(50) DEFAULT NULL,
    `contactPhone` VARCHAR(50) DEFAULT NULL,
    `donorEmail` VARCHAR(255) DEFAULT NULL,
    `amount` DECIMAL(12,2) NOT NULL DEFAULT 1000.00,
    `amountOrItems` VARCHAR(255) DEFAULT NULL,
    `cause` VARCHAR(255) DEFAULT 'පිරිවෙන් සංවර්ධන අරමුදල',
    `type` VARCHAR(255) DEFAULT 'පිරිවෙන් සංවර්ධන අරමුදල',
    `receiptUrl` MEDIUMTEXT DEFAULT NULL,
    `slipUrl` MEDIUMTEXT DEFAULT NULL,
    `slipFileName` VARCHAR(255) DEFAULT NULL,
    `dedicationWish` TEXT DEFAULT NULL,
    `paymentMethod` VARCHAR(50) DEFAULT 'Bank Transfer',
    `status` VARCHAR(50) DEFAULT 'pending',
    `isAnonymous` TINYINT(1) DEFAULT 0,
    `date` DATE NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Site Settings Table
CREATE TABLE IF NOT EXISTS `site_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` LONGTEXT DEFAULT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Custom Categories Table
CREATE TABLE IF NOT EXISTS `custom_categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `section` VARCHAR(50) NOT NULL,
    `category_code` VARCHAR(50) NOT NULL,
    `name_sinhala` VARCHAR(255) NOT NULL,
    `name_english` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `is_default` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. News Table
CREATE TABLE IF NOT EXISTS `news` (
    `id` VARCHAR(64) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `titleSinhala` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'General',
    `summary` TEXT DEFAULT NULL,
    `summarySinhala` TEXT DEFAULT NULL,
    `content` LONGTEXT DEFAULT NULL,
    `contentSinhala` LONGTEXT DEFAULT NULL,
    `imageUrl` MEDIUMTEXT DEFAULT NULL,
    `author` VARCHAR(255) DEFAULT 'පිරිවෙන් පාලක සභාව',
    `publishedDate` DATE NOT NULL,
    `isFeatured` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Events Table
CREATE TABLE IF NOT EXISTS `events` (
    `id` VARCHAR(64) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `titleSinhala` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(100) DEFAULT NULL,
    `location` VARCHAR(255) DEFAULT 'ශ්‍රී සුමන මහා පිරිවෙන් ශාලාව',
    `category` VARCHAR(100) DEFAULT 'Religious',
    `description` TEXT DEFAULT NULL,
    `descriptionSinhala` TEXT DEFAULT NULL,
    `imageUrl` MEDIUMTEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Gallery Table
CREATE TABLE IF NOT EXISTS `gallery` (
    `id` VARCHAR(64) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `titleSinhala` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'Events',
    `imageUrl` MEDIUMTEXT DEFAULT NULL,
    `description` TEXT DEFAULT NULL,
    `descriptionSinhala` TEXT DEFAULT NULL,
    `date` DATE DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Circular Downloads Table
CREATE TABLE IF NOT EXISTS `circular_downloads` (
    `id` VARCHAR(64) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `titleSinhala` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'General',
    `fileUrl` VARCHAR(500) NOT NULL,
    `fileSize` VARCHAR(50) DEFAULT NULL,
    `fileType` VARCHAR(50) DEFAULT 'pdf',
    `publishedDate` DATE NOT NULL,
    `downloadCount` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` VARCHAR(64) PRIMARY KEY,
    `userId` VARCHAR(64) DEFAULT NULL,
    `userName` VARCHAR(255) DEFAULT NULL,
    `actor` VARCHAR(255) DEFAULT NULL,
    `action` VARCHAR(255) NOT NULL,
    `details` TEXT DEFAULT NULL,
    `ipAddress` VARCHAR(50) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. AI Rate Limits Table
CREATE TABLE IF NOT EXISTS `ai_rate_limits` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `client_identifier` VARCHAR(100) NOT NULL,
    `request_time` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
