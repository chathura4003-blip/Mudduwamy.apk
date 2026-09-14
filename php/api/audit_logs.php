<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Auto-seed initial system log if completely empty
try {
    $count = $db->query("SELECT COUNT(*) FROM audit_logs")->fetchColumn();
    if ($count == 0) {
        $initId = 'aud_init_' . time();
        $stmtInit = $db->prepare("INSERT INTO audit_logs (id, userId, userName, actor, action, details, ipAddress, created_at) 
            VALUES (:id, 'usr-admin-01', 'ප්‍රධාන පරිපාලක (System)', 'ප්‍රධාන පරිපාලක', 'පද්ධති ආරම්භය (System Initialized)', 'ශ්‍රී සුමන මහා පිරිවෙන් ERP ආරක්ෂක සටහන් පද්ධතිය සක්‍රීය විය.', '127.0.0.1', NOW())");
        $stmtInit->execute(['id' => $initId]);
    }
} catch (Exception $e) {
    error_log("Audit logs check error: " . $e->getMessage());
}

// 1. GET Audit Logs
if ($method === 'GET') {
    $authUser = getAuthUser();
    $isAdmin = $authUser && in_array(strtolower($authUser['role'] ?? ''), ['admin', 'superadmin']);

    if (!$isAdmin) {
        // Return empty list for non-admin/guests with 200 OK cleanly (Zero data leakage & no 401 console error)
        sendJsonResponse([], 200);
    }

    $stmt = $db->query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 300");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = [];
    foreach ($rows as $r) {
        $timestamp = !empty($r['created_at']) ? $r['created_at'] : date('Y-m-d H:i:s');
        $formatted[] = [
            'id' => $r['id'],
            'timestamp' => $timestamp,
            'created_at' => $timestamp,
            'userId' => $r['userId'] ?? 'usr-admin-01',
            'userName' => $r['userName'] ?? ($r['actor'] ?? 'පරිපාලක'),
            'actor' => $r['actor'] ?? ($r['userName'] ?? 'පරිපාලක'),
            'action' => $r['action'] ?? 'System Action',
            'details' => $r['details'] ?? '',
            'ipAddress' => $r['ipAddress'] ?? '127.0.0.1',
        ];
    }
    sendJsonResponse($formatted);
}

// 2. POST Audit Log (Add new event from Frontend)
if ($method === 'POST') {
    $body = getRequestBody();
    $action = isset($body['action']) ? trim($body['action']) : 'General Event';
    $details = isset($body['details']) ? trim($body['details']) : '';
    $category = isset($body['category']) ? trim($body['category']) : 'System';
    $userName = isset($body['userName']) ? trim($body['userName']) : (isset($body['actor']) ? trim($body['actor']) : null);
    $userId = isset($body['userId']) ? trim($body['userId']) : null;

    logAuditEvent($action, $details, $category, $userName, $userId);
    sendJsonResponse(["success" => true, "message" => "Audit log entry created"]);
}

// 3. DELETE Clear Logs
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    try {
        $db->exec("TRUNCATE TABLE audit_logs");
        logAuditEvent("ආරක්ෂක සටහන් පිරිසිදු කිරීම (Audit Log Cleared)", "සුපිරි පරිපාලක විසින් ආරක්ෂක සටහන් පිරිසිදු කරන ලදී.");
    } catch (Exception $e) {
        $db->exec("DELETE FROM audit_logs");
    }
    sendJsonResponse(["success" => true, "message" => "Audit logs cleared successfully"]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
