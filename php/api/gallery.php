<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'gallery.php' && $lastPart !== 'gallery' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

// Helper to format gallery items for React UI
function formatGalleryRecord($item) {
    if (!$item || !is_array($item)) return $item;
    $url = !empty($item['imageUrl']) ? $item['imageUrl'] : (!empty($item['url']) ? $item['url'] : '');
    $title = !empty($item['titleSinhala']) ? $item['titleSinhala'] : (!empty($item['title']) ? $item['title'] : 'ඡායාරූපය');
    $item['imageUrl'] = $url;
    $item['url'] = $url;
    $item['title'] = $title;
    $item['titleSinhala'] = $title;
    return $item;
}

// 1. GET Gallery
if ($method === 'GET') {
    if ($pathId) {
        $stmt = $db->prepare("SELECT * FROM gallery WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $pathId]);
        $item = $stmt->fetch();
        if ($item) {
            sendJsonResponse(formatGalleryRecord($item));
        } else {
            sendJsonResponse(["error" => "Gallery item not found"], 404);
        }
    } else {
        $stmt = $db->query("SELECT * FROM gallery ORDER BY created_at DESC");
        $gallery = $stmt->fetchAll();
        foreach ($gallery as &$g) {
            $g = formatGalleryRecord($g);
        }
        sendJsonResponse($gallery);
    }
}

// 2. POST Gallery
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : 'gal-' . time() . '-' . rand(100, 999);
    $title = isset($body['title']) && !empty($body['title']) ? trim($body['title']) : (isset($body['titleSinhala']) ? trim($body['titleSinhala']) : '');
    $titleSinhala = isset($body['titleSinhala']) && !empty($body['titleSinhala']) ? trim($body['titleSinhala']) : $title;
    $category = isset($body['category']) ? trim($body['category']) : 'Events';
    
    // Support both imageUrl and url properties
    $imageUrl = isset($body['imageUrl']) && !empty($body['imageUrl']) 
        ? trim($body['imageUrl']) 
        : (isset($body['url']) && !empty($body['url']) ? trim($body['url']) : '');
        
    $descriptionSinhala = isset($body['descriptionSinhala']) ? trim($body['descriptionSinhala']) : '';

    if (empty($imageUrl)) {
        // Fallback default image if not provided
        $imageUrl = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800';
    }

    $stmt = $db->prepare("INSERT INTO gallery (id, title, titleSinhala, category, imageUrl, descriptionSinhala, date) 
        VALUES (:id, :t, :tsi, :cat, :url, :desc, :dt)
        ON DUPLICATE KEY UPDATE title = VALUES(title), titleSinhala = VALUES(titleSinhala), category = VALUES(category), imageUrl = VALUES(imageUrl), descriptionSinhala = VALUES(descriptionSinhala)");

    $stmt->execute([
        'id' => $id,
        't' => $title,
        'tsi' => $titleSinhala,
        'cat' => $category,
        'url' => $imageUrl,
        'desc' => $descriptionSinhala,
        'dt' => date('Y-m-d')
    ]);

    logAuditEvent("නව ඡායාරූපයක් ගැලරියට එක් කිරීම (Gallery Photo Added)", "ඡායාරූපය: '{$titleSinhala}' ({$category}) සාර්ථකව පද්ධතියට එක් කරන ලදී.", 'Gallery');

    $resItem = formatGalleryRecord([
        "id" => $id,
        "title" => $title,
        "titleSinhala" => $titleSinhala,
        "category" => $category,
        "imageUrl" => $imageUrl,
        "url" => $imageUrl,
        "descriptionSinhala" => $descriptionSinhala,
        "date" => date('Y-m-d')
    ]);

    sendJsonResponse([
        "success" => true,
        "item" => $resItem
    ], 201);
}

// 3. PUT Gallery
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $galId = $pathId ?: (isset($body['id']) ? $body['id'] : null);

    if (!$galId) {
        sendJsonResponse(["error" => "Gallery ID is required"], 400);
    }

    $stmt = $db->prepare("SELECT * FROM gallery WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $galId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        sendJsonResponse(["error" => "Gallery item not found"], 404);
    }

    $title = isset($body['title']) ? trim($body['title']) : $existing['title'];
    $titleSinhala = isset($body['titleSinhala']) ? trim($body['titleSinhala']) : $existing['titleSinhala'];
    $category = isset($body['category']) ? trim($body['category']) : $existing['category'];
    
    $imageUrl = isset($body['imageUrl']) && !empty($body['imageUrl']) 
        ? trim($body['imageUrl']) 
        : (isset($body['url']) && !empty($body['url']) ? trim($body['url']) : $existing['imageUrl']);
        
    $descriptionSinhala = array_key_exists('descriptionSinhala', $body) ? trim($body['descriptionSinhala']) : $existing['descriptionSinhala'];

    $stmt = $db->prepare("UPDATE gallery SET title = :t, titleSinhala = :tsi, category = :cat, imageUrl = :url, descriptionSinhala = :desc WHERE id = :id");
    $stmt->execute([
        'id' => $galId,
        't' => $title,
        'tsi' => $titleSinhala,
        'cat' => $category,
        'url' => $imageUrl,
        'desc' => $descriptionSinhala
    ]);

    sendJsonResponse(["success" => true, "message" => "Gallery item updated successfully"]);
}

// 4. DELETE Gallery
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $galId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($_GET['id']) ? $_GET['id'] : null));

    if (!$galId) {
        sendJsonResponse(["error" => "Gallery ID is required"], 400);
    }

    try {
        $stmtSel = $db->prepare("SELECT * FROM gallery WHERE id = :id LIMIT 1");
        $stmtSel->execute(['id' => $galId]);
        $gal = $stmtSel->fetch();
        if ($gal) {
            $imgUrl = !empty($gal['imageUrl']) ? $gal['imageUrl'] : (!empty($gal['url']) ? $gal['url'] : '');
            if (!empty($imgUrl)) {
                deleteUploadedFile($imgUrl);
            }
        }
    } catch (Exception $e) {}

    $stmt = $db->prepare("DELETE FROM gallery WHERE id = :id");
    $stmt->execute(['id' => $galId]);

    logAuditEvent("ගැලරි ඡායාරූපයක් ඉවත් කිරීම (Gallery Photo Deleted)", "ඡායාරූප ID: '{$galId}' සහ අදාළ ගොනුව පද්ධතියෙන් ඉවත් කරන ලදී.", 'Gallery');

    sendJsonResponse(["success" => true, "id" => $galId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
