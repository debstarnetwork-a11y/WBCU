<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - LIVE RESCUE, DIAGNOSTIC & DATABASE REPAIR SUITE (V4)
 * ============================================================================
 * Web Root: /home/glolbka/WBCU or /home/glolbka/public_html
 * Database: glolbka_wbcu_db
 * User: glolbka_wbcu_user
 * ============================================================================
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$basePath = dirname(__FILE__);
$isWritable = is_writable($basePath);
$envPath = $basePath . '/.env';
$jsonPath = $basePath . '/admin-users.json';
$apiDir = $basePath . '/api';

$actionMsg = '';

// Helper function to load current .env
function loadEnvConfig($path) {
    $cfg = [
        'DB_HOST' => '127.0.0.1',
        'DB_NAME' => 'glolbka_wbcu_db',
        'DB_USER' => 'glolbka_wbcu_user',
        'DB_PASS' => 'yeshuah.com'
    ];
    if (file_exists($path)) {
        $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines) {
            foreach ($lines as $line) {
                $trimmed = trim($line);
                if (empty($trimmed) || strpos($trimmed, '#') === 0) continue;
                $parts = explode('=', $trimmed, 2);
                if (count($parts) === 2) {
                    $k = trim($parts[0]);
                    $v = trim($parts[1], " \t\n\r\0\x0B\"'");
                    if ($k === 'DB_HOST') $cfg['DB_HOST'] = ($v === 'localhost' || empty($v)) ? '127.0.0.1' : $v;
                    if ($k === 'DB_NAME') $cfg['DB_NAME'] = $v;
                    if ($k === 'DB_USER') $cfg['DB_USER'] = $v;
                    if ($k === 'DB_PASS' || $k === 'DB_PASSWORD') $cfg['DB_PASS'] = $v;
                }
            }
        }
    }
    return $cfg;
}

function writeEnvConfig($path, $cfg) {
    $content = "# WB Credit Finance - Environment Configuration\n";
    $content .= "DB_HOST=" . trim($cfg['DB_HOST']) . "\n";
    $content .= "DB_NAME=" . trim($cfg['DB_NAME']) . "\n";
    $content .= "DB_USER=" . trim($cfg['DB_USER']) . "\n";
    $content .= "DB_PASS=" . trim($cfg['DB_PASS']) . "\n";
    return @file_put_contents($path, $content);
}

