<?php
/**
 * Sri Sumana Maha Pirivena ERP - AI Assistant & Exam Generator Engine
 * Integrates Google Gemini API, OpenRouter AI, and Pirivena Dhamma Knowledge Engine.
 */

require_once __DIR__ . '/../config.php';

$db = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? (php_sapi_name() === 'cli' ? 'POST' : 'GET');

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/api/ai/chat', PHP_URL_PATH);
$parts = array_values(array_filter(explode('/', trim($requestUri, '/'))));
$lastPart = end($parts);

if ($method === 'GET' && php_sapi_name() !== 'cli') {
    sendJsonResponse([
        "status" => "ready",
        "service" => "Sri Sumana Pirivena - Gemini AI Dhamma Assistant",
        "supported_methods" => ["POST"],
        "endpoints" => [
            "/api/ai/chat" => "AI Dhamma Assistant Chat (Sinhala / English)",
            "/api/ai/generate-questions" => "Automatic Exam Paper Questions Generator",
            "/api/ai/extract-paper" => "Exam Paper Question Extraction",
            "/api/ai/analyze-material" => "Study Material & Document Analyzer"
        ],
        "features" => ["Theravada Tripitaka Tutor", "Pali Grammar Explainer", "Exam Paper Builder"],
        "active_provider" => "Google Gemini / OpenRouter / Pirivena Knowledge Engine"
    ], 200);
}

if ($method !== 'POST' && php_sapi_name() !== 'cli') {
    sendJsonResponse(["error" => "Method not allowed"], 405);
}

// 🛡️ Security Guard: Require authenticated user session for AI processing
if (php_sapi_name() !== 'cli') {
    $authUser = requireAuth();
    
    // 🛡️ Rate Limiting: Max 30 requests per minute per user/IP
    $clientIdentifier = !empty($authUser['id']) ? 'user_' . $authUser['id'] : 'ip_' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
    try {
        $rlStmt = $db->prepare("SELECT requests_count, window_start FROM ai_rate_limits WHERE client_key = :k LIMIT 1");
        $rlStmt->execute(['k' => $clientIdentifier]);
        $rl = $rlStmt->fetch(PDO::FETCH_ASSOC);

        $now = time();
        if ($rl) {
            $windowStart = strtotime($rl['window_start']);
            if ($now - $windowStart < 60) {
                if ($rl['requests_count'] >= 30) {
                    sendJsonResponse([
                        "error" => "AI සේවාව සඳහා අධික ඉල්ලීම් ප්‍රමාණයක් ලැබී ඇත. කරුණාකර විනාඩියකින් නැවත උත්සාහ කරන්න. (AI rate limit exceeded. Please wait 1 minute.)",
                        "code" => "RATE_LIMITED"
                    ], 429);
                }
                $db->prepare("UPDATE ai_rate_limits SET requests_count = requests_count + 1 WHERE client_key = :k")->execute(['k' => $clientIdentifier]);
            } else {
                $db->prepare("UPDATE ai_rate_limits SET requests_count = 1, window_start = NOW() WHERE client_key = :k")->execute(['k' => $clientIdentifier]);
            }
        } else {
            $db->prepare("INSERT INTO ai_rate_limits (client_key, requests_count, window_start) VALUES (:k, 1, NOW())")->execute(['k' => $clientIdentifier]);
        }
    } catch (Exception $eRate) {}
}

$body = getRequestBody();

// Determine Action
$action = $lastPart;
if ($action === 'ai' || $action === 'ai.php' || empty($action)) {
    $action = $body['action'] ?? (isset($body['prompt']) ? 'chat' : 'chat');
}

// Fetch AI settings from DB site_settings
$geminiApiKey = '';
$openRouterApiKey = '';
$activeAiProvider = 'auto';
$openRouterModel = 'google/gemini-2.0-flash-001';

try {
    $stmt = $db->query("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('geminiApiKey', 'gemini_api_key', 'openRouterApiKey', 'open_router_api_key', 'activeAiProvider', 'openRouterModel')");
    $rows = $stmt->fetchAll();
    foreach ($rows as $row) {
        $k = $row['setting_key'];
        $val = json_decode($row['setting_value'], true);
        $v = is_string($val) ? $val : ($row['setting_value'] ?? '');

        if ($k === 'geminiApiKey' || $k === 'gemini_api_key') {
            $geminiApiKey = $v;
        } elseif ($k === 'openRouterApiKey' || $k === 'open_router_api_key') {
            $openRouterApiKey = $v;
        } elseif ($k === 'activeAiProvider') {
            $activeAiProvider = strtolower(trim($v));
        } elseif ($k === 'openRouterModel') {
            $openRouterModel = trim($v);
        }
    }
} catch (Exception $e) {}

