-- ============================================================
-- Migration: 005_auxiliary_tables.sql
-- Description: Decouple auxiliary runtime tables (chat, rate-limiting)
-- Target: Sri Sumana Maha Pirivena ERP
-- ============================================================

-- 1. Chat Messages Table
CREATE TABLE IF NOT EXISTS `chat_messages` (
    `id` VARCHAR(64) NOT NULL PRIMARY KEY,
    `room_id` VARCHAR(64) NOT NULL DEFAULT 'general',
    `sender_id` VARCHAR(64) NOT NULL,
    `sender_name` VARCHAR(255) NOT NULL,
    `sender_role` VARCHAR(32) NOT NULL,
    `sender_avatar` TEXT NULL,
    `message_type` VARCHAR(32) NOT NULL DEFAULT 'text',
    `content` TEXT NOT NULL,
    `attachment_url` TEXT NULL,
    `attachment_name` VARCHAR(255) NULL,
    `attachment_size` VARCHAR(64) NULL,
    `reactions` TEXT NULL,
    `reply_to_id` VARCHAR(64) NULL,
    `reply_to_name` VARCHAR(255) NULL,
    `reply_to_content` TEXT NULL,
    `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_chat_room_time` (`room_id`, `created_at`),
    INDEX `idx_chat_sender` (`sender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Anti-Brute Force Login Rate Limits Table
CREATE TABLE IF NOT EXISTS `login_rate_limits` (
    `ip_address` VARCHAR(45) NOT NULL PRIMARY KEY,
    `attempts` INT NOT NULL DEFAULT 1,
    `last_attempt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_lrl_last_attempt` (`last_attempt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. AI Service Rate Limits Table
CREATE TABLE IF NOT EXISTS `ai_rate_limits` (
    `client_key` VARCHAR(64) NOT NULL PRIMARY KEY,
    `requests_count` INT NOT NULL DEFAULT 1,
    `window_start` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_arl_window` (`window_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
