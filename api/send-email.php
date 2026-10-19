<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - AUTOMATED TRANSACTION EMAIL ENGINE
 * Dispatches HTML Transaction Alerts & Banking Receipts via SMTP / cPanel MTA
 * ============================================================================
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');


function readSmtpResponse($socket) {
    $res = '';
    while ($line = fgets($socket, 515)) {
        $res .= $line;
        // In SMTP, a multi-line reply has '-' as the 4th character (e.g. '250-')
        // The final reply line has a space ' ' (e.g. '250 ')
        if (isset($line[3]) && $line[3] === ' ') break;
        if (strlen(trim($line)) === 3) break;
    }
    return $res;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: $_POST;

$to = trim($data['to'] ?? '');
$subject = trim($data['subject'] ?? 'Transaction Notice - WB Credit Finance');
$html = $data['html'] ?? ($data['text'] ?? ($data['body'] ?? ''));
$emailType = $data['emailType'] ?? ($data['type'] ?? 'transaction_alert');
$smtp = $data['smtp'] ?? [];

if (empty($to)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Recipient email address (to) is required.']);
    exit;
}

if (empty($html)) {
    $html = "<p>A transaction has occurred on your WB Credit Finance account. Please check your banking dashboard for details.</p>";
}


// Wrap message in official branded template with high-res logo
$logoUrl = 'https://i.ibb.co/svKRSV69/WBCU-LOGO-03.png';
$brandedTemplate = "
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1329; margin: 0; padding: 25px; color: #f8fafc; }
    .card { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(16,185,129,0.35); border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: #0a0f1d; padding: 25px; text-align: center; border-bottom: 2px solid #2563eb; }
    .body { padding: 30px; font-size: 0.95rem; line-height: 1.6; color: #e2e8f0; }
    .footer { background: #060a14; padding: 20px; text-align: center; font-size: 0.75rem; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); }
  </style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <img src='{$logoUrl}' alt='{$fromName}' style='height:44px; width:auto; max-width:180px; object-fit:contain; margin-bottom:8px; display:inline-block;' /><br/>
      <span style='color:#94a3b8; font-size:0.8rem; letter-spacing:0.05em; text-transform:uppercase;'>{$fromName} &bull; Institutional Banking Notice</span>
    </div>
    <div class='body'>
      {$html}
    </div>
    <div class='footer'>
      &copy; " . date('Y') . " {$fromName}. All transactional notices are cryptographically logged.
    </div>
  </div>
</body>
</html>
";

$html = $brandedTemplate;

// 1. Determine Sender
$fromEmail = !empty($smtp['fromEmail']) ? $smtp['fromEmail'] : (!empty($smtp['user']) ? $smtp['user'] : 'info@wbcu.net');
$fromName = !empty($smtp['fromName']) ? $smtp['fromName'] : 'WB Credit Finance';

$deliveryMethod = 'cpanel_mta';
$delivered = false;
$errorDetails = '';

// 2. Attempt SMTP Socket Dispatch if Host & Password provided
$smtpHost = $smtp['host'] ?? '';
$smtpUser = $smtp['user'] ?? '';
$smtpPass = $smtp['pass'] ?? ($smtp['password'] ?? '');
$smtpPort = intval($smtp['port'] ?? 587);

if (!empty($smtpHost) && !empty($smtpPass)) {
    try {
        $timeout = 6;
        $context = stream_context_create([
            'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]
        ]);
        $prefix = ($smtpPort === 465) ? 'ssl://' : '';
        $socket = @stream_socket_client($prefix . $smtpHost . ':' . $smtpPort, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);

        if ($socket) {
            $read = readSmtpResponse($socket);
            fputs($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'wbcu.net') . "
");
            $read = readSmtpResponse($socket);

            if ($smtpPort === 587) {
                fputs($socket, "STARTTLS
");
                $read = readSmtpResponse($socket);
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                fputs($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'wbcu.net') . "
");
                $read = readSmtpResponse($socket);
            }

            fputs($socket, "AUTH LOGIN
");
            $read = readSmtpResponse($socket);
            fputs($socket, base64_encode($smtpUser) . "
");
            $read = readSmtpResponse($socket);
            fputs($socket, base64_encode($smtpPass) . "
");
            $authRes = readSmtpResponse($socket);

            if (strpos($authRes, '235') !== false) {
                fputs($socket, "MAIL FROM: <{$fromEmail}>
");
                $read = readSmtpResponse($socket);
                fputs($socket, "RCPT TO: <{$to}>
");
                $read = readSmtpResponse($socket);
                fputs($socket, "DATA
");
                $read = readSmtpResponse($socket);

                $msg = "MIME-Version: 1.0
";
                $msg .= "Content-Type: text/html; charset=UTF-8
";
                $msg .= "From: {$fromName} <{$fromEmail}>
";
                $msg .= "To: <{$to}>
";
                $msg .= "Subject: {$subject}
";
                $msg .= "Date: " . date('r') . "

";
                $msg .= $html . "
.
";

                fputs($socket, $msg);
                $dataRes = readSmtpResponse($socket);
                fputs($socket, "QUIT
");
                fclose($socket);

                if (strpos($dataRes, '250') !== false) {
                    $delivered = true;
                    $deliveryMethod = 'authenticated_smtp';
                }
            } else {
                fclose($socket);
            }
        }
    } catch (Throwable $e) {
        $errorDetails = $e->getMessage();
    }
}

// 3. Fallback to cPanel Native MTA (Exim)
if (!$delivered) {
    $headers = "MIME-Version: 1.0
";
    $headers .= "Content-Type: text/html; charset=UTF-8
";
    $headers .= "From: {$fromName} <{$fromEmail}>
";
    $headers .= "Reply-To: {$fromEmail}
";
    $headers .= "X-Mailer: PHP/" . phpversion() . "
";
    $headers .= "X-Priority: 1 (Highest)
";

    $delivered = @mail($to, $subject, $html, $headers, "-f {$fromEmail}");
    $deliveryMethod = 'cpanel_native_mta';
}

// 4. Log to admin-emails.json for audit trail in the Admin Console
$emailLogFile = dirname(__DIR__) . '/admin-emails.json';
$existingLogs = [];
if (file_exists($emailLogFile)) {
    $existingLogs = json_decode(file_get_contents($emailLogFile), true) ?: [];
}

$newEntry = [
    'id' => 'eml-' . substr(md5(uniqid()), 0, 10),
    'to' => $to,
    'from' => "{$fromName} <{$fromEmail}>",
    'subject' => $subject,
    'emailType' => $emailType,
    'status' => $delivered ? 'delivered' : 'failed',
    'deliveryMethod' => $deliveryMethod,
    'sentAt' => date('Y-m-d H:i:s'),
    'preview' => strip_tags(substr($html, 0, 140)) . '...'
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
    'subject' => $subject,
    'method' => $deliveryMethod,
    'message' => $delivered ? 'Transaction alert email dispatched successfully.' : 'Email queue dispatch deferred.'
]);
