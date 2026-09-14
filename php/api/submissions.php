<?php
/**
 * Sri Sumana Maha Pirivena ERP — Exam Submissions API
 * Standardized RBAC: Teacher Assignment Enforcement & Student Ownership Protection
 */
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

// 1. GET Submissions
if ($method === 'GET') {
    $authUser = getAuthUser();
    
    // Unauthenticated callers receive an empty array cleanly
    if (!$authUser) {
        sendJsonResponse([], 200);
    }

    $role = strtolower(trim($authUser['role'] ?? ''));
    $isAdmin = in_array($role, ['admin', 'superadmin']);
    $isTeacher = ($role === 'teacher');
    $isStudent = ($role === 'student');

    $examId = $_GET['examId'] ?? null;
    $studentId = $_GET['studentId'] ?? null;
    $classId = $_GET['classId'] ?? null;

    try {
        if ($pathId) {
            $stmt = $db->prepare("SELECT es.*, e.classId as examClassId, e.gradeClass, e.subject, e.subjectId as examSubjectId 
                FROM exam_submissions es 
                LEFT JOIN exams e ON es.examId = e.id 
                WHERE es.id = :id LIMIT 1");
            $stmt->execute(['id' => $pathId]);
            $sub = $stmt->fetch();

            if (!$sub) {
                sendApiError("Submission not found", "NOT_FOUND", 404);
            }

            // 🛡️ Student Ownership Check: Students can ONLY view their own submissions
            if ($isStudent) {
                requireStudentOwnership($authUser, $sub['studentId']);
            }

            // 🛡️ Teacher Assignment Check: Teachers can ONLY view submissions in their assigned classes/subjects
            if ($isTeacher) {
                $targetClass = $sub['examClassId'] ?? ($sub['gradeClass'] ?? ($sub['classId'] ?? ''));
                $targetSubj = $sub['examSubjectId'] ?? ($sub['subject'] ?? '');
                requireTeacherAssignment($authUser, $targetClass, $targetSubj, $db);
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
            // List Submissions with strict RBAC filtering
            $sql = "SELECT es.* FROM exam_submissions es LEFT JOIN exams e ON es.examId = e.id WHERE 1=1";
            $params = [];

            // 🛡️ Student Isolation: Students can strictly query only their own records
            if ($isStudent) {
                $myId = $authUser['id'];
                $myCustomId = $authUser['customId'] ?? $myId;
                $sql .= " AND (es.studentId = :mySid OR es.studentCustomId = :myScid)";
                $params['mySid'] = $myId;
                $params['myScid'] = $myCustomId;
            } elseif ($isTeacher) {
                // 🛡️ Teacher Isolation: Teachers can strictly query submissions for their assigned classes & subjects
                $tId = $authUser['id'] ?? ($authUser['customId'] ?? '');
                $asgnStmt = $db->prepare("SELECT class_id as classId, subject_id as subjectId FROM teacher_assignments WHERE teacher_id = :t1 OR teacher_id = :t2");
                $asgnStmt->execute([':t1' => $tId, ':t2' => $tId]);
                $assignments = $asgnStmt->fetchAll();

                if (empty($assignments)) {
                    // Fallback to teacher's classesAssigned/subjectsTaught in users table
                    $uClasses = normalizeUserArrayField($authUser['classesAssigned'] ?? null);
                    $uSubjects = normalizeUserArrayField($authUser['subjectsTaught'] ?? null);
                    if (!empty($uClasses)) {
                        $clsIn = implode("','", array_map('addslashes', $uClasses));
                        $sql .= " AND (es.classId IN ('$clsIn') OR e.classId IN ('$clsIn') OR e.gradeClass IN ('$clsIn'))";
                    } else {
                        // No assignments at all -> return empty list
                        sendJsonResponse([]);
                    }
                } else {
                    $orClauses = [];
                    $idx = 0;
                    foreach ($assignments as $asgn) {
                        $c = trim($asgn['classId'] ?? '');
                        $s = trim($asgn['subjectId'] ?? '');
                        if (!empty($c)) {
                            $pC = ":tc_" . $idx;
                            $pS = ":ts_" . $idx;
                            $idx++;
                            $params[$pC] = $c;
                            if (!empty($s) && strtolower($s) !== 'all') {
                                $params[$pS] = $s;
                                $orClauses[] = "((es.classId = $pC OR e.classId = $pC OR e.gradeClass = $pC) AND (e.subjectId = $pS OR e.subject = $pS))";
                            } else {
                                $orClauses[] = "(es.classId = $pC OR e.classId = $pC OR e.gradeClass = $pC)";
                            }
                        }
                    }
                    if (!empty($orClauses)) {
                        $sql .= " AND (" . implode(" OR ", $orClauses) . ")";
                    } else {
                        sendJsonResponse([]);
                    }
                }
            }

            if ($examId) {
                $sql .= " AND es.examId = :examId";
                $params['examId'] = $examId;
            }
            if ($studentId && $isAdmin) {
                $sql .= " AND (es.studentId = :studentId OR es.studentCustomId = :studentCustomId)";
                $params['studentId'] = $studentId;
                $params['studentCustomId'] = $studentId;
            }
            if ($classId && $classId !== 'all') {
                $sql .= " AND (es.classId = :classId OR e.classId = :exClassId OR e.gradeClass = :exClassId2)";
                $params['classId'] = $classId;
                $params['exClassId'] = $classId;
                $params['exClassId2'] = $classId;
            }

            $sql .= " ORDER BY es.submittedAt DESC";

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
        error_log("Submissions GET error: " . $e->getMessage());
        sendJsonResponse([], 200);
    }
}

// 2. POST Exam Submission (Students submitting completed exam)
if ($method === 'POST') {
    $authUser = requireAuth();
    $body = getRequestBody();

    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : ('sub-' . time() . '-' . rand(1000, 9999));
    $examId = trim($body['examId'] ?? ($pathId ?? ''));

    if (empty($examId)) {
        sendApiError("Exam ID is required", "VALIDATION_ERROR", 400);
    }

    // 🛡️ Student Ownership Rule: Always bind authenticated student's real identity
    if (strtolower($authUser['role'] ?? '') === 'student') {
        $studentId = $authUser['id'];
        $studentCustomId = $authUser['customId'] ?? $authUser['indexNumber'] ?? $studentId;
        $studentName = $authUser['name'];
        $studentMonkName = $authUser['monkName'] ?? '';
        $studentMonkStatus = $authUser['monkStatus'] ?? 'lay';
        $studentAvatar = $authUser['avatar'] ?? '';
        $classId = $authUser['classId'] ?? ($authUser['pirivenaClass'] ?? ($body['classId'] ?? ''));
    } else {
        // Admin or Teacher testing a submission
        $studentId = trim($body['studentId'] ?? $authUser['id']);
        $studentCustomId = trim($body['studentCustomId'] ?? ($authUser['customId'] ?? $studentId));
        $studentName = trim($body['studentName'] ?? $authUser['name']);
        $studentMonkName = trim($body['studentMonkName'] ?? '');
        $studentMonkStatus = trim($body['studentMonkStatus'] ?? 'lay');
        $studentAvatar = trim($body['studentAvatar'] ?? '');
        $classId = trim($body['classId'] ?? '');
    }

    $teacherFeedback = $body['teacherFeedback'] ?? null;
    $answers = $body['answers'] ?? [];
    $answersJson = is_array($answers) ? json_encode($answers, JSON_UNESCAPED_UNICODE) : strval($answers);
    $score = isset($body['score']) ? floatval($body['score']) : (isset($body['marksObtained']) ? floatval($body['marksObtained']) : 0);
    $totalMarks = intval($body['totalMarks'] ?? 100);
    $timeTaken = isset($body['timeTaken']) ? intval($body['timeTaken']) : null;
    $status = trim($body['status'] ?? 'submitted');
    $graded = !empty($body['graded']) ? 1 : ($status === 'graded' ? 1 : 0);

    try {
        $stmt = $db->prepare("INSERT INTO exam_submissions (
            id, examId, studentId, studentCustomId, studentName, studentMonkName, studentMonkStatus, 
            studentAvatar, classId, answersJson, answers, marksObtained, score, totalMarks, timeTaken, 
            status, graded, teacherFeedback, submittedAt
        ) VALUES (
            :id, :examId, :studentId, :studentCustomId, :studentName, :studentMonkName, :studentMonkStatus, 
            :studentAvatar, :classId, :answersJson, :answers, :marksObtained, :score, :totalMarks, :timeTaken, 
            :status, :graded, :teacherFeedback, NOW()
        ) ON DUPLICATE KEY UPDATE 
            answersJson = VALUES(answersJson), 
            answers = VALUES(answers), 
            marksObtained = VALUES(marksObtained), 
            score = VALUES(score), 
            status = VALUES(status), 
            graded = VALUES(graded), 
            teacherFeedback = COALESCE(VALUES(teacherFeedback), teacherFeedback)");

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

        sendApiSuccess(["submission" => $submission], "Exam submitted successfully", 201);
    } catch (Exception $e) {
        error_log("Failed to insert exam submission: " . $e->getMessage());
        sendApiError("Failed to save exam submission: " . $e->getMessage(), 500);
    }
}

// 3. PUT Grade / Update Submission
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['teacher', 'admin', 'superadmin']);
    $body = getRequestBody();
    $subId = $pathId ?: ($body['id'] ?? null);

    if (!$subId) {
        sendApiError("Submission ID is required", "VALIDATION_ERROR", 400);
    }

    // 🛡️ Teacher Assignment Enforcement: Teachers can ONLY grade submissions for their assigned classes & subjects
    if (strtolower($authUser['role'] ?? '') === 'teacher') {
        $stmtSub = $db->prepare("SELECT es.*, e.classId as examClassId, e.gradeClass, e.subject, e.subjectId as examSubjectId 
            FROM exam_submissions es 
            JOIN exams e ON es.examId = e.id 
            WHERE es.id = :id LIMIT 1");
        $stmtSub->execute(['id' => $subId]);
        $subRecord = $stmtSub->fetch();

        if (!$subRecord) {
            sendApiError("Submission not found", "NOT_FOUND", 404);
        }

        $targetClass = $subRecord['examClassId'] ?? ($subRecord['gradeClass'] ?? ($subRecord['classId'] ?? ''));
        $targetSubj = $subRecord['examSubjectId'] ?? ($subRecord['subject'] ?? '');

        requireTeacherAssignment($authUser, $targetClass, $targetSubj, $db);
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

    sendApiSuccess(["submission" => $updated], "Submission graded successfully");
}

// 4. DELETE Submission
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $subId = $pathId ?: ($_GET['id'] ?? null);

    if (!$subId) {
        sendApiError("Submission ID is required", "VALIDATION_ERROR", 400);
    }

    $stmt = $db->prepare("DELETE FROM exam_submissions WHERE id = :id");
    $stmt->execute(['id' => $subId]);

    sendApiSuccess(["id" => $subId], "Submission deleted successfully");
}

sendApiError("Method not allowed", "METHOD_NOT_ALLOWED", 405);
