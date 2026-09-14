<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Ensure admissions table exists with all required fields
try {
    $db->exec("CREATE TABLE IF NOT EXISTS `admissions` (
      `id` VARCHAR(64) NOT NULL PRIMARY KEY,
      `trackingId` VARCHAR(50) NOT NULL,
      `fullName` VARCHAR(255) DEFAULT NULL,
      `applicantName` VARCHAR(255) DEFAULT NULL,
      `titlePrefix` VARCHAR(50) DEFAULT 'පූජ්‍ය',
      `monkStatus` VARCHAR(50) DEFAULT 'monk',
      `monkName` VARCHAR(255) DEFAULT NULL,
      `dob` VARCHAR(50) DEFAULT NULL,
      `calculatedAge` INT DEFAULT NULL,
      `guardianName` VARCHAR(255) DEFAULT NULL,
      `guardianPhone` VARCHAR(50) DEFAULT NULL,
      `guardianRelation` VARCHAR(100) DEFAULT NULL,
      `guardianAddress` TEXT DEFAULT NULL,
      `phone` VARCHAR(50) DEFAULT NULL,
      `whatsappPhone` VARCHAR(50) DEFAULT NULL,
      `email` VARCHAR(255) DEFAULT NULL,
      `address` TEXT DEFAULT NULL,
      `district` VARCHAR(100) DEFAULT 'Ratnapura (රත්නපුර)',
      `templeName` VARCHAR(255) DEFAULT NULL,
      `nikayaChapter` VARCHAR(255) DEFAULT NULL,
      `previousSchool` VARCHAR(255) DEFAULT NULL,
      `gradeApplying` VARCHAR(100) DEFAULT NULL,
      `appliedClass` VARCHAR(255) DEFAULT NULL,
      `hostelRequired` VARCHAR(50) DEFAULT 'yes',
      `nicOrBirthCert` VARCHAR(100) DEFAULT NULL,
      `specialTalents` TEXT DEFAULT NULL,
      `additionalNotes` TEXT DEFAULT NULL,
      `payloadJson` LONGTEXT DEFAULT NULL,
      `status` VARCHAR(50) DEFAULT 'pending',
      `submittedDate` DATE DEFAULT NULL,
      `dateSubmitted` DATE DEFAULT NULL,
      `notes` TEXT DEFAULT NULL,
      `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY `idx_tracking_id` (`trackingId`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // Dynamic auto-migration for existing tables
    $columnsNeeded = [
        'applicantName' => 'VARCHAR(255) DEFAULT NULL',
        'titlePrefix' => "VARCHAR(50) DEFAULT 'පූජ්‍ය'",
        'monkStatus' => "VARCHAR(50) DEFAULT 'monk'",
        'dob' => 'VARCHAR(50) DEFAULT NULL',
        'calculatedAge' => 'INT DEFAULT NULL',
        'guardianPhone' => 'VARCHAR(50) DEFAULT NULL',
        'guardianRelation' => 'VARCHAR(100) DEFAULT NULL',
        'guardianAddress' => 'TEXT DEFAULT NULL',
        'whatsappPhone' => 'VARCHAR(50) DEFAULT NULL',
        'district' => "VARCHAR(100) DEFAULT 'Ratnapura (රත්නපුර)'",
        'templeName' => 'VARCHAR(255) DEFAULT NULL',
        'nikayaChapter' => 'VARCHAR(255) DEFAULT NULL',
        'previousSchool' => 'VARCHAR(255) DEFAULT NULL',
        'appliedClass' => 'VARCHAR(255) DEFAULT NULL',
        'hostelRequired' => "VARCHAR(50) DEFAULT 'yes'",
        'nicOrBirthCert' => 'VARCHAR(100) DEFAULT NULL',
        'specialTalents' => 'TEXT DEFAULT NULL',
        'additionalNotes' => 'TEXT DEFAULT NULL',
        'payloadJson' => 'LONGTEXT DEFAULT NULL',
        'submittedDate' => 'DATE DEFAULT NULL',
    ];

    foreach ($columnsNeeded as $col => $colDef) {
        try {
            $check = $db->query("SHOW COLUMNS FROM `admissions` LIKE '$col'");
            if (!$check || $check->rowCount() === 0) {
                @$db->exec("ALTER TABLE `admissions` ADD COLUMN `$col` $colDef");
            }
        } catch (Exception $e) {}
    }
} catch (Exception $e) {}

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', trim($requestUri, '/'))));
$pathId = null;

if (count($parts) >= 2) {
    $lastPart = end($parts);
    $prevPart = $parts[count($parts) - 2];
    if ($lastPart === 'status' && $prevPart !== 'api' && $prevPart !== 'admissions' && $prevPart !== 'admissions.php') {
        $pathId = urldecode($prevPart);
    } elseif ($lastPart !== 'admissions' && $lastPart !== 'admissions.php') {
        $pathId = urldecode($lastPart);
    }
} elseif (count($parts) === 1) {
    $lastPart = $parts[0];
    if ($lastPart !== 'admissions' && $lastPart !== 'admissions.php') {
        $pathId = urldecode($lastPart);
    }
}

// Helper to format admission record
function formatAdmissionRecord($row) {
    if (!$row) return null;
    $record = (array)$row;
    
    // Unpack payloadJson if exists
    if (!empty($record['payloadJson'])) {
        $extra = json_decode($record['payloadJson'], true);
        if (is_array($extra)) {
            $record = array_merge($extra, $record);
        }
    }

    // Standardize field names
    $name = !empty($record['applicantName']) ? $record['applicantName'] : (!empty($record['fullName']) ? $record['fullName'] : (!empty($record['monkName']) ? $record['monkName'] : ''));
    $record['applicantName'] = $name;
    $record['fullName'] = $name;

    $appliedClass = !empty($record['appliedClass']) ? $record['appliedClass'] : (!empty($record['gradeApplying']) ? $record['gradeApplying'] : 'Pracheena Prarambha Grade 01');
    $record['appliedClass'] = $appliedClass;
    $record['gradeApplying'] = $appliedClass;

    $sDate = !empty($record['submittedDate']) ? $record['submittedDate'] : (!empty($record['dateSubmitted']) ? $record['dateSubmitted'] : (!empty($record['created_at']) ? substr($record['created_at'], 0, 10) : date('Y-m-d')));
    $record['submittedDate'] = $sDate;
    $record['dateSubmitted'] = $sDate;

    if (isset($record['calculatedAge'])) {
        $record['calculatedAge'] = (int)$record['calculatedAge'];
    }

    return $record;
}

// 1. GET Admissions
if ($method === 'GET') {
    if ($pathId) {
        $stmt = $db->prepare("SELECT * FROM admissions WHERE id = :id1 OR trackingId = :id2 LIMIT 1");
        $stmt->execute(['id1' => $pathId, 'id2' => $pathId]);
        $adm = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($adm) {
            sendJsonResponse(formatAdmissionRecord($adm));
        } else {
            sendJsonResponse(["error" => "Admission application not found"], 404);
        }
    } else {
        // 🛡️ Security Check: Full list of admissions applications is only visible to Admin/SuperAdmin
        $authUser = getAuthUser();
        $isAdmin = $authUser && in_array(strtolower($authUser['role'] ?? ''), ['admin', 'superadmin']);

        if (!$isAdmin) {
            // Return empty array for public guests and non-admins with 200 OK (Zero data leakage & no 401 console error)
            sendJsonResponse([], 200);
        }

        $stmt = $db->query("SELECT * FROM admissions ORDER BY created_at DESC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $admissions = [];
        foreach ($rows as $r) {
            $admissions[] = formatAdmissionRecord($r);
        }
        sendJsonResponse($admissions);
    }
}

// 2. POST Admission (Apply)
if ($method === 'POST') {
    $body = getRequestBody();
    $id = !empty($body['id']) ? trim($body['id']) : 'adm_' . time() . '_' . rand(1000, 9999);
    $trackingId = !empty($body['trackingId']) ? trim($body['trackingId']) : 'ADM-' . date('Y') . '-' . rand(10000, 99999);
    
    $titlePrefix = !empty($body['titlePrefix']) ? trim($body['titlePrefix']) : 'පූජ්‍ය';
    $applicantName = !empty($body['applicantName']) ? trim($body['applicantName']) : (!empty($body['fullName']) ? trim($body['fullName']) : (!empty($body['monkName']) ? trim($body['monkName']) : ''));
    $fullName = $applicantName;
    $monkStatus = !empty($body['monkStatus']) ? trim($body['monkStatus']) : 'monk';
    $monkName = !empty($body['monkName']) ? trim($body['monkName']) : null;
    $dob = !empty($body['dob']) ? trim($body['dob']) : null;
    $calculatedAge = isset($body['calculatedAge']) && $body['calculatedAge'] !== '' ? (int)$body['calculatedAge'] : null;
    $guardianName = !empty($body['guardianName']) ? trim($body['guardianName']) : null;
    $guardianPhone = !empty($body['guardianPhone']) ? trim($body['guardianPhone']) : null;
    $guardianRelation = !empty($body['guardianRelation']) ? trim($body['guardianRelation']) : null;
    $guardianAddress = !empty($body['guardianAddress']) ? trim($body['guardianAddress']) : null;
    $phone = !empty($body['phone']) ? trim($body['phone']) : null;
    $whatsappPhone = !empty($body['whatsappPhone']) ? trim($body['whatsappPhone']) : $phone;
    $email = !empty($body['email']) ? trim($body['email']) : null;
    $address = !empty($body['address']) ? trim($body['address']) : null;
    $district = !empty($body['district']) ? trim($body['district']) : 'Ratnapura (රත්නපුර)';
    $templeName = !empty($body['templeName']) ? trim($body['templeName']) : null;
    $nikayaChapter = !empty($body['nikayaChapter']) ? trim($body['nikayaChapter']) : null;
    $previousSchool = !empty($body['previousSchool']) ? trim($body['previousSchool']) : null;
    $appliedClass = !empty($body['appliedClass']) ? trim($body['appliedClass']) : (!empty($body['gradeApplying']) ? trim($body['gradeApplying']) : 'Pracheena Prarambha Grade 01');
    $gradeApplying = $appliedClass;
    $hostelRequired = !empty($body['hostelRequired']) ? trim($body['hostelRequired']) : 'yes';
    $nicOrBirthCert = !empty($body['nicOrBirthCert']) ? trim($body['nicOrBirthCert']) : null;
    $specialTalents = !empty($body['specialTalents']) ? trim($body['specialTalents']) : null;
    $additionalNotes = !empty($body['additionalNotes']) ? trim($body['additionalNotes']) : (!empty($body['notes']) ? trim($body['notes']) : null);
    $notes = $additionalNotes;
    $status = !empty($body['status']) ? trim($body['status']) : 'pending';
    $dateSubmitted = date('Y-m-d');
    $submittedDate = $dateSubmitted;

    $payloadJson = json_encode($body, JSON_UNESCAPED_UNICODE);

    if (empty($applicantName) && empty($monkName)) {
        sendJsonResponse(["error" => "Applicant name or monk name is required."], 400);
    }

    $stmt = $db->prepare("INSERT INTO admissions (
        id, trackingId, fullName, applicantName, titlePrefix, monkStatus, monkName, 
        dob, calculatedAge, guardianName, guardianPhone, guardianRelation, guardianAddress, 
        phone, whatsappPhone, email, address, district, templeName, nikayaChapter, 
        previousSchool, gradeApplying, appliedClass, hostelRequired, nicOrBirthCert, 
        specialTalents, additionalNotes, payloadJson, status, dateSubmitted, submittedDate, notes
    ) VALUES (
        :id, :trackingId, :fullName, :applicantName, :titlePrefix, :monkStatus, :monkName, 
        :dob, :calculatedAge, :guardianName, :guardianPhone, :guardianRelation, :guardianAddress, 
        :phone, :whatsappPhone, :email, :address, :district, :templeName, :nikayaChapter, 
        :previousSchool, :gradeApplying, :appliedClass, :hostelRequired, :nicOrBirthCert, 
        :specialTalents, :additionalNotes, :payloadJson, :status, :dateSubmitted, :submittedDate, :notes
    )");

    $stmt->execute([
        'id' => $id,
        'trackingId' => $trackingId,
        'fullName' => $fullName,
        'applicantName' => $applicantName,
        'titlePrefix' => $titlePrefix,
        'monkStatus' => $monkStatus,
        'monkName' => $monkName,
        'dob' => $dob,
        'calculatedAge' => $calculatedAge,
        'guardianName' => $guardianName,
        'guardianPhone' => $guardianPhone,
        'guardianRelation' => $guardianRelation,
        'guardianAddress' => $guardianAddress,
        'phone' => $phone,
        'whatsappPhone' => $whatsappPhone,
        'email' => $email,
        'address' => $address,
        'district' => $district,
        'templeName' => $templeName,
        'nikayaChapter' => $nikayaChapter,
        'previousSchool' => $previousSchool,
        'gradeApplying' => $gradeApplying,
        'appliedClass' => $appliedClass,
        'hostelRequired' => $hostelRequired,
        'nicOrBirthCert' => $nicOrBirthCert,
        'specialTalents' => $specialTalents,
        'additionalNotes' => $additionalNotes,
        'payloadJson' => $payloadJson,
        'status' => $status,
        'dateSubmitted' => $dateSubmitted,
        'submittedDate' => $submittedDate,
        'notes' => $notes
    ]);

    // Optional: Log to audit trail
    try {
        $auditText = "නව මාර්ගගත අයදුම්පතක් ලැබිණි: " . ($monkName ? $monkName : $applicantName) . " ($trackingId)";
        $auditStmt = $db->prepare("INSERT INTO system_audit_logs (id, action, details, category, timestamp) VALUES (:aid, 'admission_submitted', :dt, 'admission', NOW())");
        $auditStmt->execute(['aid' => 'audit_' . time() . '_' . rand(100, 999), 'dt' => $auditText]);
    } catch (Exception $e) {}

    // 🔔 Send OneSignal Push Notification to Admins
    try {
        if (class_exists('OneSignalService')) {
            OneSignalService::notifyNewAdmission(($monkName ? $monkName : $applicantName), $trackingId, $appliedClass, $id);
        }
    } catch (Exception $ePush) {
        error_log("Failed to send admission OneSignal push notification: " . $ePush->getMessage());
    }

    $item = [
        "id" => $id,
        "trackingId" => $trackingId,
        "applicantName" => $applicantName,
        "fullName" => $fullName,
        "monkName" => $monkName,
        "titlePrefix" => $titlePrefix,
        "monkStatus" => $monkStatus,
        "dob" => $dob,
        "calculatedAge" => $calculatedAge,
        "guardianName" => $guardianName,
        "guardianPhone" => $guardianPhone,
        "phone" => $phone,
        "whatsappPhone" => $whatsappPhone,
        "address" => $address,
        "district" => $district,
        "templeName" => $templeName,
        "nikayaChapter" => $nikayaChapter,
        "previousSchool" => $previousSchool,
        "appliedClass" => $appliedClass,
        "gradeApplying" => $gradeApplying,
        "hostelRequired" => $hostelRequired,
        "nicOrBirthCert" => $nicOrBirthCert,
        "specialTalents" => $specialTalents,
        "additionalNotes" => $additionalNotes,
        "status" => $status,
        "dateSubmitted" => $dateSubmitted,
        "submittedDate" => $submittedDate
    ];

    sendJsonResponse([
        "success" => true,
        "trackingId" => $trackingId,
        "message" => "Admission application submitted successfully.",
        "admission" => $item
    ], 201);
}

// 3. PUT / PATCH Admission
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $admId = $pathId ?: (!empty($body['id']) ? $body['id'] : null);

    if (!$admId) {
        sendJsonResponse(["error" => "Admission ID is required"], 400);
    }

    $stmt = $db->prepare("SELECT * FROM admissions WHERE id = :id1 OR trackingId = :id2 LIMIT 1");
    $stmt->execute(['id1' => $admId, 'id2' => $admId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        sendJsonResponse(["error" => "Admission application not found"], 404);
    }

    $status = !empty($body['status']) ? trim($body['status']) : $existing['status'];
    $notes = array_key_exists('notes', $body) ? trim($body['notes']) : (array_key_exists('additionalNotes', $body) ? trim($body['additionalNotes']) : $existing['notes']);

    $stmt = $db->prepare("UPDATE admissions SET status = :st, notes = :nt, additionalNotes = :ant WHERE id = :id");
    $stmt->execute([
        'id' => $existing['id'],
        'st' => $status,
        'nt' => $notes,
        'ant' => $notes
    ]);

    sendJsonResponse(["success" => true, "message" => "Admission application updated successfully"]);
}

// 4. DELETE Admission
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $admId = $pathId ?: (!empty($body['id']) ? $body['id'] : (!empty($_GET['id']) ? $_GET['id'] : null));

    if (!$admId) {
        sendJsonResponse(["error" => "Admission ID is required"], 400);
    }

    $stmt = $db->prepare("DELETE FROM admissions WHERE id = :id1 OR trackingId = :id2");
    $stmt->execute(['id1' => $admId, 'id2' => $admId]);

    sendJsonResponse(["success" => true, "id" => $admId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
