<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin', 'teacher']);
    $body = getRequestBody();

    $title = trim($body['title'] ?? 'ශ්‍රී සුමන මහා පිරිවෙන');
    $message = trim($body['message'] ?? '');
    $targetRole = trim($body['role'] ?? $body['targetRole'] ?? '');
    $classId = trim($body['classId'] ?? '');
    $targetUserIds = $body['targetUserIds'] ?? [];

    if (empty($message)) {
        sendJsonResponse(["error" => "Notification message is required."], 400);
    }

    $options = [];
    if (!empty($targetUserIds) && is_array($targetUserIds)) {
        $options['targetUserIds'] = $targetUserIds;
    } else if (!empty($classId) && $classId !== 'all') {
        $options['classId'] = $classId;
    } else if (!empty($targetRole) && $targetRole !== 'all') {
        $options['role'] = $targetRole;
    } else {
        $options['broadcast'] = true;
    }

    if (!empty($body['data']) && is_array($body['data'])) {
        $options['data'] = $body['data'];
    }

    $result = OneSignalService::sendNotification($title, $message, $options);

    logAuditEvent("Push Notification යැවීම", "මාතෘකාව: '{$title}' - පණිවිඩය: '{$message}'", 'Notifications');

    sendJsonResponse([
        "success" => true,
        "message" => "Notification dispatched successfully.",
        "result" => $result
    ], 200);
}

if ($method === 'GET') {
    sendJsonResponse([
        "status" => "active",
        "service" => "OneSignal Push Notification Engine",
        "app_id" => ONESIGNAL_APP_ID,
        "supported_targets" => ["broadcast", "role", "classId", "targetUserIds"]
    ]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
