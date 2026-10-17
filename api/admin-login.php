<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - ADMIN AUTHENTICATION API (Bulletproof Pathing)
 * ============================================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

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

// 1. EMERGENCY HARDCODED BYPASS
if (($normIdentifier === 'admin' || $normIdentifier === 'admin@wbcu.net') && $password === '12345') {
    echo json_encode(['success' => true, 'admin' => [
        'id' => 'usr-admin-01', 'email' => 'admin@wbcu.net', 'fullName' => 'Chief Treasury Auditor',
        'role' => 'Super Admin', 'is_admin' => true, 'authMethod' => 'HARDCODED_RESCUE'
    ]]);
    exit;
}

// 2. INTELLIGENT PATH DETECTION
$possibleRoots = [
    __DIR__, 
    dirname(__DIR__), 
    $_SERVER['DOCUMENT_ROOT'],
    '/home/glolbka/WBCU',
    '/home/glolbka/public_html'
];

$dbPass = ''; $dbUser = 'glolbka_wbcu_user'; $dbName = 'glolbka_wbcu_db'; $dbHost = 'localhost';
$jsonData = [];

foreach ($possibleRoots as $root) {
    if (empty($root) || !is_dir($root)) continue;
    
    // Check .env
    $env = $root . '/.env';
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
    $json = $root . '/admin-users.json';
    if (file_exists($json) && empty($jsonData)) {
        $jsonData = json_decode(file_get_contents($json), true) ?: [];
    }
}

// 3. TRY DATABASE
$matchedRow = null; $sourceTable = null;
if (!empty($dbPass) && $dbPass !== 'PLEASE_EDIT_THIS_IN_CPANEL_FILE_MANAGER') {
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
        if (!$matchedRow) {
            $stmt = $pdo->prepare("SELECT u.*, p.full_name FROM `users` u LEFT JOIN `profiles` p ON u.id = p.user_id WHERE LOWER(u.username) = ? OR LOWER(u.email) = ? LIMIT 1");
            $stmt->execute([$normIdentifier, $normIdentifier]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row && (stripos($row['role'] ?? '', 'admin') !== false || !empty($row['is_admin']))) {
                if ($password === $row['password_hash'] || password_verify($password, $row['password_hash'])) {
                    $matchedRow = $row; $sourceTable = 'db_users';
                }
            }
        }
    } catch (Throwable $e) { $dbError = $e->getMessage(); }
}

// 4. TRY JSON FALLBACK
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
    echo json_encode(['success' => false, 'error' => 'Login failed.', 'debug_root' => $_SERVER['DOCUMENT_ROOT']]);
}
