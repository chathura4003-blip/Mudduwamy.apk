<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // 🛡️ Security Guard: Require authenticated session for file uploads
    $authUser = requireAuth();

    $uploadDir = UPLOAD_DIR;
    if (!file_exists($uploadDir)) {
        @mkdir($uploadDir, 0755, true);
    }

    $fileField = isset($_FILES['file']) ? $_FILES['file'] : (isset($_FILES['files']) ? $_FILES['files'] : null);

    if (!$fileField || empty($fileField['name']) || empty($fileField['tmp_name'])) {
        sendJsonResponse(["error" => "No file uploaded."], 400);
    }

    if (!is_uploaded_file($fileField['tmp_name'])) {
        sendJsonResponse(["error" => "Invalid or forged upload request."], 400);
    }

    $fileSize = $fileField['size'] ?? 0;
    $maxFileSize = 25 * 1024 * 1024; // 25 MB max limit
    if ($fileSize <= 0 || $fileSize > $maxFileSize) {
        sendJsonResponse(["error" => "ගොනුවේ ප්‍රමාණය විශාල වැඩියි (උපරිම 25MB). File size exceeds 25MB."], 400);
    }

    $originalName = $fileField['name'];
    $fileExt = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    // 🛡️ Security: Detect and prevent double extensions (e.g. image.php.jpg or script.sh.png)
    $lowerOriginal = strtolower($originalName);
    if (preg_match('/\.(php|phtml|phar|pl|py|cgi|sh|exe|asp|jsp|bat|cmd|vbs|jar)\./i', $lowerOriginal)) {
        logAuditEvent("ද්විත්ව දිගු අනාරක්ෂිත ගොනුවක් Block කිරීම", "ගොනුව: '{$originalName}' Block කරන ලදී.", 'Security');
        sendJsonResponse(["error" => "ආරක්ෂක හේතුන් මත මෙම වර්ගයේ ගොනු Upload කිරීම තහනම් කර ඇත."], 400);
    }

    // 🛡️ Security Allowlist for uploaded extensions
    $allowedExtensions = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp',
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'odt', 'ods',
        'mp3', 'm4a', 'wav', 'ogg', 'mp4', 'webm',
        'zip', 'rar', '7z'
    ];

    // Explicitly blocked dangerous scripts and executable formats
    $blockedExtensions = [
        'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'php8', 'phps', 'phar',
        'cgi', 'pl', 'sh', 'bash', 'py', 'jsp', 'asp', 'aspx',
        'exe', 'bat', 'cmd', 'vbs', 'js', 'jar', 'htaccess', 'htpasswd'
    ];

    if (in_array($fileExt, $blockedExtensions, true) || !in_array($fileExt, $allowedExtensions, true)) {
        logAuditEvent("අනාරක්ෂිත ගොනුවක් Upload කිරීම වැළැක්වීම (Blocked File)", "අනාරක්ෂිත දිගුවක්: '{$fileExt}' සහිත ගොනුවක් Block කරන ලදී.", 'Security');
        sendJsonResponse(["error" => "ආරක්ෂක හේතුන් මත මෙම වර්ගයේ ගොනු Upload කිරීම තහනම් කර ඇත. (Unsupported or unsafe file format.)"], 400);
    }

    // 🛡️ Server-Side MIME Type Verification (Do NOT trust client-supplied header)
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $detectedMime = finfo_file($finfo, $fileField['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/bmp',
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv', 'application/rtf',
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'video/mp4', 'video/webm',
            'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/octet-stream'
        ];

        if (!in_array($detectedMime, $allowedMimes, true)) {
            logAuditEvent("අනාරක්ෂිත MIME Type ගොනුවක් Block කිරීම", "MIME: '{$detectedMime}', ගොනුව: '{$originalName}'", 'Security');
            sendJsonResponse(["error" => "අවලංගු හෝ අනාරක්ෂිත ගොනු වර්ගයකි (Invalid MIME type: {$detectedMime})."], 400);
        }
    }

    // 🛡️ Deep Inspection for script tags in SVG or Text files
    if (in_array($fileExt, ['svg', 'txt', 'csv'])) {
        $contentSample = file_get_contents($fileField['tmp_name'], false, null, 0, 4096);
        if ($contentSample !== false && preg_match('/<\?php|<script|javascript:|onload=|onerror=/i', $contentSample)) {
            logAuditEvent("ස්ක්‍රිප්ට් කේත සහිත ගොනුවක් Block කිරීම (Malicious Content)", "ගොනුව: '{$originalName}'", 'Security');
            sendJsonResponse(["error" => "අනාරක්ෂිත කේත (Executable scripts) අඩංගු ගොනුවක් Upload කළ නොහැක."], 400);
        }
    }
    
    // Generate cryptographically secure randomized filename to prevent overwriting or path traversal
    $safeName = 'up_' . date('Ymd_His') . '_' . bin2hex(random_bytes(8)) . '.' . $fileExt;
    $targetPath = $uploadDir . $safeName;

    if (move_uploaded_file($fileField['tmp_name'], $targetPath)) {
        @chmod($targetPath, 0644);
        $fileUrl = UPLOAD_URL_PREFIX . $safeName;

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
            "originalName" => basename($originalName),
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
