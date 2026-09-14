-- ============================================================
-- Migration: 002_performance_indexes.sql
-- Description: High-Performance Lookup, Foreign-Key & Compound Indexes
-- Target: Sub-150ms Query Times for Mobile APK
-- ============================================================

-- Users Indexes
ALTER TABLE `users` ADD INDEX `idx_user_role_status` (`role`, `status`);
ALTER TABLE `users` ADD INDEX `idx_user_classId` (`classId`);
ALTER TABLE `users` ADD INDEX `idx_user_customId` (`customId`);
ALTER TABLE `users` ADD INDEX `idx_user_indexNumber` (`indexNumber`);
ALTER TABLE `users` ADD INDEX `idx_user_token` (`token`(64));

-- Students Indexes
ALTER TABLE `students` ADD INDEX `idx_stu_classId` (`classId`);
ALTER TABLE `students` ADD INDEX `idx_stu_customId` (`customId`);
ALTER TABLE `students` ADD INDEX `idx_stu_indexNumber` (`indexNumber`);
ALTER TABLE `students` ADD INDEX `idx_stu_status` (`status`);

-- Teachers Indexes
ALTER TABLE `teachers` ADD INDEX `idx_tch_customId` (`customId`);
ALTER TABLE `teachers` ADD INDEX `idx_tch_status` (`status`);

-- Classes Indexes
ALTER TABLE `classes` ADD INDEX `idx_cls_code` (`code`);
ALTER TABLE `classes` ADD INDEX `idx_cls_grade` (`gradeLevel`);

-- Subjects Indexes
ALTER TABLE `subjects` ADD INDEX `idx_sub_code` (`subjectCode`);
ALTER TABLE `subjects` ADD INDEX `idx_sub_grade` (`gradeLevel`);

-- Teacher Assignments Compound & Foreign Key Indexes
ALTER TABLE `teacher_assignments` ADD INDEX `idx_ta_compound` (`teacher_id`, `class_id`, `subject_id`);
ALTER TABLE `teacher_assignments` ADD INDEX `idx_ta_teacher` (`teacher_id`);
ALTER TABLE `teacher_assignments` ADD INDEX `idx_ta_class` (`class_id`);
ALTER TABLE `teacher_assignments` ADD INDEX `idx_ta_subject` (`subject_id`);

-- Student Subjects Compound & Foreign Key Indexes
ALTER TABLE `student_subjects` ADD INDEX `idx_ss_compound` (`student_id`, `class_id`, `subject_id`);
ALTER TABLE `student_subjects` ADD INDEX `idx_ss_student` (`student_id`);
ALTER TABLE `student_subjects` ADD INDEX `idx_ss_class` (`class_id`);
ALTER TABLE `student_subjects` ADD INDEX `idx_ss_subject` (`subject_id`);

-- Exams Indexes
ALTER TABLE `exams` ADD INDEX `idx_exam_status_pub` (`status`, `published`);
ALTER TABLE `exams` ADD INDEX `idx_exam_class_subj` (`gradeClass`, `subject`);
ALTER TABLE `exams` ADD INDEX `idx_exam_classId` (`classId`);
ALTER TABLE `exams` ADD INDEX `idx_exam_teacherId` (`teacherId`);
ALTER TABLE `exams` ADD INDEX `idx_exam_scheduled` (`scheduledDate`);

-- Exam Submissions Indexes
ALTER TABLE `exam_submissions` ADD INDEX `idx_sub_exam_student` (`examId`, `studentId`);
ALTER TABLE `exam_submissions` ADD INDEX `idx_sub_student` (`studentId`);
ALTER TABLE `exam_submissions` ADD INDEX `idx_sub_status` (`status`);
ALTER TABLE `exam_submissions` ADD INDEX `idx_sub_submitted` (`submittedAt`);

-- Study Materials Indexes
ALTER TABLE `study_materials` ADD INDEX `idx_mat_class` (`classId`);
ALTER TABLE `study_materials` ADD INDEX `idx_mat_subject` (`subject`);
ALTER TABLE `study_materials` ADD INDEX `idx_mat_subjectId` (`subjectId`);
ALTER TABLE `study_materials` ADD INDEX `idx_mat_teacher` (`uploadedByTeacherId`);

-- Broadcast Notices Indexes
ALTER TABLE `broadcast_notices` ADD INDEX `idx_bn_active_role` (`active`, `targetRole`);
ALTER TABLE `broadcast_notices` ADD INDEX `idx_bn_expiry` (`expiryDate`);
ALTER TABLE `broadcast_notices` ADD INDEX `idx_bn_created` (`created_at`);

-- Admissions Indexes
ALTER TABLE `admissions` ADD INDEX `idx_adm_status_date` (`status`, `dateSubmitted`);
ALTER TABLE `admissions` ADD INDEX `idx_adm_grade` (`gradeApplying`);

-- Library Indexes
ALTER TABLE `library` ADD INDEX `idx_lib_grade_subj` (`grade`, `subject`);
ALTER TABLE `library` ADD INDEX `idx_lib_created` (`created_at`);

-- Donations Indexes
ALTER TABLE `donations` ADD INDEX `idx_don_status_date` (`status`, `date`);
ALTER TABLE `donations` ADD INDEX `idx_don_receipt` (`receiptId`);

-- News & Events Indexes
ALTER TABLE `news` ADD INDEX `idx_news_pub_feat` (`publishedDate`, `isFeatured`);
ALTER TABLE `news` ADD INDEX `idx_news_created` (`created_at`);
ALTER TABLE `events` ADD INDEX `idx_event_date` (`date`, `created_at`);
ALTER TABLE `gallery` ADD INDEX `idx_gal_cat` (`category`, `created_at`);
ALTER TABLE `circular_downloads` ADD INDEX `idx_circ_date` (`publishedDate`);

-- Audit Logs Indexes
ALTER TABLE `audit_logs` ADD INDEX `idx_audit_user` (`userId`, `created_at`);

-- AI Rate Limits Index
ALTER TABLE `ai_rate_limits` ADD INDEX `idx_ai_client_time` (`client_identifier`, `request_time`);
