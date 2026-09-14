<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'news.php' && $lastPart !== 'news' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

// 1. GET News
if ($method === 'GET') {
    if ($pathId) {
        $stmt = $db->prepare("SELECT * FROM news WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $pathId]);
        $newsItem = $stmt->fetch();
        if ($newsItem) {
            sendJsonResponse($newsItem);
        } else {
            sendJsonResponse(["error" => "News article not found"], 404);
        }
    } else {
        $stmt = $db->query("SELECT * FROM news ORDER BY publishedDate DESC, created_at DESC");
        $news = $stmt->fetchAll();
        sendJsonResponse($news);
    }
}

// 2. POST News
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : 'news-' . time() . '-' . rand(100, 999);
    $title = isset($body['title']) ? trim($body['title']) : '';
    $titleSinhala = isset($body['titleSinhala']) ? trim($body['titleSinhala']) : $title;
    $category = isset($body['category']) ? trim($body['category']) : 'General';
    $summarySinhala = isset($body['summarySinhala']) ? trim($body['summarySinhala']) : (isset($body['summary']) ? trim($body['summary']) : '');
    $contentSinhala = isset($body['contentSinhala']) ? trim($body['contentSinhala']) : (isset($body['content']) ? trim($body['content']) : '');
    $imageUrl = isset($body['imageUrl']) ? trim($body['imageUrl']) : '';
    $author = isset($body['author']) ? trim($body['author']) : 'පිරිවෙන් පාලක සභාව';
    $publishedDate = isset($body['publishedDate']) ? trim($body['publishedDate']) : date('Y-m-d');
    $isFeatured = !empty($body['isFeatured']) ? 1 : 0;

    if (empty($titleSinhala)) {
        sendJsonResponse(["error" => "News title is required."], 400);
    }

    $stmt = $db->prepare("INSERT INTO news (id, title, titleSinhala, category, summarySinhala, contentSinhala, imageUrl, author, publishedDate, isFeatured) 
        VALUES (:id, :t, :tsi, :cat, :sum, :cnt, :img, :auth, :pdate, :feat)
        ON DUPLICATE KEY UPDATE title = VALUES(title), titleSinhala = VALUES(titleSinhala), category = VALUES(category), summarySinhala = VALUES(summarySinhala), contentSinhala = VALUES(contentSinhala), imageUrl = VALUES(imageUrl), author = VALUES(author), publishedDate = VALUES(publishedDate), isFeatured = VALUES(isFeatured)");

    $stmt->execute([
        'id' => $id,
        't' => $title,
        'tsi' => $titleSinhala,
        'cat' => $category,
        'sum' => $summarySinhala,
        'cnt' => $contentSinhala,
        'img' => $imageUrl,
        'auth' => $author,
        'pdate' => $publishedDate,
        'feat' => $isFeatured
    ]);

    sendJsonResponse([
        "success" => true,
        "item" => [
            "id" => $id,
            "title" => $title,
            "titleSinhala" => $titleSinhala,
            "category" => $category,
            "publishedDate" => $publishedDate,
            "imageUrl" => $imageUrl
        ]
    ], 201);
}

// 3. PUT News
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $newsId = $pathId ?: (isset($body['id']) ? $body['id'] : null);

    if (!$newsId) {
        sendJsonResponse(["error" => "News ID is required for update"], 400);
    }

    $stmt = $db->prepare("SELECT * FROM news WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $newsId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        sendJsonResponse(["error" => "News article not found"], 404);
    }

    $title = isset($body['title']) ? trim($body['title']) : $existing['title'];
    $titleSinhala = isset($body['titleSinhala']) ? trim($body['titleSinhala']) : ($existing['titleSinhala'] ?? $title);
    $category = isset($body['category']) ? trim($body['category']) : $existing['category'];
    $summarySinhala = isset($body['summarySinhala']) ? trim($body['summarySinhala']) : (isset($body['summary']) ? trim($body['summary']) : ($existing['summarySinhala'] ?? ''));
    $contentSinhala = isset($body['contentSinhala']) ? trim($body['contentSinhala']) : (isset($body['content']) ? trim($body['content']) : ($existing['contentSinhala'] ?? ''));
    $imageUrl = isset($body['imageUrl']) ? trim($body['imageUrl']) : $existing['imageUrl'];
    $author = isset($body['author']) ? trim($body['author']) : $existing['author'];
    $publishedDate = isset($body['publishedDate']) ? trim($body['publishedDate']) : $existing['publishedDate'];
    $isFeatured = isset($body['isFeatured']) ? (!empty($body['isFeatured']) ? 1 : 0) : $existing['isFeatured'];

    $stmt = $db->prepare("UPDATE news SET title = :t, titleSinhala = :tsi, category = :cat, summarySinhala = :sum, contentSinhala = :cnt, imageUrl = :img, author = :auth, publishedDate = :pdate, isFeatured = :feat WHERE id = :id");
    $stmt->execute([
        'id' => $newsId,
        't' => $title,
        'tsi' => $titleSinhala,
        'cat' => $category,
        'sum' => $summarySinhala,
        'cnt' => $contentSinhala,
        'img' => $imageUrl,
        'auth' => $author,
        'pdate' => $publishedDate,
        'feat' => $isFeatured
    ]);

    sendJsonResponse(["success" => true, "message" => "News article updated successfully"]);
}

// 4. DELETE News
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $newsId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($_GET['id']) ? $_GET['id'] : null));

    if (!$newsId) {
        sendJsonResponse(["error" => "News ID is required"], 400);
    }

    try {
        $stmtSel = $db->prepare("SELECT imageUrl FROM news WHERE id = :id LIMIT 1");
        $stmtSel->execute(['id' => $newsId]);
        $nw = $stmtSel->fetch();
        if ($nw && !empty($nw['imageUrl'])) {
            deleteUploadedFile($nw['imageUrl']);
        }
    } catch (Exception $e) {}

    $stmt = $db->prepare("DELETE FROM news WHERE id = :id");
    $stmt->execute(['id' => $newsId]);

    sendJsonResponse(["success" => true, "id" => $newsId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
