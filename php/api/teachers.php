<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Helper to extract path ID if passed like /api/teachers/usr-123 or /api/teachers/TCH-2026-001
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'teachers.php' && $lastPart !== 'teachers' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

function normalizeTeacherArrayField($value) {
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

function formatTeacherRecord($t, $db = null) {
    if (!$t || !is_array($t)) return $t;

    $customId = !empty($t['customId']) ? trim($t['customId']) : (!empty($t['indexNumber']) ? trim($t['indexNumber']) : null);
    if (empty($customId) || strpos($customId, 'usr-') === 0 || strpos($customId, 'TCH-') !== 0) {
        $num = rand(100, 999);
        if (!empty($t['id'])) {
            $digits = preg_replace('/[^0-9]/', '', $t['id']);
            if (!empty($digits)) {
                $num = intval(substr($digits, -3));
            }
        }
        $customId = sprintf('TCH-%s-%03d', date('Y'), $num > 0 ? $num : 1);
    }

    $t['customId'] = $customId;
    $t['indexNumber'] = $customId;
    $t['role'] = 'teacher';
    $t['status'] = !empty($t['status']) ? $t['status'] : 'active';
    // 🛡️ Security Guard: Never expose passwords or tokens
    unset($t['password'], $t['plain_password'], $t['token'], $t['passwordHash']);

    $t['classesAssigned'] = normalizeTeacherArrayField($t['classesAssigned'] ?? null);
    $t['subjectsTaught'] = normalizeTeacherArrayField($t['subjectsTaught'] ?? null);
    $t['categoriesTaught'] = normalizeTeacherArrayField($t['categoriesTaught'] ?? null);

    if ($db && !empty($t['id'])) {
        try {
            $tStmt = $db->prepare("SELECT id, class_id as classId, subject_id as subjectId, COALESCE(section, 'A') as section, COALESCE(academic_year, '2026') as academicYear FROM teacher_assignments WHERE teacher_id = :tid");
            $tStmt->execute(['tid' => $t['id']]);
            $assignments = $tStmt->fetchAll();
            $t['teacherAssignments'] = $assignments ?: [];
            if ($assignments && count($assignments) > 0) {
                $assignedClasses = array_values(array_unique(array_column($assignments, 'classId')));
                $assignedSubjects = array_values(array_unique(array_column($assignments, 'subjectId')));
                if (count($assignedClasses) > 0) $t['classesAssigned'] = $assignedClasses;
                if (count($assignedSubjects) > 0) $t['subjectsTaught'] = $assignedSubjects;
            }
        } catch (Exception $e) {
            $t['teacherAssignments'] = [];
        }
    }

    return $t;
}

try {
// 1. GET Teachers
if ($method === 'GET') {
    $authUser = getAuthUser();
    $isAdmin = $authUser && in_array($authUser['role'] ?? '', ['admin', 'superadmin']);

    $classId = isset($_GET['classId']) ? trim($_GET['classId']) : null;
    $subjectId = isset($_GET['subjectId']) ? trim($_GET['subjectId']) : null;
    $status = isset($_GET['status']) ? trim($_GET['status']) : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;

    if ($pathId) {
        $stmt = $db->prepare("SELECT * FROM teachers WHERE id = :id1 OR customId = :id2 LIMIT 1");
        $stmt->execute(['id1' => $pathId, 'id2' => $pathId]);
        $teacher = $stmt->fetch();
        if (!$teacher) {
            // Fallback to users table
            $uStmt = $db->prepare("SELECT * FROM users WHERE (id = :id1 OR customId = :id2) AND role = 'teacher' LIMIT 1");
            $uStmt->execute(['id1' => $pathId, 'id2' => $pathId]);
            $teacher = $uStmt->fetch();
        }

        if ($teacher) {
            $formatted = formatTeacherRecord($teacher, $db);
            unset($formatted['password'], $formatted['plain_password'], $formatted['token'], $formatted['passwordHash']);
            sendJsonResponse($formatted);
        } else {
            sendJsonResponse(["error" => "Teacher not found"], 404);
        }
    } else {
        $query = "SELECT * FROM teachers WHERE 1=1";
        $params = [];

        if ($status) {
            $query .= " AND status = :status";
            $params['status'] = $status;
        }

        if ($search) {
            $query .= " AND (name LIKE :search OR monkName LIKE :search OR customId LIKE :search OR email LIKE :search OR phone LIKE :search)";
            $params['search'] = "%{$search}%";
        }

        $query .= " ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $teachers = $stmt->fetchAll();

        // If teachers table was empty, fallback to users table with role='teacher'
        if (empty($teachers)) {
            $uQuery = "SELECT * FROM users WHERE role = 'teacher'";
            $uParams = [];
            if ($status) {
                $uQuery .= " AND status = :status";
                $uParams['status'] = $status;
            }
            if ($search) {
                $uQuery .= " AND (name LIKE :search OR monkName LIKE :search OR customId LIKE :search OR email LIKE :search OR phone LIKE :search)";
                $uParams['search'] = "%{$search}%";
            }
            $uQuery .= " ORDER BY created_at DESC";
            $uStmt = $db->prepare($uQuery);
            $uStmt->execute($uParams);
            $teachers = $uStmt->fetchAll();
        }

        // Ultra-Fast Batch Fetch for Teacher Assignments
        $teacherMap = [];
        try {
            $tRows = $db->query("SELECT teacher_id as tid, class_id as classId, subject_id as subjectId FROM teacher_assignments")->fetchAll();
            foreach ($tRows as $tr) {
                $teacherMap[$tr['tid']][] = ['classId' => $tr['classId'], 'subjectId' => $tr['subjectId']];
            }
        } catch (Exception $eT) {}

        $processed = [];
        foreach ($teachers as $t) {
            $t = formatTeacherRecord($t, null);
            unset($t['password'], $t['plain_password'], $t['token'], $t['passwordHash']);
            if (!empty($t['id']) && isset($teacherMap[$t['id']])) {
                $t['teacherAssignments'] = $teacherMap[$t['id']];
                $assignedClasses = array_values(array_unique(array_column($teacherMap[$t['id']], 'classId')));
                $assignedSubjects = array_values(array_unique(array_column($teacherMap[$t['id']], 'subjectId')));
                if (count($assignedClasses) > 0) $t['classesAssigned'] = $assignedClasses;
                if (count($assignedSubjects) > 0) $t['subjectsTaught'] = $assignedSubjects;
            }

            if ($classId || $subjectId) {
                $matchClass = !$classId || in_array($classId, $t['classesAssigned'] ?? []);
                $matchSubject = !$subjectId || in_array($subjectId, $t['subjectsTaught'] ?? []);
                if ($matchClass && $matchSubject) {
                    $processed[] = $t;
                }
            } else {
                $processed[] = $t;
            }
        }
        sendJsonResponse($processed);
    }
}

// 2. POST Teacher (Create)
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $status = isset($body['status']) ? trim($body['status']) : 'active';
    
    $customId = !empty($body['customId']) ? trim($body['customId']) : sprintf('TCH-%s-%03d', date('Y'), rand(100, 999));
    $id = isset($body['id']) && !empty(trim($body['id'])) && strpos($body['id'], 'usr-') !== 0 ? trim($body['id']) : $customId;
    $name = isset($body['name']) ? trim($body['name']) : '';
    $monkName = isset($body['monkName']) ? trim($body['monkName']) : null;
    $email = isset($body['email']) ? trim($body['email']) : null;
    $phone = isset($body['phone']) ? trim($body['phone']) : null;
    $nic = isset($body['nic']) ? trim($body['nic']) : null;
    $qualifications = isset($body['qualifications']) ? trim($body['qualifications']) : null;
    $rawPassword = isset($body['password']) && !empty(trim($body['password'])) ? trim($body['password']) : '123456';
    $passwordHash = password_hash($rawPassword, PASSWORD_DEFAULT);
    $joinedDate = isset($body['joinedDate']) ? trim($body['joinedDate']) : date('Y-m-d');
    $avatar = isset($body['avatar']) ? saveAvatarIfBase64(trim($body['avatar']), 'tch') : null;

    $classesAssigned = json_encode(normalizeTeacherArrayField($body['classesAssigned'] ?? $body['assignedClasses'] ?? null), JSON_UNESCAPED_UNICODE);
    $subjectsTaught = json_encode(normalizeTeacherArrayField($body['subjectsTaught'] ?? $body['assignedSubjects'] ?? null), JSON_UNESCAPED_UNICODE);
    $categoriesTaught = json_encode(normalizeTeacherArrayField($body['categoriesTaught'] ?? null), JSON_UNESCAPED_UNICODE);

    // Insert into teachers table with self-healing table creation
    try {
        $stmt = $db->prepare("INSERT INTO teachers (
            id, customId, name, monkName, email, phone, nic, qualifications, classesAssigned, subjectsTaught, categoriesTaught, status, joinedDate, plain_password, avatar
        ) VALUES (
            :id, :customId, :name, :monkName, :email, :phone, :nic, :qualifications, :classesAssigned, :subjectsTaught, :categoriesTaught, :status, :joinedDate, NULL, :avatar
        ) ON DUPLICATE KEY UPDATE
            name = VALUES(name), monkName = VALUES(monkName), email = VALUES(email), phone = VALUES(phone), nic = VALUES(nic), qualifications = VALUES(qualifications),
            classesAssigned = VALUES(classesAssigned), subjectsTaught = VALUES(subjectsTaught), categoriesTaught = VALUES(categoriesTaught), status = VALUES(status), plain_password = NULL, avatar = VALUES(avatar)");

        $stmt->execute([
            'id' => $id,
            'customId' => $customId,
            'name' => $name,
            'monkName' => $monkName,
            'email' => $email,
            'phone' => $phone,
            'nic' => $nic,
            'qualifications' => $qualifications,
            'classesAssigned' => $classesAssigned,
            'subjectsTaught' => $subjectsTaught,
            'categoriesTaught' => $categoriesTaught,
            'status' => $status,
            'joinedDate' => $joinedDate,
            'avatar' => $avatar
        ]);
    } catch (Exception $eTeach) {
        error_log("Failed to insert teacher into teachers table: " . $eTeach->getMessage());
    }

    // Also sync with users table for unified login
    try {
        $uStmt = $db->prepare("INSERT INTO users (
            id, username, password, monkName, name, email, phone, role, indexNumber, customId, nic, avatar, plain_password, status, classesAssigned, subjectsTaught, categoriesTaught
        ) VALUES (
            :id, :username, :password, :monkName, :name, :email, :phone, 'teacher', :customId, :customId, :nic, :avatar, NULL, :status, :classesAssigned, :subjectsTaught, :categoriesTaught
        ) ON DUPLICATE KEY UPDATE
            password = VALUES(password), monkName = VALUES(monkName), name = VALUES(name), email = VALUES(email), phone = VALUES(phone), nic = VALUES(nic), avatar = VALUES(avatar), plain_password = NULL, status = VALUES(status), classesAssigned = VALUES(classesAssigned), subjectsTaught = VALUES(subjectsTaught), categoriesTaught = VALUES(categoriesTaught)");

        $uStmt->execute([
            'id' => $id,
            'username' => !empty($email) ? $email : $customId,
            'password' => $passwordHash,
            'monkName' => $monkName,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'customId' => $customId,
            'nic' => $nic,
            'avatar' => $avatar,
            'status' => $status,
            'classesAssigned' => $classesAssigned,
            'subjectsTaught' => $subjectsTaught,
            'categoriesTaught' => $categoriesTaught
        ]);
    } catch (Exception $e) {}

    // Synchronize teacher assignments if provided
    if (isset($body['teacherAssignments']) && is_array($body['teacherAssignments'])) {
        try {
            $delStmt = $db->prepare("DELETE FROM teacher_assignments WHERE teacher_id = :tid");
            $delStmt->execute(['tid' => $id]);

            $insStmt = $db->prepare("INSERT INTO teacher_assignments (id, teacher_id, class_id, subject_id, section, academic_year) VALUES (:asgnId, :tid, :cid, :sid, :sec, :ay)");
            foreach ($body['teacherAssignments'] as $asgn) {
                if (!empty($asgn['classId']) && !empty($asgn['subjectId'])) {
                    $insStmt->execute([
                        'asgnId' => 'tasgn-' . uniqid(),
                        'tid' => $id,
                        'cid' => trim($asgn['classId']),
                        'sid' => trim($asgn['subjectId']),
                        'sec' => !empty($asgn['section']) ? trim($asgn['section']) : 'A',
                        'ay' => !empty($asgn['academicYear']) ? trim($asgn['academicYear']) : '2026'
                    ]);
                }
            }
        } catch (Exception $e) {}
    }

    $fetchStmt = $db->prepare("SELECT * FROM teachers WHERE id = :id LIMIT 1");
    $fetchStmt->execute(['id' => $id]);
    $created = $fetchStmt->fetch();

    $teacherDisplayName = !empty($name) ? $name : ($monkName ?: $customId);
    logAuditEvent("නව ගුරුභවතෙකු ලියාපදිංචි කිරීම (Teacher Registered)", "ගුරුභවතා: '{$teacherDisplayName}' ({$customId}) සාර්ථකව පද්ධතියට එක් කරන ලදී.", 'Teachers');

    sendJsonResponse([
        'success' => true,
        'teacher' => formatTeacherRecord($created, $db)
    ], 201);
}

// 3. PUT Teacher (Update)
if ($method === 'PUT') {
    $authUser = requireAuth();
    $isAdmin = in_array(strtolower(trim($authUser['role'] ?? '')), ['admin', 'superadmin']);
    if (!$pathId) {
        sendJsonResponse(["error" => "Teacher ID is required"], 400);
    }

    if (!$isAdmin && $authUser['id'] !== $pathId && ($authUser['customId'] ?? '') !== $pathId) {
        sendJsonResponse([
            'success' => false,
            'error' => 'ඔබට වෙනත් ගුරුභවතෙකුගේ තොරතුරු සංස්කරණය කිරීමට අවසර නොමැත (Forbidden).',
            'code' => 'FORBIDDEN'
        ], 403);
    }

    $body = getRequestBody();

    if (!$isAdmin) {
        unset($body['classesAssigned'], $body['assignedClasses'], $body['subjectsTaught'], $body['assignedSubjects'], $body['categoriesTaught'], $body['teacherAssignments'], $body['status'], $body['role']);
    }

    $updates = [];
    $params = ['id' => $pathId];

    $allowedFields = ['name', 'monkName', 'email', 'phone', 'nic', 'qualifications', 'status', 'joinedDate', 'avatar'];
    foreach ($allowedFields as $field) {
        if (isset($body[$field])) {
            $val = $body[$field];
            if ($field === 'avatar') {
                $val = saveAvatarIfBase64($val, 'tch');
            }
            $updates[] = "{$field} = :{$field}";
            $params[$field] = $val;
        }
    }

    if (isset($body['password']) && !empty(trim($body['password']))) {
        $rawPassword = trim($body['password']);
        $hash = password_hash($rawPassword, PASSWORD_DEFAULT);
        $updates[] = "password = :password";
        $updates[] = "plain_password = NULL";
        $params['password'] = $hash;
        
        try {
            $uPassStmt = $db->prepare("UPDATE users SET password = :p, plain_password = NULL WHERE id = :uid1 OR customId = :uid2");
            $uPassStmt->execute(['p' => $hash, 'uid1' => $pathId, 'uid2' => $pathId]);
        } catch (Exception $e) {}
    }

    if (isset($body['classesAssigned']) || isset($body['assignedClasses'])) {
        $classes = normalizeTeacherArrayField($body['classesAssigned'] ?? $body['assignedClasses']);
        $updates[] = "classesAssigned = :classesAssigned";
        $params['classesAssigned'] = json_encode($classes, JSON_UNESCAPED_UNICODE);
    }

    if (isset($body['subjectsTaught']) || isset($body['assignedSubjects'])) {
        $subjects = normalizeTeacherArrayField($body['subjectsTaught'] ?? $body['assignedSubjects']);
        $updates[] = "subjectsTaught = :subjectsTaught";
        $params['subjectsTaught'] = json_encode($subjects, JSON_UNESCAPED_UNICODE);
    }

    if (isset($body['categoriesTaught'])) {
        $cats = normalizeTeacherArrayField($body['categoriesTaught']);
        $updates[] = "categoriesTaught = :categoriesTaught";
        $params['categoriesTaught'] = json_encode($cats, JSON_UNESCAPED_UNICODE);
    }

    if (!empty($updates)) {
        $params['tid1'] = $pathId;
        $params['tid2'] = $pathId;
        $sql = "UPDATE teachers SET " . implode(', ', $updates) . " WHERE id = :tid1 OR customId = :tid2";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        // Also update in users table
        try {
            $uSql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :tid1 OR customId = :tid2";
            $uStmt = $db->prepare($uSql);
            $uStmt->execute($params);
        } catch (Exception $e) {}
    }

    // Update teacher assignments if given
    if (isset($body['teacherAssignments']) && is_array($body['teacherAssignments'])) {
        try {
            $delStmt = $db->prepare("DELETE FROM teacher_assignments WHERE teacher_id = :tid");
            $delStmt->execute(['tid' => $pathId]);

            $insStmt = $db->prepare("INSERT INTO teacher_assignments (id, teacher_id, class_id, subject_id, section, academic_year) VALUES (:asgnId, :tid, :cid, :sid, :sec, :ay)");
            foreach ($body['teacherAssignments'] as $asgn) {
                if (!empty($asgn['classId']) && !empty($asgn['subjectId'])) {
                    $insStmt->execute([
                        'asgnId' => 'tasgn-' . uniqid(),
                        'tid' => $pathId,
                        'cid' => trim($asgn['classId']),
                        'sid' => trim($asgn['subjectId']),
                        'sec' => !empty($asgn['section']) ? trim($asgn['section']) : 'A',
                        'ay' => !empty($asgn['academicYear']) ? trim($asgn['academicYear']) : '2026'
                    ]);
                }
            }
        } catch (Exception $e) {}
    }

    $fetchStmt = $db->prepare("SELECT * FROM teachers WHERE id = :fid1 OR customId = :fid2 LIMIT 1");
    $fetchStmt->execute(['fid1' => $pathId, 'fid2' => $pathId]);
    $updated = $fetchStmt->fetch();

    logAuditEvent("ගුරු තොරතුරු යාවත්කාලීන කිරීම (Teacher Updated)", "ගුරු ID: '{$pathId}' තොරතුරු යාවත්කාලීන කරන ලදී.", 'Teachers');

    sendJsonResponse([
        'success' => true,
        'teacher' => formatTeacherRecord($updated, $db)
    ]);
}

// 4. DELETE Teacher
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    if (!$pathId) {
        sendJsonResponse(["error" => "Teacher ID is required"], 400);
    }

    $cleanId = trim($pathId);
    $candidates = array_values(array_unique(array_filter([$cleanId, urldecode($cleanId)])));
    $inPlaceholders = implode(',', array_fill(0, count($candidates), '?'));
    $lowerCandidates = array_map('strtolower', $candidates);
    $delParams = array_merge($candidates, $candidates, $lowerCandidates, $lowerCandidates);

    try {
        $stmtSel = $db->prepare("SELECT photoUrl, avatar FROM teachers WHERE id IN ($inPlaceholders) OR customId IN ($inPlaceholders) LIMIT 1");
        $stmtSel->execute(array_merge($candidates, $candidates));
        $tch = $stmtSel->fetch();
        if ($tch) {
            $pUrl = !empty($tch['photoUrl']) ? $tch['photoUrl'] : (!empty($tch['avatar']) ? $tch['avatar'] : '');
            if (!empty($pUrl)) {
                deleteUploadedFile($pUrl);
            }
        }
    } catch (Exception $e) {}

    try {
        $stmt = $db->prepare("DELETE FROM teachers WHERE id IN ($inPlaceholders) OR customId IN ($inPlaceholders) OR LOWER(TRIM(id)) IN ($inPlaceholders) OR LOWER(TRIM(customId)) IN ($inPlaceholders)");
        $stmt->execute($delParams);
    } catch (Exception $eDelT) {}

    try {
        $uStmt = $db->prepare("DELETE FROM users WHERE id IN ($inPlaceholders) OR customId IN ($inPlaceholders) OR LOWER(TRIM(id)) IN ($inPlaceholders) OR LOWER(TRIM(customId)) IN ($inPlaceholders)");
        $uStmt->execute($delParams);

        $aStmt = $db->prepare("DELETE FROM teacher_assignments WHERE teacher_id IN ($inPlaceholders)");
        $aStmt->execute($candidates);
    } catch (Exception $e) {}

    logAuditEvent("ගුරුභවතෙකු ඉවත් කිරීම (Teacher Deleted)", "ගුරු ID: '{$pathId}' පද්ධතියෙන් ඉවත් කරන ලදී.", 'Teachers');

    sendJsonResponse(['success' => true, 'id' => $pathId]);
}

    sendJsonResponse(["error" => "Method not allowed"], 405);
} catch (Throwable $e) {
    error_log("Teachers API Exception: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
    sendJsonResponse([
        "success" => false,
        "error" => "Server Error: " . $e->getMessage(),
        "line" => $e->getLine()
    ], 500);
}