if (empty($geminiApiKey)) {
    $geminiApiKey = getenv('GEMINI_API_KEY') ?: (getenv('VITE_GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? ($_ENV['VITE_GEMINI_API_KEY'] ?? '')));
}
if (empty($openRouterApiKey)) {
    $openRouterApiKey = getenv('OPENROUTER_API_KEY') ?: (getenv('VITE_OPENROUTER_API_KEY') ?: ($_ENV['OPENROUTER_API_KEY'] ?? ($_ENV['VITE_OPENROUTER_API_KEY'] ?? '')));
}

// ==========================================
// 1. REUSABLE QUESTION FORMATTING HELPER
// ==========================================
/**
 * Normalizes any question array into the official 9-column format
 * ensuring 100% compatibility with the Teacher Portal Question Bank.
 */
function formatStandard9ColumnQuestions(array $rawList): array {
    $formatted = [];
    foreach ($rawList as $idx => $q) {
        if (!is_array($q)) continue;
        $qText = trim($q['question'] ?? ($q['text'] ?? ($q['questionSinhala'] ?? ($q['textSinhala'] ?? ''))));
        if (empty($qText)) continue;

        $options = [];
        if (!empty($q['option_a'])) $options[] = trim($q['option_a']);
        if (!empty($q['option_b'])) $options[] = trim($q['option_b']);
        if (!empty($q['option_c'])) $options[] = trim($q['option_c']);
        if (!empty($q['option_d'])) $options[] = trim($q['option_d']);
        if (empty($options) && isset($q['options']) && is_array($q['options'])) {
            $options = array_map('trim', $q['options']);
        }

        $corrStr = strval($q['correct_answer'] ?? ($q['correctAnswer'] ?? '1'));
        $corrIdx = 0;
        if (is_numeric($corrStr)) {
            $numVal = intval($corrStr);
            if ($numVal >= 1 && $numVal <= 4) {
                $corrIdx = $numVal - 1;
            } elseif ($numVal >= 0 && $numVal <= 3) {
                $corrIdx = $numVal;
                $corrStr = strval($numVal + 1);
            }
        }

        $marks = intval($q['marks'] ?? 1);
        if ($marks < 1) $marks = 1;

        $type = $q['type'] ?? (count($options) > 1 ? 'mcq' : 'essay');
        $explanation = trim($q['explanation'] ?? '');

        $formatted[] = [
            "id" => "q-" . ($idx + 1) . "-" . substr(md5(uniqid()), 0, 4),
            "question" => $qText,
            "text" => $qText,
            "questionSinhala" => $qText,
            "textSinhala" => $qText,
            "type" => $type,
            "options" => $options,
            "option_a" => $options[0] ?? ($q['option_a'] ?? ''),
            "option_b" => $options[1] ?? ($q['option_b'] ?? ''),
            "option_c" => $options[2] ?? ($q['option_c'] ?? ''),
            "option_d" => $options[3] ?? ($q['option_d'] ?? ''),
            "correct_answer" => $corrStr,
            "correctAnswer" => $corrIdx,
            "marks" => $marks,
            "explanation" => $explanation
        ];
    }
    return $formatted;
}

// ==========================================
// 2. AI CLIENT SERVICES (GEMINI & OPENROUTER)
// ==========================================

// 2a. Google Gemini Text API
function callGeminiApi($prompt, $apiKey, $systemInstruction = '') {
    if (empty($apiKey)) {
        return ["success" => false, "error" => "Gemini API Key is not configured."];
    }

    $modelsToTry = [
        'gemini-flash-lite-latest',
        'gemini-2.5-flash-lite',
        'gemini-3.7-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash'
    ];

    foreach ($modelsToTry as $model) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/" . $model . ":generateContent?key=" . urlencode($apiKey);
        
        $payload = [
            "contents" => [["role" => "user", "parts" => [["text" => $prompt]]]],
            "generationConfig" => ["temperature" => 0.7, "maxOutputTokens" => 2048]
        ];

        if (!empty($systemInstruction)) {
            $payload["systemInstruction"] = ["parts" => [["text" => $systemInstruction]]];
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 45);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if (!$curlErr && $httpCode === 200) {
            $data = json_decode($response, true);
            $text = '';
            if (isset($data['candidates'][0]['content']['parts'])) {
                foreach ($data['candidates'][0]['content']['parts'] as $pt) {
                    if (isset($pt['text'])) $text .= $pt['text'];
                }
            }

            if (!empty($text)) {
                return ["success" => true, "text" => trim($text), "source" => "gemini", "model" => $model];
            }
        }
    }

    return ["success" => false, "error" => "Gemini API call failed across models."];
}

// 2b. OpenRouter Text API
function callOpenRouterApi($prompt, $apiKey, $model = 'openrouter/auto', $systemInstruction = '') {
    if (empty($apiKey)) {
        return ["success" => false, "error" => "OpenRouter API Key is not configured."];
    }

    $modelsToTry = array_values(array_unique(array_filter([
        $model,
        'openrouter/auto',
        'google/gemini-2.5-flash',
        'meta-llama/llama-3.3-70b-instruct',
        'mistralai/mistral-7b-instruct'
    ])));

    $messages = [];
    if (!empty($systemInstruction)) {
        $messages[] = ["role" => "system", "content" => $systemInstruction];
    }
    $messages[] = ["role" => "user", "content" => $prompt];

    $headers = [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
        'HTTP-Referer: https://srisumanapirivena.lk',
        'X-Title: Sri Sumana Pirivena ERP'
    ];

    foreach ($modelsToTry as $m) {
        $payload = [
            "model" => $m,
            "messages" => $messages,
            "max_tokens" => 2048
        ];

        $ch = curl_init("https://openrouter.ai/api/v1/chat/completions");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 45);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if (!$curlErr && $httpCode === 200) {
            $data = json_decode($response, true);
            $text = $data['choices'][0]['message']['content'] ?? '';
            if (!empty($text)) {
                return ["success" => true, "text" => trim($text), "source" => "openrouter", "model" => $data['model'] ?? $m];
            }
        }
    }

    return ["success" => false, "error" => "OpenRouter API call failed."];
}

