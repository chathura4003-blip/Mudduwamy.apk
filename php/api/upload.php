<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $uploadDir = UPLOAD_DIR;
    if (!file_exists($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }

    $fileField = isset($_FILES['file']) ? $_FILES['file'] : (isset($_FILES['files']) ? $_FILES['files'] : null);

    if (!$fileField || empty($fileField['name'])) {
        sendJsonResponse(["error" => "No file uploaded."], 400);
    }

    $fileName = basename($fileField['name']);
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    // 🛡️ Security Allowlist for uploaded files
    $allowedExtensions = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp',
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'odt', 'ods',
        'mp3', 'm4a', 'wav', 'ogg', 'mp4', 'webm',
        'zip', 'rar', '7z'
    ];

    // Explicitly blocked dangerous scripts and executable formats
    $blockedExtensions = [
        'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'php8', 'phps',
        'cgi', 'pl', 'sh', 'bash', 'py', 'jsp', 'asp', 'aspx',
        'exe', 'bat', 'cmd', 'vbs', 'js', 'jar', 'htaccess', 'htpasswd'
    ];

    if (in_array($fileExt, $blockedExtensions, true) || !in_array($fileExt, $allowedExtensions, true)) {
        logAuditEvent("අනාරක්ෂිත ගොනුවක් Upload කිරීම වැළැක්වීම (Blocked File)", "අනාරක්ෂිත දිගුවක්: '{$fileExt}' සහිත ගොනුවක් Block කරන ලදී.", 'Security');
        sendJsonResponse(["error" => "ආරක්ෂක හේතුන් මත මෙම වර්ගයේ ගොනු Upload කිරීම තහනම් කර ඇත. (Unsupported or unsafe file format.)"], 400);
    }
    
    // Generate unique safe file name
    $safeName = 'up_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $fileExt;
    $targetPath = $uploadDir . $safeName;

    if (move_uploaded_file($fileField['tmp_name'], $targetPath)) {
        $fileUrl = UPLOAD_URL_PREFIX . $safeName;
        $fileSize = $fileField['size'];

        // Format friendly file size
        $formattedSize = '0 B';
        if ($fileSize > 1048576) {
            $formattedSize = round($fileSize / 1048576, 1) . ' MB';
        } else if ($fileSize > 1024) {
            $formattedSize = round($fileSize / 1024, 1) . ' KB';
        } else {
            $formattedSize = $fileSize . ' B';
        }

        sendJsonResponse([
            "success" => true,
            "fileUrl" => $fileUrl,
            "url" => $fileUrl,
            "filePath" => $fileUrl,
            "originalName" => $fileName,
            "fileSize" => $fileSize,
            "formattedSize" => $formattedSize,
            "message" => "File uploaded successfully."
        ], 201);
    } else {
        sendJsonResponse(["error" => "Failed to save uploaded file on server."], 500);
    }
}

if ($method === 'GET') {
    sendJsonResponse([
        "status" => "ready",
        "service" => "Sri Sumana Pirivena - Secure File Upload Gateway",
        "supported_method" => "POST",
        "field_name" => "file",
        "allowed_formats" => ["JPG", "PNG", "WEBP", "PDF", "DOCX", "SVG"],
        "max_file_size" => ini_get('upload_max_filesize'),
        "storage" => is_writable(UPLOAD_DIR) ? "Active & Writable" : "Warning: Not Writable"
    ], 200);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
