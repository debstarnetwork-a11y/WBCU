<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - UNIFIED AUTHENTICATION ENGINE (ADMIN & MEMBER)
 * ============================================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// 1. CAPTURE DATA (Handle JSON, POST, and even broken cPanel streams)
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true) ?: [];
$identifier = trim($inputData['identifier'] ?? $inputData['email'] ?? $inputData['username'] ?? $_POST['email'] ?? $_POST['username'] ?? '');
$password = trim($inputData['password'] ?? $_POST['password'] ?? '');
$normId = strtolower($identifier);

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing credentials.', 'received' => ['id' => $identifier ? 'YES' : 'NO', 'pass' => $password ? 'YES' : 'NO']]);
    exit;
}

// 2. EMERGENCY RESCUE BYPASS (Guaranteed Access)
if (($normId === 'admin' || $normId === 'admin@wbcu.net') && ($password === '12345')) {
    echo json_encode(['success' => true, 'admin' => [
        'id' => 'usr-admin-01', 'email' => 'admin@wbcu.net', 'username' => 'admin',
        'fullName' => 'Chief Treasury Auditor', 'role' => 'Super Admin', 'is_admin' => true, 'authMethod' => 'EMERGENCY_BYPASS'
    ]]);
    exit;
}

// 3. LOCATE CONFIGURATION
$root = dirname(__DIR__);
$dbPass = ''; $dbUser = 'glolbka_wbcu_user'; $dbName = 'glolbka_wbcu_db'; $dbHost = 'localhost';
$jsonData = [];

// Priority check in WBCU folder
foreach ([$root, '/home/glolbka/WBCU', '/home/glolbka/public_html'] as $path) {
    if (file_exists($path . '/.env')) {
        $lines = @file($path . '/.env', FILE_IGNORE_NEW_LINES);
        foreach ($lines as $l) {
            $p = explode('=', $l, 2);
            if (count($p) == 2) {
                $k = trim($p[0]); $v = trim($p[1], " \"'");
                if ($k === 'DB_PASS' || $k === 'DB_PASSWORD') $dbPass = $v;
                if ($k === 'DB_USER') $dbUser = $v;
                if ($k === 'DB_NAME') $dbName = $v;
            }
        }
    }
    if (file_exists($path . '/admin-users.json') && empty($jsonData)) {
        $jsonData = json_decode(file_get_contents($path . '/admin-users.json'), true) ?: [];
    }
}

// 4. DATABASE AUTHENTICATION
if (!empty($dbPass) && !str_contains($dbPass, 'PLEASE_EDIT')) {
    try {
        $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [PDO::ATTR_TIMEOUT => 3]);
        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE LOWER(email) = ? OR LOWER(username) = ? OR id = ? LIMIT 1");
        $stmt->execute([$normId, $normId, $identifier]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Check password (Plaintext or Bcrypt)
            $stored = $user['password_hash'] ?? '';
            if ($password === $stored || password_verify($password, $stored)) {
                $role = strtolower($user['role'] ?? 'user');
                $isAdmin = ($role === 'admin' || $role === 'super_admin' || $role === 'auditor');
                
                $payload = [
                    'id' => $user['id'], 'email' => $user['email'], 'username' => $user['username'],
                    'fullName' => $user['username'], 'role' => $role, 'is_admin' => $isAdmin, 'status' => $user['status'] ?? 'active'
                ];
                
                echo json_encode(['success' => true, $isAdmin ? 'admin' : 'user' => $payload]);
                exit;
            }
        }
    } catch (Throwable $e) {}
}

// 5. JSON FALLBACK (If DB fails or user not in DB)
foreach ($jsonData as $u) {
    if (strtolower($u['email'] ?? '') === $normId || strtolower($u['username'] ?? '') === $normId) {
        if ($password === ($u['password'] ?? '')) {
            $isAdmin = !empty($u['is_admin']) || str_contains(strtolower($u['role'] ?? ''), 'admin');
            echo json_encode(['success' => true, $isAdmin ? 'admin' : 'user' => $u]);
            exit;
        }
    }
}

http_response_code(401);
echo json_encode(['success' => false, 'error' => 'Invalid credentials.', 'debug' => 'Check login type or email.']);
