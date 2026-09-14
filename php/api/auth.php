<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $body = getRequestBody();

    // 🚪 Secure Logout Action: Invalidate Token in Database
    if (strpos($_SERVER['REQUEST_URI'], 'logout') !== false || (isset($_GET['action']) && $_GET['action'] === 'logout') || (isset($body['action']) && $body['action'] === 'logout')) {
        $authUser = getAuthUser();
        if ($authUser && !empty($authUser['id'])) {
            try {
                $uid = $authUser['id'];
                $cid = $authUser['customId'] ?? $uid;
                @$db->prepare("UPDATE users SET token = NULL WHERE id = :id OR customId = :cid")->execute(['id' => $uid, 'cid' => $cid]);
                @$db->prepare("UPDATE teachers SET token = NULL WHERE id = :id OR customId = :cid")->execute(['id' => $uid, 'cid' => $cid]);
                @$db->prepare("UPDATE students SET token = NULL WHERE id = :id OR customId = :cid")->execute(['id' => $uid, 'cid' => $cid]);
                logAuditEvent('පද්ධතියෙන් ඉවත්වීම (User Logout)', "පරිශීලක '{$authUser['name']}' ({$authUser['role']}) සාර්ථකව Log Out විය.", 'Auth', $authUser['name'], $authUser['id']);
            } catch (Exception $eLogout) {}
        }
        sendJsonResponse(["success" => true, "message" => "Logged out successfully."]);
    }

    // Password Change Action
    if ((isset($_GET['action']) && $_GET['action'] === 'change-password') || (isset($body['action']) && $body['action'] === 'change-password')) {
        $authUser = getAuthUser();
        if (!$authUser) {
            sendJsonResponse(["error" => "Unauthorized. Please log in first."], 401);
        }
        $currentPassword = $body['currentPassword'] ?? '';
        $newPassword = $body['newPassword'] ?? '';

        if (empty($currentPassword) || empty($newPassword)) {
            sendJsonResponse(["error" => "වත්මන් මුරපදය සහ නව මුරපදය ඇතුළත් කිරීම අනිවාර්ය වේ. (Current and New password are required.)"], 400);
        }
        if (strlen($newPassword) < 6) {
            sendJsonResponse(["error" => "නව මුරපදය අවම වශයෙන් අක්ෂර 6ක් විය යුතුය. (New password must be at least 6 characters.)"], 400);
        }

        $userId = $authUser['id'];
        $stmt = $db->prepare("SELECT password, plain_password FROM users WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $pwdMatch = false;
        if ($row) {
            $plainPass = $row['plain_password'] ?? '';
            $hashPass = $row['password'] ?? '';
            if (!empty($plainPass) && $currentPassword === $plainPass) {
                $pwdMatch = true;
            } elseif (!empty($hashPass) && (password_verify($currentPassword, $hashPass) || $currentPassword === $hashPass)) {
                $pwdMatch = true;
            }
        }

        if (!$pwdMatch) {
            sendJsonResponse(["error" => "වත්මන් මුරපදය (Current Password) වැරදියි. කරුණාකර නිවැරදි මුරපදය ඇතුළත් කරන්න."], 400);
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $upStmt = $db->prepare("UPDATE users SET password = :password, plain_password = NULL WHERE id = :id");
        $upStmt->execute([
            'password' => $newHash,
            'id' => $userId
        ]);
        @$db->prepare("UPDATE teachers SET password = :password, plain_password = NULL WHERE id = :id OR customId = :id")->execute(['password' => $newHash, 'id' => $userId]);
        @$db->prepare("UPDATE students SET password = :password, plain_password = NULL WHERE id = :id OR customId = :id")->execute(['password' => $newHash, 'id' => $userId]);

        logAuditEvent('මුරපදය වෙනස් කිරීම (Password Changed)', "පරිශීලක '{$authUser['name']}' මුරපදය සාර්ථකව වෙනස් කරන ලදී.", 'Auth', $authUser['name'], $authUser['id']);
        sendJsonResponse(["success" => true, "message" => "මුරපදය සාර්ථකව යාවත්කාලීන විය (Password changed successfully)."]);
    }

    $username = isset($body['username']) ? trim($body['username']) : (isset($body['identifier']) ? trim($body['identifier']) : '');
    $password = isset($body['password']) ? trim($body['password']) : '';

    if (empty($username)) {
        sendJsonResponse(["error" => "Username, Email or Student ID is required."], 400);
    }
    if (empty($password)) {
        sendJsonResponse(["error" => "Password is required."], 400);
    }

    // 🛡️ Security Guard: Anti-Brute-Force Rate Limiting per IP Address
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    try {
        $stmtRL = $db->prepare("SELECT attempts, last_attempt FROM login_rate_limits WHERE ip_address = :ip LIMIT 1");
        $stmtRL->execute(['ip' => $clientIp]);
        $rlRow = $stmtRL->fetch(PDO::FETCH_ASSOC);
        if ($rlRow) {
            $lastTime = strtotime($rlRow['last_attempt']);
            $timeDiff = time() - $lastTime;
            if ($timeDiff < 300 && $rlRow['attempts'] >= 10) {
                $remainSec = 300 - $timeDiff;
                sendJsonResponse([
                    "error" => "අඛණ්ඩව වැරදි මුරපද කිහිපවරක් ඇතුළත් කර ඇත. ආරක්ෂක හේතූන් මත තත්පර {$remainSec} කින් පසු නැවත උත්සාහ කරන්න (Too Many Failed Logins. Please wait).",
                    "code" => "RATE_LIMITED"
                ], 429);
            } elseif ($timeDiff >= 300) {
                $db->prepare("DELETE FROM login_rate_limits WHERE ip_address = :ip")->execute(['ip' => $clientIp]);
            }
        }
    } catch (Exception $eRate) {}

    // Auto-seed default superadmin & users if table is empty
    try {
        $count = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
        if ($count === 0) {
            $passHash = password_hash('admin123', PASSWORD_DEFAULT);
            $db->exec("INSERT INTO users (id, username, name, monkName, email, role, password, plain_password, status) VALUES 
                ('usr-admin-01', 'admin', 'ප්‍රධාන පරිපාලක (System Administrator)', 'පූජ්‍ය ශ්‍රී සුමන නායක හිමි', 'admin@pirivena.lk', 'superadmin', '$passHash', 'admin123', 'active')
            ");
        }
    } catch (Exception $eSeed) {
        // Ignore seed errors
    }

    $cleanIdentifier = strtolower(trim($username));

    // Build smart candidate lookup array (resolves STD <-> STU, year prefixes, spaces, hyphens)
    $candidates = [$cleanIdentifier, trim($username)];
    if (strpos($cleanIdentifier, 'std-') === 0) {
        $candidates[] = 'stu-' . substr($cleanIdentifier, 4);
    } elseif (strpos($cleanIdentifier, 'stu-') === 0) {
        $candidates[] = 'std-' . substr($cleanIdentifier, 4);
    }
    if (preg_match('/^(std|stu)-202[0-9]-(.+)$/', $cleanIdentifier, $m)) {
        $prefix = $m[1];
        $num = $m[2];
        $altPrefix = ($prefix === 'std') ? 'stu' : 'std';
        $candidates[] = "$prefix-$num";
        $candidates[] = "$altPrefix-$num";
        $candidates[] = "$altPrefix-2026-$num";
    } elseif (preg_match('/^(std|stu)-([0-9]+)$/', $cleanIdentifier, $m)) {
        $prefix = $m[1];
        $num = $m[2];
        $altPrefix = ($prefix === 'std') ? 'stu' : 'std';
        $candidates[] = "$prefix-2026-$num";
        $candidates[] = "$altPrefix-2026-$num";
        $candidates[] = "$altPrefix-$num";
    }
    $candidates[] = str_replace('-', '', $cleanIdentifier);
    $candidates[] = str_replace(' ', '', $cleanIdentifier);
    $candidates = array_values(array_unique(array_filter($candidates)));

    $inPlaceholders = implode(',', array_fill(0, count($candidates), '?'));

    // 1. Search in `users` table across all candidates
    $stmt = $db->prepare("SELECT * FROM users WHERE (
        LOWER(TRIM(email)) IN ($inPlaceholders)
        OR LOWER(TRIM(username)) IN ($inPlaceholders)
        OR LOWER(TRIM(customId)) IN ($inPlaceholders)
        OR LOWER(TRIM(indexNumber)) IN ($inPlaceholders)
        OR LOWER(TRIM(nic)) IN ($inPlaceholders)
        OR LOWER(TRIM(phone)) IN ($inPlaceholders)
        OR LOWER(TRIM(id)) IN ($inPlaceholders)
        OR LOWER(TRIM(name)) IN ($inPlaceholders)
        OR LOWER(TRIM(monkName)) IN ($inPlaceholders)
    ) LIMIT 1");

    $execParams = array_merge(
        $candidates, $candidates, $candidates, $candidates,
        $candidates, $candidates, $candidates, $candidates, $candidates
    );
    $stmt->execute($execParams);
    $user = $stmt->fetch();

    // 2. If not found in users table, check teachers table
    if (!$user) {
        try {
            $tStmt = $db->prepare("SELECT * FROM teachers WHERE (
                LOWER(TRIM(email)) = :t1 
                OR LOWER(TRIM(customId)) = :t2 
                OR LOWER(TRIM(nic)) = :t3 
                OR LOWER(TRIM(phone)) = :t4 
                OR TRIM(id) = :t5
            ) LIMIT 1");
            $tStmt->execute([
                't1' => $cleanIdentifier,
                't2' => $cleanIdentifier,
                't3' => $cleanIdentifier,
                't4' => $cleanIdentifier,
                't5' => trim($username)
            ]);
            $teacher = $tStmt->fetch();
            if ($teacher) {
                $user = [
                    'id' => $teacher['id'],
                    'username' => $teacher['customId'] ?? $teacher['name'],
                    'customId' => $teacher['customId'] ?? 'TCH-001',
                    'name' => $teacher['name'],
                    'monkName' => $teacher['monkName'] ?? null,
                    'email' => $teacher['email'] ?? '',
                    'phone' => $teacher['phone'] ?? '',
                    'role' => 'teacher',
                    'plain_password' => $teacher['plain_password'] ?? '',
                    'password' => $teacher['password'] ?? null,
                    'qualification' => $teacher['qualifications'] ?? ($teacher['qualification'] ?? ''),
                    'qualifications' => $teacher['qualifications'] ?? ($teacher['qualification'] ?? ''),
                    'status' => $teacher['status'] ?? 'active'
                ];
            }
        } catch (Exception $eTch) {}
    }

    // 3. If still not found, check students table
    if (!$user) {
        try {
            $sStmt = $db->prepare("SELECT * FROM students WHERE (
                LOWER(TRIM(email)) = :s1 
                OR LOWER(TRIM(customId)) = :s2 
                OR LOWER(TRIM(indexNumber)) = :s3 
                OR LOWER(TRIM(admissionNo)) = :s4 
                OR LOWER(TRIM(nic)) = :s5 
                OR LOWER(TRIM(phone)) = :s6 
                OR TRIM(id) = :s7
            ) LIMIT 1");
            $sStmt->execute([
                's1' => $cleanIdentifier,
                's2' => $cleanIdentifier,
                's3' => $cleanIdentifier,
                's4' => $cleanIdentifier,
                's5' => $cleanIdentifier,
                's6' => $cleanIdentifier,
                's7' => trim($username)
            ]);
            $student = $sStmt->fetch();
            if ($student) {
                $user = [
                    'id' => $student['id'],
                    'username' => $student['customId'] ?? $student['indexNumber'] ?? $student['name'],
                    'customId' => $student['customId'] ?? $student['indexNumber'] ?? 'STD-001',
                    'indexNumber' => $student['indexNumber'] ?? $student['admissionNo'] ?? 'STD-001',
                    'name' => $student['name'],
                    'monkName' => $student['monkName'] ?? null,
                    'email' => $student['email'] ?? '',
                    'phone' => $student['phone'] ?? '',
                    'role' => 'student',
                    'pirivenaClass' => $student['pirivenaClass'] ?? null,
                    'plain_password' => $student['plain_password'] ?? '',
                    'password' => $student['password'] ?? null,
                    'status' => $student['status'] ?? 'active'
                ];
            }
        } catch (Exception $eStd) {}
    }

    if ($user) {
        if (isset($user['status']) && strtolower($user['status']) === 'inactive') {
            sendJsonResponse(["error" => "ඔබගේ ගිණුම අක්‍රීය කර ඇත (Account is Inactive). කරුණාකර පිරිවෙන් පාලනාධිකාරිය හමුවන්න."], 403);
        }

        // Strict Password Verification: match against bcrypt hash or transparently upgrade legacy plain password
        $pwdMatch = false;
        $plainPass = isset($user['plain_password']) ? trim($user['plain_password']) : '';
        $hashPass = isset($user['password']) ? trim($user['password']) : '';

        if (!empty($hashPass) && password_verify($password, $hashPass)) {
            $pwdMatch = true;
        } elseif (!empty($plainPass) && hash_equals($plainPass, $password)) {
            $pwdMatch = true;
            // Transparently upgrade legacy plain password to secure bcrypt hash
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            try {
                $targetUid = $user['id'] ?? ($user['customId'] ?? '');
                @$db->prepare("UPDATE users SET password = :p, plain_password = NULL WHERE id = :id OR customId = :id")->execute(['p' => $newHash, 'id' => $targetUid]);
                @$db->prepare("UPDATE teachers SET password = :p, plain_password = NULL WHERE id = :id OR customId = :id")->execute(['p' => $newHash, 'id' => $targetUid]);
                @$db->prepare("UPDATE students SET password = :p, plain_password = NULL WHERE id = :id OR customId = :id")->execute(['p' => $newHash, 'id' => $targetUid]);
            } catch (Exception $eUpgrade) {}
        } elseif (!empty($hashPass) && hash_equals($hashPass, $password)) {
            // Legacy plain password stored directly in password column
            $pwdMatch = true;
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            try {
                $targetUid = $user['id'] ?? ($user['customId'] ?? '');
                @$db->prepare("UPDATE users SET password = :p, plain_password = NULL WHERE id = :id OR customId = :id")->execute(['p' => $newHash, 'id' => $targetUid]);
                @$db->prepare("UPDATE teachers SET password = :p, plain_password = NULL WHERE id = :id OR customId = :id")->execute(['p' => $newHash, 'id' => $targetUid]);
                @$db->prepare("UPDATE students SET password = :p, plain_password = NULL WHERE id = :id OR customId = :id")->execute(['p' => $newHash, 'id' => $targetUid]);
            } catch (Exception $eUpgrade2) {}
        }

        if ($pwdMatch) {
            $rawRole = strtolower($user['role'] ?? '');
            if (in_array($rawRole, ['superadmin', 'admin', 'administrator', 'principal'])) {
                $user['role'] = 'admin';
            } elseif ($rawRole === 'teacher') {
                $user['role'] = 'teacher';
            } else {
                $user['role'] = 'student';
            }

            // Generates secure token for session
            $token = 'token_' . bin2hex(random_bytes(16));
            try {
                $targetId = $user['id'] ?? ($user['customId'] ?? $user['indexNumber'] ?? '');
                $targetCid = $user['customId'] ?? ($user['indexNumber'] ?? $user['id'] ?? '');

                // 1. Update users table if exists
                $upUsers = $db->prepare("UPDATE users SET token = :token WHERE id = :id OR customId = :cid OR indexNumber = :idx");
                $upUsers->execute(['token' => $token, 'id' => $targetId, 'cid' => $targetCid, 'idx' => $targetCid]);
                $userAffected = $upUsers->rowCount();

                // 2. Also update teachers table
                @$db->prepare("UPDATE teachers SET token = :token WHERE id = :id OR customId = :cid")->execute(['token' => $token, 'id' => $targetId, 'cid' => $targetCid]);

                // 3. Also update students table
                @$db->prepare("UPDATE students SET token = :token WHERE id = :id OR customId = :cid OR indexNumber = :idx OR admissionNo = :adm")->execute([
                    'token' => $token,
                    'id' => $targetId,
                    'cid' => $targetCid,
                    'idx' => $targetCid,
                    'adm' => $targetCid
                ]);

                // 4. If user was not yet in users table, insert into users table so users endpoint succeeds
                if ($userAffected === 0) {
                    try {
                        $uCols = getTableColumns($db, 'users');
                        $insData = [
                            'id' => $targetId ?: $targetCid,
                            'customId' => $targetCid,
                            'indexNumber' => $targetCid,
                            'username' => $user['username'] ?? $targetCid,
                            'name' => $user['name'] ?? '',
                            'monkName' => $user['monkName'] ?? null,
                            'email' => $user['email'] ?? null,
                            'phone' => $user['phone'] ?? null,
                            'role' => $user['role'] ?? 'student',
                            'token' => $token,
                            'plain_password' => null,
                            'password' => (!empty($hashPass) && strpos($hashPass, '$2y$') === 0) ? $hashPass : password_hash($password, PASSWORD_DEFAULT),
                            'status' => $user['status'] ?? 'active',
                            'pirivenaClass' => $user['pirivenaClass'] ?? ($user['classId'] ?? null),
                            'classId' => $user['classId'] ?? ($user['pirivenaClass'] ?? null)
                        ];
                        $cList = [];
                        $pList = [];
                        $params = [];
                        foreach ($insData as $col => $val) {
                            if (in_array($col, $uCols)) {
                                $cList[] = "`{$col}`";
                                $pList[] = ":{$col}";
                                $params[$col] = $val;
                            }
                        }
                        if (!empty($cList)) {
                            $db->prepare("INSERT INTO users (" . implode(',', $cList) . ") VALUES (" . implode(',', $pList) . ") ON DUPLICATE KEY UPDATE token = VALUES(token)")->execute($params);
                        }
                    } catch (Exception $eSync) {}
                }
            } catch (Exception $eTok) {}

            // Clear rate limit on successful login
            try {
                $db->prepare("DELETE FROM login_rate_limits WHERE ip_address = :ip")->execute(['ip' => $clientIp]);
            } catch (Exception $eDelRL) {}

            unset($user['password'], $user['plain_password'], $user['passwordHash']);
            $formattedUser = formatUserRecord($user, $db);
            
            // 🛡️ Privacy Guard: Passwords and hashes are NEVER returned to the client
            unset($formattedUser['password'], $formattedUser['plain_password'], $formattedUser['passwordHash']);
            
            // Record Audit Trail
            logAuditEvent('පද්ධතියට පිවිසීම (User Login)', "පරිශීලක '{$formattedUser['name']}' ({$formattedUser['role']}) සාර්ථකව පද්ධතියට පිවිසුණි.", 'Auth', $formattedUser['name'], $formattedUser['id']);

            sendJsonResponse([
                "success" => true,
                "token" => $token,
                "user" => $formattedUser
            ]);
        } else {
            // Increment failed attempt counter
            try {
                $db->prepare("INSERT INTO login_rate_limits (ip_address, attempts, last_attempt) VALUES (:ip, 1, NOW()) ON DUPLICATE KEY UPDATE attempts = attempts + 1, last_attempt = NOW()")->execute(['ip' => $clientIp]);
            } catch (Exception $eIncRL) {}

            sendJsonResponse(["error" => "ඇතුළත් කළ මුරපදය (Password) වැරදියි. කරුණාකර ඔබගේ නිවැරදි මුරපදය ඇතුළත් කරන්න."], 401);
        }
    } else {
        // Increment failed attempt counter
        try {
            $db->prepare("INSERT INTO login_rate_limits (ip_address, attempts, last_attempt) VALUES (:ip, 1, NOW()) ON DUPLICATE KEY UPDATE attempts = attempts + 1, last_attempt = NOW()")->execute(['ip' => $clientIp]);
        } catch (Exception $eIncRL2) {}

        sendJsonResponse(["error" => "ඇතුළත් කළ පරිශීලක ID / Gmail පද්ධතියේ හමු නොවීය. කරුණාකර නිවැරදි තොරතුරු ඇතුළත් කරන්න."], 401);
    }
}

// GET /api/auth/me or GET /api/auth
if ($method === 'GET') {
    $user = getAuthUser();
    if ($user) {
        unset($user['password'], $user['plain_password'], $user['token'], $user['passwordHash']);
        $formatted = formatUserRecord($user, $db);
        unset($formatted['password'], $formatted['plain_password'], $formatted['passwordHash'], $formatted['token']);
        sendJsonResponse(["success" => true, "authenticated" => true, "user" => $formatted]);
    } else {
        // Return clean 200 with user null for fresh/unauthenticated sessions
        sendJsonResponse(["success" => false, "authenticated" => false, "user" => null], 200);
    }
}

sendJsonResponse(["error" => "Method not allowed"], 405);
