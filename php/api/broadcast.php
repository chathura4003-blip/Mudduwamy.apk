<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Parse URL path ID if present (e.g., /api/broadcast-notices/notice-123)
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'broadcast.php' && $lastPart !== 'broadcast-notices' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

// 1. GET - List or single notice
if ($method === 'GET') {
    if ($pathId) {
        try {
            $stmt = $db->prepare("SELECT * FROM broadcast_notices WHERE id = :id LIMIT 1");
            $stmt->execute(['id' => $pathId]);
            $row = $stmt->fetch();
            if ($row) {
                $row['active'] = !empty($row['active']);
                $row['type'] = $row['severity'] ?? $row['type'] ?? 'info';
                $row['targetAudience'] = $row['targetRole'] ?? $row['targetAudience'] ?? 'all';
                $row['createdAt'] = $row['created_at'] ?? $row['createdAt'] ?? date('Y-m-d H:i:s');
                sendJsonResponse($row);
            } else {
                sendJsonResponse(["error" => "Notice not found"], 404);
            }
        } catch (Exception $e) {
            sendJsonResponse(["error" => "Notice not found"], 404);
        }
    } else {
        $onlyActive = isset($_GET['active_only']) && $_GET['active_only'] === '1';
        $rows = [];
        try {
            $sql = $onlyActive 
                ? "SELECT * FROM broadcast_notices WHERE active = 1 ORDER BY id DESC"
                : "SELECT * FROM broadcast_notices ORDER BY id DESC";
            $stmt = $db->query($sql);
            $rows = $stmt ? $stmt->fetchAll() : [];
        } catch (Exception $e) {
            try {
                $stmt = $db->query("SELECT * FROM broadcast_notices");
                $rows = $stmt ? $stmt->fetchAll() : [];
            } catch (Exception $e2) {
                $rows = [];
            }
        }

        $formatted = array_map(function($row) {
            $row['active'] = !empty($row['active']);
            $row['type'] = $row['severity'] ?? $row['type'] ?? 'info';
            $row['targetAudience'] = $row['targetRole'] ?? $row['targetAudience'] ?? 'all';
            $row['createdAt'] = $row['created_at'] ?? $row['createdAt'] ?? date('Y-m-d H:i:s');
            return $row;
        }, $rows);
        sendJsonResponse($formatted);
    }
}

// 2. POST - Create notice
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin', 'teacher']);
    $body = getRequestBody();
    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : 'notice-' . time() . '-' . rand(100, 999);
    $title = isset($body['title']) ? trim($body['title']) : '';
    $titleSinhala = isset($body['titleSinhala']) ? trim($body['titleSinhala']) : $title;
    $message = isset($body['message']) ? trim($body['message']) : '';
    $messageSinhala = isset($body['messageSinhala']) ? trim($body['messageSinhala']) : $message;
    $severity = isset($body['severity']) ? trim($body['severity']) : (isset($body['type']) ? trim($body['type']) : 'info');
    $targetRole = isset($body['targetRole']) ? trim($body['targetRole']) : (isset($body['targetAudience']) ? trim($body['targetAudience']) : 'all');
    $category = isset($body['category']) ? trim($body['category']) : 'General';
    $active = isset($body['active']) ? ($body['active'] ? 1 : 0) : 1;
    $createdBy = isset($body['createdBy']) ? trim($body['createdBy']) : 'පිරිවෙන් පාලක සභාව';
    $expiryDate = !empty($body['expiryDate']) ? trim($body['expiryDate']) : null;
    $customColor = !empty($body['customColor']) ? trim($body['customColor']) : null;
    $customIcon = !empty($body['customIcon']) ? trim($body['customIcon']) : null;
    $attachmentUrl = !empty($body['attachmentUrl']) ? trim($body['attachmentUrl']) : null;

    $stmt = $db->prepare("INSERT INTO broadcast_notices 
        (id, title, titleSinhala, message, messageSinhala, severity, targetRole, category, active, createdBy, expiryDate, customColor, customIcon, attachmentUrl) 
        VALUES (:id, :t, :tsi, :m, :msi, :sev, :tr, :cat, :act, :cb, :exp, :cc, :ci, :att)
        ON DUPLICATE KEY UPDATE 
        title = VALUES(title), titleSinhala = VALUES(titleSinhala), message = VALUES(message), messageSinhala = VALUES(messageSinhala),
        severity = VALUES(severity), targetRole = VALUES(targetRole), category = VALUES(category), active = VALUES(active),
        createdBy = VALUES(createdBy), expiryDate = VALUES(expiryDate), customColor = VALUES(customColor), customIcon = VALUES(customIcon), attachmentUrl = VALUES(attachmentUrl)");

    $stmt->execute([
        'id' => $id,
        't' => $title,
        'tsi' => $titleSinhala,
        'm' => $message,
        'msi' => $messageSinhala,
        'sev' => $severity,
        'tr' => $targetRole,
        'cat' => $category,
        'act' => $active,
        'cb' => $createdBy,
        'exp' => $expiryDate,
        'cc' => $customColor,
        'ci' => $customIcon,
        'att' => $attachmentUrl
    ]);

    $notice = [
        "id" => $id,
        "title" => $title,
        "titleSinhala" => $titleSinhala,
        "message" => $message,
        "messageSinhala" => $messageSinhala,
        "severity" => $severity,
        "type" => $severity,
        "targetRole" => $targetRole,
        "targetAudience" => $targetRole,
        "category" => $category,
        "active" => (bool)$active,
        "createdBy" => $createdBy,
        "expiryDate" => $expiryDate,
        "customColor" => $customColor,
        "customIcon" => $customIcon,
        "attachmentUrl" => $attachmentUrl,
        "createdAt" => date('Y-m-d H:i:s')
    ];

    // 🔔 Trigger OneSignal Push Notification for all users / target role
    try {
        if (class_exists('OneSignalService')) {
            OneSignalService::notifyBroadcastNotice($titleSinhala, $messageSinhala, $id, $createdBy, $targetRole);
        }
    } catch (Exception $eNotice) {}

    sendJsonResponse($notice, 201);
}