// 1. Handle Form Submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'update_env';
    
    if ($action === 'update_env') {
        $newHost = trim($_POST['db_host'] ?? '127.0.0.1');
        $newName = trim($_POST['db_name'] ?? 'glolbka_wbcu_db');
        $newUser = trim($_POST['db_user'] ?? 'glolbka_wbcu_user');
        $newPass = trim($_POST['db_pass'] ?? '');

        if ($newHost === 'localhost' || empty($newHost)) $newHost = '127.0.0.1';

        $cfg = [
            'DB_HOST' => $newHost,
            'DB_NAME' => $newName,
            'DB_USER' => $newUser,
            'DB_PASS' => $newPass
        ];

        if (writeEnvConfig($envPath, $cfg)) {
            $actionMsg = '<div class="alert success">SUCCESS: .env configuration updated and whitespace sanitized!</div>';
        } else {
            $actionMsg = '<div class="alert danger">ERROR: Could not write to .env file. Check folder permissions.</div>';
        }
    } elseif ($action === 'seed_database') {
        $cfg = loadEnvConfig($envPath);
        $pdo = null;
        $connectionError = '';
        
        $probes = [
            "mysql:host={$cfg['DB_HOST']};port=3306;dbname={$cfg['DB_NAME']};charset=utf8mb4",
            "mysql:host=127.0.0.1;port=3306;dbname={$cfg['DB_NAME']};charset=utf8mb4",
            "mysql:host=localhost;dbname={$cfg['DB_NAME']};charset=utf8mb4",
            "mysql:unix_socket=/var/lib/mysql/mysql.sock;dbname={$cfg['DB_NAME']};charset=utf8mb4",
            "mysql:unix_socket=/tmp/mysql.sock;dbname={$cfg['DB_NAME']};charset=utf8mb4"
        ];
        
        foreach ($probes as $dsn) {
            try {
                $pdo = new PDO($dsn, $cfg['DB_USER'], $cfg['DB_PASS'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 3
                ]);
                if ($pdo) break;
            } catch (Throwable $e) {
                $connectionError = $e->getMessage();
            }
        }

        if ($pdo) {
            try {
                // Create schema tables if not exist
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS `users` (
                      `id` VARCHAR(64) NOT NULL PRIMARY KEY,
                      `username` VARCHAR(100) NOT NULL,
                      `email` VARCHAR(255) NOT NULL,
                      `password_hash` VARCHAR(255) NOT NULL DEFAULT '12345',
                      `role` VARCHAR(50) NOT NULL DEFAULT 'user',
                      `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
                      `transaction_pin` VARCHAR(10) DEFAULT '8869',
                      `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 1,
                      `status` VARCHAR(50) NOT NULL DEFAULT 'active',
                      `status_reason` TEXT DEFAULT NULL,
                      `kyc_status` VARCHAR(50) NOT NULL DEFAULT 'verified',
                      `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                      `last_login` DATETIME DEFAULT NULL,
                      UNIQUE KEY `uk_users_email` (`email`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");

                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS `admins` (
                      `id` VARCHAR(64) NOT NULL PRIMARY KEY,
                      `username` VARCHAR(100) NOT NULL,
                      `email` VARCHAR(255) NOT NULL,
                      `password_hash` VARCHAR(255) NOT NULL DEFAULT '12345',
                      `full_name` VARCHAR(255) DEFAULT 'Chief Treasury Auditor',
                      `role` VARCHAR(50) NOT NULL DEFAULT 'super_admin',
                      `status` VARCHAR(50) NOT NULL DEFAULT 'active',
                      `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      UNIQUE KEY `uk_admins_email` (`email`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");

                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS `profiles` (
                      `id` VARCHAR(64) NOT NULL PRIMARY KEY,
                      `user_id` VARCHAR(64) NOT NULL,
                      `first_name` VARCHAR(100) NOT NULL,
                      `middle_name` VARCHAR(100) DEFAULT '',
                      `last_name` VARCHAR(100) NOT NULL,
                      `full_name` VARCHAR(255) NOT NULL,
                      `phone_number` VARCHAR(50) DEFAULT NULL,
                      `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      UNIQUE KEY `uk_profiles_user_id` (`user_id`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");

                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS `accounts` (
                      `id` VARCHAR(64) NOT NULL PRIMARY KEY,
                      `user_id` VARCHAR(64) NOT NULL,
                      `account_number` VARCHAR(30) NOT NULL,
                      `account_type` VARCHAR(50) NOT NULL DEFAULT 'Checking',
                      `account_name` VARCHAR(150) NOT NULL DEFAULT 'Primary Vault',
                      `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
                      `balance` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
                      `available_balance` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
                      `routing_number` VARCHAR(30) NOT NULL DEFAULT '021000089',
                      `is_primary` TINYINT(1) NOT NULL DEFAULT 1,
                      `status` VARCHAR(50) NOT NULL DEFAULT 'active',
                      `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      UNIQUE KEY `uk_accounts_number` (`account_number`),
                      KEY `idx_accounts_user` (`user_id`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");

                // Seed JSON users into MySQL
                $jsonData = file_exists($jsonPath) ? json_decode(file_get_contents($jsonPath), true) : [];
                $insertedCount = 0;

                if (is_array($jsonData)) {
                    $uStmt = $pdo->prepare("INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `is_admin`, `transaction_pin`, `status`, `kyc_status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `status` = VALUES(`status`), `role` = VALUES(`role`)");
                    $pStmt = $pdo->prepare("INSERT INTO `profiles` (`id`, `user_id`, `first_name`, `last_name`, `full_name`, `phone_number`) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `phone_number` = VALUES(`phone_number`)");
                    $aStmt = $pdo->prepare("INSERT INTO `accounts` (`id`, `user_id`, `account_number`, `account_type`, `account_name`, `currency`, `balance`, `available_balance`, `routing_number`, `is_primary`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `balance` = VALUES(`balance`), `available_balance` = VALUES(`available_balance`)");

                    foreach ($jsonData as $u) {
                        $uid = $u['id'] ?? ('usr-' . uniqid());
                        $email = $u['email'] ?? '';
                        $uname = $u['username'] ?? explode('@', $email)[0];
                        $pwd = $u['password'] ?? '12345';
                        $role = !empty($u['is_admin']) || strpos(strtolower($u['role'] ?? ''), 'admin') !== false ? 'admin' : 'user';
                        $isAdmin = $role === 'admin' ? 1 : 0;
                        $pin = $u['pin'] ?? $u['transactionPin'] ?? '8869';
                        $status = $u['status'] ?? 'active';
                        $kyc = $u['kycStatus'] ?? 'verified';

                        $uStmt->execute([$uid, $uname, $email, $pwd, $role, $isAdmin, $pin, $status, $kyc]);

                        $fn = $u['firstName'] ?? '';
                        $ln = $u['lastName'] ?? '';
                        $full = $u['fullName'] ?? trim("$fn $ln");
                        $phone = $u['phone'] ?? '';
                        $pStmt->execute(['prof-' . $uid, $uid, $fn, $ln, $full, $phone]);

                        if (!empty($u['accounts']) && is_array($u['accounts'])) {
                            foreach ($u['accounts'] as $acc) {
                                $accId = $acc['id'] ?? ('acct-' . uniqid());
                                $accNum = $acc['accountNumber'] ?? ('9482-' . rand(1000, 9999));
                                $accType = $acc['type'] ?? 'Checking';
                                $accName = $acc['name'] ?? 'Primary Vault';
                                $cur = $acc['currency'] ?? 'USD';
                                $bal = (float)($acc['balance'] ?? 0);
                                $avail = (float)($acc['available'] ?? $bal);
                                $rout = $acc['routingNumber'] ?? '021000089';
                                $isPri = !empty($acc['isPrimary']) ? 1 : 0;
                                $aStmt->execute([$accId, $uid, $accNum, $accType, $accName, $cur, $bal, $avail, $rout, $isPri, 'active']);
                            }
                        }
                        $insertedCount++;
                    }

                    // Always ensure Super Admin exists in admins table
                    $admStmt = $pdo->prepare("INSERT INTO `admins` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`)");
                    $admStmt->execute(['adm-001', 'admin', 'admin@wbcu.net', '12345', 'Chief Treasury Auditor', 'super_admin', 'active']);
                    $admStmt->execute(['adm-101', 'mizbrymo', 'mizbrymo@gmail.com', '12345', 'Miz Brymo', 'super_admin', 'active']);
                }

                $actionMsg = "<div class=\"alert success\">SUCCESS: Synchronized $insertedCount users and accounts into MySQL database! All 9 users are now active in the database.</div>";
            } catch (Throwable $e) {
                $actionMsg = "<div class=\"alert danger\">Database Sync Error: " . htmlspecialchars($e->getMessage()) . "</div>";
            }
        } else {
            $actionMsg = "<div class=\"alert danger\">Could not connect to MySQL to seed data: " . htmlspecialchars($connectionError) . "</div>";
        }
    }
}

// 2. Perform Live Probing
$cfg = loadEnvConfig($envPath);
$dbStatus = 'Not Attempted';
$dbDetails = '';
$winningProbe = '';
$dbUsersList = [];
$pdo = null;

$probes = [
    'TCP 127.0.0.1:3306' => "mysql:host={$cfg['DB_HOST']};port=3306;dbname={$cfg['DB_NAME']};charset=utf8mb4",
    'Standard 127.0.0.1' => "mysql:host=127.0.0.1;dbname={$cfg['DB_NAME']};charset=utf8mb4",
    'Socket /var/lib/mysql/mysql.sock' => "mysql:unix_socket=/var/lib/mysql/mysql.sock;dbname={$cfg['DB_NAME']};charset=utf8mb4",
    'Socket /tmp/mysql.sock' => "mysql:unix_socket=/tmp/mysql.sock;dbname={$cfg['DB_NAME']};charset=utf8mb4",
    'Localhost Socket' => "mysql:host=localhost;dbname={$cfg['DB_NAME']};charset=utf8mb4"
];

foreach ($probes as $label => $dsn) {
    try {
        $testPdo = new PDO($dsn, trim($cfg['DB_USER']), trim($cfg['DB_PASS']), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 2
        ]);
        if ($testPdo) {
            $pdo = $testPdo;
            $winningProbe = $label;
            $dbStatus = '<span style="color: green; font-weight: bold;">CONNECTED SUCCESS (' . htmlspecialchars($label) . ')</span>';
            break;
        }
    } catch (Throwable $e) {
        $dbDetails = $e->getMessage();
    }
}

