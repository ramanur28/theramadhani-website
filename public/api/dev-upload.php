<?php
/**
 * Media Upload API Handler for AI Article Studio & Decap CMS
 * The Ramadhani - Shared Hosting PHP Endpoint
 *
 * Receives: POST JSON { filename: string, content: string (base64) }
 * Writes to: public_html/images/uploads/{filename}
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || empty($data['filename']) || empty($data['content'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload: filename and content required']);
    exit;
}

// 1. Sanitize filename: only allow safe image extensions and clean basename
$cleanName = basename($data['filename']);
$cleanName = preg_replace('/[^a-zA-Z0-9._-]/', '-', $cleanName);
$cleanName = preg_replace('/-+/', '-', $cleanName);

$allowedExts = ['webp', 'png', 'jpg', 'jpeg', 'svg', 'gif'];
$ext = strtolower(pathinfo($cleanName, PATHINFO_EXTENSION));

if (!in_array($ext, $allowedExts, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file extension: ' . $ext]);
    exit;
}

// 2. Decode base64
$content = $data['content'];
if (strpos($content, ',') !== false) {
    $content = explode(',', $content)[1];
}
$binary = base64_decode($content, true);

if ($binary === false || strlen($binary) === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to decode base64 content']);
    exit;
}

// 3. Resolve images/uploads directory
$apiDir = __DIR__;
$publicDir = dirname($apiDir);
$parentDir = dirname($publicDir);

$uploadsDir = null;
$candidateDirs = [
    $publicDir . '/images/uploads',
    $apiDir . '/../images/uploads',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/images/uploads',
    $parentDir . '/public_html/images/uploads',
    $parentDir . '/images/uploads',
];

foreach ($candidateDirs as $dir) {
    if (!empty($dir)) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        if (is_dir($dir) && is_writable($dir)) {
            $uploadsDir = $dir;
            break;
        }
    }
}

if (!$uploadsDir) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to find writable uploads directory']);
    exit;
}

$targetPath = $uploadsDir . '/' . $cleanName;
$written = file_put_contents($targetPath, $binary);

if ($written === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write image to disk: ' . $targetPath]);
    exit;
}

// Set proper read permissions for web server
@chmod($targetPath, 0644);

echo json_encode([
    'success' => true,
    'filename' => $cleanName,
    'path' => '/images/uploads/' . $cleanName,
    'bytes' => $written
]);