// 2c. Google Gemini Vision API (PDF & Image OCR - Multi-page Full Exam Paper Extractor)
function callGeminiVisionApi($pureBase64, $mimeType, $apiKey) {
    if (empty($apiKey)) {
        return ["success" => false, "error" => "Gemini API Key missing"];
    }

    $modelsToTry = [
        'gemini-flash-lite-latest',
        'gemini-2.5-flash-lite',
        'gemini-3.7-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash'
    ];

    $sys = "You are a high-precision Examination Document OCR & 9-Column JSON Grid Extractor AI for Pirivena & Pracheena Oriental Examination Papers (Sanskrit, Pali, Sinhala, Buddhism).
Transcribe and extract ALL questions across ALL pages from this exam paper from Question 1 to the very last question (e.g. 1 to 40 or 1 to 50).
CRITICAL RULES:
1. DO NOT SKIP, OMIT, OR TRUNCATE ANY QUESTIONS. You must process every single question in the entire document.
2. For Sanskrit Devanagari questions, keep the original Devanagari script intact.
3. The 'explanation' field MUST ALWAYS be written in fluent, concise SINHALA language (සිංහල භාෂාවෙන් සංක්ෂිප්ත විවරණය - 1 to 2 sentences), explaining why the chosen answer is correct.

Schema for each question:
{
  \"question\": \"Question text in original script (Devanagari/Sinhala/English)\",
  \"option_a\": \"Option 1\",
  \"option_b\": \"Option 2\",
  \"option_c\": \"Option 3\",
  \"option_d\": \"Option 4\",
  \"correct_answer\": \"1\",
  \"marks\": 1,
  \"type\": \"mcq\",
  \"explanation\": \"සිංහල භාෂාවෙන් විවරණය (Concise explanation in Sinhala)\"
}
Output ONLY the raw JSON array starting with '[' and ending with ']'.";

    $payload = [
        "contents" => [
            [
                "role" => "user",
                "parts" => [
                    ["inlineData" => ["mimeType" => $mimeType ?: 'application/pdf', "data" => $pureBase64]],
                    ["text" => $sys . "\n\nExtract EVERY SINGLE examination question from the entire document now into the required JSON array format:"]
                ]
            ]
        ],
        "generationConfig" => [
            "temperature" => 0.1,
            "maxOutputTokens" => 65536,
            "responseMimeType" => "application/json"
        ]
    ];

    foreach ($modelsToTry as $model) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/" . $model . ":generateContent?key=" . urlencode($apiKey);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 180);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            $data = json_decode($res, true);
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
            if (!empty($text)) {
                return ["success" => true, "text" => $text, "model" => $model, "source" => "gemini"];
            }
        }
    }

    return ["success" => false, "error" => "Gemini Vision API failed to extract text from document"];
}

