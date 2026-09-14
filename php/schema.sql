-- ============================================================
-- ☸ Sri Sumana Maha Pirivena ERP - Production Database Schema
-- Clean, Production-Grade Schema with Single Superadmin Account
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. NON-DESTRUCTIVE SAFE SCHEMA
-- Drops removed to prevent accidental data loss in production environments

-- Admissions Table
CREATE TABLE `admissions` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trackingId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monkName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardianName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `gradeApplying` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `dateSubmitted` date NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tracking_id` (`trackingId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs Table
CREATE TABLE `audit_logs` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `ipAddress` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Broadcast Notices Table
CREATE TABLE `broadcast_notices` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titleSinhala` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `messageSinhala` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `severity` enum('info','warning','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `targetRole` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'General',
  `active` tinyint(1) DEFAULT '1',
  `createdBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'පිරිවෙන් පාලක සභාව',
  `expiryDate` date DEFAULT NULL,
  `customColor` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customIcon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attachmentUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Circular Downloads Table
CREATE TABLE `circular_downloads` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titleSinhala` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Circulars',
  `fileUrl` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileSize` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pdf',
  `publishedDate` date NOT NULL,
  `downloadCount` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Classes Table
CREATE TABLE `classes` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `roomNumber` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'දේශන ශාලාව 01',
  `className` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `classNameSinhala` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gradeLevel` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `classTeacher` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `studentCount` int DEFAULT '0',
  `academicYear` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '2025/2026',
  `subjects` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Custom Categories Table
CREATE TABLE `custom_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'news, gallery, library, events, study_materials',
  `category_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_sinhala` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_english` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_section` (`section`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Categories Pre-population
INSERT INTO `custom_categories` (`id`, `section`, `category_code`, `name_sinhala`, `name_english`, `description`, `is_default`, `created_at`) VALUES
(1, 'news', 'General', 'සාමාන්‍ය පුවත්', 'General News', 'සාමාන්‍ය පිරිවෙන් පුවත් හා තොරතුරු', 1, CURRENT_TIMESTAMP),
(2, 'news', 'Academic', 'ශාස්ත්‍රීය හා අධ්‍යාපනික', 'Academic & Studies', 'විභාග හා ශාස්ත්‍රීය ලිපි', 1, CURRENT_TIMESTAMP),
(3, 'news', 'Events', 'උත්සව හා පින්කම්', 'Events & Ceremonies', 'පිරිවෙනේ සංවිධානය වන විශේෂ පින්කම්', 1, CURRENT_TIMESTAMP),
(4, 'gallery', 'Events', 'පින්කම් හා උත්සව', 'Ceremonies', 'පිරිවෙනේ සංවිධානය වූ උත්සව', 1, CURRENT_TIMESTAMP),
(5, 'gallery', 'Campus', 'පිරිවෙන් භූමිය', 'Campus & Architecture', 'පිරිවෙනේ ගොඩනැගිලි හා පරිසරය', 1, CURRENT_TIMESTAMP),
(6, 'library', 'Pali', 'පාලි භාෂාව හා සාහිත්‍යය', 'Pali Language', 'පාලි ව්‍යාකරණ හා නිබන්ධන', 1, CURRENT_TIMESTAMP),
(7, 'library', 'Sanskrit', 'සංස්කෘත භාෂාව', 'Sanskrit', 'සංස්කෘත ව්‍යාකරණ හා මහා කාව්‍ය', 1, CURRENT_TIMESTAMP),
(8, 'library', 'Sinhala', 'සිංහල සාහිත්‍යය', 'Sinhala Literature', 'සිංහල සම්භාව්‍ය සාහිත්‍යය', 1, CURRENT_TIMESTAMP);

-- Donations Table
CREATE TABLE `donations` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiptId` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `donorName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `donorPhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactPhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `donorEmail` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '1000.00',
  `amountOrItems` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cause` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'පිරිවෙන් සංවර්ධන අරමුදල',
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'පිරිවෙන් සංවර්ධන අරමුදල',
  `receiptUrl` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slipUrl` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slipFileName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dedicationWish` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentMethod` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Bank Transfer',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `isAnonymous` tinyint(1) DEFAULT '0',
  `date` date NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_receipt_id` (`receiptId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events Table
CREATE TABLE `events` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titleSinhala` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `time` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'ශ්‍රී සුමන මහා පිරිවෙන් ශාලාව',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Religious',
  `description` text COLLATE utf8mb4_unicode_ci,
  `descriptionSinhala` text COLLATE utf8mb4_unicode_ci,
  `imageUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exam Submissions Table
CREATE TABLE `exam_submissions` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `examId` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentId` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `studentName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `answersJson` longtext COLLATE utf8mb4_unicode_ci,
  `answers` longtext COLLATE utf8mb4_unicode_ci,
  `marksObtained` decimal(5,2) DEFAULT '0.00',
  `score` decimal(5,2) DEFAULT '0.00',
  `totalMarks` decimal(5,2) DEFAULT '100.00',
  `percentage` decimal(5,2) DEFAULT '0.00',
  `status` enum('submitted','graded','review_requested','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'submitted',
  `submittedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `gradedAt` datetime DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_exam_student` (`examId`,`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exams Table
CREATE TABLE `exams` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `examCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gradeClass` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `classId` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `durationMinutes` int DEFAULT '60',
  `duration` int DEFAULT '60',
  `totalMarks` int DEFAULT '100',
  `passMark` int DEFAULT '40',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'published',
  `published` tinyint(1) DEFAULT '1',
  `scheduledDate` datetime DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `endDate` datetime DEFAULT NULL,
  `questionsJson` longtext COLLATE utf8mb4_unicode_ci,
  `questions` longtext COLLATE utf8mb4_unicode_ci,
  `createdBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teacherId` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_exam_code` (`examCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gallery Table
CREATE TABLE `gallery` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titleSinhala` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'General',
  `imageUrl` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` text COLLATE utf8mb4_unicode_ci,
  `captionSinhala` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `descriptionSinhala` text COLLATE utf8mb4_unicode_ci,
  `date` date DEFAULT NULL,
  `dateAdded` date DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Library Table
CREATE TABLE `library` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bookCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titleSinhala` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'General',
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'General',
  `grade` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'All',
  `sectionLevel` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'All',
  `copies` int DEFAULT '1',
  `availableCopies` int DEFAULT '1',
  `fileUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pdfUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileSize` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '2.5 MB',
  `coverUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isbn` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- News Table
CREATE TABLE `news` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titleSinhala` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'General',
  `summary` text COLLATE utf8mb4_unicode_ci,
  `summarySinhala` text COLLATE utf8mb4_unicode_ci,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `contentSinhala` longtext COLLATE utf8mb4_unicode_ci,
  `imageUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `author` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'පිරිවෙන් පාලක සභාව',
  `publishedDate` date NOT NULL,
  `isFeatured` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Site Settings Table
CREATE TABLE `site_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` longtext COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Study Materials Table
CREATE TABLE `study_materials` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titleSinhala` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subjectId` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gradeClass` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'All',
  `classId` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileUrl` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fileType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pdf',
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pdf',
  `fileSize` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploadedBy` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'ආචාර්ය මණ්ඩලය',
  `uploadedByTeacherId` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateUploaded` date DEFAULT NULL,
  `uploadedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subjects Table
CREATE TABLE `subjects` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subjectCode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subjectName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subjectNameSinhala` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gradeLevel` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'All',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'General',
  `credits` int DEFAULT '4',
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teachers Table
CREATE TABLE `teachers` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monkName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nic` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualifications` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `classesAssigned` text COLLATE utf8mb4_unicode_ci,
  `subjectsTaught` text COLLATE utf8mb4_unicode_ci,
  `categoriesTaught` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `joinedDate` date DEFAULT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plain_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students Table
CREATE TABLE `students` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `indexNumber` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admissionNo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monkName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `classId` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pirivenaClass` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardianName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardianPhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergencyContact` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `dateOfBirth` date DEFAULT NULL,
  `enrolledSubjects` text COLLATE utf8mb4_unicode_ci,
  `subjectsAssigned` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `joinedDate` date DEFAULT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plain_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teacher Assignments Table
CREATE TABLE `teacher_assignments` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacher_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `class_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_teacher` (`teacher_id`),
  KEY `idx_class` (`class_id`),
  KEY `idx_subject` (`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Subjects Table
CREATE TABLE `student_subjects` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `class_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_class` (`class_id`),
  KEY `idx_subject` (`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users Table (Main System Authentication)
CREATE TABLE `users` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monkName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `indexNumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customId` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nic` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pirivenaClass` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `classId` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardianName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardianPhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardianRelation` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardianAddress` text COLLATE utf8mb4_unicode_ci,
  `templeName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nicOrBirthCert` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `educationCategory` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `classLevel` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `academicYear` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '2025/2026',
  `classTeacherId` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monkStatus` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'monk',
  `token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plain_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `classesAssigned` text COLLATE utf8mb4_unicode_ci,
  `subjectsTaught` text COLLATE utf8mb4_unicode_ci,
  `categoriesTaught` text COLLATE utf8mb4_unicode_ci,
  `subjectsAssigned` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ONLY 1 SUPERADMIN USER CREATED (No dummy data)
INSERT INTO `users` (
  `id`, `username`, `password`, `monkName`, `name`, `email`, `phone`, `role`, 
  `indexNumber`, `customId`, `nic`, `pirivenaClass`, `avatar`, `guardianName`, 
  `guardianPhone`, `token`, `plain_password`, `status`, `created_at`, `updated_at`
) VALUES (
  'usr-admin-01',
  'admin',
  '$2y$10$hDhT0WoVT6Muvbo6MCANTu4PG780Fr7nZ0e4indjoCOPU8TRncbHW',
  'පූජ්‍ය ශ්‍රී සුමන නායක හිමි',
  'ප්‍රධාන පරිපාලක (System Administrator)',
  'admin@pirivena.lk',
  '0712345678',
  'superadmin',
  'ADM-001',
  'ADM-001',
  NULL,
  'පාලක මණ්ඩලය',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

SET FOREIGN_KEY_CHECKS = 1;
