export async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram API error: ${res.status}${body ? ` — ${body.slice(0, 300)}` : ''}`);
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
