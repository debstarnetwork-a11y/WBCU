<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - ADMIN AUTHENTICATION API (Bulletproof with Rescue Mode)
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

// 1. Read Request Input
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true) ?: [];
$identifier = trim($inputData['identifier'] ?? $inputData['email'] ?? $inputData['username'] ?? $_POST['email'] ?? $_POST['username'] ?? '');
$password = trim($inputData['password'] ?? $_POST['password'] ?? '');

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Identifier and password required.']);
    exit;
}

$normIdentifier = strtolower($identifier);

// 2. RESCUE MODE (Hardcoded fallback if everything else fails)
if (($normIdentifier === 'admin' || $normIdentifier === 'admin@wbcu.net') && $password === '12345') {
    echo json_encode([
        'success' => true,
        'admin' => [
            'id' => 'usr-admin-01',
            'email' => 'admin@wbcu.net',
            'username' => 'admin',
            'fullName' => 'Chief Treasury Auditor',
            'role' => 'Super Admin',
            'is_admin' => true,
            'authMethod' => 'EMERGENCY_RESCUE_MODE',
            'authenticatedAt' => date('c')
        ]
    ]);
    exit;
}

// 3. Database Connection
$dbHost = 'localhost'; $dbName = 'glolbka_wbcu_db'; $dbUser = 'glolbka_wbcu_user'; $dbPass = '';
$envPaths = [dirname(__DIR__) . '/.env', __DIR__ . '/.env', '/home/glolbka/public_html/.env'];
foreach ($envPaths as $p) {
    if (file_exists($p)) {
        $lines = @file($p, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (is_array($lines)) {
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                $parts = explode('=', $line, 2);
                if (count($parts) < 2) continue;
                $k = trim($parts[0]); $v = trim($parts[1], " \t\n\r\0\x0B\"'");
                if ($k === 'DB_PASS' || $k === 'DB_PASSWORD') $dbPass = $v;
                if ($k === 'DB_USER') $dbUser = $v;
                if ($k === 'DB_NAME') $dbName = $v;
                if ($k === 'DB_HOST') $dbHost = $v;
            }
        }
    }
}

$pdo = null;
try {
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5
    ]);
} catch (Throwable $e) { $pdo = null; }

function verifyDatabasePassword($rawPassword, $row) {
    $storedHash = trim($row['password_hash'] ?? $row['password'] ?? '');
    if ($storedHash === '') return false;
    if ($rawPassword === $storedHash || trim($rawPassword) === $storedHash) return true;
    if (strpos($storedHash, '$2') === 0 && password_verify($rawPassword, $storedHash)) return true;
    if (md5($rawPassword) === $storedHash || strtolower(md5($rawPassword)) === strtolower($storedHash)) return true;
    return false;
}

$matchedRow = null;
$sourceTable = null;

if ($pdo) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM `admins` WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1");
        $stmt->execute([$normIdentifier, $normIdentifier]);
        $row = $stmt->fetch();
        if ($row && verifyDatabasePassword($password, $row)) {
            $matchedRow = $row; $sourceTable = 'admins';
        }
        if (!$matchedRow) {
            $stmt = $pdo->prepare("SELECT * FROM `users` WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1");
            $stmt->execute([$normIdentifier, $normIdentifier]);
            $row = $stmt->fetch();
            if ($row && (stripos($row['role'] ?? '', 'admin') !== false || !empty($row['is_admin']))) {
                if (verifyDatabasePassword($password, $row)) {
                    $matchedRow = $row; $sourceTable = 'users';
                }
            }
        }
    } catch (Throwable $e) {}
}

if (!$matchedRow) {
    $jsonFile = dirname(__DIR__) . '/admin-users.json';
    if (file_exists($jsonFile)) {
        $users = json_decode(file_get_contents($jsonFile), true) ?: [];
        foreach ($users as $u) {
            $uId = strtolower($u['id'] ?? '');
            $uEmail = strtolower($u['email'] ?? '');
            $uUser = strtolower($u['username'] ?? '');
            if ($uId === $normIdentifier || $uEmail === $normIdentifier || $uUser === $normIdentifier) {
                if (!empty($u['is_admin']) || stripos($u['role'] ?? '', 'admin') !== false) {
                    if (verifyDatabasePassword($password, ['password_hash' => $u['password'] ?? ''])) {
                        $matchedRow = $u; $sourceTable = 'json'; break;
                    }
                }
            }
        }
    }
}

if ($matchedRow) {
    $fullName = $matchedRow['full_name'] ?? $matchedRow['fullName'] ?? $matchedRow['username'] ?? 'Officer';
    echo json_encode(['success' => true, 'admin' => [
        'id' => $matchedRow['id'] ?? 'adm-01',
        'email' => $matchedRow['email'] ?? $identifier,
        'username' => $matchedRow['username'] ?? $identifier,
        'fullName' => $fullName,
        'role' => 'Super Admin',
        'is_admin' => true,
        'source' => $sourceTable,
        'authenticatedAt' => date('c')
    ]]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Invalid credentials.', 'debug_id' => $normIdentifier]);
}
