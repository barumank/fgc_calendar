// The route from this server to api.telegram.org drops connections now and
// then (measured: roughly 1 in 15 requests failed to connect), which showed
// up as "fetch failed" in the notification log. Connection failures, 429 and
// 5xx are retried with a growing pause; other 4xx (unknown chat, blocked
// bot) are permanent and fail immediately.
const RETRY_DELAYS_MS = [1000, 3000, 8000];
const MAX_RETRY_AFTER_MS = 30_000;
const REQUEST_TIMEOUT_MS = 15_000;
const TELEGRAM_API_BASE_URL = 'https://api.telegram.org';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function describeNetworkError(e: unknown): string {
  const err = e as { name?: string; message?: string; cause?: { code?: string; message?: string } };
  const base = err?.name === 'TimeoutError' ? 'таймаут запроса' : (err?.message ?? String(e));
  const detail = err?.cause?.code ?? err?.cause?.message;
  return detail ? `${base} (${detail})` : base;
}

function parseRetryAfterMs(body: string): number {
  try {
    const seconds = Number(JSON.parse(body)?.parameters?.retry_after);
    return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, MAX_RETRY_AFTER_MS) : 0;
  } catch {
    return 0;
  }
}

function getTelegramRelayConfig(): { url: string; secret: string } | null {
  const url = process.env.TELEGRAM_RELAY_URL?.trim();
  const secret = process.env.TELEGRAM_RELAY_SECRET?.trim();

  if (!url && !secret) return null;
  if (!url || !secret) {
    throw new Error('Для Telegram-посредника должны быть заданы TELEGRAM_RELAY_URL и TELEGRAM_RELAY_SECRET');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Некорректный TELEGRAM_RELAY_URL');
  }
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('TELEGRAM_RELAY_URL должен использовать HTTPS');
  }

  return { url: parsedUrl.toString(), secret };
}

function telegramApiFetch(
  botToken: string,
  method: 'sendMessage' | 'setWebhook',
  params: Record<string, unknown>,
): Promise<Response> {
  const relay = getTelegramRelayConfig();
  const url = relay
    ? relay.url
    : `${TELEGRAM_API_BASE_URL}/bot${botToken}/${method}`;
  const body = relay
    ? JSON.stringify({ method, token: botToken, params })
    : JSON.stringify(params);

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(relay ? { Authorization: `Bearer ${relay.secret}` } : {}),
    },
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    let failure: Error = new Error('Telegram: неизвестная ошибка');
    let retryable = false;
    let retryAfterMs = 0;

    try {
      const res = await telegramApiFetch(botToken, 'sendMessage', {
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      });
      if (res.ok) return;

      const body = await res.text().catch(() => '');
      failure = new Error(`Telegram API error: ${res.status}${body ? ` — ${body.slice(0, 300)}` : ''}`);
      retryable = res.status === 429 || res.status >= 500;
      if (res.status === 429) retryAfterMs = parseRetryAfterMs(body);
    } catch (e) {
      failure = new Error(`Нет соединения с Telegram: ${describeNetworkError(e)}`);
      retryable = true;
    }

    if (!retryable || attempt >= RETRY_DELAYS_MS.length) throw failure;
    await sleep(Math.max(RETRY_DELAYS_MS[attempt], retryAfterMs));
  }
}

export async function setTelegramWebhook(botToken: string, url: string, secretToken: string): Promise<void> {
  const res = await telegramApiFetch(botToken, 'setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message'],
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram API error: ${res.status}${body ? ` — ${body.slice(0, 300)}` : ''}`);
  }
}
