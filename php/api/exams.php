<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));

// Possible URL patterns:
// /api/exams                  → list/create
// /api/exams/{id}             → single exam CRUD
// /api/exams/{id}/submit      → exam submission
// /api/exams/{id}/monitoring  → exam monitoring

$pathId = null;
$subAction = null;

$examsIdx = array_search('exams', $parts);
if ($examsIdx !== false) {
    $afterExams = array_slice($parts, $examsIdx + 1);
    if (count($afterExams) >= 1 && !empty($afterExams[0])) {
        $pathId = urldecode($afterExams[0]);
    }
    if (count($afterExams) >= 2 && !empty($afterExams[1])) {
        $subAction = $afterExams[1]; // 'submit' or 'monitoring'
    }
}

// Database schema managed cleanly by php/migrations/

function formatExamItem($exam) {
    if (!$exam) return null;

    if (isset($exam['questionsJson']) && is_string($exam['questionsJson']) && !empty($exam['questionsJson'])) {
        $exam['questions'] = json_decode($exam['questionsJson'], true) ?: [];
    } else if (isset($exam['questions']) && is_string($exam['questions']) && !empty($exam['questions'])) {
        $exam['questions'] = json_decode($exam['questions'], true) ?: [];
    } else if (!isset($exam['questions']) || !is_array($exam['questions'])) {
        $exam['questions'] = [];
    }

    if (array_key_exists('published', $exam) && $exam['published'] !== null) {
        $pubVal = $exam['published'];
        $exam['published'] = ($pubVal === true || $pubVal === 1 || $pubVal === '1' || $pubVal === 'true');
    } else {
        $statusStr = strtolower($exam['status'] ?? '');
        $exam['published'] = ($statusStr === 'published' || $statusStr === 'active');
    }

    // Bidirectional sync for class identifiers
    $resolvedClassId = !empty($exam['classId']) ? trim($exam['classId']) : (!empty($exam['gradeClass']) ? trim($exam['gradeClass']) : 'All');
    $exam['classId'] = $resolvedClassId;
    $exam['gradeClass'] = $resolvedClassId;

    // Bidirectional sync for subject identifiers
    $resolvedSubjId = !empty($exam['subjectId']) ? trim($exam['subjectId']) : (!empty($exam['subject']) ? trim($exam['subject']) : 'General');
    $exam['subjectId'] = $resolvedSubjId;
    $exam['subject'] = $resolvedSubjId;

    // Duration mapping
    if (!isset($exam['durationMinutes']) && isset($exam['duration'])) {
        $exam['durationMinutes'] = intval($exam['duration']);
    } else if (!isset($exam['duration']) && isset($exam['durationMinutes'])) {
        $exam['duration'] = intval($exam['durationMinutes']);
    }
    if (!isset($exam['durationMinutes'])) {
        $exam['durationMinutes'] = 60;
    }

    // Passing marks mapping
    if (!isset($exam['passingMarks']) && isset($exam['passMark'])) {
        $exam['passingMarks'] = intval($exam['passMark']);
    } else if (!isset($exam['passMark']) && isset($exam['passingMarks'])) {
        $exam['passMark'] = intval($exam['passingMarks']);
    }
    if (!isset($exam['passingMarks'])) {
        $exam['passingMarks'] = 40;
    }

    if (!isset($exam['totalMarks'])) {
        $exam['totalMarks'] = 100;
    } else {
        $exam['totalMarks'] = intval($exam['totalMarks']);
    }

    if (!isset($exam['attemptsAllowed'])) {
        $exam['attemptsAllowed'] = 2;
    } else {
        $exam['attemptsAllowed'] = intval($exam['attemptsAllowed']);
    }

    return $exam;
}

