import { NextRequest, NextResponse } from 'next/server';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';
import { sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-telegram-bot-api-secret-token');
  const expectedSecret = await getSetting(SETTING_KEYS.telegramWebhookSecret);
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const chatId = update?.message?.chat?.id;

  // Reply to any message the bot receives, not just /start — the bot only
  // ever exists to hand back the sender's chat id, so anything they write works.
  if (chatId) {
    const botToken = await getSetting(SETTING_KEYS.telegramBotToken);
    if (botToken) {
      const message = `Ваш Chat ID: ${chatId}\n\nСкопируйте его и вставьте в разделе "Уведомления" в админ-панели сайта, чтобы получать уведомления о новых заявках на турниры.`;
      await sendTelegramMessage(botToken, String(chatId), message).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
