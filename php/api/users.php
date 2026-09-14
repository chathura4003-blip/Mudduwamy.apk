<?php
/**
 * Sri Sumana Maha Pirivena ERP - User Management API
 * Production-ready CRUD with relational assignments & security rules.
 */

require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Extract path ID if passed like /api/users/usr-123 or /api/users/TCH-2025-001
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'users.php' && $lastPart !== 'users' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

// ==========================================
// 1. REUSABLE HELPER FUNCTIONS
// ==========================================

if (!function_exists('normalizeUserArrayField')) {
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
}

if (!function_exists('serializeUserArrayField')) {
    function serializeUserArrayField($value) {
        return json_encode(normalizeUserArrayField($value), JSON_UNESCAPED_UNICODE);
    }
}

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
 * Synchronize teacher class-subject assignments in relational database table
 */
function syncTeacherAssignments($db, $teacherId, $assignmentsData, $classesFallback = null, $subjectsFallback = null, $customId = null) {
    try {
        $delStmt = $db->prepare("DELETE FROM teacher_assignments WHERE teacher_id = :tid1 OR teacher_id = :tid2");
        $delStmt->execute(['tid1' => $teacherId, 'tid2' => !empty($customId) ? $customId : $teacherId]);
        
        $assignments = [];
        if (is_array($assignmentsData) && count($assignmentsData) > 0) {
            $assignments = $assignmentsData;
        } elseif (!empty($classesFallback) && !empty($subjectsFallback)) {
            $clsList = normalizeUserArrayField($classesFallback);
            $subList = normalizeUserArrayField($subjectsFallback);
            foreach ($clsList as $c) {
                foreach ($subList as $s) {
                    $assignments[] = ['classId' => $c, 'subjectId' => $s];
                }
            }
        }

        if (empty($assignments)) return ['classes' => [], 'subjects' => []];

        $insStmt = $db->prepare("INSERT INTO teacher_assignments (id, teacher_id, class_id, subject_id) VALUES (:aid, :tid, :cid, :sid)");
        $clsList = [];
        $subList = [];
        foreach ($assignments as $a) {
            $cId = trim($a['classId'] ?? $a['class_id'] ?? '');
            $sId = trim($a['subjectId'] ?? $a['subject_id'] ?? '');
            if (!empty($cId) && !empty($sId)) {
                $clsList[] = $cId;
                $subList[] = $sId;
                $aId = 'ta_' . md5($teacherId . '_' . $cId . '_' . $sId);
                $insStmt->execute([
                    'aid' => $aId,
                    'tid' => $teacherId,
                    'cid' => $cId,
                    'sid' => $sId
                ]);
            }
        }
        return [
            'classes' => array_values(array_unique($clsList)),
            'subjects' => array_values(array_unique($subList))
        ];
    } catch (Exception $e) {
        return ['classes' => [], 'subjects' => []];
    }
}

/**
 * Synchronize student assigned subjects in relational database table
 */
function syncStudentSubjects($db, $studentId, $classId, $subjectsData) {
    if (empty($classId)) return;
    try {
        $db->prepare("DELETE FROM student_subjects WHERE student_id = :sid")->execute(['sid' => $studentId]);
        $subs = normalizeUserArrayField($subjectsData);
        if (empty($subs)) return;

        $subStmt = $db->prepare("INSERT INTO student_subjects (id, student_id, class_id, subject_id) VALUES (:ssid, :sid, :cid, :subid)");
        foreach ($subs as $subId) {
            if (!empty($subId)) {
                $ssId = 'ss_' . md5($studentId . '_' . $classId . '_' . $subId);
                $subStmt->execute([
                    'ssid' => $ssId,
                    'sid' => $studentId,
                    'cid' => $classId,
                    'subid' => $subId
                ]);
            }
        }
    } catch (Exception $e) {}
}

/**
 * Standardize user record fields for UI consistency
 */
