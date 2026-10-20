<?php
/**
 * ============================================================================
 * WB CREDIT FINANCE - LIVE SMTP & EMAIL RELAY TESTER
 * Validates TLS/SSL socket connectivity and delivers live test notifications
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

$recipient = trim($data['recipient'] ?? ($data['to'] ?? ''));
$smtp = $data['smtp'] ?? [];

$host = trim($smtp['host'] ?? 'mail.wbcu.net');
$port = intval($smtp['port'] ?? 587);
$user = trim($smtp['user'] ?? 'info@wbcu.net');
$pass = trim($smtp['pass'] ?? '');
$fromEmail = trim($smtp['senderEmail'] ?? ($smtp['fromEmail'] ?? $user));
$fromName = trim($smtp['senderName'] ?? ($smtp['fromName'] ?? 'WB Credit Finance'));

if (empty($recipient)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Recipient email address is required.']);
    exit;
}

$success = false;
$relayMethod = 'direct_smtp';
$errorMessage = '';
$diagnosticSuggestion = '';
$messageId = 'msg-' . substr(md5(uniqid()), 0, 12);

$subject = "⚡ Live Transaction Dispatch Test - " . $fromName;
$htmlBody = "
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1329; margin: 0; padding: 25px; color: #f8fafc; }
    .card { max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(16,185,129,0.35); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 25px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 1.35rem; letter-spacing: 0.05em; text-transform: uppercase; }
    .body { padding: 30px; font-size: 0.95rem; line-height: 1.6; color: #e2e8f0; }
    .stat-badge { display: inline-block; background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #34d399; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; }
    .footer { background: #090e1a; padding: 20px; text-align: center; font-size: 0.75rem; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); }
  </style>
</head>
<body>
  <div class='card'>
    <div class='header'>
      <img src='https://www.wbcu.net/assets/img/logo.png' alt='WB Credit Finance' style='height:44px; width:auto; max-width:180px; object-fit:contain; margin-bottom:10px; display:inline-block;' /><br/>
      <h1>{$fromName}</h1>
      <p style='margin:5px 0 0; font-size:0.85rem; opacity:0.9;'>Automated Transaction Relay System</p>
    </div>
    <div class='body'>
      <div style='text-align:center; margin-bottom: 20px;'>
        <span class='stat-badge'>✓ LIVE RELAY ONLINE</span>
      </div>
      <p>Hello,</p>
      <p>This is a live transactional test notification dispatched from your institutional administration console.</p>
      <div style='background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:15px; margin:20px 0;'>
        <div style='margin-bottom:6px;'><strong>Dispatch Host:</strong> {$host}:{$port}</div>
        <div style='margin-bottom:6px;'><strong>Authenticated Sender:</strong> {$fromEmail}</div>
        <div style='margin-bottom:6px;'><strong>Recipient:</strong> {$recipient}</div>
        <div><strong>Message Reference:</strong> {$messageId}</div>
      </div>
      <p>Real-time email alerts for wire transfers, vault deposits, and card orders are now active.</p>
    </div>
    <div class='footer'>
      &copy; " . date('Y') . " {$fromName}. All institutional transmissions are encrypted.
    </div>
  </div>
</body>
</html>
";

// 1. Attempt Authenticated Socket SMTP Connection
if (!empty($host) && !empty($pass)) {
    try {
        $timeout = 6;
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);
        $prefix = ($port === 465) ? 'ssl://' : '';
        $socket = @stream_socket_client($prefix . $host . ':' . $port, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);

        if ($socket) {
            $banner = readSmtpResponse($socket);
            fputs($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'wbcu.net') . "
");
            $ehloRes = readSmtpResponse($socket);

            if ($port === 587) {
                fputs($socket, "STARTTLS
");
                $tlsRes = readSmtpResponse($socket);
                if (strpos($tlsRes, '220') !== false) {
                    stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                    fputs($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'wbcu.net') . "
");
                    $ehloRes = readSmtpResponse($socket);
                }
            }

            fputs($socket, "AUTH LOGIN
");
            $authAsk = readSmtpResponse($socket);
            fputs($socket, base64_encode($user) . "
");
            $userAsk = readSmtpResponse($socket);
            fputs($socket, base64_encode($pass) . "
");
            $passRes = readSmtpResponse($socket);

            if (strpos($passRes, '235') !== false) {
                fputs($socket, "MAIL FROM: <{$fromEmail}>
");
                $mailFromRes = readSmtpResponse($socket);
                fputs($socket, "RCPT TO: <{$recipient}>
");
                $rcptRes = readSmtpResponse($socket);
                fputs($socket, "DATA
");
                $dataAsk = readSmtpResponse($socket);

                $headers = "MIME-Version: 1.0
";
                $headers .= "Content-Type: text/html; charset=UTF-8
";
                $headers .= "From: {$fromName} <{$fromEmail}>
";
                $headers .= "To: <{$recipient}>
";
                $headers .= "Subject: {$subject}
";
                $headers .= "Date: " . date('r') . "
";
                $headers .= "Message-ID: <{$messageId}@" . ($_SERVER['SERVER_NAME'] ?? 'wbcu.net') . ">
";
                $headers .= "X-Mailer: PHP/SMTP

";

                fputs($socket, $headers . $htmlBody . "
.
");
                $doneRes = readSmtpResponse($socket);
                fputs($socket, "QUIT
");
                fclose($socket);

                if (strpos($doneRes, '250') !== false) {
                    $success = true;
                    $relayMethod = 'cPanel Authenticated SMTP';
                } else {
                    $errorMessage = "Server rejected message body: " . trim($doneRes);
                }
            } else {
                fclose($socket);
                $errorMessage = "Authentication failed (code: " . trim($passRes) . ")";
                $diagnosticSuggestion = "The SMTP server is online, but rejected the password for {$user}. Enter the exact password you created in cPanel Email Accounts.";
            }
        } else {
            $errorMessage = "Could not connect to {$host}:{$port} - {$errstr} ({$errno})";
        }
    } catch (Throwable $e) {
        $errorMessage = $e->getMessage();
    }
}

// 2. Seamless Fallback: Native cPanel Exim MTA (Guaranteed local delivery)
if (!$success) {
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

    $mailSent = @mail($recipient, $subject, $htmlBody, $headers, "-f {$fromEmail}");
    if ($mailSent) {
        $success = true;
        $relayMethod = 'cPanel Exim Native MTA';
    }
}

echo json_encode([
    'success' => $success,
    'host' => $host,
    'port' => $port,
    'messageId' => $messageId,
    'relay' => $relayMethod,
    'error' => $errorMessage,
    'suggestion' => $diagnosticSuggestion,
    'directNotice' => $success 
        ? "Live test notification successfully dispatched to {$recipient} via {$relayMethod}." 
        : "Dispatch error: {$errorMessage}"
]);