// 1. GET Exams
if ($method === 'GET' && !$subAction) {
    $authUser = getAuthUser();
    $paramClassId = $_GET['classId'] ?? $_GET['gradeClass'] ?? null;
    $paramSubjectId = $_GET['subjectId'] ?? $_GET['subject'] ?? null;

    if ($pathId) {
        $stmt = $db->prepare("SELECT * FROM exams WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $pathId]);
        $exam = $stmt->fetch();
        if ($exam) {
            // 🛡️ Teacher Assignment Guard: Teachers can only view exams in assigned classes/subjects
            if ($authUser && strtolower($authUser['role'] ?? '') === 'teacher') {
                $exClass = $exam['classId'] ?? ($exam['gradeClass'] ?? '');
                $exSubj = $exam['subjectId'] ?? ($exam['subject'] ?? '');
                requireTeacherAssignment($authUser, $exClass, $exSubj, $db);
            }
            sendJsonResponse(formatExamItem($exam));
        } else {
            sendApiError("Exam not found", "NOT_FOUND", 404);
        }
    } else {
        $stmt = $db->query("SELECT * FROM exams ORDER BY created_at DESC");
        $exams = $stmt->fetchAll();
        $formatted = array_map('formatExamItem', $exams);

        // Fetch classes & subjects maps for flexible ID/code/name matching
        $classesMap = [];
        try {
            $cRows = $db->query("SELECT id, code, name, nameSinhala, className, classNameSinhala, gradeLevel FROM classes")->fetchAll();
            foreach ($cRows as $cr) {
                $allIdentifiers = array_unique(array_filter([
                    $cr['id'] ?? '',
                    $cr['code'] ?? '',
                    $cr['name'] ?? '',
                    $cr['nameSinhala'] ?? '',
                    $cr['className'] ?? '',
                    $cr['classNameSinhala'] ?? '',
                    $cr['gradeLevel'] ?? ''
                ]));
                foreach ($allIdentifiers as $ident) {
                    $normKey = strtolower(trim($ident));
                    if (!isset($classesMap[$normKey])) $classesMap[$normKey] = [];
                    $classesMap[$normKey] = array_unique(array_merge($classesMap[$normKey], $allIdentifiers));
                }
            }
        } catch (Exception $e) {}

        $subjectsMap = [];
        try {
            $sRows = $db->query("SELECT id, code, subjectCode, name, nameSinhala, subjectName, subjectNameSinhala FROM subjects")->fetchAll();
            foreach ($sRows as $sr) {
                $allIdentifiers = array_unique(array_filter([
                    $sr['id'] ?? '',
                    $sr['code'] ?? '',
                    $sr['subjectCode'] ?? '',
                    $sr['name'] ?? '',
                    $sr['nameSinhala'] ?? '',
                    $sr['subjectName'] ?? '',
                    $sr['subjectNameSinhala'] ?? ''
                ]));
                foreach ($allIdentifiers as $ident) {
                    $normKey = strtolower(trim($ident));
                    if (!isset($subjectsMap[$normKey])) $subjectsMap[$normKey] = [];
                    $subjectsMap[$normKey] = array_unique(array_merge($subjectsMap[$normKey], $allIdentifiers));
                }
            }
        } catch (Exception $e) {}

        $matchClass = function($examVal, $targetClassId) use ($classesMap) {
            if (!$examVal || !$targetClassId) return true;
            $itemNorm = strtolower(trim($examVal));
            $targetNorm = strtolower(trim($targetClassId));

            if (in_array($itemNorm, ['all', 'all classes', 'සියලු', 'සියලු පන්ති', 'general', ''])) return true;
            if (in_array($targetNorm, ['all', 'all classes', 'සියලු', 'සියලු පන්ති', 'general', ''])) return true;
            if ($itemNorm === $targetNorm) return true;

            if (isset($classesMap[$targetNorm])) {
                foreach ($classesMap[$targetNorm] as $identifier) {
                    $idNorm = strtolower(trim($identifier));
                    if ($itemNorm === $idNorm || strpos($itemNorm, $idNorm) !== false || strpos($idNorm, $itemNorm) !== false) {
                        return true;
                    }
                }
            }

            if (isset($classesMap[$itemNorm])) {
                foreach ($classesMap[$itemNorm] as $identifier) {
                    $idNorm = strtolower(trim($identifier));
                    if ($targetNorm === $idNorm || strpos($targetNorm, $idNorm) !== false || strpos($idNorm, $targetNorm) !== false) {
                        return true;
                    }
                }
            }
            return false;
        };

        $matchSubject = function($examVal, $targetSubjectId) use ($subjectsMap) {
            if (!$examVal || !$targetSubjectId) return true;
            $itemNorm = strtolower(trim($examVal));
            $targetNorm = strtolower(trim($targetSubjectId));

            if (in_array($itemNorm, ['all', 'all subjects', 'සියලු', 'සියලු විෂයයන්', 'general', 'පොදු', ''])) return true;
            if (in_array($targetNorm, ['all', 'all subjects', 'සියලු', 'සියලු විෂයයන්', 'general', 'පොදු', ''])) return true;
            if ($itemNorm === $targetNorm) return true;

            if (isset($subjectsMap[$targetNorm])) {
                foreach ($subjectsMap[$targetNorm] as $identifier) {
                    $idNorm = strtolower(trim($identifier));
                    if ($itemNorm === $idNorm || strpos($itemNorm, $idNorm) !== false || strpos($idNorm, $itemNorm) !== false) {
                        return true;
                    }
                }
            }

            if (isset($subjectsMap[$itemNorm])) {
                foreach ($subjectsMap[$itemNorm] as $identifier) {
                    $idNorm = strtolower(trim($identifier));
                    if ($targetNorm === $idNorm || strpos($targetNorm, $idNorm) !== false || strpos($idNorm, $targetNorm) !== false) {
                        return true;
                    }
                }
            }
            return false;
        };

        // 🛡️ Filter based on authenticated teacher (Authoritative teacher_assignments relationship)
        if ($authUser && strtolower($authUser['role'] ?? '') === 'teacher') {
            $tId = $authUser['id'] ?? ($authUser['customId'] ?? '');
            $formatted = array_values(array_filter($formatted, function($ex) use ($tId, $db) {
                $exClass = $ex['classId'] ?? ($ex['gradeClass'] ?? '');
                $exSubj = $ex['subjectId'] ?? ($ex['subject'] ?? '');
                return isTeacherAssignedToClassAndSubject($tId, $exClass, $exSubj, $db);
            }));
        }

        // Filter based on authenticated student
        if ($authUser && $authUser['role'] === 'student') {
            try {
                $studentClassId = $authUser['pirivenaClass'] ?? $authUser['classId'] ?? null;
                
                // Get assigned subjects from student_subjects table or users table
                $assignedSubIds = [];
                try {
                    $sStmt = $db->prepare("SELECT subject_id as subjectId FROM student_subjects WHERE student_id = :sid");
                    $sStmt->execute(['sid' => $authUser['id']]);
                    $assignedSubIds = $sStmt->fetchAll(PDO::FETCH_COLUMN);
                } catch (Exception $e) {}

                if (empty($assignedSubIds)) {
                    $enrolledRaw = $authUser['enrolledSubjects'] ?? $authUser['subjectsAssigned'] ?? null;
                    if (is_string($enrolledRaw)) {
                        $dec = json_decode($enrolledRaw, true);
                        if (is_array($dec)) $assignedSubIds = $dec;
                    } elseif (is_array($enrolledRaw)) {
                        $assignedSubIds = $enrolledRaw;
                    }
                }

                $formatted = array_values(array_filter($formatted, function($ex) use ($studentClassId, $assignedSubIds, $matchClass, $matchSubject) {
                    $exClass = $ex['gradeClass'] ?? $ex['classId'] ?? '';
                    $exSubj = $ex['subject'] ?? $ex['subjectId'] ?? '';

                    // Check if class matches (including universal 'All')
                    if ($studentClassId && !empty($exClass) && !$matchClass($exClass, $studentClassId)) {
                        return false;
                    }

                    // Check if subject is assigned to student (if student has subject restrictions)
                    if (!empty($assignedSubIds)) {
                        $matchesAnyAssignedSub = false;
                        foreach ($assignedSubIds as $subId) {
                            if ($matchSubject($exSubj, $subId)) {
                                $matchesAnyAssignedSub = true;
                                break;
                            }
                        }
                        return $matchesAnyAssignedSub;
                    }
                    return true;
                }));
            } catch (Exception $e) {}
        }

        // Apply explicit query params if provided
        if ($paramClassId || $paramSubjectId) {
            $formatted = array_values(array_filter($formatted, function($ex) use ($paramClassId, $paramSubjectId, $matchClass, $matchSubject) {
                $exClass = $ex['gradeClass'] ?? $ex['classId'] ?? '';
                $exSubj = $ex['subject'] ?? $ex['subjectId'] ?? '';

                if ($paramClassId && !$matchClass($exClass, $paramClassId)) {
                    return false;
                }
                if ($paramSubjectId && !$matchSubject($exSubj, $paramSubjectId)) {
                    return false;
                }
                return true;
            }));
        }

        sendJsonResponse($formatted);
    }
}

// 1b. POST /api/exams/{id}/submit  →  Save exam submission
if ($method === 'POST' && $pathId && $subAction === 'submit') {
    $authUser = requireAuth();
    $body = getRequestBody();

    $subId = !empty($body['id']) ? trim($body['id']) : ('sub-' . time() . '-' . rand(1000, 9999));

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
        $studentId = trim($body['studentId'] ?? $authUser['id']);
        $studentCustomId = trim($body['studentCustomId'] ?? ($authUser['customId'] ?? $studentId));
        $studentName = trim($body['studentName'] ?? $authUser['name']);
        $studentMonkName = trim($body['studentMonkName'] ?? '');
        $studentMonkStatus = trim($body['studentMonkStatus'] ?? 'lay');
        $studentAvatar = trim($body['studentAvatar'] ?? '');
        $classId = trim($body['classId'] ?? '');
    }

    $teacherFeedback = $body['teacherFeedback'] ?? null;
    $answers = is_array($body['answers'] ?? null) ? json_encode($body['answers'], JSON_UNESCAPED_UNICODE) : strval($body['answers'] ?? '[]');
    $score = isset($body['score']) ? floatval($body['score']) : (isset($body['marksObtained']) ? floatval($body['marksObtained']) : 0);
    $totalMarks = isset($body['totalMarks']) ? intval($body['totalMarks']) : 100;
    $timeTaken = isset($body['timeTaken']) ? intval($body['timeTaken']) : null;
    $status = $body['status'] ?? 'submitted';
    $graded = !empty($body['graded']) ? 1 : ($status === 'graded' ? 1 : 0);

    try {
        $stmt = $db->prepare("INSERT INTO exam_submissions (id, examId, studentId, studentCustomId, studentName, studentMonkName, studentMonkStatus, studentAvatar, classId, answersJson, answers, marksObtained, score, totalMarks, timeTaken, status, graded, teacherFeedback)
            VALUES (:id, :examId, :studentId, :studentCustomId, :studentName, :studentMonkName, :studentMonkStatus, :studentAvatar, :classId, :answersJson, :answers, :marksObtained, :score, :totalMarks, :timeTaken, :status, :graded, :teacherFeedback)
            ON DUPLICATE KEY UPDATE answersJson = VALUES(answersJson), answers = VALUES(answers), marksObtained = VALUES(marksObtained), score = VALUES(score), status = VALUES(status), graded = VALUES(graded), teacherFeedback = COALESCE(VALUES(teacherFeedback), teacherFeedback)");

        $stmt->execute([
            'id' => $subId,
            'examId' => $pathId,
            'studentId' => $studentId,
            'studentCustomId' => $studentCustomId,
            'studentName' => $studentName,
            'studentMonkName' => $studentMonkName,
            'studentMonkStatus' => $studentMonkStatus,
            'studentAvatar' => $studentAvatar,
            'classId' => $classId,
            'answersJson' => $answers,
            'answers' => $answers,
            'marksObtained' => $score,
            'score' => $score,
            'totalMarks' => $totalMarks,
            'timeTaken' => $timeTaken,
            'status' => $status,
            'graded' => $graded,
            'teacherFeedback' => $teacherFeedback,
        ]);
    } catch (Exception $e) {
        // Fallback simple insert if any column mismatch
        try {
            $stmt = $db->prepare("INSERT INTO exam_submissions (id, examId, studentId, studentName, answersJson, marksObtained, totalMarks, status)
                VALUES (:id, :examId, :studentId, :studentName, :answersJson, :marksObtained, :totalMarks, :status)
                ON DUPLICATE KEY UPDATE answersJson = VALUES(answersJson), marksObtained = VALUES(marksObtained), status = VALUES(status)");
            $stmt->execute([
                'id' => $subId,
                'examId' => $pathId,
                'studentId' => $studentId,
                'studentName' => $studentName,
                'answersJson' => $answers,
                'marksObtained' => $score,
                'totalMarks' => $totalMarks,
                'status' => $status,
            ]);
        } catch (Exception $e2) {}
    }

    // 🔔 Trigger OneSignal Push Notification for student result
    try {
        if (class_exists('OneSignalService') && ($graded || $status === 'graded' || $score > 0)) {
            $examTitle = 'මාර්ගගත විභාගය';
            try {
                $exTitleStmt = $db->prepare("SELECT title, titleSinhala FROM exams WHERE id = :id LIMIT 1");
                $exTitleStmt->execute(['id' => $pathId]);
                $exRow = $exTitleStmt->fetch();
                if ($exRow) {
                    $examTitle = !empty($exRow['titleSinhala']) ? $exRow['titleSinhala'] : $exRow['title'];
                }
            } catch (Exception $eT) {}

            OneSignalService::notifyExamResult(
                $studentId,
                $examTitle,
                $score,
                $totalMarks,
                $pathId
            );
        }
    } catch (Exception $eNotify) {}

    sendJsonResponse([
        "success" => true,
        "submission" => [
            "id" => $subId,
            "examId" => $pathId,
            "studentId" => $studentId,
            "studentCustomId" => $studentCustomId,
            "studentName" => $studentName,
            "studentMonkName" => $studentMonkName,
            "studentMonkStatus" => $studentMonkStatus,
            "studentAvatar" => $studentAvatar,
            "classId" => $classId,
            "answers" => json_decode($answers, true) ?: [],
            "marksObtained" => $score,
            "score" => $score,
            "totalMarks" => $totalMarks,
            "timeTaken" => $timeTaken,
            "status" => $status,
            "graded" => (bool)$graded,
            "teacherFeedback" => $teacherFeedback,
            "submittedAt" => date('Y-m-d H:i:s'),
        ]
    ], 201);
}

// 1c. GET /api/exams/{id}/monitoring → get monitoring data for exam
if ($method === 'GET' && $pathId && $subAction === 'monitoring') {
    $authUser = requireRole(['teacher', 'admin', 'superadmin']);

    // Fetch the exam
    $stmtExam = $db->prepare("SELECT * FROM exams WHERE id = :id LIMIT 1");
    $stmtExam->execute(['id' => $pathId]);
    $rawExam = $stmtExam->fetch();

    if (!$rawExam) {
        sendJsonResponse(["error" => "Exam not found"], 404);
    }

    // 🛡️ Teacher Assignment Guard: Teachers can only monitor exams in their assigned classes/subjects
    if (strtolower($authUser['role'] ?? '') === 'teacher') {
        $exClass = $rawExam['classId'] ?? ($rawExam['gradeClass'] ?? '');
        $exSubj = $rawExam['subjectId'] ?? ($rawExam['subject'] ?? '');
        requireTeacherAssignment($authUser, $exClass, $exSubj, $db);
    }

    $exam = formatExamItem($rawExam);

    // Fetch all submissions for this exam
    $stmtSubs = $db->prepare("SELECT * FROM exam_submissions WHERE examId = :examId ORDER BY submittedAt DESC");
    $stmtSubs->execute(['examId' => $pathId]);
    $rawSubs = $stmtSubs->fetchAll();

    $submissions = [];
    foreach ($rawSubs as $sub) {
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
        $submissions[] = $sub;
    }

    // Index submissions by student identifiers
    $submissionsByStudent = [];
    foreach ($submissions as $sub) {
        $sid = trim($sub['studentId'] ?? '');
        $scid = trim($sub['studentCustomId'] ?? '');
        if ($sid && !isset($submissionsByStudent[$sid])) $submissionsByStudent[$sid] = $sub;
        if ($scid && !isset($submissionsByStudent[$scid])) $submissionsByStudent[$scid] = $sub;
    }

    // Query enrolled students for this exam's target class
    $examClass = trim($rawExam['gradeClass'] ?? $rawExam['classId'] ?? '');
    $students = [];
    try {
        if (!empty($examClass) && strtolower($examClass) !== 'all' && strtolower($examClass) !== 'general') {
            // Find all matching class identifiers in classes table
            $matchKeys = [$examClass];
            $stmtCls = $db->prepare("SELECT id, code, name, nameSinhala, className, classNameSinhala FROM classes WHERE id = :ec OR code = :ec OR name = :ec OR nameSinhala = :ec OR className = :ec OR classNameSinhala = :ec");
            $stmtCls->execute(['ec' => $examClass]);
            $foundClasses = $stmtCls->fetchAll();
            foreach ($foundClasses as $fc) {
                foreach (['id', 'code', 'name', 'nameSinhala', 'className', 'classNameSinhala'] as $k) {
                    if (!empty($fc[$k])) {
                        $matchKeys[] = trim($fc[$k]);
                    }
                }
            }
            $matchKeys = array_unique(array_filter($matchKeys));

            // Query students belonging to these class identifiers
            $inClauses = [];
            $inParams = [];
            $i = 0;
            foreach ($matchKeys as $k) {
                $param = ":mk_" . $i++;
                $inClauses[] = $param;
                $inParams[$param] = $k;
            }
            $inSql = implode(',', $inClauses);

            $stmtStudents = $db->prepare("SELECT id, customId, indexNumber, name, monkName, monkStatus, avatar, classId, pirivenaClass, phone, email, status FROM users WHERE role = 'student' AND (classId IN ($inSql) OR pirivenaClass IN ($inSql))");
            $stmtStudents->execute($inParams);
            $students = $stmtStudents->fetchAll();
        } else {
            // If exam was not bound to a specific class, collect students who submitted this exam
            $subStudentIds = [];
            foreach ($submissions as $sub) {
                if (!empty($sub['studentId'])) $subStudentIds[] = trim($sub['studentId']);
                if (!empty($sub['studentCustomId'])) $subStudentIds[] = trim($sub['studentCustomId']);
            }
            $subStudentIds = array_unique(array_filter($subStudentIds));

            if (!empty($subStudentIds)) {
                $inClauses = [];
                $inParams = [];
                $i = 0;
                foreach ($subStudentIds as $sid) {
                    $param = ":subst_" . $i++;
                    $inClauses[] = $param;
                    $inParams[$param] = $sid;
                }
                $inSql = implode(',', $inClauses);
                $stmtStudents = $db->prepare("SELECT id, customId, indexNumber, name, monkName, monkStatus, avatar, classId, pirivenaClass, phone, email, status FROM users WHERE role = 'student' AND (id IN ($inSql) OR customId IN ($inSql) OR indexNumber IN ($inSql))");
                $stmtStudents->execute($inParams);
                $students = $stmtStudents->fetchAll();
            } else {
                $students = [];
            }
        }
    } catch (Exception $e) {
        $students = [];
    }

    $passingMark = isset($exam['passingMarks']) ? floatval($exam['passingMarks']) : 40;
    $completedCount = 0;
    $inProgressCount = 0;
    $passCount = 0;
    $failCount = 0;
    $totalScoreSum = 0;
    $scoredCount = 0;
    $highestScore = 0;
    $lowestScore = 100;

    $studentStatuses = [];
    $enrolledKeys = [];

    foreach ($students as $st) {
        $stId = trim($st['id'] ?? '');
        $stCustomId = trim($st['customId'] ?? $st['indexNumber'] ?? '');
        if ($stId) $enrolledKeys[$stId] = true;
        if ($stCustomId) $enrolledKeys[$stCustomId] = true;

        $matchedSub = null;
        if ($stId && isset($submissionsByStudent[$stId])) {
            $matchedSub = $submissionsByStudent[$stId];
        } else if ($stCustomId && isset($submissionsByStudent[$stCustomId])) {
            $matchedSub = $submissionsByStudent[$stCustomId];
        }

        $status = 'not_started';
        $score = null;
        if ($matchedSub) {
            $status = $matchedSub['status'] ?? 'completed';
            $score = $matchedSub['score'] !== null ? floatval($matchedSub['score']) : null;
            if ($score !== null) {
                $scoredCount++;
                $totalScoreSum += $score;
                if ($score > $highestScore) $highestScore = $score;
                if ($score < $lowestScore) $lowestScore = $score;
                if ($score >= $passingMark) {
                    $passCount++;
                } else {
                    $failCount++;
                }
            }
            if ($status === 'in_progress') {
                $inProgressCount++;
            } else {
                $completedCount++;
            }
        }

        $studentStatuses[] = [
            'id' => $stId,
            'customId' => $stCustomId ?: $stId,
            'name' => $st['name'] ?? '',
            'monkName' => $st['monkName'] ?? '',
            'monkStatus' => $st['monkStatus'] ?? 'lay',
            'avatar' => $st['avatar'] ?? '',
            'phone' => $st['phone'] ?? '',
            'email' => $st['email'] ?? '',
            'classId' => $st['classId'] ?? $st['pirivenaClass'] ?? '',
            'status' => $status,
            'score' => $score,
            'submission' => $matchedSub,
        ];
    }

    // Include submissions from outside the class query if any
    foreach ($submissions as $sub) {
        $sid = trim($sub['studentId'] ?? '');
        $scid = trim($sub['studentCustomId'] ?? '');
        if (($sid && isset($enrolledKeys[$sid])) || ($scid && isset($enrolledKeys[$scid]))) {
            continue;
        }

        $score = $sub['score'] !== null ? floatval($sub['score']) : null;
        if ($score !== null) {
            $scoredCount++;
            $totalScoreSum += $score;
            if ($score > $highestScore) $highestScore = $score;
            if ($score < $lowestScore) $lowestScore = $score;
            if ($score >= $passingMark) {
                $passCount++;
            } else {
                $failCount++;
            }
        }
        $status = $sub['status'] ?? 'completed';
        if ($status === 'in_progress') {
            $inProgressCount++;
        } else {
            $completedCount++;
        }

        $studentStatuses[] = [
            'id' => $sid ?: ($sub['id'] ?? 'st'),
            'customId' => $scid ?: $sid,
            'name' => $sub['studentName'] ?? '',
            'monkName' => $sub['studentMonkName'] ?? '',
            'monkStatus' => $sub['studentMonkStatus'] ?? 'lay',
            'avatar' => $sub['studentAvatar'] ?? '',
            'phone' => '',
            'email' => '',
            'classId' => $sub['classId'] ?? '',
            'status' => $status,
            'score' => $score,
            'submission' => $sub,
        ];
    }

    $totalStudents = count($studentStatuses);
    $notStartedCount = max(0, $totalStudents - $completedCount - $inProgressCount);
    $avgScore = $scoredCount > 0 ? round($totalScoreSum / $scoredCount, 1) : 0;
    if ($scoredCount === 0) {
        $highestScore = 0;
        $lowestScore = 0;
    }

    $stats = [
        "totalStudents" => $totalStudents,
        "completedCount" => $completedCount,
        "inProgressCount" => $inProgressCount,
        "notStartedCount" => $notStartedCount,
        "passCount" => $passCount,
        "failCount" => $failCount,
        "avgScore" => $avgScore,
        "highestScore" => $highestScore,
        "lowestScore" => $lowestScore,
    ];

    sendJsonResponse([
        "examId" => $pathId,
        "exam" => $exam,
        "stats" => $stats,
        "studentStatuses" => $studentStatuses,
        "allSubmissions" => $submissions,
        "totalSubmissions" => count($submissions),
    ]);
}

// 2. POST Exam (create)
if ($method === 'POST' && !$subAction) {
    $authUser = requireRole(['teacher', 'admin', 'superadmin']);
    $body = getRequestBody();
    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : 'exam-' . time() . '-' . rand(100, 999);
    $examCode = isset($body['examCode']) ? trim($body['examCode']) : 'EXM-' . rand(1000, 9999);
    $title = isset($body['title']) ? trim($body['title']) : '';
    $titleSinhala = isset($body['titleSinhala']) ? trim($body['titleSinhala']) : $title;
    
    $subjectId = isset($body['subjectId']) && !empty($body['subjectId']) ? trim($body['subjectId']) : (isset($body['subject']) ? trim($body['subject']) : 'General');
    $subject = $subjectId;
    
    $classId = isset($body['classId']) && !empty($body['classId']) ? trim($body['classId']) : (isset($body['gradeClass']) ? trim($body['gradeClass']) : 'All');
    $gradeClass = $classId;
    
    $durationMinutes = isset($body['durationMinutes']) ? intval($body['durationMinutes']) : (isset($body['duration']) ? intval($body['duration']) : 60);
    $totalMarks = isset($body['totalMarks']) ? intval($body['totalMarks']) : 100;
    $passingMarks = isset($body['passingMarks']) ? intval($body['passingMarks']) : (isset($body['passMark']) ? intval($body['passMark']) : 40);
    $attemptsAllowed = isset($body['attemptsAllowed']) ? intval($body['attemptsAllowed']) : 2;
    $startDate = isset($body['startDate']) ? trim($body['startDate']) : null;
    $endDate = isset($body['endDate']) ? trim($body['endDate']) : null;
    $instructions = isset($body['instructions']) ? trim($body['instructions']) : null;
    $instructionsSinhala = isset($body['instructionsSinhala']) ? trim($body['instructionsSinhala']) : null;

    $publishedBool = isset($body['published']) ? (bool)$body['published'] : true;
    $publishedInt = $publishedBool ? 1 : 0;
    $status = isset($body['status']) ? trim($body['status']) : ($publishedBool ? 'published' : 'draft');

    $questions = isset($body['questions']) ? $body['questions'] : [];
    $questionsJson = json_encode($questions, JSON_UNESCAPED_UNICODE);

    if (empty($title)) {
        sendJsonResponse(["error" => "Exam title is required."], 400);
    }

    // 🛡️ Teacher Assignment Enforcement: Teachers can ONLY create exams for assigned classes & subjects
    if (strtolower($authUser['role'] ?? '') === 'teacher') {
        requireTeacherAssignment($authUser, $classId, $subjectId, $db);
        $teacherId = $authUser['id'];
    } else {
        $teacherId = isset($body['teacherId']) ? trim($body['teacherId']) : (isset($body['uploadedByTeacherId']) ? trim($body['uploadedByTeacherId']) : $authUser['id']);
    }

    $stmt = $db->prepare("INSERT INTO exams (id, examCode, title, titleSinhala, subject, subjectId, gradeClass, classId, duration, durationMinutes, totalMarks, passMark, passingMarks, attemptsAllowed, startDate, endDate, instructions, instructionsSinhala, status, published, questionsJson, questions, teacherId) 
        VALUES (:id, :code, :t, :tsin, :sub, :subid, :gc, :cid, :dur, :durmin, :tm, :pmark, :pmrk, :att, :sdate, :edate, :inst, :instsin, :st, :pub, :qjson, :q, :tid)
        ON DUPLICATE KEY UPDATE title = VALUES(title), titleSinhala = VALUES(titleSinhala), subject = VALUES(subject), subjectId = VALUES(subjectId), gradeClass = VALUES(gradeClass), classId = VALUES(classId), duration = VALUES(duration), durationMinutes = VALUES(durationMinutes), totalMarks = VALUES(totalMarks), passMark = VALUES(passMark), passingMarks = VALUES(passingMarks), attemptsAllowed = VALUES(attemptsAllowed), startDate = VALUES(startDate), endDate = VALUES(endDate), instructions = VALUES(instructions), instructionsSinhala = VALUES(instructionsSinhala), status = VALUES(status), published = VALUES(published), questionsJson = VALUES(questionsJson), questions = VALUES(questions), teacherId = VALUES(teacherId)");

    $stmt->execute([
        'id' => $id,
        'code' => $examCode,
        't' => $title,
        'tsin' => $titleSinhala,
        'sub' => $subject,
        'subid' => $subjectId,
        'gc' => $gradeClass,
        'cid' => $classId,
        'dur' => $durationMinutes,
        'durmin' => $durationMinutes,
        'tm' => $totalMarks,
        'pmark' => $passingMarks,
        'pmrk' => $passingMarks,
        'att' => $attemptsAllowed,
        'sdate' => $startDate,
        'edate' => $endDate,
        'inst' => $instructions,
        'instsin' => $instructionsSinhala,
        'st' => $status,
        'pub' => $publishedInt,
        'qjson' => $questionsJson,
        'q' => $questionsJson,
        'tid' => $teacherId
    ]);

    $item = [
        "id" => $id,
        "examCode" => $examCode,
        "title" => $title,
        "titleSinhala" => $titleSinhala,
        "subject" => $subject,
        "subjectId" => $subjectId,
        "gradeClass" => $gradeClass,
        "classId" => $classId,
        "durationMinutes" => $durationMinutes,
        "duration" => $durationMinutes,
        "totalMarks" => $totalMarks,
        "passingMarks" => $passingMarks,
        "passMark" => $passingMarks,
        "attemptsAllowed" => $attemptsAllowed,
        "startDate" => $startDate,
        "endDate" => $endDate,
        "instructions" => $instructions,
        "instructionsSinhala" => $instructionsSinhala,
        "status" => $status,
        "published" => $publishedBool,
        "questions" => $questions
    ];

    // 🔔 Trigger OneSignal Push Notification for students in target class
    try {
        if (class_exists('OneSignalService') && $publishedBool) {
            OneSignalService::notifyNewExam($title, $classId, $subject, $id, $teacherId);
        }
    } catch (Exception $eNotify) {}

    sendJsonResponse(["success" => true, "exam" => $item], 201);
}

// 3. PUT / PATCH Exam
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['teacher', 'admin', 'superadmin']);
    $body = getRequestBody();
    $examId = $pathId ?: (isset($body['id']) ? $body['id'] : null);

    if (!$examId) {
        sendJsonResponse(["error" => "Exam ID is required"], 400);
    }

    $stmt = $db->prepare("SELECT * FROM exams WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $examId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        sendJsonResponse(["error" => "Exam not found"], 404);
    }

    // 🛡️ Teacher Assignment Enforcement: Teachers can ONLY modify exams for assigned classes & subjects
    if (strtolower($authUser['role'] ?? '') === 'teacher') {
        $curClass = $existing['classId'] ?? ($existing['gradeClass'] ?? '');
        $curSubj = $existing['subjectId'] ?? ($existing['subject'] ?? '');
        requireTeacherAssignment($authUser, $curClass, $curSubj, $db);

        $newClass = isset($body['classId']) ? trim($body['classId']) : (isset($body['gradeClass']) ? trim($body['gradeClass']) : $curClass);
        $newSubj = isset($body['subjectId']) ? trim($body['subjectId']) : (isset($body['subject']) ? trim($body['subject']) : $curSubj);
        requireTeacherAssignment($authUser, $newClass, $newSubj, $db);
    }

    $title = isset($body['title']) ? trim($body['title']) : $existing['title'];
    $titleSinhala = isset($body['titleSinhala']) ? trim($body['titleSinhala']) : ($existing['titleSinhala'] ?? $title);
    
    $subjectId = isset($body['subjectId']) && !empty($body['subjectId']) ? trim($body['subjectId']) : (isset($body['subject']) ? trim($body['subject']) : ($existing['subjectId'] ?? $existing['subject'] ?? 'General'));
    $subject = $subjectId;
    
    $classId = isset($body['classId']) && !empty($body['classId']) ? trim($body['classId']) : (isset($body['gradeClass']) ? trim($body['gradeClass']) : ($existing['classId'] ?? $existing['gradeClass'] ?? 'All'));
    $gradeClass = $classId;
    
    $durationMinutes = isset($body['durationMinutes']) ? intval($body['durationMinutes']) : (isset($body['duration']) ? intval($body['duration']) : intval($existing['durationMinutes'] ?? $existing['duration'] ?? 60));
    $totalMarks = isset($body['totalMarks']) ? intval($body['totalMarks']) : intval($existing['totalMarks'] ?? 100);
    $passingMarks = isset($body['passingMarks']) ? intval($body['passingMarks']) : (isset($body['passMark']) ? intval($body['passMark']) : intval($existing['passingMarks'] ?? $existing['passMark'] ?? 40));
    $attemptsAllowed = isset($body['attemptsAllowed']) ? intval($body['attemptsAllowed']) : intval($existing['attemptsAllowed'] ?? 2);
    $startDate = isset($body['startDate']) ? trim($body['startDate']) : ($existing['startDate'] ?? null);
    $endDate = isset($body['endDate']) ? trim($body['endDate']) : ($existing['endDate'] ?? null);
    $instructions = isset($body['instructions']) ? trim($body['instructions']) : ($existing['instructions'] ?? null);
    $instructionsSinhala = isset($body['instructionsSinhala']) ? trim($body['instructionsSinhala']) : ($existing['instructionsSinhala'] ?? null);

    if (isset($body['published'])) {
        $publishedBool = (bool)$body['published'];
        $publishedInt = $publishedBool ? 1 : 0;
        $status = isset($body['status']) ? trim($body['status']) : ($publishedBool ? 'published' : 'draft');
    } else {
        $status = isset($body['status']) ? trim($body['status']) : $existing['status'];
        $publishedBool = ($status === 'published' || $status === 'active');
        $publishedInt = $publishedBool ? 1 : 0;
    }

    $questionsJson = isset($body['questions']) ? json_encode($body['questions'], JSON_UNESCAPED_UNICODE) : $existing['questionsJson'];

    $stmt = $db->prepare("UPDATE exams SET title = :t, titleSinhala = :tsin, subject = :sub, subjectId = :subid, gradeClass = :gc, classId = :cid, duration = :dur, durationMinutes = :durmin, totalMarks = :tm, passMark = :pmark, passingMarks = :pmrk, attemptsAllowed = :att, startDate = :sdate, endDate = :edate, instructions = :inst, instructionsSinhala = :instsin, status = :st, published = :pub, questionsJson = :qjson, questions = :q WHERE id = :id");
    $stmt->execute([
        'id' => $examId,
        't' => $title,
        'tsin' => $titleSinhala,
        'sub' => $subject,
        'subid' => $subjectId,
        'gc' => $gradeClass,
        'cid' => $classId,
        'dur' => $durationMinutes,
        'durmin' => $durationMinutes,
        'tm' => $totalMarks,
        'pmark' => $passingMarks,
        'pmrk' => $passingMarks,
        'att' => $attemptsAllowed,
        'sdate' => $startDate,
        'edate' => $endDate,
        'inst' => $instructions,
        'instsin' => $instructionsSinhala,
        'st' => $status,
        'pub' => $publishedInt,
        'qjson' => $questionsJson,
        'q' => $questionsJson
    ]);

    // 🔔 Trigger OneSignal Push Notification if newly published
    try {
        if (class_exists('OneSignalService') && $publishedBool && empty($existing['published'])) {
            OneSignalService::notifyNewExam($title, $classId, $subject, $examId);
        }
    } catch (Exception $eNotify) {}

    sendJsonResponse(["success" => true, "message" => "Exam updated successfully"]);
}

// 4. DELETE Exam
if ($method === 'DELETE') {
    $authUser = requireRole(['teacher', 'admin', 'superadmin']);
    $body = getRequestBody();
    $examId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($_GET['id']) ? $_GET['id'] : null));

    if (!$examId) {
        sendJsonResponse(["error" => "Exam ID is required"], 400);
    }

    $stmt = $db->prepare("SELECT * FROM exams WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $examId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        sendJsonResponse(["error" => "Exam not found"], 404);
    }

    // 🛡️ Teacher Assignment Enforcement: Teachers can ONLY delete exams in classes/subjects they teach
    if (strtolower($authUser['role'] ?? '') === 'teacher') {
        $curClass = $existing['classId'] ?? ($existing['gradeClass'] ?? '');
        $curSubj = $existing['subjectId'] ?? ($existing['subject'] ?? '');
        requireTeacherAssignment($authUser, $curClass, $curSubj, $db);
    }

    // Delete related submissions first
    try {
        $stmtSub = $db->prepare("DELETE FROM exam_submissions WHERE examId = :id");
        $stmtSub->execute(['id' => $examId]);
    } catch (Exception $e) {}

    $stmt = $db->prepare("DELETE FROM exams WHERE id = :id");
    $stmt->execute(['id' => $examId]);

    sendJsonResponse(["success" => true, "id" => $examId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
