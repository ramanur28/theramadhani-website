<?php
/**
 * Content Marketing & Article Planner API Handler
 * The Ramadhani - Shared Hosting PHP / SQLite Endpoint
 *
 * Supports:
 * - GET: Fetch all article plans (from SQLite with JSON mirror sync)
 * - POST: Single plan creation, bulk CSV import, or live website article sync
 * - PUT: Update existing plan
 * - DELETE: Remove article plan
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// -----------------------------------------------------------------------------
// 1. Database & Snapshot Paths Resolution
// -----------------------------------------------------------------------------
$apiDir = __DIR__;
$publicDir = dirname($apiDir);
$parentDir = dirname($publicDir);

// Detect where data directory resides
if (is_dir($parentDir . '/data')) {
    $dataDir = $parentDir . '/data';
} elseif (is_dir($publicDir . '/data')) {
    $dataDir = $publicDir . '/data';
} else {
    $dataDir = $parentDir . '/data';
    @mkdir($dataDir, 0755, true);
}
@file_put_contents($dataDir . '/.htaccess', "Order deny,allow\nDeny from all\n<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n");

$dbPath = $dataDir . '/article-plans.db';

// Detect JSON mirror path
$jsonPath = $publicDir . '/admin/article-plans.json';
if (!file_exists($jsonPath) && file_exists($parentDir . '/public/admin/article-plans.json')) {
    $jsonPath = $parentDir . '/public/admin/article-plans.json';
}
$adminDir = dirname($jsonPath);
if (!is_dir($adminDir)) {
    @mkdir($adminDir, 0755, true);
}

// -----------------------------------------------------------------------------
// 2. Initialize PDO SQLite Database & Schema
// -----------------------------------------------------------------------------
$pdo = null;
try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS article_plans (
            id TEXT PRIMARY KEY,
            focus_keyphrase TEXT NOT NULL,
            page_role TEXT NOT NULL DEFAULT 'Pillar Page',
            article_title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Planned',
            intent TEXT NOT NULL DEFAULT 'Informational',
            slug TEXT,
            live_url TEXT,
            notes TEXT,
            target_word_count INTEGER DEFAULT 2500,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_article_plans_status ON article_plans(status);
        CREATE INDEX IF NOT EXISTS idx_article_plans_slug ON article_plans(slug);
    ");

    // Seed SQLite from JSON if DB is completely empty but JSON has data
    $count = (int)$pdo->query("SELECT COUNT(*) FROM article_plans")->fetchColumn();
    if ($count === 0 && file_exists($jsonPath)) {
        $raw = @file_get_contents($jsonPath);
        $seed = json_decode($raw, true);
        if (is_array($seed) && count($seed) > 0) {
            $insert = $pdo->prepare("
                INSERT INTO article_plans (
                    id, focus_keyphrase, page_role, article_title, status, intent,
                    slug, live_url, notes, target_word_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            foreach ($seed as $p) {
                $rawKp = $p['focusKeyphrase'] ?? '';
                if (empty($rawKp) && !empty($p['focusKeyphrases']) && is_array($p['focusKeyphrases'])) {
                    $rawKp = implode(', ', $p['focusKeyphrases']);
                }
                $insert->execute([
                    $p['id'] ?? uniqid('plan-', true),
                    $rawKp,
                    $p['pageRole'] ?? 'Pillar Page',
                    $p['articleTitle'] ?? '',
                    $p['status'] ?? 'Planned',
                    $p['intent'] ?? 'Informational',
                    $p['slug'] ?? null,
                    $p['liveUrl'] ?? null,
                    $p['notes'] ?? null,
                    (int)($p['targetWordCount'] ?? 2500),
                    $p['createdAt'] ?? date('c'),
                    $p['updatedAt'] ?? date('c')
                ]);
            }
        }
    }
} catch (\Throwable $e) {
    // Database connection error, PDO remains null and fallback JSON mode is used
    $pdo = null;
}

// -----------------------------------------------------------------------------
// 3. Helper Functions
// -----------------------------------------------------------------------------

function splitKeyphrases($raw): array {
    if (empty($raw)) return [];
    if (is_array($raw)) {
        $items = [];
        foreach ($raw as $k) {
            $k = trim(trim((string)$k), "\"'\t\n\r");
            if ($k !== '') $items[] = $k;
        }
        return array_values(array_unique($items));
    }
    $parts = preg_split('/[,;\r\n]+/', (string)$raw);
    $items = [];
    foreach ($parts as $p) {
        $p = trim(trim($p), "\"'\t\n\r");
        if ($p !== '') $items[] = $p;
    }
    return array_values(array_unique($items));
}

function generateSlug(string $text): string {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    return strtolower($text) ?: 'plan-' . substr(md5(uniqid('', true)), 0, 8);
}

function mapRowToPlan(array $row): array {
    $rawKp = $row['focus_keyphrase'] ?? '';
    $kps = splitKeyphrases($rawKp);
    return [
        'id' => (string)$row['id'],
        'focusKeyphrase' => $rawKp,
        'focusKeyphrases' => $kps,
        'pageRole' => $row['page_role'] ?? 'Pillar Page',
        'articleTitle' => $row['article_title'] ?? '',
        'status' => $row['status'] ?? 'Planned',
        'intent' => $row['intent'] ?? 'Informational',
        'slug' => $row['slug'] ?? '',
        'liveUrl' => $row['live_url'] ?? null,
        'notes' => $row['notes'] ?? null,
        'targetWordCount' => (int)($row['target_word_count'] ?? 2500),
        'createdAt' => $row['created_at'] ?? date('c'),
        'updatedAt' => $row['updated_at'] ?? date('c')
    ];
}

function getAllPlans($pdo, string $jsonPath): array {
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM article_plans ORDER BY updated_at DESC");
            $rows = $stmt->fetchAll();
            $plans = array_map('mapRowToPlan', $rows);
            // Sync to JSON mirror
            @file_put_contents($jsonPath, json_encode($plans, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
            return $plans;
        } catch (\Throwable $e) {}
    }
    if (file_exists($jsonPath)) {
        $data = json_decode(@file_get_contents($jsonPath), true);
        if (is_array($data)) return $data;
    }
    return [];
}

function syncJsonFromDb($pdo, string $jsonPath): void {
    if (!$pdo) return;
    try {
        $stmt = $pdo->query("SELECT * FROM article_plans ORDER BY updated_at DESC");
        $rows = $stmt->fetchAll();
        $plans = array_map('mapRowToPlan', $rows);
        @file_put_contents($jsonPath, json_encode($plans, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    } catch (\Throwable $e) {}
}

function parseCSV(string $csvText): array {
    $errors = [];
    $rows = [];

    // Strip UTF-8 BOM safely across all PHP versions
    $boms = ["\xEF\xBB\xBF", "\xFE\xFF", "\xFF\xFE"];
    $trimmed = trim($csvText);
    foreach ($boms as $bom) {
        if (strpos($trimmed, $bom) === 0) {
            $trimmed = substr($trimmed, strlen($bom));
            break;
        }
    }
    $csvText = trim($trimmed);
    if ($csvText === '') {
        $errors[] = 'File atau teks CSV kosong.';
        return ['rows' => [], 'errors' => $errors];
    }

    $lines = preg_split('/\r?\n/', $csvText);
    if (count($lines) < 2) {
        $errors[] = 'Tidak ada baris data yang ditemukan dalam CSV.';
        return ['rows' => [], 'errors' => $errors];
    }

    $firstLine = $lines[0];
    $delimiter = ',';
    $commaCount = substr_count($firstLine, ',');
    $semiCount = substr_count($firstLine, ';');
    $tabCount = substr_count($firstLine, "\t");
    if ($semiCount > $commaCount && $semiCount >= $tabCount) $delimiter = ';';
    elseif ($tabCount > $commaCount && $tabCount > $semiCount) $delimiter = "\t";

    $rawLines = [];
    foreach ($lines as $line) {
        if (trim($line) === '') continue;
        $parsed = str_getcsv($line, $delimiter);
        if ($parsed && count($parsed) > 0) {
            $rawLines[] = array_map('trim', $parsed);
        }
    }

    if (count($rawLines) < 2) {
        $errors[] = 'Header atau baris data tidak lengkap.';
        return ['rows' => [], 'errors' => $errors];
    }

    $headers = array_map(function($h) {
        return strtolower(trim(trim($h), "\"'\t\n\r"));
    }, $rawLines[0]);

    $findHeader = function(array $aliases) use ($headers) {
        foreach ($headers as $idx => $h) {
            foreach ($aliases as $alias) {
                if ($h === $alias || strpos($h, $alias) !== false) {
                    return $idx;
                }
            }
        }
        return -1;
    };

    $colKeyphrase = $findHeader(['focus keyphrase', 'focus_keyphrase', 'keyphrase', 'keyword', 'keywords', 'kata kunci', 'fokus kata kunci', 'fokus kata-kunci']);
    $colRole = $findHeader(['page role', 'page_role', 'role', 'peran halaman', 'peran', 'page type', 'tipe']);
    $colTitle = $findHeader(['article title', 'article_title', 'title', 'judul artikel', 'judul', 'topic', 'topik']);
    $colStatus = $findHeader(['status', 'state', 'keadaan', 'alur', 'tahap']);
    $colIntent = $findHeader(['intent', 'search intent', 'search_intent', 'niat pencarian', 'niat', 'maksud']);
    $colNotes = $findHeader(['notes', 'catatan', 'keterangan', 'description', 'deskripsi']);

    if ($colTitle === -1 && $colKeyphrase === -1) {
        $errors[] = 'Header CSV harus menyertakan minimal kolom "Article Title" atau "Focus Keyphrase". Ditemukan: ' . implode(', ', $headers);
        return ['rows' => [], 'errors' => $errors];
    }

    for ($i = 1; $i < count($rawLines); $i++) {
        $line = $rawLines[$i];
        $rawTitle = ($colTitle !== -1 && isset($line[$colTitle])) ? trim($line[$colTitle], "\"'\t\n\r ") : '';
        $rawKp = ($colKeyphrase !== -1 && isset($line[$colKeyphrase])) ? trim($line[$colKeyphrase], "\"'\t\n\r ") : '';
        if ($rawTitle === '' && $rawKp === '') continue;

        $kps = splitKeyphrases($rawKp);
        $title = $rawTitle !== '' ? $rawTitle : ($kps[0] ?? '');
        $kpString = count($kps) > 0 ? implode(', ', $kps) : $title;

        $rawRole = ($colRole !== -1 && isset($line[$colRole])) ? strtolower($line[$colRole]) : '';
        $pageRole = 'Topic Cluster';
        if (strpos($rawRole, 'pillar') !== false) $pageRole = 'Pillar Page';
        elseif (strpos($rawRole, 'guide') !== false || strpos($rawRole, 'panduan') !== false) $pageRole = 'Supporting Guide';
        elseif (strpos($rawRole, 'case') !== false || strpos($rawRole, 'studi') !== false) $pageRole = 'Case Study';
        elseif (strpos($rawRole, 'landing') !== false) $pageRole = 'Landing Page';

        $rawStatus = ($colStatus !== -1 && isset($line[$colStatus])) ? strtolower($line[$colStatus]) : '';
        $status = 'Planned';
        if (strpos($rawStatus, 'pub') !== false || strpos($rawStatus, 'live') !== false || strpos($rawStatus, 'terbit') !== false) $status = 'Published';
        elseif (strpos($rawStatus, 'sched') !== false || strpos($rawStatus, 'jadwal') !== false) $status = 'Scheduled';
        elseif (strpos($rawStatus, 'review') !== false || strpos($rawStatus, 'siap') !== false) $status = 'Ready to Review';
        elseif (strpos($rawStatus, 'prog') !== false || strpos($rawStatus, 'tulis') !== false || strpos($rawStatus, 'draft') !== false) $status = 'In Progress';

        $rawIntent = ($colIntent !== -1 && isset($line[$colIntent])) ? strtolower($line[$colIntent]) : '';
        $intent = 'Informational';
        if (strpos($rawIntent, 'comm') !== false || strpos($rawIntent, 'komersial') !== false) $intent = 'Commercial Investigation';
        elseif (strpos($rawIntent, 'trans') !== false || strpos($rawIntent, 'beli') !== false) $intent = 'Transactional';
        elseif (strpos($rawIntent, 'nav') !== false) $intent = 'Navigational';

        $notes = ($colNotes !== -1 && isset($line[$colNotes])) ? trim($line[$colNotes]) : null;

        $rows[] = [
            'articleTitle' => $title,
            'focusKeyphrase' => $kpString,
            'focusKeyphrases' => count($kps) > 0 ? $kps : [$title],
            'pageRole' => $pageRole,
            'status' => $status,
            'intent' => $intent,
            'notes' => $notes ?: null,
        ];
    }

    return ['rows' => $rows, 'errors' => $errors];
}

// -------------------------------------------------------------
// 4. Request Router
// -------------------------------------------------------------
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($uri, PHP_URL_PATH) ?: '';

// GET: Retrieve all plans
if ($method === 'GET') {
    $plans = getAllPlans($pdo, $jsonPath);
    echo json_encode($plans, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// Read JSON input
$bodyRaw = file_get_contents('php://input');
$payload = json_decode($bodyRaw, true) ?: [];

// POST: Actions (bulk, sync, or create)
if ($method === 'POST') {
    $isBulk = (strpos($path, '/bulk') !== false) || (($payload['action'] ?? '') === 'bulk');
    $isSync = (strpos($path, '/sync') !== false) || (($payload['action'] ?? '') === 'sync');

    if ($isBulk) {
        $itemsToInsert = [];
        $parseErrors = [];

        if (!empty($payload['plans']) && is_array($payload['plans'])) {
            $itemsToInsert = $payload['plans'];
        } elseif (!empty($payload['csvText'])) {
            $parsed = parseCSV((string)$payload['csvText']);
            $itemsToInsert = $parsed['rows'];
            $parseErrors = $parsed['errors'];
        }

        if (empty($itemsToInsert)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'inserted' => 0,
                'errors' => !empty($parseErrors) ? $parseErrors : ['Tidak ada baris data CSV yang valid untuk diimpor.']
            ]);
            exit;
        }

        $insertedCount = 0;
        $insertErrors = [];

        if ($pdo) {
            try {
                $pdo->beginTransaction();
                $stmt = $pdo->prepare("
                    INSERT INTO article_plans (
                        id, focus_keyphrase, page_role, article_title, status, intent,
                        slug, live_url, notes, target_word_count, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");

                $now = date('c');
                foreach ($itemsToInsert as $item) {
                    $rawTitle = trim((string)($item['articleTitle'] ?? ''));
                    $rawKp = $item['focusKeyphrase'] ?? '';
                    if (empty($rawKp) && !empty($item['focusKeyphrases']) && is_array($item['focusKeyphrases'])) {
                        $rawKp = implode(', ', $item['focusKeyphrases']);
                    }
                    if ($rawTitle === '' && empty($rawKp)) continue;

                    $kps = splitKeyphrases(!empty($item['focusKeyphrases']) ? $item['focusKeyphrases'] : $rawKp);
                    $kpString = count($kps) > 0 ? implode(', ', $kps) : $rawTitle;
                    $title = $rawTitle !== '' ? $rawTitle : ($kps[0] ?? 'Untitled');
                    $id = $item['id'] ?? ('plan-' . round(microtime(true) * 1000) . '-' . substr(md5(uniqid('', true)), 0, 4));
                    $slug = !empty($item['slug']) ? $item['slug'] : generateSlug($title);

                    $stmt->execute([
                        $id,
                        $kpString,
                        $item['pageRole'] ?? 'Pillar Page',
                        $title,
                        $item['status'] ?? 'Planned',
                        $item['intent'] ?? 'Informational',
                        $slug,
                        $item['liveUrl'] ?? null,
                        $item['notes'] ?? null,
                        (int)($item['targetWordCount'] ?? 2500),
                        $item['createdAt'] ?? $now,
                        $now
                    ]);
                    $insertedCount++;
                }

                $pdo->commit();
                syncJsonFromDb($pdo, $jsonPath);
            } catch (\Throwable $err) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                $insertErrors[] = 'Transaction error: ' . $err->getMessage();
            }
        } else {
            // Fallback to JSON file
            $plans = getAllPlans(null, $jsonPath);
            $now = date('c');
            foreach ($itemsToInsert as $item) {
                $rawTitle = trim((string)($item['articleTitle'] ?? ''));
                $kps = splitKeyphrases(!empty($item['focusKeyphrases']) ? $item['focusKeyphrases'] : ($item['focusKeyphrase'] ?? ''));
                $kpString = count($kps) > 0 ? implode(', ', $kps) : $rawTitle;
                $title = $rawTitle !== '' ? $rawTitle : ($kps[0] ?? 'Untitled');
                $id = $item['id'] ?? ('plan-' . round(microtime(true) * 1000) . '-' . substr(md5(uniqid('', true)), 0, 4));
                array_unshift($plans, [
                    'id' => $id,
                    'focusKeyphrase' => $kpString,
                    'focusKeyphrases' => count($kps) > 0 ? $kps : [$title],
                    'pageRole' => $item['pageRole'] ?? 'Pillar Page',
                    'articleTitle' => $title,
                    'status' => $item['status'] ?? 'Planned',
                    'intent' => $item['intent'] ?? 'Informational',
                    'slug' => !empty($item['slug']) ? $item['slug'] : generateSlug($title),
                    'liveUrl' => $item['liveUrl'] ?? null,
                    'notes' => $item['notes'] ?? null,
                    'targetWordCount' => (int)($item['targetWordCount'] ?? 2500),
                    'createdAt' => $item['createdAt'] ?? $now,
                    'updatedAt' => $now
                ]);
                $insertedCount++;
            }
            @file_put_contents($jsonPath, json_encode($plans, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        }

        $allErrors = array_merge($parseErrors, $insertErrors);
        if ($insertedCount === 0 && !empty($allErrors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'inserted' => 0,
                'errors' => $allErrors
            ]);
            exit;
        }

        echo json_encode([
            'success' => true,
            'inserted' => $insertedCount,
            'errors' => $allErrors,
            'plans' => getAllPlans($pdo, $jsonPath)
        ]);
        exit;
    }

    if ($isSync) {
        $articlesDir = $parentDir . '/src/content/articles';
        if (!is_dir($articlesDir) && is_dir($publicDir . '/../src/content/articles')) {
            $articlesDir = realpath($publicDir . '/../src/content/articles');
        }

        $websiteArticles = [];
        if ($articlesDir && is_dir($articlesDir)) {
            $files = scandir($articlesDir);
            foreach ($files as $f) {
                if (preg_match('/\.(md|mdx)$/i', $f)) {
                    $filePath = $articlesDir . '/' . $f;
                    $text = @file_get_contents($filePath);
                    if (!$text) continue;

                    preg_match('/^title:\s*[\x22\x27]?([^\x22\x27\r\n]+)[\x22\x27]?/m', $text, $titleM);
                    preg_match('/^slug:\s*[\x22\x27]?([^\x22\x27\r\n]+)[\x22\x27]?/m', $text, $slugM);
                    preg_match('/^description:\s*[\x22\x27]?([^\x22\x27\r\n]+)[\x22\x27]?/m', $text, $descM);
                    preg_match('/^status:\s*[\x22\x27]?([^\x22\x27\r\n]+)[\x22\x27]?/m', $text, $statusM);
                    preg_match('/^draft:\s*(true|false)/im', $text, $draftM);
                    preg_match('/^publishDate:\s*[\x22\x27]?([^\x22\x27\r\n]+)[\x22\x27]?/m', $text, $pubDateM);

                    $fileSlug = pathinfo($filePath, PATHINFO_FILENAME);
                    $slug = !empty($slugM[1]) ? trim($slugM[1]) : $fileSlug;

                    $tags = [];
                    if (preg_match('/^tags:\s*\[(.*?)\]/m', $text, $tagsBracketM)) {
                        $rawTags = explode(',', $tagsBracketM[1]);
                        foreach ($rawTags as $rt) {
                            $t = trim(trim($rt), "\x22\x27");
                            if ($t !== '') $tags[] = $t;
                        }
                    } elseif (preg_match('/^tags:\s*\n((?:\s*-\s*.+\n?)+)/m', $text, $tagsBlockM)) {
                        $lines = explode("\n", $tagsBlockM[1]);
                        foreach ($lines as $line) {
                            $t = trim(trim(preg_replace('/^\s*-\s*/', '', $line)), "\x22\x27");
                            if ($t !== '') $tags[] = $t;
                        }
                    }

                    $rawStatus = !empty($statusM[1]) ? strtolower(trim($statusM[1])) : 'published';
                    $isDraft = (!empty($draftM[1]) && strtolower($draftM[1]) === 'true') || ($rawStatus === 'draft');
                    $publishDate = !empty($pubDateM[1]) ? trim($pubDateM[1]) : null;

                    // Determine real status
                    $determinedStatus = 'Published';
                    if ($isDraft) {
                        $determinedStatus = 'In Progress';
                    } elseif ($rawStatus === 'scheduled') {
                        $determinedStatus = 'Scheduled';
                    } elseif ($publishDate) {
                        $pubTime = strtotime($publishDate);
                        if ($pubTime && $pubTime > time()) {
                            $determinedStatus = 'Scheduled';
                        }
                    }

                    $websiteArticles[] = [
                        'title' => !empty($titleM[1]) ? trim($titleM[1]) : $fileSlug,
                        'slug' => $slug,
                        'url' => '/articles/' . $slug . '/',
                        'description' => !empty($descM[1]) ? trim($descM[1]) : '',
                        'tags' => array_values($tags),
                        'status' => $determinedStatus,
                    ];
                }
            }
        }

        $currentPlans = getAllPlans($pdo, $jsonPath);
        $syncedCount = 0;
        $newImportedCount = 0;
        $updatedPlanIds = [];
        $importedPlanIds = [];

        $liveBySlug = [];
        $liveByTitle = [];
        foreach ($websiteArticles as $art) {
            $liveBySlug[normalizeText($art['slug'])] = $art;
            $liveByTitle[normalizeText($art['title'])] = $art;
        }

        foreach ($currentPlans as &$plan) {
            $pSlug = normalizeText($plan['slug'] ?? generateSlug($plan['articleTitle']));
            $pTitle = normalizeText($plan['articleTitle']);

            $matchedArt = $liveBySlug[$pSlug] ?? ($liveByTitle[$pTitle] ?? null);
            if ($matchedArt) {
                $needsUpdate = false;
                $targetStatus = $matchedArt['status'];

                if ($plan['status'] !== $targetStatus) {
                    $plan['status'] = $targetStatus;
                    $needsUpdate = true;
                }
                if (($plan['liveUrl'] ?? '') !== $matchedArt['url']) {
                    $plan['liveUrl'] = $matchedArt['url'];
                    $needsUpdate = true;
                }
                if (($plan['slug'] ?? '') !== $matchedArt['slug']) {
                    $plan['slug'] = $matchedArt['slug'];
                    $needsUpdate = true;
                }
                if ($needsUpdate) {
                    $plan['updatedAt'] = date('c');
                    $syncedCount++;
                    $updatedPlanIds[] = $plan['id'];

                    if ($pdo) {
                        $stmt = $pdo->prepare("UPDATE article_plans SET status = ?, live_url = ?, slug = ?, updated_at = ? WHERE id = ?");
                        $stmt->execute([$plan['status'], $plan['liveUrl'], $plan['slug'], $plan['updatedAt'], $plan['id']]);
                    }
                }
            } else {
                if ($plan['status'] === 'Published' || $plan['status'] === 'Scheduled') {
                    $plan['status'] = 'Planned';
                    $plan['liveUrl'] = null;
                    $plan['updatedAt'] = date('c');
                    $syncedCount++;
                    $updatedPlanIds[] = $plan['id'];

                    if ($pdo) {
                        $stmt = $pdo->prepare("UPDATE article_plans SET status = 'Planned', live_url = NULL, updated_at = ? WHERE id = ?");
                        $stmt->execute([$plan['updatedAt'], $plan['id']]);
                    }
                }
            }
        }
        unset($plan);

        // Auto-import missing articles
        $existingSlugs = [];
        $existingTitles = [];
        foreach ($currentPlans as $p) {
            $existingSlugs[normalizeText($p['slug'] ?? generateSlug($p['articleTitle']))] = true;
            $existingTitles[normalizeText($p['articleTitle'])] = true;
        }

        foreach ($websiteArticles as $art) {
            $aSlug = normalizeText($art['slug']);
            $aTitle = normalizeText($art['title']);

            if (!isset($existingSlugs[$aSlug]) && !isset($existingTitles[$aTitle])) {
                $focusKeyphrase = count($art['tags']) > 0 ? implode(', ', $art['tags']) : explode(':', $art['title'])[0];
                $kps = splitKeyphrases($focusKeyphrase);

                $pageRole = 'Topic Cluster';
                $tLower = strtolower($art['title']);
                if (strpos($tLower, 'guide') !== false || strpos($tLower, 'blueprint') !== false || strpos($tLower, 'complete') !== false) {
                    $pageRole = 'Pillar Page';
                }

                $newId = 'plan-' . round(microtime(true) * 1000) . '-' . substr(md5(uniqid('', true)), 0, 4);
                $now = date('c');
                $newPlan = [
                    'id' => $newId,
                    'focusKeyphrase' => $focusKeyphrase,
                    'focusKeyphrases' => count($kps) > 0 ? $kps : [$art['title']],
                    'pageRole' => $pageRole,
                    'articleTitle' => $art['title'],
                    'status' => $art['status'],
                    'intent' => 'Informational',
                    'slug' => $art['slug'],
                    'liveUrl' => $art['url'],
                    'notes' => !empty($art['description']) ? ('Ringkasan: ' . $art['description']) : null,
                    'targetWordCount' => 2500,
                    'createdAt' => $now,
                    'updatedAt' => $now
                ];

                if ($pdo) {
                    $stmt = $pdo->prepare("
                        INSERT INTO article_plans (id, focus_keyphrase, page_role, article_title, status, intent, slug, live_url, notes, target_word_count, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $newPlan['id'], $newPlan['focusKeyphrase'], $newPlan['pageRole'], $newPlan['articleTitle'],
                        $newPlan['status'], $newPlan['intent'], $newPlan['slug'], $newPlan['liveUrl'],
                        $newPlan['notes'], $newPlan['targetWordCount'], $newPlan['createdAt'], $newPlan['updatedAt']
                    ]);
                }

                array_unshift($currentPlans, $newPlan);
                $newImportedCount++;
                $importedPlanIds[] = $newId;
                $existingSlugs[$aSlug] = true;
                $existingTitles[$aTitle] = true;
            }
        }

        @file_put_contents($jsonPath, json_encode($currentPlans, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

        $publishedCount = 0; $scheduledCount = 0; $inProgressCount = 0; $plannedCount = 0;
        foreach ($currentPlans as $p) {
            $st = $p['status'] ?? 'Planned';
            if ($st === 'Published') $publishedCount++;
            elseif ($st === 'Scheduled') $scheduledCount++;
            elseif ($st === 'In Progress') $inProgressCount++;
            else $plannedCount++;
        }

        echo json_encode([
            'success' => true,
            'syncedCount' => $syncedCount,
            'newImportedCount' => $newImportedCount,
            'updatedPlanIds' => $updatedPlanIds,
            'importedPlanIds' => $importedPlanIds,
            'statusSummary' => [
                'total' => count($currentPlans),
                'published' => $publishedCount,
                'scheduled' => $scheduledCount,
                'inProgress' => $inProgressCount,
                'planned' => $plannedCount,
            ],
            'plans' => $currentPlans
        ]);
        exit;
    }

    // Single plan creation
    $now = date('c');
    $rawTitle = trim((string)($payload['articleTitle'] ?? ''));
    $kps = splitKeyphrases(!empty($payload['focusKeyphrases']) ? $payload['focusKeyphrases'] : ($payload['focusKeyphrase'] ?? ''));
    $kpString = count($kps) > 0 ? implode(', ', $kps) : $rawTitle;
    $title = $rawTitle !== '' ? $rawTitle : ($kps[0] ?? 'Untitled Plan');
    $id = $payload['id'] ?? ('plan-' . round(microtime(true) * 1000) . '-' . substr(md5(uniqid('', true)), 0, 4));
    $slug = !empty($payload['slug']) ? $payload['slug'] : generateSlug($title);

    $newPlan = [
        'id' => $id,
        'focusKeyphrase' => $kpString,
        'focusKeyphrases' => count($kps) > 0 ? $kps : [$title],
        'pageRole' => $payload['pageRole'] ?? 'Pillar Page',
        'articleTitle' => $title,
        'status' => $payload['status'] ?? 'Planned',
        'intent' => $payload['intent'] ?? 'Informational',
        'slug' => $slug,
        'liveUrl' => $payload['liveUrl'] ?? null,
        'notes' => $payload['notes'] ?? null,
        'targetWordCount' => (int)($payload['targetWordCount'] ?? 2500),
        'createdAt' => $payload['createdAt'] ?? $now,
        'updatedAt' => $now
    ];

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO article_plans (
                    id, focus_keyphrase, page_role, article_title, status, intent,
                    slug, live_url, notes, target_word_count, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $newPlan['id'],
                $newPlan['focusKeyphrase'],
                $newPlan['pageRole'],
                $newPlan['articleTitle'],
                $newPlan['status'],
                $newPlan['intent'],
                $newPlan['slug'],
                $newPlan['liveUrl'],
                $newPlan['notes'],
                $newPlan['targetWordCount'],
                $newPlan['createdAt'],
                $newPlan['updatedAt']
            ]);
            syncJsonFromDb($pdo, $jsonPath);
        } catch (\Throwable $e) {}
    } else {
        $plans = getAllPlans(null, $jsonPath);
        array_unshift($plans, $newPlan);
        @file_put_contents($jsonPath, json_encode($plans, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    echo json_encode([
        'success' => true,
        'plan' => $newPlan,
        'plans' => getAllPlans($pdo, $jsonPath)
    ]);
    exit;
}

// PUT: Update plan
if ($method === 'PUT') {
    $id = (string)($payload['id'] ?? '');
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing plan id']);
        exit;
    }

    $now = date('c');
    $rawTitle = isset($payload['articleTitle']) ? trim((string)$payload['articleTitle']) : null;
    $kps = isset($payload['focusKeyphrases']) || isset($payload['focusKeyphrase'])
        ? splitKeyphrases(!empty($payload['focusKeyphrases']) ? $payload['focusKeyphrases'] : ($payload['focusKeyphrase'] ?? ''))
        : null;

    if ($pdo) {
        try {
            $existing = $pdo->prepare("SELECT * FROM article_plans WHERE id = ?");
            $existing->execute([$id]);
            $row = $existing->fetch();
            if ($row) {
                $title = $rawTitle !== null ? $rawTitle : $row['article_title'];
                $kpString = $kps !== null ? (count($kps) > 0 ? implode(', ', $kps) : $title) : $row['focus_keyphrase'];
                $update = $pdo->prepare("
                    UPDATE article_plans SET
                        focus_keyphrase = ?, page_role = ?, article_title = ?, status = ?,
                        intent = ?, slug = ?, live_url = ?, notes = ?, target_word_count = ?, updated_at = ?
                    WHERE id = ?
                ");
                $update->execute([
                    $kpString,
                    $payload['pageRole'] ?? $row['page_role'],
                    $title,
                    $payload['status'] ?? $row['status'],
                    $payload['intent'] ?? $row['intent'],
                    $payload['slug'] ?? $row['slug'],
                    $payload['liveUrl'] ?? $row['live_url'],
                    $payload['notes'] ?? $row['notes'],
                    (int)($payload['targetWordCount'] ?? $row['target_word_count']),
                    $now,
                    $id
                ]);
                syncJsonFromDb($pdo, $jsonPath);
            }
        } catch (\Throwable $e) {}
    } else {
        $plans = getAllPlans(null, $jsonPath);
        foreach ($plans as $idx => $p) {
            if ($p['id'] === $id) {
                $plans[$idx] = array_merge($p, $payload, ['updatedAt' => $now]);
                break;
            }
        }
        @file_put_contents($jsonPath, json_encode($plans, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    echo json_encode([
        'success' => true,
        'plans' => getAllPlans($pdo, $jsonPath)
    ]);
    exit;
}

// DELETE: Delete plan
if ($method === 'DELETE') {
    $id = (string)($payload['id'] ?? '');
    if (!$id && preg_match('#/api/article-plans/([^/]+)$#', $path, $m)) {
        $id = $m[1];
    }
    if ($id && $pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM article_plans WHERE id = ?");
            $stmt->execute([$id]);
            syncJsonFromDb($pdo, $jsonPath);
        } catch (\Throwable $e) {}
    } elseif ($id) {
        $plans = getAllPlans(null, $jsonPath);
        $plans = array_values(array_filter($plans, function($p) use ($id) { return $p['id'] !== $id; }));
        @file_put_contents($jsonPath, json_encode($plans, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    echo json_encode([
        'success' => true,
        'plans' => getAllPlans($pdo, $jsonPath)
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method Not Allowed']);
