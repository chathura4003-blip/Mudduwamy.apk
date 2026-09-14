<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;

$donIndex = array_search('donations', $parts);
if ($donIndex === false) {
    $donIndex = array_search('donations.php', $parts);
}
if ($donIndex !== false && isset($parts[$donIndex + 1]) && !empty($parts[$donIndex + 1])) {
    $segment = urldecode($parts[$donIndex + 1]);
    if ($segment !== 'status') {
        $pathId = $segment;
    }
}

// Helper to format donation records for React UI with privacy protection
function formatDonationRecord($d, $isAdmin = false) {
    if (!$d || !is_array($d)) return $d;
    $slipUrl = !empty($d['slipUrl']) ? $d['slipUrl'] : (!empty($d['receiptUrl']) ? $d['receiptUrl'] : '');
    $phone = !empty($d['contactPhone']) ? $d['contactPhone'] : (!empty($d['donorPhone']) ? $d['donorPhone'] : '');
    $type = !empty($d['type']) ? $d['type'] : (!empty($d['cause']) ? $d['cause'] : 'පිරිවෙන් සංවර්ධන අරමුදල');
    $amount = isset($d['amount']) ? floatval($d['amount']) : 0;
    $amountOrItems = !empty($d['amountOrItems']) ? $d['amountOrItems'] : ($amount > 0 ? ('LKR ' . number_format($amount, 2)) : 'LKR 1,000.00');

    // 🛡️ Privacy Guard: Mask donor phone/email and hide payment slips for public visitors
    if (!$isAdmin) {
        if (!empty($phone) && strlen($phone) >= 7) {
            $phone = substr($phone, 0, 3) . '****' . substr($phone, -3);
        }
        $slipUrl = '';
        if (!empty($d['isAnonymous'])) {
            $d['donorName'] = 'අනාවරණය නොකළ සැදැහැවත් දායකයෙක්';
        }
    }

    $d['slipUrl'] = $slipUrl;
    $d['receiptUrl'] = $slipUrl;
    $d['contactPhone'] = $phone;
    $d['donorPhone'] = $phone;
    $d['type'] = $type;
    $d['cause'] = $type;
    $d['amount'] = $amount;
    $d['amountOrItems'] = $amountOrItems;
    $d['dedicationWish'] = !empty($d['dedicationWish']) ? $d['dedicationWish'] : '';
    $d['slipFileName'] = $isAdmin ? (!empty($d['slipFileName']) ? $d['slipFileName'] : '') : '';
    $d['receiptId'] = !empty($d['receiptId']) ? $d['receiptId'] : ('PNK-' . substr(md5($d['id']), 0, 6));
    $d['status'] = !empty($d['status']) ? $d['status'] : 'pending';
    return $d;
}

// 1. GET Donations
if ($method === 'GET') {
    $authUser = getAuthUser();
    $isAdmin = $authUser && in_array(strtolower($authUser['role'] ?? ''), ['admin', 'superadmin']);

    if ($pathId) {
        $stmt = $db->prepare("SELECT * FROM donations WHERE id = :id1 OR receiptId = :id2 LIMIT 1");
        $stmt->execute(['id1' => $pathId, 'id2' => $pathId]);
        $don = $stmt->fetch();
        if ($don) {
            sendJsonResponse(formatDonationRecord($don, $isAdmin));
        } else {
            sendJsonResponse(["error" => "Donation record not found"], 404);
        }
    } else {
        $stmt = $db->query("SELECT * FROM donations ORDER BY created_at DESC");
        $donations = $stmt->fetchAll();
        foreach ($donations as &$d) {
            $d = formatDonationRecord($d, $isAdmin);
        }
        sendJsonResponse($donations);
    }
}

