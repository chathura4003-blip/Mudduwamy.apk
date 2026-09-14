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

// 🛡️ Security Guard: Explicit CORS & HTTP Security Headers Setup
if (!headers_sent()) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = [
        'capacitor://localhost',
        'http://localhost',
        'https://localhost',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8000',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'https://srisumana.lk',
        'https://www.srisumana.lk',
        'https://srisumanamahapiriwena-lk.us.stackstaging.com'
    ];

    // Also support custom APP_URL or CORS_ALLOWED_ORIGINS from environment
    if (!empty($_ENV['APP_URL'])) {
        $allowedOrigins[] = rtrim($_ENV['APP_URL'], '/');
    }
    if (!empty($_ENV['CORS_ALLOWED_ORIGINS'])) {
        $extra = explode(',', $_ENV['CORS_ALLOWED_ORIGINS']);
        foreach ($extra as $ex) {
            $t = trim($ex);
            if (!empty($t)) $allowedOrigins[] = $t;
        }
    }

    if (!empty($origin)) {
        $matched = false;
        if (in_array($origin, $allowedOrigins, true)) {
            $matched = true;
        } elseif (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/', $origin)) {
            $matched = true;
        } elseif (preg_match('/^https?:\/\/([a-zA-Z0-9-]+\.)*stackstaging\.com$/', $origin)) {
            $matched = true;
        } elseif (preg_match('/^https?:\/\/([a-zA-Z0-9-]+\.)*srisumana\.lk$/', $origin)) {
            $matched = true;
        }

        if ($matched) {
            header("Access-Control-Allow-Origin: {$origin}");
            header("Access-Control-Allow-Credentials: true");
            header("Vary: Origin");
        }
    } else {
        // Native mobile apps (Capacitor/Android WebView without HTTP Origin header)
        header("Access-Control-Allow-Origin: *");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Authorization, X-Auth-Token, Accept, Origin");
    header("Access-Control-Max-Age: 86400");
    header("Content-Type: application/json; charset=UTF-8");

    // Standard HTTP Security Hardening Headers
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: SAMEORIGIN");
    header("Referrer-Policy: strict-origin-when-cross-origin");
    header("X-XSS-Protection: 1; mode=block");
    header("Permissions-Policy: geolocation=(), camera=(), microphone=()");
}

// Handle CORS Preflight OPTIONS
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    if (!headers_sent()) {
        http_response_code(204);
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

        // Auto-initialize database schema via migration runner if fresh install
        try {
            $testStmt = $pdo->query("SHOW TABLES LIKE 'site_settings'");
            if ($testStmt && $testStmt->rowCount() === 0) {
                require_once __DIR__ . '/migrations/MigrationRunner.php';
                $runner = new MigrationRunner($pdo, __DIR__ . '/migrations');
                $runner->runPending();
            }
        } catch (Exception $eSchema) {
            error_log("Auto-schema initialization skipped: " . $eSchema->getMessage());
        }
    }
    return $pdo;
}

/**
 * Core Database Schema & Auto-Seeding Handler
 * Delegates cleanly to versioned migrations in php/migrations/
 */