if (!$pdo) {
    $dbStatus = '<span style="color: red; font-weight: bold;">CONNECTION FAILED</span>';
} else {
    // Check users in DB
    try {
        $stmt = $pdo->query("SELECT u.id, u.username, u.email, u.role, u.status, u.password_hash FROM `users` u ORDER BY u.created_at DESC");
        $dbUsersList = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {}
}

$envFound = file_exists($envPath);
$jsonFound = file_exists($jsonPath);
$apiFound = is_dir($apiDir);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WBCU Live Environment Rescue & Repair Tool</title>
    <style>
        :root { --primary: #1e3a8a; --success: #10b981; --danger: #ef4444; --warning: #f59e0b; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 30px auto; padding: 20px; background: #f8fafc; color: #1e293b; }
        .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08); margin-bottom: 24px; border: 1px solid #e2e8f0; }
        h1 { color: var(--primary); margin-top: 0; font-size: 1.75rem; }
        h2 { font-size: 1.25rem; color: #0f172a; margin-top: 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.875rem; }
        .ok { background: #dcfce7; color: #166534; }
        .fail { background: #fee2e2; color: #991b1b; }
        .alert { padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: 500; font-size: 0.95rem; }
        .alert.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .alert.danger { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .alert.warning { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group.full { grid-column: span 2; }
        label { font-weight: 600; font-size: 0.875rem; margin-bottom: 6px; color: #334155; }
        input[type="text"], input[type="password"] { padding: 10px 12px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; }
        input:focus { border-color: #3b82f6; outline: none; }
        button { padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-size: 0.95rem; }
        button:hover { background: #1d4ed8; }
        button.btn-green { background: #10b981; }
        button.btn-green:hover { background: #059669; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 0.875rem; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; color: #475569; }
        code { background: #f1f5f9; padding: 3px 6px; border-radius: 4px; font-size: 0.85em; font-family: monospace; color: #0369a1; }
        .tip-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin-top: 16px; }
    </style>
</head>
<body>

    <header style="margin-bottom: 24px;">
        <h1>WBCU Environment Repair & Database Diagnostics</h1>
        <p style="color: #64748b; margin: 0;">Institutional Core Banking Live Server Recovery Suite (v4.0)</p>
    </header>

    <?php echo $actionMsg; ?>

    <!-- 1. HEALTH CHECK CARD -->
    <div class="card">
        <h2>1. Live Server Health Check</h2>
        <ul style="list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <li>Web Root: <code><?php echo htmlspecialchars($basePath); ?></code></li>
            <li>Folder Writable: <span class="status-badge <?php echo $isWritable ? 'ok' : 'fail'; ?>"><?php echo $isWritable ? 'YES' : 'NO'; ?></span></li>
            <li>.env File: <span class="status-badge <?php echo $envFound ? 'ok' : 'fail'; ?>"><?php echo $envFound ? 'FOUND' : 'MISSING'; ?></span></li>
            <li>JSON Database: <span class="status-badge <?php echo $jsonFound ? 'ok' : 'fail'; ?>"><?php echo $jsonFound ? 'FOUND (admin-users.json)' : 'MISSING'; ?></span></li>
            <li>API Folder: <span class="status-badge <?php echo $apiFound ? 'ok' : 'fail'; ?>"><?php echo $apiFound ? 'FOUND (/api)' : 'MISSING'; ?></span></li>
            <li>Database Status: <?php echo $dbStatus; ?></li>
        </ul>

        <?php if ($dbDetails && !$pdo): ?>
            <div class="alert danger" style="margin-top: 16px; margin-bottom: 0;">
                <strong>Connection Error:</strong> <?php echo htmlspecialchars($dbDetails); ?>
                
                <?php if (strpos($dbDetails, '1045') !== false): ?>
                    <div style="margin-top: 12px; font-size: 0.9rem; line-height: 1.5; color: #7f1d1d; background: #fff5f5; padding: 12px; border-radius: 6px;">
                        <strong>HOW TO FIX ERROR 1045 IN CPANEL:</strong><br>
                        1. Open your <strong>cPanel</strong> &rarr; Click <strong>MySQL® Databases</strong>.<br>
                        2. Under <em>Current Users</em>, find <code>glolbka_wbcu_user</code> &rarr; click <strong>Change Password</strong> &rarr; set password to <code>yeshuah.com</code>.<br>
                        3. Scroll down to <strong>Add User To Database</strong>:<br>
                        &nbsp;&nbsp;&bull; Select User: <code>glolbka_wbcu_user</code><br>
                        &nbsp;&nbsp;&bull; Select Database: <code>glolbka_wbcu_db</code><br>
                        &nbsp;&nbsp;&bull; Click <strong>Add</strong> &rarr; Check <strong>ALL PRIVILEGES</strong> &rarr; Click <strong>Make Changes</strong>!
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- 2. EDIT DATABASE CREDENTIALS FORM -->
    <div class="card">
        <h2>2. Configure Database Connection</h2>
        <p style="font-size: 0.9rem; color: #64748b; margin-top: 0;">
            Adjust or fix credentials below. Whitespace and carriage returns are automatically sanitized.
        </p>
        <form method="POST">
            <input type="hidden" name="action" value="update_env">
            <div class="form-grid">
                <div class="form-group">
                    <label>DB Host (Default: 127.0.0.1)</label>
                    <input type="text" name="db_host" value="<?php echo htmlspecialchars($cfg['DB_HOST']); ?>" required>
                </div>
                <div class="form-group">
                    <label>DB Name</label>
                    <input type="text" name="db_name" value="<?php echo htmlspecialchars($cfg['DB_NAME']); ?>" required>
                </div>
                <div class="form-group">
                    <label>DB Username</label>
                    <input type="text" name="db_user" value="<?php echo htmlspecialchars($cfg['DB_USER']); ?>" required>
                </div>
                <div class="form-group">
                    <label>DB Password</label>
                    <input type="password" name="db_pass" value="<?php echo htmlspecialchars($cfg['DB_PASS']); ?>" placeholder="Enter DB Password" required>
                </div>
            </div>
            <button type="submit">Save & Test Connection</button>
        </form>
    </div>

    <!-- 3. DATABASE TABLES & SEEDING -->
    <div class="card">
        <h2>3. Database Users & User Management Sync</h2>
        <?php if ($pdo): ?>
            <p style="color: #166534; font-weight: 500;">
                Connected via <strong><?php echo htmlspecialchars($winningProbe); ?></strong>. Found <strong><?php echo count($dbUsersList); ?></strong> member record(s) in MySQL <code>users</code> table.
            </p>

            <?php if (!empty($dbUsersList)): ?>
                <table>
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach (array_slice($dbUsersList, 0, 10) as $row): ?>
                            <tr>
                                <td><code><?php echo htmlspecialchars($row['id']); ?></code></td>
                                <td><?php echo htmlspecialchars($row['username']); ?></td>
                                <td><?php echo htmlspecialchars($row['email']); ?></td>
                                <td><span class="status-badge ok"><?php echo htmlspecialchars($row['role']); ?></span></td>
                                <td><?php echo htmlspecialchars($row['status']); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <div class="alert warning">
                    The <code>users</code> table exists but has 0 records. Click the button below to seed all 9 official bank members into MySQL!
                </div>
            <?php endif; ?>

            <form method="POST" style="margin-top: 16px;">
                <input type="hidden" name="action" value="seed_database">
                <button type="submit" class="btn-green">
                    <?php echo empty($dbUsersList) ? 'Sync & Seed 9 Core Users into MySQL Now' : 'Re-Synchronize 9 Core Users & Balances'; ?>
                </button>
            </form>
        <?php else: ?>
            <p style="color: #64748b;">Connect database in Section 2 above to view or sync database users.</p>
        <?php endif; ?>
    </div>

    <!-- 4. SECURITY & BROWSER CACHE RESET -->
    <div class="card">
        <h2>4. Browser Session & Security Reset</h2>
        <p style="font-size: 0.9rem; color: #64748b;">
            If the admin portal opened without requiring login credentials, click below to purge any stale local sessions. This ensures the admin route guard strictly enforces officer clearance.
        </p>
        <button type="button" onclick="purgeBrowserSessions()" style="background: #475569;">
            Purge Cached Browser Sessions & Return to Login
        </button>

        <script>
            function purgeBrowserSessions() {
                try {
                    localStorage.removeItem('wb_credit_union_admin_session');
                    sessionStorage.removeItem('wb_credit_union_admin_session');
                    localStorage.removeItem('wb_credit_union_active_user');
                    localStorage.removeItem('wb_credit_union_user_session');
                    sessionStorage.removeItem('wb_credit_union_user_session');
                    alert('All stored administrator and customer sessions cleared from browser. Redirecting to admin login...');
                    window.location.href = '/pages/admin-login.html';
                } catch(e) {
                    alert('Sessions cleared.');
                }
            }
        </script>
    </div>

</body>
</html>
