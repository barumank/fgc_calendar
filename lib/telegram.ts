// The route from this server to api.telegram.org drops connections now and
// then (measured: roughly 1 in 15 requests failed to connect), which showed
// up as "fetch failed" in the notification log. Connection failures, 429 and
// 5xx are retried with a growing pause; other 4xx (unknown chat, blocked
// bot) are permanent and fail immediately.
const RETRY_DELAYS_MS = [1000, 3000, 8000];
const MAX_RETRY_AFTER_MS = 30_000;
const REQUEST_TIMEOUT_MS = 15_000;

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

export async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    let failure: Error = new Error('Telegram: неизвестная ошибка');
    let retryable = false;
    let retryAfterMs = 0;

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, secret_token: secretToken, allowed_updates: ['message'] }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram API error: ${res.status}${body ? ` — ${body.slice(0, 300)}` : ''}`);
  }
}
