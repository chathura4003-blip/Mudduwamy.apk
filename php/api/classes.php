<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'classes.php' && $lastPart !== 'classes' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

// Ensure classes table structure
try {
    $db->exec("CREATE TABLE IF NOT EXISTS `classes` (
        `id` VARCHAR(64) NOT NULL,
        `code` VARCHAR(50) DEFAULT NULL,
        `roomNumber` VARCHAR(100) DEFAULT 'දේශන ශාලාව 01',
        `className` VARCHAR(100) NOT NULL,
        `classNameSinhala` VARCHAR(100) NOT NULL,
        `gradeLevel` VARCHAR(50) NOT NULL,
        `classTeacher` VARCHAR(255) DEFAULT NULL,
        `studentCount` INT DEFAULT 0,
        `academicYear` VARCHAR(20) DEFAULT '2025/2026',
        `subjects` LONGTEXT DEFAULT NULL,
        `timetable` LONGTEXT DEFAULT NULL,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
} catch (Exception $e) {}

// Auto migrate timetable column if missing
try {
    @$db->exec("ALTER TABLE `classes` ADD COLUMN `timetable` LONGTEXT DEFAULT NULL");
} catch (Exception $eCol) {}

// Helper to format class records for React UI
function formatClassRecord($c) {
    if (!$c || !is_array($c)) return $c;
    $name = !empty($c['classNameSinhala']) ? $c['classNameSinhala'] : (!empty($c['className']) ? $c['className'] : 'ප්‍රාරම්භ පන්තිය');
    $code = !empty($c['code']) ? $c['code'] : (!empty($c['id']) ? strtoupper(str_replace('cls-', 'CLS-', $c['id'])) : 'CLS-001');
    $roomNumber = !empty($c['roomNumber']) ? $c['roomNumber'] : 'දේශන ශාලාව 01';

    $c['name'] = $name;
    $c['className'] = !empty($c['className']) ? $c['className'] : $name;
    $c['classNameSinhala'] = $name;
    $c['nameSinhala'] = $name;
    $c['code'] = $code;
    $c['roomNumber'] = $roomNumber;
    $c['category'] = !empty($c['gradeLevel']) ? $c['gradeLevel'] : 'ප්‍රාරම්භ';
    $c['gradeLevel'] = $c['category'];
    $c['teacherInChargeId'] = !empty($c['classTeacher']) ? $c['classTeacher'] : '';
    
    $rawSubj = $c['subjects'] ?? null;
    if (is_string($rawSubj)) {
        $decoded = json_decode($rawSubj, true);
        $c['subjects'] = is_array($decoded) ? array_values($decoded) : [];
    } elseif (is_array($rawSubj)) {
        $c['subjects'] = array_values($rawSubj);
    } else {
        $c['subjects'] = [];
    }

    $rawTt = $c['timetable'] ?? null;
    if (is_string($rawTt) && !empty(trim($rawTt))) {
        $decodedTt = json_decode($rawTt, true);
        $c['timetable'] = is_array($decodedTt) ? array_values($decodedTt) : [];
    } elseif (is_array($rawTt)) {
        $c['timetable'] = array_values($rawTt);
    } else {
        $c['timetable'] = [];
    }

    return $c;
}

// 1. GET Classes
if ($method === 'GET') {
    if ($pathId) {
        $stmt = $db->prepare("SELECT * FROM classes WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $pathId]);
        $class = $stmt->fetch();
        if ($class) {
            sendJsonResponse(formatClassRecord($class));
        } else {
            sendJsonResponse(["error" => "Class not found"], 404);
        }
    } else {
        $stmt = $db->query("SELECT * FROM classes ORDER BY gradeLevel ASC, className ASC");
        $classes = $stmt->fetchAll();
        foreach ($classes as &$c) {
            $c = formatClassRecord($c);
        }
        sendJsonResponse($classes);
    }
}

// 2. POST Class
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin', 'teacher']);
    $body = getRequestBody();
    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : 'cls-' . time() . '-' . rand(100, 999);
    $code = isset($body['code']) && !empty($body['code']) ? trim($body['code']) : strtoupper(str_replace('cls-', 'CLS-', $id));
    $roomNumber = isset($body['roomNumber']) && !empty($body['roomNumber']) ? trim($body['roomNumber']) : 'දේශන ශාලාව 01';

    $className = isset($body['className']) && !empty($body['className']) ? trim($body['className']) : (isset($body['name']) ? trim($body['name']) : '');
    $classNameSinhala = isset($body['classNameSinhala']) && !empty($body['classNameSinhala']) ? trim($body['classNameSinhala']) : (isset($body['nameSinhala']) ? trim($body['nameSinhala']) : $className);
    $gradeLevel = isset($body['gradeLevel']) ? trim($body['gradeLevel']) : (isset($body['category']) ? trim($body['category']) : 'ප්‍රාරම්භ');
    $classTeacher = isset($body['classTeacher']) ? trim($body['classTeacher']) : (isset($body['teacherInChargeId']) ? trim($body['teacherInChargeId']) : '');
    $studentCount = isset($body['studentCount']) ? intval($body['studentCount']) : 0;
    $academicYear = isset($body['academicYear']) ? trim($body['academicYear']) : '2025/2026';
    $subjects = isset($body['subjects']) ? (is_array($body['subjects']) ? json_encode(array_values($body['subjects']), JSON_UNESCAPED_UNICODE) : (is_string($body['subjects']) ? $body['subjects'] : '[]')) : '[]';
    $timetable = isset($body['timetable']) ? (is_array($body['timetable']) ? json_encode(array_values($body['timetable']), JSON_UNESCAPED_UNICODE) : (is_string($body['timetable']) ? $body['timetable'] : '[]')) : '[]';

    if (empty($className)) {
        sendJsonResponse(["error" => "Class name is required."], 400);
    }

    try {
        $stmt = $db->prepare("INSERT INTO classes (id, code, roomNumber, className, classNameSinhala, gradeLevel, classTeacher, studentCount, academicYear, subjects, timetable) 
            VALUES (:id, :code, :rn, :cn, :cns, :gl, :ct, :sc, :ay, :subjs, :tt)
            ON DUPLICATE KEY UPDATE 
                code = VALUES(code), 
                roomNumber = VALUES(roomNumber), 
                className = VALUES(className), 
                classNameSinhala = VALUES(classNameSinhala), 
                gradeLevel = VALUES(gradeLevel), 
                classTeacher = VALUES(classTeacher), 
                studentCount = VALUES(studentCount), 
                subjects = VALUES(subjects),
                timetable = VALUES(timetable)");

        $stmt->execute([
            'id' => $id,
            'code' => $code,
            'rn' => $roomNumber,
            'cn' => $className,
            'cns' => $classNameSinhala,
            'gl' => $gradeLevel,
            'ct' => $classTeacher,
            'sc' => $studentCount,
            'ay' => $academicYear,
            'subjs' => $subjects,
            'tt' => $timetable
        ]);
    } catch (Exception $ePost) {
        // Self-heal table schema on live server if columns were missing
        try {
            @$db->exec("ALTER TABLE classes ADD COLUMN code VARCHAR(50) DEFAULT NULL");
            @$db->exec("ALTER TABLE classes ADD COLUMN roomNumber VARCHAR(100) DEFAULT 'දේශන ශාලාව 01'");
            @$db->exec("ALTER TABLE classes ADD COLUMN subjects LONGTEXT DEFAULT NULL");
            @$db->exec("ALTER TABLE classes ADD COLUMN timetable LONGTEXT DEFAULT NULL");
            @$db->exec("ALTER TABLE classes ADD COLUMN classNameSinhala VARCHAR(100) DEFAULT NULL");
            @$db->exec("ALTER TABLE classes ADD COLUMN classTeacher VARCHAR(255) DEFAULT NULL");
            @$db->exec("ALTER TABLE classes ADD COLUMN studentCount INT DEFAULT 0");
            @$db->exec("ALTER TABLE classes ADD COLUMN academicYear VARCHAR(20) DEFAULT '2025/2026'");

            $stmt = $db->prepare("INSERT INTO classes (id, code, roomNumber, className, classNameSinhala, gradeLevel, classTeacher, studentCount, academicYear, subjects, timetable) 
                VALUES (:id, :code, :rn, :cn, :cns, :gl, :ct, :sc, :ay, :subjs, :tt)
                ON DUPLICATE KEY UPDATE 
                    className = VALUES(className), 
                    classNameSinhala = VALUES(classNameSinhala), 
                    gradeLevel = VALUES(gradeLevel),
                    timetable = VALUES(timetable)");
            $stmt->execute([
                'id' => $id,
                'code' => $code,
                'rn' => $roomNumber,
                'cn' => $className,
                'cns' => $classNameSinhala,
                'gl' => $gradeLevel,
                'ct' => $classTeacher,
                'sc' => $studentCount,
                'ay' => $academicYear,
                'subjs' => $subjects,
                'tt' => $timetable
            ]);
        } catch (Exception $eRetry) {
            error_log("Failed to insert class: " . $eRetry->getMessage());
            sendJsonResponse(["error" => "Failed to save class: " . $eRetry->getMessage()], 500);
        }
    }

    logAuditEvent("නව පන්තියක් එක් කිරීම (Class Added)", "පන්තිය: '{$classNameSinhala}' ({$code}) සාර්ථකව පද්ධතියට එක් කරන ලදී.", 'Academic');

    if (!empty($body['timetable']) && class_exists('OneSignalService')) {
        OneSignalService::notifyTimetableUpdated($classNameSinhala, $id, $authUser['id'] ?? '');
    }

    $item = formatClassRecord([
        "id" => $id,
        "code" => $code,
        "roomNumber" => $roomNumber,
        "className" => $className,
        "classNameSinhala" => $classNameSinhala,
        "gradeLevel" => $gradeLevel,
        "classTeacher" => $classTeacher,
        "studentCount" => $studentCount,
        "academicYear" => $academicYear,
        "subjects" => json_decode($subjects, true),
        "timetable" => json_decode($timetable, true)
    ]);

    sendJsonResponse(["success" => true, "class" => $item], 201);
}

// 3. PUT / PATCH Class
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['admin', 'superadmin', 'teacher']);
    $body = getRequestBody();
    $classId = $pathId ?: (isset($body['id']) ? $body['id'] : null);

    if (!$classId) {
        sendJsonResponse(["error" => "Class ID is required"], 400);
    }

    $stmt = $db->prepare("SELECT * FROM classes WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $classId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        sendJsonResponse(["error" => "Class not found"], 404);
    }

    $code = array_key_exists('code', $body) && !empty($body['code']) ? trim($body['code']) : ($existing['code'] ?? 'CLS-001');
    $roomNumber = array_key_exists('roomNumber', $body) && !empty($body['roomNumber']) ? trim($body['roomNumber']) : ($existing['roomNumber'] ?? 'දේශන ශාලාව 01');
    $className = isset($body['className']) ? trim($body['className']) : (isset($body['name']) ? trim($body['name']) : $existing['className']);
    $classNameSinhala = isset($body['classNameSinhala']) ? trim($body['classNameSinhala']) : (isset($body['nameSinhala']) ? trim($body['nameSinhala']) : $existing['classNameSinhala']);
    $gradeLevel = isset($body['gradeLevel']) ? trim($body['gradeLevel']) : (isset($body['category']) ? trim($body['category']) : $existing['gradeLevel']);
    $classTeacher = isset($body['classTeacher']) ? trim($body['classTeacher']) : (isset($body['teacherInChargeId']) ? trim($body['teacherInChargeId']) : $existing['classTeacher']);
    $studentCount = isset($body['studentCount']) ? intval($body['studentCount']) : intval($existing['studentCount']);
    $academicYear = isset($body['academicYear']) ? trim($body['academicYear']) : $existing['academicYear'];
    
    $subjects = isset($body['subjects']) ? (is_array($body['subjects']) ? json_encode(array_values($body['subjects']), JSON_UNESCAPED_UNICODE) : (is_string($body['subjects']) ? $body['subjects'] : '[]')) : ($existing['subjects'] ?? '[]');
    $timetable = isset($body['timetable']) ? (is_array($body['timetable']) ? json_encode(array_values($body['timetable']), JSON_UNESCAPED_UNICODE) : (is_string($body['timetable']) ? $body['timetable'] : ($existing['timetable'] ?? '[]'))) : ($existing['timetable'] ?? '[]');

    try {
        $stmt = $db->prepare("UPDATE classes SET 
            code = :code, 
            roomNumber = :rn, 
            className = :cn, 
            classNameSinhala = :cns, 
            gradeLevel = :gl, 
            classTeacher = :ct, 
            studentCount = :sc, 
            academicYear = :ay, 
            subjects = :subjs,
            timetable = :tt 
            WHERE id = :id");

        $stmt->execute([
            'id' => $classId,
            'code' => $code,
            'rn' => $roomNumber,
            'cn' => $className,
            'cns' => $classNameSinhala,
            'gl' => $gradeLevel,
            'ct' => $classTeacher,
            'sc' => $studentCount,
            'ay' => $academicYear,
            'subjs' => $subjects,
            'tt' => $timetable
        ]);
    } catch (Exception $ePut) {
        try {
            @$db->exec("ALTER TABLE classes ADD COLUMN code VARCHAR(50) DEFAULT NULL");
            @$db->exec("ALTER TABLE classes ADD COLUMN roomNumber VARCHAR(100) DEFAULT 'දේශන ශාලාව 01'");
            @$db->exec("ALTER TABLE classes ADD COLUMN subjects LONGTEXT DEFAULT NULL");
            @$db->exec("ALTER TABLE classes ADD COLUMN timetable LONGTEXT DEFAULT NULL");
            
            $stmt = $db->prepare("UPDATE classes SET className = :cn, classNameSinhala = :cns, gradeLevel = :gl, timetable = :tt WHERE id = :id");
            $stmt->execute([
                'id' => $classId,
                'cn' => $className,
                'cns' => $classNameSinhala,
                'gl' => $gradeLevel,
                'tt' => $timetable
            ]);
        } catch (Exception $eRetry) {
            sendJsonResponse(["error" => "Failed to update class"], 500);
        }
    }

    logAuditEvent("පන්ති තොරතුරු යාවත්කාලීන කිරීම (Class Updated)", "පන්තිය: '{$classNameSinhala}' ({$code}) තොරතුරු යාවත්කාලීන කරන ලදී.", 'Academic');

    if (isset($body['timetable']) && class_exists('OneSignalService')) {
        OneSignalService::notifyTimetableUpdated($classNameSinhala, $classId, $authUser['id'] ?? '');
    }

    $item = formatClassRecord([
        "id" => $classId,
        "code" => $code,
        "roomNumber" => $roomNumber,
        "className" => $className,
        "classNameSinhala" => $classNameSinhala,
        "gradeLevel" => $gradeLevel,
        "classTeacher" => $classTeacher,
        "studentCount" => $studentCount,
        "academicYear" => $academicYear,
        "subjects" => json_decode($subjects, true),
        "timetable" => json_decode($timetable, true)
    ]);

    sendJsonResponse(["success" => true, "class" => $item]);
}

// 4. DELETE Class
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $classId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($_GET['id']) ? $_GET['id'] : null));

    if (!$classId) {
        sendJsonResponse(["error" => "Class ID is required"], 400);
    }

    $stmt = $db->prepare("DELETE FROM classes WHERE id = :id");
    $stmt->execute(['id' => $classId]);

    logAuditEvent("පන්තියක් මකා දැමීම (Class Deleted)", "පන්ති ID: '{$classId}' පද්ධතියෙන් ඉවත් කරන ලදී.", 'Academic');

    sendJsonResponse(["success" => true, "id" => $classId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
