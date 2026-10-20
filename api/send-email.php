<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - RFC-COMPLIANT HTML EMAIL DISPATCH ENGINE
 * Base64 Transfer Encoding + RFC-2047 Header Encoding (Spam Protection)
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

function readSmtpResponse($socket) {
    $res = '';
    while ($line = fgets($socket, 515)) {
        $res .= $line;
        if (isset($line[3]) && $line[3] === ' ') break;
        if (strlen(trim($line)) === 3) break;
    }
    return $res;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$to = trim($data['to'] ?? ($data['recipient'] ?? ''));
$rawSubject = trim($data['subject'] ?? 'Institutional Transaction Notice');
$innerHtml = $data['html'] ?? ($data['text'] ?? ($data['body'] ?? ''));
$emailType = $data['emailType'] ?? ($data['type'] ?? 'transaction_alert');
$smtp = $data['smtp'] ?? [];

if (empty($to)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Recipient email address (to) is required.']);
    exit;
}

if (empty($innerHtml)) {
    $innerHtml = "<p>A transaction has been posted to your depository account. Please log in to your banking dashboard to view details.</p>";
}

// 1. DEFINE SENDER DETAILS FIRST
$fromEmail = !empty($smtp['fromEmail']) ? $smtp['fromEmail'] : (!empty($smtp['user']) ? $smtp['user'] : 'info@wbcu.net');
$fromName = !empty($smtp['fromName']) ? $smtp['fromName'] : 'WB Credit Finance';

// 2. BUILD CLEAN BRANDED HTML CARD WITH EMBEDDED LOGO
$localLogoPath = dirname(__DIR__) . '/assets/img/logo-white.png';
if (file_exists($localLogoPath)) {
    $logoSrc = 'data:image/png;base64,' . base64_encode(file_get_contents($localLogoPath));
} else {
    $logoSrc = 'https://www.wbcu.net/assets/img/logo.png';
}

$fullHtml = "<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>" . htmlspecialchars($rawSubject) . "</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1329; margin: 0; padding: 25px; color: #f8fafc; }
    .card { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(16,185,129,0.35); border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 26px 20px; text-align: center; border-bottom: 3px solid #1d4ed8; }
    .body { padding: 30px; font-size: 0.95rem; line-height: 1.6; color: #e2e8f0; }
    .footer { background: #060a14; padding: 20px; text-align: center; font-size: 0.75rem; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); }
  </style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <a href='https://wbcu.net' target='_blank' style='text-decoration:none; display:inline-block;'>
        <img src='{$logoSrc}' alt='WB Credit Finance' width='180' height='44' border='0' style='display:block; margin:0 auto 10px auto; height:44px; max-height:44px; width:auto; max-width:180px; object-fit:contain; border:0; outline:none;' />
      </a>
      <div style='color:#ffffff; font-size:0.825rem; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; text-shadow:0 1px 2px rgba(0,0,0,0.3);'>
        Institutional Depository &bull; Transaction Notice
      </div>
    </div>
    <div class='body'>
      {$innerHtml}
    </div>
    <div class='footer'>
      &copy; " . date('Y') . " {$fromName}. All institutional notices are cryptographically logged.<br/>
      Zurich &bull; London &bull; New York &bull; Geneva
    </div>
  </div>
</body>
</html>";

// 3. RFC-2047 BASE64 ENCODING (Guarantees proper HTML rendering and bypasses spam flags)
$encodedSubject = '=?UTF-8?B?' . base64_encode($rawSubject) . '?=';
$encodedFromName = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
$fromHeader = "{$encodedFromName} <{$fromEmail}>";
$base64Body = chunk_split(base64_encode($fullHtml));
$messageId = '<' . md5(uniqid(microtime(), true)) . '@wbcu.net>';

$deliveryMethod = 'cpanel_mta';
$delivered = false;
$errorDetails = '';

// 4. ATTEMPT AUTHENTICATED SMTP DISPATCH
$smtpHost = $smtp['host'] ?? '';
$smtpUser = $smtp['user'] ?? '';
$smtpPass = $smtp['pass'] ?? ($smtp['password'] ?? '');
$smtpPort = intval($smtp['port'] ?? 587);

if (!empty($smtpHost) && !empty($smtpPass)) {
    try {
        $timeout = 6;
        $context = stream_context_create([
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true]
        ]);
        $prefix = ($smtpPort === 465) ? 'ssl://' : '';
        $socket = @stream_socket_client($prefix . $smtpHost . ':' . $smtpPort, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);

        if ($socket) {
            readSmtpResponse($socket);
            fputs($socket, "EHLO wbcu.net\r\n");
            readSmtpResponse($socket);

            if ($smtpPort === 587) {
                fputs($socket, "STARTTLS\r\n");
                $tls = readSmtpResponse($socket);
                if (strpos($tls, '220') !== false) {
                    stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                    fputs($socket, "EHLO wbcu.net\r\n");
                    readSmtpResponse($socket);
                }
            }

            fputs($socket, "AUTH LOGIN\r\n");
            readSmtpResponse($socket);
            fputs($socket, base64_encode($smtpUser) . "\r\n");
            readSmtpResponse($socket);
            fputs($socket, base64_encode($smtpPass) . "\r\n");
            $authRes = readSmtpResponse($socket);

            if (strpos($authRes, '235') !== false) {
                fputs($socket, "MAIL FROM: <{$fromEmail}>\r\n");
                readSmtpResponse($socket);
                fputs($socket, "RCPT TO: <{$to}>\r\n");
                readSmtpResponse($socket);
                fputs($socket, "DATA\r\n");
                readSmtpResponse($socket);

                $smtpMsg = "MIME-Version: 1.0\r\n";
                $smtpMsg .= "Content-Type: text/html; charset=UTF-8\r\n";
                $smtpMsg .= "Content-Transfer-Encoding: base64\r\n";
                $smtpMsg .= "From: {$fromHeader}\r\n";
                $smtpMsg .= "To: <{$to}>\r\n";
                $smtpMsg .= "Subject: {$encodedSubject}\r\n";
                $smtpMsg .= "Date: " . date('r') . "\r\n";
                $smtpMsg .= "Message-ID: {$messageId}\r\n";
                $smtpMsg .= "Auto-Submitted: auto-generated\r\n";
                $smtpMsg .= "X-Mailer: WB Credit Finance Core\r\n\r\n";
                $smtpMsg .= $base64Body . "\r\n.\r\n";

                fputs($socket, $smtpMsg);
                $done = readSmtpResponse($socket);
                fputs($socket, "QUIT\r\n");
                fclose($socket);

                if (strpos($done, '250') !== false) {
                    $delivered = true;
                    $deliveryMethod = 'cPanel Authenticated SMTP';
                }
            } else {
                fclose($socket);
            }
        }
    } catch (Throwable $e) {
        $errorDetails = $e->getMessage();
    }
}

// 5. RELIABLE FALLBACK VIA CPANEL EXIM MTA (Standardized Base64 Headers)
if (!$delivered) {
    $mailHeaders = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        "From: {$fromHeader}",
        "Reply-To: {$fromEmail}",
        "Message-ID: {$messageId}",
        'Auto-Submitted: auto-generated',
        'X-Mailer: WB Credit Finance Core'
    ];

    $delivered = @mail($to, $encodedSubject, $base64Body, implode("\r\n", $mailHeaders), "-f {$fromEmail}");
    $deliveryMethod = 'cPanel Native Exim MTA';
}

// 6. RECORD IN AUDIT LOGS
$emailLogFile = dirname(__DIR__) . '/admin-emails.json';
$existingLogs = [];
if (file_exists($emailLogFile)) {
    $existingLogs = json_decode(file_get_contents($emailLogFile), true) ?: [];
}

$newEntry = [
    'id' => 'eml-' . substr(md5(uniqid()), 0, 10),
    'to' => $to,
    'from' => "{$fromName} <{$fromEmail}>",
    'subject' => $rawSubject,
    'emailType' => $emailType,
    'status' => $delivered ? 'delivered' : 'failed',
    'deliveryMethod' => $deliveryMethod,
    'sentAt' => date('Y-m-d H:i:s'),
    'preview' => strip_tags(substr($innerHtml, 0, 140)) . '...'
];

array_unshift($existingLogs, $newEntry);
if (count($existingLogs) > 200) {
    $existingLogs = array_slice($existingLogs, 0, 200);
}
@file_put_contents($emailLogFile, json_encode($existingLogs, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo json_encode([
    'success' => $delivered,
    'status' => $delivered ? 'delivered' : 'failed',
    'recipient' => $to,
    'subject' => $rawSubject,
    'method' => $deliveryMethod,
    'message' => $delivered ? 'Email dispatched with Base64 MIME encapsulation.' : 'Delivery deferred.'
]);
