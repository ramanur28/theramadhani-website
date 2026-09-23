<?php
/**
 * Decap CMS OAuth Step 2: Callback & Token Exchange
 * Exchanging code for access_token with GitHub API and returning to Decap CMS
 */
require_once __DIR__ . '/../auth/config.php';

session_start();

$code = $_GET['code'] ?? null;
$state = $_GET['state'] ?? null;
$error = $_GET['error'] ?? null;
$errorDescription = $_GET['error_description'] ?? 'Authentication failed';

$token = null;
$authError = null;

if ($error) {
    $authError = $errorDescription;
} elseif (!$code) {
    $authError = 'Missing authorization code from GitHub.';
} else {
    // Exchange code for token with GitHub OAuth API
    $ch = curl_init('https://github.com/login/oauth/access_token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'client_id' => OAUTH_CLIENT_ID,
        'client_secret' => OAUTH_CLIENT_SECRET,
        'code' => $code,
        'redirect_uri' => REDIRECT_URI,
        'state' => $state
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'User-Agent: The-Ramadhani-Decap-OAuth-PHP'
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        $authError = 'cURL error communicating with GitHub: ' . $curlErr;
    } elseif ($httpCode !== 200 || !$response) {
        $authError = 'GitHub returned HTTP ' . $httpCode;
    } else {
        $data = json_decode($response, true);
        if (!empty($data['access_token'])) {
            $token = $data['access_token'];
        } elseif (!empty($data['error_description'])) {
            $authError = $data['error_description'];
        } elseif (!empty($data['error'])) {
            $authError = $data['error'];
        } else {
            $authError = 'Invalid response from GitHub token endpoint.';
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Authenticating with GitHub...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .card {
            background: #1e293b;
            padding: 2.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            max-width: 420px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .spinner {
            border: 3px solid rgba(255,255,255,0.1);
            border-top: 3px solid #38bdf8;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .error { color: #f87171; }
        h2 { font-size: 1.25rem; margin-top: 0; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="card">
        <?php if ($authError): ?>
            <h2 class="error">Authentication Failed</h2>
            <p><?php echo htmlspecialchars($authError, ENT_QUOTES, 'UTF-8'); ?></p>
            <script>
                (function() {
                    function receiveMessage(e) {
                        window.opener.postMessage(
                            'authorization:github:error:<?php echo json_encode(['error' => $authError]); ?>',
                            e.origin
                        );
                        window.removeEventListener("message", receiveMessage, false);
                    }
                    window.addEventListener("message", receiveMessage, false);
                    window.opener.postMessage("authorizing:github", "*");
                })();
            </script>
        <?php else: ?>
            <div class="spinner"></div>
            <h2>Authorizing with GitHub...</h2>
            <p>Authentication complete. Handshaking with Decap CMS and closing window...</p>
            <script>
                (function() {
                    const token = <?php echo json_encode($token); ?>;
                    function receiveMessage(e) {
                        window.opener.postMessage(
                            'authorization:github:success:' + JSON.stringify({
                                token: token,
                                provider: 'github'
                            }),
                            e.origin
                        );
                        window.removeEventListener("message", receiveMessage, false);
                        setTimeout(function() { window.close(); }, 600);
                    }
                    window.addEventListener("message", receiveMessage, false);
                    window.opener.postMessage("authorizing:github", "*");
                })();
            </script>
        <?php endif; ?>
    </div>
</body>
</html>
