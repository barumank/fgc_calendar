import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSetting, setSetting, SETTING_KEYS } from '@/lib/app-settings';
import { setTelegramWebhook } from '@/lib/telegram';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Public on purpose: the bot name is shown on the (unauthenticated) login modal
  // so visitors know who to message to register.
  const botName = await getSetting(SETTING_KEYS.authTelegramBotName);
  const token = await getSetting(SETTING_KEYS.authTelegramBotToken);
  return NextResponse.json({ botName: botName ?? '', hasToken: !!token });
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const body = await req.json();
  const botName = (body?.botName ?? '').trim();
  const botToken = (body?.botToken ?? '').trim();

  if (botName) await setSetting(SETTING_KEYS.authTelegramBotName, botName);
  if (botToken) await setSetting(SETTING_KEYS.authTelegramBotToken, botToken);

  const effectiveToken = botToken || (await getSetting(SETTING_KEYS.authTelegramBotToken));
  let webhookWarning: string | undefined;

  if (effectiveToken) {
    try {
      let secret = await getSetting(SETTING_KEYS.authTelegramWebhookSecret);
      if (!secret) {
        secret = randomUUID();
        await setSetting(SETTING_KEYS.authTelegramWebhookSecret, secret);
      }
      const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      await setTelegramWebhook(effectiveToken, `${siteUrl}/next-api/telegram-auth-webhook`, secret);
    } catch (e: any) {
      webhookWarning = `Токен сохранён, но не удалось настроить вебхук у бота: ${e?.message ?? 'неизвестная ошибка'}`;
    }
  }

  return NextResponse.json({ ok: true, warning: webhookWarning });
}
