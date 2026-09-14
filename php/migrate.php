<?php
/**
 * Sri Sumana Maha Pirivena ERP — Database Migration CLI & API Tool
 * 
 * Usage via CLI:
 *   php php/migrate.php           # Run pending migrations
 *   php php/migrate.php --status  # Show migration status
 * 
 * Usage via Web:
 *   Only accessible by authenticated Administrator / Superadmin
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/migrations/MigrationRunner.php';

$isCli = (php_sapi_name() === 'cli' || empty($_SERVER['REMOTE_ADDR']));

if (!$isCli) {
    // 🛡️ Web Access Guard: Must be authenticated Admin/Superadmin
    $authUser = requireRole(['admin', 'superadmin']);
}

try {
    $pdo = getDbConnection();
    $runner = new MigrationRunner($pdo, __DIR__ . '/migrations');

    $isStatusCheck = $isCli && in_array('--status', $argv ?? []);
    if (!$isCli && (($_GET['action'] ?? '') === 'status')) {
        $isStatusCheck = true;
    }

    if ($isStatusCheck) {
        $status = $runner->getStatus();
        if ($isCli) {
            echo "====================================================\n";
            echo "☸ Sri Sumana Maha Pirivena ERP — Database Migrations\n";
            echo "====================================================\n";
            foreach ($status as $s) {
                $mark = $s['applied'] ? "[✓] APPLIED " : "[ ] PENDING ";
                echo "{$mark} {$s['migration']}\n";
            }
            echo "====================================================\n";
            exit(0);
        } else {
            sendApiSuccess($status, 'Migration status retrieved');
        }
    }

    // Run pending migrations
    $result = $runner->runPending();

    if ($isCli) {
        echo "====================================================\n";
        echo "☸ Sri Sumana Maha Pirivena ERP — Database Migrations\n";
        echo "====================================================\n";
        if (!empty($result['applied'])) {
            echo "Successfully applied " . count($result['applied']) . " migration(s):\n";
            foreach ($result['applied'] as $mig) {
                echo "  + {$mig}\n";
            }
        } else {
            echo $result['message'] . "\n";
        }

        if (!empty($result['errors'])) {
            echo "\nErrors encountered:\n";
            foreach ($result['errors'] as $err) {
                echo "  ! [{$err['migration']}]: {$err['error']}\n";
            }
            exit(1);
        }
        echo "====================================================\n";
        exit(0);
    } else {
        if ($result['success']) {
            sendApiSuccess($result, 'Migrations executed successfully');
        } else {
            sendApiError('Migration execution encountered errors', 500, 500, $result);
        }
    }
} catch (Exception $e) {
    if ($isCli) {
        echo "FATAL ERROR: " . $e->getMessage() . "\n";
        exit(1);
    } else {
        sendApiError("Database Migration Error: " . $e->getMessage(), 500);
    }
}
