import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { parseLeagueInput } from '@/lib/league-input';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const parsed = await parseLeagueInput(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const league = await prisma.league.create({ data: parsed.data });
  return NextResponse.json(league, { status: 201 });
}
