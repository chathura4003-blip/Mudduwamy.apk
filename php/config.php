<?php
/**
 * Database & API Configuration for Sri Sumana Maha Pirivena ERP
 * Production Backend Configuration for StackCP / Shared Hosting / VPS
 */

// Universal Polyfills for PHP 7.0 - 8.4 compatibility
if (!function_exists('str_starts_with')) {
    function str_starts_with($haystack, $needle) {
        return (string)$needle !== '' && strncmp($haystack, $needle, strlen($needle)) === 0;
    }
}
if (!function_exists('str_ends_with')) {
    function str_ends_with($haystack, $needle) {
        return $needle === '' || $needle === substr($haystack, -strlen($needle));
    }
}
if (!function_exists('str_contains')) {
    function str_contains($haystack, $needle) {
        return $needle !== '' && strpos($haystack, $needle) !== false;
    }
}

if (ob_get_level() === 0) {
    ob_start();
}

// Standard Sri Lanka Timezone Configuration (SLST - UTC+05:30)
date_default_timezone_set('Asia/Colombo');

// Error Logging Setup
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../php-errors.log');

// CORS Headers Setup
if (!headers_sent()) {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Authorization, X-Auth-Token");
    header("Content-Type: application/json; charset=UTF-8");
}

// Handle CORS Preflight OPTIONS
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    if (!headers_sent()) {
        http_response_code(200);
    }
    exit();
}

// Load backend environment variables (.env in php/ directory or project root)
$envFiles = [__DIR__ . '/.env', __DIR__ . '/../.env'];
foreach ($envFiles as $envFile) {
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines) {
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || substr($line, 0, 1) === '#') continue;
                if (strpos($line, '=') !== false) {
                    list($envKey, $envVal) = explode('=', $line, 2);
                    $envKey = trim($envKey);
                    $envVal = trim($envVal, " \t\n\r\0\x0B\"'");
                    if (!isset($_ENV[$envKey])) $_ENV[$envKey] = $envVal;
                    if (!getenv($envKey)) putenv("{$envKey}={$envVal}");
                }
            }
        }
    }
}

// MySQL Database Credentials (Local WAMP / Production)
$dbUrl = getenv('MYSQL_URL') ?: getenv('DATABASE_URL') ?: (isset($_ENV['MYSQL_URL']) ? $_ENV['MYSQL_URL'] : (isset($_SERVER['MYSQL_URL']) ? $_SERVER['MYSQL_URL'] : null));

$defaultHost = '127.0.0.1';
$defaultPort = '3306';
$defaultName = 'sri_sumana_pirivena_erp';
$defaultUser = 'root';
$defaultPass = '';

if (!empty($dbUrl)) {
    $parsedUrl = parse_url($dbUrl);
    $defaultHost = $parsedUrl['host'] ?? $defaultHost;
    $defaultPort = (string)($parsedUrl['port'] ?? $defaultPort);
    $defaultUser = $parsedUrl['user'] ?? $defaultUser;
    $defaultPass = $parsedUrl['pass'] ?? $defaultPass;
    $defaultName = isset($parsedUrl['path']) ? ltrim($parsedUrl['path'], '/') : $defaultName;
}

define('DB_HOST', getenv('DB_HOST') ?: (isset($_ENV['DB_HOST']) ? $_ENV['DB_HOST'] : (isset($_SERVER['DB_HOST']) ? $_SERVER['DB_HOST'] : $defaultHost)));
define('DB_PORT', getenv('DB_PORT') ?: (isset($_ENV['DB_PORT']) ? $_ENV['DB_PORT'] : (isset($_SERVER['DB_PORT']) ? $_SERVER['DB_PORT'] : $defaultPort)));
define('DB_NAME', getenv('DB_NAME') ?: (isset($_ENV['DB_NAME']) ? $_ENV['DB_NAME'] : (isset($_SERVER['DB_NAME']) ? $_SERVER['DB_NAME'] : $defaultName)));
define('DB_USER', getenv('DB_USER') ?: (isset($_ENV['DB_USER']) ? $_ENV['DB_USER'] : (isset($_SERVER['DB_USER']) ? $_SERVER['DB_USER'] : $defaultUser)));
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : (isset($_ENV['DB_PASS']) ? $_ENV['DB_PASS'] : (isset($_SERVER['DB_PASS']) ? $_SERVER['DB_PASS'] : $defaultPass)));

// Directory paths
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL_PREFIX', '/uploads/');

if (!file_exists(UPLOAD_DIR)) {
    @mkdir(UPLOAD_DIR, 0777, true);
}

/**
 * Safely delete an uploaded physical file from the server's uploads folder
 * @param string $fileUrl (e.g. "/uploads/up_20260816_1234.pdf" or "https://domain.com/uploads/up_xxx.jpg")
 */
function deleteUploadedFile($fileUrl) {
    if (empty($fileUrl) || !is_string($fileUrl)) return false;
    
    // Extract file basename if it's an uploaded file
    if (strpos($fileUrl, '/uploads/') !== false || strpos($fileUrl, 'up_') !== false) {
        $filename = basename(parse_url($fileUrl, PHP_URL_PATH));
        if (!empty($filename)) {
            $filePath = rtrim(UPLOAD_DIR, '/\\') . DIRECTORY_SEPARATOR . $filename;
            if (file_exists($filePath) && is_file($filePath)) {
                return @unlink($filePath);
            }
        }
    }
    return false;
}

/**
 * Automatically decodes Base64 data URLs and saves them to the server's uploads/avatars/ directory.
 * If already a clean URL or empty, returns as is.
 * @param string|null $avatar
 * @param string $prefix
 * @return string|null Clean URL path (e.g. "/uploads/avatars/usr_20260824_1234.jpg")
 */
function saveAvatarIfBase64($avatar, $prefix = 'avatar') {
    if (empty($avatar) || !is_string($avatar)) {
        return $avatar;
    }
    $avatar = trim($avatar);
    if (preg_match('/^data:image\/(\w+);base64,(.+)$/s', $avatar, $matches)) {
        $ext = strtolower($matches[1]);
        if ($ext === 'jpeg') $ext = 'jpg';
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
            $ext = 'jpg';
        }
        $rawBinary = base64_decode($matches[2]);
        if ($rawBinary !== false && strlen($rawBinary) > 0) {
            $targetDir = rtrim(UPLOAD_DIR, '/\\') . DIRECTORY_SEPARATOR . 'avatars';
            if (!file_exists($targetDir)) {
                @mkdir($targetDir, 0777, true);
            }
            $safeName = $prefix . '_' . date('Ymd_His') . '_' . rand(1000, 9999) . '.' . $ext;
            $targetPath = $targetDir . DIRECTORY_SEPARATOR . $safeName;
            if (@file_put_contents($targetPath, $rawBinary)) {
                return UPLOAD_URL_PREFIX . 'avatars/' . $safeName;
            }
        }
    }
    return $avatar;
}

