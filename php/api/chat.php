<?php
/**
 * Real-Time Ephemeral Chat API for Sri Sumana Maha Pirivena ERP
 * Supports 24-Hour Auto-Purge, Multi-Room Channels, Rich Media (Images, PDFs, Links) & Reactions
 */

require_once __DIR__ . '/../config.php';

// Ensure table exists
function ensureChatTableExists($pdo) {
    if (!$pdo) return;
    try {
        $sql = "CREATE TABLE IF NOT EXISTS chat_messages (
            id VARCHAR(64) PRIMARY KEY,
            room_id VARCHAR(64) NOT NULL DEFAULT 'general',
            sender_id VARCHAR(64) NOT NULL,
            sender_name VARCHAR(255) NOT NULL,
            sender_role VARCHAR(32) NOT NULL,
            sender_avatar TEXT NULL,
            message_type VARCHAR(32) NOT NULL DEFAULT 'text',
            content TEXT NOT NULL,
            attachment_url TEXT NULL,
            attachment_name VARCHAR(255) NULL,
            attachment_size VARCHAR(64) NULL,
            reactions TEXT NULL,
            reply_to_id VARCHAR(64) NULL,
            reply_to_name VARCHAR(255) NULL,
            reply_to_content TEXT NULL,
            is_pinned TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            expires_at DATETIME NOT NULL,
            INDEX idx_room (room_id),
            INDEX idx_created (created_at),
            INDEX idx_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
        $pdo->exec($sql);

        // Auto-migrate columns if table already existed without them
        try {
            $pdo->exec("ALTER TABLE chat_messages ADD COLUMN reply_to_id VARCHAR(64) NULL AFTER reactions");
        } catch (Throwable $ign) {}
        try {
            $pdo->exec("ALTER TABLE chat_messages ADD COLUMN reply_to_name VARCHAR(255) NULL AFTER reply_to_id");
        } catch (Throwable $ign) {}
        try {
            $pdo->exec("ALTER TABLE chat_messages ADD COLUMN reply_to_content TEXT NULL AFTER reply_to_name");
        } catch (Throwable $ign) {}
    } catch (Throwable $e) {
        error_log("Failed to ensure chat_messages table: " . $e->getMessage());
    }
}

// Auto-purge messages older than 24 hours (unless pinned)
function autoPurgeExpiredChatMessages($pdo) {
    if (!$pdo) return;
    try {
        $purgeSql = "DELETE FROM chat_messages 
                     WHERE is_pinned = 0 
                     AND (expires_at <= NOW() OR created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR))";
        $pdo->exec($purgeSql);
    } catch (Throwable $e) {
        error_log("Failed to purge expired chat messages: " . $e->getMessage());
    }
}

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Probabilistic auto-purge for zero database lag
if ($method === 'POST' || mt_rand(1, 40) === 1) {
    autoPurgeExpiredChatMessages($pdo);
}

$pathInfo = $_SERVER['PATH_INFO'] ?? '';
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);

