<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Extract ID from URL like /api/materials/mat-001
$materialId = null;
if (preg_match('#/api/(?:materials|study-materials)/([^/]+)$#', $requestUri, $matches)) {
    $materialId = urldecode($matches[1]);
}

/**
 * Ensure study_materials table and all required columns exist across all MySQL / MariaDB versions
 */
function ensureMaterialsTable($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `study_materials` (
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
            `uploadedAt` datetime DEFAULT NULL,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // Fetch existing columns
        $stmtCols = $db->query("SHOW COLUMNS FROM `study_materials`");
        $existingCols = array_map('strtolower', $stmtCols->fetchAll(PDO::FETCH_COLUMN));

        $requiredCols = [
            'titlesinhala' => "ALTER TABLE `study_materials` ADD COLUMN `titleSinhala` VARCHAR(255) DEFAULT NULL",
            'subjectid' => "ALTER TABLE `study_materials` ADD COLUMN `subjectId` VARCHAR(64) DEFAULT NULL",
            'gradeclass' => "ALTER TABLE `study_materials` ADD COLUMN `gradeClass` VARCHAR(50) DEFAULT 'All'",
            'classid' => "ALTER TABLE `study_materials` ADD COLUMN `classId` VARCHAR(64) DEFAULT NULL",
            'filename' => "ALTER TABLE `study_materials` ADD COLUMN `fileName` VARCHAR(255) DEFAULT NULL",
            'filetype' => "ALTER TABLE `study_materials` ADD COLUMN `fileType` VARCHAR(50) DEFAULT 'pdf'",
            'type' => "ALTER TABLE `study_materials` ADD COLUMN `type` VARCHAR(50) DEFAULT 'pdf'",
            'filesize' => "ALTER TABLE `study_materials` ADD COLUMN `fileSize` VARCHAR(50) DEFAULT NULL",
            'description' => "ALTER TABLE `study_materials` ADD COLUMN `description` TEXT DEFAULT NULL",
            'uploadedby' => "ALTER TABLE `study_materials` ADD COLUMN `uploadedBy` VARCHAR(255) DEFAULT 'ආචාර්ය මණ්ඩලය'",
            'uploadedbyteacherid' => "ALTER TABLE `study_materials` ADD COLUMN `uploadedByTeacherId` VARCHAR(64) DEFAULT NULL",
            'dateuploaded' => "ALTER TABLE `study_materials` ADD COLUMN `dateUploaded` DATE DEFAULT NULL",
            'uploadedat' => "ALTER TABLE `study_materials` ADD COLUMN `uploadedAt` DATETIME DEFAULT NULL",
            'created_at' => "ALTER TABLE `study_materials` ADD COLUMN `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP",
        ];

        foreach ($requiredCols as $colKey => $sql) {
            if (!in_array($colKey, $existingCols)) {
                try {
                    $db->exec($sql);
                } catch (Exception $eCol) {}
            }
        }
    } catch (Exception $e) {}
}

if ($method !== 'GET') {
    ensureMaterialsTable($db);
}

function formatMaterial($row) {
    if (!$row) return null;
    $dateUploaded = !empty($row['dateUploaded']) ? $row['dateUploaded'] : (!empty($row['uploadedAt']) ? substr($row['uploadedAt'], 0, 10) : (!empty($row['created_at']) ? substr($row['created_at'], 0, 10) : date('Y-m-d')));
    $uploadedAt = !empty($row['uploadedAt']) ? $row['uploadedAt'] : (!empty($row['created_at']) ? $row['created_at'] : date('Y-m-d H:i:s'));

    return [
        'id' => $row['id'],
        'title' => $row['title'] ?? '',
        'titleSinhala' => !empty($row['titleSinhala']) ? $row['titleSinhala'] : ($row['title'] ?? ''),
        'description' => $row['description'] ?? '',
        'type' => $row['type'] ?? ($row['fileType'] ?? 'pdf'),
        'subjectId' => $row['subjectId'] ?? ($row['subject'] ?? 'all'),
        'classId' => $row['classId'] ?? ($row['gradeClass'] ?? 'all'),
        'uploadedByTeacherId' => $row['uploadedByTeacherId'] ?? ($row['uploadedBy'] ?? ''),
        'fileUrl' => $row['fileUrl'] ?? '',
        'fileName' => $row['fileName'] ?? ($row['title'] ?? 'Lecture_Notes.pdf'),
        'fileSize' => $row['fileSize'] ?? '',
        'uploadedAt' => $uploadedAt,
        'dateUploaded' => $dateUploaded,
    ];
}

