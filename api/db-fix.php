<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - LIVE DATABASE REPAIR TOOL (V2 - SAFE DETECTION)
 * ============================================================================
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

echo "<html><body style='font-family:sans-serif; padding:40px; background:#f0f2f5;'>";
echo "<div style='max-width:800px; margin:0 auto; background:#fff; padding:30px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1);'>";
echo "<h1 style='color:#1e40af;'>Live Database Repair Tool V2</h1>";

$dbPass = ''; $dbUser = 'glolbka_wbcu_user'; $dbName = 'glolbka_wbcu_db'; $dbHost = 'localhost';
$foundIn = '';

// 1. SAFE DETECTION (Stop at first valid password)
$paths = [dirname(__DIR__), '/home/glolbka/WBCU', '/home/glolbka/public_html'];
foreach ($paths as $path) {
    $env = $path . '/.env';
    if (file_exists($env)) {
        $lines = @file($env, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $tempPass = '';
        foreach ($lines as $l) {
            $parts = explode('=', $l, 2);
            if (count($parts) == 2) {
                $k = trim($parts[0]); $v = trim($parts[1], " \"'");
                if (($k === 'DB_PASS' || $k === 'DB_PASSWORD') && !empty($v)) $tempPass = $v;
            }
        }
        // If this file has a REAL password, use it and STOP searching
        if (!empty($tempPass) && !str_contains($tempPass, 'PLEASE_EDIT')) {
            $dbPass = $tempPass;
            $foundIn = $env;
            break; 
        }
    }
}

if (empty($dbPass)) {
    echo "<div style='padding:20px; background:#fee2e2; border-left:5px solid #ef4444; color:#b91c1c;'>
            <strong>ERROR:</strong> Valid password not found. <br><br>
            Please ensure <strong>/home/glolbka/WBCU/.env</strong> contains:<br>
            <code>DB_PASS=your_real_password_here</code>
          </div>";
    exit;
}

echo "<p style='color:#10b981;'>✅ Found valid credentials in: <strong>$foundIn</strong></p>";

try {
    try {
        $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    } catch (Throwable $e1) {
        $pdo = new PDO("mysql:host=127.0.0.1;dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    // SYNC ADMINS
    $admins = [
        ['usr-admin-01', 'admin', 'admin@wbcu.net', '12345', 'Chief Treasury Auditor'],
        ['usr-101', 'mizbrymo', 'mizbrymo@gmail.com', '12345', 'Miz Brymo']
    ];
    foreach ($admins as $a) {
        $stmt = $pdo->prepare("INSERT INTO `admins` (id, username, email, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?, 'super_admin', 'active') ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), full_name=VALUES(full_name)");
        $stmt->execute($a);
    }

    // SYNC USERS
    $users = [['wb-usr-y4rfbph', 'debeluemmanuel', 'debeluemmanuel@gmail.com', 'yeshuah.com', 'DEBELU', 'EMMANUEL']];
    foreach ($users as $u) {
        $stmt = $pdo->prepare("INSERT INTO `users` (id, username, email, password_hash, role, transaction_pin, status) VALUES (?, ?, ?, ?, 'user', '4004', 'active') ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)");
        $stmt->execute([$u[0], $u[1], $u[2], $u[3]]);
        $stmt = $pdo->prepare("INSERT INTO `profiles` (id, user_id, first_name, last_name, full_name) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)");
        $stmt->execute(["prof-".$u[0], $u[0], $u[4], $u[5], "{$u[4]} {$u[5]}"]);
    }

    // SYNC BALANCE
    $stmt = $pdo->prepare("INSERT INTO `accounts` (id, user_id, account_number, account_type, account_name, currency, balance, available_balance, is_primary, status) VALUES (?, ?, ?, ?, ?, 'USD', ?, ?, 1, 'active') ON DUPLICATE KEY UPDATE balance=VALUES(balance), available_balance=VALUES(available_balance)");
    $stmt->execute(['acct-usd-wb-usr-y4rfbph', 'wb-usr-y4rfbph', '9482-1049-55', 'Checking', 'US Dollar Primary Vault', 100000.00, 100000.00]);

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    echo "<div style='margin-top:30px; padding:20px; background:#dcfce7; border-left:5px solid #10b981; color:#166534;'>
            <strong>SUCCESS!</strong> Data is now live. Login should work now.
          </div>";
    echo "<p><a href='/admin' style='display:inline-block; padding:12px 24px; background:#1e40af; color:#fff; text-decoration:none; border-radius:6px;'>Go to Admin Portal →</a></p>";

} catch (Throwable $e) {
    echo "<div style='background:#fee2e2; padding:15px;'><strong>DB ERROR:</strong> " . $e->getMessage() . "</div>";
}
echo "</div></body></html>";