function ensureCoreSchema() {
    try {
        $db = getDbConnection();
        if (!$db) return;

        require_once __DIR__ . '/migrations/MigrationRunner.php';
        $runner = new MigrationRunner($db, __DIR__ . '/migrations');
        $runner->runPending();
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

    // 🛡️ Security Guard: Never return passwords, plain passwords, or tokens in formatted records
    unset($u['password'], $u['plain_password'], $u['passwordHash'], $u['token']);

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
 * Check if a teacher is assigned to a specific class and subject
 * Uses teacher_assignments as the authoritative single source of truth
 */
function isTeacherAssignedToClassAndSubject($teacherIdentifier, $classIdentifier, $subjectIdentifier = null, $db = null) {
    if (!$db) $db = getDbConnection();
    if (!$db || empty($teacherIdentifier)) return false;

    $tId = trim($teacherIdentifier);
    $cId = trim($classIdentifier ?? '');
    $sId = trim($subjectIdentifier ?? '');

    if (empty($cId) || strtolower($cId) === 'all') return true;

    try {
        $stmt = $db->prepare("SELECT class_id as classId, subject_id as subjectId FROM teacher_assignments WHERE teacher_id = :t1 OR teacher_id = :t2");
        $stmt->execute([':t1' => $tId, ':t2' => $tId]);
        $rows = $stmt->fetchAll();

        if (empty($rows)) {
            // Fallback check on users table if legacy record
            $uStmt = $db->prepare("SELECT classesAssigned, subjectsTaught FROM users WHERE id = :u1 OR customId = :u2");
            $uStmt->execute([':u1' => $tId, ':u2' => $tId]);
            $uRow = $uStmt->fetch();
            if ($uRow) {
                $cList = normalizeUserArrayField($uRow['classesAssigned'] ?? null);
                $sList = normalizeUserArrayField($uRow['subjectsTaught'] ?? null);
                $cMatch = in_array($cId, $cList, true) || in_array('all', array_map('strtolower', $cList), true);
                if (!$cMatch) return false;
                if (!empty($sId) && strtolower($sId) !== 'all') {
                    return in_array($sId, $sList, true) || in_array('all', array_map('strtolower', $sList), true);
                }
                return true;
            }
            return false;
        }

        $cIdNorm = strtolower($cId);
        $sIdNorm = !empty($sId) ? strtolower($sId) : null;

        foreach ($rows as $r) {
            $rowClass = strtolower(trim($r['classId'] ?? ''));
            $rowSubject = strtolower(trim($r['subjectId'] ?? ''));

            $classMatches = ($rowClass === $cIdNorm || $rowClass === 'all');
            if ($classMatches) {
                if ($sIdNorm === null || $sIdNorm === 'all') {
                    return true;
                }
                if ($rowSubject === $sIdNorm || $rowSubject === 'all') {
                    return true;
                }
            }
        }
        return false;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Authorize Teacher Assignment
 * Enforces Section 8: Teachers can only access classes & subjects assigned to them
 */
function requireTeacherAssignment($authUser, $classId, $subjectId = null, $db = null) {
    if (!$authUser) {
        requireAuth();
    }
    $role = strtolower(trim($authUser['role'] ?? ''));
    if ($role === 'admin' || $role === 'superadmin') {
        return $authUser;
    }
    if ($role === 'teacher') {
        $teacherId = $authUser['id'] ?? ($authUser['customId'] ?? '');
        if (isTeacherAssignedToClassAndSubject($teacherId, $classId, $subjectId, $db)) {
            return $authUser;
        }
        sendJsonResponse([
            'success' => false,
            'error' => 'ඔබ මෙම පන්තිය හෝ විෂය සඳහා පවරා ඇති ආචාර්යවරයෙකු නොවේ (Forbidden: Teacher not assigned to this class/subject).',
            'code' => 'FORBIDDEN',
            'status' => 403
        ], 403);
    }
    sendJsonResponse([
        'success' => false,
        'error' => 'මෙම ක්‍රියාව සිදුකිරීමට ඔබට ආචාර්යවරයෙකු ලෙස අවසර නොමැත (Forbidden: Teacher access required).',
        'code' => 'FORBIDDEN',
        'status' => 403
    ], 403);
}

/**
 * Authorize Student Ownership
 * Enforces Section 9: Students can ONLY access their own records/submissions
 */
function requireStudentOwnership($authUser, $targetStudentId) {
    if (!$authUser) {
        requireAuth();
    }
    $role = strtolower(trim($authUser['role'] ?? ''));
    if (in_array($role, ['admin', 'superadmin', 'teacher'])) {
        return $authUser;
    }
    if ($role === 'student') {
        $myId = trim($authUser['id'] ?? '');
        $myCustomId = trim($authUser['customId'] ?? '');
        $myIndex = trim($authUser['indexNumber'] ?? '');
        $target = trim(strval($targetStudentId));

        if ($target === $myId || $target === $myCustomId || $target === $myIndex) {
            return $authUser;
        }

        sendJsonResponse([
            'success' => false,
            'error' => 'ඔබට වෙනත් සිසුවෙකුගේ දත්ත හෝ ලකුණු පරිහරණය කිරීමට අවසර නොමැත (Forbidden: Cannot access other student resources).',
            'code' => 'FORBIDDEN',
            'status' => 403
        ], 403);
    }
    sendJsonResponse([
        'success' => false,
        'error' => 'අවසර නොලත් ප්‍රවේශයකි (Forbidden: Access denied).',
        'code' => 'FORBIDDEN',
        'status' => 403
    ], 403);
}

/**
 * OneSignal Push Notification Service for Sri Sumana Maha Pirivena ERP
 * Production Push Notification Gateway (Android Background & Foreground)
 */
require_once __DIR__ . '/OneSignalService.php';



