import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { DonatePayNotConfiguredError, syncDonatePay } from '@/lib/donatepay-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST() {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  try {
    return NextResponse.json(await syncDonatePay('manual'));
  } catch (e) {
    const status = e instanceof DonatePayNotConfiguredError ? 400 : 502;
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Не удалось выполнить синхронизацию' }, { status });
  }
}
