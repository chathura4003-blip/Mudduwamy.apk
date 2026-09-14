<?php
/**
 * Sri Sumana Maha Pirivena ERP - Web Database Setup & Diagnostic Wizard
 * Run from browser: https://yourdomain.com/php/db_setup.php or https://yourdomain.com/db_setup.php or https://yourdomain.com/api/db_setup
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

// 🛡️ Security Guard: If system is already initialized, require Admin role
if (file_exists(__DIR__ . '/.schema_initialized')) {
    $authUser = getAuthUser();
    if (!$authUser || !in_array(strtolower($authUser['role'] ?? ''), ['admin', 'superadmin'])) {
        http_response_code(403);
        echo "<!DOCTYPE html><html lang='si'><head><meta charset='UTF-8'><title>Access Denied - Sri Sumana Pirivena</title><style>body{font-family:sans-serif;background:#0d1117;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;} .box{background:#161b22;padding:2rem;border-radius:12px;border:1px solid #ff7b00;max-width:500px;text-align:center;}</style></head><body><div class='box'><h2 style='color:#f85149'>🛡️ ප්‍රවේශය සීමා කර ඇත (Access Denied)</h2><p>දත්ත සමුදාය (Database) දැනටමත් සාර්ථකව පිහිටුවා ඇත. නැවත Setup කිරීම සඳහා ප්‍රධාන පරිපාලක (Superadmin) ලෙස Login වී සිටිය යුතුය.</p><a href='/' style='display:inline-block;margin-top:1rem;padding:0.6rem 1.2rem;background:#ff7b00;color:#fff;text-decoration:none;border-radius:6px;'>මුල් පිටුවට පිවිසෙන්න</a></div></body></html>";
        exit();
    }
}

// Find .env and schema.sql
$envPath = file_exists(__DIR__ . '/.env') ? __DIR__ . '/.env' : __DIR__ . '/../.env';
$schemaPath = file_exists(__DIR__ . '/schema.sql') 
    ? __DIR__ . '/schema.sql' 
    : (file_exists(__DIR__ . '/php/schema.sql') 
        ? __DIR__ . '/php/schema.sql' 
        : (file_exists(__DIR__ . '/../php/schema.sql') 
            ? __DIR__ . '/../php/schema.sql' 
            : __DIR__ . '/database.sql'));

$statusMsg = '';
$statusType = ''; // 'success' | 'error' | 'info'
$installed = false;

// Read current .env if available
$currentConfig = [
    'DB_HOST' => 'localhost',
    'DB_PORT' => '3306',
    'DB_NAME' => '',
    'DB_USER' => '',
    'DB_PASS' => '',
];

if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines) {
        foreach ($lines as $l) {
            $l = trim($l);
            if ($l === '' || substr($l, 0, 1) === '#') continue;
            if (strpos($l, '=') !== false) {
                list($k, $v) = explode('=', $l, 2);
                $k = trim($k);
                $v = trim($v, " \t\n\r\0\x0B\"'");
                if (isset($currentConfig[$k])) {
                    $currentConfig[$k] = $v;
                }
            }
        }
    }
}

// Handle Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $host = trim($_POST['db_host'] ?? 'localhost');
    $port = trim($_POST['db_port'] ?? '3306');
    $name = trim($_POST['db_name'] ?? '');
    $user = trim($_POST['db_user'] ?? '');
    $pass = trim($_POST['db_pass'] ?? '');

    $currentConfig['DB_HOST'] = $host;
    $currentConfig['DB_PORT'] = $port;
    $currentConfig['DB_NAME'] = $name;
    $currentConfig['DB_USER'] = $user;
    $currentConfig['DB_PASS'] = $pass;

    if (empty($name) || empty($user)) {
        $statusMsg = "කරුණාකර Database Name සහ Database User ඇතුළත් කරන්න (Please fill in DB Name and DB User).";
        $statusType = "error";
    } else {
        try {
            // 1. Test Connection
            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 6
            ]);
            $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

            // 2. Save .env file
            $newEnv = "# Production StackCP / cPanel MySQL Configuration\n";
            $newEnv .= "DB_HOST={$host}\n";
            $newEnv .= "DB_PORT={$port}\n";
            $newEnv .= "DB_NAME={$name}\n";
            $newEnv .= "DB_USER={$user}\n";
            $newEnv .= "DB_PASS={$pass}\n\n";
            $newEnv .= "JWT_SECRET=pirivena_secret_key_2026_sumana_ratnapura\n";
            @file_put_contents($envPath, $newEnv);

            // Also write to parent .env if different
            if ($envPath !== __DIR__ . '/.env') {
                @file_put_contents(__DIR__ . '/.env', $newEnv);
            }

            // 3. Import schema.sql if requested or if tables missing
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

            $imported = false;
            if (isset($_POST['import_schema']) || count($tables) < 5) {
                if (file_exists($schemaPath)) {
                    $sqlContent = file_get_contents($schemaPath);
                    $pdo->exec($sqlContent);
                    $imported = true;
                    // Refresh tables list
                    $stmt = $pdo->query("SHOW TABLES");
                    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
                }
            }

            $tableCount = count($tables);
            $statusMsg = "✅ සාර්ථකයි! Database සම්බන්ධතාවය තහවුරු විය. Tables සංඛ්‍යාව: {$tableCount}." . ($imported ? " (Schema.sql සාර්ථකව Import කරන ලදී)" : "");
            $statusType = "success";
            $installed = true;

        } catch (PDOException $e) {
            $statusMsg = "❌ Database Connection Failed: " . htmlspecialchars($e->getMessage()) . "<br><br><small>💡 <strong>ඉඟිය:</strong> StackCP හි <em>'Manage MySQL Databases'</em> වෙත ගොස් එහි ඇති Host Name (e.g. localhost හෝ sql.stackstaging.com), Database Name, User Name සහ Password නිවැරදිදැයි පරීක්ෂා කරන්න.</small>";
            $statusType = "error";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="si">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Setup Wizard - ශ්‍රී සුමන මහා පිරිවෙන ERP</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Noto+Sans+Sinhala:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: radial-gradient(circle at 50% 20%, #291807 0%, #0c0a09 70%, #000000 100%);
            color: #f5f5f4;
            font-family: 'Noto Sans Sinhala', 'Plus Jakarta Sans', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
        }
        .wizard-card {
            background: rgba(28, 25, 23, 0.92);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(245, 158, 11, 0.35);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.15);
            border-radius: 20px;
            max-width: 580px;
            width: 100%;
            padding: 32px;
        }
        .header {
            text-align: center;
            margin-bottom: 24px;
        }
        .logo-badge {
            width: 64px;
            height: 64px;
            margin: 0 auto 12px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.05) 70%);
            border: 2px solid rgba(251, 191, 36, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: #fbbf24;
        }
        h1 {
            font-size: 20px;
            font-weight: 800;
            color: #fef3c7;
            margin-bottom: 4px;
        }
        p.subtitle {
            font-size: 12px;
            color: #d97706;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
        }
        .alert {
            padding: 14px 16px;
            border-radius: 12px;
            font-size: 13px;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        .alert-error {
            background: rgba(185, 28, 28, 0.25);
            border: 1px solid #ef4444;
            color: #fca5a5;
        }
        .alert-success {
            background: rgba(6, 95, 70, 0.3);
            border: 1px solid #10b981;
            color: #6ee7b7;
        }
        .form-group {
            margin-bottom: 16px;
        }
        label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #d6d3d1;
            margin-bottom: 6px;
        }
        .row {
            display: flex;
            gap: 12px;
        }
        .row .form-group {
            flex: 1;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 11px 14px;
            background: rgba(12, 10, 9, 0.8);
            border: 1px solid rgba(245, 158, 11, 0.25);
            border-radius: 10px;
            color: #fff;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }
        input[type="text"]:focus, input[type="password"]:focus {
            border-color: #f59e0b;
            box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }
        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #fbbf24;
            cursor: pointer;
            margin: 16px 0 20px;
        }
        .btn-submit {
            width: 100%;
            padding: 13px 20px;
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            color: #fffbeb;
            font-size: 14px;
            font-weight: 700;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 10px 20px -5px rgba(217, 119, 6, 0.5);
            transition: all 0.2s;
        }
        .btn-submit:hover {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            transform: translateY(-1px);
        }
        .btn-portal {
            display: block;
            text-align: center;
            margin-top: 14px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: #fef3c7;
            text-decoration: none;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
        }
        .btn-portal:hover {
            background: rgba(255, 255, 255, 0.15);
        }
        .info-box {
            background: rgba(0, 0, 0, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 12px 14px;
            border-radius: 10px;
            font-size: 11px;
            color: #a8a29e;
            margin-top: 18px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="wizard-card">
        <div class="header">
            <div class="logo-badge">☸</div>
            <h1>ශ්‍රී සුමන මහා පිරිවෙන ERP</h1>
            <p class="subtitle">Database Setup & Diagnostic Wizard</p>
        </div>

        <?php if (!empty($statusMsg)): ?>
            <div class="alert alert-<?= $statusType ?>">
                <?= $statusMsg ?>
            </div>
        <?php endif; ?>

        <form method="POST">
            <div class="row">
                <div class="form-group" style="flex: 2;">
                    <label>MySQL Host (හෝ StackCP DB Host)</label>
                    <input type="text" name="db_host" value="<?= htmlspecialchars($currentConfig['DB_HOST']) ?>" placeholder="localhost හෝ sql.stackstaging.com" required>
                </div>
                <div class="form-group" style="flex: 1;">
                    <label>Port</label>
                    <input type="text" name="db_port" value="<?= htmlspecialchars($currentConfig['DB_PORT']) ?>" placeholder="3306" required>
                </div>
            </div>

            <div class="form-group">
                <label>Database Name (දත්ත සමුදා නම)</label>
                <input type="text" name="db_name" value="<?= htmlspecialchars($currentConfig['DB_NAME']) ?>" placeholder="උදා: srisuman_erp" required>
            </div>

            <div class="form-group">
                <label>Database Username (පරිශීලක නාමය)</label>
                <input type="text" name="db_user" value="<?= htmlspecialchars($currentConfig['DB_USER']) ?>" placeholder="උදා: srisuman_user" required>
            </div>

            <div class="form-group">
                <label>Database Password (රහස්පදය)</label>
                <input type="password" name="db_pass" value="<?= htmlspecialchars($currentConfig['DB_PASS']) ?>" placeholder="ඔබගේ MySQL මුරපදය">
            </div>

            <label class="checkbox-label">
                <input type="checkbox" name="import_schema" value="1" <?= $installed ? '' : 'checked' ?>>
                <span>Auto-Import Schema SQL (Tables නොමැති නම් ස්වයංක්‍රීයව සාදන්න)</span>
            </label>

            <button type="submit" class="btn-submit">
                🔗 Save & Connect Database (සම්බන්ධ කරන්න)
            </button>
        </form>

        <a href="/" class="btn-portal">
            🏠 Return to Main Website / Dashboard
        </a>

        <div class="info-box">
            💡 <strong>StackCP උපදෙස්:</strong> StackCP පාලක පුවරුවේ <em>"Manage MySQL Databases"</em> වෙත ගොස් එහි ඇති Host Name, Database Name, User Name සහ Password ඇතුළත් කර Save ඔබන්න.
        </div>
    </div>
</body>
</html>
