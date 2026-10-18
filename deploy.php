<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - GITHUB AUTO-DEPLOYMENT WEBHOOK
 * ============================================================================
 * 
 * Instructions:
 * 1. Upload this file to your public_html folder (e.g. public_html/deploy.php)
 * 2. Go to your GitHub Repository -> Settings -> Webhooks
 * 3. Add a new webhook:
 *    - Payload URL: https://www.wbcu.net/deploy.php
 *    - Content type: application/json
 *    - Trigger: Just the push event.
 * 4. Ensure your cPanel user has SSH access to the GitHub repo (already should be if you cloned it).
 * ============================================================================
 */

// Secret for security (Optional: add a check for X-Hub-Signature)
// $secret = 'your_secret_here';

header('Content-Type: application/json');

// 1. Path to your repository on the server
$repoPath = '/home/glolbka/repositories/WBCU';

// 2. Change to the repository directory
if (!is_dir($repoPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Repository directory not found.']);
    exit;
}

chdir($repoPath);

// Pre-flight Disk Space Optimization: Truncate large error logs to free space
$logPaths = [
    '/home/glolbka/public_html/error_log',
    '/home/glolbka/public_html/api/error_log',
    $repoPath . '/error_log'
];
foreach ($logPaths as $lp) {
    if (file_exists($lp) && filesize($lp) > 1024 * 1024) {
        @file_put_contents($lp, '');
    }
}
@exec("git gc --prune=now 2>&1");

// 3. Perform git fetch and hard reset to match GitHub exactly
$output = [];
$returnCode = 0;
exec("git fetch origin main && git checkout -f main && git reset --hard origin/main && git clean -fd -e admin-users.json -e admin-users-persistent.json -e .env 2>&1", $output, $returnCode);

if ($returnCode === 0) {
    // 4. Trigger cPanel Deployment task (executes .cpanel.yml tasks to copy files to public_html)
    $deployOutput = [];
    $deployRetval = 0;
    @exec("/usr/local/cpanel/bin/cpcmd VersionControl update_deploy repository_root=" . escapeshellarg($repoPath) . " 2>&1", $deployOutput, $deployRetval);

    echo json_encode([
        'success' => true,
        'message' => 'Successfully synchronized and deployed changes from GitHub.',
        'git_sync' => $output,
        'cpanel_deploy' => [
            'status' => $deployRetval === 0 ? 'Success' : 'Notice',
            'output' => $deployOutput
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to pull changes.',
        'output' => $output
    ]);
}
