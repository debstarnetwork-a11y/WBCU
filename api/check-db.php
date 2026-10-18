<?php
header('Content-Type: application/json');

$dbHost = 'localhost';
$dbName = 'glolbka_wbcu_db';
$dbUser = 'glolbka_wbcu_user';
$dbPass = '';

$envPaths = [
    dirname(__DIR__) . '/.env',
    __DIR__ . '/.env',
    __DIR__ . '/../.env',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/.env',
    '/home/glolbka/WBCU/.env',
    '/home/glolbka/public_html/.env'
];

$foundEnv = null;
foreach ($envPaths as $envPath) {
    if (file_exists($envPath)) {
        $foundEnv = $envPath;
        $lines = @file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (is_array($lines)) {
            foreach ($lines as $line) {
                $line = trim($line);
                if (strpos($line, '#') === 0) continue;
                $parts = explode('=', $line, 2);
                if (count($parts) < 2) continue;
                $key = trim($parts[0]);
                $val = trim($parts[1], " \t\n\r\0\x0B\"'");
                if (($key === 'DB_PASS' || $key === 'DB_PASSWORD') && !empty($val)) $dbPass = $val;
                if ($key === 'DB_USER' && !empty($val)) $dbUser = $val;
                if ($key === 'DB_NAME' && !empty($val)) $dbName = $val;
                if ($key === 'DB_HOST' && !empty($val)) $dbHost = trim($val);
            }
        }
    }
}
if ($dbHost === 'localhost' || empty($dbHost)) {
    $dbHost = '127.0.0.1';
}

$results = [
    'status' => 'Testing',
    'env_found' => $foundEnv,
    'db_host' => $dbHost,
    'db_name' => $dbName,
    'db_user' => $dbUser,
    'db_pass_set' => !empty($dbPass),
    'php_version' => PHP_VERSION,
    'server_api' => PHP_SAPI,
];

try {
    $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
    } catch (Throwable $e1) {
        $pdo = new PDO("mysql:host=127.0.0.1;dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
    }
    $results['connection'] = 'SUCCESS';
    
    // Check tables
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }
    $results['tables'] = $tables;
    
    if (in_array('users', $tables)) {
        $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $results['users_count'] = $count;
        
        $cols = $pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_ASSOC);
        $results['users_columns'] = array_column($cols, 'Field');
    }

} catch (Throwable $e) {
    $results['connection'] = 'FAILED';
    $results['error'] = $e->getMessage();
}

echo json_encode($results, JSON_PRETTY_PRINT);
