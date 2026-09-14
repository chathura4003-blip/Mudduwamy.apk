<?php
/**
 * Database Diagnostic & Connection Test Endpoint
 */
require_once __DIR__ . '/config.php';

// 🛡️ Security Guard: Only system administrators can run database diagnostics
$authUser = requireRole(['admin', 'superadmin']);

$pdo = null;
$error = null;
$working = false;

try {
    $pdo = getDbConnection();
    $ver = $pdo->query("SELECT VERSION()")->fetchColumn();
    $working = true;
} catch (Exception $e) {
    $error = $e->getMessage();
}

$tables = [];
$userCount = 0;
$migrationStatus = [];
if ($working && $pdo) {
    try {
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $userCount = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

        require_once __DIR__ . '/migrations/MigrationRunner.php';
        $runner = new MigrationRunner($pdo, __DIR__ . '/migrations');
        $migrationStatus = $runner->getStatus();
    } catch (Exception $eTab) {}
}

sendJsonResponse([
    "connected" => $working,
    "status" => $working ? "connected" : "failed",
    "message" => $working ? "MySQL Database එකට සාර්ථකව සම්බන්ධ වී ඇත." : "Database Connection Failed",
    "host" => DB_HOST,
    "port" => DB_PORT,
    "database" => DB_NAME,
    "user" => DB_USER,
    "tables" => $tables,
    "tableCount" => count($tables),
    "userCount" => $userCount,
    "migrations" => $migrationStatus,
    "migrationsCount" => count($migrationStatus),
    "error" => $error
]);
