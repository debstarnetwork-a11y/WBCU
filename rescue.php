<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - EMERGENCY RESCUE & DIAGNOSTIC TOOL
 * ============================================================================
 * 
 * This script will:
 * 1. Test database connection.
 * 2. Verify existence of admin-users.json.
 * 3. Check file permissions.
 * 4. Verify admin user existence in DB and JSON.
 * ============================================================================
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

echo "<html><body style='font-family:sans-serif; padding:20px; line-height:1.6; background:#f4f7f6;'>";
echo "<h1 style='color:#2563eb;'>WB Credit Finance Rescue Tool</h1>";

function log_status($msg, $type = 'info') {
    $colors = ['info' => '#2563eb', 'success' => '#10b981', 'error' => '#ef4444', 'warn' => '#f59e0b'];
    $color = $colors[$type] ?? '#000';
    echo "<div style='margin-bottom:10px; padding:10px; border-left:5px solid $color; background:#fff; box-shadow:0 2px 4px rgba(0,0,0,0.05);'>
            <strong style='color:$color; text-transform:uppercase; font-size:12px;'>$type:</strong> $msg
          </div>";
}

// 1. Check Filesystem
$root = dirname(__DIR__);
$files = ['.env', 'admin-users.json', '.htaccess', 'api/admin-login.php'];

log_status("Checking Root Directory: $root");
if (is_writable($root)) {
    log_status("Root directory is WRITABLE", "success");
} else {
    log_status("Root directory is NOT writable. This might prevent updates.", "warn");
}

foreach ($files as $f) {
    $p = $root . '/' . $f;
    if (file_exists($p)) {
        log_status("File Found: $f (" . filesize($p) . " bytes)", "success");
    } else {
        log_status("File MISSING: $f", "error");
    }
}

// 2. Database Connection
$dbHost = 'localhost'; $dbName = 'glolbka_wbcu_db'; $dbUser = 'glolbka_wbcu_user'; $dbPass = '';
$envPath = $root . '/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
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

try {
    $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    log_status("Database Connection: SUCCESS", "success");
    
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    log_status("Found " . count($tables) . " tables: " . implode(", ", $tables), "info");
    
    if (in_array('admins', $tables)) {
        $admins = $pdo->query("SELECT username, email FROM admins")->fetchAll(PDO::FETCH_ASSOC);
        log_status("Admins in DB: " . count($admins), "info");
        foreach ($admins as $a) echo "&nbsp;&nbsp; - " . $a['username'] . " (" . $a['email'] . ")<br>";
    }
} catch (Throwable $e) {
    log_status("Database Connection FAILED: " . $e->getMessage(), "error");
}

// 3. Check JSON Data
$jsonPath = $root . '/admin-users.json';
if (file_exists($jsonPath)) {
    $data = json_decode(file_get_contents($jsonPath), true);
    if (is_array($data)) {
        log_status("JSON Database: Loaded " . count($data) . " users", "success");
        $foundAdmin = false;
        foreach ($data as $u) {
            if ($u['email'] === 'admin@wbcu.net' || ($u['username'] ?? '') === 'admin') {
                log_status("Admin found in JSON with password: " . ($u['password'] ?? 'MISSING'), "info");
                $foundAdmin = true;
            }
        }
        if (!$foundAdmin) log_status("Admin NOT found in JSON", "error");
    } else {
        log_status("JSON Database: Invalid Format", "error");
    }
}

echo "<hr><p>If you see errors above, please ensure your .env file has the correct DB_PASSWORD and run <code>python3 wbcu_sync.py</code> again.</p>";
echo "</body></html>";
