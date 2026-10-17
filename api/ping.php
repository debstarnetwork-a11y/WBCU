<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'pong',
    'time' => date('c'),
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown'
]);
