<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'events.php' && $lastPart !== 'events' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

// 1. GET Events
if ($method === 'GET') {
    if ($pathId) {
        $stmt = $db->prepare("SELECT * FROM events WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $pathId]);
        $event = $stmt->fetch();
        if ($event) {
            sendJsonResponse($event);
        } else {
            sendJsonResponse(["error" => "Event not found"], 404);
        }
    } else {
        $stmt = $db->query("SELECT * FROM events ORDER BY date DESC, created_at DESC");
        $events = $stmt->fetchAll();
        sendJsonResponse($events);
    }
}

// 2. POST Event
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : 'evt-' . time() . '-' . rand(100, 999);
    $title = isset($body['title']) ? trim($body['title']) : '';
    $titleSinhala = isset($body['titleSinhala']) ? trim($body['titleSinhala']) : $title;
    $date = isset($body['date']) ? trim($body['date']) : date('Y-m-d');
    $time = isset($body['time']) ? trim($body['time']) : '09:00 AM';
    $location = isset($body['location']) ? trim($body['location']) : 'ශ්‍රී සුමන මහා පිරිවෙන් ශාලාව';
    $category = isset($body['category']) ? trim($body['category']) : 'Religious';
    $descriptionSinhala = isset($body['descriptionSinhala']) ? trim($body['descriptionSinhala']) : (isset($body['description']) ? trim($body['description']) : '');
    $imageUrl = isset($body['imageUrl']) ? trim($body['imageUrl']) : '';

    if (empty($titleSinhala)) {
        sendJsonResponse(["error" => "Event title is required."], 400);
    }

    $stmt = $db->prepare("INSERT INTO events (id, title, titleSinhala, date, time, location, category, descriptionSinhala, imageUrl) 
        VALUES (:id, :t, :tsi, :dt, :tm, :loc, :cat, :desc, :img)
        ON DUPLICATE KEY UPDATE title = VALUES(title), titleSinhala = VALUES(titleSinhala), date = VALUES(date), time = VALUES(time), location = VALUES(location), category = VALUES(category), descriptionSinhala = VALUES(descriptionSinhala), imageUrl = VALUES(imageUrl)");

    $stmt->execute([
        'id' => $id,
        't' => $title,
        'tsi' => $titleSinhala,
        'dt' => $date,
        'tm' => $time,
        'loc' => $location,
        'cat' => $category,
        'desc' => $descriptionSinhala,
        'img' => $imageUrl
    ]);

    $item = [
        "id" => $id,
        "title" => $title,
        "titleSinhala" => $titleSinhala,
        "date" => $date,
        "time" => $time,
        "location" => $location,
        "category" => $category,
        "imageUrl" => $imageUrl
    ];

    sendJsonResponse(["success" => true, "item" => $item], 201);
}

// 3. PUT Event
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $eventId = $pathId ?: (isset($body['id']) ? $body['id'] : null);

    if (!$eventId) {
        sendJsonResponse(["error" => "Event ID is required"], 400);
    }

    $stmt = $db->prepare("SELECT * FROM events WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $eventId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        sendJsonResponse(["error" => "Event not found"], 404);
    }

    $title = isset($body['title']) ? trim($body['title']) : $existing['title'];
    $titleSinhala = isset($body['titleSinhala']) ? trim($body['titleSinhala']) : $existing['titleSinhala'];
    $date = isset($body['date']) ? trim($body['date']) : $existing['date'];
    $time = isset($body['time']) ? trim($body['time']) : $existing['time'];
    $location = isset($body['location']) ? trim($body['location']) : $existing['location'];
    $category = isset($body['category']) ? trim($body['category']) : $existing['category'];
    $descriptionSinhala = array_key_exists('descriptionSinhala', $body) ? trim($body['descriptionSinhala']) : $existing['descriptionSinhala'];
    $imageUrl = array_key_exists('imageUrl', $body) ? trim($body['imageUrl']) : $existing['imageUrl'];

    $stmt = $db->prepare("UPDATE events SET title = :t, titleSinhala = :tsi, date = :dt, time = :tm, location = :loc, category = :cat, descriptionSinhala = :desc, imageUrl = :img WHERE id = :id");
    $stmt->execute([
        'id' => $eventId,
        't' => $title,
        'tsi' => $titleSinhala,
        'dt' => $date,
        'tm' => $time,
        'loc' => $location,
        'cat' => $category,
        'desc' => $descriptionSinhala,
        'img' => $imageUrl
    ]);

    sendJsonResponse(["success" => true, "message" => "Event updated successfully"]);
}

// 4. DELETE Event
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $eventId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($_GET['id']) ? $_GET['id'] : null));

    if (!$eventId) {
        sendJsonResponse(["error" => "Event ID is required"], 400);
    }

    try {
        $stmtSel = $db->prepare("SELECT imageUrl FROM events WHERE id = :id LIMIT 1");
        $stmtSel->execute(['id' => $eventId]);
        $evt = $stmtSel->fetch();
        if ($evt && !empty($evt['imageUrl'])) {
            deleteUploadedFile($evt['imageUrl']);
        }
    } catch (Exception $e) {}

    $stmt = $db->prepare("DELETE FROM events WHERE id = :id");
    $stmt->execute(['id' => $eventId]);

    sendJsonResponse(["success" => true, "id" => $eventId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
