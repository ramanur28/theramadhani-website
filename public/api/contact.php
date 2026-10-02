<?php
/**
 * Strategic Lead & Audit Contact Request Handler
 * The Ramadhani - Shared Hosting PHP Endpoint
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

// Allow POST only
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
    exit;
}

// 1. Resolve Target Notification Email from .env
require_once __DIR__ . '/../auth/config.php';

$toEmail = decapGetEnv('CONTACT_EMAIL_NOTIFICATION') ?: 'contact@theramadhani.com';

// 2. Extract and Sanitize Inputs
$name = trim((string)($_POST['name'] ?? ''));
$email = trim(filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL));
$website = trim((string)($_POST['website'] ?? ''));
$industry = trim((string)($_POST['industry'] ?? ''));
$service = trim((string)($_POST['service'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));
$honeypot = trim((string)($_POST['website_hp'] ?? ''));

// 3. Honeypot Anti-Spam Check (Silently discard bot submissions)
if (!empty($honeypot)) {
    echo json_encode(['success' => true, 'message' => 'Audit Request Received']);
    exit;
}

// 4. Validate Required Fields
$errors = [];

if (empty($name) || mb_strlen($name) < 2 || mb_strlen($name) > 100) {
    $errors[] = 'Full name must be between 2 and 100 characters.';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid business email address is required.';
}

if (empty($website) || mb_strlen($website) > 250) {
    $errors[] = 'A valid website URL is required.';
}

if (empty($message) || mb_strlen($message) < 10 || mb_strlen($message) > 4000) {
    $errors[] = 'Please provide details about your bottlenecks and goals (minimum 10 characters).';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => implode(' ', $errors)]);
    exit;
}

// 5. Basic Rate Limiting (Session or IP-based)
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}
$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$now = time();

if (isset($_SESSION['last_contact_submit']) && ($now - $_SESSION['last_contact_submit']) < 10) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Please wait a few seconds before submitting another request.']);
    exit;
}
$_SESSION['last_contact_submit'] = $now;

// 6. Format Email
$subject = '⚡ New Lead & Search Audit Request: ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . ' (' . htmlspecialchars($website, ENT_QUOTES, 'UTF-8') . ')';

$htmlBody = '
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; }
  .card { background: #1e293b; border-radius: 12px; padding: 28px; border: 1px solid #334155; max-width: 600px; margin: 0 auto; }
  h2 { color: #f59e0b; margin-top: 0; font-size: 20px; border-bottom: 1px solid #334155; padding-bottom: 12px; }
  .field { margin-bottom: 16px; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-family: monospace; }
  .value { font-size: 14px; color: #f8fafc; margin-top: 4px; font-weight: 500; }
  .msg-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-top: 6px; white-space: pre-wrap; font-size: 13px; color: #e2e8f0; line-height: 1.6; }
  .footer { margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 12px; font-family: monospace; }
</style>
</head>
<body>
<div class="card">
  <h2>⚡ Strategic Search & Lead Audit Request</h2>
  <div class="field">
    <div class="label">Full Name</div>
    <div class="value">' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '</div>
  </div>
  <div class="field">
    <div class="label">Business Email</div>
    <div class="value"><a href="mailto:' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '" style="color:#38bdf8;">' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '</a></div>
  </div>
  <div class="field">
    <div class="label">Website Domain</div>
    <div class="value"><a href="' . htmlspecialchars($website, ENT_QUOTES, 'UTF-8') . '" target="_blank" style="color:#38bdf8;">' . htmlspecialchars($website, ENT_QUOTES, 'UTF-8') . '</a></div>
  </div>
  <div class="field">
    <div class="label">Industry / Business Type</div>
    <div class="value">' . htmlspecialchars($industry, ENT_QUOTES, 'UTF-8') . '</div>
  </div>
  <div class="field">
    <div class="label">Primary Goal</div>
    <div class="value">' . htmlspecialchars($service, ENT_QUOTES, 'UTF-8') . '</div>
  </div>
  <div class="field">
    <div class="label">Bottlenecks & Goals Description</div>
    <div class="msg-box">' . nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')) . '</div>
  </div>
  <div class="footer">
    Submitted on: ' . gmdate('Y-m-d H:i:s') . ' UTC | IP: ' . htmlspecialchars($ip, ENT_QUOTES, 'UTF-8') . '
  </div>
</div>
</body>
</html>';

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: "The Ramadhani Website" <' . $toEmail . '>',
    'Reply-To: "' . addslashes($name) . '" <' . $email . '>',
    'X-Mailer: PHP/' . phpversion()
];

// 7. Send Email via Native PHP mail()
$sent = @mail($toEmail, $subject, $htmlBody, implode("\r\n", $headers));

echo json_encode([
    'success' => true,
    'message' => 'Audit request received. I will review your domain and respond within 24 business hours.'
]);
