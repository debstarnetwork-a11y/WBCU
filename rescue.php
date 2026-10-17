<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - EMERGENCY RESCUE & DIAGNOSTIC TOOL (V2)
 * ============================================================================
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

echo "<html><body style='font-family:sans-serif; padding:20px; line-height:1.6; background:#f4f7f6;'>";
echo "<h1 style='color:#2563eb;'>WB Credit Finance Rescue Tool V2</h1>";

function log_status($msg, $type = 'info') {
    $colors = ['info' => '#2563eb', 'success' => '#10b981', 'error' => '#ef4444', 'warn' => '#f59e0b'];
    $color = $colors[$type] ?? '#000';
    echo "<div style='margin-bottom:10px; padding:10px; border-left:5px solid $color; background:#fff; box-shadow:0 2px 4px rgba(0,0,0,0.05);'>
            <strong style='color:$color; text-transform:uppercase; font-size:12px;'>$type:</strong> $msg
          </div>";
}

// 1. Check Multiple Folders
$searchPaths = [
    __DIR__, 
    dirname(__DIR__), 
    '/home/glolbka/WBCU',
    '/home/glolbka/public_html'
];

log_status("Script running from: " . __DIR__);

$dbPass = ''; $dbUser = 'glolbka_wbcu_user'; $dbName = 'glolbka_wbcu_db'; $dbHost = 'localhost';

foreach ($searchPaths as $path) {
    if (!is_dir($path)) continue;
    log_status("Scanning directory: $path");
    
    $files = ['.env', 'admin-users.json', '.htaccess', 'api/admin-login.php'];
    foreach ($files as $f) {
        $p = $path . '/' . $f;
        if (file_exists($p)) {
            log_status("Found: $f in $path", "success");
            if ($f === '.env' && empty($dbPass)) {
                $lines = file($p, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $parts = explode('=', $line, 2);
                    if (count($parts) < 2) continue;
                    $k = trim($parts[0]); $v = trim($parts[1], " \t\n\r\0\x0B\"'");
                    if ($k === 'DB_PASS' || $k === 'DB_PASSWORD') $dbPass = $v;
                }
            }
        }
    }
}

// 2. Database Connection
if (empty($dbPass) || str_contains($dbPass, 'PLEASE_EDIT')) {
    log_status("Database password not found in any .env file. Please edit .env and set DB_PASS.", "error");
} else {
    try {
        $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
        $pdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        log_status("Database Connection: SUCCESS", "success");
    } catch (Throwable $e) {
        log_status("Database Connection FAILED: " . $e->getMessage(), "error");
    }
}

echo "<hr><p>If you see green 'Found' messages for .env and admin-users.json, your login is fixed.</p>";
echo "<p>Try logging in with: <b>admin / 12345</b></p>";
echo "</body></html>";
