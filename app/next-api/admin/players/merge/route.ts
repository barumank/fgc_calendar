import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { MergeError, mergePlayers } from '@/lib/player-merge';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const primaryId = typeof body?.primaryId === 'string' ? body.primaryId : '';
  const otherIds = Array.isArray(body?.otherIds) ? body.otherIds.filter((id: unknown): id is string => typeof id === 'string') : [];
  if (!primaryId || otherIds.length === 0) {
    return NextResponse.json({ error: 'Укажите основную карточку и карточки для объединения' }, { status: 400 });
  }

  try {
    return NextResponse.json(await mergePlayers(primaryId, otherIds));
  } catch (e) {
    if (e instanceof MergeError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
