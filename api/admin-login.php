<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - ADMIN AUTHENTICATION API (Path-Intelligent & Rescue)
 * ============================================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true) ?: [];
$identifier = trim($inputData['identifier'] ?? $inputData['email'] ?? $inputData['username'] ?? $_POST['email'] ?? $_POST['username'] ?? '');
$password = trim($inputData['password'] ?? $_POST['password'] ?? '');
$normIdentifier = strtolower($identifier);

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Credentials required.']);
    exit;
}

// 1. EMERGENCY RESCUE MODE (Bypasses everything)
if (($normIdentifier === 'admin' || $normIdentifier === 'admin@wbcu.net') && $password === '12345') {
    echo json_encode(['success' => true, 'admin' => [
        'id' => 'usr-admin-01', 'email' => 'admin@wbcu.net', 'username' => 'admin',
        'fullName' => 'Chief Treasury Auditor', 'role' => 'Super Admin', 'is_admin' => true,
        'authMethod' => 'HARDCODED_RESCUE', 'authenticatedAt' => date('c')
    ]]);
    exit;
}

// 2. Locate Files (.env and admin-users.json)
$searchPaths = [
    __DIR__, 
    dirname(__DIR__), 
    dirname(dirname(__DIR__)),
    '/home/glolbka/public_html',
    '/home/glolbka/WBCU',
    $_SERVER['DOCUMENT_ROOT'] ?? ''
];

$dbPass = ''; $dbUser = 'glolbka_wbcu_user'; $dbName = 'glolbka_wbcu_db'; $dbHost = 'localhost';
$jsonData = [];

foreach ($searchPaths as $path) {
    if (empty($path)) continue;
    
    // Check .env
    $env = $path . '/.env';
    if (file_exists($env)) {
        $lines = @file($env, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines) {
            foreach ($lines as $l) {
                $parts = explode('=', $l, 2);
                if (count($parts) < 2) continue;
                $k = trim($parts[0]); $v = trim($parts[1], " \t\n\r\0\x0B\"'");
                if ($k === 'DB_PASS' || $k === 'DB_PASSWORD') $dbPass = $v;
                if ($k === 'DB_USER') $dbUser = $v;
                if ($k === 'DB_NAME') $dbName = $v;
                if ($k === 'DB_HOST') $dbHost = $v;
            }
        }
    }
    
    // Check JSON
    $json = $path . '/admin-users.json';
    if (file_exists($json) && empty($jsonData)) {
        $jsonData = json_decode(file_get_contents($json), true) ?: [];
    }
}

// 3. Try Database
$matchedRow = null; $sourceTable = null;
if (!empty($dbPass)) {
    try {
        $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 3
        ]);
        $stmt = $pdo->prepare("SELECT * FROM `admins` WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1");
        $stmt->execute([$normIdentifier, $normIdentifier]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row && ($password === $row['password_hash'] || password_verify($password, $row['password_hash']))) {
            $matchedRow = $row; $sourceTable = 'db_admins';
        }
    } catch (Throwable $e) {}
}

// 4. Try JSON
if (!$matchedRow && !empty($jsonData)) {
    foreach ($jsonData as $u) {
        if (strtolower($u['email'] ?? '') === $normIdentifier || strtolower($u['username'] ?? '') === $normIdentifier) {
            if ($password === ($u['password'] ?? '')) {
                $matchedRow = $u; $sourceTable = 'json_store'; break;
            }
        }
    }
}

if ($matchedRow) {
    echo json_encode(['success' => true, 'admin' => [
        'id' => $matchedRow['id'] ?? 'adm-01',
        'email' => $matchedRow['email'] ?? $identifier,
        'fullName' => $matchedRow['full_name'] ?? $matchedRow['fullName'] ?? 'Officer',
        'role' => 'Super Admin', 'is_admin' => true, 'source' => $sourceTable
    ]]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Access Denied.', 'db_connected' => !empty($dbPass)]);
}
