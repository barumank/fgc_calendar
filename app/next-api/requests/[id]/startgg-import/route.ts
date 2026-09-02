import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';
import { extractStartggTournamentSlug, fetchStartggTournamentEvents, regionFromCountryCode, unixToMoscowDateTime } from '@/lib/startgg';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const body = await req.json();
  const eventIds: string[] = Array.isArray(body?.eventIds) ? body.eventIds.map(String) : [];
  if (eventIds.length === 0) {
    return NextResponse.json({ error: 'Выберите хотя бы одно событие' }, { status: 400 });
  }

  const request = await prisma.tournamentRequest.findUnique({ where: { id: params.id } });
  if (!request) {
    return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
  }
  if (request.status !== 'pending') {
    return NextResponse.json({ error: 'Заявка уже обработана' }, { status: 409 });
  }

  const slug = extractStartggTournamentSlug(request.url);
  if (!slug) {
    return NextResponse.json({ error: 'Ссылка не похожа на турнир start.gg' }, { status: 400 });
  }

  const apiToken = await getSetting(SETTING_KEYS.startggApiToken);
  if (!apiToken) {
    return NextResponse.json({ error: 'Не задан токен start.gg API в разделе «Настройки»' }, { status: 400 });
  }

  let tournament;
  try {
    tournament = await fetchStartggTournamentEvents(slug, apiToken);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Не удалось получить данные со start.gg' }, { status: 502 });
  }

  const selectedEvents = tournament.events.filter((e) => eventIds.includes(e.id));
  if (selectedEvents.length === 0) {
    return NextResponse.json({ error: 'Выбранные события не найдены на start.gg' }, { status: 400 });
  }

  const videogameIds = [...new Set(selectedEvents.map((e) => e.videogameId).filter((v): v is string => !!v))];
  const games = videogameIds.length
    ? await prisma.game.findMany({ where: { startggVideogameId: { in: videogameIds } } })
    : [];
  const gameByVideogameId = new Map(games.map((g) => [g.startggVideogameId as string, g]));

  const unmapped = selectedEvents.filter((e) => !e.videogameId || !gameByVideogameId.has(e.videogameId));
  if (unmapped.length > 0) {
    return NextResponse.json(
      { error: `Для событий без сопоставленной дисциплины (${unmapped.map((e) => e.name).join(', ')}) нельзя создать турнир — сначала укажите ID игры на start.gg в разделе «Дисциплины»` },
      { status: 400 },
    );
  }

  const region = regionFromCountryCode(tournament.countryCode);
  const description = request.comment || 'Без описания';

  const tournamentsData = selectedEvents.map((e) => {
    const game = gameByVideogameId.get(e.videogameId as string)!;
    const { date: startDate, time: startTime } = e.startAt
      ? unixToMoscowDateTime(e.startAt)
      : { date: request.startDate, time: request.startTime ?? null };

    return {
      name: e.name,
      game: game.key,
      format: e.isOnline ? 'online' : 'offline',
      region: e.isOnline ? 'other' : region,
      city: e.isOnline ? null : tournament.city,
      startDate,
      endDate: startDate,
      startTime,
      status: 'upcoming',
      playersCount: 0,
      description,
      bannerUrl: request.bannerUrl,
      organizerName: '—',
      sourceUrl: e.slug ? `https://www.start.gg/${e.slug}` : request.url,
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
