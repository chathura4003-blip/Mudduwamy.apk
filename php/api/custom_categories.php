<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET /api/custom-categories?section=news
if ($method === 'GET') {
    $section = isset($_GET['section']) ? trim($_GET['section']) : '';
    if (!empty($section)) {
        $stmt = $db->prepare("SELECT * FROM custom_categories WHERE section = :section ORDER BY id ASC");
        $stmt->execute(['section' => $section]);
    } else {
        $stmt = $db->query("SELECT * FROM custom_categories ORDER BY section ASC, id ASC");
    }
    $categories = $stmt->fetchAll();
    sendJsonResponse($categories);
}

// POST /api/custom-categories (Add Custom Category)
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $section = isset($body['section']) ? trim($body['section']) : 'news';
    $nameSinhala = isset($body['nameSinhala']) ? trim($body['nameSinhala']) : (isset($body['name_sinhala']) ? trim($body['name_sinhala']) : '');
    $nameEnglish = isset($body['nameEnglish']) ? trim($body['nameEnglish']) : (isset($body['name_english']) ? trim($body['name_english']) : $nameSinhala);
    $categoryCode = isset($body['categoryCode']) ? trim($body['categoryCode']) : 'Custom_' . time();
    $description = isset($body['description']) ? trim($body['description']) : '';

    if (empty($nameSinhala)) {
        sendJsonResponse(["error" => "Category name in Sinhala is required."], 400);
    }

    $stmt = $db->prepare("INSERT INTO custom_categories (section, category_code, name_sinhala, name_english, description, is_default) VALUES (:section, :code, :name_si, :name_en, :desc, 0)");
    $stmt->execute([
        'section' => $section,
        'code' => $categoryCode,
        'name_si' => $nameSinhala,
        'name_en' => $nameEnglish,
        'desc' => $description
    ]);

    $newId = $db->lastInsertId();
    sendJsonResponse([
        "success" => true,
        "message" => "Custom category created successfully under classification.",
        "category" => [
            "id" => $newId,
            "section" => $section,
            "categoryCode" => $categoryCode,
            "nameSinhala" => $nameSinhala,
            "nameEnglish" => $nameEnglish,
            "description" => $description
        ]
    ], 201);
}

// DELETE /api/custom-categories?id=123
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if ($id <= 0) {
        sendJsonResponse(["error" => "Invalid Category ID."], 400);
    }
    $stmt = $db->prepare("DELETE FROM custom_categories WHERE id = :id AND is_default = 0");
    $stmt->execute(['id' => $id]);
    sendJsonResponse(["success" => true, "message" => "Category deleted successfully."]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);
