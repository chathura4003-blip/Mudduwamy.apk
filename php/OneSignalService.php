<?php
/**
 * OneSignal Push Notification Service for Sri Sumana Maha Pirivena ERP
 * Production Push Notification Gateway (Android Background & Foreground)
 */

if (!defined('ONESIGNAL_APP_ID')) {
    define('ONESIGNAL_APP_ID', 'd86127b5-1ef0-4f3e-86f2-66a5f211f30d');
}
if (!defined('ONESIGNAL_REST_API_KEY')) {
    define('ONESIGNAL_REST_API_KEY', getenv('ONESIGNAL_REST_API_KEY') ?: (isset($_ENV['ONESIGNAL_REST_API_KEY']) ? $_ENV['ONESIGNAL_REST_API_KEY'] : ''));
}

if (!class_exists('OneSignalService')) {
class OneSignalService {

    /**
     * Helper to resolve human-readable Subject Name from Subject ID / Code + Context
     */
    public static function resolveSubjectName($subjectInput, $contextTitle = '') {
        $trimmed = trim(strval($subjectInput ?? ''));
        $lower = strtolower($trimmed);

        if (empty($trimmed) || in_array($lower, ['all', 'all subjects', 'general', 'පොදු', 'සියලු', 'සියලු විෂයයන්'])) {
            return 'පොදු / සියලු විෂයයන්';
        }

        // Friendly lookup for standard Pirivena subjects
        $dict = [
            'subj-pali-101' => 'පාලි භාෂාව',
            'subj-sans-102' => 'සංස්කෘත භාෂාව',
            'subj-sinh-103' => 'සිංහල භාෂාව',
            'subj-budd-104' => 'බෞද්ධ ධර්මය හා දර්ශනය',
            'subj-budd-hist-105' => 'බෞද්ධ ඉතිහාසය හා සංස්කෘතිය',
            'subj-tripitaka-106' => 'ත්‍රිපිටක ධර්මය',
            'subj-abhidhamma-107' => 'අභිධර්මය',
            'subj-eng-108' => 'ඉංග්‍රීසි භාෂාව',
            'subj-ict-109' => 'තොරතුරු හා සන්නිවේදන තාක්ෂණය (ICT)',
            'subj-math-110' => 'ගණිතය',
            'subj-hist-111' => 'ශ්‍රී ලංකා ඉතිහාසය',
            'subj-astrology-112' => 'ජ්‍යොතිෂය',
            'subj-ayurveda-113' => 'ආයුර්වේදය',
            'subj-geo-112' => 'භූගෝල විද්‍යාව (Geography)',
            'subj-geography-112' => 'භූගෝල විද්‍යාව (Geography)',
            'sub-001' => 'පාලි භාෂාව',
            'sub-002' => 'සංස්කෘත භාෂාව',
            'sub-003' => 'සිංහල සාහිත්‍යය',
            'sub-004' => 'බුද්ධ ධර්මය',
            'sub-005' => 'ඉංග්‍රීසි භාෂාව',
            'sub-006' => 'තොරතුරු තාක්ෂණය',
            'sub-1' => 'බුද්ධ ධර්මය',
            'sub-2' => 'පාලි භාෂාව',
            'sub-3' => 'සංස්කෘත භාෂාව',
            'sub-4' => 'සිංහල භාෂාව',
            'sub-5' => 'ඉංග්‍රීසි භාෂාව',
            'sub-6' => 'ගණිතය',
            'sub-7' => 'ඉතිහාසය',
            'sub-8' => 'තොරතුරු තාක්ෂණය',
            'sub-9' => 'ත්‍රිපිටක ධර්මය',
        ];
        if (isset($dict[$lower])) {
            return $dict[$lower];
        }

        // Database lookup
        try {
            $db = getDbConnection();
            $stmt = $db->prepare("SELECT nameSinhala, subjectNameSinhala, name, subjectName, subjectCode FROM subjects WHERE id = :s OR code = :s OR subjectCode = :s OR name = :s OR nameSinhala = :s OR subjectName = :s OR subjectNameSinhala = :s LIMIT 1");
            $stmt->execute(['s' => $trimmed]);
            $row = $stmt->fetch();
            if ($row) {
                if (!empty($row['nameSinhala'])) return $row['nameSinhala'];
                if (!empty($row['subjectNameSinhala'])) return $row['subjectNameSinhala'];
                if (!empty($row['name'])) return $row['name'];
                if (!empty($row['subjectName'])) return $row['subjectName'];
            }
        } catch (Exception $e) {}

        // Keyword inference from context title & subject input
        $combined = strtolower($trimmed . ' ' . $contextTitle);
        if (strpos($combined, 'geography') !== false || strpos($combined, 'geog') !== false || strpos($combined, 'භූගෝල') !== false) {
            return 'භූගෝල විද්‍යාව (Geography)';
        }
        if (strpos($combined, 'pali') !== false || strpos($combined, 'පාලි') !== false) {
            return 'පාලි භාෂාව';
        }
        if (strpos($combined, 'sanskrit') !== false || strpos($combined, 'සංස්කෘත') !== false) {
            return 'සංස්කෘත භාෂාව';
        }
        if (strpos($combined, 'sinhala') !== false || strpos($combined, 'සිංහල') !== false) {
            return 'සිංහල භාෂාව හා සාහිත්‍යය';
        }
        if (strpos($combined, 'buddhism') !== false || strpos($combined, 'buddhist') !== false || strpos($combined, 'බුද්ධ') !== false || strpos($combined, 'ධර්ම') !== false) {
            return 'බුද්ධ ධර්මය හා දර්ශනය';
        }
        if (strpos($combined, 'history') !== false || strpos($combined, 'ඉතිහාස') !== false) {
            return 'බෞද්ධ හා ලංකා ඉතිහාසය';
        }
        if (strpos($combined, 'english') !== false || strpos($combined, 'ඉංග්‍රීසි') !== false) {
            return 'ඉංග්‍රීසි භාෂාව';
        }
        if (strpos($combined, 'ict') !== false || strpos($combined, 'information') !== false || strpos($combined, 'තොරතුරු') !== false || strpos($combined, 'පරිගණක') !== false) {
            return 'තොරතුරු හා සන්නිවේදන තාක්ෂණය (ICT)';
        }
        if (strpos($combined, 'math') !== false || strpos($combined, 'ගණිත') !== false) {
            return 'ගණිතය';
        }
        if (strpos($combined, 'science') !== false || strpos($combined, 'විද්‍යා') !== false) {
            return 'විද්‍යාව (Science)';
        }
        if (strpos($combined, 'tripitaka') !== false || strpos($combined, 'ත්‍රිපිටක') !== false) {
            return 'ත්‍රිපිටක ධර්මය';
        }
        if (strpos($combined, 'abhidhamma') !== false || strpos($combined, 'අභිධර්ම') !== false) {
            return 'අභිධර්මය';
        }
        if (strpos($combined, 'logic') !== false || strpos($combined, 'තර්ක') !== false) {
            return 'තර්ක ශාස්ත්‍රය';
        }
        if (strpos($combined, 'econ') !== false || strpos($combined, 'ආර්ථික') !== false) {
            return 'ආර්ථික විද්‍යාව';
        }
        if (strpos($combined, 'commerce') !== false || strpos($combined, 'business') !== false || strpos($combined, 'වාණිජ') !== false || strpos($combined, 'ව්‍යාපාර') !== false) {
            return 'ව්‍යාපාර අධ්‍යයනය';
        }

        // If it already contains Sinhala characters and does not look like an ID
        $isGeneratedId = (preg_match('/^(sub|subj)[-_]\d+/i', $trimmed) || preg_match('/^\d{5,}/', $trimmed));
        if (!$isGeneratedId && preg_match('/[\x{0D80}-\x{0DFF}]/u', $trimmed)) {
            return $trimmed;
        }

        if ($isGeneratedId) {
            return 'ප්‍රාචීන අධ්‍යයනය (Oriental Studies)';
        }

        return $trimmed;
    }

    /**
     * Helper to resolve human-readable Class / Grade Name from Class ID / Code
     */
    public static function resolveClassName($classInput) {
        if (empty($classInput)) return '';
        $trimmed = trim(strval($classInput));
        if (in_array(strtolower($trimmed), ['all', 'all classes', 'general', 'පොදු', 'සියලු', 'සියලු පන්ති', ''])) {
            return 'සියලුම පන්ති';
        }

        // If it already contains Sinhala characters and does not look like an ID (no 'class-'/'cls-')
        if (preg_match('/[\x{0D80}-\x{0DFF}]/u', $trimmed) && stripos($trimmed, 'class-') === false && stripos($trimmed, 'cls-') === false) {
            return $trimmed;
        }

        try {
            $db = getDbConnection();
            $stmt = $db->prepare("SELECT classNameSinhala, nameSinhala, className, name, gradeLevel FROM classes WHERE id = :c OR code = :c OR className = :c OR classNameSinhala = :c OR name = :c OR nameSinhala = :c LIMIT 1");
            $stmt->execute(['c' => $trimmed]);
            $row = $stmt->fetch();
            if ($row) {
                if (!empty($row['classNameSinhala'])) return $row['classNameSinhala'];
                if (!empty($row['nameSinhala'])) return $row['nameSinhala'];
                if (!empty($row['className'])) return $row['className'];
                if (!empty($row['name'])) return $row['name'];
            }
        } catch (Exception $e) {}

        // Friendly lookup for standard Pirivena classes
        $dict = [
            'class-pra-01' => 'ප්‍රාරම්භ පන්තිය (Praarambha)',
            'class-mad-02' => 'මධ්‍යම පන්තිය (Madhyama)',
            'class-awa-03' => 'අවසාන පන්තිය (Awasana)',
            'cls-001' => 'ප්‍රාරම්භ පන්තිය',
            'cls-002' => 'මධ්‍යම පන්තිය',
            'cls-003' => 'අවසාන පන්තිය',
            'cls-mulika-1' => 'මූලික පිරිවෙන් 1 වසර',
            'cls-mulika-2' => 'මූලික පිරිවෙන් 2 වසර',
            'cls-mulika-3' => 'මූලික පිරිවෙන් 3 වසර',
            'cls-mulika-4' => 'මූලික පිරිවෙන් 4 වසර',
            'cls-mulika-5' => 'මූලික පිරිවෙන් 5 වසර',
        ];
        $lookupKey = strtolower($trimmed);
        if (isset($dict[$lookupKey])) {
            return $dict[$lookupKey];
        }

        return $trimmed;
    }

    /**
     * Send Push Notification via OneSignal REST API
     */
    public static function sendNotification($title, $message, $options = []) {
        if (empty($title) || empty($message)) return false;

        $payload = [
            'app_id' => ONESIGNAL_APP_ID,
            'headings' => ['en' => $title],
            'contents' => ['en' => $message],
            'small_icon' => 'ic_launcher_round',
            'priority' => 10,
        ];

        if (!empty($options['data']) && is_array($options['data'])) {
            $payload['data'] = $options['data'];
        }

        if (!empty($options['collapse_id'])) {
            $payload['collapse_id'] = (string)$options['collapse_id'];
        }

        // Target specific user IDs (External User IDs)
        if (!empty($options['targetUserIds']) && is_array($options['targetUserIds'])) {
            $cleanedIds = array_values(array_unique(array_filter(mapIdList($options['targetUserIds']))));
            if (!empty($cleanedIds)) {
                $payload['include_external_user_ids'] = $cleanedIds;
            }
        }
        // Tag-based filtering (Class, Role, Exclude Sender)
        else {
            $filters = [];

            if (!empty($options['excludeUserId'])) {
                if (!empty($filters)) {
                    $filters[] = ['operator' => 'AND'];
                }
                $filters[] = [
                    'field' => 'tag',
                    'key' => 'user_id',
                    'relation' => '!=',
                    'value' => (string)$options['excludeUserId']
                ];
            }

            if (!empty($options['classId']) && $options['classId'] !== 'all') {
                if (!empty($filters)) {
                    $filters[] = ['operator' => 'AND'];
                }
                $filters[] = [
                    'field' => 'tag',
                    'key' => 'classId',
                    'relation' => '=',
                    'value' => (string)$options['classId']
                ];
            } else if (!empty($options['role']) && $options['role'] !== 'all') {
                if (!empty($filters)) {
                    $filters[] = ['operator' => 'AND'];
                }
                $filters[] = [
                    'field' => 'tag',
                    'key' => 'role',
                    'relation' => '=',
                    'value' => (string)$options['role']
                ];
            }

            if (!empty($filters)) {
                $payload['filters'] = $filters;
            } else {
                $payload['included_segments'] = ['Total Subscriptions'];
            }
        }

        $result = self::executeOneSignalRequest($payload);

        if (!empty($result['response']['errors']) && !empty($payload['filters']) && empty($options['targetUserIds'])) {
            error_log("OneSignal filter failed, falling back to segment broadcast: " . json_encode($result['response']['errors']));
            unset($payload['filters']);
            $payload['included_segments'] = ['Total Subscriptions'];
            $result = self::executeOneSignalRequest($payload);
        }

        return $result;
    }

    /**
     * Send Notification when Teacher uploads a new Study Material / PDF
     */
    public static function notifyNewMaterial($title, $classId = 'all', $subjectInput = '', $materialId = '', $excludeTeacherId = '') {
        $resolvedSubject = self::resolveSubjectName($subjectInput, $title);
        $resolvedClass = self::resolveClassName($classId);

        $details = [];
        if (!empty($resolvedSubject) && $resolvedSubject !== 'පොදු / සියලු විෂයයන්') {
            $details[] = "විෂය: {$resolvedSubject}";
        }
        if (!empty($resolvedClass) && $resolvedClass !== 'සියලුම පන්ති') {
            $details[] = "පන්තිය: {$resolvedClass}";
        }

        if (!empty($details)) {
            $msg = implode(' • ', $details) . " සඳහා නව අධ්‍යයන සටහනක් එක් කර ඇත.";
        } else {
            $msg = "නව අධ්‍යයන සටහනක් (Study Material) එක් කර ඇත.";
        }

        $options = [
            'excludeUserId' => $excludeTeacherId,
            'collapse_id' => 'mat_' . ($materialId ?: 'general'),
            'data' => [
                'action' => 'open_material',
                'materialId' => $materialId,
                'classId' => $classId
            ]
        ];
        if (!empty($classId) && $classId !== 'all') {
            $options['classId'] = $classId;
        } else {
            $options['broadcast'] = true;
        }
        return self::sendNotification("📚 නව අධ්‍යයන සටහනක්: {$title}", $msg, $options);
    }

    /**
     * Send Notification when a Circular / Broadcast Notice is published
     */
    public static function notifyBroadcastNotice($title, $noticeText = '', $noticeId = '', $excludeAdminId = '', $targetRole = 'all') {
        $msg = $noticeText ? mb_substr(strip_tags($noticeText), 0, 120) : "විශේෂ නිවේදනයක් නිකුත් කර ඇත.";
        $options = [
            'excludeUserId' => $excludeAdminId,
            'collapse_id' => 'notice_' . ($noticeId ?: 'general'),
            'data' => [
                'action' => 'open_circular',
                'noticeId' => $noticeId
            ]
        ];
        if (!empty($targetRole) && $targetRole !== 'all') {
            $options['role'] = $targetRole;
        } else {
            $options['broadcast'] = true;
        }
        return self::sendNotification("📢 විශේෂ නිවේදනය: {$title}", $msg, $options);
    }

    /**
     * Send Notification when Teacher / Admin publishes a new Exam / Test
     */
    public static function notifyNewExam($title, $classId = 'all', $subjectInput = '', $examId = '', $excludeTeacherId = '') {
        $resolvedSubject = self::resolveSubjectName($subjectInput, $title);
        $resolvedClass = self::resolveClassName($classId);

        $details = [];
        if (!empty($resolvedSubject) && $resolvedSubject !== 'පොදු / සියලු විෂයයන්') {
            $details[] = "විෂය: {$resolvedSubject}";
        }
        if (!empty($resolvedClass) && $resolvedClass !== 'සියලුම පන්ති') {
            $details[] = "පන්තිය: {$resolvedClass}";
        }

        if (!empty($details)) {
            $msg = implode(' • ', $details) . " සඳහා නව විභාගයක් ආරම්භ කර ඇත. දැන් පිළිතුරු සපයන්න.";
        } else {
            $msg = "නව මාර්ගගත විභාගයක් ආරම්භ කර ඇත. දැන් පිළිතුරු සපයන්න.";
        }

        $options = [
            'excludeUserId' => $excludeTeacherId,
            'collapse_id' => 'exam_' . ($examId ?: 'general'),
            'data' => [
                'action' => 'open_exam',
                'examId' => $examId,
                'classId' => $classId
            ]
        ];
        if (!empty($classId) && $classId !== 'all') {
            $options['classId'] = $classId;
        } else {
            $options['broadcast'] = true;
        }
        return self::sendNotification("📝 නව මාර්ගගත විභාගයක්: {$title}", $msg, $options);
    }

    /**
     * Send Notification when Class Timetable is updated
     */
    public static function notifyTimetableUpdated($className, $classId = 'all', $excludeUserId = '') {
        $resolvedClass = self::resolveClassName($classId) ?: $className;
        $title = "📅 කාලසටහන යාවත්කාලීන විය ({$resolvedClass})";
        $msg = "{$resolvedClass} සඳහා නව අධ්‍යයන කාලසටහන සකස් කර ඇත. නව කාලසටහන බැලීමට දැන් පිවිසෙන්න.";

        $options = [
            'excludeUserId' => $excludeUserId,
            'collapse_id' => 'tt_' . ($classId ?: 'general'),
            'data' => [
                'action' => 'open_timetable',
                'classId' => $classId
            ]
        ];

        if (!empty($classId) && $classId !== 'all') {
            $options['classId'] = $classId;
        } else {
            $options['broadcast'] = true;
        }

        return self::sendNotification($title, $msg, $options);
    }

    /**
     * Send Notification when Student Exam Result / Marks are submitted or graded
     */
    public static function notifyExamResult($studentName, $studentId, $examTitle, $score = 0, $totalMarks = 100, $submissionId = '') {
        if (empty($studentId)) return false;
        $scorePercent = $totalMarks > 0 ? round(($score / $totalMarks) * 100, 1) : $score;
        $msg = "විභාගය: '{$examTitle}' - ඔබගේ ලකුණු: {$score}/{$totalMarks} ({$scorePercent}%)";
        return self::sendNotification("🏆 විභාග ප්‍රතිඵල නිකුත් විය", $msg, [
            'targetUserIds' => [(string)$studentId],
            'collapse_id' => 'res_' . ($submissionId ?: $studentId),
            'data' => [
                'action' => 'open_results',
                'submissionId' => $submissionId
            ]
        ]);
    }

    /**
     * Send Notification when a Chat message is sent (Excludes Sender)
     */
    public static function notifyChatMessage($senderName, $roomName, $messageSnippet = '', $excludeSenderId = '') {
        $cleanSnippet = mb_substr(strip_tags($messageSnippet), 0, 120);
        $options = [
            'excludeUserId' => $excludeSenderId,
            'collapse_id' => 'chat_' . ($roomName ?: 'general'),
            'data' => [
                'action' => 'open_chat',
                'roomName' => $roomName
            ]
        ];

        // Format room name cleanly (e.g. class_cls-001 -> ප්‍රාරම්භ පන්තිය)
        $cleanRoomTitle = 'පොදු ශාලාව';
        if (strpos($roomName, 'class_') === 0) {
            $rawClassId = substr($roomName, 6);
            if ($rawClassId && $rawClassId !== 'general') {
                $options['classId'] = $rawClassId;
                $resolvedName = self::resolveClassName($rawClassId);
                $cleanRoomTitle = $resolvedName ?: (strtoupper($rawClassId) . ' පන්තිය');
            }
        } else if ($roomName === 'staff' || $roomName === 'teachers' || $roomName === 'staff_lounge') {
            $options['role'] = 'teacher';
            $cleanRoomTitle = 'ආචාර්ය මණ්ඩලය (Staff Lounge)';
        }

        $title = ($roomName !== 'general' && $roomName !== '') 
            ? "💬 {$cleanRoomTitle}: {$senderName}" 
            : "👤 {$senderName}";

        return self::sendNotification($title, $cleanSnippet, $options);
    }

    /**
     * Send Push Notification to Admins when a new Online Admission Application is received
     */
    public static function notifyNewAdmission($applicantName, $trackingId = '', $appliedClass = '', $admissionId = '') {
        $cleanName = !empty($applicantName) ? $applicantName : 'නවක ශිෂ්‍ය හිමි/සිසුවෙක්';
        $title = "📥 නව ඇතුළත්වීම් අයදුම්පතක් ලැබිණි!";
        $classSnippet = !empty($appliedClass) ? " - පන්තිය: {$appliedClass}" : "";
        $trackingSnippet = !empty($trackingId) ? " (අංකය: {$trackingId})" : "";
        $msg = "අයදුම්කරු: {$cleanName}{$classSnippet}{$trackingSnippet}. අයදුම්පත පරීක්ෂා කිරීමට පිවිසෙන්න.";

        $options = [
            'role' => 'admin',
            'collapse_id' => 'adm_' . ($admissionId ?: $trackingId ?: 'new'),
            'data' => [
                'action' => 'open_admission',
                'admissionId' => $admissionId,
                'trackingId' => $trackingId
            ]
        ];

        return self::sendNotification($title, $msg, $options);
    }

    /**
     * Send Push Notification to Admins when a new Donation / Contribution is received
     */
    public static function notifyNewDonation($donorName, $amount = 0, $cause = '', $receiptId = '', $donationId = '') {
        $cleanDonor = !empty($donorName) ? $donorName : 'සැදැහැවත් දායකයෙක්';
        $formattedAmount = ($amount > 0) ? ('LKR ' . number_format($amount, 2)) : '';
        $amountSnippet = $formattedAmount ? " - මුදල: {$formattedAmount}" : "";
        $causeSnippet = !empty($cause) ? " ({$cause})" : "";
        $receiptSnippet = !empty($receiptId) ? " [රිසිට්පත්: {$receiptId}]" : "";
        
        $title = "🙏 නව පිරිවෙන් ආධාරයක් / පරිත්‍යාගයක්!";
        $msg = "දායක: {$cleanDonor}{$amountSnippet}{$causeSnippet}{$receiptSnippet}. විස්තර බැලීමට පිවිසෙන්න.";

        $options = [
            'role' => 'admin',
            'collapse_id' => 'don_' . ($donationId ?: $receiptId ?: 'new'),
            'data' => [
                'action' => 'open_donation',
                'donationId' => $donationId,
                'receiptId' => $receiptId
            ]
        ];

        return self::sendNotification($title, $msg, $options);
    }

    /**
     * Helper to dispatch cURL POST request to OneSignal
     */
    private static function executeOneSignalRequest($payload) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://onesignal.com/api/v1/notifications');
        $authPrefix = (strpos(ONESIGNAL_REST_API_KEY, 'os_v2_') === 0) ? 'Key ' : 'Basic ';
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json; charset=utf-8',
            'Authorization: ' . $authPrefix . ONESIGNAL_REST_API_KEY
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $decoded = json_decode($response, true);

        if ($httpCode >= 400 || !empty($decoded['errors'])) {
            error_log("OneSignal API error (HTTP {$httpCode}): " . ($response ?: $curlError));
        }

        return [
            'statusCode' => $httpCode,
            'response' => $decoded,
            'curlError' => $curlError
        ];
    }
}
}

if (!function_exists('mapIdList')) {
    function mapIdList($arr) {
        return array_map('strval', $arr);
    }
}
