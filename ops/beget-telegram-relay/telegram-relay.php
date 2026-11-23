<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'description' => 'POST required']);
}

$isHttps = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
    || (($_SERVER['SERVER_PORT'] ?? '') === '443');
if (!$isHttps) {
    respond(400, ['ok' => false, 'description' => 'HTTPS required']);
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 65536) {
    respond(413, ['ok' => false, 'description' => 'Request too large']);
}

$configPath = dirname(__DIR__) . '/telegram-relay-config.php';
if (!is_file($configPath)) {
    respond(503, ['ok' => false, 'description' => 'Relay is not configured']);
}
$config = require $configPath;
$expectedSecret = is_array($config) ? (string) ($config['shared_secret'] ?? '') : '';
if ($expectedSecret === '') {
    respond(503, ['ok' => false, 'description' => 'Relay is not configured']);
}

$authorization = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if ($authorization === '' && function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if (strcasecmp((string) $name, 'Authorization') === 0) {
            $authorization = (string) $value;
            break;
        }
    }
}
if (!preg_match('/^Bearer\s+(.+)$/i', $authorization, $authMatch)
    || !hash_equals($expectedSecret, trim($authMatch[1]))) {
    respond(401, ['ok' => false, 'description' => 'Unauthorized']);
}

$request = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($request)) {
    respond(400, ['ok' => false, 'description' => 'Invalid JSON']);
}

$method = (string) ($request['method'] ?? '');
$allowedMethods = ['sendMessage', 'setWebhook'];
if (!in_array($method, $allowedMethods, true)) {
    respond(400, ['ok' => false, 'description' => 'Unsupported Telegram method']);
}

$token = (string) ($request['token'] ?? '');
if (!preg_match('/^\d+:[A-Za-z0-9_-]+$/', $token)) {
    respond(400, ['ok' => false, 'description' => 'Invalid bot token format']);
}

$params = $request['params'] ?? null;
if (!is_array($params)) {
    respond(400, ['ok' => false, 'description' => 'Invalid params']);
}

if ($method === 'sendMessage') {
    if (empty($params['chat_id']) || !isset($params['text']) || !is_string($params['text'])) {
        respond(400, ['ok' => false, 'description' => 'chat_id and text are required']);
    }
}

if ($method === 'setWebhook') {
    $webhookUrl = (string) ($params['url'] ?? '');
    $allowedWebhooks = [
        'https://fgc-calendar.ru/next-api/telegram-auth-webhook',
        'https://fgc-calendar.ru/next-api/telegram-webhook',
    ];
    if (!in_array($webhookUrl, $allowedWebhooks, true)) {
        respond(400, ['ok' => false, 'description' => 'Webhook URL is not allowed']);
    }
}

if (!function_exists('curl_init')) {
    respond(503, ['ok' => false, 'description' => 'PHP cURL extension is unavailable']);
}

$payload = json_encode($params, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($payload === false) {
    respond(400, ['ok' => false, 'description' => 'Could not encode params']);
}

$curl = curl_init('https://api.telegram.org/bot' . $token . '/' . $method);
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 25,
]);
$responseBody = curl_exec($curl);
$curlError = curl_error($curl);
$responseStatus = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);

if ($responseBody === false) {
    error_log('FightNexus Telegram relay: upstream request failed: ' . $curlError);
    respond(502, ['ok' => false, 'description' => 'Could not reach Telegram Bot API']);
}

http_response_code($responseStatus > 0 ? $responseStatus : 502);
echo $responseBody;
