<?php
/**
 * Local Development Router for PHP Built-in Server
 * Usage: php -S 0.0.0.0:8001 php/router.php
 */

require_once __DIR__ . '/config.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Define endpoint routes mapping to PHP scripts in api/
$routes = [
    '/api/auth'              => __DIR__ . '/api/auth.php',
    '/api/users'             => __DIR__ . '/api/users.php',
    '/api/teachers'          => __DIR__ . '/api/teachers.php',
    '/api/students'          => __DIR__ . '/api/students.php',
    '/api/news'              => __DIR__ . '/api/news.php',
    '/api/events'            => __DIR__ . '/api/events.php',
    '/api/gallery'           => __DIR__ . '/api/gallery.php',
    '/api/submissions'       => __DIR__ . '/api/submissions.php',
    '/api/donations'         => __DIR__ . '/api/donations.php',
    '/api/library'           => __DIR__ . '/api/library.php',
    '/api/upload'            => __DIR__ . '/api/upload.php',
    '/api/custom-categories' => __DIR__ . '/api/custom_categories.php',
    '/api/site-settings'     => __DIR__ . '/api/settings.php',
    '/api/settings'          => __DIR__ . '/api/settings.php',
    '/api/classes'           => __DIR__ . '/api/classes.php',
    '/api/subjects'          => __DIR__ . '/api/subjects.php',
    '/api/exams'             => __DIR__ . '/api/exams.php',
    '/api/certificates'      => __DIR__ . '/api/certificates.php',
    '/api/admissions'        => __DIR__ . '/api/admissions.php',
    '/api/broadcast-notices' => __DIR__ . '/api/broadcast.php',
    '/api/notifications'     => __DIR__ . '/api/notifications.php',
    '/api/chat'              => __DIR__ . '/api/chat.php',
    '/api/audit-logs'        => __DIR__ . '/api/audit_logs.php',
    '/api/ai'                => __DIR__ . '/api/ai.php',
    '/api/backup'            => __DIR__ . '/api/backup.php',
    '/api/materials'         => __DIR__ . '/api/materials.php',
    '/api/study-materials'   => __DIR__ . '/api/materials.php',
    '/api/search'            => __DIR__ . '/api/search.php',
    '/api/system-status'     => __DIR__ . '/api/settings.php',
    '/api/db/diagnose'       => __DIR__ . '/db_diagnose.php',
    '/api/db/status'         => __DIR__ . '/db_diagnose.php',
    '/api/db_setup'          => __DIR__ . '/db_setup.php',
];

// If accessing root "/" or "/api" on PHP API server, show friendly API info or gorgeous HTML status page
if ($uri === '/' || $uri === '/api' || $uri === '/api/' || $uri === '/api/health') {
    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    if (strpos($accept, 'text/html') !== false && !isset($_GET['json'])) {
        $siMsg = "ශ්‍රී සුමන මහා පිරිවෙන ස්මාර්ට් ERP පද්ධතියේ REST API සේවාව සාර්ථකව සක්‍රීයව පවතී (Active & Online). සියලුම දත්ත ආරක්ෂිතව පද්ධතිය මඟින් ආරක්ෂා කර ඇත.";
        $enMsg = "Sri Sumana Maha Pirivena ERP REST API Gateway is Online & Protected. Direct database and user records are secured.";
        renderSecurityPage("API Gateway Online", $siMsg, $enMsg, 200, true);
    }

    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "system" => "Sri Sumana Pirivena ERP - REST API",
        "status" => "Online & Secure",
        "version" => "3.8.5 PRO",
        "timestamp" => date('Y-m-d H:i:s'),
        "frontend_url" => "/"
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit();
}

// 1. Serve uploaded files directly from UPLOAD_DIR with exact MIME headers
if (strpos($uri, '/uploads/') === 0) {
    $fileName = basename($uri);
    $targetFile = UPLOAD_DIR . $fileName;

    if (file_exists($targetFile) && !is_dir($targetFile)) {
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $mimeTypes = [
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif'  => 'image/gif',
            'svg'  => 'image/svg+xml',
            'pdf'  => 'application/pdf',
            'apk'  => 'application/vnd.android.package-archive',
        ];
        $mime = isset($mimeTypes[$ext]) ? $mimeTypes[$ext] : (mime_content_type($targetFile) ?: 'image/png');

        header("Access-Control-Allow-Origin: *");
        header("Content-Type: " . $mime);
        header("Content-Length: " . filesize($targetFile));
        header("Cache-Control: public, max-age=86400");
        readfile($targetFile);
        exit();
    } else {
        // Return elegant fallback SVG placeholder for deleted/missing upload files
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: image/svg+xml");
        echo '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#78350f"/><stop offset="100%" stop-color="#1c1917"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="64" fill="#fde68a">☸</text></svg>';
        exit();
    }
}

// 2. Serve APK files directly if requested
if (substr($uri, -4) === '.apk') {
    $apkFile = __DIR__ . '/..' . $uri;
    if (file_exists($apkFile)) {
        header("Access-Control-Allow-Origin: *");
        header("Content-Type: application/vnd.android.package-archive");
        header("Content-Disposition: attachment; filename=\"" . basename($apkFile) . "\"");
        header("Content-Length: " . filesize($apkFile));
        header("Cache-Control: no-cache");
        readfile($apkFile);
        exit();
    }
}

// Block direct access to sensitive files (environment, credentials, configs, sql, logs, git)
$blockedPatterns = ['/\.env', '\.json$', '\.sql$', '\.log$', '\.ini$', '\.bak$', '\.key$', '\.pem$', 'firebase-service-account', '/config\.php', '/\.git', '/composer\.', '/package\.json'];
foreach ($blockedPatterns as $pattern) {
    if (preg_match('#' . $pattern . '#i', $uri)) {
        http_response_code(403);
        echo json_encode(["error" => "Access Denied: Protected File"], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// Allow serving safe static files directly if present
$filePath = __DIR__ . '/..' . $uri;
if (file_exists($filePath) && !is_dir($filePath)) {
    return false;
}

foreach ($routes as $routePrefix => $scriptPath) {
    if (strpos($uri, $routePrefix) === 0) {
        if (file_exists($scriptPath)) {
            require $scriptPath;
            exit();
        }
    }
}

// Direct access to php/api/*.php
if (strpos($uri, '/php/api/') === 0) {
    $script = __DIR__ . str_replace('/php', '', $uri);
    if (file_exists($script)) {
        require $script;
        exit();
    }
}

http_response_code(404);
echo json_encode(["error" => "Endpoint Not Found", "uri" => $uri], JSON_UNESCAPED_UNICODE);