/**
 * Universal Database Column Inspector
 */
if (!function_exists('getTableColumns')) {
    function getTableColumns($db, $table) {
        try {
            return $db->query("SHOW COLUMNS FROM `{$table}`")->fetchAll(PDO::FETCH_COLUMN) ?: [];
        } catch (Exception $e) {
            return [];
        }
    }
}

/**
 * Standardized API Success Response Helper
 * Format: { "success": true, "data": {}, "message": "Success" }
 */
function sendApiSuccess($data = [], $message = 'Success', $statusCode = 200) {
    sendJsonResponse([
        'success' => true,
        'data' => $data,
        'message' => $message,
    ], $statusCode);
}

/**
 * Standardized API Error Response Helper
 * Supports both signatures:
 *   sendApiError($message, $statusCode, $details)
 *   sendApiError($message, $errorCode, $statusCode, $data)
 */
function sendApiError($message = 'Error', $errorCodeOrStatus = 400, $statusCode = 400, $data = null) {
    if (is_numeric($errorCodeOrStatus)) {
        $actualStatus = intval($errorCodeOrStatus);
        $actualCode = ($actualStatus === 401 ? 'UNAUTHORIZED' : ($actualStatus === 403 ? 'FORBIDDEN' : ($actualStatus === 404 ? 'NOT_FOUND' : 'ERROR')));
        $actualData = (!is_numeric($statusCode) && $statusCode !== 400) ? $statusCode : $data;
    } else {
        $actualCode = $errorCodeOrStatus ?: 'ERROR';
        $actualStatus = is_numeric($statusCode) ? intval($statusCode) : 400;
        $actualData = $data;
    }

    $payload = [
        'success' => false,
        'message' => $message,
        'error' => $message,
        'code' => $actualCode,
        'status' => $actualStatus,
    ];
    if ($actualData !== null) {
        $payload['data'] = $actualData;
    }
    sendJsonResponse($payload, $actualStatus);
}

/**
 * Send High-Performance JSON Response (Compact, Gzip-compatible, Zero-delay)
 * If accessed directly from a web browser (Accept: text/html), renders an elegant Pirivena status page instead of exposing raw data.
 */
function sendJsonResponse($data, $statusCode = 200) {
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }

    // Auto-standardize error responses if raw associative arrays were passed
    if (is_array($data)) {
        if ($statusCode >= 400) {
            if (!isset($data['success'])) {
                $data['success'] = false;
            }
            if (!isset($data['message']) && isset($data['error'])) {
                $data['message'] = $data['error'];
            }
            if (isset($data['error']) && is_string($data['error']) && !preg_match('/^[A-Z0-9_]+$/', $data['error'])) {
                // If error field contains a sentence rather than an error code, normalize
                $defaultCode = ($statusCode === 401 ? 'UNAUTHORIZED' : ($statusCode === 403 ? 'FORBIDDEN' : ($statusCode === 404 ? 'NOT_FOUND' : ($statusCode === 422 ? 'VALIDATION_ERROR' : ($statusCode === 429 ? 'RATE_LIMITED' : 'SERVER_ERROR')))));
                $data['code'] = $defaultCode;
            }
        }
    }

    $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    
    // Check if directly visited in web browser address bar
    $isDirectBrowserVisit = (strpos($accept, 'text/html') !== false && !isset($_GET['json']) && !isset($_GET['raw']) && strpos($uri, '/api/health') === false && $uri !== '/api' && $uri !== '/api/' && $uri !== '/');

    if ($isDirectBrowserVisit) {
        $isSuccess = ($statusCode >= 200 && $statusCode < 300);
        $endpointName = htmlspecialchars(parse_url($uri, PHP_URL_PATH));
        if ($isSuccess) {
            $siMsg = "මෙම API සේවාව ({$endpointName}) කිසිදු දෝෂයකින් තොරව සාර්ථකව සක්‍රීයව ක්‍රියාත්මක වේ. දත්තවල පෞද්ගලිකත්වය සහ ආරක්ෂාව වෙනුවෙන් සෘජු දත්ත ප්‍රදර්ශනය සීමා කර ඇත.";
            $enMsg = "This API endpoint ({$endpointName}) is online and fully functional. Direct raw data inspection is restricted for system security & privacy.";
            renderSecurityPage("API සේවාව සක්‍රීයයි (Active)", $siMsg, $enMsg, $statusCode, true);
        } else {
            $errText = is_array($data) && isset($data['message']) ? $data['message'] : (is_array($data) && isset($data['error']) ? $data['error'] : "මෙම API සේවාව වෙත ප්‍රවේශ වීමට වලංගු අවසරයක් අවශ්‍ය වේ.");
            $siMsg = $errText;
            $enMsg = "Direct access to this endpoint requires proper authorization token.";
            renderSecurityPage("ආරක්ෂිත පද්ධති පණිවිඩය", $siMsg, $enMsg, $statusCode, false);
        }
    }

    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    if (!headers_sent()) {
        http_response_code($statusCode);
        header("Content-Type: application/json; charset=UTF-8");
        header("X-Content-Type-Options: nosniff");
        header("X-Frame-Options: SAMEORIGIN");
        header("X-XSS-Protection: 1; mode=block");
        header("Referrer-Policy: strict-origin-when-cross-origin");
        header("Permissions-Policy: geolocation=(), camera=(), microphone=()");
        header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
        header("Pragma: no-cache");
        header("Content-Length: " . strlen($json));
    }
    echo $json;
    exit();
}

/**
 * Render Elegant Pirivena-Themed Security & Status Page for Browser Visitors
 */
