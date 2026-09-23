<?php
/**
 * Decap CMS GitHub OAuth Configuration for Shared Hosting
 *
 * Credentials can be set here directly or loaded from:
 * 1. Environment variables (e.g. SetEnv in .htaccess)
 * 2. An optional .env.oauth file in this directory or root
 */

// Load from .env.oauth if present
$envFiles = [__DIR__ . '/.env.oauth', __DIR__ . '/../../.env.oauth', __DIR__ . '/../.env.oauth'];
foreach ($envFiles as $file) {
    if (file_exists($file)) {
        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                putenv(trim($parts[0]) . '=' . trim($parts[1]));
                $_ENV[trim($parts[0])] = trim($parts[1]);
            }
        }
        break;
    }
}

// GitHub OAuth App Client Credentials
// Ganti nilai default ini dengan GitHub OAuth App Client ID & Secret Anda
define('OAUTH_CLIENT_ID', getenv('OAUTH_GITHUB_CLIENT_ID') ?: (getenv('OAUTH_CLIENT_ID') ?: 'YOUR_GITHUB_CLIENT_ID_HERE'));
define('OAUTH_CLIENT_SECRET', getenv('OAUTH_GITHUB_CLIENT_SECRET') ?: (getenv('OAUTH_CLIENT_SECRET') ?: 'YOUR_GITHUB_CLIENT_SECRET_HERE'));
define('OAUTH_SCOPE', 'repo,user');

// Resolve Dynamic Site & Callback URL
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
$protocol = $isHttps ? 'https://' : 'http://';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$siteUrl = getenv('SITE_URL') ?: ($protocol . $host);

define('SITE_URL', rtrim($siteUrl, '/'));
define('REDIRECT_URI', SITE_URL . '/callback');
