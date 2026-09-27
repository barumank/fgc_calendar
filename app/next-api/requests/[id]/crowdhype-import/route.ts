import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { buildTournamentName } from '@/lib/startgg';
import {
  extractCrowdhypeEventId,
  fetchCrowdhypeEvent,
  fetchCrowdhypeEventTournaments,
  isoToMoscowDateTime,
  CROWDHYPE_COLLECTIBLE_FORMAT,
  CrowdhypeEvent,
  CrowdhypeTournament,
} from '@/lib/crowdhype';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const body = await req.json();
  const tournamentIds: string[] = Array.isArray(body?.tournamentIds) ? body.tournamentIds.map(String) : [];
  if (tournamentIds.length === 0) {
    return NextResponse.json({ error: 'Выберите хотя бы один турнир' }, { status: 400 });
  }

  const request = await prisma.tournamentRequest.findUnique({ where: { id: params.id } });
  if (!request) {
    return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
  }
  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'Заявка уже обработана' }, { status: 409 });
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

  const selected = tournaments.filter((t) => tournamentIds.includes(t.id));
  if (selected.length === 0) {
    return NextResponse.json({ error: 'Выбранные турниры не найдены на crowdhype.pro' }, { status: 400 });
  }

  const gameIds = [...new Set(selected.map((t) => t.gameId).filter((v): v is string => !!v))];
  const games = gameIds.length
    ? await prisma.game.findMany({ where: { crowdhypeGameId: { in: gameIds } } })
    : [];
  const gameByCrowdhypeId = new Map(games.map((g) => [g.crowdhypeGameId as string, g]));

  const unmapped = selected.filter((t) => !t.gameId || !gameByCrowdhypeId.has(t.gameId));
  if (unmapped.length > 0) {
    return NextResponse.json(
      { error: `Для турниров без сопоставленной дисциплины (${unmapped.map((t) => t.title).join(', ')}) нельзя создать турнир — сначала укажите ID игры на crowdhype.pro в разделе «Дисциплины»` },
      { status: 400 },
    );
  }

  const format = event.isOnline ? 'online' : 'offline';
  const region = event.isOnline ? 'other' : request.region;
  const city = event.isOnline ? null : (event.location || request.city);
  const description = request.comment || 'Без описания';

  const tournamentsData = selected.map((t) => {
    const game = gameByCrowdhypeId.get(t.gameId as string)!;
    // crowdhype's own UI only ever shows a single start date/time per
    // tournament — never an end date — and its API's endDate can land on
    // the next calendar day (Moscow time) even for same-day tournaments,
    // so it isn't reliable for FightNexus's separate startDate/endDate
    // fields. Treat every crowdhype tournament as single-day.
    const startInfo = t.startDate ? isoToMoscowDateTime(t.startDate) : null;
    const startDate = startInfo?.date ?? request.startDate;
    const endDate = startInfo?.date ?? request.endDate;
    const startTime = startInfo?.time ?? request.startTime ?? null;

    return {
      name: buildTournamentName(event.title, t.gameName || t.title),
      game: game.key,
      format,
      region,
      city,
      startDate,
      endDate,
      startTime,
      status: 'upcoming',
      playersCount: t.participantsCount,
      description,
      bannerUrl: request.bannerUrl,
      organizerName: '—',
      // Only FDE brackets can be auto-collected later — store the specific
      // tournament link for those, and the general event link otherwise, so
      // Swiss/RR imports never get stuck showing "awaiting results".
      sourceUrl: t.format === CROWDHYPE_COLLECTIBLE_FORMAT
        ? `https://crowdhype.pro/tournaments/${t.id}`
        : `https://crowdhype.pro/events/${eventId}`,
      communicationUrl: request.communicationUrl,
      requestId: request.id,
    };
  });

  const [, updatedRequest] = await prisma.$transaction([
    prisma.tournament.createMany({ data: tournamentsData }),
    prisma.tournamentRequest.update({ where: { id: request.id }, data: { status: 'approved' } }),
  ]);

  return NextResponse.json({ request: updatedRequest, createdCount: tournamentsData.length });
}
