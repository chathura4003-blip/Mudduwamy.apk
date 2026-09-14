<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Helper to extract path ID if passed like /api/students/usr-123 or /api/students/STD-2026-001
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'students.php' && $lastPart !== 'students' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

function normalizeStudentArrayField($value) {
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
        return [$trimmed];
    }
    return [];
}

function formatStudentRecord($s, $db = null) {
    if (!$s || !is_array($s)) return $s;

    $customId = !empty($s['customId']) ? trim($s['customId']) : (!empty($s['indexNumber']) ? trim($s['indexNumber']) : null);
    if (empty($customId) || strpos($customId, 'usr-') === 0 || (strpos($customId, 'STD-') !== 0 && strpos($customId, 'STU-') !== 0)) {
        $num = rand(100, 999);
        if (!empty($s['id'])) {
            $digits = preg_replace('/[^0-9]/', '', $s['id']);
            if (!empty($digits)) {
                $num = intval(substr($digits, -3));
            }
        }
        $customId = sprintf('STD-%s-%03d', date('Y'), $num > 0 ? $num : 1);
    }

    $s['customId'] = $customId;
    $s['indexNumber'] = $customId;
    $s['admissionNo'] = !empty($s['admissionNo']) ? $s['admissionNo'] : $customId;
    $s['role'] = 'student';
    $s['status'] = !empty($s['status']) ? $s['status'] : 'active';
    $s['plain_password'] = !empty($s['plain_password']) ? $s['plain_password'] : (!empty($s['password']) ? $s['password'] : '123456');

    $resolvedClassId = !empty($s['classId']) ? trim($s['classId']) : (!empty($s['pirivenaClass']) ? trim($s['pirivenaClass']) : null);
    $s['classId'] = $resolvedClassId;
    $s['pirivenaClass'] = $resolvedClassId;

    // Standardize monkStatus ('monk' vs 'lay')
    $rawMonkStatus = strtolower(trim($s['monkStatus'] ?? ''));
    if ($rawMonkStatus === 'lay') {
        $s['monkStatus'] = 'lay';
    } elseif ($rawMonkStatus === 'monk') {
        $s['monkStatus'] = 'monk';
    } else {
        $checkText = ($s['monkName'] ?? '') . ' ' . ($s['name'] ?? '');
        if (mb_stripos($checkText, 'හිමි') !== false || mb_stripos($checkText, 'Ven') !== false || mb_stripos($checkText, 'Thero') !== false || mb_stripos($checkText, 'සාමණේර') !== false) {
            $s['monkStatus'] = 'monk';
        } else {
            $s['monkStatus'] = 'lay';
        }
    }

    $s['enrolledSubjects'] = normalizeStudentArrayField($s['enrolledSubjects'] ?? $s['subjectsAssigned'] ?? null);
    $s['subjectsAssigned'] = $s['enrolledSubjects'];

    if ($db && !empty($s['id'])) {
        try {
            $subStmt = $db->prepare("SELECT subject_id as subjectId FROM student_subjects WHERE student_id = :sid");
            $subStmt->execute(['sid' => $s['id']]);
            $subjects = $subStmt->fetchAll(PDO::FETCH_COLUMN);
            if ($subjects && count($subjects) > 0) {
                $s['enrolledSubjects'] = array_values(array_unique($subjects));
                $s['subjectsAssigned'] = $s['enrolledSubjects'];
            }
        } catch (Exception $e) {}
    }

    return $s;
}

