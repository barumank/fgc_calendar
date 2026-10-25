import { NextRequest, NextResponse } from 'next/server';
import { SETTING_KEYS, setSetting } from '@/lib/app-settings';
import { requireRole } from '@/lib/require-role';
import { getSupportAdminSettings } from '@/lib/support';
import { parseSupportSettingsInput } from '@/lib/support-input';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole(['admin']);
  if (error) return error;
  return NextResponse.json(await getSupportAdminSettings());
}

export async function PUT(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const parsed = parseSupportSettingsInput(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  await Promise.all([
    setSetting(SETTING_KEYS.supportGoalAmount, String(parsed.data.goalAmount)),
    setSetting(SETTING_KEYS.supportDonateUrl, parsed.data.donateUrl),
    setSetting(SETTING_KEYS.supportDeveloperMessage, parsed.data.developerMessage),
    setSetting(SETTING_KEYS.donatepayAutoPublish, parsed.data.autoPublish ? '1' : '0'),
    ...(parsed.data.donatepayApiKey ? [setSetting(SETTING_KEYS.donatepayApiKey, parsed.data.donatepayApiKey)] : []),
  ]);
  return NextResponse.json(await getSupportAdminSettings());
}
