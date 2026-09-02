import { NextRequest, NextResponse } from 'next/server';
import { getSetting, setSetting, SETTING_KEYS } from '@/lib/app-settings';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const token = await getSetting(SETTING_KEYS.startggApiToken);
  return NextResponse.json({ hasToken: !!token });
}

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const body = await req.json();
  const apiToken = (body?.apiToken ?? '').trim();
  if (!apiToken) {
    return NextResponse.json({ error: 'Укажите токен' }, { status: 400 });
  }

  await setSetting(SETTING_KEYS.startggApiToken, apiToken);
  return NextResponse.json({ ok: true });
}
