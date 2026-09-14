<?php
require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($requestUri, '/'));
$pathId = null;
if (count($parts) > 0) {
    $lastPart = end($parts);
    if ($lastPart !== 'library.php' && $lastPart !== 'library' && !empty($lastPart)) {
        $pathId = urldecode($lastPart);
    }
}

// Helper to format library records for React UI
function formatLibraryRecord($item) {
    if (!$item || !is_array($item)) return $item;
    $pdfUrl = !empty($item['pdfUrl']) ? $item['pdfUrl'] : (!empty($item['fileUrl']) ? $item['fileUrl'] : (!empty($item['downloadUrl']) ? $item['downloadUrl'] : ''));
    $title = !empty($item['titleSinhala']) ? $item['titleSinhala'] : (!empty($item['title']) ? $item['title'] : 'පුස්තකාල ග්‍රන්ථය');
    $category = !empty($item['category']) ? $item['category'] : (!empty($item['subject']) ? $item['subject'] : 'General');
    $item['pdfUrl'] = $pdfUrl;
    $item['fileUrl'] = $pdfUrl;
    $item['downloadUrl'] = $pdfUrl;
    $item['title'] = $title;
    $item['titleSinhala'] = $title;
    $item['category'] = $category;
    $item['subject'] = $category;
    $item['availableCopiesCount'] = isset($item['availableCopies']) ? intval($item['availableCopies']) : (isset($item['copies']) ? intval($item['copies']) : 10);
    return $item;
}