// Helper to sanitize reactions JSON
function parseReactions($raw) {
    if (empty($raw)) return [];
    if (is_array($raw)) return $raw;
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

// -------------------------------------------------------------------------
// GET: Fetch Messages for a Room or List Available Rooms
// -------------------------------------------------------------------------
if ($method === 'GET') {
    $authUser = getAuthUser();
    $roomId = isset($_GET['room_id']) && trim($_GET['room_id']) !== '' 
        ? trim($_GET['room_id']) 
        : (isset($_GET['room']) && trim($_GET['room']) !== '' ? trim($_GET['room']) : 'general');

    if (!$authUser) {
        // Return clean empty message list for unauthenticated callers (Zero data leakage & no 401 console error)
        sendJsonResponse([
            "room_id" => $roomId,
            "count" => 0,
            "messages" => []
        ], 200);
    }
    $sinceId = isset($_GET['since']) ? trim($_GET['since']) : null;
    $limit = isset($_GET['limit']) ? min(100, max(10, (int)$_GET['limit'])) : 60;

    try {
        if ($sinceId) {
            $stmt = $pdo->prepare("SELECT * FROM chat_messages 
                                   WHERE room_id = :room_id AND id > :since_id 
                                   ORDER BY created_at ASC LIMIT " . (int)$limit);
            $stmt->execute([
                ':room_id' => $roomId,
                ':since_id' => $sinceId
            ]);
            $rawMessages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM chat_messages 
                                   WHERE room_id = :room_id 
                                   ORDER BY created_at DESC LIMIT " . (int)$limit);
            $stmt->execute([':room_id' => $roomId]);
            $rawDesc = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $rawMessages = array_reverse($rawDesc);
        }

        $formatted = array_map(function($msg) {
            return [
                "id" => $msg['id'],
                "room_id" => $msg['room_id'],
                "sender_id" => $msg['sender_id'],
                "sender_name" => $msg['sender_name'],
                "sender_role" => $msg['sender_role'],
                "sender_avatar" => $msg['sender_avatar'],
                "message_type" => $msg['message_type'],
                "content" => $msg['content'],
                "attachment_url" => $msg['attachment_url'],
                "attachment_name" => $msg['attachment_name'],
                "attachment_size" => $msg['attachment_size'],
                "reactions" => parseReactions($msg['reactions'] ?? null),
                "reply_to_id" => $msg['reply_to_id'] ?? null,
                "reply_to_name" => $msg['reply_to_name'] ?? null,
                "reply_to_content" => $msg['reply_to_content'] ?? null,
                "is_pinned" => (bool)($msg['is_pinned'] ?? 0),
                "created_at" => $msg['created_at'],
                "expires_at" => $msg['expires_at']
            ];
        }, $rawMessages ?: []);

        sendJsonResponse([
            "room_id" => $roomId,
            "count" => count($formatted),
            "messages" => $formatted
        ]);
    } catch (Throwable $e) {
        // Auto-create table if missing and return empty list cleanly
        ensureChatTableExists($pdo);
        sendJsonResponse([
            "room_id" => $roomId,
            "count" => 0,
            "messages" => []
        ]);
    }
}

// -------------------------------------------------------------------------
// POST: Send a New Chat Message / Action
// -------------------------------------------------------------------------
if ($method === 'POST') {
    $authUser = requireAuth();
    ensureChatTableExists($pdo);

    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    // Check if it's a pin toggle
    if (isset($body['action']) && $body['action'] === 'toggle_pin') {
        $messageId = $body['message_id'] ?? '';
        if (empty($messageId)) {
            sendJsonResponse(["error" => "message_id is required."], 400);
        }
        try {
            $stmt = $pdo->prepare("SELECT is_pinned FROM chat_messages WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $messageId]);
            $curr = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$curr) {
                sendJsonResponse(["error" => "Message not found."], 404);
            }
            $newPin = !empty($curr['is_pinned']) ? 0 : 1;
            $upStmt = $pdo->prepare("UPDATE chat_messages SET is_pinned = :pinned WHERE id = :id");
            $upStmt->execute([':pinned' => $newPin, ':id' => $messageId]);
            sendJsonResponse([
                "success" => true,
                "message_id" => $messageId,
                "is_pinned" => (bool)$newPin
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(["error" => "Failed to toggle pin: " . $e->getMessage()], 500);
        }
        exit();
    }
    
    // Check if it's a reaction toggle
    if (isset($body['action']) && $body['action'] === 'reaction') {
        $messageId = $body['message_id'] ?? '';
        $emoji = $body['emoji'] ?? '🙏';
        $userId = $body['user_id'] ?? '';
        $userName = $body['user_name'] ?? 'අනන්‍ය පරිශීලක';

        if (empty($messageId) || empty($userId)) {
            sendJsonResponse(["error" => "message_id and user_id are required."], 400);
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM chat_messages WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $messageId]);
            $msg = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$msg) {
                sendJsonResponse(["error" => "Message not found or expired."], 404);
            }

            $reactions = parseReactions($msg['reactions'] ?? null);
            
            // Toggle user in reaction
            $foundEmoji = false;
            foreach ($reactions as &$r) {
                if ($r['emoji'] === $emoji) {
                    $foundEmoji = true;
                    $users = is_array($r['users'] ?? null) ? $r['users'] : [];
                    $uIdx = array_search($userId, $users);
                    if ($uIdx !== false) {
                        array_splice($users, $uIdx, 1);
                    } else {
                        $users[] = $userId;
                    }
                    $r['users'] = $users;
                    $r['count'] = count($users);
                    break;
                }
            }
            unset($r);

            if (!$foundEmoji) {
                $reactions[] = [
                    'emoji' => $emoji,
                    'count' => 1,
                    'users' => [$userId]
                ];
            }

            // Clean up empty reaction entries
            $reactions = array_values(array_filter($reactions, function($r) {
                return ($r['count'] ?? 0) > 0;
            }));

            $upStmt = $pdo->prepare("UPDATE chat_messages SET reactions = :reactions WHERE id = :id");
            $upStmt->execute([
                ':reactions' => json_encode($reactions, JSON_UNESCAPED_UNICODE),
                ':id' => $messageId
            ]);

            sendJsonResponse([
                "success" => true,
                "message_id" => $messageId,
                "reactions" => $reactions
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(["error" => "Failed to update reaction: " . $e->getMessage()], 500);
        }
        exit();
    }

    // Normal message sending
    $content = trim($body['content'] ?? '');
    $senderId = trim($body['sender_id'] ?? $body['senderId'] ?? '');
    $senderName = trim($body['sender_name'] ?? $body['senderName'] ?? 'අනන්‍ය සාමාජික');
    $senderRole = trim($body['sender_role'] ?? $body['senderRole'] ?? 'student');
    $senderAvatar = $body['sender_avatar'] ?? $body['senderAvatar'] ?? null;
    $roomId = trim($body['room_id'] ?? $body['roomId'] ?? 'general');
    $messageType = trim($body['message_type'] ?? $body['messageType'] ?? 'text');
    $attachmentUrl = $body['attachment_url'] ?? $body['attachmentUrl'] ?? null;
    $attachmentName = $body['attachment_name'] ?? $body['attachmentName'] ?? null;
    $attachmentSize = $body['attachment_size'] ?? $body['attachmentSize'] ?? null;
    $replyToId = $body['reply_to_id'] ?? $body['replyToId'] ?? null;
    $replyToName = $body['reply_to_name'] ?? $body['replyToName'] ?? null;
    $replyToContent = $body['reply_to_content'] ?? $body['replyToContent'] ?? null;
    $isPinned = !empty($body['is_pinned'] || !empty($body['isPinned'])) ? 1 : 0;

    if (empty($content) && empty($attachmentUrl)) {
        sendJsonResponse(["error" => "Message content or attachment is required."], 400);
    }
    if (empty($senderId)) {
        sendJsonResponse(["error" => "Sender ID is required."], 400);
    }

    $id = 'msg_' . time() . '_' . substr(md5(uniqid(rand(), true)), 0, 8);
    $now = date('Y-m-d H:i:s');
    $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));

    try {
        $stmt = $pdo->prepare("INSERT INTO chat_messages (
            id, room_id, sender_id, sender_name, sender_role, sender_avatar,
            message_type, content, attachment_url, attachment_name, attachment_size,
            reactions, reply_to_id, reply_to_name, reply_to_content,
            is_pinned, created_at, expires_at
        ) VALUES (
            :id, :room_id, :sender_id, :sender_name, :sender_role, :sender_avatar,
            :message_type, :content, :attachment_url, :attachment_name, :attachment_size,
            :reactions, :reply_to_id, :reply_to_name, :reply_to_content,
            :is_pinned, :created_at, :expires_at
        )");

        $stmt->execute([
            ':id' => $id,
            ':room_id' => $roomId,
            ':sender_id' => $senderId,
            ':sender_name' => $senderName,
            ':sender_role' => $senderRole,
            ':sender_avatar' => $senderAvatar,
            ':message_type' => $messageType,
            ':content' => $content,
            ':attachment_url' => $attachmentUrl,
            ':attachment_name' => $attachmentName,
            ':attachment_size' => $attachmentSize,
            ':reactions' => json_encode([], JSON_UNESCAPED_UNICODE),
            ':reply_to_id' => $replyToId,
            ':reply_to_name' => $replyToName,
            ':reply_to_content' => $replyToContent,
            ':is_pinned' => $isPinned,
            ':created_at' => $now,
            ':expires_at' => $expiresAt,
        ]);

        // 🔔 Trigger OneSignal Push Notification for chat members
        try {
            if (class_exists('OneSignalService')) {
                $snippet = '';
                if ($messageType === 'image') {
                    $snippet = !empty($content) ? "📷 {$content}" : '📷 ඡායාරූපයක් (Photo)';
                } else if ($messageType === 'file' || $messageType === 'pdf') {
                    $docName = !empty($attachmentName) ? $attachmentName : 'ලේඛනයක් (Document)';
                    $snippet = "📄 {$docName}";
                } else {
                    $snippet = $content;
                }
                OneSignalService::notifyChatMessage($senderName, $roomId, $snippet, $senderId);
            }
        } catch (Throwable $eChatNotify) {}

        sendJsonResponse([
            "success" => true,
            "message" => [
                "id" => $id,
                "room_id" => $roomId,
                "sender_id" => $senderId,
                "sender_name" => $senderName,
                "sender_role" => $senderRole,
                "sender_avatar" => $senderAvatar,
                "message_type" => $messageType,
                "content" => $content,
                "attachment_url" => $attachmentUrl,
                "attachment_name" => $attachmentName,
                "attachment_size" => $attachmentSize,
                "reactions" => [],
                "reply_to_id" => $replyToId,
                "reply_to_name" => $replyToName,
                "reply_to_content" => $replyToContent,
                "is_pinned" => (bool)$isPinned,
                "created_at" => $now,
                "expires_at" => $expiresAt
            ]
        ], 201);
    } catch (Throwable $e) {
        sendJsonResponse(["error" => "Failed to send message: " . $e->getMessage()], 500);
    }
}

// -------------------------------------------------------------------------
// DELETE: Delete Single Message or Clear Entire Room
// -------------------------------------------------------------------------
if ($method === 'DELETE') {
    $authUser = requireAuth();
    $clearRoom = $_GET['clear_room'] ?? $_GET['clearRoom'] ?? null;
    if (!empty($clearRoom)) {
        $isAdmin = in_array(strtolower($authUser['role'] ?? ''), ['admin', 'superadmin']);
        if (!$isAdmin) {
            sendJsonResponse(["error" => "ප්‍රධාන පරිපාලක හට පමණක් සියලු පණිවිඩ මකා දැමිය හැක (Forbidden)."], 403);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM chat_messages WHERE room_id = :room_id");
            $stmt->execute([':room_id' => $clearRoom]);
            sendJsonResponse([
                "success" => true,
                "cleared_room" => $clearRoom,
                "message" => "All room messages cleared successfully."
            ]);
        } catch (Throwable $e) {
            sendJsonResponse(["error" => "Failed to clear room: " . $e->getMessage()], 500);
        }
        exit();
    }

    // Extract ID from URL query or path
    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        $parts = explode('/', trim($uri, '/'));
        $lastPart = end($parts);
        if ($lastPart && $lastPart !== 'chat') {
            $id = $lastPart;
        }
    }

    if (empty($id)) {
        sendJsonResponse(["error" => "Message ID is required for deletion."], 400);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM chat_messages WHERE id = :id");
        $stmt->execute([':id' => $id]);
        sendJsonResponse([
            "success" => true,
            "deleted_id" => $id,
            "message" => "Message deleted successfully."
        ]);
    } catch (Throwable $e) {
        sendJsonResponse(["error" => "Failed to delete message: " . $e->getMessage()], 500);
    }
}
