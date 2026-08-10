import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSetting, setSetting, SETTING_KEYS } from '@/lib/app-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const botName = await getSetting(SETTING_KEYS.telegramBotName);
  const token = await getSetting(SETTING_KEYS.telegramBotToken);
  return NextResponse.json({ botName: botName ?? '', hasToken: !!token });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const botName = (body?.botName ?? '').trim();
  const botToken = (body?.botToken ?? '').trim();

  if (botName) await setSetting(SETTING_KEYS.telegramBotName, botName);
  if (botToken) await setSetting(SETTING_KEYS.telegramBotToken, botToken);

  return NextResponse.json({ ok: true });
}
