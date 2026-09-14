<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'subjects.php' && $lastPart !== 'subjects' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

// Subjects table schema managed by php/migrations/

// Helper to format subject records for React UI
function formatSubjectRecord($s) {
    if (!$s || !is_array($s)) return $s;
    $name = !empty($s['subjectNameSinhala']) ? $s['subjectNameSinhala'] : (!empty($s['subjectName']) ? $s['subjectName'] : 'විෂයය');
    $s['name'] = $name;
    $s['nameSinhala'] = $name;
    $s['code'] = !empty($s['subjectCode']) ? $s['subjectCode'] : 'SUB-001';
    $s['credits'] = isset($s['credits']) ? intval($s['credits']) : 4;
    $s['description'] = !empty($s['description']) ? $s['description'] : '';
    $s['category'] = !empty($s['category']) ? $s['category'] : 'General';
    $s['gradeLevel'] = !empty($s['gradeLevel']) ? $s['gradeLevel'] : 'All';
    return $s;
}

// 1. GET Subjects
if ($method === 'GET') {
    if ($pathId) {
        $stmt = $db->prepare("SELECT * FROM subjects WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $pathId]);
        $subject = $stmt->fetch();
        if ($subject) {
            sendJsonResponse(formatSubjectRecord($subject));
        } else {
            sendJsonResponse(["error" => "Subject not found"], 404);
        }
    } else {
        $stmt = $db->query("SELECT * FROM subjects ORDER BY subjectCode ASC");
        $subjects = $stmt->fetchAll();
        foreach ($subjects as &$s) {
            $s = formatSubjectRecord($s);
        }
        sendJsonResponse($subjects);
    }
}

// 2. POST Subject
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : 'sub-' . time() . '-' . rand(100, 999);
    $subjectCode = isset($body['subjectCode']) && !empty($body['subjectCode']) ? trim($body['subjectCode']) : (isset($body['code']) ? trim($body['code']) : 'SUB-' . rand(100, 999));
    $subjectName = isset($body['subjectName']) && !empty($body['subjectName']) ? trim($body['subjectName']) : (isset($body['name']) ? trim($body['name']) : '');
    $subjectNameSinhala = isset($body['subjectNameSinhala']) && !empty($body['subjectNameSinhala']) ? trim($body['subjectNameSinhala']) : (isset($body['nameSinhala']) ? trim($body['nameSinhala']) : $subjectName);
    $gradeLevel = isset($body['gradeLevel']) ? trim($body['gradeLevel']) : 'All';
    $category = isset($body['category']) ? trim($body['category']) : 'General';
    $credits = isset($body['credits']) ? intval($body['credits']) : 4;
    $description = isset($body['description']) ? trim($body['description']) : null;

    if (empty($subjectName)) {
        sendJsonResponse(["error" => "Subject name is required."], 400);
    }

    try {
        $stmt = $db->prepare("INSERT INTO subjects (id, subjectCode, subjectName, subjectNameSinhala, gradeLevel, category, credits, description)
            VALUES (:id, :code, :sn, :sns, :gl, :cat, :cr, :desc)
            ON DUPLICATE KEY UPDATE 
                subjectCode = VALUES(subjectCode), 
                subjectName = VALUES(subjectName), 
                subjectNameSinhala = VALUES(subjectNameSinhala), 
                gradeLevel = VALUES(gradeLevel), 
                category = VALUES(category), 
                credits = VALUES(credits), 
                description = VALUES(description)");

        $stmt->execute([
            'id' => $id,
            'code' => $subjectCode,
            'sn' => $subjectName,
            'sns' => $subjectNameSinhala,
            'gl' => $gradeLevel,
            'cat' => $category,
            'cr' => $credits,
            'desc' => $description
        ]);
    } catch (Exception $ePost) {
        error_log("Failed to insert subject: " . $ePost->getMessage());
        sendJsonResponse(["error" => "Failed to save subject: " . $ePost->getMessage()], 500);
    }

    logAuditEvent("නව විෂයයක් එක් කිරීම (Subject Added)", "විෂයය: '{$subjectNameSinhala}' ({$subjectCode}) සාර්ථකව පද්ධතියට එක් කරන ලදී.", 'Academic');

    $item = formatSubjectRecord([
        "id" => $id,
        "subjectCode" => $subjectCode,
        "subjectName" => $subjectName,
        "subjectNameSinhala" => $subjectNameSinhala,
        "gradeLevel" => $gradeLevel,
        "category" => $category,
        "credits" => $credits,
        "description" => $description
    ]);

    sendJsonResponse(["success" => true, "subject" => $item], 201);
}

// 3. PUT / PATCH Subject
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $subjectId = $pathId ?: (isset($body['id']) ? $body['id'] : null);

    if (!$subjectId) {
        sendJsonResponse(["error" => "Subject ID is required."], 400);
    }

    $stmt = $db->prepare("SELECT * FROM subjects WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $subjectId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        sendJsonResponse(["error" => "Subject not found."], 404);
    }

    $subjectCode = isset($body['subjectCode']) ? trim($body['subjectCode']) : (isset($body['code']) ? trim($body['code']) : $existing['subjectCode']);
    $subjectName = isset($body['subjectName']) ? trim($body['subjectName']) : (isset($body['name']) ? trim($body['name']) : $existing['subjectName']);
    $subjectNameSinhala = isset($body['subjectNameSinhala']) ? trim($body['subjectNameSinhala']) : (isset($body['nameSinhala']) ? trim($body['nameSinhala']) : $existing['subjectNameSinhala']);
    $gradeLevel = isset($body['gradeLevel']) ? trim($body['gradeLevel']) : $existing['gradeLevel'];
    $category = isset($body['category']) ? trim($body['category']) : $existing['category'];
    $credits = isset($body['credits']) ? intval($body['credits']) : (isset($existing['credits']) ? intval($existing['credits']) : 4);
    $description = isset($body['description']) ? trim($body['description']) : ($existing['description'] ?? null);

    try {
        $stmt = $db->prepare("UPDATE subjects SET 
            subjectCode = :code, 
            subjectName = :sn, 
            subjectNameSinhala = :sns, 
            gradeLevel = :gl, 
            category = :cat, 
            credits = :cr, 
            description = :desc 
            WHERE id = :id");

        $stmt->execute([
            'id' => $subjectId,
            'code' => $subjectCode,
            'sn' => $subjectName,
            'sns' => $subjectNameSinhala,
            'gl' => $gradeLevel,
            'cat' => $category,
            'cr' => $credits,
            'desc' => $description
        ]);
    } catch (Exception $ePut) {
        error_log("Failed to update subject: " . $ePut->getMessage());
        sendJsonResponse(["error" => "Failed to update subject"], 500);
    }

    logAuditEvent("විෂය තොරතුරු යාවත්කාලීන කිරීම (Subject Updated)", "විෂයය: '{$subjectNameSinhala}' ({$subjectCode}) තොරතුරු යාවත්කාලීන කරන ලදී.", 'Academic');

    $item = formatSubjectRecord([
        "id" => $subjectId,
        "subjectCode" => $subjectCode,
        "subjectName" => $subjectName,
        "subjectNameSinhala" => $subjectNameSinhala,
        "gradeLevel" => $gradeLevel,
        "category" => $category,
        "credits" => $credits,
        "description" => $description
    ]);

    sendJsonResponse(["success" => true, "subject" => $item]);
}

// 4. DELETE Subject
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $subjectId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($_GET['id']) ? $_GET['id'] : null));

    if (!$subjectId) {
        sendJsonResponse(["error" => "Subject ID is required."], 400);
    }

    $stmt = $db->prepare("DELETE FROM subjects WHERE id = :id");
    $stmt->execute(['id' => $subjectId]);

    logAuditEvent("විෂයයක් මකා දැමීම (Subject Deleted)", "විෂය ID: '{$subjectId}' පද්ධතියෙන් ඉවත් කරන ලදී.", 'Academic');

    sendJsonResponse(["success" => true, "id" => $subjectId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
