import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { parseTournamentUpdate } from '@/lib/tournament-input';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const existing = await prisma.tournament.findUnique({
    where: { id: params.id },
    select: { id: true, game: true, resultsFetchedAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Турнир не найден' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = await parseTournamentUpdate(body);
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Results already credited to players are tied to the discipline, so it
  // can't change afterwards without corrupting the rankings.
  if (parsed.data.game !== existing.game && existing.resultsFetchedAt) {
    return NextResponse.json({ error: 'Нельзя менять дисциплину после загрузки результатов турнира' }, { status: 409 });
  }

  const { bannerUrl, ...fields } = parsed.data;
  const tournament = await prisma.tournament.update({
    where: { id: params.id },
    data: { ...fields, ...(bannerUrl !== undefined ? { bannerUrl } : {}) },
    select: { id: true, name: true, city: true },
  });
  return NextResponse.json(tournament);
}