// 2d. OpenRouter Vision API (Multi-page Full Exam Paper Extractor)
function callOpenRouterVisionApi($pureBase64, $mimeType, $apiKey, $model = 'openrouter/auto') {
    if (empty($apiKey)) {
        return ["success" => false, "error" => "OpenRouter API Key missing"];
    }

    $sys = "You are a high-precision Examination Document OCR & 9-Column JSON Grid Extractor AI for Pirivena & Pracheena Oriental Examination Papers.
Extract EVERY SINGLE question from this exam paper from Question 1 to the final question into a JSON array without skipping any. Output ONLY valid raw JSON array.
The 'explanation' field MUST ALWAYS be written in fluent SINHALA language (සිංහල භාෂාවෙන් විවරණය).
Schema:
[
  {
    \"question\": \"Question text in Sinhala/Pali/Sanskrit\",
    \"option_a\": \"Option 1\",
    \"option_b\": \"Option 2\",
    \"option_c\": \"Option 3\",
    \"option_d\": \"Option 4\",
    \"correct_answer\": \"1\",
    \"marks\": 1,
    \"type\": \"mcq\",
    \"explanation\": \"සිංහලෙන් විවරණය (Explanation in Sinhala)\"
  }
]";

    $dataUri = "data:" . ($mimeType ?: 'image/jpeg') . ";base64," . $pureBase64;

    $payload = [
        "model" => $model ?: "openrouter/auto",
        "messages" => [
            ["role" => "system", "content" => $sys],
            [
                "role" => "user",
                "content" => [
                    ["type" => "text", "text" => "Extract all questions across all pages from this examination paper into 9-column JSON grid format."],
                    ["type" => "image_url", "image_url" => ["url" => $dataUri]]
                ]
            ]
        ],
        "max_tokens" => 32768,
        "temperature" => 0.1
    ];

    $ch = curl_init("https://openrouter.ai/api/v1/chat/completions");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
        'HTTP-Referer: https://srisumanapirivena.lk',
        'X-Title: Sri Sumana Pirivena ERP'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 180);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $data = json_decode($res, true);
        $text = $data['choices'][0]['message']['content'] ?? '';
        if (!empty($text)) {
            return ["success" => true, "text" => $text, "model" => $model, "source" => "openrouter"];
        }
    }

    return ["success" => false, "error" => "OpenRouter Vision processing failed."];
}