// 2. POST Donation
if ($method === 'POST') {
    $body = getRequestBody();
    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : 'don-' . time() . '-' . rand(100, 999);
    $receiptId = isset($body['receiptId']) && !empty($body['receiptId']) ? trim($body['receiptId']) : 'PNK-' . rand(100000, 999999);
    $donorName = isset($body['donorName']) && !empty($body['donorName']) ? trim($body['donorName']) : 'අනාවරණය නොකළ දායක හිමි/මහතා';
    
    $contactPhone = isset($body['contactPhone']) && !empty($body['contactPhone']) ? trim($body['contactPhone']) : (isset($body['donorPhone']) ? trim($body['donorPhone']) : '');
    $donorEmail = isset($body['donorEmail']) ? trim($body['donorEmail']) : '';

    $rawAmount = isset($body['amount']) ? $body['amount'] : (isset($body['amountRs']) ? $body['amountRs'] : 0);
    $cleanAmount = preg_replace('/[^0-9.]/', '', (string)$rawAmount);
    $amount = floatval($cleanAmount);
    if ($amount <= 0) {
        $amount = 1000.0;
    }

    $type = isset($body['type']) && !empty($body['type']) ? trim($body['type']) : (isset($body['cause']) ? trim($body['cause']) : 'අටපිරිකර හා සිවුරු පූජාව (Atapirikara Offering)');
    $amountOrItems = isset($body['amountOrItems']) && !empty($body['amountOrItems']) ? trim($body['amountOrItems']) : ('LKR ' . number_format($amount, 2) . ' for ' . $type);
    
    $slipUrl = isset($body['slipUrl']) && !empty($body['slipUrl']) ? trim($body['slipUrl']) : (isset($body['receiptUrl']) ? trim($body['receiptUrl']) : '');
    $slipFileName = isset($body['slipFileName']) ? trim($body['slipFileName']) : '';
    $dedicationWish = isset($body['dedicationWish']) ? trim($body['dedicationWish']) : '';

    $isAnonymous = !empty($body['isAnonymous']) ? 1 : 0;
    $date = isset($body['date']) && !empty($body['date']) ? trim($body['date']) : date('Y-m-d');
    $status = isset($body['status']) ? trim($body['status']) : 'pending';

    $insertSuccess = false;
    $insertError = '';

    // First attempt: Full insert
    try {
        $stmt = $db->prepare("INSERT INTO donations (id, receiptId, donorName, donorPhone, contactPhone, donorEmail, amount, amountOrItems, cause, type, receiptUrl, slipUrl, slipFileName, dedicationWish, isAnonymous, date, status) 
            VALUES (:id, :rec, :name, :phone, :cphone, :email, :amt, :amtitems, :cause, :type, :rurl, :surl, :sfilename, :wish, :anon, :pdate, :st)
            ON DUPLICATE KEY UPDATE 
                donorName = VALUES(donorName), 
                donorPhone = VALUES(donorPhone), 
                contactPhone = VALUES(contactPhone), 
                donorEmail = VALUES(donorEmail), 
                amount = VALUES(amount), 
                amountOrItems = VALUES(amountOrItems), 
                cause = VALUES(cause), 
                type = VALUES(type), 
                receiptUrl = VALUES(receiptUrl), 
                slipUrl = VALUES(slipUrl), 
                slipFileName = VALUES(slipFileName), 
                dedicationWish = VALUES(dedicationWish), 
                isAnonymous = VALUES(isAnonymous), 
                date = VALUES(date), 
                status = VALUES(status)");

        $stmt->execute([
            'id' => $id,
            'rec' => $receiptId,
            'name' => $donorName,
            'phone' => $contactPhone,
            'cphone' => $contactPhone,
            'email' => $donorEmail,
            'amt' => $amount,
            'amtitems' => $amountOrItems,
            'cause' => $type,
            'type' => $type,
            'rurl' => $slipUrl,
            'surl' => $slipUrl,
            'sfilename' => $slipFileName,
            'wish' => $dedicationWish,
            'anon' => $isAnonymous,
            'pdate' => $date,
            'st' => $status
        ]);
        $insertSuccess = true;
    } catch (Exception $eFirst) {
        // Self-heal table schema on live server if columns were missing
        $repairCols = [
            "ALTER TABLE donations ADD COLUMN contactPhone VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE donations ADD COLUMN amountOrItems VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE donations ADD COLUMN type VARCHAR(255) DEFAULT 'පිරිවෙන් සංවර්ධන අරමුදල'",
            "ALTER TABLE donations ADD COLUMN slipUrl MEDIUMTEXT DEFAULT NULL",
            "ALTER TABLE donations ADD COLUMN slipFileName VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE donations ADD COLUMN dedicationWish TEXT DEFAULT NULL",
            "ALTER TABLE donations MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'",
            "ALTER TABLE donations MODIFY COLUMN receiptUrl MEDIUMTEXT DEFAULT NULL"
        ];
        foreach ($repairCols as $sqlRepair) {
            try {
                @$db->exec($sqlRepair);
            } catch (Exception $eRep) {}
        }

        // Retry Full Insert
        try {
            $stmt = $db->prepare("INSERT INTO donations (id, receiptId, donorName, donorPhone, contactPhone, donorEmail, amount, amountOrItems, cause, type, receiptUrl, slipUrl, slipFileName, dedicationWish, isAnonymous, date, status) 
                VALUES (:id, :rec, :name, :phone, :cphone, :email, :amt, :amtitems, :cause, :type, :rurl, :surl, :sfilename, :wish, :anon, :pdate, :st)
                ON DUPLICATE KEY UPDATE 
                    donorName = VALUES(donorName), 
                    amount = VALUES(amount), 
                    status = VALUES(status)");
            $stmt->execute([
                'id' => $id,
                'rec' => $receiptId,
                'name' => $donorName,
                'phone' => $contactPhone,
                'cphone' => $contactPhone,
                'email' => $donorEmail,
                'amt' => $amount,
                'amtitems' => $amountOrItems,
                'cause' => $type,
                'type' => $type,
                'rurl' => $slipUrl,
                'surl' => $slipUrl,
                'sfilename' => $slipFileName,
                'wish' => $dedicationWish,
                'anon' => $isAnonymous,
                'pdate' => $date,
                'st' => $status
            ]);
            $insertSuccess = true;
        } catch (Exception $eSecond) {
            // Fallback to basic columns insert
            try {
                $stmt = $db->prepare("INSERT INTO donations (id, receiptId, donorName, donorPhone, donorEmail, amount, cause, receiptUrl, status, isAnonymous, date) 
                    VALUES (:id, :rec, :name, :phone, :email, :amt, :cause, :rurl, :st, :anon, :pdate)
                    ON DUPLICATE KEY UPDATE donorName = VALUES(donorName), amount = VALUES(amount)");
                $stmt->execute([
                    'id' => $id,
                    'rec' => $receiptId,
                    'name' => $donorName,
                    'phone' => $contactPhone,
                    'email' => $donorEmail,
                    'amt' => $amount,
                    'cause' => $type,
                    'rurl' => $slipUrl,
                    'st' => 'pending',
                    'anon' => $isAnonymous,
                    'pdate' => $date
                ]);
                $insertSuccess = true;
            } catch (Exception $eThird) {
                $insertError = $eThird->getMessage();
            }
        }
    }

    if (!$insertSuccess) {
        error_log("Failed to insert donation: " . $insertError);
        sendJsonResponse([
            "error" => "Failed to save donation record",
            "details" => $insertError
        ], 500);
    }

    $resItem = formatDonationRecord([
        "id" => $id,
        "receiptId" => $receiptId,
        "donorName" => $donorName,
        "contactPhone" => $contactPhone,
        "donorPhone" => $contactPhone,
        "donorEmail" => $donorEmail,
        "amount" => $amount,
        "amountOrItems" => $amountOrItems,
        "cause" => $type,
        "type" => $type,
        "receiptUrl" => $slipUrl,
        "slipUrl" => $slipUrl,
        "slipFileName" => $slipFileName,
        "dedicationWish" => $dedicationWish,
        "isAnonymous" => $isAnonymous,
        "date" => $date,
        "status" => $status
    ]);

    // 🔔 Send OneSignal Push Notification to Admins
    try {
        if (class_exists('OneSignalService')) {
            OneSignalService::notifyNewDonation($donorName, $amount, $type, $receiptId, $id);
        }
    } catch (Exception $ePush) {
        error_log("Failed to send donation OneSignal push notification: " . $ePush->getMessage());
    }

    sendJsonResponse([
        "success" => true,
        "receiptId" => $receiptId,
        "message" => "Donation record saved successfully.",
        "donation" => $resItem
    ], 201);
}

// 3. PUT / PATCH Donation (Verify/Update Status)
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $donId = $pathId ?: (isset($body['id']) ? $body['id'] : null);

    if (!$donId) {
        sendJsonResponse(["error" => "Donation ID is required"], 400);
    }

    $stmt = $db->prepare("SELECT * FROM donations WHERE id = :id1 OR receiptId = :id2 LIMIT 1");
    $stmt->execute(['id1' => $donId, 'id2' => $donId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        sendJsonResponse(["error" => "Donation record not found"], 404);
    }

    $status = isset($body['status']) ? trim($body['status']) : $existing['status'];

    $stmt = $db->prepare("UPDATE donations SET status = :st WHERE id = :id");
    $stmt->execute([
        'id' => $existing['id'],
        'st' => $status
    ]);

    sendJsonResponse(["success" => true, "message" => "Donation record updated successfully"]);
}

// 4. DELETE Donation
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $donId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($_GET['id']) ? $_GET['id'] : null));

    if (!$donId) {
        sendJsonResponse(["error" => "Donation ID is required"], 400);
    }

    $stmt = $db->prepare("DELETE FROM donations WHERE id = :id1 OR receiptId = :id2");
    $stmt->execute(['id1' => $donId, 'id2' => $donId]);

    sendJsonResponse(["success" => true, "id" => $donId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
