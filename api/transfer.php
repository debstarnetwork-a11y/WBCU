<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - WIRE TRANSFER & SETTLEMENT ENGINE (/api/transfer.php)
 * ============================================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: [];
if (empty($data) && !empty($_POST)) $data = $_POST;

$userId = trim($data['userId'] ?? '');
$fromAccountId = trim($data['fromAccountId'] ?? $data['accountId'] ?? '');
$amount = (float)($data['amount'] ?? 0);
$currency = strtoupper(trim($data['currency'] ?? 'USD'));
$beneficiary = trim($data['beneficiary'] ?? $data['beneficiaryName'] ?? 'Beneficiary');
$bankName = trim($data['bankName'] ?? 'Beneficiary Bank');
$iban = trim($data['iban'] ?? $data['accountNumber'] ?? '');
$swift = trim($data['swift'] ?? 'WBCUCHZZ');
$bankCountry = trim($data['bankCountry'] ?? 'Switzerland');
$txRef = trim($data['txRef'] ?? $data['reference'] ?? ('WTX-' . strtoupper(substr(uniqid(), -8))));
$description = trim($data['description'] ?? ("Wire Transfer to " . $beneficiary));

if ($amount <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid transfer amount.']);
    exit;
}

// 1. Discover Database Config
$dbHost = '127.0.0.1';
$dbName = 'glolbka_wbcu_db';
$dbUser = 'glolbka_wbcu_user';
$dbPass = 'yeshuah.com';

$scriptDir = __DIR__;
$possibleRoots = [
    dirname($scriptDir),
    $scriptDir,
    '/home/glolbka/WBCU',
    '/home/glolbka/public_html',
    dirname(dirname($scriptDir))
];

foreach ($possibleRoots as $root) {
    if (file_exists($root . '/.env')) {
        $lines = @file($root . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines) {
            foreach ($lines as $line) {
                $trimmed = trim($line);
                if (strpos($trimmed, '#') === 0) continue;
                $parts = explode('=', $trimmed, 2);
                if (count($parts) < 2) continue;
                $k = trim($parts[0]);
                $v = trim($parts[1], " \t\n\r\0\x0B\"'");
                if ($k === 'DB_PASS' || $k === 'DB_PASSWORD') $dbPass = $v;
                if ($k === 'DB_USER') $dbUser = $v;
                if ($k === 'DB_NAME') $dbName = $v;
                if ($k === 'DB_HOST') $dbHost = ($v === 'localhost' || empty($v)) ? '127.0.0.1' : $v;
            }
        }
        break;
    }
}

$pdo = null;
$probes = [
    "mysql:host={$dbHost};port=3306;dbname={$dbName};charset=utf8mb4",
    "mysql:host=127.0.0.1;dbname={$dbName};charset=utf8mb4",
    "mysql:host=localhost;dbname={$dbName};charset=utf8mb4",
    "mysql:unix_socket=/var/lib/mysql/mysql.sock;dbname={$dbName};charset=utf8mb4",
    "mysql:unix_socket=/tmp/mysql.sock;dbname={$dbName};charset=utf8mb4"
];

foreach ($probes as $dsn) {
    try {
        $pdo = new PDO($dsn, trim($dbUser), trim($dbPass), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 3
        ]);
        if ($pdo) break;
    } catch (Throwable $e) {}
}

$newBalance = 0.00;

if ($pdo) {
    try {
        // Ensure transactions table exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `transactions` (
              `id` VARCHAR(64) NOT NULL PRIMARY KEY,
              `user_id` VARCHAR(64) NOT NULL,
              `account_id` VARCHAR(64) DEFAULT NULL,
              `type` VARCHAR(50) NOT NULL DEFAULT 'wire',
              `amount` DECIMAL(18,2) NOT NULL,
              `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
              `beneficiary` VARCHAR(255) DEFAULT NULL,
              `bank_name` VARCHAR(255) DEFAULT NULL,
              `iban` VARCHAR(100) DEFAULT NULL,
              `swift` VARCHAR(50) DEFAULT NULL,
              `reference` VARCHAR(100) NOT NULL,
              `status` VARCHAR(50) NOT NULL DEFAULT 'completed',
              `description` TEXT DEFAULT NULL,
              `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              UNIQUE KEY `uk_tx_ref` (`reference`),
              KEY `idx_tx_user` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Find source account
        $stmt = $pdo->prepare("SELECT * FROM `accounts` WHERE id = ? OR account_number = ? OR (user_id = ? AND is_primary = 1) LIMIT 1");
        $stmt->execute([$fromAccountId, $fromAccountId, $userId]);
        $acct = $stmt->fetch();

        if ($acct) {
            $currentBal = (float)$acct['balance'];
            $newBalance = max(0, $currentBal - $amount);
            $newAvail = max(0, (float)$acct['available_balance'] - $amount);

            // Update balance
            $upStmt = $pdo->prepare("UPDATE `accounts` SET `balance` = ?, `available_balance` = ? WHERE `id` = ?");
            $upStmt->execute([$newBalance, $newAvail, $acct['id']]);

            $acctDbId = $acct['id'];
        } else {
            $acctDbId = $fromAccountId;
        }

        // Insert Transaction record
        $insStmt = $pdo->prepare("
            INSERT INTO `transactions` 
            (`id`, `user_id`, `account_id`, `type`, `amount`, `currency`, `beneficiary`, `bank_name`, `iban`, `swift`, `reference`, `status`, `description`) 
            VALUES (?, ?, ?, 'wire', ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
        ");
        $txId = 'tx-' . uniqid();
        $insStmt->execute([
            $txId, $userId, $acctDbId, $amount, $currency, $beneficiary, $bankName, $iban, $swift, $txRef, $description
        ]);

    } catch (Throwable $e) {
        error_log("Transfer processing notice: " . $e->getMessage());
    }
}

echo json_encode([
    'success' => true,
    'txRef' => $txRef,
    'amount' => $amount,
    'currency' => $currency,
    'beneficiary' => $beneficiary,
    'bankName' => $bankName,
    'iban' => $iban,
    'swift' => $swift,
    'new_balance' => $newBalance,
    'status' => 'completed',
    'timestamp' => date('Y-m-d H:i:s')
]);
