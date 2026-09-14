<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendJsonResponse(["error" => "Method not allowed"], 405);
}

$authUser = getAuthUser();
$isAdmin = $authUser && in_array(strtolower($authUser['role'] ?? ''), ['admin', 'superadmin']);
$isTeacher = $authUser && (strtolower($authUser['role'] ?? '') === 'teacher');
$isAuth = !empty($authUser);

$q = isset($_GET['q']) ? trim($_GET['q']) : (isset($_GET['query']) ? trim($_GET['query']) : (isset($_GET['search']) ? trim($_GET['search']) : ''));
$type = isset($_GET['type']) ? strtolower(trim($_GET['type'])) : 'all';
$page = max(1, isset($_GET['page']) ? intval($_GET['page']) : 1);
$limit = max(5, min(100, isset($_GET['limit']) ? intval($_GET['limit']) : 20));
$offset = ($page - 1) * $limit;

$results = [];
$totalCount = 0;

$searchPattern = '%' . $q . '%';

if (empty($q)) {
    // If empty query, return top recent items
    $searchPattern = '%';
}

// 1. Search Students (Available only to logged in students, teachers, admins)
if (($type === 'all' || $type === 'students') && $isAuth) {
    try {
        $stmt = $db->prepare("SELECT id, name, fullName, monkName, grade, customId, indexNumber, attendanceRate, 'student' as itemType 
            FROM students 
            WHERE name LIKE :q OR fullName LIKE :q OR monkName LIKE :q OR customId LIKE :q OR indexNumber LIKE :q OR grade LIKE :q
            LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':q', $searchPattern, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $studentRows = $stmt->fetchAll();
        foreach ($studentRows as $s) {
            $results[] = [
                'id' => $s['id'],
                'type' => 'student',
                'title' => !empty($s['fullName']) ? $s['fullName'] : (!empty($s['name']) ? $s['name'] : ($s['monkName'] ?? 'ශිෂ්‍යයා')),
                'subtitle' => "ශ්‍රේණිය: " . ($s['grade'] ?? 'ප්‍රාරම්භ') . " | ID: " . ($s['customId'] ?? $s['id']),
                'category' => 'සිසුන් (Students)',
                'badge' => $s['grade'] ?? 'Student',
                'data' => $s
            ];
        }
    } catch (Exception $e) {}
}

// 2. Search Teachers
if ($type === 'all' || $type === 'teachers') {
    try {
        $stmt = $db->prepare("SELECT id, name, monkName, specialization, registrationNumber, email, phone, 'teacher' as itemType 
            FROM teachers 
            WHERE name LIKE :q OR monkName LIKE :q OR specialization LIKE :q OR registrationNumber LIKE :q OR email LIKE :q
            LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':q', $searchPattern, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $teacherRows = $stmt->fetchAll();
        foreach ($teacherRows as $t) {
            // Mask phone for non-admins
            if (!$isAdmin && !empty($t['phone']) && strlen($t['phone']) >= 7) {
                $t['phone'] = substr($t['phone'], 0, 3) . '****' . substr($t['phone'], -3);
            }

            $results[] = [
                'id' => $t['id'],
                'type' => 'teacher',
                'title' => !empty($t['name']) ? $t['name'] : ($t['monkName'] ?? 'ගුරුභවතා'),
                'subtitle' => "විශේෂඥතාව: " . ($t['specialization'] ?? 'ධර්මය හා විනය') . " | " . ($t['registrationNumber'] ?? ''),
                'category' => 'ගුරු මණ්ඩලය (Faculty)',
                'badge' => $t['specialization'] ?? 'Teacher',
                'data' => $t
            ];
        }
    } catch (Exception $e) {}
}

// 3. Search Classes
if ($type === 'all' || $type === 'classes') {
    try {
        $stmt = $db->prepare("SELECT id, className, classNameSinhala, gradeLevel, roomNumber, classTeacher, 'class' as itemType 
            FROM classes 
            WHERE className LIKE :q OR classNameSinhala LIKE :q OR gradeLevel LIKE :q OR roomNumber LIKE :q
            LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':q', $searchPattern, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $classRows = $stmt->fetchAll();
        foreach ($classRows as $c) {
            $results[] = [
                'id' => $c['id'],
                'type' => 'class',
                'title' => !empty($c['classNameSinhala']) ? $c['classNameSinhala'] : $c['className'],
                'subtitle' => "ශ්‍රේණිය: " . ($c['gradeLevel'] ?? '') . " | ශාලාව: " . ($c['roomNumber'] ?? 'දේශන ශාලාව 01'),
                'category' => 'පිරිවෙන් පන්ති (Classes)',
                'badge' => $c['gradeLevel'] ?? 'Class',
                'data' => $c
            ];
        }
    } catch (Exception $e) {}
}

// 4. Search Subjects
if ($type === 'all' || $type === 'subjects') {
    try {
        $stmt = $db->prepare("SELECT id, name, subjectNameSinhala, code, category, 'subject' as itemType 
            FROM subjects 
            WHERE name LIKE :q OR subjectNameSinhala LIKE :q OR code LIKE :q OR category LIKE :q
            LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':q', $searchPattern, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $subjectRows = $stmt->fetchAll();
        foreach ($subjectRows as $sub) {
            $results[] = [
                'id' => $sub['id'],
                'type' => 'subject',
                'title' => !empty($sub['subjectNameSinhala']) ? $sub['subjectNameSinhala'] : $sub['name'],
                'subtitle' => "කේතය: " . ($sub['code'] ?? '') . " | කාණ්ඩය: " . ($sub['category'] ?? 'ධර්මය'),
                'category' => 'විෂයයන් (Subjects)',
                'badge' => $sub['code'] ?? 'Subject',
                'data' => $sub
            ];
        }
    } catch (Exception $e) {}
}

// 5. Search Study Materials
if ($type === 'all' || $type === 'materials') {
    try {
        $stmt = $db->prepare("SELECT id, title, titleSinhala, subject, subjectId, gradeClass, classId, type, fileUrl, 'material' as itemType 
            FROM study_materials 
            WHERE title LIKE :q OR titleSinhala LIKE :q OR subject LIKE :q OR description LIKE :q
            LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':q', $searchPattern, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $matRows = $stmt->fetchAll();
        foreach ($matRows as $m) {
            $results[] = [
                'id' => $m['id'],
                'type' => 'material',
                'title' => !empty($m['titleSinhala']) ? $m['titleSinhala'] : $m['title'],
                'subtitle' => "විෂය: " . ($m['subject'] ?? 'සියලු විෂයයන්') . " | ආකෘතිය: " . strtoupper($m['type'] ?? 'PDF'),
                'category' => 'ඉගෙනුම් ද්‍රව්‍ය (Materials)',
                'badge' => strtoupper($m['type'] ?? 'PDF'),
                'data' => $m
            ];
        }
    } catch (Exception $e) {}
}

// 6. Search Exams
if ($type === 'all' || $type === 'exams') {
    try {
        $stmt = $db->prepare("SELECT id, title, subject, grade, date, durationMinutes, totalMarks, 'exam' as itemType 
            FROM exams 
            WHERE title LIKE :q OR subject LIKE :q OR grade LIKE :q
            LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':q', $searchPattern, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $examRows = $stmt->fetchAll();
        foreach ($examRows as $ex) {
            $results[] = [
                'id' => $ex['id'],
                'type' => 'exam',
                'title' => $ex['title'],
                'subtitle' => "විෂය: " . ($ex['subject'] ?? '') . " | දිනය: " . ($ex['date'] ?? '') . " | ලකුණු: " . ($ex['totalMarks'] ?? 100),
                'category' => 'විභාග සහ පරීක්ෂණ (Exams)',
                'badge' => ($ex['durationMinutes'] ?? 60) . ' mins',
                'data' => $ex
            ];
        }
    } catch (Exception $e) {}
}

// 7. Search Broadcast Notifications
if ($type === 'all' || $type === 'notifications' || $type === 'notices') {
    try {
        $stmt = $db->prepare("SELECT id, title, titleSinhala, message, messageSinhala, severity, targetRole, created_at, 'notice' as itemType 
            FROM broadcast_notices 
            WHERE title LIKE :q OR titleSinhala LIKE :q OR message LIKE :q OR messageSinhala LIKE :q
            LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':q', $searchPattern, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $noticeRows = $stmt->fetchAll();
        foreach ($noticeRows as $n) {
            $results[] = [
                'id' => $n['id'],
                'type' => 'notice',
                'title' => !empty($n['titleSinhala']) ? $n['titleSinhala'] : $n['title'],
                'subtitle' => !empty($n['messageSinhala']) ? mb_substr($n['messageSinhala'], 0, 80) : mb_substr($n['message'], 0, 80),
                'category' => 'පිරිවෙන් නිවේදන (Notices)',
                'badge' => strtoupper($n['severity'] ?? 'INFO'),
                'data' => $n
            ];
        }
    } catch (Exception $e) {}
}

$totalResultsCount = count($results);

sendJsonResponse([
    'success' => true,
    'query' => $q,
    'type' => $type,
    'page' => $page,
    'limit' => $limit,
    'total' => $totalResultsCount,
    'hasMore' => $totalResultsCount >= $limit,
    'results' => $results
]);
