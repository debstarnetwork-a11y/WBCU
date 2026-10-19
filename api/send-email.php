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
            $read = fgets($socket, 515);
            fputs($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'wbcu.net') . "
");
            $read = fgets($socket, 515);

            if ($smtpPort === 587) {
                fputs($socket, "STARTTLS
");
                $read = fgets($socket, 515);
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                fputs($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'wbcu.net') . "
");
                $read = fgets($socket, 515);
            }

            fputs($socket, "AUTH LOGIN
");
            $read = fgets($socket, 515);
            fputs($socket, base64_encode($smtpUser) . "
");
            $read = fgets($socket, 515);
            fputs($socket, base64_encode($smtpPass) . "
");
            $authRes = fgets($socket, 515);

            if (strpos($authRes, '235') !== false) {
                fputs($socket, "MAIL FROM: <{$fromEmail}>
");
                $read = fgets($socket, 515);
                fputs($socket, "RCPT TO: <{$to}>
");
                $read = fgets($socket, 515);
                fputs($socket, "DATA
");
                $read = fgets($socket, 515);

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
                $dataRes = fgets($socket, 515);
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
