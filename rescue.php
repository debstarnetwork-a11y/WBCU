<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - LIVE RESCUE & ENVIRONMENT REPAIR TOOL (V3)
 * ============================================================================
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$basePath = dirname(__FILE__);
$isWritabled = is_writable($basePath);

// 1. Handle POST: Update Database Credentials
$updateMsg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['db_pass'])) {
    $newPass = $_POST['db_pass'];
    $envPath = $basePath . '/.env';
    
    $content = "# WB Credit Finance - Environment Config\n";
    $content .= "DB_HOST=localhost\n";
    $content .= "DB_NAME=glolbka_wbcu_db\n";
    $content .= "DB_USER=glolbka_wbcu_user\n";
    $content .= "DB_PASS=" . $newPass . "\n";
    
    if (file_put_contents($envPath, $content)) {
        $updateMsg = '<div style="color: green; font-weight: bold; padding: 10px; border: 1px solid green; margin-bottom: 20px;">SUCCESS: .env file updated with new password!</div>';
    } else {
        $updateMsg = '<div style="color: red; font-weight: bold; padding: 10px; border: 1px solid red; margin-bottom: 20px;">ERROR: Could not write to .env file. Check permissions.</div>';
    }
}

// 2. Diagnostics
$envFound = file_exists($basePath . '/.env');
$jsonFound = file_exists($basePath . '/admin-users.json');
$apiFound = is_dir($basePath . '/api');

$dbStatus = 'Not Attempted';
$dbDetails = '';
if ($envFound) {
    $lines = file($basePath . '/.env');
    $p = ''; $u = 'glolbka_wbcu_user'; $n = 'glolbka_wbcu_db'; $h = 'localhost';
    foreach ($lines as $l) {
        $parts = explode('=', $l, 2);
        if (count($parts) == 2) {
            $k = trim($parts[0]); $v = trim($parts[1], " \"'");
            if ($k === 'DB_PASS' || $k === 'DB_PASSWORD') $p = $v;
            if ($k === 'DB_USER') $u = $v;
            if ($k === 'DB_NAME') $n = $v;
            if ($k === 'DB_HOST') $h = $v;
        }
    }
    
    try {
        $pdo = new PDO("mysql:host=$h;dbname=$n;charset=utf8mb4", $u, $p, [PDO::ATTR_TIMEOUT => 2]);
        $dbStatus = '<span style="color: green;">CONNECTED SUCCESS</span>';
    } catch (Exception $e) {
        try {
            $pdo = new PDO("mysql:host=127.0.0.1;dbname=$n;charset=utf8mb4", $u, $p, [PDO::ATTR_TIMEOUT => 2]);
            $dbStatus = '<span style="color: green;">CONNECTED SUCCESS (127.0.0.1)</span>';
        } catch (Exception $e2) {
            $dbStatus = '<span style="color: red;">CONNECTION FAILED</span>';
            $dbDetails = $e->getMessage();
        }
    }
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>WBCU Live Rescue Tool</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; background: #f4f4f9; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        h1 { color: #1e3a8a; }
        .status { font-weight: bold; }
        .ok { color: green; }
        .fail { color: red; }
        input[type="password"] { padding: 8px; width: 250px; border: 1px solid #ccc; border-radius: 4px; }
        button { padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #1d4ed8; }
        code { background: #eee; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>

    <h1>WBCU Rescue & Repair Tool</h1>
    <p>Use this tool to fix environment issues on your live server.</p>

    <?php echo $updateMsg; ?>

    <div class="card">
        <h2>1. Server Health Check</h2>
        <ul>
            <li>Web Root: <code><?php echo $basePath; ?></code></li>
            <li>Writable: <span class="status <?php echo $isWritabled ? 'ok' : 'fail'; ?>"><?php echo $isWritabled ? 'YES' : 'NO'; ?></span></li>
            <li>.env File: <span class="status <?php echo $envFound ? 'ok' : 'fail'; ?>"><?php echo $envFound ? 'FOUND' : 'MISSING'; ?></span></li>
            <li>JSON Database: <span class="status <?php echo $jsonFound ? 'ok' : 'fail'; ?>"><?php echo $jsonFound ? 'FOUND' : 'MISSING'; ?></span></li>
            <li>API Folder: <span class="status <?php echo $apiFound ? 'ok' : 'fail'; ?>"><?php echo $apiFound ? 'FOUND' : 'MISSING'; ?></span></li>
            <li>Database Status: <span class="status"><?php echo $dbStatus; ?></span></li>
        </ul>
        <?php if ($dbDetails): ?>
            <p style="color: red; font-size: 0.9em;">Error: <?php echo $dbDetails; ?></p>
        <?php endif; ?>
    </div>

    <div class="card">
        <h2>2. Fix Database Password</h2>
        <p>If your database connection is failing, enter your database password here. This will update the <code>.env</code> file immediately.</p>
        <form method="POST">
            <input type="password" name="db_pass" placeholder="Enter DB Password" required>
            <button type="submit">Update .env File</button>
        </form>
        <p style="font-size: 0.8em; color: #666; margin-top: 10px;">
            Note: This script assumes your DB user is <code>glolbka_wbcu_user</code> and DB name is <code>glolbka_wbcu_db</code>.
        </p>
    </div>

    <div class="card" style="background: #fffbeb; border-left: 5px solid #f59e0b;">
        <h2>3. Next Steps</h2>
        <ol>
            <li>If everything is GREEN, try logging in with <b>admin / 12345</b>.</li>
            <li>If login still fails, run <code>python3 wbcu_sync.py</code> in your cPanel Terminal to ensure the latest API code is active.</li>
            <li>Delete this file (<code>rescue.php</code>) after you are done for security.</li>
        </ol>
    </div>

</body>
</html>
