<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$to = trim($data['to'] ?? ($data["recipient"] ?? ''));
$rawSubject = trim($data["subject"] ?? 'Institutional Transaction Notice');
$innerHtml = $data['html'] ?? ($data['text'] ?? ($data['body'] ?? ''));
$emailType = $data['emailType'] ?? ($data['type'] ?? 'transaction_alert');
$smtp = $data['smtp'] ?? [];

if (empty($to)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Recipient required.']);
    exit;
}

$fromEmail = !empty($smtp['fromEmail']) ? $smtp['fromEmail'] : (!empty($smtp['user']) ? $smtp['user'] : 'info@wbcu.net');
$fromName = !empty($smtp['fromName']) ? $smtp['fromName'] : 'WB Credit Finance';

// Determine logo path
$logoFile = dirname(__DIR__) . '/assets/wbcu-logo-64kb.png';
if (!file_exists($logoFile)) { $logoFile = dirname(__DIR__) . '/assets/wbcu-logo.png'; }
$hasLogo = file_exists($logoFile);
$logoData = $hasLogo ? chunk_split(base64_encode(file_get_contents($logoFile))) : '';

// Check if innerHtml is already a full HTML document
if (stripos($innerHtml, '<!DOCTYPE') === false && stripos($innerHtml, '<html') === false) {
    $fullHtml = "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1329; margin: 0; padding: 25px; color: #f8fafc; }
    .card { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(16,185,129,0.35); border-radius: 14px; overflow: hidden; }
    .header { background: #0f172a; padding: 25px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .body { padding: 30px; font-size: 0.95rem; line-height: 1.6; color: #e2e8f0; }
    .footer { background: #060a14; padding: 20px; text-align: center; font-size: 0.75rem; color: #64748b; }
    </style></head><body><div class='card'><div class='header'>" .
    ($hasLogo ? "<img src='cid:wbcu_logo' alt='{$fromName}' width='180' height='44' max-height='44' border='0' style='display:block; margin:0 auto 10px auto; max-height:44px; width:auto; border:0; outline:none;' />" : "") .
    "<div style='color:#ffffff; font-size:0.825rem; font-weight:600; text-transform:uppercase;'>{$fromName} &bull; Transaction Notice</div></div>
    <div class='body'>{$innerHtml}</div>
    <div class='footer'>&copy; " . date('Y') . " {$fromName}. All notices are cryptographically logged.</div></div></body></html>";
} else {
    $fullHtml = preg_replace('/src=[\"\']https?:\/\/[^\"\']+wbcu-logo[^\"\']*[#\']/i', 'src="cid:wbcu_logo"', $innerHtml);
}

$encodedSubject = '=?UTF-8?B?' . base64_encode($rawSubject) . '?=';
$encodedFromName = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
$fromHeader = "{$encodedFromName} <{$fromEmail}>";
$boundary = "----=_Part_" . md5(uniqid(microtime(), true));

$headers = [
    'MIME-Version: 1.0',
    "Content-Type: multipart/related; boundary=\"{$boundary}\"",
    "From: {$fromHeader}",
    "Reply-To: {$fromEmail}",
    "Message-ID: <" . md5(uniqid(microtime(), true)) . "@wbcu.net>",
    'Auto-Submitted: auto-generated',
    'X-Mailer: WB Credit Finance Core'
];

$body = "--{$boundary}\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: base64\r\n\r\n";
$body .= chunk_split(base64_encode($fullHtml)) . "\r\n";

if ($hasLogo) {
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: image/png; name=\"wbcu-logo.png\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-ID: <wbcu_logo>\r\n";
    $body .= "Content-Disposition: inline; filename=\"wbcu-logo.png\"\r\n\r\n";
    $body .= $logoData . "\r\n";
}
$body .= "--{$boundary}--\r\n";

$delivered = @mail($to, $encodedSubject, $body, implode("\r\n", $headers), "-f {$fromEmail}");

echo json_encode([
    'success' => (bool)$delivered,
    'status' => $delivered ? 'delivered' : 'failed',
    'recipient' => $to,
    'method' => 'cPanel Native MTA (CID Embedded)',
    'message' => $delivered ? 'Email dispatched with CID lightweight logo.' : 'Delivery deferred.'
]);
