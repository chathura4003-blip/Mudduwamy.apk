-- ============================================================
-- Migration: 003_foreign_keys_and_constraints.sql
-- Description: Referential Integrity & Data Consistency Rules
-- Target: Sri Sumana Maha Pirivena ERP
-- ============================================================

-- Normalize character sets across all tables to avoid collation mismatch in joins
ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `students` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `teachers` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `classes` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `subjects` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `teacher_assignments` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `student_subjects` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `exams` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `exam_submissions` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `study_materials` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Enforce Unique Constraints where appropriate
ALTER TABLE `classes` ADD UNIQUE KEY `uq_class_name` (`className`);
ALTER TABLE `subjects` ADD UNIQUE KEY `uq_subject_code` (`subjectCode`);
ALTER TABLE `teacher_assignments` ADD UNIQUE KEY `uq_teacher_class_subj` (`teacher_id`, `class_id`, `subject_id`);
ALTER TABLE `student_subjects` ADD UNIQUE KEY `uq_student_class_subj` (`student_id`, `class_id`, `subject_id`);