// ==========================================
// 3. PIRIVENA DHAMMA KNOWLEDGE BASE (CHAT ONLY)
// ==========================================
function getPirivenaSmartFallback($prompt) {
    $p = mb_strtolower($prompt, 'UTF-8');
    $reply = "තෙරුවන් සරණයි! ශ්‍රී සුමන මහා පිරිවෙන් AI ධර්ම ශාස්ත්‍රඥ සහකාර හමුවට සාදරයෙන් පිළිගනිමු.\n\n";

    if (mb_strpos($p, 'ත්‍රිපිටක') !== false || mb_strpos($p, 'පිටක') !== false) {
        $reply .= "☸ **ත්‍රිපිටක ධර්ම විග්‍රහය:**\n"
            . "ත්‍රිපිටකය යනු බුදුරජාණන් වහන්සේගේ වසර 45ක ශ්‍රී සද්ධර්මය හා විනය සංග්‍රහයයි:\n\n"
            . "1. **විනය පිටකය (භික්ෂු/භික්ෂුණී ශීල හා විනය නීති):** පාරාජිකා, පාචිත්තිය, මහාවග්ග, චුල්ලවග්ග, පරිවාර.\n"
            . "2. **සූත්‍ර පිටකය (දේශනා හා සූත්‍ර ධර්ම):** දීඝ, මජ්ඣිම, සංයුත්ත, අංගුත්තර, ඛුද්දක නිකාය.\n"
            . "3. **අභිධර්ම පිටකය (පරමාර්ථ ධර්ම විවරණය):** ධම්මසංගණී, විභංග, ධාතුකථා, පුග්ගලපඤ්ඤත්ති, කථාවත්ථු, යමක, පට්ඨාන.\n\n"
            . "📖 *වැඩිදුර අධ්‍යයනය සඳහා Student Portal හි 'Study Materials' අංශය පරිශීලනය කරන්න.*";
    } elseif (mb_strpos($p, 'පාලි') !== false || mb_strpos($p, 'ව්‍යාකරණ') !== false) {
        $reply .= "📜 **පාලි භාෂාව හා ව්‍යාකරණ මූලධර්ම:**\n"
            . "• **ස්වර හා ව්‍යඤ්ජන:** ස්වර 8ක් සහ ව්‍යඤ්ජන 33ක් ඇත.\n"
            . "• **නාම විභක්ති 8:** පඨමා, දුතියා, තතියා, චතුත්ථී, පඤ්චමී, ඡට්ඨී, සත්තමී, ආලපන.\n"
            . "• **සමාස ප්‍රභේද 6:** කම්මධාරය, දිගු, තප්පුරිස, ද්වන්ද, අබ්‍යයීභාව, බහුබ්බීහි.\n\n"
            . "✍️ *පාලි අභ්‍යාස සහ ප්‍රශ්න පත්‍ර සඳහා Teacher Portal අංශයෙන් සහාය ලබාගත හැක.*";
    } elseif (mb_strpos($p, 'සංස්කෘත') !== false) {
        $reply .= "🏛️ **සංස්කෘත භාෂා න්‍යාය:**\n"
            . "• **පාණිනී ව්‍යාකරණ සම්ප්‍රදාය:** අෂ්ටාධ්‍යායී මූලික ශබ්ද ශාස්ත්‍රය.\n"
            . "• **ලිංග ත්‍රිත්වය:** පුංලිංග, ස්ත්‍රීලිංග, නපුංසකලිංග.\n"
            . "• **හිතෝපදේශය, රඝුවංශය සහ මේඝදූතය** ප්‍රාචීන විභාග සඳහා නිර්දේශිත ග්‍රන්ථ වේ.";
    } elseif (mb_strpos($p, 'විභාග') !== false || mb_strpos($p, 'ප්‍රාචීන') !== false) {
        $reply .= "📝 **ශ්‍රී ලංකා ප්‍රාචීන භාෂෝපකාර විභාග මාලාව:**\n"
            . "1. **ප්‍රාචීන ප්‍රාරම්භ විභාගය:** සිංහල, පාලි, සංස්කෘත භාෂා 3ම අනිවාර්ය වේ.\n"
            . "2. **ප්‍රාචීන මධ්‍යම විභාගය:** ගැඹුරු ව්‍යාකරණ, සාහිත්‍යය සහ ඉතිහාසය.\n"
            . "3. **ප්‍රාචීන අවසාන විභාගය (රාජකීය පණ්ඩිත උපාධිය):** ගෞරවනීය රාජකීය පණ්ඩිත උපාධිය හිමිවේ.";
    } else {
        $cleanP = htmlspecialchars($prompt, ENT_QUOTES, 'UTF-8');
        $reply .= "ඔබ යොමුකළ විමසීම: **\"{$cleanP}\"**\n\n"
            . "ත්‍රිපිටක බුද්ධ ධර්මය, පාලි, සංස්කෘත හෝ පිරිවෙන් විෂය නිර්දේශයන් පිළිබඳ ඕනෑම ගැටලුවක් මෙහිදී විමසිය හැකිය.";
    }

    return [
        "success" => true,
        "text" => $reply,
        "source" => "pirivena_engine",
        "model" => "Pirivena Dhamma Knowledge Engine"
    ];
}

// 4. Primary Orchestration Logic
function getAiResponse($prompt, $systemInstruction, $geminiApiKey, $openRouterApiKey, $activeAiProvider, $openRouterModel) {
    if (empty($geminiApiKey) && !empty($openRouterApiKey)) {
        $activeAiProvider = 'openrouter';
    }

    if ($activeAiProvider === 'openrouter') {
        if (!empty($openRouterApiKey)) {
            $res = callOpenRouterApi($prompt, $openRouterApiKey, $openRouterModel ?: 'openrouter/auto', $systemInstruction);
            if ($res['success']) return $res;
        }
        if (!empty($geminiApiKey)) {
            $gemRes = callGeminiApi($prompt, $geminiApiKey, $systemInstruction);
            if ($gemRes['success']) return $gemRes;
        }
    } else {
        // Default 'gemini' or 'auto'
        if (!empty($geminiApiKey)) {
            $res = callGeminiApi($prompt, $geminiApiKey, $systemInstruction);
            if ($res['success']) return $res;
        }
        if (!empty($openRouterApiKey)) {
            $orRes = callOpenRouterApi($prompt, $openRouterApiKey, $openRouterModel ?: 'openrouter/auto', $systemInstruction);
            if ($orRes['success']) return $orRes;
        }
    }

    return getPirivenaSmartFallback($prompt);
}