// 1. GET Library
if ($method === 'GET') {
    if ($pathId) {
        $stmt = $db->prepare("SELECT * FROM library WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $pathId]);
        $book = $stmt->fetch();
        if ($book) {
            sendJsonResponse(formatLibraryRecord($book));
        } else {
            sendJsonResponse(["error" => "Resource not found"], 404);
        }
    } else {
        $stmt = $db->query("SELECT * FROM library ORDER BY created_at DESC");
        $books = $stmt->fetchAll();
        foreach ($books as &$b) {
            $b = formatLibraryRecord($b);
        }
        sendJsonResponse($books);
    }
}

// 2. POST Library
if ($method === 'POST') {
    $authUser = requireRole(['admin', 'superadmin', 'teacher']);
    $body = getRequestBody();
    $id = isset($body['id']) && !empty($body['id']) ? trim($body['id']) : 'bk-' . time() . '-' . rand(100, 999);
    $title = isset($body['title']) ? trim($body['title']) : (isset($body['titleSinhala']) ? trim($body['titleSinhala']) : '');
    $titleSinhala = isset($body['titleSinhala']) && !empty($body['titleSinhala']) ? trim($body['titleSinhala']) : $title;
    $category = isset($body['category']) ? trim($body['category']) : (isset($body['subject']) ? trim($body['subject']) : 'General');
    $subject = $category;
    $grade = isset($body['grade']) ? trim($body['grade']) : (isset($body['sectionLevel']) ? trim($body['sectionLevel']) : 'All');
    
    // Support pdfUrl, fileUrl, downloadUrl
    $pdfUrl = isset($body['pdfUrl']) && !empty($body['pdfUrl']) && $body['pdfUrl'] !== '#'
        ? trim($body['pdfUrl']) 
        : (isset($body['fileUrl']) && !empty($body['fileUrl']) && $body['fileUrl'] !== '#'
            ? trim($body['fileUrl']) 
            : (isset($body['downloadUrl']) && !empty($body['downloadUrl']) ? trim($body['downloadUrl']) : ''));
            
    $fileSize = isset($body['fileSize']) ? trim($body['fileSize']) : '2.5 MB';
    $author = isset($body['author']) && !empty($body['author']) ? trim($body['author']) : 'පිරිවෙන් ගුරු මණ්ඩලය';
    $copies = isset($body['availableCopiesCount']) ? intval($body['availableCopiesCount']) : (isset($body['copies']) ? intval($body['copies']) : 10);

    if (empty($titleSinhala)) {
        sendJsonResponse(["error" => "Resource title is required."], 400);
    }

    try {
        $stmt = $db->prepare("INSERT INTO library (id, title, titleSinhala, category, subject, grade, sectionLevel, pdfUrl, fileUrl, fileSize, author, copies, availableCopies) 
            VALUES (:id, :t, :tsi, :cat, :sub, :gr, :sl, :purl, :furl, :fsz, :auth, :cp, :acp)
            ON DUPLICATE KEY UPDATE title = VALUES(title), titleSinhala = VALUES(titleSinhala), category = VALUES(category), subject = VALUES(subject), grade = VALUES(grade), sectionLevel = VALUES(sectionLevel), pdfUrl = VALUES(pdfUrl), fileUrl = VALUES(fileUrl), fileSize = VALUES(fileSize), author = VALUES(author), copies = VALUES(copies), availableCopies = VALUES(availableCopies)");

        $stmt->execute([
            'id' => $id,
            't' => $title,
            'tsi' => $titleSinhala,
            'cat' => $category,
            'sub' => $subject,
            'gr' => $grade,
            'sl' => $grade,
            'purl' => $pdfUrl,
            'furl' => $pdfUrl,
            'fsz' => $fileSize,
            'auth' => $author,
            'cp' => $copies,
            'acp' => $copies
        ]);
    } catch (Exception $ePost) {
        try {
            @$db->exec("ALTER TABLE library ADD COLUMN fileUrl VARCHAR(500) DEFAULT NULL");
            @$db->exec("ALTER TABLE library ADD COLUMN pdfUrl VARCHAR(500) DEFAULT NULL");
            @$db->exec("ALTER TABLE library ADD COLUMN sectionLevel VARCHAR(50) DEFAULT 'All'");
            @$db->exec("ALTER TABLE library ADD COLUMN availableCopies INT DEFAULT 1");

            $stmt = $db->prepare("INSERT INTO library (id, title, titleSinhala, category, fileUrl, author) VALUES (:id, :t, :tsi, :cat, :furl, :auth)");
            $stmt->execute([
                'id' => $id,
                't' => $title,
                'tsi' => $titleSinhala,
                'cat' => $category,
                'furl' => $pdfUrl,
                'auth' => $author
            ]);
        } catch (Exception $eRetry) {
            sendJsonResponse(["error" => "Failed to save resource: " . $eRetry->getMessage()], 500);
        }
    }

    logAuditEvent("පුස්තකාල ග්‍රන්ථයක් එක් කිරීම (Library Resource Added)", "ග්‍රන්ථය: '{$titleSinhala}' සාර්ථකව පද්ධතියට එක් කරන ලදී.", 'Library');

    $resBook = formatLibraryRecord([
        "id" => $id,
        "title" => $title,
        "titleSinhala" => $titleSinhala,
        "category" => $category,
        "subject" => $subject,
        "grade" => $grade,
        "pdfUrl" => $pdfUrl,
        "fileUrl" => $pdfUrl,
        "fileSize" => $fileSize,
        "author" => $author,
        "availableCopiesCount" => $copies
    ]);

    sendJsonResponse([
        "success" => true,
        "book" => $resBook
    ], 201);
}

// 3. PUT Library
if ($method === 'PUT' || $method === 'PATCH') {
    $authUser = requireRole(['admin', 'superadmin', 'teacher']);
    $body = getRequestBody();
    $bkId = $pathId ?: (isset($body['id']) ? $body['id'] : null);

    if (!$bkId) {
        sendJsonResponse(["error" => "Resource ID is required"], 400);
    }

    $stmt = $db->prepare("SELECT * FROM library WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $bkId]);
    $existing = $stmt->fetch();

    if (!$existing) {
        sendJsonResponse(["error" => "Resource not found"], 404);
    }

    $title = isset($body['title']) ? trim($body['title']) : $existing['title'];
    $titleSinhala = isset($body['titleSinhala']) ? trim($body['titleSinhala']) : $existing['titleSinhala'];
    $category = isset($body['category']) ? trim($body['category']) : (isset($body['subject']) ? trim($body['subject']) : $existing['category']);
    $subject = $category;
    $grade = isset($body['grade']) ? trim($body['grade']) : (isset($body['sectionLevel']) ? trim($body['sectionLevel']) : $existing['grade']);
    
    $pdfUrl = isset($body['pdfUrl']) && !empty($body['pdfUrl']) && $body['pdfUrl'] !== '#'
        ? trim($body['pdfUrl']) 
        : (isset($body['fileUrl']) && !empty($body['fileUrl']) && $body['fileUrl'] !== '#'
            ? trim($body['fileUrl']) 
            : (isset($body['downloadUrl']) && !empty($body['downloadUrl']) ? trim($body['downloadUrl']) : ($existing['pdfUrl'] ?? $existing['fileUrl'])));
            
    $fileSize = isset($body['fileSize']) ? trim($body['fileSize']) : $existing['fileSize'];
    $author = isset($body['author']) && !empty($body['author']) ? trim($body['author']) : $existing['author'];
    $copies = isset($body['availableCopiesCount']) ? intval($body['availableCopiesCount']) : (isset($body['copies']) ? intval($body['copies']) : $existing['copies']);

    try {
        $stmt = $db->prepare("UPDATE library SET 
            title = :t, 
            titleSinhala = :tsi, 
            category = :cat, 
            subject = :sub, 
            grade = :gr, 
            sectionLevel = :sl, 
            pdfUrl = :purl, 
            fileUrl = :furl, 
            fileSize = :fsz, 
            author = :auth, 
            copies = :cp, 
            availableCopies = :acp 
            WHERE id = :id");

        $stmt->execute([
            'id' => $bkId,
            't' => $title,
            'tsi' => $titleSinhala,
            'cat' => $category,
            'sub' => $subject,
            'gr' => $grade,
            'sl' => $grade,
            'purl' => $pdfUrl,
            'furl' => $pdfUrl,
            'fsz' => $fileSize,
            'auth' => $author,
            'cp' => $copies,
            'acp' => $copies
        ]);
    } catch (Exception $ePut) {}

    logAuditEvent("පුස්තකාල ග්‍රන්ථයක් යාවත්කාලීන කිරීම (Library Resource Updated)", "ග්‍රන්ථය: '{$titleSinhala}' තොරතුරු යාවත්කාලීන කරන ලදී.", 'Library');

    $resBook = formatLibraryRecord([
        "id" => $bkId,
        "title" => $title,
        "titleSinhala" => $titleSinhala,
        "category" => $category,
        "subject" => $subject,
        "grade" => $grade,
        "pdfUrl" => $pdfUrl,
        "fileUrl" => $pdfUrl,
        "fileSize" => $fileSize,
        "author" => $author,
        "availableCopiesCount" => $copies
    ]);

    sendJsonResponse([
        "success" => true,
        "book" => $resBook
    ]);
}

// 4. DELETE Library
if ($method === 'DELETE') {
    $authUser = requireRole(['admin', 'superadmin']);
    $body = getRequestBody();
    $bkId = $pathId ?: (isset($body['id']) ? $body['id'] : (isset($_GET['id']) ? $_GET['id'] : null));

    if (!$bkId) {
        sendJsonResponse(["error" => "Resource ID is required"], 400);
    }

    try {
        $stmtSel = $db->prepare("SELECT pdfUrl, fileUrl FROM library WHERE id = :id LIMIT 1");
        $stmtSel->execute(['id' => $bkId]);
        $bk = $stmtSel->fetch();
        if ($bk) {
            $fUrl = !empty($bk['pdfUrl']) ? $bk['pdfUrl'] : (!empty($bk['fileUrl']) ? $bk['fileUrl'] : '');
            if (!empty($fUrl)) {
                deleteUploadedFile($fUrl);
            }
        }
    } catch (Exception $e) {}

    $stmt = $db->prepare("DELETE FROM library WHERE id = :id");
    $stmt->execute(['id' => $bkId]);

    logAuditEvent("පුස්තකාල ග්‍රන්ථයක් ඉවත් කිරීම (Library Resource Deleted)", "ග්‍රන්ථ ID: '{$bkId}' සහ අදාළ ගොනුව සාර්ථකව පද්ධතියෙන් ඉවත් කරන ලදී.", 'Library');

    sendJsonResponse(["success" => true, "id" => $bkId]);
}

sendJsonResponse(["error" => "Method not allowed"], 405);

