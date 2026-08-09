import { NextResponse } from 'next/server';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const inviteUrl = await getSetting(SETTING_KEYS.discordInviteUrl);
  return NextResponse.json({ inviteUrl: inviteUrl ?? '' });
}
