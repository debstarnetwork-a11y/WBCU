<?php
header('Content-Type: application/json');

$dataFile = dirname(__DIR__) . '/admin-users.json';
$users = [];
if (file_exists($dataFile)) {
    $users = json_decode(file_get_contents($dataFile), true);
}

$testUser = 'admin@wbcu.net';
$testPass = '12345';

$found = null;
foreach ($users as $u) {
    if (strtolower($u['email']) === $testUser || strtolower($u['username'] ?? '') === 'admin') {
        $found = $u;
        break;
    }
}

$results = [
    'json_file' => $dataFile,
    'json_exists' => file_exists($dataFile),
    'json_size' => file_exists($dataFile) ? filesize($dataFile) : 0,
    'test_user' => $testUser,
    'user_found' => ($found !== null),
    'password_match' => ($found && ($found['password'] === $testPass || $found['password_hash'] === $testPass))
];

echo json_encode($results, JSON_PRETTY_PRINT);
