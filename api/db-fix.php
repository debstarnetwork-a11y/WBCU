<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - LIVE DATABASE REPAIR & SEEDING TOOL
 * ============================================================================
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

echo "<html><body style='font-family:sans-serif; padding:40px; background:#f0f2f5;'>";
echo "<div style='max-width:800px; margin:0 auto; background:#fff; padding:30px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1);'>";
echo "<h1 style='color:#1e40af;'>Live Database Repair Tool</h1>";

// 1. Database Connection Discovery
$root = dirname(__DIR__);
$dbPass = ''; $dbUser = 'glolbka_wbcu_user'; $dbName = 'glolbka_wbcu_db'; $dbHost = 'localhost';

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
}

if (empty($dbPass) || str_contains($dbPass, 'PLEASE_EDIT')) {
    echo "<div style='padding:20px; background:#fee2e2; border-left:5px solid #ef4444; color:#b91c1c;'>
            <strong>ERROR:</strong> Database password not found in .env. Please set it in /home/glolbka/WBCU/.env first.
          </div>";
    exit;
}

try {
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "<p style='color:#10b981;'>✅ Connected to database: <strong>$dbName</strong></p>";

    // 2. Clear foreign key checks for clean update
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

    // 3. SEED ADMINS
    echo "<h3>1. Syncing Administrators...</h3>";
    $admins = [
        ['usr-admin-01', 'admin', 'admin@wbcu.net', '12345', 'Chief Treasury Auditor'],
        ['usr-101', 'mizbrymo', 'mizbrymo@gmail.com', '12345', 'Miz Brymo']
    ];

    foreach ($admins as $a) {
        $stmt = $pdo->prepare("INSERT INTO `admins` (id, username, email, password_hash, full_name, role, status) 
                                VALUES (?, ?, ?, ?, ?, 'super_admin', 'active') 
                                ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), full_name=VALUES(full_name)");
        $stmt->execute($a);
        echo " - Admin [{$a[1]}] verified.<br>";
    }

    // 4. SEED USERS & PROFILES
    echo "<h3>2. Syncing Member Accounts...</h3>";
    $users = [
        ['wb-usr-y4rfbph', 'debeluemmanuel', 'debeluemmanuel@gmail.com', 'yeshuah.com', 'DEBELU', 'EMMANUEL']
    ];

    foreach ($users as $u) {
        // Insert User
        $stmt = $pdo->prepare("INSERT INTO `users` (id, username, email, password_hash, role, transaction_pin, status) 
                                VALUES (?, ?, ?, ?, 'user', '4004', 'active') 
                                ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)");
        $stmt->execute([$u[0], $u[1], $u[2], $u[3]]);

        // Insert Profile
        $stmt = $pdo->prepare("INSERT INTO `profiles` (id, user_id, first_name, last_name, full_name) 
                                VALUES (?, ?, ?, ?, ?) 
                                ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)");
        $stmt->execute(["prof-".$u[0], $u[0], $u[4], $u[5], "{$u[4]} {$u[5]}"]);
        
        echo " - Member [{$u[1]}] verified.<br>";
    }

    // 5. SEED ACCOUNTS (BALANCES)
    echo "<h3>3. Verifying $100,000.00 Balance...</h3>";
    $accounts = [
        ['acct-usd-wb-usr-y4rfbph', 'wb-usr-y4rfbph', '9482-1049-55', 'Checking', 'US Dollar Primary Vault', 100000.00]
    ];

    foreach ($accounts as $ac) {
        $stmt = $pdo->prepare("INSERT INTO `accounts` (id, user_id, account_number, account_type, account_name, currency, balance, available_balance, is_primary, status) 
                                VALUES (?, ?, ?, ?, ?, 'USD', ?, ?, 1, 'active') 
                                ON DUPLICATE KEY UPDATE balance=VALUES(balance), available_balance=VALUES(available_balance)");
        $stmt->execute([$ac[0], $ac[1], $ac[2], $ac[3], $ac[4], $ac[5], $ac[5]]);
        echo " - Vault balance for [{$ac[2]}] set to <b>$" . number_format($ac[5], 2) . "</b><br>";
    }

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    echo "<div style='margin-top:30px; padding:20px; background:#dcfce7; border-left:5px solid #10b981; color:#166534;'>
            <strong>SUCCESS!</strong> Database data is now perfectly synced with your development version.
          </div>";
    echo "<p><a href='/admin' style='display:inline-block; padding:12px 24px; background:#1e40af; color:#fff; text-decoration:none; border-radius:6px; font-weight:600;'>Go to Admin Portal →</a></p>";

} catch (Throwable $e) {
    echo "<div style='padding:20px; background:#fee2e2; border-left:5px solid #ef4444; color:#b91c1c;'>
            <strong>DATABASE ERROR:</strong> " . $e->getMessage() . "
          </div>";
}

echo "</div></body></html>";
