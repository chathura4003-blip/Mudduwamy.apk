<?php
/**
 * Database Backup & Restore API Endpoint for Sri Sumana Pirivena ERP
 */
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// 🛡️ Security Check: Only Admin and SuperAdmin can export or restore DB backups
$adminUser = requireRole(['admin', 'superadmin']);

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$subAction = end($parts);

// Table list in database order
$validTables = [
    'users',
    'teachers',
    'students',
    'site_settings',
    'custom_categories',
    'news',
    'events',
    'gallery',
    'donations',
    'library',
    'classes',
    'subjects',
    'exams',
    'exam_submissions',
    'certificates',
    'admissions',
    'broadcast_notices',
    'audit_logs',
    'circular_downloads',
    'study_materials',
    'teacher_assignments',
    'student_subjects'
];

// 1. GET requests: Backup Export
if ($method === 'GET') {
    // If requesting raw MySQL .sql file export
    if ($subAction === 'export-mysql') {
        $schemaFile = __DIR__ . '/../schema.sql';
        if (file_exists($schemaFile)) {
            header('Content-Type: text/plain; charset=utf-8');
            header('Content-Disposition: attachment; filename="pirivena_database_backup_' . date('Y-m-d') . '.sql"');
            echo file_get_contents($schemaFile);
            exit;
        }
    }

    // Export full JSON Backup structure with all table records
    $backupData = [
        "system" => "Sri Sumana Maha Pirivena ERP",
        "version" => "1.0.0",
        "exportDate" => date('Y-m-d H:i:s'),
        "tables" => []
    ];

    foreach ($validTables as $tbl) {
        try {
            $stmt = $db->query("SELECT * FROM `$tbl`");
            $backupData['tables'][$tbl] = $stmt->fetchAll();
        } catch (Exception $e) {
            $backupData['tables'][$tbl] = [];
        }
    }

    header('Content-Disposition: attachment; filename="pirivena_backup_' . date('Y-m-d') . '.json"');
    sendJsonResponse($backupData);
}

// 2. POST requests: Backup Restore
if ($method === 'POST') {
    if ($subAction === 'restore-mysql') {
        $sql = file_get_contents("php://input");
        if (empty(trim($sql))) {
            sendJsonResponse(["error" => "Empty SQL query data provided for restore."], 400);
        }
        
        try {
            $db->exec("SET FOREIGN_KEY_CHECKS = 0;");
            $db->exec($sql);
            $db->exec("SET FOREIGN_KEY_CHECKS = 1;");
            
            sendJsonResponse([
                "success" => true,
                "message" => "Database backup restored successfully from MySQL Dump."
            ]);
        } catch (Exception $e) {
            sendJsonResponse(["error" => "Failed to execute SQL restore: " . $e->getMessage()], 500);
        }
    }

    $body = getRequestBody();
    
    if (empty($body)) {
        sendJsonResponse(["error" => "Empty payload or invalid JSON format provided for restore."], 400);
    }

    $payloadTables = [];
    if (isset($body['tables']) && is_array($body['tables'])) {
        $payloadTables = $body['tables'];
    } elseif (isset($body['data']) && is_array($body['data'])) {
        $payloadTables = $body['data'];
    } elseif (isset($body['rawPayload']['tables']) && is_array($body['rawPayload']['tables'])) {
        $payloadTables = $body['rawPayload']['tables'];
    } elseif (is_array($body)) {
        $payloadTables = $body;
    }

    $restoredCounts = [];
    $totalRecords = 0;
    $errors = [];

    foreach ($payloadTables as $tableName => $rows) {
        if (!in_array($tableName, $validTables) || !is_array($rows) || empty($rows)) {
            continue;
        }

        // Fetch valid columns for this table from MySQL
        try {
            $colStmt = $db->query("SHOW COLUMNS FROM `$tableName`");
            $tableCols = array_column($colStmt->fetchAll(), 'Field');
        } catch (Exception $e) {
            continue;
        }

        if (empty($tableCols)) continue;

        $count = 0;
        foreach ($rows as $row) {
            if (!is_array($row) || empty($row)) continue;

            $validRowData = [];
            foreach ($row as $colName => $colValue) {
                if (in_array($colName, $tableCols)) {
                    if (is_array($colValue) || is_object($colValue)) {
                        $validRowData[$colName] = json_encode($colValue, JSON_UNESCAPED_UNICODE);
                    } elseif (is_bool($colValue)) {
                        $validRowData[$colName] = $colValue ? 1 : 0;
                    } else {
                        $validRowData[$colName] = $colValue;
                    }
                }
            }

            if (empty($validRowData)) continue;

            $columns = array_keys($validRowData);
            $colNamesStr = implode('`, `', array_map('addslashes', $columns));
            
            $placeholders = [];
            $updateAssignments = [];
            $params = [];

            foreach ($columns as $idx => $col) {
                $paramKey = 'p_' . $idx;
                $placeholders[] = ':' . $paramKey;
                $updateAssignments[] = "`" . addslashes($col) . "` = VALUES(`" . addslashes($col) . "`)";
                $params[$paramKey] = $validRowData[$col];
            }

            $sql = "INSERT INTO `$tableName` (`" . $colNamesStr . "`) VALUES (" . implode(', ', $placeholders) . ") 
                    ON DUPLICATE KEY UPDATE " . implode(', ', $updateAssignments);

            try {
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $count++;
            } catch (Exception $e) {
                $errors[] = "Table $tableName insert error: " . $e->getMessage();
            }
        }
        $restoredCounts[$tableName] = $count;
        $totalRecords += $count;
    }

    sendJsonResponse([
        "success" => true,
        "message" => "Database backup restored successfully.",
        "totalRecords" => $totalRecords,
        "restoredCounts" => $restoredCounts,
        "errorLogs" => array_slice($errors, 0, 5)
    ]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
