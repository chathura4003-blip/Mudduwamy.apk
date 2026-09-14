<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'submissions.php' && $lastPart !== 'submissions' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

// Ensure table exists & has all columns
try {
    $db->exec("CREATE TABLE IF NOT EXISTS `exam_submissions` (
        `id` VARCHAR(100) NOT NULL,
        `examId` VARCHAR(100) NOT NULL,
        `studentId` VARCHAR(100) NOT NULL,
        `studentCustomId` VARCHAR(100) DEFAULT NULL,
        `studentName` VARCHAR(255) DEFAULT NULL,
        `studentMonkName` VARCHAR(255) DEFAULT NULL,
        `studentMonkStatus` VARCHAR(50) DEFAULT NULL,
        `studentAvatar` VARCHAR(500) DEFAULT NULL,
        `classId` VARCHAR(100) DEFAULT NULL,
        `answersJson` LONGTEXT DEFAULT NULL,
        `answers` LONGTEXT DEFAULT NULL,
        `marksObtained` FLOAT DEFAULT 0,
        `score` FLOAT DEFAULT NULL,
        `totalMarks` INT DEFAULT 100,
        `timeTaken` INT DEFAULT NULL,
        `teacherFeedback` TEXT DEFAULT NULL,
        `graded` TINYINT(1) DEFAULT 0,
        `status` VARCHAR(50) DEFAULT 'submitted',
        `submittedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_exam_student` (`examId`, `studentId`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    $cols = $db->query("SHOW COLUMNS FROM exam_submissions")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('studentCustomId', $cols)) { @$db->exec("ALTER TABLE exam_submissions ADD COLUMN studentCustomId VARCHAR(100) DEFAULT NULL"); }
    if (!in_array('studentMonkName', $cols)) { @$db->exec("ALTER TABLE exam_submissions ADD COLUMN studentMonkName VARCHAR(255) DEFAULT NULL"); }
    if (!in_array('studentMonkStatus', $cols)) { @$db->exec("ALTER TABLE exam_submissions ADD COLUMN studentMonkStatus VARCHAR(50) DEFAULT NULL"); }
    if (!in_array('studentAvatar', $cols)) { @$db->exec("ALTER TABLE exam_submissions ADD COLUMN studentAvatar VARCHAR(500) DEFAULT NULL"); }
    if (!in_array('classId', $cols)) { @$db->exec("ALTER TABLE exam_submissions ADD COLUMN classId VARCHAR(100) DEFAULT NULL"); }
    if (!in_array('teacherFeedback', $cols)) { @$db->exec("ALTER TABLE exam_submissions ADD COLUMN teacherFeedback TEXT DEFAULT NULL"); }
    if (!in_array('graded', $cols)) { @$db->exec("ALTER TABLE exam_submissions ADD COLUMN graded TINYINT(1) DEFAULT 0"); }
    if (!in_array('score', $cols)) { @$db->exec("ALTER TABLE exam_submissions ADD COLUMN score FLOAT DEFAULT NULL"); }
    if (!in_array('timeTaken', $cols)) { @$db->exec("ALTER TABLE exam_submissions ADD COLUMN timeTaken INT DEFAULT NULL"); }
} catch (Exception $e) {}

// 1. GET Submissions
if ($method === 'GET') {
    $authUser = getAuthUser();
    
    // 🛡️ Return empty array for unauthenticated callers cleanly (Zero data leakage & no 401 console error)
    if (!$authUser) {
        sendJsonResponse([], 200);
    }

    $isPrivileged = in_array(strtolower($authUser['role'] ?? ''), ['admin', 'superadmin', 'teacher']);

    $examId = $_GET['examId'] ?? null;
    $studentId = $_GET['studentId'] ?? null;
    $classId = $_GET['classId'] ?? null;

    // 🛡️ Privacy Guard: Non-teachers/Non-admins can ONLY view their own submissions
    if (!$isPrivileged) {
        $studentId = $authUser['id'] ?? ($authUser['customId'] ?? 'std-none');
    }

    try {
        if ($pathId) {
            $stmt = $db->prepare("SELECT * FROM exam_submissions WHERE id = :id LIMIT 1");
            $stmt->execute(['id' => $pathId]);
            $sub = $stmt->fetch();
            if ($sub) {
                // Check student ownership if not privileged
                if (!$isPrivileged && $sub['studentId'] !== $authUser['id'] && ($sub['studentCustomId'] ?? '') !== ($authUser['customId'] ?? '')) {
                    sendJsonResponse(["error" => "ඔබට වෙනත් සිසුන්ගේ විභාග පිළිතුරු බැලීමට අවසර නොමැත (Forbidden)."], 403);
                }

                $ans = [];
                if (!empty($sub['answersJson'])) {
                    $ans = json_decode($sub['answersJson'], true) ?: [];
                } else if (!empty($sub['answers'])) {
                    $ans = is_string($sub['answers']) ? (json_decode($sub['answers'], true) ?: []) : $sub['answers'];
                }
                $calcScore = $sub['score'] !== null ? floatval($sub['score']) : ($sub['marksObtained'] !== null ? floatval($sub['marksObtained']) : null);
                $sub['score'] = $calcScore;
                $sub['marksObtained'] = $calcScore;
                $sub['answers'] = $ans;
                $sub['answersJson'] = is_array($ans) ? json_encode($ans, JSON_UNESCAPED_UNICODE) : $ans;
                $sub['totalMarks'] = isset($sub['totalMarks']) ? intval($sub['totalMarks']) : 100;
                $sub['timeTaken'] = isset($sub['timeTaken']) && $sub['timeTaken'] !== null ? intval($sub['timeTaken']) : null;
                $sub['graded'] = !empty($sub['graded']) || ($sub['status'] ?? '') === 'graded';
                sendJsonResponse($sub);
            } else {
                sendJsonResponse(["error" => "Submission not found"], 404);
            }
        } else {
            $sql = "SELECT * FROM exam_submissions WHERE 1=1";
            $params = [];
            if ($examId) {
                $sql .= " AND examId = :examId";
                $params['examId'] = $examId;
            }
            if ($studentId) {
                $sql .= " AND (studentId = :studentId OR studentCustomId = :studentCustomId)";
                $params['studentId'] = $studentId;
                $params['studentCustomId'] = $studentId;
            }
            if ($classId && $classId !== 'all') {
                $sql .= " AND (classId = :classId OR examId IN (SELECT id FROM exams WHERE classId = :exClassId OR gradeClass = :exClassId2))";
                $params['classId'] = $classId;
                $params['exClassId'] = $classId;
                $params['exClassId2'] = $classId;
            }
            $sql .= " ORDER BY submittedAt DESC";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            foreach ($rows as &$r) {
                $ans = [];
                if (!empty($r['answersJson'])) {
                    $ans = json_decode($r['answersJson'], true) ?: [];
                } else if (!empty($r['answers'])) {
                    $ans = is_string($r['answers']) ? (json_decode($r['answers'], true) ?: []) : $r['answers'];
                }
                $calcScore = $r['score'] !== null ? floatval($r['score']) : ($r['marksObtained'] !== null ? floatval($r['marksObtained']) : null);
                $r['score'] = $calcScore;
                $r['marksObtained'] = $calcScore;
                $r['answers'] = $ans;
                $r['answersJson'] = is_array($ans) ? json_encode($ans, JSON_UNESCAPED_UNICODE) : $ans;
                $r['totalMarks'] = isset($r['totalMarks']) ? intval($r['totalMarks']) : 100;
                $r['timeTaken'] = isset($r['timeTaken']) && $r['timeTaken'] !== null ? intval($r['timeTaken']) : null;
                $r['graded'] = !empty($r['graded']) || ($r['status'] ?? '') === 'graded';
            }
            unset($r);

            sendJsonResponse($rows ?: []);
        }
    } catch (Throwable $e) {
        sendJsonResponse([], 200);
    }
}


// 2. POST Exam Submission
if ($method === 'POST') {
    $body = getRequestBody();
    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : 'sub-' . time() . '-' . rand(100, 999);
    $examId = trim($body['examId'] ?? $pathId ?? '');
    $studentId = trim($body['studentId'] ?? 'std-guest');
    $studentCustomId = trim($body['studentCustomId'] ?? '');
    $studentName = trim($body['studentName'] ?? 'සාමණේර ශිෂ්‍ය');
    $studentMonkName = trim($body['studentMonkName'] ?? '');
    $studentMonkStatus = trim($body['studentMonkStatus'] ?? 'lay');
    $studentAvatar = trim($body['studentAvatar'] ?? '');
    $classId = trim($body['classId'] ?? '');
    $teacherFeedback = $body['teacherFeedback'] ?? null;
    $answers = $body['answers'] ?? [];
    $answersJson = is_array($answers) ? json_encode($answers, JSON_UNESCAPED_UNICODE) : strval($answers);
    $score = isset($body['score']) ? floatval($body['score']) : (isset($body['marksObtained']) ? floatval($body['marksObtained']) : 0);
    $totalMarks = intval($body['totalMarks'] ?? 100);
    $timeTaken = isset($body['timeTaken']) ? intval($body['timeTaken']) : null;
    $status = trim($body['status'] ?? 'submitted');
    $graded = !empty($body['graded']) ? 1 : ($status === 'graded' ? 1 : 0);

    if (empty($examId)) {
        sendJsonResponse(["error" => "Exam ID is required"], 400);
    }

    try {
        $stmt = $db->prepare("INSERT INTO exam_submissions (id, examId, studentId, studentCustomId, studentName, studentMonkName, studentMonkStatus, studentAvatar, classId, answersJson, answers, marksObtained, score, totalMarks, timeTaken, status, graded, teacherFeedback)
            VALUES (:id, :examId, :studentId, :studentCustomId, :studentName, :studentMonkName, :studentMonkStatus, :studentAvatar, :classId, :answersJson, :answers, :marksObtained, :score, :totalMarks, :timeTaken, :status, :graded, :teacherFeedback)
            ON DUPLICATE KEY UPDATE answersJson = VALUES(answersJson), answers = VALUES(answers), marksObtained = VALUES(marksObtained), score = VALUES(score), status = VALUES(status), graded = VALUES(graded), teacherFeedback = COALESCE(VALUES(teacherFeedback), teacherFeedback)");

        $stmt->execute([
            'id' => $id,
            'examId' => $examId,
            'studentId' => $studentId,
            'studentCustomId' => $studentCustomId,
            'studentName' => $studentName,
            'studentMonkName' => $studentMonkName,
            'studentMonkStatus' => $studentMonkStatus,
            'studentAvatar' => $studentAvatar,
            'classId' => $classId,
            'answersJson' => $answersJson,
            'answers' => $answersJson,
            'marksObtained' => $score,
            'score' => $score,
            'totalMarks' => $totalMarks,
            'timeTaken' => $timeTaken,
            'status' => $status,
            'graded' => $graded,
            'teacherFeedback' => $teacherFeedback
        ]);
    } catch (Exception $e) {
        $stmt = $db->prepare("INSERT INTO exam_submissions (id, examId, studentId, studentName, answersJson, marksObtained, totalMarks, status)
            VALUES (:id, :examId, :studentId, :studentName, :answersJson, :marksObtained, :totalMarks, :status)
            ON DUPLICATE KEY UPDATE answersJson = VALUES(answersJson), marksObtained = VALUES(marksObtained), status = VALUES(status)");
        $stmt->execute([
            'id' => $id,
            'examId' => $examId,
            'studentId' => $studentId,
            'studentName' => $studentName,
            'answersJson' => $answersJson,
            'marksObtained' => $score,
            'totalMarks' => $totalMarks,
            'status' => $status
        ]);
    }

    $submission = [
        "id" => $id,
        "examId" => $examId,
        "studentId" => $studentId,
        "studentCustomId" => $studentCustomId,
        "studentName" => $studentName,
        "studentMonkName" => $studentMonkName,
        "studentMonkStatus" => $studentMonkStatus,
        "studentAvatar" => $studentAvatar,
        "classId" => $classId,
        "answers" => $answers,
        "marksObtained" => $score,
        "score" => $score,
        "totalMarks" => $totalMarks,
        "timeTaken" => $timeTaken,
        "teacherFeedback" => $teacherFeedback,
        "status" => $status,
        "graded" => (bool)$graded,
        "submittedAt" => date('Y-m-d H:i:s')
    ];

    sendJsonResponse(["success" => true, "submission" => $submission], 201);
}

// 3. PUT Grade / Update Submission
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['teacher', 'admin', 'superadmin']);
    $body = getRequestBody();
    $subId = $pathId ?: ($body['id'] ?? null);

    if (!$subId) {
        sendJsonResponse(["error" => "Submission ID is required"], 400);
    }

    $marksObtained = isset($body['score']) ? floatval($body['score']) : (isset($body['marksObtained']) ? floatval($body['marksObtained']) : null);
    $status = isset($body['status']) ? trim($body['status']) : 'graded';
    $graded = !empty($body['graded']) ? 1 : ($status === 'graded' ? 1 : 0);
    $teacherFeedback = $body['teacherFeedback'] ?? null;

    $updateCols = [];
    $params = ['id' => $subId];

    if ($marksObtained !== null) {
        $updateCols[] = "marksObtained = :m";
        $updateCols[] = "score = :score";
        $params['m'] = $marksObtained;
        $params['score'] = $marksObtained;
    }
    if ($status) {
        $updateCols[] = "status = :st";
        $params['st'] = $status;
    }
    $updateCols[] = "graded = :graded";
    $params['graded'] = $graded;

    if ($teacherFeedback !== null) {
        $updateCols[] = "teacherFeedback = :tf";
        $params['tf'] = $teacherFeedback;
    }

    $setSql = implode(', ', $updateCols);
    $stmt = $db->prepare("UPDATE exam_submissions SET $setSql WHERE id = :id");
    $stmt->execute($params);

    $stmtGet = $db->prepare("SELECT * FROM exam_submissions WHERE id = :id LIMIT 1");
    $stmtGet->execute(['id' => $subId]);
    $updated = $stmtGet->fetch();
    if ($updated) {
        $updated['answers'] = json_decode($updated['answersJson'] ?? '[]', true);
    }

    sendJsonResponse(["success" => true, "message" => "Submission updated successfully", "submission" => $updated]);
}

// 4. DELETE Submission
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $subId = $pathId ?: ($_GET['id'] ?? null);

    if (!$subId) {
        sendJsonResponse(["error" => "Submission ID is required"], 400);
    }

    $stmt = $db->prepare("DELETE FROM exam_submissions WHERE id = :id");
    $stmt->execute(['id' => $subId]);

    sendJsonResponse(["success" => true, "id" => $subId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);

