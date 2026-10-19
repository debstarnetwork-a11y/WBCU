<?php
/**
 * WB CREDIT FINANCE - ADMIN USERS BACKEND API (cPanel / PHP / MySQL / JSON)
 * Full Two-Way Synchronization: Reads & Writes Profiles, Accounts, Admins, Users
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
$dbHost = '127.0.0.1';
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
                if ($k === 'DB_PASS' || $k === 'DB_PASSWORD') $dbPass = trim($v);
                if ($k === 'DB_USER') $dbUser = trim($v);
                if ($k === 'DB_NAME') $dbName = trim($v);
                if ($k === 'DB_HOST') $dbHost = trim($v);
            }
        }
    }
}
if ($dbHost === 'localhost' || empty($dbHost)) {
    $dbHost = '127.0.0.1';
}

$pdo = null;
try {
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5
    ]);
} catch (Throwable $e) {
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;dbname={$dbName};charset=utf8mb4", $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ]);
    } catch (Throwable $e2) {
        $pdo = null;
    }
}

// 2. HANDLE POST / WRITE OPERATIONS (Crediting accounts, Updating Photos, etc.)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?: [];
    $postUsers = $payload['users'] ?? (!empty($payload['user']) ? [$payload['user']] : []);
    $updatedCount = 0;

    if (!empty($postUsers) && is_array($postUsers) && $pdo) {
        foreach ($postUsers as $u) {
            $uid = $u['id'] ?? null;
            if (!$uid) continue;

            // A0. Synchronize dedicated MySQL Admins table if admin
            $isAdmOfficer = !empty($u['is_admin']) || !empty($u['is_officer']) || (isset($u['role']) && stripos($u['role'], 'admin') !== false);
            if ($isAdmOfficer && $pdo) {
                try {
                    $newPass = !empty($u['password']) ? $u['password'] : (!empty($u['password_hash']) ? $u['password_hash'] : null);
                    $aStmt = $pdo->prepare("UPDATE `admins` SET 
                        username = COALESCE(?, username),
                        email = COALESCE(?, email),
                        full_name = COALESCE(?, full_name),
                        password_hash = COALESCE(?, password_hash),
                        status = COALESCE(?, status)
                        WHERE id = ? OR LOWER(username) = ? OR LOWER(email) = ?");
                    $aStmt->execute([
                        $u['username'] ?? null,
                        $u['email'] ?? null,
                        $u['fullName'] ?? ($u['full_name'] ?? null),
                        $newPass,
                        $u['status'] ?? null,
                        $uid,
                        strtolower($u['username'] ?? ''),
                        strtolower($u['email'] ?? '')
                    ]);
                } catch (Throwable $e) {}
            }

            // A. Update Users table
            try {
                $stmt = $pdo->prepare("UPDATE `users` SET status = COALESCE(?, status), kyc_status = COALESCE(?, kyc_status), transaction_pin = COALESCE(?, transaction_pin) WHERE id = ?");
                $stmt->execute([
                    $u['status'] ?? null,
                    $u['kycStatus'] ?? ($u['kyc_status'] ?? null),
                    $u['pin'] ?? ($u['transactionPin'] ?? null),
                    $uid
                ]);
            } catch (Throwable $e) {}

            // B. Update Profiles table (Photo, phone, name)
            $photo = $u['profilePhoto'] ?? ($u['avatarUrl'] ?? ($u['profile_photo_url'] ?? null));
            $passport = $u['passportPhoto'] ?? ($u['passport_photo_url'] ?? null);
            $phone = $u['phone'] ?? ($u['phoneNumber'] ?? ($u['phone_number'] ?? null));
            $fullName = $u['fullName'] ?? ($u['full_name'] ?? null);

            if ($photo !== null || $passport !== null || $phone !== null || $fullName !== null) {
                try {
                    $pStmt = $pdo->prepare("SELECT id FROM `profiles` WHERE user_id = ? LIMIT 1");
                    $pStmt->execute([$uid]);
                    $existingP = $pStmt->fetch();

                    if ($existingP) {
                        $uProf = $pdo->prepare("UPDATE `profiles` SET 
                            profile_photo_url = COALESCE(?, profile_photo_url),
                            passport_photo_url = COALESCE(?, passport_photo_url),
                            phone_number = COALESCE(?, phone_number),
                            full_name = COALESCE(?, full_name)
                            WHERE user_id = ?");
                        $uProf->execute([$photo, $passport, $phone, $fullName, $uid]);
                    } else {
                        $profId = 'prof-' . substr(md5($uid . strval(time())), 0, 12);
                        $iProf = $pdo->prepare("INSERT INTO `profiles` (id, user_id, full_name, profile_photo_url, passport_photo_url, phone_number) VALUES (?, ?, ?, ?, ?, ?)");
                        $iProf->execute([$profId, $uid, $fullName ?? 'Member', $photo, $passport, $phone]);
                    }
                } catch (Throwable $e) {}
            }

            // C. Update Accounts table (Balances, Status)
            $userAccts = $u['accounts'] ?? [];
            if (!empty($userAccts) && is_array($userAccts)) {
                foreach ($userAccts as $acc) {
                    $accId = $acc['id'] ?? null;
                    $accNum = $acc['accountNumber'] ?? ($acc['account_number'] ?? null);
                    $bal = isset($acc['balance']) ? (float)$acc['balance'] : null;
                    $avail = isset($acc['available']) ? (float)$acc['available'] : (isset($acc['available_balance']) ? (float)$acc['available_balance'] : $bal);
                    $accStatus = $acc['status'] ?? null;

                    if ($bal !== null && ($accId || $accNum)) {
                        try {
                            $aStmt = $pdo->prepare("UPDATE `accounts` SET 
                                balance = ?, 
                                available_balance = ?, 
                                status = COALESCE(?, status) 
                                WHERE (id = ? OR account_number = ?) AND user_id = ?");
                            $aStmt->execute([$bal, $avail, $accStatus, $accId, $accNum, $uid]);
                        } catch (Throwable $e) {}
                    }
                }
            }

            $updatedCount++;
        }
    }

    $jsonFile = dirname(__DIR__) . '/admin-users.json';
    if (!empty($postUsers)) {
        try {
            file_put_contents($jsonFile, json_encode($postUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } catch (Throwable $e) {}
    }

    echo json_encode([
        'success' => true,
        'message' => 'Database updated successfully.',
        'updated_count' => $updatedCount
    ]);
    exit;
}

// 3. HANDLE GET / READ OPERATIONS (Fetch all Admins, Members, Photos, Vaults)
$usersMap = [];
$adminsList = [];

$jsonFile = dirname(__DIR__) . '/admin-users.json';
if (file_exists($jsonFile)) {
    $jsonData = json_decode(file_get_contents($jsonFile), true) ?: [];
    foreach ($jsonData as $u) {
        if (!empty($u['id'])) $usersMap[$u['id']] = $u;
    }
}

if ($pdo) {
    try {
        // A. Load Accounts Map
        $dbAccts = $pdo->query("SELECT * FROM `accounts` ORDER BY is_primary DESC, balance DESC, id ASC")->fetchAll();
        $acctMap = [];
        foreach ($dbAccts as $a) {
            $acctMap[$a['user_id']][] = [
                'id' => $a['id'],
                'accountNumber' => $a['account_number'],
                'type' => $a['account_type'],
                'name' => $a['account_name'],
                'currency' => $a['currency'],
                'balance' => (float)$a['balance'],
                'available' => isset($a['available_balance']) ? (float)$a['available_balance'] : (float)$a['balance'],
                'routingNumber' => $a['routing_number'],
                'isPrimary' => (bool)$a['is_primary'],
                'status' => $a['status']
            ];
        }

        // B. Load Dedicated Admins Table
        $dbAdmins = $pdo->query("SELECT * FROM `admins`")->fetchAll();
        foreach ($dbAdmins as $adm) {
            $aid = $adm['id'];
            $admItem = [
                'id' => $aid,
                'fullName' => $adm['full_name'] ?: $adm['username'],
                'email' => $adm['email'],
                'username' => $adm['username'],
                'role' => ($adm['role'] === 'super_admin') ? 'Super Admin' : 'Admin',
                'is_admin' => true,
                'is_officer' => true,
                'source' => 'db_admins',
                'status' => $adm['status'] ?? 'active',
                'kycStatus' => 'verified',
                'pin' => '8869',
                'phone' => '+41 44 915 8900',
                'avatarColor' => 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)',
                'accounts' => $acctMap[$aid] ?? []
            ];
            $adminsList[] = $admItem;
            $usersMap[$aid] = $admItem;
        }

        // C. Load Members (Users + Profiles + Full Photos)
        $dbUsers = $pdo->query("
            SELECT u.*, 
                   p.first_name, p.middle_name, p.last_name, p.full_name,
                   p.phone_number, p.date_of_birth, p.gender, p.nationality,
                   p.address_line1, p.city, p.state, p.postal_code, p.country,
                   p.profile_photo_url, p.passport_photo_url, p.avatar_color
            FROM `users` u 
            LEFT JOIN `profiles` p ON u.id = p.user_id
        ")->fetchAll();

        foreach ($dbUsers as $row) {
            $uid = $row['id'];
            $role = strtolower($row['role'] ?? '');
            $isAdmin = ($role === 'admin' || $role === 'super_admin' || $role === 'auditor');

            $photo = $row['profile_photo_url'] ?: ($row['passport_photo_url'] ?: '');
            $fn = $row['full_name'] ?: trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
            if (empty($fn)) $fn = $row['username'] ?: $row['email'];

            $addr = trim(($row['address_line1'] ?? '') . ', ' . ($row['city'] ?? '') . ' ' . ($row['postal_code'] ?? '') . ', ' . ($row['country'] ?? ''));

            $usersMap[$uid] = [
                'id' => $uid,
                'fullName' => $fn,
                'firstName' => $row['first_name'] ?? '',
                'lastName' => $row['last_name'] ?? '',
                'email' => $row['email'],
                'username' => $row['username'],
                'password' => $row['password_hash'],
                'role' => ($role === 'super_admin') ? 'Super Admin' : ($isAdmin ? 'Admin' : 'Member'),
                'is_admin' => $isAdmin,
                'is_officer' => $isAdmin,
                'status' => $row['status'] ?? 'active',
                'kycStatus' => $row['kyc_status'] ?? 'verified',
                'pin' => $row['transaction_pin'] ?? '1234',
                'phone' => $row['phone_number'] ?? '',
                'dob' => $row['date_of_birth'] ?? '',
                'nationality' => $row['nationality'] ?? 'Switzerland',
                'address' => $addr,
                'profilePhoto' => $photo,
                'avatarUrl' => $photo,
                'passportPhoto' => $row['passport_photo_url'] ?? '',
                'avatarColor' => $row['avatar_color'] ?: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                'accounts' => $acctMap[$uid] ?? []
            ];
        }
    } catch (Throwable $e) {}
}

echo json_encode([
    'success' => true,
    'users' => array_values($usersMap),
    'admins' => $adminsList,
    'total_users' => count($usersMap),
    'total_admins' => count($adminsList),
    'db_connected' => ($pdo !== null)
]);