if (!function_exists('formatUserRecord')) {
function formatUserRecord($u, $db = null) {
    if (!$u || !is_array($u)) return $u;
    
    $rawRole = strtolower(trim($u['role'] ?? ''));
    $cId = strval($u['customId'] ?? ($u['indexNumber'] ?? ($u['id'] ?? '')));
    if (empty($rawRole)) {
        if (strpos($cId, 'TCH-') === 0) $rawRole = 'teacher';
        elseif (strpos($cId, 'ADM-') === 0 || strpos($cId, 'usr-admin') === 0) $rawRole = 'admin';
        else $rawRole = 'student';
    } elseif (strpos($cId, 'TCH-') === 0 && $rawRole === 'student') {
        $rawRole = 'teacher';
    } elseif (strpos($cId, 'STD-') === 0 && $rawRole === 'teacher') {
        $rawRole = 'student';
    }
    $role = $rawRole;
    $u['role'] = $role;

    $customId = !empty($u['customId']) ? trim($u['customId']) : (!empty($u['indexNumber']) ? trim($u['indexNumber']) : null);

    if (empty($customId) || strpos($customId, 'usr-') === 0 || ($role === 'teacher' && strpos($customId, 'TCH-') !== 0) || ($role === 'student' && strpos($customId, 'STD-') !== 0)) {
        $num = rand(100, 999);
        if (!empty($u['id'])) {
            $digits = preg_replace('/[^0-9]/', '', $u['id']);
            if (!empty($digits)) $num = intval(substr($digits, -3));
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
        // Intelligent fallback if field was not set in legacy rows
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
    
    // Relational fetching if database handle provided
    if ($db && !empty($u['id'])) {
        if ($role === 'teacher') {
            try {
                $tStmt = $db->prepare("SELECT class_id as classId, subject_id as subjectId FROM teacher_assignments WHERE teacher_id = :tid1 OR teacher_id = :tid2");
                $tStmt->execute([
                    'tid1' => $u['id'],
                    'tid2' => !empty($u['customId']) ? $u['customId'] : $u['id']
                ]);
                $assignments = $tStmt->fetchAll();
                if ($assignments && count($assignments) > 0) {
                    $u['teacherAssignments'] = $assignments;
                    $relClasses = array_values(array_unique(array_column($assignments, 'classId')));
                    $relSubjects = array_values(array_unique(array_column($assignments, 'subjectId')));
                    $u['classesAssigned'] = array_values(array_unique(array_merge($u['classesAssigned'], $relClasses)));
                    $u['subjectsTaught'] = array_values(array_unique(array_merge($u['subjectsTaught'], $relSubjects)));
                } else {
                    $u['teacherAssignments'] = [];
                    // Synthesize teacherAssignments from classesAssigned & subjectsTaught if present
                    if (!empty($u['classesAssigned']) && !empty($u['subjectsTaught'])) {
                        $synth = [];
                        foreach ($u['classesAssigned'] as $c) {
                            foreach ($u['subjectsTaught'] as $s) {
                                $synth[] = ['classId' => $c, 'subjectId' => $s];
                            }
                        }
                        $u['teacherAssignments'] = $synth;
                    }
                }
            } catch (Exception $e) {
                $u['teacherAssignments'] = [];
            }
        } elseif ($role === 'student') {
            try {
                $sStmt = $db->prepare("SELECT class_id as classId, subject_id as subjectId FROM student_subjects WHERE student_id = :sid");
                $sStmt->execute(['sid' => $u['id']]);
                $subRows = $sStmt->fetchAll();
                $u['studentSubjects'] = $subRows ?: [];
                if ($subRows && count($subRows) > 0) {
                    $u['subjectsAssigned'] = array_values(array_unique(array_column($subRows, 'subjectId')));
                }
            } catch (Exception $e) {}
        }
    }

    // 🛡️ Security Guard: Never return passwords, plain passwords, or tokens
    unset($u['password'], $u['plain_password'], $u['passwordHash'], $u['token']);

    return $u;
}
}

// ==========================================
// 2. HTTP METHODS (GET, POST, PUT, DELETE)
// ==========================================

try {
// 2a. GET Users
if ($method === 'GET') {
    $authUser = getAuthUser();
    
    if (!$authUser) {
        if ($pathId) {
            sendJsonResponse(["error" => "User not found"], 404);
        } else {
            sendJsonResponse([], 200);
        }
    }

    $isAdmin = in_array($authUser['role'] ?? '', ['admin', 'superadmin']);
    if ($pathId) {
        if (($authUser['role'] ?? '') === 'student') {
            requireStudentOwnership($authUser, $pathId);
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

        $stmt = $db->prepare("SELECT * FROM users WHERE (
            id IN ($inPlaceholders)
            OR customId IN ($inPlaceholders)
            OR indexNumber IN ($inPlaceholders)
            OR username IN ($inPlaceholders)
            OR LOWER(TRIM(id)) IN ($inPlaceholders)
            OR LOWER(TRIM(customId)) IN ($inPlaceholders)
        ) LIMIT 1");
        $stmt->execute(array_merge($candidates, $candidates, $candidates, $candidates, $lowerCandidates, $lowerCandidates));
        $user = $stmt->fetch();

        if (!$user) {
            // Check students table
            try {
                $sStmt = $db->prepare("SELECT * FROM students WHERE (
                    id IN ($inPlaceholders)
                    OR customId IN ($inPlaceholders)
                    OR indexNumber IN ($inPlaceholders)
                    OR admissionNo IN ($inPlaceholders)
                    OR LOWER(TRIM(id)) IN ($inPlaceholders)
                    OR LOWER(TRIM(customId)) IN ($inPlaceholders)
                ) LIMIT 1");
                $sStmt->execute(array_merge($candidates, $candidates, $candidates, $candidates, $lowerCandidates, $lowerCandidates));
                $sRow = $sStmt->fetch();
                if ($sRow) {
                    $user = $sRow;
                    $user['role'] = 'student';
                }
            } catch (Exception $eStd) {}
        }

        if (!$user) {
            // Check teachers table
            try {
                $tStmt = $db->prepare("SELECT * FROM teachers WHERE (
                    id IN ($inPlaceholders)
                    OR customId IN ($inPlaceholders)
                    OR nic IN ($inPlaceholders)
                    OR LOWER(TRIM(id)) IN ($inPlaceholders)
                    OR LOWER(TRIM(customId)) IN ($inPlaceholders)
                ) LIMIT 1");
                $tStmt->execute(array_merge($candidates, $candidates, $candidates, $lowerCandidates, $lowerCandidates));
                $tRow = $tStmt->fetch();
                if ($tRow) {
                    $user = $tRow;
                    $user['role'] = 'teacher';
                }
            } catch (Exception $eTch) {}
        }

        if ($user) {
            $formatted = formatUserRecord($user, $db);
            unset($formatted['password'], $formatted['plain_password'], $formatted['token'], $formatted['passwordHash']);
            sendJsonResponse($formatted);
        } else {
            sendJsonResponse(["error" => "User not found"], 404);
        }
    } else {
        if (!$isAdmin && ($authUser['role'] ?? '') !== 'teacher') {
            sendJsonResponse([formatUserRecord($authUser, $db)]);
        }

        $roleFilter = isset($_GET['role']) ? trim($_GET['role']) : null;
        $query = "SELECT * FROM users";
        $params = [];

        if ($roleFilter) {
            $query .= " WHERE role = :role";
            $params['role'] = $roleFilter;
        }

        $query .= " ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $users = $stmt->fetchAll();

        // Enforce teacher authorization boundary
        if ($authUser && $authUser['role'] === 'teacher' && (!$roleFilter || $roleFilter === 'student')) {
            try {
                $tStmt = $db->prepare("SELECT DISTINCT class_id FROM teacher_assignments WHERE teacher_id = :tid1 OR teacher_id = :tid2");
                $tStmt->execute(['tid1' => $authUser['id'], 'tid2' => $authUser['customId'] ?? $authUser['id']]);
                $allowedClasses = $tStmt->fetchAll(PDO::FETCH_COLUMN) ?: [];

                try {
                    $cStmt = $db->prepare("SELECT id, code, name, nameSinhala FROM classes WHERE teacherInChargeId = :tid1 OR teacherInChargeId = :tid2");
                    $cStmt->execute([
                        'tid1' => $authUser['id'],
                        'tid2' => $authUser['customId'] ?? $authUser['id']
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

                    $filtered = array_filter($users, function($u) use ($allowedClasses) {
                        if ($u['role'] !== 'student') return true;
                        $studentClass = trim($u['classId'] ?? $u['pirivenaClass'] ?? '');
                        return !empty($studentClass) && in_array($studentClass, $allowedClasses);
                    });
                    $users = array_values($filtered);
                } else {
                    $users = array_values(array_filter($users, function($u) { return $u['role'] !== 'student'; }));
                }
            } catch (Exception $e) {
                $users = array_values(array_filter($users, function($u) { return $u['role'] !== 'student'; }));
            }
        }

        // Ultra-Fast Batch Fetch for Assignments
        $teacherMap = [];
        $studentMap = [];
        try {
            $tRows = $db->query("SELECT teacher_id as tid, class_id as classId, subject_id as subjectId FROM teacher_assignments")->fetchAll();
            foreach ($tRows as $tr) {
                $teacherMap[$tr['tid']][] = ['classId' => $tr['classId'], 'subjectId' => $tr['subjectId']];
            }
        } catch (Exception $eT) {}

        try {
            $sRows = $db->query("SELECT student_id as sid, class_id as classId, subject_id as subjectId FROM student_subjects")->fetchAll();
            foreach ($sRows as $sr) {
                $studentMap[$sr['sid']][] = ['classId' => $sr['classId'], 'subjectId' => $sr['subjectId']];
            }
        } catch (Exception $eS) {}

        foreach ($users as &$u) {
            $u = formatUserRecord($u, null);
            unset($u['password'], $u['plain_password'], $u['token'], $u['passwordHash']);
            if (!empty($u['id'])) {
                if ($u['role'] === 'teacher') {
                    $u['teacherAssignments'] = $teacherMap[$u['id']] ?? [];
                    if (!empty($u['teacherAssignments'])) {
                        $u['classesAssigned'] = array_values(array_unique(array_column($u['teacherAssignments'], 'classId')));
                        $u['subjectsTaught'] = array_values(array_unique(array_column($u['teacherAssignments'], 'subjectId')));
                    }
                } elseif ($u['role'] === 'student') {
                    $u['studentSubjects'] = $studentMap[$u['id']] ?? [];
                    if (!empty($u['studentSubjects'])) {
                        $u['subjectsAssigned'] = array_values(array_unique(array_column($u['studentSubjects'], 'subjectId')));
                    }
                }
            }
        }
        sendJsonResponse($users);
    }
}

// 2b. POST User (Create)
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $role = isset($body['role']) ? trim($body['role']) : 'student';
    $status = isset($body['status']) ? trim($body['status']) : 'active';
    
    $indexNumber = !empty($body['customId']) ? trim($body['customId']) : (!empty($body['indexNumber']) ? trim($body['indexNumber']) : null);
    if (empty($indexNumber) || strpos($indexNumber, 'usr-') === 0 || ($role === 'teacher' && strpos($indexNumber, 'TCH-') !== 0)) {
        $prefix = $role === 'teacher' ? 'TCH' : ($role === 'admin' || $role === 'superadmin' ? 'ADM' : 'STD');
        $indexNumber = sprintf('%s-%s-%03d', $prefix, date('Y'), rand(100, 999));
    }
    $customId = $indexNumber;

    $id = isset($body['id']) && !empty($body['id']) && strpos($body['id'], 'usr-') !== 0 ? trim($body['id']) : $customId;
    $rawPassword = isset($body['password']) && !empty(trim($body['password'])) ? trim($body['password']) : '123456';
    $passwordHash = password_hash($rawPassword, PASSWORD_DEFAULT);
    $name = isset($body['name']) ? trim($body['name']) : '';
    $monkName = isset($body['monkName']) ? trim($body['monkName']) : null;
    $email = isset($body['email']) && !empty(trim($body['email'])) ? trim($body['email']) : null;
    if (empty($email)) {
        $cleanCid = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $customId));
        $email = ($role === 'teacher' ? 'tch' : 'std') . ($cleanCid ? $cleanCid : time()) . '@gmail.com';
    }
    $username = !empty($body['username']) ? trim($body['username']) : (!empty($email) ? $email : $customId);
    $phone = isset($body['phone']) ? trim($body['phone']) : null;
    $nic = isset($body['nic']) ? trim($body['nic']) : null;

    $classId = isset($body['classId']) && !empty(trim($body['classId']))
        ? trim($body['classId'])
        : (isset($body['pirivenaClass']) ? trim($body['pirivenaClass']) : null);
    $pirivenaClass = $classId;

    $avatar = isset($body['avatar']) ? saveAvatarIfBase64(trim($body['avatar']), ($role === 'teacher' ? 'tch' : 'std')) : null;
    $guardianName = isset($body['guardianName']) ? trim($body['guardianName']) : null;
    $guardianPhone = isset($body['guardianPhone']) ? trim($body['guardianPhone']) : null;
    $educationCategory = isset($body['educationCategory']) ? trim($body['educationCategory']) : null;
    $classLevel = isset($body['classLevel']) ? trim($body['classLevel']) : null;
    $academicYear = isset($body['academicYear']) ? trim($body['academicYear']) : '2025/2026';
    $classTeacherId = isset($body['classTeacherId']) ? trim($body['classTeacherId']) : null;
    $monkStatus = isset($body['monkStatus']) ? trim($body['monkStatus']) : 'monk';
    $guardianRelation = isset($body['guardianRelation']) ? trim($body['guardianRelation']) : null;
    $guardianAddress = isset($body['guardianAddress']) ? trim($body['guardianAddress']) : null;
    $templeName = isset($body['templeName']) ? trim($body['templeName']) : null;
    $nicOrBirthCert = isset($body['nicOrBirthCert']) ? trim($body['nicOrBirthCert']) : null;

    $classesAssigned = serializeUserArrayField($body['classesAssigned'] ?? null);
    $subjectsTaught = serializeUserArrayField($body['subjectsTaught'] ?? null);
    $categoriesTaught = serializeUserArrayField($body['categoriesTaught'] ?? null);
    $subjectsAssigned = serializeUserArrayField($body['subjectsAssigned'] ?? null);
    
    $qualification = isset($body['qualification']) && !empty(trim($body['qualification']))
        ? trim($body['qualification'])
        : (isset($body['qualifications']) && !empty(trim($body['qualifications'])) ? trim($body['qualifications']) : null);

    if (empty($name)) {
        sendJsonResponse(["error" => "Name is required."], 400);
    }

    $existingCols = getTableColumns($db, 'users');
    $insertFields = [
        'id' => $id,
        'customId' => $customId,
        'indexNumber' => $indexNumber,
        'username' => $username,
        'password' => $passwordHash,
        'plain_password' => null,
        'name' => $name,
        'monkName' => $monkName,
        'email' => $email,
        'phone' => $phone,
        'role' => $role,
        'nic' => $nic,
        'pirivenaClass' => $pirivenaClass,
        'classId' => $classId,
        'avatar' => $avatar,
        'guardianName' => $guardianName,
        'guardianPhone' => $guardianPhone,
        'guardianRelation' => $guardianRelation,
        'guardianAddress' => $guardianAddress,
        'templeName' => $templeName,
        'nicOrBirthCert' => $nicOrBirthCert,
        'educationCategory' => $educationCategory,
        'classLevel' => $classLevel,
        'academicYear' => $academicYear,
        'classTeacherId' => $classTeacherId,
        'monkStatus' => $monkStatus,
        'status' => $status,
        'classesAssigned' => $classesAssigned,
        'subjectsTaught' => $subjectsTaught,
        'categoriesTaught' => $categoriesTaught,
        'subjectsAssigned' => $subjectsAssigned,
        'qualification' => $qualification,
        'qualifications' => $qualification
    ];

    $colsToInsert = [];
    $placeholders = [];
    $updateClauses = [];
    $insertParams = [];

    foreach ($insertFields as $col => $val) {
        if (in_array($col, $existingCols)) {
            $colsToInsert[] = "`{$col}`";
            $placeholders[] = ":ins_{$col}";
            $insertParams["ins_{$col}"] = $val;
            if ($col !== 'id' && $col !== 'username') {
                $updateClauses[] = "`{$col}` = VALUES(`{$col}`)";
            }
        }
    }

    if (!empty($colsToInsert)) {
        try {
            $insSql = "INSERT INTO users (" . implode(', ', $colsToInsert) . ") VALUES (" . implode(', ', $placeholders) . ")";
            if (!empty($updateClauses)) {
                $insSql .= " ON DUPLICATE KEY UPDATE " . implode(', ', $updateClauses);
            }
            $insStmt = $db->prepare($insSql);
            $insStmt->execute($insertParams);
        } catch (Exception $eIns) {
            error_log("Users dynamic insert warning: " . $eIns->getMessage());
            try {
                $minStmt = $db->prepare("INSERT INTO users (id, customId, username, password, plain_password, name, monkName, email, phone, role, status) 
                    VALUES (:id, :cid, :u, :p, NULL, :name, :mname, :email, :phone, :role, :status)
                    ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), plain_password = NULL");
                $minStmt->execute([
                    'id' => $id,
                    'cid' => $customId,
                    'u' => $username . '_' . rand(10, 99),
                    'p' => $passwordHash,
                    'name' => $name,
                    'mname' => $monkName,
                    'email' => $email,
                    'phone' => $phone,
                    'role' => $role,
                    'status' => $status
                ]);
            } catch (Exception $eMin) {
                sendJsonResponse(["error" => "Failed to save user record: " . $eMin->getMessage()], 500);
            }
        }
    }

    // Sync relational tables
    if ($role === 'teacher') {
        syncTeacherAssignments($db, $id, $body['teacherAssignments'] ?? null, $body['classesAssigned'] ?? null, $body['subjectsTaught'] ?? null, $customId);
        try {
            $tCols = getTableColumns($db, 'teachers');
            $tInsCols = [];
            $tPlaceholders = [];
            $tParams = [];
            $tData = [
                'id' => $id, 'customId' => $customId, 'name' => $name, 'monkName' => $monkName,
                'email' => $email, 'phone' => $phone, 'nic' => $nic, 'qualifications' => $qualification,
                'classesAssigned' => $classesAssigned, 'subjectsTaught' => $subjectsTaught,
                'categoriesTaught' => $categoriesTaught, 'status' => $status, 'avatar' => $avatar,
                'plain_password' => null
            ];
            foreach ($tData as $tc => $tv) {
                if (in_array($tc, $tCols)) {
                    $tInsCols[] = "`{$tc}`";
                    $tPlaceholders[] = ":t_{$tc}";
                    $tParams["t_{$tc}"] = $tv;
                }
            }
            if (!empty($tInsCols)) {
                $tInsSql = "INSERT INTO teachers (" . implode(', ', $tInsCols) . ") VALUES (" . implode(', ', $tPlaceholders) . ") ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), plain_password = NULL";
                $tInsStmt = $db->prepare($tInsSql);
                $tInsStmt->execute($tParams);
            }
        } catch (Exception $eT) {}
    } elseif ($role === 'student') {
        if (!empty($classId)) {
            syncStudentSubjects($db, $id, $classId, $body['subjectsAssigned'] ?? null);
        }
        try {
            $sCols = getTableColumns($db, 'students');
            $sInsCols = [];
            $sPlaceholders = [];
            $sParams = [];
            $sData = [
                'id' => $id,
                'customId' => $customId,
                'indexNumber' => $indexNumber,
                'admissionNo' => $customId,
                'name' => $name,
                'monkName' => $monkName,
                'classId' => $classId,
                'pirivenaClass' => $pirivenaClass,
                'email' => $email,
                'phone' => $phone,
                'guardianName' => $guardianName,
                'guardianPhone' => $guardianPhone,
                'guardianRelation' => $guardianRelation,
                'guardianAddress' => $guardianAddress,
                'address' => $guardianAddress,
                'templeName' => $templeName,
                'nicOrBirthCert' => $nicOrBirthCert,
                'educationCategory' => $educationCategory,
                'classLevel' => $classLevel,
                'academicYear' => $academicYear,
                'classTeacherId' => $classTeacherId,
                'monkStatus' => $monkStatus,
                'enrolledSubjects' => $subjectsAssigned,
                'subjectsAssigned' => $subjectsAssigned,
                'status' => $status,
                'plain_password' => null,
                'avatar' => $avatar
            ];
            foreach ($sData as $sc => $sv) {
                if (in_array($sc, $sCols)) {
                    $sInsCols[] = "`{$sc}`";
                    $sPlaceholders[] = ":s_{$sc}";
                    $sParams["s_{$sc}"] = $sv;
                }
            }
            if (!empty($sInsCols)) {
                $sInsSql = "INSERT INTO students (" . implode(', ', $sInsCols) . ") VALUES (" . implode(', ', $sPlaceholders) . ") ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), pirivenaClass = VALUES(pirivenaClass), classId = VALUES(classId), plain_password = NULL";
                $sInsStmt = $db->prepare($sInsSql);
                $sInsStmt->execute($sParams);
            }
        } catch (Exception $eSIns) {
            error_log("Students table insert warning: " . $eSIns->getMessage());
        }
    }

    $displayName = !empty($name) ? $name : ($monkName ?: $customId);
    $roleDisplay = $role === 'student' ? 'ශිෂ්‍ය' : ($role === 'teacher' ? 'ගුරුභවතෙකු' : 'පරිශීලකයෙකු');
    logAuditEvent("නව {$roleDisplay} ලියාපදිංචි කිරීම (User Created)", "නම: '{$displayName}' ({$customId}) සාර්ථකව පද්ධතියට එක් කරන ලදී.", 'Users');

    $fetchStmt = $db->prepare("SELECT * FROM users WHERE id = :id1 OR customId = :id2 LIMIT 1");
    $fetchStmt->execute(['id1' => $id, 'id2' => $customId]);
    $createdRow = $fetchStmt->fetch();
    if (!$createdRow) {
        $createdRow = array_merge($insertFields, ['id' => $id]);
    }
    $newUser = formatUserRecord($createdRow, $db);

    sendJsonResponse($newUser, 201);
}

// 2c. PUT / PATCH User (Update)
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireAuth();
    $isAdmin = in_array(strtolower(trim($authUser['role'] ?? '')), ['admin', 'superadmin']);
    $body = getRequestBody();
    $userId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($body['customId']) ? $body['customId'] : null));

    if (!$userId) {
        sendJsonResponse(["error" => "User ID is required for update"], 400);
    }

    // Security Guard: Non-admins can ONLY edit their own account profile
    if (!$isAdmin && $authUser['id'] !== $userId && ($authUser['customId'] ?? '') !== $userId) {
        sendJsonResponse([
            'success' => false,
            'error' => 'ඔබට වෙනත් පරිශීලකයින්ගේ ගිණුම් සංස්කරණය කිරීමට අවසර නොමැත (Forbidden: Cannot edit another user).',
            'code' => 'FORBIDDEN'
        ], 403);
    }

    // Security Guard: Non-admins cannot alter their role, status, or academic assignments
    if (!$isAdmin) {
        unset(
            $body['role'],
            $body['status'],
            $body['classesAssigned'],
            $body['assignedClasses'],
            $body['subjectsTaught'],
            $body['assignedSubjects'],
            $body['categoriesTaught'],
            $body['teacherAssignments'],
            $body['classId'],
            $body['pirivenaClass'],
            $body['subjectsAssigned'],
            $body['customId'],
            $body['indexNumber']
        );
    }

    // Lookup user by id, customId, or indexNumber
    $stmt = $db->prepare("SELECT * FROM users WHERE id = :id1 OR customId = :id2 OR indexNumber = :id3 LIMIT 1");
    $stmt->execute(['id1' => $userId, 'id2' => $userId, 'id3' => $userId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        // Also try teachers / students tables if not in users yet
        try {
            $tStmt = $db->prepare("SELECT * FROM teachers WHERE id = :id1 OR customId = :id2 LIMIT 1");
            $tStmt->execute(['id1' => $userId, 'id2' => $userId]);
            $existingTeacher = $tStmt->fetch();
            if ($existingTeacher) {
                $existing = $existingTeacher;
                $existing['role'] = 'teacher';
            } else {
                $sStmt = $db->prepare("SELECT * FROM students WHERE id = :id1 OR customId = :id2 OR indexNumber = :id3 LIMIT 1");
                $sStmt->execute(['id1' => $userId, 'id2' => $userId, 'id3' => $userId]);
                $existingStudent = $sStmt->fetch();
                if ($existingStudent) {
                    $existing = $existingStudent;
                    $existing['role'] = 'student';
                }
            }
        } catch (Exception $eAlt) {}
    }

    $actualDbId = !empty($existing['id']) ? $existing['id'] : $userId;
    $role = isset($body['role']) ? trim($body['role']) : (!empty($existing['role']) ? $existing['role'] : 'teacher');
    $name = isset($body['name']) ? trim($body['name']) : (!empty($existing['name']) ? $existing['name'] : '');
    $monkName = array_key_exists('monkName', $body) ? trim($body['monkName']) : ($existing['monkName'] ?? null);
    $email = array_key_exists('email', $body) ? trim($body['email']) : ($existing['email'] ?? null);
    $phone = array_key_exists('phone', $body) ? trim($body['phone']) : ($existing['phone'] ?? null);
    $status = array_key_exists('status', $body) ? trim($body['status']) : ($existing['status'] ?? 'active');
    
    $indexNumber = array_key_exists('customId', $body) && !empty($body['customId']) 
        ? trim($body['customId']) 
        : (array_key_exists('indexNumber', $body) && !empty($body['indexNumber']) ? trim($body['indexNumber']) : ($existing['customId'] ?? $existing['indexNumber'] ?? $userId));
    $customId = $indexNumber;
    $nic = array_key_exists('nic', $body) ? trim($body['nic']) : ($existing['nic'] ?? null);

    $classId = array_key_exists('classId', $body) && !empty(trim($body['classId']))
        ? trim($body['classId'])
        : (array_key_exists('pirivenaClass', $body) && !empty(trim($body['pirivenaClass'])) ? trim($body['pirivenaClass']) : ($existing['classId'] ?? $existing['pirivenaClass'] ?? null));
    $pirivenaClass = $classId;

    $avatar = array_key_exists('avatar', $body) ? saveAvatarIfBase64(trim($body['avatar']), ($role === 'teacher' ? 'tch' : 'std')) : ($existing['avatar'] ?? null);
    $guardianName = array_key_exists('guardianName', $body) ? trim($body['guardianName']) : ($existing['guardianName'] ?? null);
    $guardianPhone = array_key_exists('guardianPhone', $body) ? trim($body['guardianPhone']) : ($existing['guardianPhone'] ?? null);
    $educationCategory = array_key_exists('educationCategory', $body) ? trim($body['educationCategory']) : ($existing['educationCategory'] ?? null);
    $classLevel = array_key_exists('classLevel', $body) ? trim($body['classLevel']) : ($existing['classLevel'] ?? null);
    $academicYear = array_key_exists('academicYear', $body) ? trim($body['academicYear']) : ($existing['academicYear'] ?? '2025/2026');
    $classTeacherId = array_key_exists('classTeacherId', $body) ? trim($body['classTeacherId']) : ($existing['classTeacherId'] ?? null);
    $monkStatus = array_key_exists('monkStatus', $body) ? trim($body['monkStatus']) : ($existing['monkStatus'] ?? 'monk');
    $guardianRelation = array_key_exists('guardianRelation', $body) ? trim($body['guardianRelation']) : ($existing['guardianRelation'] ?? null);
    $guardianAddress = array_key_exists('guardianAddress', $body) ? trim($body['guardianAddress']) : ($existing['guardianAddress'] ?? null);
    $templeName = array_key_exists('templeName', $body) ? trim($body['templeName']) : ($existing['templeName'] ?? null);
    $nicOrBirthCert = array_key_exists('nicOrBirthCert', $body) ? trim($body['nicOrBirthCert']) : ($existing['nicOrBirthCert'] ?? null);

    if ($role === 'teacher' && (array_key_exists('teacherAssignments', $body) || array_key_exists('classesAssigned', $body))) {
        $syncRes = syncTeacherAssignments($db, $actualDbId, $body['teacherAssignments'] ?? null, $body['classesAssigned'] ?? null, $body['subjectsTaught'] ?? null, $customId);
        if (!empty($syncRes['classes'])) $body['classesAssigned'] = $syncRes['classes'];
        if (!empty($syncRes['subjects'])) $body['subjectsTaught'] = $syncRes['subjects'];
    }

    if ($role === 'student' && (array_key_exists('subjectsAssigned', $body) || array_key_exists('classId', $body))) {
        syncStudentSubjects($db, $actualDbId, $classId, $body['subjectsAssigned'] ?? $existing['subjectsAssigned'] ?? null);
    }

    $classesAssigned = array_key_exists('classesAssigned', $body) ? serializeUserArrayField($body['classesAssigned']) : serializeUserArrayField($existing['classesAssigned'] ?? null);
    $subjectsTaught = array_key_exists('subjectsTaught', $body) ? serializeUserArrayField($body['subjectsTaught']) : serializeUserArrayField($existing['subjectsTaught'] ?? null);
    $categoriesTaught = array_key_exists('categoriesTaught', $body) ? serializeUserArrayField($body['categoriesTaught']) : serializeUserArrayField($existing['categoriesTaught'] ?? null);
    $subjectsAssigned = array_key_exists('subjectsAssigned', $body) ? serializeUserArrayField($body['subjectsAssigned']) : serializeUserArrayField($existing['subjectsAssigned'] ?? null);

    $qualification = array_key_exists('qualification', $body)
        ? trim($body['qualification'])
        : (array_key_exists('qualifications', $body) ? trim($body['qualifications']) : ($existing['qualification'] ?? ($existing['qualifications'] ?? null)));

    // Dynamic field mapping based on existing users columns
    $existingCols = getTableColumns($db, 'users');
    $fieldMap = [
        'customId' => $customId,
        'indexNumber' => $indexNumber,
        'name' => $name,
        'monkName' => $monkName,
        'email' => $email,
        'phone' => $phone,
        'role' => $role,
        'nic' => $nic,
        'pirivenaClass' => $pirivenaClass,
        'classId' => $classId,
        'avatar' => $avatar,
        'guardianName' => $guardianName,
        'guardianPhone' => $guardianPhone,
        'guardianRelation' => $guardianRelation,
        'guardianAddress' => $guardianAddress,
        'templeName' => $templeName,
        'nicOrBirthCert' => $nicOrBirthCert,
        'educationCategory' => $educationCategory,
        'classLevel' => $classLevel,
        'academicYear' => $academicYear,
        'classTeacherId' => $classTeacherId,
        'monkStatus' => $monkStatus,
        'status' => $status,
        'classesAssigned' => $classesAssigned,
        'subjectsTaught' => $subjectsTaught,
        'categoriesTaught' => $categoriesTaught,
        'subjectsAssigned' => $subjectsAssigned,
        'qualification' => $qualification,
        'qualifications' => $qualification
    ];

    if (array_key_exists('password', $body) && !empty(trim($body['password']))) {
        $rawPass = trim($body['password']);
        $fieldMap['password'] = password_hash($rawPass, PASSWORD_DEFAULT);
        $fieldMap['plain_password'] = null;
    }

    $setClauses = [];
    $updateParams = ['target_id' => $actualDbId, 'alt_cid' => $customId];
    foreach ($fieldMap as $col => $val) {
        if (in_array($col, $existingCols)) {
            $setClauses[] = "`{$col}` = :val_{$col}";
            $updateParams["val_{$col}"] = $val;
        }
    }

    if (!empty($setClauses)) {
        try {
            $upSql = "UPDATE users SET " . implode(', ', $setClauses) . " WHERE id = :target_id OR customId = :target_id OR customId = :alt_cid OR indexNumber = :target_id";
            $upStmt = $db->prepare($upSql);
            $upStmt->execute($updateParams);
        } catch (Exception $eUp) {
            error_log("Users dynamic update warning: " . $eUp->getMessage());
        }
    }

    // Also update teachers or students tables if role matches
    if ($role === 'teacher') {
        try {
            $tCols = getTableColumns($db, 'teachers');
            $tSet = [];
            $tParams = ['tid' => $actualDbId, 'alt_cid' => $customId];
            $tFields = [
                'name' => $name, 'monkName' => $monkName, 'email' => $email, 'phone' => $phone,
                'customId' => $customId, 'nic' => $nic, 'qualifications' => $qualification,
                'classesAssigned' => $classesAssigned, 'subjectsTaught' => $subjectsTaught,
                'categoriesTaught' => $categoriesTaught, 'status' => $status, 'avatar' => $avatar
            ];
            if (!empty($rawPass)) {
                $tFields['password'] = password_hash($rawPass, PASSWORD_DEFAULT);
                $tFields['plain_password'] = null;
            }
            foreach ($tFields as $tc => $tv) {
                if (in_array($tc, $tCols)) {
                    $tSet[] = "`{$tc}` = :tval_{$tc}";
                    $tParams["tval_{$tc}"] = $tv;
                }
            }
            if (!empty($tSet)) {
                $tUp = $db->prepare("UPDATE teachers SET " . implode(', ', $tSet) . " WHERE id = :tid OR customId = :tid OR customId = :alt_cid");
                $tUp->execute($tParams);
            }
        } catch (Exception $eTUp) {}
    } elseif ($role === 'student') {
        try {
            $sCols = getTableColumns($db, 'students');
            $sSet = [];
            $sParams = ['sid1' => $actualDbId, 'sid2' => $customId, 'sid3' => $customId];
            $sFields = [
                'name' => $name,
                'monkName' => $monkName,
                'email' => $email,
                'phone' => $phone,
                'customId' => $customId,
                'indexNumber' => $indexNumber,
                'classId' => $classId,
                'pirivenaClass' => $pirivenaClass,
                'guardianName' => $guardianName,
                'guardianPhone' => $guardianPhone,
                'guardianRelation' => $guardianRelation,
                'guardianAddress' => $guardianAddress,
                'address' => $guardianAddress,
                'templeName' => $templeName,
                'nicOrBirthCert' => $nicOrBirthCert,
                'educationCategory' => $educationCategory,
                'classLevel' => $classLevel,
                'academicYear' => $academicYear,
                'classTeacherId' => $classTeacherId,
                'monkStatus' => $monkStatus,
                'enrolledSubjects' => $subjectsAssigned,
                'subjectsAssigned' => $subjectsAssigned,
                'status' => $status,
                'avatar' => $avatar
            ];
            if (!empty($rawPass)) {
                $sFields['password'] = password_hash($rawPass, PASSWORD_DEFAULT);
                $sFields['plain_password'] = null;
            }
            foreach ($sFields as $sc => $sv) {
                if (in_array($sc, $sCols)) {
                    $sSet[] = "`{$sc}` = :sval_{$sc}";
                    $sParams["sval_{$sc}"] = $sv;
                }
            }
            if (!empty($sSet)) {
                $sUp = $db->prepare("UPDATE students SET " . implode(', ', $sSet) . " WHERE id = :sid1 OR customId = :sid2 OR indexNumber = :sid3");
                $sUp->execute($sParams);
            }
        } catch (Exception $eSUp) {}
    }

    // Fetch and format updated user record
    $fetchStmt = $db->prepare("SELECT * FROM users WHERE id = :id1 OR customId = :id2 OR indexNumber = :id3 LIMIT 1");
    $fetchStmt->execute(['id1' => $actualDbId, 'id2' => $customId, 'id3' => $customId]);
    $updatedRow = $fetchStmt->fetch();
    if (!$updatedRow && !empty($existing)) {
        $updatedRow = array_merge($existing, $fieldMap, ['id' => $actualDbId]);
    }
    $updatedUser = formatUserRecord($updatedRow, $db);

    sendJsonResponse($updatedUser);
}

// 2d. DELETE User
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $userId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($_GET['id']) ? $_GET['id'] : null));

    if (!$userId) {
        sendJsonResponse(["error" => "User ID is required for deletion"], 400);
    }

    $cleanId = trim($userId);
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

    // Delete avatar physical file if exists
    try {
        $stmtSel = $db->prepare("SELECT avatar FROM users WHERE id IN ($inPlaceholders) OR customId IN ($inPlaceholders) LIMIT 1");
        $stmtSel->execute(array_merge($candidates, $candidates));
        $uRow = $stmtSel->fetch();
        if ($uRow && !empty($uRow['avatar'])) {
            deleteUploadedFile($uRow['avatar']);
        }
    } catch (Exception $e) {}

    // Clean up relational records
    try {
        $db->prepare("DELETE FROM teacher_assignments WHERE teacher_id IN ($inPlaceholders)")->execute($candidates);
        $db->prepare("DELETE FROM student_subjects WHERE student_id IN ($inPlaceholders)")->execute($candidates);
    } catch (Exception $e) {}

    // Delete from users table
    try {
        $stmt = $db->prepare("DELETE FROM users WHERE id IN ($inPlaceholders) OR customId IN ($inPlaceholders) OR indexNumber IN ($inPlaceholders) OR LOWER(TRIM(id)) IN ($inPlaceholders) OR LOWER(TRIM(customId)) IN ($inPlaceholders)");
        $stmt->execute($delParams);
    } catch (Exception $eDelU) {}

    // Delete from teachers and students tables
    try {
        $db->prepare("DELETE FROM teachers WHERE id IN ($inPlaceholders) OR customId IN ($inPlaceholders) OR LOWER(TRIM(id)) IN ($inPlaceholders) OR LOWER(TRIM(customId)) IN ($inPlaceholders)")->execute(array_merge($candidates, $candidates, $lowerCandidates, $lowerCandidates));
        $db->prepare("DELETE FROM students WHERE id IN ($inPlaceholders) OR customId IN ($inPlaceholders) OR indexNumber IN ($inPlaceholders) OR LOWER(TRIM(id)) IN ($inPlaceholders) OR LOWER(TRIM(customId)) IN ($inPlaceholders)")->execute($delParams);
    } catch (Exception $eT) {}

    sendJsonResponse(["success" => true, "id" => $userId]);
}

    sendJsonResponse(["error" => "Method not allowed"], 405);
} catch (Throwable $e) {
    error_log("Users API Exception: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
    sendJsonResponse([
        "success" => false,
        "error" => "Server Error: " . $e->getMessage(),
        "line" => $e->getLine()
    ], 500);
}
