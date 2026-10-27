import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/require-role';
import { findDuplicateGroups } from '@/lib/player-merge';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireRole(['admin']);
  if (error) return error;
  return NextResponse.json(await findDuplicateGroups());
}
