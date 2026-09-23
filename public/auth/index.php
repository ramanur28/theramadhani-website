<?php
/**
 * Decap CMS OAuth Step 1: Authorization Request
 * Redirects admin user to GitHub OAuth login
 */
require_once __DIR__ . '/config.php';

session_start();

$state = bin2hex(random_bytes(16));
$_SESSION['oauth_state'] = $state;

$params = [
    'client_id' => OAUTH_CLIENT_ID,
    'redirect_uri' => REDIRECT_URI,
    'scope' => OAUTH_SCOPE,
    'state' => $state,
    'allow_signup' => 'false'
];

$authUrl = 'https://github.com/login/oauth/authorize?' . http_build_query($params);

header('Location: ' . $authUrl);
exit;
