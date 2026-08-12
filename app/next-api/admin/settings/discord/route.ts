import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting, SETTING_KEYS } from '@/lib/app-settings';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const token = await getSetting(SETTING_KEYS.discordBotToken);
  const inviteUrl = await getSetting(SETTING_KEYS.discordInviteUrl);
  return NextResponse.json({ hasToken: !!token, inviteUrl: inviteUrl ?? '' });
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const body = await req.json();
  const botToken = (body?.botToken ?? '').trim();
  const inviteUrl = (body?.inviteUrl ?? '').trim();

  if (botToken) await setSetting(SETTING_KEYS.discordBotToken, botToken);
  if (inviteUrl) await setSetting(SETTING_KEYS.discordInviteUrl, inviteUrl);

  return NextResponse.json({ ok: true });
}
