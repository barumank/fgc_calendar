import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const existing = await prisma.game.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Дисциплина не найдена' }, { status: 404 });
  }

  const body = await req.json();
  const label = (body?.label ?? '').trim();
  const shortLabel = (body?.shortLabel ?? '').trim();
  const color = (body?.color ?? '').trim();
  if (!label || !color) {
    return NextResponse.json({ error: 'Название и цвет обязательны' }, { status: 400 });
  }

  const game = await prisma.game.update({ where: { id: params.id }, data: { label, shortLabel: shortLabel || null, color } });
  return NextResponse.json(game);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const existing = await prisma.game.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Дисциплина не найдена' }, { status: 404 });
  }

  const [tournamentsCount, requestsCount, playersCount] = await Promise.all([
    prisma.tournament.count({ where: { game: existing.key } }),
    prisma.tournamentRequest.count({ where: { game: existing.key } }),
    prisma.player.count({ where: { mainGame: existing.key } }),
  ]);
  const inUse = tournamentsCount + requestsCount + playersCount;
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Дисциплина используется: турниров — ${tournamentsCount}, заявок — ${requestsCount}, игроков — ${playersCount}. Удаление запрещено.` },
      { status: 409 },
    );
  }

  await prisma.game.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
