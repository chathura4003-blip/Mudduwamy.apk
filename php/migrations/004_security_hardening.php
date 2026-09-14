<?php
/**
 * Migration: 004_security_hardening.php
 * Description: Clean plaintext passwords, enforce Bcrypt column width, and ensure superadmin
 * Target: Sri Sumana Maha Pirivena ERP
 */

// 1. Enforce password column lengths
$pdo->exec("ALTER TABLE `users` MODIFY COLUMN `password` VARCHAR(255) NOT NULL");
$pdo->exec("ALTER TABLE `users` MODIFY COLUMN `plain_password` VARCHAR(255) DEFAULT NULL");
$pdo->exec("ALTER TABLE `students` MODIFY COLUMN `plain_password` VARCHAR(255) DEFAULT NULL");
$pdo->exec("ALTER TABLE `teachers` MODIFY COLUMN `plain_password` VARCHAR(255) DEFAULT NULL");

// 2. Clear any lingering plain_password values
$pdo->exec("UPDATE `users` SET `plain_password` = NULL WHERE `plain_password` IS NOT NULL");
$pdo->exec("UPDATE `students` SET `plain_password` = NULL WHERE `plain_password` IS NOT NULL");
$pdo->exec("UPDATE `teachers` SET `plain_password` = NULL WHERE `plain_password` IS NOT NULL");

// 3. Ensure superadmin account exists
$stmt = $pdo->query("SELECT COUNT(*) FROM `users` WHERE `role` IN ('admin', 'superadmin')");
$adminCount = $stmt ? (int)$stmt->fetchColumn() : 0;

if ($adminCount === 0) {
    $adminPassHash = password_hash('admin123', PASSWORD_DEFAULT);
    $seedStmt = $pdo->prepare("INSERT INTO `users` (
        `id`, `username`, `password`, `plain_password`, `monkName`, `name`, `email`, `phone`, 
        `role`, `customId`, `indexNumber`, `pirivenaClass`, `status`
    ) VALUES (
        'usr-admin-01', 'admin', :pass, NULL, 'පූජ්‍ය ශ්‍රී සුමන නායක හිමි', 
        'ප්‍රධාන පරිපාලක (System Administrator)', 'admin@pirivena.lk', '0712345678', 
        'superadmin', 'ADM-001', 'ADM-001', 'පාලක මණ්ඩලය', 'active'
    )");
    $seedStmt->execute([':pass' => $adminPassHash]);
}