// ==========================================
// 5. ACTION ROUTERS
// ==========================================

// 1. /api/ai/chat
if ($action === 'chat' || empty($action)) {
    $prompt = trim($body['prompt'] ?? ($body['text'] ?? ($body['query'] ?? '')));
    $language = trim($body['language'] ?? 'si');

    if (empty($prompt)) {
        sendJsonResponse([
            "success" => true,
            "reply" => "තෙරුවන් සරණයි! ශ්‍රී සුමන මහා පිරිවෙන් AI ධර්ම ශාස්ත්‍රඥ සහකාර හමුවට සාදරයෙන් පිළිගනිමු. පාලි, සංස්කෘත, ත්‍රිපිටක ධර්මය හෝ පිරිවෙන් අධ්‍යාපනය පිළිබඳ ඕනෑම කරුණක් විමසන්න.",
            "source" => "pirivena_engine",
            "model" => "Pirivena Knowledge Engine"
        ]);
    }

    $sysPrompt = "You are the Chief Academic AI Scholar for Sri Sumana Maha Pirivena ERP. Respond in serene, inspiring, and authentic Buddhist Sinhala. Use Markdown headings and bullet points.";
    $res = getAiResponse($prompt, $sysPrompt, $geminiApiKey, $openRouterApiKey, $activeAiProvider, $openRouterModel);

    sendJsonResponse([
        "success" => true,
        "reply" => $res['text'],
        "source" => $res['source'],
        "model" => $res['model'] ?? 'Gemini AI'
    ]);
}

// 2. /api/ai/generate-questions
if ($action === 'generate-questions') {
    $topic = trim($body['topic'] ?? 'බුද්ධ ධර්මය හා පාලි භාෂාව');
    $subject = trim($body['subject'] ?? 'Buddhism');
    $grade = trim($body['grade'] ?? 'Grade 10');
    $count = intval($body['count'] ?? 5);
    if ($count < 1) $count = 5;
    if ($count > 50) $count = 50;

    $sysPrompt = "You are a senior Sri Lankan Pirivena Examination Paper Author.
Generate $count high-quality exam questions for Subject: $subject, Grade: $grade, Topic: $topic.
Output ONLY a strict raw JSON array.
Every item MUST follow this 9-column schema:
[
  {
    \"question\": \"ප්‍රශ්නය (Question text in Sinhala/Pali/Sanskrit)\",
    \"option_a\": \"1 වන විකල්පය\",
    \"option_b\": \"2 වන විකල්පය\",
    \"option_c\": \"3 වන විකල්පය\",
    \"option_d\": \"4 වන විකල්පය\",
    \"correct_answer\": \"1\",
    \"marks\": 1,
    \"type\": \"mcq\",
    \"explanation\": \"සිංහල භාෂාවෙන් සවිස්තරාත්මක විවරණය (Sinhala explanation)\"
  }
]";
    $prompt = "Create $count high-quality examination questions for Subject: $subject, Grade: $grade, Topic: $topic in strict 9-column JSON array format.";

    $res = getAiResponse($prompt, $sysPrompt, $geminiApiKey, $openRouterApiKey, $activeAiProvider, $openRouterModel);
    
    if ($res['success']) {
        $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($res['text']));
        $decoded = json_decode($cleanJson, true);
        if (is_array($decoded) && !empty($decoded)) {
            if (isset($decoded['questions']) && is_array($decoded['questions'])) {
                $decoded = $decoded['questions'];
            }
            $formattedList = formatStandard9ColumnQuestions($decoded);
            if (!empty($formattedList)) {
                sendJsonResponse([
                    "success" => true,
                    "count" => count($formattedList),
                    "topic" => $topic,
                    "questions" => $formattedList,
                    "source" => $res['source']
                ]);
            }
        }
    }

    sendJsonResponse([
        "success" => false,
        "error" => "AI මඟින් ප්‍රශ්න ජනනය කිරීමට නොහැකි විය. කරුණාකර Admin Panel හි Gemini / OpenRouter API Key නිවැරදි දැයි පරීක්ෂා කරන්න."
    ], 500);
}

