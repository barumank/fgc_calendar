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

  const token = await getSetting(SETTING_KEYS.discordBotToken);
  const inviteUrl = await getSetting(SETTING_KEYS.discordInviteUrl);
  return NextResponse.json({ hasToken: !!token, inviteUrl: inviteUrl ?? '' });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const botToken = (body?.botToken ?? '').trim();
  const inviteUrl = (body?.inviteUrl ?? '').trim();

  if (botToken) await setSetting(SETTING_KEYS.discordBotToken, botToken);
  if (inviteUrl) await setSetting(SETTING_KEYS.discordInviteUrl, inviteUrl);

  return NextResponse.json({ ok: true });
}
