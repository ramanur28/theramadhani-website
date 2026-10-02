<?php
/**
 * Decap CMS GitHub OAuth Configuration for Shared Hosting
 *
 * Automatically resolves OAuth credentials from:
 * 1. Root .env file (standard deployment)
 * 2. .env file in parent directories (e.g. /home/user/.env outside public_html for security)
 * 3. .env.oauth file (legacy or specialized OAuth env file)
 * 4. Server environment variables (SetEnv in Apache or cPanel environment)
 */

if (!function_exists('decapGetEnv')) {
    function decapGetEnv(string $key, ?string $default = null): ?string {
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return trim($_ENV[$key]);
        }
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
            return trim($_SERVER[$key]);
        }
        if (function_exists('getenv')) {
            $val = getenv($key);
            if ($val !== false && $val !== '') {
                return trim($val);
            }
        }
        return $default;
    }
}

if (!function_exists('decapLoadEnvFile')) {
    function decapLoadEnvFile(string $filePath): bool {
        if (!file_exists($filePath) || !is_readable($filePath)) {
            return false;
        }

        $lines = @file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return false;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            // Skip comments and empty lines
            if ($line === '' || strpos($line, '#') === 0) {
                continue;
            }

            // Parse key=value
            $parts = explode('=', $line, 2);
            if (count($parts) !== 2) {
                continue;
            }

            $key = trim($parts[0]);
            $val = trim($parts[1]);

            // Strip surrounding double quotes or single quotes
            $len = strlen($val);
            if ($len >= 2) {
                $first = $val[0];
                $last = $val[$len - 1];
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $val = substr($val, 1, -1);
                }
            }

            // Strip inline comments if not quoted (e.g. KEY=val # comment)
            if (strpos($val, ' #') !== false) {
                $commentParts = explode(' #', $val, 2);
                $val = trim($commentParts[0]);
            }

            // Populate PHP environment
            if (function_exists('putenv')) {
                @putenv($key . '=' . $val);
            }
            $_ENV[$key] = $val;
            $_SERVER[$key] = $val;
        }

        return true;
    }
}

// Candidate search locations for .env and .env.oauth files
$docRoot = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/\\') : '';
$candidateDirs = array_unique(array_filter([
    __DIR__,                               // public/auth
    dirname(__DIR__),                      // public or dist or public_html
    dirname(dirname(__DIR__)),             // project root or /home/username
    $docRoot,                              // document root (e.g. /home/user/public_html)
    dirname($docRoot),                     // above document root (e.g. /home/user)
]));

$envFilenames = ['.env', '.env.oauth', '.env.local'];

foreach ($candidateDirs as $dir) {
    if (empty($dir) || !is_dir($dir)) {
        continue;
    }
    foreach ($envFilenames as $filename) {
        $filePath = $dir . DIRECTORY_SEPARATOR . $filename;
        if (file_exists($filePath)) {
            decapLoadEnvFile($filePath);
        }
    }
}

// GitHub OAuth App Client Credentials
// Accepts standard key names: OAUTH_CLIENT_ID, OAUTH_GITHUB_CLIENT_ID, GITHUB_CLIENT_ID
$clientId = decapGetEnv('OAUTH_CLIENT_ID')
    ?: decapGetEnv('OAUTH_GITHUB_CLIENT_ID')
    ?: decapGetEnv('GITHUB_CLIENT_ID')
    ?: 'YOUR_GITHUB_CLIENT_ID_HERE';

$clientSecret = decapGetEnv('OAUTH_CLIENT_SECRET')
    ?: decapGetEnv('OAUTH_GITHUB_CLIENT_SECRET')
    ?: decapGetEnv('GITHUB_CLIENT_SECRET')
    ?: 'YOUR_GITHUB_CLIENT_SECRET_HERE';

define('OAUTH_CLIENT_ID', $clientId);
define('OAUTH_CLIENT_SECRET', $clientSecret);
define('OAUTH_SCOPE', 'repo,user');

// Resolve Dynamic Site & Callback URL
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443)
    || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

$protocol = $isHttps ? 'https://' : 'http://';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';

$configuredSiteUrl = decapGetEnv('SITE_URL') ?: decapGetEnv('SITE_DOMAIN');
if (!empty($configuredSiteUrl)) {
    if (strpos($configuredSiteUrl, 'http://') !== 0 && strpos($configuredSiteUrl, 'https://') !== 0) {
        $configuredSiteUrl = 'https://' . ltrim($configuredSiteUrl, '/');
    }
    $siteUrl = $configuredSiteUrl;
} else {
    $siteUrl = $protocol . $host;
}

define('SITE_URL', rtrim($siteUrl, '/'));
define('REDIRECT_URI', SITE_URL . '/callback');