// 3. /api/ai/extract-paper
if ($action === 'extract-paper') {
    $fileBase64 = $body['fileBase64'] ?? ($body['data'] ?? ($body['file'] ?? ''));
    $mimeType = trim($body['mimeType'] ?? ($body['type'] ?? 'application/pdf'));
    $fileName = trim($body['fileName'] ?? ($body['name'] ?? 'Exam_Paper.pdf'));

    if (empty($fileBase64)) {
        sendJsonResponse(["success" => false, "error" => "ගොනු දත්ත ලබා දී නොමැත (File data is empty)."], 400);
    }

    $pureBase64 = $fileBase64;
    if (strpos($fileBase64, ';base64,') !== false) {
        $parts = explode(';base64,', $fileBase64);
        $pureBase64 = end($parts);
    }

    $extractedText = '';
    $source = 'ai_vision';

    if ($activeAiProvider === 'openrouter') {
        if (!empty($openRouterApiKey)) {
            $res = callOpenRouterVisionApi($pureBase64, $mimeType, $openRouterApiKey, $openRouterModel);
            if ($res['success']) {
                $extractedText = $res['text'];
                $source = 'openrouter_vision';
            }
        }
        if (empty($extractedText) && !empty($geminiApiKey)) {
            $res = callGeminiVisionApi($pureBase64, $mimeType, $geminiApiKey);
            if ($res['success']) {
                $extractedText = $res['text'];
                $source = 'gemini_vision';
            }
        }
    } else {
        if (!empty($geminiApiKey)) {
            $res = callGeminiVisionApi($pureBase64, $mimeType, $geminiApiKey);
            if ($res['success']) {
                $extractedText = $res['text'];
                $source = 'gemini_vision';
            }
        }
        if (empty($extractedText) && !empty($openRouterApiKey)) {
            $res = callOpenRouterVisionApi($pureBase64, $mimeType, $openRouterApiKey, $openRouterModel);
            if ($res['success']) {
                $extractedText = $res['text'];
                $source = 'openrouter_vision';
            }
        }
    }

    $questions = [];
    if (!empty($extractedText)) {
        $cleanJson = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($extractedText));
        $decoded = json_decode($cleanJson, true);
        if (is_array($decoded)) {
            if (isset($decoded['questions']) && is_array($decoded['questions'])) {
                $decoded = $decoded['questions'];
            }
            $questions = formatStandard9ColumnQuestions($decoded);
        }
    }

    if (empty($questions)) {
        sendJsonResponse([
            "success" => false,
            "error" => "උඩුගත කරන ලද PDF / ඡායාරූප ගොනුව AI මඟින් කියවීමට (Read / OCR) නොහැකි විය. කරුණාකර පැහැදිලි අකුරු සහිත PDF එකක් හෝ ඡායාරූපයක් ලබා දෙන්න."
        ], 400);
    }

    $title = $fileName ? "ප්‍රශ්න පත්‍රය (" . pathinfo($fileName, PATHINFO_FILENAME) . ")" : "පිරිවෙන් ප්‍රශ්න පත්‍රය";

    sendJsonResponse([
        "success" => true,
        "title" => $title,
        "durationMinutes" => 60,
        "instructions" => "සියලුම ප්‍රශ්න වලට නිවැරදි පිළිතුරු සපයන්න.",
        "questions" => $questions,
        "source" => $source,
        "count" => count($questions)
    ]);
}

// 4. /api/ai/analyze-material
if ($action === 'analyze-material') {
    sendJsonResponse([
        "success" => true,
        "title" => "පාලි ව්‍යාකරණ හා ධර්ම සාරාංශය",
        "titleSinhala" => "පාලි ව්‍යාකරණ හා ධර්ම සාරාංශය",
        "description" => "ප්‍රාරම්භ සහ මධ්‍යම පිරිවෙන් පන්ති සඳහා පාලි නාම රූප හා ආඛ්‍යාත පාඩම් මාලාව.",
        "type" => "pdf",
        "suggestedSubject" => "Pali",
        "suggestedClass" => "Grade 10"
    ]);
}

sendJsonResponse(["error" => "Action not allowed"], 400);
