<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', trim($requestUri, '/'))));

$certId = '';
if (isset($_GET['id']) && !empty(trim($_GET['id']))) {
    $certId = trim($_GET['id']);
} elseif (isset($_GET['q']) && !empty(trim($_GET['q']))) {
    $certId = trim($_GET['q']);
} else {
    // Check path segments
    $last = end($parts);
    if ($last !== 'certificates' && $last !== 'certificates.php' && $last !== 'verify') {
        $certId = $last;
    } else {
        $prev = count($parts) >= 2 ? $parts[count($parts) - 2] : '';
        if ($prev && $prev !== 'certificates' && $prev !== 'certificates.php' && $prev !== 'api') {
            $certId = $prev;
        }
    }
}

if ($method === 'GET') {
    $rawId = urldecode(trim($certId));
    if (empty($rawId)) {
        sendJsonResponse([
            "verified" => false,
            "valid" => false,
            "error" => "සහතිකපත්‍ර හෝ ශිෂ්‍ය අංකය ඇතුළත් කර නොමැත (Verification ID is required)."
        ], 400);
    }

    $rawClean = strtolower(trim($rawId));

    // Build intelligent candidate search terms list
    $candidates = [
        $rawClean,
        trim($rawId),
        strtolower(str_replace(' ', '', $rawId)),
        strtolower(str_replace('-', '', $rawId)),
    ];

    // Strip "verify-" or "cert-" prefixes
    $stripped = preg_replace('/^(verify|cert|certificate|prv)-/i', '', $rawId);
    if ($stripped !== $rawId) {
        $candidates[] = strtolower(trim($stripped));
        $candidates[] = trim($stripped);
    }

    // Prefix cross-mappings: STD <-> STU, TCH <-> TEA, ADM, PNK <-> DON
    if (strpos($rawClean, 'std-') === 0) {
        $candidates[] = 'stu-' . substr($rawClean, 4);
    } elseif (strpos($rawClean, 'stu-') === 0) {
        $candidates[] = 'std-' . substr($rawClean, 4);
    } elseif (strpos($rawClean, 'tch-') === 0) {
        $candidates[] = 'tea-' . substr($rawClean, 4);
    } elseif (strpos($rawClean, 'tea-') === 0) {
        $candidates[] = 'tch-' . substr($rawClean, 4);
    } elseif (strpos($rawClean, 'pnk-') === 0) {
        $candidates[] = 'don-' . substr($rawClean, 4);
    } elseif (strpos($rawClean, 'don-') === 0) {
        $candidates[] = 'pnk-' . substr($rawClean, 4);
    }

    // Year variations (e.g. STD-2026-001 <-> STD-001)
    if (preg_match('/^(std|stu|tch|tea|adm|pnk|don)-202[0-9]-(.+)$/', $rawClean, $m)) {
        $prefix = $m[1];
        $num = $m[2];
        $altPrefix = ($prefix === 'std') ? 'stu' : (($prefix === 'stu') ? 'std' : (($prefix === 'tch') ? 'tea' : (($prefix === 'tea') ? 'tch' : $prefix)));
        $candidates[] = "$prefix-$num";
        $candidates[] = "$altPrefix-$num";
        $candidates[] = "$altPrefix-2026-$num";
        $candidates[] = $num;
    } elseif (preg_match('/^(std|stu|tch|tea|adm|pnk|don)-([0-9]+)$/', $rawClean, $m)) {
        $prefix = $m[1];
        $num = $m[2];
        $altPrefix = ($prefix === 'std') ? 'stu' : (($prefix === 'stu') ? 'std' : (($prefix === 'tch') ? 'tea' : (($prefix === 'tea') ? 'tch' : $prefix)));
        $candidates[] = "$prefix-2026-$num";
        $candidates[] = "$altPrefix-2026-$num";
        $candidates[] = "$altPrefix-$num";
    }

    $candidates = array_values(array_unique(array_filter($candidates)));

    // ==========================================
    // 1. SEARCH IN USERS TABLE (Students & Teachers)
    // ==========================================
    try {
        $placeholders = implode(',', array_fill(0, count($candidates), '?'));
        $userQuery = "SELECT * FROM users WHERE (
            LOWER(TRIM(id)) IN ($placeholders)
            OR LOWER(TRIM(customId)) IN ($placeholders)
            OR LOWER(TRIM(indexNumber)) IN ($placeholders)
            OR LOWER(TRIM(username)) IN ($placeholders)
            OR LOWER(TRIM(nic)) IN ($placeholders)
            OR LOWER(TRIM(phone)) IN ($placeholders)
            OR LOWER(TRIM(email)) IN ($placeholders)
            OR LOWER(TRIM(name)) IN ($placeholders)
            OR LOWER(TRIM(monkName)) IN ($placeholders)
        ) LIMIT 1";

        $params = [];
        for ($i = 0; $i < 9; $i++) {
            $params = array_merge($params, $candidates);
        }

        $stmt = $db->prepare($userQuery);
        $stmt->execute($params);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Fallback LIKE search if not found
        if (!$user) {
            $stmtLike = $db->prepare("SELECT * FROM users WHERE 
                LOWER(customId) LIKE ? 
                OR LOWER(id) LIKE ? 
                OR LOWER(name) LIKE ? 
                OR LOWER(monkName) LIKE ? 
                LIMIT 1");
            $likeVal = '%' . $rawClean . '%';
            $stmtLike->execute([$likeVal, $likeVal, $likeVal, $likeVal]);
            $user = $stmtLike->fetch(PDO::FETCH_ASSOC);
        }

        if ($user) {
            $rawRole = strtolower($user['role'] ?? '');
            $isTeacher = ($rawRole === 'teacher');
            $isAdmin = in_array($rawRole, ['admin', 'superadmin', 'administrator', 'principal']);
            $isStudent = !$isTeacher && !$isAdmin;

            $roleLabel = $isTeacher ? 'පූජ්‍ය ආචාර්ය මණ්ඩලය (Senior Lecturer)' : ($isAdmin ? 'ප්‍රධාන පරිපාලක (Administrator)' : 'සාමණේර / ශිෂ්‍ය සාමාජික (Student Member)');
            $verifiedType = $isTeacher ? 'TEACHER VERIFIED' : ($isAdmin ? 'ADMINISTRATOR VERIFIED' : 'STUDENT VERIFIED');
            $studentName = !empty($user['monkName']) ? $user['monkName'] : (!empty($user['name']) ? $user['name'] : 'පිරිවෙන් සාමාජික');
            $customId = !empty($user['customId']) ? $user['customId'] : (!empty($user['indexNumber']) ? $user['indexNumber'] : $user['id']);

            // Resolve class name
            $className = !empty($user['classLevel']) ? $user['classLevel'] : (!empty($user['pirivenaClass']) ? $user['pirivenaClass'] : 'ප්‍රාචීන හා ත්‍රිපිටක ධර්ම අධ්‍යයන අංශය');
            if (!empty($user['classId'])) {
                try {
                    $cStmt = $db->prepare("SELECT name, nameSinhala FROM classes WHERE id = ? OR code = ? LIMIT 1");
                    $cStmt->execute([$user['classId'], $user['classId']]);
                    $cRow = $cStmt->fetch(PDO::FETCH_ASSOC);
                    if ($cRow) {
                        $className = !empty($cRow['nameSinhala']) ? $cRow['nameSinhala'] : $cRow['name'];
                    }
                } catch (Exception $eC) {}
            }

            $academicYear = !empty($user['academicYear']) ? $user['academicYear'] : '2026';
            $statusText = ($user['status'] ?? 'active') === 'inactive' ? 'අක්‍රීය (Inactive Member)' : 'සක්‍රීය ලියාපදිංචිය (Active & Verified Member)';

            $rawNic = !empty($user['nicOrBirthCert']) ? $user['nicOrBirthCert'] : (!empty($user['nic']) ? $user['nic'] : '');
            $maskedNic = (!empty($rawNic) && strlen($rawNic) > 4) ? (substr($rawNic, 0, 3) . '****' . substr($rawNic, -3)) : $customId;

            sendJsonResponse([
                "verified" => true,
                "valid" => true,
                "verifiedType" => $verifiedType,
                "studentName" => $studentName,
                "studentCustomId" => $customId,
                "role" => $roleLabel,
                "avatar" => $user['avatar'] ?? '',
                "courseTitle" => "$className ($academicYear අධ්‍යයන වර්ෂය)",
                "educationCategory" => $user['educationCategory'] ?? 'Mulika Pirivena',
                "grade" => $statusText,
                "issueDate" => !empty($user['created_at']) ? substr($user['created_at'], 0, 10) : '2026-01-15',
                "nicOrBirthCert" => $maskedNic,
                "issuedBy" => "ශ්‍රී සුමන මහා පිරිවෙන - රත්නපුර මුද්දුව (Reg: PRV/RAT/1984)"
            ]);
        }
    } catch (Exception $ex) {
        error_log("Cert user search error: " . $ex->getMessage());
    }

    // ==========================================
    // 2. SEARCH IN ADMISSIONS TABLE
    // ==========================================
    try {
        $admPlaceholders = implode(',', array_fill(0, count($candidates), '?'));
        $admQuery = "SELECT * FROM admissions WHERE (
            LOWER(TRIM(id)) IN ($admPlaceholders)
            OR LOWER(TRIM(trackingId)) IN ($admPlaceholders)
            OR LOWER(TRIM(phone)) IN ($admPlaceholders)
            OR LOWER(TRIM(whatsappPhone)) IN ($admPlaceholders)
            OR LOWER(TRIM(email)) IN ($admPlaceholders)
            OR LOWER(TRIM(applicantName)) IN ($admPlaceholders)
            OR LOWER(TRIM(monkName)) IN ($admPlaceholders)
            OR LOWER(TRIM(fullName)) IN ($admPlaceholders)
            OR LOWER(TRIM(nicOrBirthCert)) IN ($admPlaceholders)
        ) LIMIT 1";

        $admParams = [];
        for ($i = 0; $i < 9; $i++) {
            $admParams = array_merge($admParams, $candidates);
        }

        $stmtAdm = $db->prepare($admQuery);
        $stmtAdm->execute($admParams);
        $adm = $stmtAdm->fetch(PDO::FETCH_ASSOC);

        // Fallback LIKE search for admissions
        if (!$adm) {
            $stmtAdmLike = $db->prepare("SELECT * FROM admissions WHERE 
                LOWER(trackingId) LIKE ? 
                OR LOWER(id) LIKE ? 
                OR LOWER(applicantName) LIKE ? 
                OR LOWER(monkName) LIKE ? 
                LIMIT 1");
            $likeVal = '%' . $rawClean . '%';
            $stmtAdmLike->execute([$likeVal, $likeVal, $likeVal, $likeVal]);
            $adm = $stmtAdmLike->fetch(PDO::FETCH_ASSOC);
        }

        if ($adm) {
            $admStatus = $adm['status'] ?? 'pending';
            $admStatusText = '⏳ සලකා බලමින් පවතී (Pending Application Review)';
            if ($admStatus === 'approved') {
                $admStatusText = '✅ අනුමත කර ඇත - පිරිවෙන් ප්‍රවේශය සාර්ථකයි (Approved & Enrolled)';
            } elseif ($admStatus === 'rejected') {
                $admStatusText = '❌ ප්‍රතික්ෂේප වී ඇත (Application Not Selected)';
            }

            $applicantDisplay = !empty($adm['monkName']) ? $adm['monkName'] : (!empty($adm['applicantName']) ? $adm['applicantName'] : (!empty($adm['fullName']) ? $adm['fullName'] : 'අයදුම්කරු'));
            $trackingId = !empty($adm['trackingId']) ? $adm['trackingId'] : $adm['id'];
            $appliedClass = !empty($adm['appliedClass']) ? $adm['appliedClass'] : (!empty($adm['gradeApplying']) ? $adm['gradeApplying'] : 'ප්‍රාචීන ප්‍රාරම්භ - 01 ශ්‍රේණිය');

            $admPhone = !empty($adm['phone']) ? $adm['phone'] : (!empty($adm['whatsappPhone']) ? $adm['whatsappPhone'] : '');
            $maskedAdmPhone = (!empty($admPhone) && strlen($admPhone) >= 7) ? ('දුරකථන: ' . substr($admPhone, 0, 3) . '****' . substr($admPhone, -3)) : $trackingId;

            sendJsonResponse([
                "verified" => true,
                "valid" => true,
                "verifiedType" => "ADMISSION APPLICATION",
                "studentName" => $applicantDisplay,
                "studentCustomId" => $trackingId,
                "role" => "ඇතුළත් වීමේ අයදුම්කරු (Admission Applicant)",
                "avatar" => "",
                "courseTitle" => "ඉල්ලුම් කළ ශ්‍රේණිය: $appliedClass",
                "grade" => $admStatusText,
                "issueDate" => !empty($adm['submittedDate']) ? $adm['submittedDate'] : (!empty($adm['dateSubmitted']) ? $adm['dateSubmitted'] : date('Y-m-d')),
                "nicOrBirthCert" => $maskedAdmPhone,
                "issuedBy" => "ශ්‍රී සුමන මහා පිරිවෙන් ලේඛකාධිකාරී කාර්යාලය"
            ]);
        }
    } catch (Exception $ex) {
        error_log("Cert admission search error: " . $ex->getMessage());
    }

    // ==========================================
    // 3. SEARCH IN DONATIONS TABLE
    // ==========================================
    try {
        $donPlaceholders = implode(',', array_fill(0, count($candidates), '?'));
        $stmtDon = $db->prepare("SELECT * FROM donations WHERE (
            LOWER(TRIM(id)) IN ($donPlaceholders)
            OR LOWER(TRIM(receiptId)) IN ($donPlaceholders)
            OR LOWER(TRIM(donorName)) IN ($donPlaceholders)
            OR LOWER(TRIM(contactPhone)) IN ($donPlaceholders)
        ) LIMIT 1");

        $donParams = [];
        for ($i = 0; $i < 4; $i++) {
            $donParams = array_merge($donParams, $candidates);
        }
        $stmtDon->execute($donParams);
        $don = $stmtDon->fetch(PDO::FETCH_ASSOC);

        if (!$don) {
            $stmtDonLike = $db->prepare("SELECT * FROM donations WHERE 
                LOWER(receiptId) LIKE ? 
                OR LOWER(id) LIKE ? 
                OR LOWER(donorName) LIKE ? 
                LIMIT 1");
            $likeVal = '%' . $rawClean . '%';
            $stmtDonLike->execute([$likeVal, $likeVal, $likeVal]);
            $don = $stmtDonLike->fetch(PDO::FETCH_ASSOC);
        }

        if ($don) {
            $donAmount = isset($don['amount']) ? floatval($don['amount']) : 0;
            $amountText = !empty($don['amountOrItems']) ? $don['amountOrItems'] : ($donAmount > 0 ? ('LKR ' . number_format($donAmount, 2)) : 'LKR 1,000.00');
            $donCause = !empty($don['type']) ? $don['type'] : (!empty($don['cause']) ? $don['cause'] : 'පිරිවෙන් සංවර්ධන අරමුදල');
            $donorName = !empty($don['donorName']) ? $don['donorName'] : 'අනාවරණය නොකළ දායක භවතා';

            $donStatus = $don['status'] ?? 'approved';
            $donStatusText = '✅ සත්‍යාපිත රසීදුවයි - පරිත්‍යාගය ලැබී ඇත (Verified Official Donation Receipt)';
            if ($donStatus === 'pending') {
                $donStatusText = '⏳ ලියාපදිංචි වී ඇත - තහවුරු වෙමින් පවතී (Receipt Pending Verification)';
            }

            $donPhone = !empty($don['contactPhone']) ? $don['contactPhone'] : '';
            $maskedDonPhone = (!empty($donPhone) && strlen($donPhone) >= 7) ? ('දුරකථන: ' . substr($donPhone, 0, 3) . '****' . substr($donPhone, -3)) : 'PNK-OFFICIAL';

            sendJsonResponse([
                "verified" => true,
                "valid" => true,
                "verifiedType" => "DONATION RECEIPT",
                "studentName" => $donorName,
                "studentCustomId" => !empty($don['receiptId']) ? $don['receiptId'] : $don['id'],
                "role" => "පිරිවෙන් දායක / අනුග්‍රාහක භවතා (Donation Contributor)",
                "avatar" => "",
                "courseTitle" => "පින්කම/අරමුදල: $donCause ($amountText)",
                "grade" => $donStatusText,
                "issueDate" => !empty($don['created_at']) ? substr($don['created_at'], 0, 10) : date('Y-m-d'),
                "nicOrBirthCert" => $maskedDonPhone,
                "issuedBy" => "ශ්‍රී සුමන මහා පිරිවෙන් මූල්‍ය හා පරිත්‍යාග පාලන අංශය"
            ]);
        }
    } catch (Exception $ex) {
        error_log("Cert donation search error: " . $ex->getMessage());
    }

    // ==========================================
    // NOT FOUND RESPONSE
    // ==========================================
    sendJsonResponse([
        "verified" => false,
        "valid" => false,
        "error" => "මෙම අංකයට (" . htmlspecialchars($rawId) . ") අදාළ ශිෂ්‍ය, ගුරු, අයදුම්පත් හෝ සහතිකපත්‍ර ලියාපදිංචි වාර්තාවක් පිරිවෙන් පද්ධතියේ හමු නොවීය. කරුණාකර නිවැරදි අංකය ඇතුළත් කරන්න."
    ], 404);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
