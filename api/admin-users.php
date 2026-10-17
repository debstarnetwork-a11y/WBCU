<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - ADMIN USERS BACKEND API (cPanel / PHP / MySQL / JSON)
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

// 1. Database Connection
$dbHost = 'localhost';
$dbName = 'glolbka_wbcu_db';
$dbUser = 'glolbka_wbcu_user';
$dbPass = '';

$envPaths = [dirname(__DIR__) . '/.env', __DIR__ . '/.env', '/home/glolbka/public_html/.env', '/home/glolbka/WBCU/.env'];
foreach ($envPaths as $p) {
    if (file_exists($p)) {
        $lines = @file($p, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (is_array($lines)) {
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                $parts = explode('=', $line, 2);
                if (count($parts) < 2) continue;
                $k = trim($parts[0]);
                $v = trim($parts[1], " \t\n\r\0\x0B\"'");
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
} catch (Throwable $e) {
    $pdo = null;
}

$users = [];
$usersMap = [];

// 2. Load from JSON (Baseline)
$jsonFile = dirname(__DIR__) . '/admin-users.json';
if (file_exists($jsonFile)) {
    $jsonData = json_decode(file_get_contents($jsonFile), true) ?: [];
    foreach ($jsonData as $u) {
        if (!empty($u['id'])) $usersMap[$u['id']] = $u;
    }
}

// 3. Load from Database (Authoritative override)
if ($pdo) {
    try {
        // Simple fetch for users and profiles
        $dbUsers = $pdo->query("SELECT u.*, p.first_name, p.last_name, p.full_name, p.phone_number FROM `users` u LEFT JOIN `profiles` p ON u.id = p.user_id")->fetchAll();
        
        // Fetch accounts
        $dbAccts = $pdo->query("SELECT * FROM `accounts`")->fetchAll();
        $acctMap = [];
        foreach ($dbAccts as $a) {
            $acctMap[$a['user_id']][] = [
                'id' => $a['id'],
                'accountNumber' => $a['account_number'],
                'type' => $a['account_type'],
                'name' => $a['account_name'],
                'currency' => $a['currency'],
                'balance' => (float)$a['balance'],
                'available' => (float)$a['available_balance'],
                'routingNumber' => $a['routing_number'],
                'isPrimary' => (bool)$a['is_primary'],
                'status' => $a['status']
            ];
        }

        foreach ($dbUsers as $row) {
            $uid = $row['id'];
            $role = strtolower($row['role'] ?? '');
            $isAdmin = ($role === 'admin' || $role === 'super_admin' || $role === 'auditor');
            
            $usersMap[$uid] = [
                'id' => $uid,
                'fullName' => $row['full_name'] ?? trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                'email' => $row['email'],
                'username' => $row['username'],
                'password' => $row['password_hash'],
                'role' => ($role === 'super_admin') ? 'Super Admin' : ($isAdmin ? 'Admin' : 'Member'),
                'is_admin' => $isAdmin,
                'status' => $row['status'] ?? 'active',
                'kycStatus' => $row['kyc_status'] ?? 'verified',
                'pin' => $row['transaction_pin'] ?? '1234',
                'phone' => $row['phone_number'] ?? '',
                'accounts' => $acctMap[$uid] ?? []
            ];
        }
    } catch (Throwable $e) {}
}

echo json_encode([
    'success' => true,
    'users' => array_values($usersMap),
    'db_connected' => ($pdo !== null)
]);
