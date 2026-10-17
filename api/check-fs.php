<?php
header('Content-Type: application/json');

$root = dirname(__DIR__);
$files = ['admin-users.json', 'admin-users-persistent.json', '.env', '.htaccess', 'index.html'];

$results = [
    'root' => $root,
    'writeable' => is_writable($root),
    'files' => []
];

foreach ($files as $f) {
    $p = $root . '/' . $f;
    $results['files'][$f] = [
        'exists' => file_exists($p),
        'readable' => is_readable($p),
        'writeable' => is_writable($p),
        'size' => file_exists($p) ? filesize($p) : 0,
        'mtime' => file_exists($p) ? date('c', filemtime($p)) : null
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT);
