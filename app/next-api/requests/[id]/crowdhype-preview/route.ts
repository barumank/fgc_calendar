import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { extractCrowdhypeEventId, fetchCrowdhypeEvent, fetchCrowdhypeEventTournaments, CrowdhypeEvent, CrowdhypeTournament } from '@/lib/crowdhype';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const request = await prisma.tournamentRequest.findUnique({ where: { id: params.id } });
  if (!request) {
    return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
  }

  const eventId = extractCrowdhypeEventId(request.url);
  if (!eventId) {
    return NextResponse.json({ error: 'Ссылка не похожа на мероприятие crowdhype.pro' }, { status: 400 });
  }

  let event: CrowdhypeEvent;
  let tournaments: CrowdhypeTournament[];
  try {
    event = await fetchCrowdhypeEvent(eventId);
    tournaments = await fetchCrowdhypeEventTournaments(eventId);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Не удалось получить данные с crowdhype.pro' }, { status: 502 });
  }

  const gameIds = [...new Set(tournaments.map((t) => t.gameId).filter((v): v is string => !!v))];
  const games = gameIds.length
    ? await prisma.game.findMany({ where: { crowdhypeGameId: { in: gameIds } } })
    : [];
  const gameByCrowdhypeId = new Map(games.map((g) => [g.crowdhypeGameId as string, g]));

  const result = tournaments.map((t) => {
    const matched = t.gameId ? gameByCrowdhypeId.get(t.gameId) : undefined;
    return {
      id: t.id,
      name: t.title,
      format: t.format,
      gameName: t.gameName,
      gameId: t.gameId,
      participantsCount: t.participantsCount,
      startDate: t.startDate,
      endDate: t.endDate,
      mappedGameKey: matched?.key ?? null,
      mappedGameLabel: matched?.label ?? null,
    };
  });

  return NextResponse.json({ eventTitle: event.title, isOnline: event.isOnline, location: event.location, tournaments: result });
}