// Authorized File Download & Streaming Endpoint
if ($method === 'GET' && ((isset($_GET['action']) && $_GET['action'] === 'download') || isset($_GET['download']))) {
    $authUser = getAuthUser();
    if (!$authUser) {
        sendJsonResponse(["error" => "Unauthorized. Valid authentication token required to download study materials."], 401);
    }

    $matId = $materialId ?: ($_GET['id'] ?? null);
    if (!$matId) {
        sendJsonResponse(["error" => "Material ID is required for download."], 400);
    }

    $stmt = $db->prepare("SELECT * FROM study_materials WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $matId]);
    $row = $stmt->fetch();
    if (!$row) {
        sendJsonResponse(["error" => "Study material not found."], 404);
    }

    // Authorization Check: Students can only access their enrolled class materials or 'all'
    if (($authUser['role'] ?? '') === 'student') {
        $studentClass = $authUser['classId'] ?? $authUser['pirivenaClass'] ?? null;
        $matClass = $row['classId'] ?? $row['gradeClass'] ?? 'all';
        if ($matClass !== 'all' && $matClass !== 'ALL' && $matClass !== '' && $studentClass && strcasecmp($matClass, $studentClass) !== 0) {
            sendJsonResponse(["error" => "Forbidden. You are not authorized to access materials for this class."], 403);
        }
    }

    // Resolve local file path
    $fileUrl = $row['fileUrl'] ?? '';
    $fileName = $row['fileName'] ?? 'material.pdf';
    $baseName = basename(parse_url($fileUrl, PHP_URL_PATH));
    $localPath = UPLOAD_DIR . $baseName;

    if (!file_exists($localPath) && file_exists($fileUrl)) {
        $localPath = $fileUrl;
    }

    if (!file_exists($localPath)) {
        sendJsonResponse(["error" => "File not found on secure storage."], 404);
    }

    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $mimeMap = [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt' => 'text/plain'
    ];
    $contentType = $mimeMap[$ext] ?? 'application/octet-stream';

    header('Content-Type: ' . $contentType);
    header('Content-Disposition: inline; filename="' . addslashes(basename($fileName)) . '"');
    header('Content-Length: ' . filesize($localPath));
    header('Cache-Control: private, max-age=3600');
    header('X-Content-Type-Options: nosniff');
    readfile($localPath);
    exit;
}

// GET - List all materials or filter by classId / subjectId
if ($method === 'GET' && !$materialId) {
    $authUser = getAuthUser();
    $classId = isset($_GET['classId']) ? trim($_GET['classId']) : null;
    $subjectId = isset($_GET['subjectId']) ? trim($_GET['subjectId']) : null;
    $rows = [];

    try {
        $stmt = $db->query("SELECT * FROM study_materials ORDER BY id DESC");
        $rows = $stmt ? $stmt->fetchAll() : [];
    } catch (Exception $e) {
        try {
            $stmt = $db->query("SELECT * FROM study_materials");
            $rows = $stmt ? $stmt->fetchAll() : [];
        } catch (Exception $e2) {
            $rows = [];
        }
    }

    $result = array_values(array_filter(array_map('formatMaterial', $rows)));

    // If query parameters classId or subjectId are passed and not 'all', filter leniently
    if (($classId && $classId !== 'all' && $classId !== 'ALL') || ($subjectId && $subjectId !== 'all' && $subjectId !== 'ALL')) {
        $result = array_values(array_filter($result, function($m) use ($classId, $subjectId) {
            $mClass = strtolower(trim($m['classId'] ?? ''));
            $mSubj = strtolower(trim($m['subjectId'] ?? ''));

            if ($classId && $classId !== 'all' && $classId !== 'ALL') {
                $cFilter = strtolower(trim($classId));
                if ($mClass !== '' && $mClass !== 'all' && $mClass !== 'all classes' && $mClass !== 'සියලු' && $mClass !== $cFilter) {
                    return false;
                }
            }

            if ($subjectId && $subjectId !== 'all' && $subjectId !== 'ALL') {
                $sFilter = strtolower(trim($subjectId));
                if ($mSubj !== '' && $mSubj !== 'all' && $mSubj !== 'all subjects' && $mSubj !== 'සියලු' && $mSubj !== $sFilter) {
                    return false;
                }
            }

            return true;
        }));
    }

    // If authenticated user is a teacher, return only materials uploaded by this teacher (Strict Isolation)
    if ($authUser && ($authUser['role'] ?? '') === 'teacher') {
        $tKeys = [
            strtolower(trim($authUser['id'] ?? '')),
            strtolower(trim($authUser['customId'] ?? '')),
            strtolower(trim($authUser['name'] ?? '')),
            strtolower(trim($authUser['monkName'] ?? '')),
            strtolower(trim($authUser['email'] ?? ''))
        ];
        $tKeys = array_values(array_filter($tKeys));

        $result = array_values(array_filter($result, function($m) use ($tKeys) {
            $mTeacher = strtolower(trim($m['uploadedByTeacherId'] ?? ($m['uploadedBy'] ?? ($m['teacherId'] ?? ($m['createdBy'] ?? '')))));
            return (!empty($mTeacher) && in_array($mTeacher, $tKeys));
        }));
    }
    
    sendJsonResponse($result);
}

// GET single material by ID
if ($method === 'GET' && $materialId) {
    $stmt = $db->prepare("SELECT * FROM study_materials WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $materialId]);
    $row = $stmt->fetch();
    
    if (!$row) {
        sendJsonResponse(["error" => "Material not found"], 404);
    }
    sendJsonResponse(formatMaterial($row));
}

// POST - Create new material
if ($method === 'POST') {
    $authUser = requireRole(['teacher', 'admin', 'superadmin']);
    $body = getRequestBody();
    $id = !empty($body['id']) ? trim($body['id']) : ('mat-' . date('YmdHis') . '-' . rand(100, 999));
    $title = trim($body['title'] ?? ($body['titleSinhala'] ?? ''));
    $titleSinhala = !empty($body['titleSinhala']) ? trim($body['titleSinhala']) : $title;
    $classId = !empty($body['classId']) ? trim($body['classId']) : 'all';
    $subjectId = !empty($body['subjectId']) ? trim($body['subjectId']) : 'all';
    $teacherId = !empty($body['uploadedByTeacherId']) ? trim($body['uploadedByTeacherId']) : ($authUser['id'] ?? 'teacher');
    $type = !empty($body['type']) ? trim($body['type']) : 'pdf';
    $fileUrl = !empty($body['fileUrl']) ? trim($body['fileUrl']) : '';
    $fileName = !empty($body['fileName']) ? trim($body['fileName']) : ($title . '.pdf');
    $fileSize = !empty($body['fileSize']) ? trim($body['fileSize']) : '';
    $description = trim($body['description'] ?? '');
    $dateUploaded = !empty($body['dateUploaded']) ? trim($body['dateUploaded']) : date('Y-m-d');
    $now = date('Y-m-d H:i:s');
    
    try {
        // Detect existing columns in study_materials
        $stmtCols = $db->query("SHOW COLUMNS FROM `study_materials`");
        $existingCols = array_map('strtolower', $stmtCols->fetchAll(PDO::FETCH_COLUMN));

        $colData = [
            'id' => $id,
            'title' => $title,
            'titleSinhala' => $titleSinhala,
            'subject' => $subjectId,
            'subjectId' => $subjectId,
            'gradeClass' => $classId,
            'classId' => $classId,
            'uploadedByTeacherId' => $teacherId,
            'uploadedBy' => $teacherId,
            'fileUrl' => $fileUrl,
            'fileName' => $fileName,
            'fileType' => $type,
            'type' => $type,
            'fileSize' => $fileSize,
            'description' => $description,
            'dateUploaded' => $dateUploaded,
            'uploadedAt' => $now,
            'created_at' => $now,
        ];

        $insertCols = [];
        $placeholders = [];
        $params = [];
        $updateClauses = [];

        foreach ($colData as $col => $val) {
            if (in_array(strtolower($col), $existingCols)) {
                $insertCols[] = "`$col`";
                $placeholders[] = ":$col";
                $params[$col] = $val;
                if ($col !== 'id') {
                    $updateClauses[] = "`$col` = VALUES(`$col`)";
                }
            }
        }

        $sql = "INSERT INTO `study_materials` (" . implode(', ', $insertCols) . ") VALUES (" . implode(', ', $placeholders) . ")";
        if (!empty($updateClauses)) {
            $sql .= " ON DUPLICATE KEY UPDATE " . implode(', ', $updateClauses);
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
    } catch (Exception $ePost) {
        sendJsonResponse(["error" => "Failed to save material: " . $ePost->getMessage()], 500);
    }

    logAuditEvent("අධ්‍යයන ආධාරකයක් එක් කිරීම (Material Uploaded)", "මාතෘකාව: '{$titleSinhala}' සාර්ථකව පද්ධතියට එක් කරන ලදී.", 'Academic');
    
    // 🔔 Trigger OneSignal Push Notification for students in the class
    try {
        if (class_exists('OneSignalService')) {
            OneSignalService::notifyNewMaterial($titleSinhala, $classId, $subjectId, $id, $teacherId);
        }
    } catch (Exception $eNotify) {}

    $newStmt = $db->prepare("SELECT * FROM study_materials WHERE id = :id LIMIT 1");
    $newStmt->execute(['id' => $id]);
    $row = $newStmt->fetch();
    
    sendJsonResponse(formatMaterial($row), 201);
}

// PUT - Update material
if ($method === 'PUT' && $materialId) {
    $authUser = requireRole(['teacher', 'admin', 'superadmin']);
    $body = getRequestBody();
    
    $fields = [];
    $params = ['id' => $materialId];
    
    $allowedFields = ['title', 'titleSinhala', 'description', 'type', 'subjectId', 'classId', 'uploadedByTeacherId', 'fileUrl', 'fileName', 'fileSize', 'dateUploaded'];
    
    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $body)) {
            $fields[] = "`$field` = :$field";
            $params[$field] = $body[$field];
        }
    }
    
    if (!empty($fields)) {
        try {
            $sql = "UPDATE study_materials SET " . implode(', ', $fields) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        } catch (Exception $ePut) {}
    }

    logAuditEvent("අධ්‍යයන ආධාරකයක් යාවත්කාලීන කිරීම (Material Updated)", "ආධාරක ID: '{$materialId}' තොරතුරු යාවත්කාලීන කරන ලදී.", 'Academic');
    
    $newStmt = $db->prepare("SELECT * FROM study_materials WHERE id = :id LIMIT 1");
    $newStmt->execute(['id' => $materialId]);
    $row = $newStmt->fetch();
    
    if (!$row) {
        sendJsonResponse(["error" => "Material not found"], 404);
    }
    sendJsonResponse(formatMaterial($row));
}

// DELETE Material
if ($method === 'DELETE' && $materialId) {
    $authUser = requireRole(['teacher', 'admin', 'superadmin']);
    try {
        $stmtSel = $db->prepare("SELECT fileUrl FROM study_materials WHERE id = :id LIMIT 1");
        $stmtSel->execute(['id' => $materialId]);
        $mat = $stmtSel->fetch();
        if ($mat && !empty($mat['fileUrl'])) {
            deleteUploadedFile($mat['fileUrl']);
        }
    } catch (Exception $e) {}

    $stmt = $db->prepare("DELETE FROM study_materials WHERE id = :id");
    $stmt->execute(['id' => $materialId]);
    sendJsonResponse(["success" => true, "id" => $materialId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