function renderSecurityPage($title, $messageSinhala, $messageEnglish = '', $statusCode = 401, $isSuccess = false) {
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }
    http_response_code($statusCode);
    header("Content-Type: text/html; charset=UTF-8");
    $accentColor = $isSuccess ? '#10b981' : ($statusCode === 401 || $statusCode === 403 ? '#f59e0b' : '#ef4444');
    $badgeText = $isSuccess ? 'ONLINE & SECURE' : ($statusCode === 401 ? '🔒 401 UNAUTHORIZED' : '⚠️ ' . $statusCode . ' ERROR');
    $badgeBg = $isSuccess ? '#064e3b' : ($statusCode === 401 ? '#78350f' : '#7f1d1d');
    $badgeBorder = $isSuccess ? '#10b981' : ($statusCode === 401 ? '#f59e0b' : '#ef4444');
    ?>
    <!DOCTYPE html>
    <html lang="si">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ශ්‍රී සුමන මහා පිරිවෙන - Smart ERP Gateway</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Noto+Sans+Sinhala:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                background: radial-gradient(circle at 50% 20%, #291807 0%, #0c0a09 70%, #000000 100%);
                color: #f5f5f4;
                font-family: 'Noto Sans Sinhala', 'Plus Jakarta Sans', sans-serif;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .card {
                background: rgba(28, 25, 23, 0.85);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(245, 158, 11, 0.35);
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(245, 158, 11, 0.12);
                border-radius: 24px;
                max-width: 520px;
                width: 100%;
                padding: 36px 28px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 4px;
                background: linear-gradient(90deg, #d97706, #fbbf24, #d97706);
            }
            .logo-wrap {
                width: 80px;
                height: 80px;
                margin: 0 auto 16px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.05) 70%);
                border: 2px solid rgba(251, 191, 36, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 25px rgba(245, 158, 11, 0.3);
                font-size: 38px;
                color: #fbbf24;
            }
            h1 {
                font-family: 'Noto Sans Sinhala', sans-serif;
                font-size: 20px;
                font-weight: 800;
                color: #fef3c7;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }
            .sub-title {
                font-size: 11px;
                font-weight: 700;
                color: #d97706;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-bottom: 20px;
            }
            .badge {
                display: inline-block;
                padding: 6px 14px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1px;
                background: <?= $badgeBg ?>;
                color: <?= $accentColor ?>;
                border: 1px solid <?= $badgeBorder ?>;
                margin-bottom: 20px;
            }
            .msg-si {
                font-size: 14px;
                line-height: 1.65;
                color: #e7e5e4;
                font-weight: 600;
                margin-bottom: 12px;
                background: rgba(0, 0, 0, 0.35);
                padding: 14px 16px;
                border-radius: 14px;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .msg-en {
                font-size: 12px;
                line-height: 1.5;
                color: #a8a29e;
                margin-bottom: 24px;
            }
            .btn-home {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                padding: 13px 20px;
                background: linear-gradient(135deg, #b45309 0%, #78350f 100%);
                color: #fffbeb;
                text-decoration: none;
                font-size: 13px;
                font-weight: 700;
                border-radius: 14px;
                border: 1px solid rgba(251, 191, 36, 0.4);
                box-shadow: 0 10px 20px -5px rgba(180, 83, 9, 0.5);
                transition: all 0.2s ease;
                cursor: pointer;
            }
            .btn-home:hover {
                background: linear-gradient(135deg, #d97706 0%, #92400e 100%);
                box-shadow: 0 12px 25px -5px rgba(217, 119, 6, 0.6);
                transform: translateY(-1px);
            }
            .footer-info {
                margin-top: 20px;
                font-size: 11px;
                color: #78716c;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo-wrap">☸</div>
            <h1>ශ්‍රී සුමන මහා පිරිවෙන</h1>
            <div class="sub-title">Smart ERP • Secure REST API Firewall</div>
            <div class="badge"><?= htmlspecialchars($badgeText) ?></div>
            
            <div class="msg-si">
                <?= nl2br(htmlspecialchars($messageSinhala)) ?>
            </div>

            <?php if (!empty($messageEnglish)): ?>
                <div class="msg-en">
                    <?= htmlspecialchars($messageEnglish) ?>
                </div>
            <?php endif; ?>

            <a href="/" class="btn-home">
                <span>🔐 ප්‍රධාන පද්ධතියට පිවිසෙන්න (Go to ERP Portal)</span>
            </a>

            <div class="footer-info">
                Sri Sumana Maha Pirivena ERP • Server Time: <?= date('Y-m-d H:i:s') ?>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit();
}



/**
 * Get High-Speed PDO Database Connection Singleton
 */
function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => true,
            PDO::ATTR_PERSISTENT => false,
        ];

        $hostsToTry = [DB_HOST];
        if (DB_HOST === 'localhost') {
            $hostsToTry[] = '127.0.0.1';
        } elseif (DB_HOST === '127.0.0.1') {
            $hostsToTry[] = 'localhost';
        }

        $lastException = null;
        foreach ($hostsToTry as $tryHost) {
            try {
                $dsn = "mysql:host=" . $tryHost . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                
                // MariaDB & MySQL Lenient Mode & UTF8MB4 & Sri Lanka Timezone (UTC+05:30)
                @$pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
                @$pdo->exec("SET sql_mode = 'NO_ENGINE_SUBSTITUTION'");
                @$pdo->exec("SET time_zone = '+05:30'");
                break;
            } catch (PDOException $e) {
                $lastException = $e;
            }
        }

        // If connection failed on all host variations
        if ($pdo === null) {
            $e = $lastException;

            // Auto-create database if missing (MariaDB / MySQL)
            if ($e && (strpos($e->getMessage(), 'Unknown database') !== false || $e->getCode() == 1049)) {
                try {
                    $rootDsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT;
                    $rootPdo = new PDO($rootDsn, DB_USER, DB_PASS, $options);
                    $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    
                    // Reconnect to the newly created database
                    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                    @$pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
                    @$pdo->exec("SET sql_mode = 'NO_ENGINE_SUBSTITUTION'");
                } catch (Exception $eRoot) {
                    error_log("Failed to auto-create MariaDB database: " . $eRoot->getMessage());
                }
            }

            if ($pdo === null) {
                error_log("MariaDB / MySQL Connection Error: " . ($e ? $e->getMessage() : 'Unknown error'));
                http_response_code(500);
                header("Content-Type: application/json; charset=UTF-8");
                echo json_encode([
                    "error" => "දත්ත සමුදාය (Database) සම්බන්ධතාව අසාර්ථක විය. කරුණාකර සුළු මොහොතකින් නැවත උත්සාහ කරන්න.",
                    "status" => "database_unavailable"
                ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                exit();
            }
        }

        // Auto-initialize MariaDB schema if tables don't exist yet
        try {
            $testStmt = $pdo->query("SHOW TABLES LIKE 'site_settings'");
            if ($testStmt && $testStmt->rowCount() === 0) {
                $schemaFile = __DIR__ . '/schema.sql';
                if (file_exists($schemaFile)) {
                    $sql = file_get_contents($schemaFile);
                    @$pdo->exec($sql);
                }
            }
        } catch (Exception $eSchema) {
            error_log("Auto-schema initialization skipped: " . $eSchema->getMessage());
        }
    }
    return $pdo;
}

/**
 * Core Database Schema & Auto-Seeding Handler
 */
function ensureCoreSchema() {
    try {
        $db = getDbConnection();
        if (!$db) return;

        $statements = [
            "CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(64) PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                monkName VARCHAR(255) DEFAULT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) DEFAULT NULL,
                phone VARCHAR(50) DEFAULT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'student',
                indexNumber VARCHAR(50) DEFAULT NULL,
                customId VARCHAR(100) DEFAULT NULL,
                nic VARCHAR(100) DEFAULT NULL,
                pirivenaClass VARCHAR(100) DEFAULT NULL,
                avatar VARCHAR(500) DEFAULT NULL,
                guardianName VARCHAR(255) DEFAULT NULL,
                guardianPhone VARCHAR(50) DEFAULT NULL,
                token VARCHAR(255) DEFAULT NULL,
                plain_password VARCHAR(255) DEFAULT '123456',
                status VARCHAR(50) DEFAULT 'active',
                classesAssigned TEXT,
                subjectsTaught TEXT,
                categoriesTaught TEXT,
                subjectsAssigned TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            "CREATE TABLE IF NOT EXISTS site_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) NOT NULL UNIQUE,
                setting_value LONGTEXT DEFAULT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS custom_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                section VARCHAR(50) NOT NULL,
                category_code VARCHAR(50) NOT NULL,
                name_sinhala VARCHAR(255) NOT NULL,
                name_english VARCHAR(255) NOT NULL,
                description TEXT DEFAULT NULL,
                is_default TINYINT(1) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS news (
                id VARCHAR(64) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                titleSinhala VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL DEFAULT 'General',
                summary TEXT DEFAULT NULL,
                summarySinhala TEXT DEFAULT NULL,
                content LONGTEXT DEFAULT NULL,
                contentSinhala LONGTEXT DEFAULT NULL,
                imageUrl VARCHAR(500) DEFAULT NULL,
                author VARCHAR(255) DEFAULT 'පිරිවෙන් පාලක සභාව',
                publishedDate DATE NOT NULL,
                isFeatured TINYINT(1) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS events (
                id VARCHAR(64) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                titleSinhala VARCHAR(255) NOT NULL,
                date DATE NOT NULL,
                time VARCHAR(100) DEFAULT NULL,
                location VARCHAR(255) DEFAULT 'ශ්‍රී සුමන මහා පිරිවෙන් ශාලාව',
                category VARCHAR(100) DEFAULT 'Religious',
                description TEXT DEFAULT NULL,
                descriptionSinhala TEXT DEFAULT NULL,
                imageUrl VARCHAR(500) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS gallery (
                id VARCHAR(64) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                titleSinhala VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL DEFAULT 'Events',
                imageUrl VARCHAR(500) NOT NULL,
                description TEXT DEFAULT NULL,
                descriptionSinhala TEXT DEFAULT NULL,
                date DATE DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS library (
                id VARCHAR(64) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                titleSinhala VARCHAR(255) NOT NULL,
                subject VARCHAR(100) NOT NULL,
                grade VARCHAR(50) NOT NULL,
                fileUrl VARCHAR(500) NOT NULL,
                fileSize VARCHAR(50) DEFAULT NULL,
                fileType VARCHAR(50) DEFAULT 'pdf',
                author VARCHAR(255) DEFAULT NULL,
                downloadCount INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS donations (
                id VARCHAR(64) PRIMARY KEY,
                receiptId VARCHAR(100) NOT NULL,
                donorName VARCHAR(255) NOT NULL,
                donorPhone VARCHAR(50) DEFAULT NULL,
                contactPhone VARCHAR(50) DEFAULT NULL,
                donorEmail VARCHAR(255) DEFAULT NULL,
                amount DECIMAL(12,2) NOT NULL DEFAULT 1000.00,
                amountOrItems VARCHAR(255) DEFAULT NULL,
                cause VARCHAR(255) DEFAULT 'පිරිවෙන් සංවර්ධන අරමුදල',
                type VARCHAR(255) DEFAULT 'පිරිවෙන් සංවර්ධන අරමුදල',
                receiptUrl MEDIUMTEXT DEFAULT NULL,
                slipUrl MEDIUMTEXT DEFAULT NULL,
                slipFileName VARCHAR(255) DEFAULT NULL,
                dedicationWish TEXT DEFAULT NULL,
                paymentMethod VARCHAR(50) DEFAULT 'Bank Transfer',
                status VARCHAR(50) DEFAULT 'pending',
                isAnonymous TINYINT(1) DEFAULT 0,
                date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS broadcast_notices (
                id VARCHAR(64) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                titleSinhala VARCHAR(255) DEFAULT NULL,
                message TEXT NOT NULL,
                messageSinhala TEXT DEFAULT NULL,
                severity VARCHAR(50) DEFAULT 'info',
                targetRole VARCHAR(50) DEFAULT 'all',
                category VARCHAR(100) DEFAULT 'General',
                active TINYINT(1) DEFAULT 1,
                createdBy VARCHAR(255) DEFAULT 'පිරිවෙන් පාලක සභාව',
                expiryDate DATE DEFAULT NULL,
                customColor VARCHAR(50) DEFAULT NULL,
                customIcon VARCHAR(50) DEFAULT NULL,
                attachmentUrl VARCHAR(500) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS classes (
                id VARCHAR(64) PRIMARY KEY,
                className VARCHAR(100) NOT NULL,
                classNameSinhala VARCHAR(100) NOT NULL,
                gradeLevel VARCHAR(50) NOT NULL,
                classTeacher VARCHAR(255) DEFAULT NULL,
                studentCount INT DEFAULT 0,
                academicYear VARCHAR(20) DEFAULT '2025/2026',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS subjects (
                id VARCHAR(64) PRIMARY KEY,
                subjectCode VARCHAR(50) NOT NULL,
                subjectName VARCHAR(255) NOT NULL,
                subjectNameSinhala VARCHAR(255) NOT NULL,
                gradeLevel VARCHAR(50) DEFAULT 'All',
                category VARCHAR(100) DEFAULT 'General',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS exams (
                id VARCHAR(64) PRIMARY KEY,
                examCode VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                subject VARCHAR(100) NOT NULL,
                gradeClass VARCHAR(50) NOT NULL,
                durationMinutes INT DEFAULT 60,
                totalMarks INT DEFAULT 100,
                status VARCHAR(50) DEFAULT 'published',
                published TINYINT(1) DEFAULT 1,
                questionsJson LONGTEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS admissions (
                id VARCHAR(64) PRIMARY KEY,
                trackingId VARCHAR(50) NOT NULL UNIQUE,
                fullName VARCHAR(255) NOT NULL,
                monkName VARCHAR(255) DEFAULT NULL,
                guardianName VARCHAR(255) DEFAULT NULL,
                phone VARCHAR(50) DEFAULT NULL,
                email VARCHAR(255) DEFAULT NULL,
                address TEXT DEFAULT NULL,
                gradeApplying VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                dateSubmitted DATE NOT NULL,
                notes TEXT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS exam_submissions (
                id VARCHAR(64) PRIMARY KEY,
                examId VARCHAR(64) NOT NULL,
                studentId VARCHAR(64) NOT NULL,
                studentName VARCHAR(255) DEFAULT NULL,
                answersJson LONGTEXT DEFAULT NULL,
                answers LONGTEXT DEFAULT NULL,
                marksObtained DECIMAL(5,2) DEFAULT 0,
                score DECIMAL(5,2) DEFAULT 0,
                totalMarks INT DEFAULT 100,
                timeTaken INT DEFAULT NULL,
                status VARCHAR(50) DEFAULT 'submitted',
                submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS study_materials (
                id VARCHAR(64) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                titleSinhala VARCHAR(255) DEFAULT NULL,
                subject VARCHAR(100) NOT NULL,
                gradeClass VARCHAR(50) DEFAULT 'All',
                classId VARCHAR(64) DEFAULT NULL,
                fileUrl VARCHAR(500) NOT NULL,
                fileType VARCHAR(50) DEFAULT 'pdf',
                fileSize VARCHAR(50) DEFAULT NULL,
                description TEXT DEFAULT NULL,
                uploadedBy VARCHAR(255) DEFAULT 'ආචාර්ය මණ්ඩලය',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS circular_downloads (
                id VARCHAR(64) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                titleSinhala VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL DEFAULT 'General',
                fileUrl VARCHAR(500) NOT NULL,
                fileSize VARCHAR(50) DEFAULT NULL,
                fileType VARCHAR(50) DEFAULT 'pdf',
                publishedDate DATE NOT NULL,
                downloadCount INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS audit_logs (
                id VARCHAR(64) PRIMARY KEY,
                userId VARCHAR(64) DEFAULT NULL,
                userName VARCHAR(255) DEFAULT NULL,
                actor VARCHAR(255) DEFAULT NULL,
                action VARCHAR(255) NOT NULL,
                details TEXT DEFAULT NULL,
                ipAddress VARCHAR(50) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS teacher_assignments (
                id VARCHAR(64) PRIMARY KEY,
                teacher_id VARCHAR(64) NOT NULL,
                class_id VARCHAR(64) NOT NULL,
                subject_id VARCHAR(64) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_teacher (teacher_id),
                INDEX idx_class (class_id),
                INDEX idx_subject (subject_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS student_subjects (
                id VARCHAR(64) PRIMARY KEY,
                student_id VARCHAR(64) NOT NULL,
                class_id VARCHAR(64) NOT NULL,
                subject_id VARCHAR(64) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_student (student_id),
                INDEX idx_class (class_id),
                INDEX idx_subject (subject_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS students (
                id VARCHAR(64) PRIMARY KEY,
                customId VARCHAR(100) DEFAULT NULL,
                indexNumber VARCHAR(100) DEFAULT NULL,
                admissionNo VARCHAR(100) DEFAULT NULL,
                name VARCHAR(255) NOT NULL,
                monkName VARCHAR(255) DEFAULT NULL,
                classId VARCHAR(64) DEFAULT NULL,
                pirivenaClass VARCHAR(100) DEFAULT NULL,
                email VARCHAR(255) DEFAULT NULL,
                phone VARCHAR(50) DEFAULT NULL,
                guardianName VARCHAR(255) DEFAULT NULL,
                guardianPhone VARCHAR(50) DEFAULT NULL,
                emergencyContact VARCHAR(50) DEFAULT NULL,
                address TEXT DEFAULT NULL,
                dateOfBirth DATE DEFAULT NULL,
                enrolledSubjects TEXT DEFAULT NULL,
                subjectsAssigned TEXT DEFAULT NULL,
                status VARCHAR(50) DEFAULT 'active',
                joinedDate DATE DEFAULT NULL,
                token VARCHAR(255) DEFAULT NULL,
                plain_password VARCHAR(255) DEFAULT '123456',
                avatar VARCHAR(500) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

            "CREATE TABLE IF NOT EXISTS teachers (
                id VARCHAR(64) PRIMARY KEY,
                customId VARCHAR(100) DEFAULT NULL,
                name VARCHAR(255) NOT NULL,
                monkName VARCHAR(255) DEFAULT NULL,
                email VARCHAR(255) DEFAULT NULL,
                phone VARCHAR(50) DEFAULT NULL,
                nic VARCHAR(50) DEFAULT NULL,
                qualifications VARCHAR(255) DEFAULT NULL,
                qualification VARCHAR(255) DEFAULT NULL,
                classesAssigned TEXT DEFAULT NULL,
                subjectsTaught TEXT DEFAULT NULL,
                categoriesTaught TEXT DEFAULT NULL,
                status VARCHAR(50) DEFAULT 'active',
                plain_password VARCHAR(255) DEFAULT '123456',
                token VARCHAR(255) DEFAULT NULL,
                avatar VARCHAR(500) DEFAULT NULL,
                photoUrl VARCHAR(500) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        ];

        foreach ($statements as $sql) {
            try {
                $db->exec($sql);
            } catch (Exception $e) {
                // Table already exists
            }
        }

        // Auto Column Migrations for Database Sync
        $columnMigrations = [
            "ALTER TABLE donations ADD COLUMN contactPhone VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE donations ADD COLUMN amountOrItems VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE donations ADD COLUMN type VARCHAR(255) DEFAULT 'පිරිවෙන් සංවර්ධන අරමුදල'",
            "ALTER TABLE donations ADD COLUMN slipUrl MEDIUMTEXT DEFAULT NULL",
            "ALTER TABLE donations ADD COLUMN slipFileName VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE donations ADD COLUMN dedicationWish TEXT DEFAULT NULL",
            "ALTER TABLE donations MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'",
            "ALTER TABLE donations MODIFY COLUMN receiptUrl MEDIUMTEXT DEFAULT NULL",
            "ALTER TABLE library ADD COLUMN fileUrl VARCHAR(500) DEFAULT NULL",
            "ALTER TABLE library ADD COLUMN pdfUrl VARCHAR(500) DEFAULT NULL",
            "ALTER TABLE subjects ADD COLUMN credits INT DEFAULT 4",
            "ALTER TABLE subjects ADD COLUMN description TEXT DEFAULT NULL",
            "ALTER TABLE subjects ADD COLUMN subjectNameSinhala VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE classes ADD COLUMN code VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE classes ADD COLUMN roomNumber VARCHAR(100) DEFAULT 'දේශන ශාලාව 01'",
            "ALTER TABLE classes ADD COLUMN subjects LONGTEXT DEFAULT NULL",
            "ALTER TABLE classes ADD COLUMN classNameSinhala VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE classes ADD COLUMN classTeacher VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE classes ADD COLUMN studentCount INT DEFAULT 0",
            "ALTER TABLE classes ADD COLUMN academicYear VARCHAR(20) DEFAULT '2025/2026'",
            "ALTER TABLE study_materials ADD COLUMN titleSinhala VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE study_materials ADD COLUMN gradeClass VARCHAR(50) DEFAULT 'All'",
            "ALTER TABLE study_materials ADD COLUMN classId VARCHAR(64) DEFAULT NULL",
            "ALTER TABLE study_materials ADD COLUMN subjectId VARCHAR(64) DEFAULT NULL",
            "ALTER TABLE study_materials ADD COLUMN uploadedByTeacherId VARCHAR(64) DEFAULT NULL",
            "ALTER TABLE study_materials ADD COLUMN fileName VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE study_materials ADD COLUMN type VARCHAR(50) DEFAULT 'pdf'",
            "ALTER TABLE study_materials ADD COLUMN fileSize VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE study_materials ADD COLUMN description TEXT DEFAULT NULL",
            "ALTER TABLE study_materials ADD COLUMN uploadedBy VARCHAR(255) DEFAULT 'ආචාර්ය මණ්ඩලය'",
            "ALTER TABLE study_materials ADD COLUMN dateUploaded DATE DEFAULT NULL",
            "ALTER TABLE study_materials ADD COLUMN uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE admissions MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'",
            "ALTER TABLE exam_submissions MODIFY COLUMN status VARCHAR(50) DEFAULT 'submitted'",
            "ALTER TABLE users ADD COLUMN token VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN plain_password VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN monkName VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN pirivenaClass VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN classId VARCHAR(64) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN customId VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN indexNumber VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN nic VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN educationCategory VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN classLevel VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN academicYear VARCHAR(50) DEFAULT '2025/2026'",
            "ALTER TABLE users ADD COLUMN classTeacherId VARCHAR(64) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN monkStatus VARCHAR(50) DEFAULT 'monk'",
            "ALTER TABLE users ADD COLUMN qualification VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN qualifications VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN guardianRelation VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN guardianAddress TEXT DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN templeName VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN nicOrBirthCert VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE users MODIFY COLUMN role VARCHAR(50) DEFAULT 'student'",
            "ALTER TABLE teachers ADD COLUMN token VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN plain_password VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN monkName VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN customId VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN nic VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN qualifications VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN qualification VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN specialization VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN registrationNumber VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN classesAssigned TEXT DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN subjectsTaught TEXT DEFAULT NULL",
            "ALTER TABLE teachers ADD COLUMN photoUrl VARCHAR(500) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN token VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN plain_password VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN customId VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN indexNumber VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN admissionNo VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN monkName VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN classId VARCHAR(64) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN pirivenaClass VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN guardianName VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN guardianPhone VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN emergencyContact VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN address TEXT DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN enrolledSubjects TEXT DEFAULT NULL",
            "ALTER TABLE students ADD COLUMN subjectsAssigned TEXT DEFAULT NULL",
            "ALTER TABLE exams ADD COLUMN classId VARCHAR(64) DEFAULT NULL",
            "ALTER TABLE exams ADD COLUMN teacherId VARCHAR(64) DEFAULT NULL",
            "ALTER TABLE exams ADD COLUMN scheduledDate DATETIME DEFAULT NULL",
            "ALTER TABLE exams ADD COLUMN startDate DATETIME DEFAULT NULL",
            "ALTER TABLE exams ADD COLUMN endDate DATETIME DEFAULT NULL",
            "ALTER TABLE exams ADD COLUMN duration INT DEFAULT 60",
            "ALTER TABLE exams ADD COLUMN durationMinutes INT DEFAULT 60",
            "ALTER TABLE exams ADD COLUMN passMark INT DEFAULT 40",
            "ALTER TABLE exams ADD COLUMN totalMarks INT DEFAULT 100",
            "ALTER TABLE exams ADD COLUMN questionsJson LONGTEXT DEFAULT NULL",
            "ALTER TABLE exams ADD COLUMN questions LONGTEXT DEFAULT NULL",
            "ALTER TABLE users MODIFY COLUMN avatar MEDIUMTEXT DEFAULT NULL",
            "ALTER TABLE students MODIFY COLUMN avatar MEDIUMTEXT DEFAULT NULL",
            "ALTER TABLE teachers MODIFY COLUMN avatar MEDIUMTEXT DEFAULT NULL",
            "ALTER TABLE exam_submissions MODIFY COLUMN studentAvatar MEDIUMTEXT DEFAULT NULL",
            "ALTER TABLE news MODIFY COLUMN imageUrl MEDIUMTEXT DEFAULT NULL",
            "ALTER TABLE events MODIFY COLUMN imageUrl MEDIUMTEXT DEFAULT NULL",
            "ALTER TABLE gallery MODIFY COLUMN imageUrl MEDIUMTEXT DEFAULT NULL",
        ];

        foreach ($columnMigrations as $colSql) {
            try {
                $db->exec($colSql);
            } catch (Exception $eCol) {
                // Column already exists or modified
            }
        }

        // High-Speed Performance Indexes for MySQL
        $performanceIndexes = [
            "ALTER TABLE users ADD INDEX idx_user_role_status (role, status)",
            "ALTER TABLE users ADD INDEX idx_user_classId (classId)",
            "ALTER TABLE users ADD INDEX idx_user_customId (customId)",
            "ALTER TABLE users ADD INDEX idx_user_token (token(64))",
            "ALTER TABLE teacher_assignments ADD INDEX idx_ta_compound (teacher_id, class_id, subject_id)",
            "ALTER TABLE student_subjects ADD INDEX idx_ss_compound (student_id, class_id, subject_id)",
            "ALTER TABLE exams ADD INDEX idx_exam_status_pub (status, published)",
            "ALTER TABLE exams ADD INDEX idx_exam_class_subj (gradeClass, subject)",
            "ALTER TABLE exam_submissions ADD INDEX idx_sub_exam_student (examId, studentId)",
            "ALTER TABLE exam_submissions ADD INDEX idx_sub_status (status)",
            "ALTER TABLE study_materials ADD INDEX idx_mat_class (classId)",
            "ALTER TABLE study_materials ADD INDEX idx_mat_subject (subject)",
            "ALTER TABLE broadcast_notices ADD INDEX idx_bn_active_role (active, targetRole)",
            "ALTER TABLE broadcast_notices ADD INDEX idx_bn_created (created_at)",
            "ALTER TABLE news ADD INDEX idx_news_created (created_at)",
            "ALTER TABLE events ADD INDEX idx_event_date (date, created_at)",
            "ALTER TABLE gallery ADD INDEX idx_gal_cat (category, created_at)",
            "ALTER TABLE circular_downloads ADD INDEX idx_circ_date (publishedDate)",
            "ALTER TABLE admissions ADD INDEX idx_adm_status_date (status, dateSubmitted)",
            "ALTER TABLE donations ADD INDEX idx_don_status_date (status, date)",
        ];

        foreach ($performanceIndexes as $idxSql) {
            try {
                $db->exec($idxSql);
            } catch (Exception $eIdx) {
                // Index already exists or non-critical
            }
        }

        // Auto-seed default single admin user if not present
        $passHashAdmin = password_hash('admin123', PASSWORD_DEFAULT);

        $seedSql = "INSERT IGNORE INTO users (id, username, password, plain_password, monkName, name, email, phone, role, customId, indexNumber, pirivenaClass, status) VALUES
            ('usr-admin-01', 'admin', '$passHashAdmin', 'admin123', 'පූජ්‍ය ශ්‍රී සුමන නායක හිමි', 'ප්‍රධාන පරිපාලක (System Administrator)', 'admin@pirivena.lk', '0712345678', 'superadmin', 'ADM-001', 'ADM-001', 'පාලක මණ්ඩලය', 'active')";
        try {
            $db->exec($seedSql);
        } catch (Exception $eSeed) {
            // Ignore seed warnings
        }
    } catch (Exception $e) {
        error_log('ensureCoreSchema warning: ' . $e->getMessage());
    }
}

try {
    $lockFile = __DIR__ . '/.schema_initialized';
    if (!file_exists($lockFile)) {
        ensureCoreSchema();
        @file_put_contents($lockFile, date('Y-m-d H:i:s'));
    }
} catch (Exception $eSchema) {
    error_log("Schema initialization notice: " . $eSchema->getMessage());
}

/**
 * Get Request Body JSON object
 */
function getRequestBody() {
    $raw = file_get_contents("php://input");
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Record Audit Log Event to Database
 */
function logAuditEvent($action, $details = '', $category = 'System', $userName = null, $userId = null) {
    try {
        $db = getDbConnection();
        if (!$db) return;
        
        $id = 'aud_' . time() . '_' . rand(1000, 9999);
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $user = $userName ?: ($_SESSION['userName'] ?? ($_SESSION['name'] ?? 'ප්‍රධාන පරිපාලක (Superadmin)'));
        $uid = $userId ?: ($_SESSION['userId'] ?? 'usr-admin-01');
        
        $stmt = $db->prepare("INSERT INTO audit_logs (id, userId, userName, actor, action, details, ipAddress, created_at) 
            VALUES (:id, :uid, :uname, :actor, :act, :det, :ip, NOW())");
        $stmt->execute([
            'id' => $id,
            'uid' => $uid,
            'uname' => $user,
            'actor' => $user,
            'act' => $action,
            'det' => $details,
            'ip' => $ip
        ]);
    } catch (Exception $e) {
        error_log("Failed to write audit log: " . $e->getMessage());
    }
}

/**
 * Polyfill for getallheaders()
 */
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

/**
 * Authenticate Bearer Token or Session Header
/**
 * Normalize array fields from DB or JSON
 */
function normalizeUserArrayField($value) {
    if (is_array($value)) {
        return array_values(array_filter($value, function ($item) {
            return $item !== null && $item !== '';
        }));
    }
    if (is_string($value)) {
        $trimmed = trim($value);
        if ($trimmed === '') return [];
        $decoded = json_decode($trimmed, true);
        if (is_array($decoded)) {
            return array_values(array_filter($decoded, function ($item) {
                return $item !== null && $item !== '';
            }));
        }
        if (strpos($trimmed, ',') !== false) {
            return array_values(array_filter(array_map('trim', explode(',', $trimmed))));
        }
        return [$trimmed];
    }
    return [];
}

/**
 * Format user record with complete role-based credentials, assignments, and normalization
 */
function formatUserRecord($u, $db = null) {
    if (!$u || !is_array($u)) return $u;
    
    $rawRole = strtolower(trim($u['role'] ?? ''));
    $cId = strval($u['customId'] ?? ($u['indexNumber'] ?? ($u['id'] ?? '')));
    if (empty($rawRole) || $rawRole === 'undefined') {
        if (strpos($cId, 'TCH-') === 0) $rawRole = 'teacher';
        elseif (strpos($cId, 'ADM-') === 0 || strpos($cId, 'usr-admin') === 0) $rawRole = 'admin';
        else $rawRole = 'student';
    } elseif (strpos($cId, 'TCH-') === 0 && $rawRole === 'student') {
        $rawRole = 'teacher';
    } elseif ((strpos($cId, 'STD-') === 0 || strpos($cId, 'STU-') === 0) && $rawRole === 'teacher') {
        $rawRole = 'student';
    }
    $role = $rawRole;
    $u['role'] = $role;

    $customId = !empty($u['customId']) ? trim($u['customId']) : (!empty($u['indexNumber']) ? trim($u['indexNumber']) : null);

    if (empty($customId) || strpos($customId, 'usr-') === 0 || 
        ($role === 'teacher' && strpos($customId, 'TCH-') !== 0) || 
        ($role === 'student' && strpos($customId, 'STD-') !== 0 && strpos($customId, 'STU-') !== 0)) {
        $num = rand(100, 999);
        if (!empty($u['id'])) {
            $digits = preg_replace('/[^0-9]/', '', $u['id']);
            if (!empty($digits)) {
                $num = intval(substr($digits, -3));
            }
        }
        $prefix = $role === 'teacher' ? 'TCH' : ($role === 'admin' || $role === 'superadmin' ? 'ADM' : 'STD');
        $customId = sprintf('%s-%s-%03d', $prefix, date('Y'), $num > 0 ? $num : 1);
    }

    $u['customId'] = $customId;
    $u['indexNumber'] = $customId;
    $u['nic'] = !empty($u['nic']) ? trim($u['nic']) : null;
    $u['status'] = !empty($u['status']) ? $u['status'] : 'active';
    
    // Standardize monkStatus ('monk' vs 'lay')
    $rawMonkStatus = strtolower(trim($u['monkStatus'] ?? ''));
    if ($rawMonkStatus === 'lay') {
        $u['monkStatus'] = 'lay';
    } elseif ($rawMonkStatus === 'monk') {
        $u['monkStatus'] = 'monk';
    } else {
        $checkText = ($u['monkName'] ?? '') . ' ' . ($u['name'] ?? '');
        if (mb_stripos($checkText, 'හිමි') !== false || mb_stripos($checkText, 'Ven') !== false || mb_stripos($checkText, 'Thero') !== false || mb_stripos($checkText, 'සාමණේර') !== false) {
            $u['monkStatus'] = 'monk';
        } else {
            $u['monkStatus'] = 'lay';
        }
    }
    
    $resolvedClassId = !empty($u['classId']) ? trim($u['classId']) : (!empty($u['pirivenaClass']) ? trim($u['pirivenaClass']) : null);
    $u['classId'] = $resolvedClassId;
    $u['pirivenaClass'] = $resolvedClassId;

    $u['classesAssigned'] = normalizeUserArrayField($u['classesAssigned'] ?? null);
    $u['subjectsTaught'] = normalizeUserArrayField($u['subjectsTaught'] ?? null);
    $u['categoriesTaught'] = normalizeUserArrayField($u['categoriesTaught'] ?? null);
    $u['subjectsAssigned'] = normalizeUserArrayField($u['subjectsAssigned'] ?? null);
    
    // Academic & Professional Qualifications
    $u['qualification'] = !empty($u['qualification']) ? trim($u['qualification']) : (!empty($u['qualifications']) ? trim($u['qualifications']) : '');
    $u['qualifications'] = $u['qualification'];
    
    // Relational teacher_assignments / student_subjects fetching if $db is available
    $u['teacherAssignments'] = [];
    $u['studentSubjects'] = [];
    
    if ($db && !empty($u['id'])) {
        if ($role === 'teacher') {
            try {
                $tStmt = $db->prepare("SELECT class_id as classId, subject_id as subjectId FROM teacher_assignments WHERE teacher_id = :tid1 OR teacher_id = :tid2");
                $tStmt->execute(['tid1' => $u['id'], 'tid2' => $customId]);
                $assignments = $tStmt->fetchAll();
                if ($assignments && count($assignments) > 0) {
                    $u['teacherAssignments'] = $assignments;
                    $relClasses = array_values(array_unique(array_column($assignments, 'classId')));
                    $relSubjects = array_values(array_unique(array_column($assignments, 'subjectId')));
                    $u['classesAssigned'] = array_values(array_unique(array_merge($u['classesAssigned'], $relClasses)));
                    $u['subjectsTaught'] = array_values(array_unique(array_merge($u['subjectsTaught'], $relSubjects)));
                } elseif (!empty($u['classesAssigned']) && !empty($u['subjectsTaught'])) {
                    $genAsgn = [];
                    foreach ($u['classesAssigned'] as $c) {
                        foreach ($u['subjectsTaught'] as $s) {
                            $genAsgn[] = ['classId' => $c, 'subjectId' => $s];
                        }
                    }
                    $u['teacherAssignments'] = $genAsgn;
                }
            } catch (Exception $e) {
                $u['teacherAssignments'] = [];
            }
        } elseif ($role === 'student') {
            try {
                $sStmt = $db->prepare("SELECT class_id as classId, subject_id as subjectId FROM student_subjects WHERE student_id = :sid1 OR student_id = :sid2");
                $sStmt->execute(['sid1' => $u['id'], 'sid2' => $customId]);
                $subRows = $sStmt->fetchAll();
                if ($subRows && count($subRows) > 0) {
                    $u['studentSubjects'] = $subRows;
                    $assignedSubjects = array_values(array_unique(array_merge($u['subjectsAssigned'], array_column($subRows, 'subjectId'))));
                    $u['subjectsAssigned'] = $assignedSubjects;
                }
            } catch (Exception $e) {
                $u['studentSubjects'] = [];
            }
        }
    }

    // Format readable password for admin display
    if (!empty($u['plain_password'])) {
        $u['password'] = $u['plain_password'];
    } elseif (empty($u['password']) || strlen($u['password']) > 40) {
        $u['password'] = '123456';
    }

    return $u;
}

/**
 * Get Authenticated User from Bearer token
 */
function getAuthUser() {
    static $authCache = [];
    
    $headers = function_exists('getallheaders') ? getallheaders() : (function_exists('apache_request_headers') ? apache_request_headers() : []);
    $authHeader = '';
    
    // Normalize header keys
    $normalizedHeaders = [];
    if (is_array($headers)) {
        foreach ($headers as $k => $v) {
            $normalizedHeaders[strtolower(trim($k))] = trim($v);
        }
    }

    if (!empty($normalizedHeaders['authorization'])) {
        $authHeader = $normalizedHeaders['authorization'];
    } elseif (!empty($normalizedHeaders['x-authorization'])) {
        $authHeader = $normalizedHeaders['x-authorization'];
    } elseif (!empty($normalizedHeaders['x-auth-token'])) {
        $authHeader = 'Bearer ' . $normalizedHeaders['x-auth-token'];
    } elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['HTTP_X_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_X_AUTHORIZATION'];
    } elseif (!empty($_SERVER['HTTP_X_AUTH_TOKEN'])) {
        $authHeader = 'Bearer ' . trim($_SERVER['HTTP_X_AUTH_TOKEN']);
    } elseif (!empty($_GET['token'])) {
        $authHeader = 'Bearer ' . trim($_GET['token']);
    } elseif (!empty($_POST['token'])) {
        $authHeader = 'Bearer ' . trim($_POST['token']);
    }
    
    $token = '';
    if (!empty($authHeader)) {
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        } else {
            $token = trim($authHeader);
        }
    }

    if (empty($token)) return null;

    if (isset($authCache[$token])) {
        return $authCache[$token];
    }

    $db = getDbConnection();
    if (!$db) return null;

    try {
        $stmt = $db->prepare("SELECT * FROM users WHERE token = :tok LIMIT 1");
        $stmt->execute(['tok' => $token]);
        $user = $stmt->fetch();
        if ($user) {
            $formatted = formatUserRecord($user, $db);
            $authCache[$token] = $formatted;
            return $formatted;
        }

        // Check teachers table
        try {
            $tStmt = $db->prepare("SELECT * FROM teachers WHERE token = :tok LIMIT 1");
            $tStmt->execute(['tok' => $token]);
            $teacher = $tStmt->fetch();
            if ($teacher) {
                $teacher['role'] = 'teacher';
                $formatted = formatUserRecord($teacher, $db);
                $authCache[$token] = $formatted;
                return $formatted;
            }
        } catch (Exception $eT) {}

        // Check students table
        try {
            $sStmt = $db->prepare("SELECT * FROM students WHERE token = :tok LIMIT 1");
            $sStmt->execute(['tok' => $token]);
            $student = $sStmt->fetch();
            if ($student) {
                $student['role'] = 'student';
                $formatted = formatUserRecord($student, $db);
                $authCache[$token] = $formatted;
                return $formatted;
            }
        } catch (Exception $eS) {}

        return null;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Require Valid Authentication Token
 */
function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        sendJsonResponse([
            'success' => false,
            'error' => 'මෙම සේවාව වෙත ප්‍රවේශ වීමට කරුණාකර පළමුව පද්ධතියට Log In වන්න (Unauthorized: Authentication required).',
            'code' => 'UNAUTHORIZED',
            'status' => 401
        ], 401);
    }
    return $user;
}

/**
 * Require Specific Role Permission (e.g. admin, superadmin, teacher)
 */
function requireRole($allowedRoles = ['admin', 'superadmin']) {
    $user = requireAuth();
    $role = strtolower(trim($user['role'] ?? ''));
    $allowed = is_array($allowedRoles) ? array_map('strtolower', $allowedRoles) : [strtolower($allowedRoles)];
    
    if (!in_array($role, $allowed) && $role !== 'superadmin') {
        sendJsonResponse([
            'success' => false,
            'error' => 'මෙම ක්‍රියාව සිදුකිරීමට ඔබට ප්‍රමාණවත් පරිපාලක අවසර නොමැත (Forbidden: Insufficient privileges).',
            'code' => 'FORBIDDEN',
            'status' => 403
        ], 403);
    }
    return $user;
}

/**
 * OneSignal Push Notification Service for Sri Sumana Maha Pirivena ERP
 * Production Push Notification Gateway (Android Background & Foreground)
 */
require_once __DIR__ . '/OneSignalService.php';