// 3. PUT - Update notice
if ($method === 'PUT') {
    $authUser = requireRole(['admin', 'superadmin', 'teacher']);
    $body = getRequestBody();
    $noticeId = $pathId ?: (isset($body['id']) ? $body['id'] : null);

    if (!$noticeId) {
        sendJsonResponse(["error" => "Notice ID is required for update"], 400);
    }

    $stmt = $db->prepare("SELECT * FROM broadcast_notices WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $noticeId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        sendJsonResponse(["error" => "Notice not found"], 404);
    }

    $title = isset($body['title']) ? trim($body['title']) : $existing['title'];
    $titleSinhala = isset($body['titleSinhala']) ? trim($body['titleSinhala']) : $existing['titleSinhala'];
    $message = isset($body['message']) ? trim($body['message']) : $existing['message'];
    $messageSinhala = isset($body['messageSinhala']) ? trim($body['messageSinhala']) : $existing['messageSinhala'];
    $severity = isset($body['severity']) ? trim($body['severity']) : (isset($body['type']) ? trim($body['type']) : $existing['severity']);
    $targetRole = isset($body['targetRole']) ? trim($body['targetRole']) : (isset($body['targetAudience']) ? trim($body['targetAudience']) : $existing['targetRole']);
    $category = isset($body['category']) ? trim($body['category']) : $existing['category'];
    $active = isset($body['active']) ? ($body['active'] ? 1 : 0) : $existing['active'];
    $createdBy = isset($body['createdBy']) ? trim($body['createdBy']) : $existing['createdBy'];
    $expiryDate = array_key_exists('expiryDate', $body) ? (!empty($body['expiryDate']) ? trim($body['expiryDate']) : null) : $existing['expiryDate'];
    $customColor = array_key_exists('customColor', $body) ? (!empty($body['customColor']) ? trim($body['customColor']) : null) : (isset($existing['customColor']) ? $existing['customColor'] : null);
    $customIcon = array_key_exists('customIcon', $body) ? (!empty($body['customIcon']) ? trim($body['customIcon']) : null) : (isset($existing['customIcon']) ? $existing['customIcon'] : null);
    $attachmentUrl = array_key_exists('attachmentUrl', $body) ? (!empty($body['attachmentUrl']) ? trim($body['attachmentUrl']) : null) : (isset($existing['attachmentUrl']) ? $existing['attachmentUrl'] : null);

    $stmt = $db->prepare("UPDATE broadcast_notices SET
        title = :t,
        titleSinhala = :tsi,
        message = :m,
        messageSinhala = :msi,
        severity = :sev,
        targetRole = :tr,
        category = :cat,
        active = :act,
        createdBy = :cb,
        expiryDate = :exp,
        customColor = :cc,
        customIcon = :ci,
        attachmentUrl = :att
        WHERE id = :id");

    $stmt->execute([
        'id' => $noticeId,
        't' => $title,
        'tsi' => $titleSinhala,
        'm' => $message,
        'msi' => $messageSinhala,
        'sev' => $severity,
        'tr' => $targetRole,
        'cat' => $category,
        'act' => $active,
        'cb' => $createdBy,
        'exp' => $expiryDate,
        'cc' => $customColor,
        'ci' => $customIcon,
        'att' => $attachmentUrl
    ]);

    $updatedNotice = [
        "id" => $noticeId,
        "title" => $title,
        "titleSinhala" => $titleSinhala,
        "message" => $message,
        "messageSinhala" => $messageSinhala,
        "severity" => $severity,
        "type" => $severity,
        "targetRole" => $targetRole,
        "targetAudience" => $targetRole,
        "category" => $category,
        "active" => (bool)$active,
        "createdBy" => $createdBy,
        "expiryDate" => $expiryDate,
        "customColor" => $customColor,
        "customIcon" => $customIcon,
        "attachmentUrl" => $attachmentUrl,
        "createdAt" => $existing['created_at']
    ];

    sendJsonResponse($updatedNotice);
}

// 4. DELETE - Delete notice
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $noticeId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($_GET['id']) ? $_GET['id'] : null));

    if (!$noticeId) {
        sendJsonResponse(["error" => "Notice ID is required for deletion"], 400);
    }

    $stmt = $db->prepare("DELETE FROM broadcast_notices WHERE id = :id");
    $stmt->execute(['id' => $noticeId]);

    sendJsonResponse(["success" => true, "id" => $noticeId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);