try {
// 1. GET Students
if ($method === 'GET') {
    $authUser = getAuthUser();
    if (!$authUser) {
        if ($pathId) {
            sendJsonResponse(["error" => "Student not found"], 404);
        } else {
            sendJsonResponse([], 200);
        }
    }
    $isAdmin = in_array($authUser['role'] ?? '', ['admin', 'superadmin']);

    $classId = isset($_GET['classId']) ? trim($_GET['classId']) : null;
    $subjectId = isset($_GET['subjectId']) ? trim($_GET['subjectId']) : null;
    $status = isset($_GET['status']) ? trim($_GET['status']) : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;

    if ($pathId) {
        $uStmt = $db->prepare("SELECT * FROM users WHERE (id = :id1 OR customId = :id2 OR indexNumber = :id3) AND role = 'student' LIMIT 1");
        $uStmt->execute(['id1' => $pathId, 'id2' => $pathId, 'id3' => $pathId]);
        $student = $uStmt->fetch();

        if (!$student) {
            // Fallback to students table
            $stmt = $db->prepare("SELECT * FROM students WHERE id = :id1 OR customId = :id2 OR indexNumber = :id3 OR admissionNo = :id4 LIMIT 1");
            $stmt->execute(['id1' => $pathId, 'id2' => $pathId, 'id3' => $pathId, 'id4' => $pathId]);
            $student = $stmt->fetch();
        }

        if ($student) {
            $formatted = formatStudentRecord($student, $db);
            if (!$isAdmin && ($authUser['id'] !== ($student['id'] ?? '') && ($authUser['customId'] ?? '') !== ($student['customId'] ?? ''))) {
                unset($formatted['password'], $formatted['plain_password'], $formatted['token']);
            }
            sendJsonResponse($formatted);
        } else {
            sendJsonResponse(["error" => "Student not found"], 404);
        }
    } else {
        // Query users table as primary source of student records
        $uQuery = "SELECT * FROM users WHERE role = 'student'";
        $uParams = [];
        if ($classId) {
            $uQuery .= " AND (classId = :classId OR pirivenaClass = :classId)";
            $uParams['classId'] = $classId;
        }
        if ($status) {
            $uQuery .= " AND status = :status";
            $uParams['status'] = $status;
        }
        if ($search) {
            $uQuery .= " AND (name LIKE :search OR monkName LIKE :search OR customId LIKE :search OR indexNumber LIKE :search OR email LIKE :search OR phone LIKE :search OR guardianName LIKE :search)";
            $uParams['search'] = "%{$search}%";
        }
        $uQuery .= " ORDER BY created_at DESC";
        $uStmt = $db->prepare($uQuery);
        $uStmt->execute($uParams);
        $students = $uStmt->fetchAll();

        // If users table has no students, fallback to students table
        if (empty($students)) {
            $query = "SELECT * FROM students WHERE 1=1";
            $params = [];
            if ($classId) {
                $query .= " AND (classId = :classId OR pirivenaClass = :classId)";
                $params['classId'] = $classId;
            }
            if ($status) {
                $query .= " AND status = :status";
                $params['status'] = $status;
            }
            if ($search) {
                $query .= " AND (name LIKE :search OR monkName LIKE :search OR customId LIKE :search OR indexNumber LIKE :search OR admissionNo LIKE :search OR email LIKE :search OR phone LIKE :search OR guardianName LIKE :search)";
                $params['search'] = "%{$search}%";
            }
            $query .= " ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            $students = $stmt->fetchAll();
        }

        // Apply Teacher authorization / class matching
        if ($authUser && $authUser['role'] === 'teacher') {
            try {
                $tStmt = $db->prepare("SELECT DISTINCT class_id FROM teacher_assignments WHERE teacher_id = :tid1 OR teacher_id = :tid2");
                $tStmt->execute(['tid1' => $authUser['id'], 'tid2' => $authUser['customId'] ?? $authUser['id']]);
                $allowedClasses = $tStmt->fetchAll(PDO::FETCH_COLUMN) ?: [];

                // Also include classesAssigned from user / teacher record
                $userAssignedClasses = normalizeStudentArrayField($authUser['classesAssigned'] ?? null);
                $allowedClasses = array_unique(array_merge($allowedClasses, $userAssignedClasses));

                // Also include classes where this teacher is the in-charge teacher
                try {
                    $cStmt = $db->prepare("SELECT id, code, name, nameSinhala FROM classes WHERE teacherInChargeId = :tid1 OR teacherInChargeId = :tid2 OR classTeacher = :tname1 OR classTeacher = :tname2");
                    $cStmt->execute([
                        'tid1' => $authUser['id'],
                        'tid2' => $authUser['customId'] ?? $authUser['id'],
                        'tname1' => $authUser['name'] ?? '',
                        'tname2' => $authUser['monkName'] ?? ''
                    ]);
                    $inChargeClasses = $cStmt->fetchAll();
                    foreach ($inChargeClasses as $ic) {
                        if (!empty($ic['id'])) $allowedClasses[] = $ic['id'];
                        if (!empty($ic['code'])) $allowedClasses[] = $ic['code'];
                        if (!empty($ic['name'])) $allowedClasses[] = $ic['name'];
                        if (!empty($ic['nameSinhala'])) $allowedClasses[] = $ic['nameSinhala'];
                    }
                } catch (Exception $eC) {}

                if (!empty($allowedClasses)) {
                    $expandedClassKeys = [];
                    foreach ($allowedClasses as $ac) {
                        if (!empty($ac)) $expandedClassKeys[] = trim($ac);
                    }
                    try {
                        $allCls = $db->query("SELECT id, code, name, nameSinhala FROM classes")->fetchAll();
                        foreach ($allCls as $cls) {
                            $matches = in_array($cls['id'], $allowedClasses) ||
                                       (!empty($cls['code']) && in_array($cls['code'], $allowedClasses)) ||
                                       (!empty($cls['name']) && in_array($cls['name'], $allowedClasses)) ||
                                       (!empty($cls['nameSinhala']) && in_array($cls['nameSinhala'], $allowedClasses));
                            if ($matches) {
                                $expandedClassKeys[] = $cls['id'];
                                if (!empty($cls['code'])) $expandedClassKeys[] = $cls['code'];
                                if (!empty($cls['name'])) $expandedClassKeys[] = $cls['name'];
                                if (!empty($cls['nameSinhala'])) $expandedClassKeys[] = $cls['nameSinhala'];
                            }
                        }
                    } catch (Exception $eExp) {}
                    $allowedClasses = array_values(array_unique($expandedClassKeys));

                    $filtered = array_filter($students, function($s) use ($allowedClasses, $authUser) {
                        $studentClass = trim($s['classId'] ?? $s['pirivenaClass'] ?? '');
                        $isClassMatch = !empty($studentClass) && in_array($studentClass, $allowedClasses);
                        $isTeacherMatch = !empty($s['classTeacherId']) && ($s['classTeacherId'] === $authUser['id'] || $s['classTeacherId'] === ($authUser['customId'] ?? ''));
                        return $isClassMatch || $isTeacherMatch;
                    });
                    if (!empty($filtered)) {
                        $students = array_values($filtered);
                    }
                }
            } catch (Exception $e) {}
        }

        // Ultra-Fast Batch Fetch for Student Subjects
        $studentMap = [];
        try {
            $sRows = $db->query("SELECT student_id as sid, class_id as classId, subject_id as subjectId FROM student_subjects")->fetchAll();
            foreach ($sRows as $sr) {
                $studentMap[$sr['sid']][] = $sr['subjectId'];
            }
        } catch (Exception $eS) {}

        $processed = [];
        foreach ($students as $s) {
            $s = formatStudentRecord($s, null);
            if (!$isAdmin) {
                unset($s['password'], $s['plain_password'], $s['token']);
            }
            if (!empty($s['id']) && isset($studentMap[$s['id']])) {
                $assignedSubs = array_values(array_unique($studentMap[$s['id']]));
                $s['subjectsAssigned'] = $assignedSubs;
                $s['enrolledSubjects'] = $assignedSubs;
            }

            if ($subjectId) {
                $subs = $s['enrolledSubjects'] ?? $s['subjectsAssigned'] ?? [];
                if (in_array($subjectId, $subs)) {
                    $processed[] = $s;
                }
            } else {
                $processed[] = $s;
            }
        }

        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : null;
        $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : null;
        $totalCount = count($processed);

        if ($page !== null || $limit !== null) {
            $p = $page ?: 1;
            $l = $limit ?: 20;
            $offset = ($p - 1) * $l;
            $sliced = array_slice($processed, $offset, $l);

            header('X-Total-Count: ' . $totalCount);
            header('X-Page: ' . $p);
            header('X-Limit: ' . $l);
            header('X-Total-Pages: ' . ceil($totalCount / $l));
            header('X-Has-More: ' . (($offset + $l < $totalCount) ? 'true' : 'false'));
            sendJsonResponse($sliced);
        } else {
            sendJsonResponse($processed);
        }
    }
}

// 2. POST Student (Create)
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin', 'teacher']);
    $body = getRequestBody();
    $status = isset($body['status']) ? trim($body['status']) : 'active';
    
    $customId = !empty($body['customId']) ? trim($body['customId']) : (!empty($body['indexNumber']) ? trim($body['indexNumber']) : sprintf('STD-%s-%03d', date('Y'), rand(100, 999)));
    $id = isset($body['id']) && !empty(trim($body['id'])) && strpos($body['id'], 'usr-') !== 0 ? trim($body['id']) : $customId;
    $admissionNo = isset($body['admissionNo']) ? trim($body['admissionNo']) : $customId;
    $name = isset($body['name']) ? trim($body['name']) : '';
    $monkName = isset($body['monkName']) ? trim($body['monkName']) : null;
    $classId = isset($body['classId']) && !empty(trim($body['classId'])) ? trim($body['classId']) : (isset($body['pirivenaClass']) ? trim($body['pirivenaClass']) : null);
    $email = isset($body['email']) ? trim($body['email']) : null;
    $phone = isset($body['phone']) ? trim($body['phone']) : null;
    $guardianName = isset($body['guardianName']) ? trim($body['guardianName']) : null;
    $guardianPhone = isset($body['guardianPhone']) ? trim($body['guardianPhone']) : null;
    $emergencyContact = isset($body['emergencyContact']) ? trim($body['emergencyContact']) : null;
    $address = isset($body['address']) ? trim($body['address']) : null;
    $dateOfBirth = isset($body['dateOfBirth']) ? trim($body['dateOfBirth']) : null;
    $rawPassword = isset($body['password']) && !empty(trim($body['password'])) ? trim($body['password']) : '123456';
    $passwordHash = password_hash($rawPassword, PASSWORD_DEFAULT);
    $joinedDate = isset($body['joinedDate']) ? trim($body['joinedDate']) : date('Y-m-d');
    $avatar = isset($body['avatar']) ? saveAvatarIfBase64(trim($body['avatar']), 'std') : null;

    $enrolledSubjects = json_encode(normalizeStudentArrayField($body['enrolledSubjects'] ?? $body['subjectsAssigned'] ?? null), JSON_UNESCAPED_UNICODE);

    // Insert into students table with self-healing table creation
    try {
        $stmt = $db->prepare("INSERT INTO students (
            id, customId, indexNumber, admissionNo, name, monkName, classId, pirivenaClass, email, phone, guardianName, guardianPhone, emergencyContact, address, dateOfBirth, enrolledSubjects, subjectsAssigned, status, joinedDate, plain_password, avatar
        ) VALUES (
            :id, :customId, :customId, :admissionNo, :name, :monkName, :classId, :classId, :email, :phone, :guardianName, :guardianPhone, :emergencyContact, :address, :dateOfBirth, :enrolledSubjects, :enrolledSubjects, :status, :joinedDate, :plain_password, :avatar
        ) ON DUPLICATE KEY UPDATE
            name = VALUES(name), monkName = VALUES(monkName), classId = VALUES(classId), pirivenaClass = VALUES(pirivenaClass), email = VALUES(email), phone = VALUES(phone), guardianName = VALUES(guardianName), guardianPhone = VALUES(guardianPhone), emergencyContact = VALUES(emergencyContact), address = VALUES(address), dateOfBirth = VALUES(dateOfBirth), enrolledSubjects = VALUES(enrolledSubjects), subjectsAssigned = VALUES(subjectsAssigned), status = VALUES(status), plain_password = VALUES(plain_password), avatar = VALUES(avatar)");

        $stmt->execute([
            'id' => $id,
            'customId' => $customId,
            'admissionNo' => $admissionNo,
            'name' => $name,
            'monkName' => $monkName,
            'classId' => $classId,
            'email' => $email,
            'phone' => $phone,
            'guardianName' => $guardianName,
            'guardianPhone' => $guardianPhone,
            'emergencyContact' => $emergencyContact,
            'address' => $address,
            'dateOfBirth' => $dateOfBirth,
            'enrolledSubjects' => $enrolledSubjects,
            'status' => $status,
            'joinedDate' => $joinedDate,
            'plain_password' => $rawPassword,
            'avatar' => $avatar
        ]);
    } catch (Exception $eStud) {
        try {
            @$db->exec("CREATE TABLE IF NOT EXISTS `students` (
                `id` VARCHAR(64) PRIMARY KEY,
                `customId` VARCHAR(100) DEFAULT NULL,
                `indexNumber` VARCHAR(100) DEFAULT NULL,
                `admissionNo` VARCHAR(100) DEFAULT NULL,
                `name` VARCHAR(255) NOT NULL,
                `monkName` VARCHAR(255) DEFAULT NULL,
                `classId` VARCHAR(64) DEFAULT NULL,
                `pirivenaClass` VARCHAR(100) DEFAULT NULL,
                `email` VARCHAR(255) DEFAULT NULL,
                `phone` VARCHAR(50) DEFAULT NULL,
                `guardianName` VARCHAR(255) DEFAULT NULL,
                `guardianPhone` VARCHAR(50) DEFAULT NULL,
                `emergencyContact` VARCHAR(50) DEFAULT NULL,
                `address` TEXT DEFAULT NULL,
                `dateOfBirth` DATE DEFAULT NULL,
                `enrolledSubjects` TEXT DEFAULT NULL,
                `subjectsAssigned` TEXT DEFAULT NULL,
                `status` VARCHAR(50) DEFAULT 'active',
                `joinedDate` DATE DEFAULT NULL,
                `plain_password` VARCHAR(255) DEFAULT '123456',
                `avatar` VARCHAR(500) DEFAULT NULL,
                `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

            $stmt = $db->prepare("INSERT INTO students (id, customId, name, classId, status, plain_password) 
                VALUES (:id, :cid, :name, :cls, :status, :pp)
                ON DUPLICATE KEY UPDATE name = VALUES(name), plain_password = VALUES(plain_password)");
            $stmt->execute([
                'id' => $id,
                'cid' => $customId,
                'name' => $name,
                'cls' => $classId,
                'status' => $status,
                'pp' => $rawPassword
            ]);
        } catch (Exception $eRetry) {
            error_log("Failed to insert student: " . $eRetry->getMessage());
        }
    }

    // Sync to users table for unified login
    try {
        $uStmt = $db->prepare("INSERT INTO users (
            id, username, password, monkName, name, email, phone, role, indexNumber, customId, pirivenaClass, classId, avatar, guardianName, guardianPhone, plain_password, status, subjectsAssigned
        ) VALUES (
            :id, :username, :password, :monkName, :name, :email, :phone, 'student', :customId, :customId, :classId, :classId, :avatar, :guardianName, :guardianPhone, :plain_password, :status, :enrolledSubjects
        ) ON DUPLICATE KEY UPDATE
            password = VALUES(password), monkName = VALUES(monkName), name = VALUES(name), email = VALUES(email), phone = VALUES(phone), pirivenaClass = VALUES(pirivenaClass), classId = VALUES(classId), avatar = VALUES(avatar), guardianName = VALUES(guardianName), guardianPhone = VALUES(guardianPhone), plain_password = VALUES(plain_password), status = VALUES(status), subjectsAssigned = VALUES(subjectsAssigned)");

        $uStmt->execute([
            'id' => $id,
            'username' => !empty($email) ? $email : $customId,
            'password' => $passwordHash,
            'monkName' => $monkName,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'customId' => $customId,
            'classId' => $classId,
            'avatar' => $avatar,
            'guardianName' => $guardianName,
            'guardianPhone' => $guardianPhone,
            'plain_password' => $rawPassword,
            'status' => $status,
            'enrolledSubjects' => $enrolledSubjects
        ]);
    } catch (Exception $e) {}

    // Synchronize student subjects if provided
    $subsList = normalizeStudentArrayField($body['enrolledSubjects'] ?? $body['subjectsAssigned'] ?? null);
    if (!empty($subsList)) {
        try {
            $delStmt = $db->prepare("DELETE FROM student_subjects WHERE student_id = :sid");
            $delStmt->execute(['sid' => $id]);

            $insStmt = $db->prepare("INSERT INTO student_subjects (id, student_id, class_id, subject_id) VALUES (:asgnId, :sid, :cid, :subId)");
            foreach ($subsList as $sid) {
                if (!empty($sid)) {
                    $insStmt->execute([
                        'asgnId' => 'subasgn-' . uniqid(),
                        'sid' => $id,
                        'cid' => $classId ?: 'cls-01',
                        'subId' => trim($sid)
                    ]);
                }
            }
        } catch (Exception $e) {}
    }

    $fetchStmt = $db->prepare("SELECT * FROM students WHERE id = :id LIMIT 1");
    $fetchStmt->execute(['id' => $id]);
    $created = $fetchStmt->fetch();

    $studentDisplayName = !empty($name) ? $name : ($monkName ?: $customId);
    logAuditEvent("නව ශිෂ්‍යයෙකු ලියාපදිංචි කිරීම (Student Registered)", "ශිෂ්‍යයා: '{$studentDisplayName}' ({$customId}) සාර්ථකව පද්ධතියට එක් කරන ලදී.", 'Students');

    sendJsonResponse([
        'success' => true,
        'student' => formatStudentRecord($created, $db)
    ], 201);
}

// 3. PUT Student (Update)
if ($method === 'PUT') {
    $authUser = requireAuth();
    $isAdminOrTeacher = in_array(strtolower(trim($authUser['role'] ?? '')), ['admin', 'superadmin', 'teacher']);
    if (!$pathId) {
        sendJsonResponse(["error" => "Student ID is required"], 400);
    }

    if (!$isAdminOrTeacher && $authUser['id'] !== $pathId && ($authUser['customId'] ?? '') !== $pathId) {
        sendJsonResponse([
            'success' => false,
            'error' => 'ඔබට වෙනත් සිසුවෙකුගේ තොරතුරු සංස්කරණය කිරීමට අවසර නොමැත (Forbidden).',
            'code' => 'FORBIDDEN'
        ], 403);
    }

    $body = getRequestBody();
    $updates = [];
    $params = ['id' => $pathId];

    $allowedFields = ['name', 'monkName', 'classId', 'pirivenaClass', 'email', 'phone', 'guardianName', 'guardianPhone', 'emergencyContact', 'address', 'dateOfBirth', 'status', 'joinedDate', 'avatar', 'admissionNo'];
    foreach ($allowedFields as $field) {
        if (isset($body[$field])) {
            $val = $body[$field];
            if ($field === 'avatar') {
                $val = saveAvatarIfBase64($val, 'std');
            }
            $updates[] = "{$field} = :{$field}";
            $params[$field] = $val;
        }
    }

    if (isset($body['password']) && !empty(trim($body['password']))) {
        $rawPassword = trim($body['password']);
        $updates[] = "plain_password = :plain_password";
        $params['plain_password'] = $rawPassword;
        
        try {
            $hash = password_hash($rawPassword, PASSWORD_DEFAULT);
            $uPassStmt = $db->prepare("UPDATE users SET password = :p, plain_password = :pp WHERE id = :pid1 OR customId = :pid2 OR indexNumber = :pid3");
            $uPassStmt->execute(['p' => $hash, 'pp' => $rawPassword, 'pid1' => $pathId, 'pid2' => $pathId, 'pid3' => $pathId]);
        } catch (Exception $e) {}
    }

    if (isset($body['enrolledSubjects']) || isset($body['subjectsAssigned'])) {
        $subs = normalizeStudentArrayField($body['enrolledSubjects'] ?? $body['subjectsAssigned']);
        $updates[] = "enrolledSubjects = :enrolledSubjects";
        $updates[] = "subjectsAssigned = :enrolledSubjects";
        $params['enrolledSubjects'] = json_encode($subs, JSON_UNESCAPED_UNICODE);
    }

    if (!empty($updates)) {
        $params['sid1'] = $pathId;
        $params['sid2'] = $pathId;
        $params['sid3'] = $pathId;
        $sql = "UPDATE students SET " . implode(', ', $updates) . " WHERE id = :sid1 OR customId = :sid2 OR indexNumber = :sid3";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Also update in users table
        try {
            $uSql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :sid1 OR customId = :sid2 OR indexNumber = :sid3";
            $uStmt = $db->prepare($uSql);
            $uStmt->execute($params);
        } catch (Exception $e) {}
    }

    $fetchStmt = $db->prepare("SELECT * FROM students WHERE id = :fid1 OR customId = :fid2 OR indexNumber = :fid3 LIMIT 1");
    $fetchStmt->execute(['fid1' => $pathId, 'fid2' => $pathId, 'fid3' => $pathId]);
    $updated = $fetchStmt->fetch();

    logAuditEvent("ශිෂ්‍ය තොරතුරු යාවත්කාලීන කිරීම (Student Updated)", "ශිෂ්‍ය ID: '{$pathId}' තොරතුරු යාවත්කාලීන කරන ලදී.", 'Students');

    sendJsonResponse([
        'success' => true,
        'student' => formatStudentRecord($updated, $db)
    ]);
}

// 4. DELETE Student
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    if (!$pathId) {
        sendJsonResponse(["error" => "Student ID is required"], 400);
    }

    $cleanId = trim($pathId);
    $candidates = [$cleanId, urldecode($cleanId)];
    if (strpos(strtolower($cleanId), 'std-') === 0) {
        $candidates[] = 'stu-' . substr($cleanId, 4);
        $candidates[] = 'STU-' . substr($cleanId, 4);
    } elseif (strpos(strtolower($cleanId), 'stu-') === 0) {
        $candidates[] = 'std-' . substr($cleanId, 4);
        $candidates[] = 'STD-' . substr($cleanId, 4);
    }
    $candidates = array_values(array_unique(array_filter($candidates)));
    $inPlaceholders = implode(',', array_fill(0, count($candidates), '?'));
    $lowerCandidates = array_map('strtolower', $candidates);
    $delParams = array_merge($candidates, $candidates, $candidates, $lowerCandidates, $lowerCandidates);

    try {
        $stmtSel = $db->prepare("SELECT photoUrl, avatar, profilePicture FROM students WHERE id IN ($inPlaceholders) OR customId IN ($inPlaceholders) OR indexNumber IN ($inPlaceholders) LIMIT 1");
        $stmtSel->execute(array_merge($candidates, $candidates, $candidates));
        $stu = $stmtSel->fetch();
        if ($stu) {
            $pUrl = !empty($stu['photoUrl']) ? $stu['photoUrl'] : (!empty($stu['avatar']) ? $stu['avatar'] : (!empty($stu['profilePicture']) ? $stu['profilePicture'] : ''));
            if (!empty($pUrl)) {
                deleteUploadedFile($pUrl);
            }
        }
    } catch (Exception $e) {}

    try {
        $stmt = $db->prepare("DELETE FROM students WHERE id IN ($inPlaceholders) OR customId IN ($inPlaceholders) OR indexNumber IN ($inPlaceholders) OR LOWER(TRIM(id)) IN ($inPlaceholders) OR LOWER(TRIM(customId)) IN ($inPlaceholders)");
        $stmt->execute($delParams);
    } catch (Exception $eDelS) {}

    try {
        $uStmt = $db->prepare("DELETE FROM users WHERE id IN ($inPlaceholders) OR customId IN ($inPlaceholders) OR indexNumber IN ($inPlaceholders) OR LOWER(TRIM(id)) IN ($inPlaceholders) OR LOWER(TRIM(customId)) IN ($inPlaceholders)");
        $uStmt->execute($delParams);

        $sStmt = $db->prepare("DELETE FROM student_subjects WHERE student_id IN ($inPlaceholders)");
        $sStmt->execute($candidates);
    } catch (Exception $e) {}

    logAuditEvent("ශිෂ්‍යයෙකු ඉවත් කිරීම (Student Deleted)", "ශිෂ්‍ය ID: '{$pathId}' පද්ධතියෙන් ඉවත් කරන ලදී.", 'Students');

    sendJsonResponse(['success' => true, 'id' => $pathId]);
}

    sendJsonResponse(["error" => "Method not allowed"], 405);
} catch (Throwable $e) {
    error_log("Students API Exception: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
    sendJsonResponse([
        "success" => false,
        "error" => "Server Error: " . $e->getMessage(),
        "line" => $e->getLine()
    ], 500);
}
