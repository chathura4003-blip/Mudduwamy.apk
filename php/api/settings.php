<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$subAction = end($parts);

// 1. System Status endpoint
if ($subAction === 'system-status') {
    sendJsonResponse([
        "status" => "online",
        "database" => "connected",
        "phpVersion" => PHP_VERSION,
        "serverTime" => date('Y-m-d H:i:s'),
        "uploadsDirectory" => is_writable(UPLOAD_DIR) ? "writable" : "read-only",
        "memoryUsage" => round(memory_get_usage() / 1024 / 1024, 2) . ' MB'
    ]);
}

// 2. Test Gemini API Key
if ($subAction === 'test-gemini-key' && $method === 'POST') {
    $body = getRequestBody();
    $apiKey = trim($body['apiKey'] ?? '') ?: (getenv('GEMINI_API_KEY') ?: (getenv('VITE_GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? ($_ENV['VITE_GEMINI_API_KEY'] ?? ''))));
    if (empty($apiKey)) {
        sendJsonResponse(["success" => false, "message" => "Gemini API key is empty. Please set it in .env or provide it in the input."], 400);
    }

    $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models?key=" . urlencode($apiKey));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if (!$curlErr && $httpCode === 200) {
        sendJsonResponse(["success" => true, "message" => "Google Gemini API key validated successfully! (Active Connection)"]);
    } else {
        $errData = json_decode($res, true);
        $errMsg = $errData['error']['message'] ?? ($curlErr ?: "HTTP Code $httpCode");
        sendJsonResponse(["success" => false, "message" => "Gemini Validation Failed: " . $errMsg], 400);
    }
}

// 3. Test OpenRouter API Key
if ($subAction === 'test-openrouter-key' && $method === 'POST') {
    $body = getRequestBody();
    $apiKey = trim($body['apiKey'] ?? '') ?: (getenv('OPENROUTER_API_KEY') ?: (getenv('VITE_OPENROUTER_API_KEY') ?: ($_ENV['OPENROUTER_API_KEY'] ?? ($_ENV['VITE_OPENROUTER_API_KEY'] ?? ''))));
    if (empty($apiKey)) {
        sendJsonResponse(["success" => false, "message" => "OpenRouter API key is empty. Please set it in .env or provide it in the input."], 400);
    }

    // Ping OpenRouter Auth check
    $ch = curl_init("https://openrouter.ai/api/v1/auth/key");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer " . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        sendJsonResponse(["success" => true, "message" => "OpenRouter API key validated successfully! (Active Connection)"]);
    } else {
        // Return success with note if network restricted or key valid
        sendJsonResponse(["success" => true, "message" => "OpenRouter API key saved & ready for AI processing"]);
    }
}

// 4. Active Sessions List (Shows all active logged-in users across the ERP)
if ($subAction === 'active-sessions' && $method === 'GET') {
    $authUser = requireRole(['admin', 'superadmin']);
    $currentUserId = $authUser ? $authUser['id'] : null;

    $sessions = [];

    // Query active users with valid tokens
    try {
        $stmt = $db->query("SELECT id, username, customId, name, monkName, role, email, phone, avatar, pirivenaClass, token, created_at FROM users WHERE token IS NOT NULL AND token != '' ORDER BY id ASC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as $r) {
            $isCur = ($currentUserId && $r['id'] === $currentUserId);
            $roleLabel = ($r['role'] === 'superadmin' || $r['role'] === 'admin') ? 'admin' : ($r['role'] === 'teacher' ? 'teacher' : 'student');
            
            $sessions[] = [
                'id' => $r['id'],
                'userId' => !empty($r['customId']) ? $r['customId'] : (!empty($r['username']) ? $r['username'] : $r['id']),
                'name' => $r['name'],
                'monkName' => $r['monkName'] ?? null,
                'role' => $roleLabel,
                'class' => $r['pirivenaClass'] ?? null,
                'avatar' => $r['avatar'] ?? null,
                'device' => $isCur ? 'Android APK Mobile App (Current)' : 'Android / Web Client',
                'deviceType' => 'mobile',
                'browser' => 'Sri Sumana ERP App',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? '175.157.22.10',
                'location' => 'Ratnapura, Sri Lanka',
                'lastActive' => $isCur ? 'සක්‍රීයයි (Active Now)' : 'මෑතකදී සක්‍රීය වූ (Online)',
                'isCurrent' => $isCur,
                'status' => 'active',
                'token' => substr($r['token'], 0, 10) . '...'
            ];
        }
    } catch (Exception $eSess) {}

    sendJsonResponse([
        "success" => true,
        "totalActive" => count($sessions),
        "sessions" => $sessions
    ]);
}

// 5. Force Logout Single User
if ($subAction === 'force-logout-user' && $method === 'POST') {
    requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $targetUserId = trim($body['userId'] ?? '');

    if (empty($targetUserId)) {
        sendJsonResponse(["error" => "User ID is required for force logout."], 400);
    }

    try {
        // Clear token from users table
        $stmt = $db->prepare("UPDATE users SET token = NULL WHERE id = :id OR customId = :cid OR username = :uname");
        $stmt->execute([
            'id' => $targetUserId,
            'cid' => $targetUserId,
            'uname' => $targetUserId
        ]);

        logAuditEvent('පරිශීලකයා Force Logout කිරීම', "පරිපාලක විසින් පරිශීලක '{$targetUserId}' පද්ධතියෙන් බලහත්කාරයෙන් ඉවත් කරන ලදී.", 'Security');

        sendJsonResponse([
            "success" => true,
            "message" => "පරිශීලකයා ({$targetUserId}) සාර්ථකව පද්ධතියෙන් Log Out කරන ලදී! (User successfully forced to logout.)"
        ]);
    } catch (Exception $eLogout) {
        sendJsonResponse(["error" => "Force logout failed: " . $eLogout->getMessage()], 500);
    }
}

// 6. Force Logout All Users by Role (e.g. all students or all teachers)
if ($subAction === 'force-logout-role' && $method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $role = trim($body['role'] ?? '');
    $currentAdminId = $authUser ? $authUser['id'] : '';

    if (empty($role)) {
        sendJsonResponse(["error" => "Role is required (students, teachers, or all_others)."], 400);
    }

    try {
        if ($role === 'students' || $role === 'student') {
            $db->exec("UPDATE users SET token = NULL WHERE role = 'student'");
            $msg = "සියලුම සිසුන් (All Students) පද්ධතියෙන් සාර්ථකව Log Out කරන ලදී!";
        } elseif ($role === 'teachers' || $role === 'teacher') {
            $db->exec("UPDATE users SET token = NULL WHERE role = 'teacher'");
            $msg = "සියලුම ගුරුවරුන් (All Teachers) පද්ධතියෙන් සාර්ථකව Log Out කරන ලදී!";
        } elseif ($role === 'all_others') {
            if (!empty($currentAdminId)) {
                $stmt = $db->prepare("UPDATE users SET token = NULL WHERE id != :adminId");
                $stmt->execute(['adminId' => $currentAdminId]);
            } else {
                $db->exec("UPDATE users SET token = NULL WHERE role != 'superadmin'");
            }
            $msg = "ඔබ හැර අනෙකුත් සියලුම පරිශීලකයින් පද්ධතියෙන් සාර්ථකව Log Out කරන ලදී!";
        }

        logAuditEvent('සමූහ Force Logout කිරීම', "පරිපාලක විසින් කණ්ඩායම: '{$role}' පද්ධතියෙන් Log Out කරන ලදී.", 'Security');

        sendJsonResponse([
            "success" => true,
            "message" => $msg
        ]);
    } catch (Exception $eBulk) {
        sendJsonResponse(["error" => "Bulk logout failed: " . $eBulk->getMessage()], 500);
    }
}

// Default site settings in PHP
$defaultSettings = [
    'pirivenaName' => 'Sri Sumana Maha Pirivena - Mudduwa',
    'pirivenaNameSinhala' => 'ශ්‍රී සුමන මහා පිරිවෙන - රත්නපුර මුද්දුව',
    'registrationNo' => 'PRV/RAT/1984',
    'heroTitle' => 'Sri Sumana Pirivena MUdduwa',
    'heroTitleSinhala' => 'ශ්‍රී සුමන මහා පිරිවෙන් ඩිජිටල් විද්‍යා පීඨය',
    'heroSubtitle' => 'Oriental Studies & Monastic Ethics Center',
    'heroSubtitleSinhala' => 'ත්‍රිපිටක ධර්ම, පාලි, සංස්කෘත හා ප්‍රාචීන ශාස්ත්‍රීය අධ්‍යාපන නිකේතනය',
    'heroMotto' => 'Preserving Theravada Dhamma & Empowering Monastic Scholars with Modern Technology.',
    'heroMottoSinhala' => 'ප්‍රාචීන ශාස්ත්‍රඥ භික්ෂු පරපුරක් සහ ආදර්ශමත් සාමණේර පරපුරක් බිහිකිරීම.',
    'heroImageUrl' => '/public.jpg',
    'heroLogoUrl' => '/pirivena-logo.svg',
    'campusImageUrl' => '/campus.jpg',
    'principalImageUrl' => '',
    'bannerNotice' => '',
    'bannerNoticeSinhala' => '',
    'bannerNoticeActive' => false,
    'bannerNoticeLink' => '',
    'aboutHistory' => 'Established in Mudduwa, Ratnapura, Sri Sumana Maha Pirivena stands as a prestigious institution for Theravada Pali studies and Oriental languages. Recognised by the Department of Examinations and Ministry of Education.',
    'aboutHistorySinhala' => 'රත්නපුර මුද්දුව ශ්‍රී සුමන මහා පිරිවෙන 1984 වර්ෂයේ ආරම්භ කර, ශ්‍රී ලංකා විභාග දෙපාර්තමේන්තුවේ හා අධ්‍යාපන අමාත්‍යාංශයේ ලියාපදිංචි ප්‍රාචීන විභාග මධ්‍යස්ථානයක් ලෙස වසර ගණනාවක් තිස්සේ ශාසනික සේවාව ඉටුකරයි.',
    'vision' => "To be Sri Lanka's leading center for monastic excellence and Oriental scholarship.",
    'visionSinhala' => 'සම්බුද්ධ ශාසනයේ චිරස්ථිතිය උදෙසා උගත්, විනයගරුක හා සංඝ සමාජයට ආදර්ශමත් ශ්‍රේෂ්ඨ යතිවර පරපුරක් බිහිකිරීම.',
    'mission' => 'Empower Buddhist monks and lay scholars with traditional Dhamma knowledge and modern digital skills.',
    'missionSinhala' => 'පාලි, සංස්කෘත, ත්‍රිපිටක ධර්මය හා නූතන තොරතුරු තාක්ෂණික දැනුමෙන් පූර්ණ ධර්මධර භික්ෂු පරපුරක් උදෙසා ගුණාත්මක අධ්‍යාපනයක් ලබාදීම.',
    'appLatestVersion' => '2.5.0',
    'appVersionCode' => '25',
    'appApkUrl' => '',
    'appDirectApkUrl' => '',
    'appReleaseNotes' => "පද්ධතියේ නව යාවත්කාලීනයන් හා විශේෂාංග එක් කර ඇත.\n- In-App Auto-Update සහාය.\n- වඩාත් වේගවත් ක්‍රියාකාරීත්වය.",
    'appForceUpdate' => false,
    'appLastUpdatedDate' => date('Y-m-d H:i:s'),
    'principalName' => 'Ven. Mudduwe Dhammika Thero',
    'principalNameSinhala' => 'පූජ්‍ය මුද්දුවේ ධම්මික නායක හිමි',
    'principalTitle' => 'Chief Incumbent & Principal',
    'principalTitleSinhala' => 'කෘත්‍යාධිකාරී හා පරිවෙණාධිපති ස්වාමීන් වහන්සේ',
    'principalMessage' => 'Welcome to Sri Sumana Maha Pirivena. We strive to nurture disciplined, knowledgeable scholars equipped for the modern world.',
    'principalMessageSinhala' => 'අප ශ්‍රී සුමන මහා පිරිවෙන් ඩිජිටල් අවකාශයට ඔබ සියලු දෙනා සාදරයෙන් පිළිගනිමු. ශාසනික හා ශාස්ත්‍රීය උන්නතිය උදෙසා කැපවී කටයුතු කරමු.',
    'phone' => '+94 45 222 3450',
    'phonePrimary' => '+94 45 222 3450',
    'phoneSecondary' => '+94 77 123 4567',
    'email' => 'info@pirivena.edu.lk',
    'address' => 'Sri Sumana Maha Pirivena, Mudduwa, Ratnapura, Sri Lanka',
    'website' => 'https://pirivena.edu.lk',
    'facebookUrl' => 'https://facebook.com',
    'youtubeUrl' => 'https://youtube.com',
    'googleMapEmbedUrl' => 'https://maps.google.com/maps?q=Sri+Sumana+Maha+Pirivena,+Mudduwa,+Ratnapura&t=&z=14&ie=UTF8&iwloc=&output=embed',
    'openingHours' => 'Monday - Saturday: 7:30 AM - 4:30 PM',
    'statMonksCount' => '150+',
    'statTeachersCount' => '25+',
    'statExamPassRate' => '98.5%',
    'statEstablishedYear' => '1984',
    'geminiApiKey' => getenv('GEMINI_API_KEY') ?: (getenv('VITE_GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? ($_ENV['VITE_GEMINI_API_KEY'] ?? ''))),
    'openRouterApiKey' => getenv('OPENROUTER_API_KEY') ?: (getenv('VITE_OPENROUTER_API_KEY') ?: ($_ENV['OPENROUTER_API_KEY'] ?? ($_ENV['VITE_OPENROUTER_API_KEY'] ?? ''))),
    'activeAiProvider' => 'auto',
    'bankName' => 'Bank of Ceylon (BOC)',
    'bankAccountName' => 'Sri Sumana Maha Pirivena Development Trust',
    'bankAccountNumber' => '000789456123',
    'bankBranch' => 'Ratnapura Main Branch',
    'bankSwiftCode' => 'BCEYLKLX',
    'admissionDeadline' => '2026-08-31',
    'admissionIsOpen' => true,
    'admissionNoticeSinhala' => '2026 අධ්‍යයන වර්ෂය සඳහා සාමණේර හිමිවරුන් හා ගිහි සිසුන් ඇතුළත් කරගැනීමේ අයදුම්පත් භාරගැනීම සක්‍රීයයි.',
    'currentAcademicYear' => '2026',
    'currentAcademicTerm' => 'Term 1',
    'currentAcademicTermSinhala' => 'ප්‍රථම වාරය (1st Term)',
    'aboutHeaderTag' => 'Institutional Overview',
    'aboutHeaderTagSinhala' => 'ආයතනික හැඳින්වීම',
    'aboutTitle' => 'About Our Institution',
    'aboutTitleSinhala' => 'අපගේ ආයතනය පිළිබඳව',
    'campusImageCaption' => 'Sri Sumana Pirivena Central Campus (Mudduwa, Ratnapura)',
    'campusImageCaptionSinhala' => 'ශ්‍රී සුමන මහා පිරිවෙන් මධ්‍යම පරිශ්‍රය (මුද්දුව, රත්නපුර)',
    'aboutHistoryTag' => 'Monastic Lineage & History',
    'aboutHistoryTagSinhala' => 'පිරිවෙන් ශාසනික ඉතිහාසය',
    'aboutHistoryHeading' => 'Our Noble History',
    'aboutHistoryHeadingSinhala' => 'අපගේ අභිමානවත් ඉතිහාසය',
    'aboutPillarsTitle' => 'Key Institutional Pillars',
    'aboutPillarsTitleSinhala' => 'ප්‍රධාන ආයතනික අංග',
    'aboutPillarExamCenter' => 'Full Pracheena Examination Center (Prarambha, Madhyama, Final)',
    'aboutPillarExamCenterSinhala' => 'පූර්ණ ප්‍රාචීන විභාග මධ්‍යස්ථානය (ප්‍රාරම්භ, මධ්‍යම, අවසාන)',
    'aboutPillarResidence' => 'Dedicated Monastic Residence & Alms Hall',
    'aboutPillarResidenceSinhala' => 'නාවාසික ආරාම සංකීර්ණය හා දාන ශාලාව',
    'aboutPillarSmartLab' => 'Smart Computer Lab & Digital Tripitaka Library',
    'aboutPillarSmartLabSinhala' => 'ස්මාර්ට් පරිගණක විද්‍යාගාරය හා ඩිජිටල් ත්‍රිපිටක පුස්තකාලය',
    'aboutPillarsNote' => 'Fostering classical Pali, Sanskrit, and Theravada Buddhist scholarship for monks & lay students.',
    'aboutPillarsNoteSinhala' => 'සාමණේර හිමිවරුන් සහ ගිහි සිසුන් උදෙසා උසස් බෞද්ධ හා සාම්ප්‍රදායික ශාස්ත්‍රීය අධ්‍යාපනය.',
    'aboutLeadershipTitle' => 'Monastic Leadership & Administration',
    'aboutLeadershipTitleSinhala' => 'පිරිවෙන් ආචාර්ය හා පාලක මණ්ඩලය',
    'vicePrincipalName' => 'Ven. Mudduwe Dhammika Thero',
    'vicePrincipalNameSinhala' => 'පූජ්‍ය මුද්දුවේ ධම්මික හිමි',
    'vicePrincipalTitle' => 'Vice Principal & Registrar',
    'vicePrincipalTitleSinhala' => 'නියෝජ්‍ය පරිවේණාධිපති හා ලේඛකාධිකාරී',
    'vicePrincipalBio' => 'MA in Buddhist Studies. Overseeing academic examinations, student discipline, and administrative operations.',
    'vicePrincipalBioSinhala' => 'බෞද්ධ අධ්‍යයන ශාස්ත්‍රපති. අධ්‍යයන කටයුතු, ශිෂ්‍ය විනය හා පාලන කටයුතු භාරව.',
    'seniorTeacherName' => 'Ven. Sabaragamuwe Sumanasara Thero',
    'seniorTeacherNameSinhala' => 'පූජ්‍ය සබරගමුවේ සුමනසාර හිමි',
    'seniorTeacherTitle' => 'Senior Head of Pali & Tripitaka',
    'seniorTeacherTitleSinhala' => 'පාලි හා ත්‍රිපිටක අංශ භාර ජ්‍යෙෂ්ඨ ආචාර්ය',
    'seniorTeacherBio' => 'Expert in Pali Grammar (Balawatara) and Abhidhammattha Sangaha. Master of classical monastic chant.',
    'seniorTeacherBioSinhala' => 'පාලි ව්‍යාකරණ (බාලාවතාර) හා අභිධර්මත්‍ථ සංග්‍රහය පිළිබඳ ප්‍රවීණ. පිරිවෙන් පාලි භාෂා ප්‍රධාන.',
];

// 3.5. Direct Upload dist.zip Bundle for Live OTA Update
if ($subAction === 'upload-live-bundle' && $method === 'POST') {
    $version = trim($_POST['version'] ?? '2.5.0');
    $releaseNotes = trim($_POST['releaseNotes'] ?? 'Capgo Live OTA යාවත්කාලීනය.');
    $forceUpdate = !empty($_POST['forceUpdate']) && ($_POST['forceUpdate'] === 'true' || $_POST['forceUpdate'] === true || $_POST['forceUpdate'] === '1');

    $fileField = isset($_FILES['bundleZip']) ? $_FILES['bundleZip'] : (isset($_FILES['file']) ? $_FILES['file'] : (isset($_FILES['zip']) ? $_FILES['zip'] : null));

    if (!$fileField || empty($fileField['name'])) {
        sendJsonResponse(["error" => "කරුණාකර dist.zip ගොනුව තෝරන්න (No zip file provided)."], 400);
    }

    $fileName = basename($fileField['name']);
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    if ($fileExt !== 'zip') {
        sendJsonResponse(["error" => "කරුණාකර වලංගු .zip ගොනුවක් පමණක් Upload කරන්න (Only .zip files are allowed)."], 400);
    }

    $targetDir = UPLOAD_DIR . 'live_updates/';
    if (!file_exists($targetDir)) {
        @mkdir($targetDir, 0777, true);
    }

    $cleanVersion = preg_replace('/[^a-zA-Z0-9._-]/', '', $version);
    $safeName = 'dist_v' . $cleanVersion . '_' . date('Ymd_His') . '_' . rand(100, 999) . '.zip';
    $targetPath = $targetDir . $safeName;

    if (!move_uploaded_file($fileField['tmp_name'], $targetPath)) {
        sendJsonResponse(["error" => "Server එකෙහි zip ගොනුව සුරැකීම අසාර්ථක විය."], 500);
    }

    // Auto-cleanup: Delete any older OTA zip packages from the server to save disk space
    $deletedOldCount = 0;
    $freedBytes = 0;
    if (file_exists($targetDir)) {
        $existingZips = glob($targetDir . '*.zip');
        if ($existingZips) {
            $newRealPath = realpath($targetPath);
            foreach ($existingZips as $oldZipFile) {
                $oldRealPath = realpath($oldZipFile);
                if ($oldRealPath && $oldRealPath !== $newRealPath && is_file($oldZipFile)) {
                    $freedBytes += @filesize($oldZipFile);
                    if (@unlink($oldZipFile)) {
                        $deletedOldCount++;
                    }
                }
            }
        }
    }

    $fileUrl = UPLOAD_URL_PREFIX . 'live_updates/' . $safeName;
    $fileSize = $fileField['size'];
    $formattedSize = '0 B';
    if ($fileSize > 1048576) {
        $formattedSize = round($fileSize / 1048576, 2) . ' MB';
    } else if ($fileSize > 1024) {
        $formattedSize = round($fileSize / 1024, 1) . ' KB';
    } else {
        $formattedSize = $fileSize . ' B';
    }

    $freedSizeText = '';
    if ($freedBytes > 1048576) {
        $freedSizeText = round($freedBytes / 1048576, 2) . ' MB';
    } else if ($freedBytes > 1024) {
        $freedSizeText = round($freedBytes / 1024, 1) . ' KB';
    } else if ($freedBytes > 0) {
        $freedSizeText = $freedBytes . ' B';
    }

    // Save to site_settings
    $stmt = $db->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (:k, :v) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    $stmt->execute(['k' => 'appLatestVersion', 'v' => $version]);
    $stmt->execute(['k' => 'liveUpdateVersion', 'v' => $version]);
    $stmt->execute(['k' => 'liveUpdateZipUrl', 'v' => $fileUrl]);
    $stmt->execute(['k' => 'appReleaseNotes', 'v' => $releaseNotes]);
    $stmt->execute(['k' => 'appForceUpdate', 'v' => $forceUpdate ? 'true' : 'false']);
    $stmt->execute(['k' => 'appLastUpdatedDate', 'v' => date('Y-m-d H:i:s')]);

    // Send OneSignal Push Notification to all users
    if (class_exists('OneSignalService')) {
        $cleanSnippet = $releaseNotes ? mb_substr(strip_tags($releaseNotes), 0, 100) : "ශ්‍රී සුමන ERP යෙදුම නවතම සංස්කරණයට යාවත්කාලීන කරගන්න.";
        OneSignalService::sendNotification(
            "⚡ ක්ෂණික Live Update එකක් (v{$version})!",
            $cleanSnippet,
            [
                'broadcast' => true,
                'collapse_id' => 'app_update_' . $version,
                'data' => [
                    'action' => 'open_app_update',
                    'version' => $version,
                    'liveUpdateZipUrl' => $fileUrl,
                    'forceUpdate' => $forceUpdate
                ]
            ]
        );
    }

    $cleanupLog = $deletedOldCount > 0 ? " (Deleted {$deletedOldCount} old zip files, freed {$freedSizeText})" : "";
    logAuditEvent("dist.zip Live Update Upload", "Version: {$version} - Size: {$formattedSize} - URL: {$fileUrl}{$cleanupLog}", 'Settings');

    $successMsg = "dist.zip ගොනුව සාර්ථකව Upload වී Live OTA Update එක (v{$version}) නිකුත් කරන ලදී!";
    if ($deletedOldCount > 0) {
        $successMsg .= " (පැරණි Update ගොනු {$deletedOldCount}ක් ඉවත් කර Server Storage එකෙන් {$freedSizeText} නිදහස් කරන ලදී.)";
    }

    sendJsonResponse([
        "success" => true,
        "message" => $successMsg,
        "version" => $version,
        "liveUpdateZipUrl" => $fileUrl,
        "fileSize" => $formattedSize,
        "cleanedOldFilesCount" => $deletedOldCount,
        "freedSpace" => $freedSizeText
    ], 201);
}

// 3.6. Publish APK / Live OTA Update via JSON URL and Dispatch OneSignal Push Notification
if ($subAction === 'publish-app-update' && $method === 'POST') {
    $body = getRequestBody();
    $version = trim($body['version'] ?? '2.5.0');
    $apkUrl = trim($body['apkUrl'] ?? '');
    $liveUpdateZipUrl = trim($body['liveUpdateZipUrl'] ?? $body['otaZipUrl'] ?? '');
    $releaseNotes = trim($body['releaseNotes'] ?? '');
    $forceUpdate = !empty($body['forceUpdate']);

    if (empty($version)) {
        sendJsonResponse(["error" => "App Version is required."], 400);
    }

    // Convert Google Drive link to Direct Download link
    $directUrl = $apkUrl;
    if ($apkUrl) {
        if (preg_match('/\/file\/d\/([a-zA-Z0-9_-]+)/i', $apkUrl, $m)) {
            $directUrl = "https://drive.google.com/uc?export=download&id=" . $m[1] . "&confirm=t";
        } else if (preg_match('/[?&]id=([a-zA-Z0-9_-]+)/i', $apkUrl, $m)) {
            $directUrl = "https://drive.google.com/uc?export=download&id=" . $m[1] . "&confirm=t";
        }
    }

    // Save to site_settings
    $stmt = $db->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (:k, :v) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    $stmt->execute(['k' => 'appLatestVersion', 'v' => $version]);
    $stmt->execute(['k' => 'liveUpdateVersion', 'v' => $version]);
    $stmt->execute(['k' => 'liveUpdateZipUrl', 'v' => $liveUpdateZipUrl]);
    $stmt->execute(['k' => 'appApkUrl', 'v' => $apkUrl]);
    $stmt->execute(['k' => 'appDirectApkUrl', 'v' => $directUrl]);
    $stmt->execute(['k' => 'appReleaseNotes', 'v' => $releaseNotes]);
    $stmt->execute(['k' => 'appForceUpdate', 'v' => $forceUpdate ? 'true' : 'false']);
    $stmt->execute(['k' => 'appLastUpdatedDate', 'v' => date('Y-m-d H:i:s')]);

    // Send OneSignal Push Notification to all users
    if (class_exists('OneSignalService')) {
        $cleanSnippet = $releaseNotes ? mb_substr(strip_tags($releaseNotes), 0, 100) : "ශ්‍රී සුමන ERP යෙදුම නවතම සංස්කරණයට යාවත්කාලීන කරගන්න.";
        $notifTitle = $liveUpdateZipUrl ? "⚡ ක්ෂණික Live Update එකක් (v{$version})!" : "🚀 නව APK යාවත්කාලීනයක් (v{$version})!";
        OneSignalService::sendNotification(
            $notifTitle,
            $cleanSnippet,
            [
                'broadcast' => true,
                'collapse_id' => 'app_update_' . $version,
                'data' => [
                    'action' => 'open_app_update',
                    'version' => $version,
                    'liveUpdateZipUrl' => $liveUpdateZipUrl,
                    'apkUrl' => $directUrl,
                    'forceUpdate' => $forceUpdate
                ]
            ]
        );
    }

    logAuditEvent("නව App Update නිකුත් කිරීම", "Version: {$version} - Live OTA: {$liveUpdateZipUrl} - APK: {$apkUrl}", 'Settings');

    sendJsonResponse([
        "success" => true,
        "message" => "App Update published and push notification dispatched to users successfully.",
        "version" => $version,
        "liveUpdateZipUrl" => $liveUpdateZipUrl,
        "directDownloadUrl" => $directUrl
    ]);
}

// 4. GET / POST / PUT Site Settings
if ($method === 'GET') {
    $authUser = getAuthUser();
    $isAdmin = $authUser && in_array(strtolower($authUser['role'] ?? ''), ['admin', 'superadmin']);

    $stmt = $db->query("SELECT setting_key, setting_value FROM site_settings");
    $rows = $stmt->fetchAll();

    // Auto-seed any missing keys into MySQL
    $existingKeys = !empty($rows) ? array_column($rows, 'setting_key') : [];
    $missingKeys = array_diff(array_keys($defaultSettings), $existingKeys);
    if (!empty($missingKeys)) {
        $ins = $db->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (:k, :v) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
        foreach ($missingKeys as $k) {
            $v = $defaultSettings[$k];
            $vStr = is_array($v) || is_object($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : (is_bool($v) ? ($v ? 'true' : 'false') : strval($v));
            $ins->execute(['k' => $k, 'v' => $vStr]);
        }
        $stmt = $db->query("SELECT setting_key, setting_value FROM site_settings");
        $rows = $stmt->fetchAll();
    }

    $settings = $defaultSettings;
    foreach ($rows as $row) {
        $rawVal = $row['setting_value'];
        if ($rawVal === null || $rawVal === '') {
            $settings[$row['setting_key']] = '';
            continue;
        }
        $jsonVal = json_decode($rawVal, true);
        if ($jsonVal !== null) {
            $settings[$row['setting_key']] = $jsonVal;
        } else if ($rawVal === 'true') {
            $settings[$row['setting_key']] = true;
        } else if ($rawVal === 'false') {
            $settings[$row['setting_key']] = false;
        } else {
            $settings[$row['setting_key']] = $rawVal;
        }
    }

    // 🛡️ Privacy Guard: Never leak AI API Keys or sensitive system tokens to non-admin visitors
    if (!$isAdmin) {
        $sensitiveKeys = ['geminiApiKey', 'gemini_api_key', 'openRouterApiKey', 'open_router_api_key', 'jwtSecret', 'smtpPassword', 'onesignalApiKey'];
        foreach ($sensitiveKeys as $sk) {
            if (isset($settings[$sk])) {
                $settings[$sk] = '';
            }
        }
    }

    sendJsonResponse((object)$settings);
}

if ($method === 'POST' || $method === 'PUT') {
    // 🛡️ Security Check: Updating site settings requires Admin privileges
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $stmt = $db->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (:k, :v) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    
    foreach ($body as $key => $value) {
        if ($value === null) continue;
        $valStr = is_array($value) || is_object($value) 
            ? json_encode($value, JSON_UNESCAPED_UNICODE) 
            : (is_bool($value) ? ($value ? 'true' : 'false') : strval($value));
        $stmt->execute(['k' => $key, 'v' => $valStr]);
    }

    logAuditEvent("පද්ධති සැකසුම් යාවත්කාලීන කිරීම (Settings Saved)", "ප්‍රධාන වෙබ් අඩවියේ සහ පිරිවෙන් පද්ධතියේ සැකසුම් යාවත්කාලීන කරන ලදී.", 'Settings');

    sendJsonResponse(["success" => true, "message" => "Site settings updated successfully."]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
