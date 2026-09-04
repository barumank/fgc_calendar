import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';
import { extractStartggTournamentSlug, fetchStartggTournamentEvents, unixToMoscowDateTime, buildTournamentName, StartggTournament } from '@/lib/startgg';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const request = await prisma.tournamentRequest.findUnique({ where: { id: params.id } });
  if (!request) {
    return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
  }

  const slug = extractStartggTournamentSlug(request.url);
  if (!slug) {
    return NextResponse.json({ error: 'Ссылка не похожа на турнир start.gg' }, { status: 400 });
  }

  const apiToken = await getSetting(SETTING_KEYS.startggApiToken);
  if (!apiToken) {
    return NextResponse.json({ error: 'Не задан токен start.gg API в разделе «Настройки»' }, { status: 400 });
  }

  let tournament: StartggTournament;
  try {
    tournament = await fetchStartggTournamentEvents(slug, apiToken);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Не удалось получить данные со start.gg' }, { status: 502 });
  }

  const videogameIds = [...new Set(tournament.events.map((e) => e.videogameId).filter((v): v is string => !!v))];
  const games = videogameIds.length
    ? await prisma.game.findMany({ where: { startggVideogameId: { in: videogameIds } } })
    : [];
  const gameByVideogameId = new Map(games.map((g) => [g.startggVideogameId as string, g]));

  const events = tournament.events.map((e) => {
    const matched = e.videogameId ? gameByVideogameId.get(e.videogameId) : undefined;
    return {
      id: e.id,
      name: buildTournamentName(tournament.name, e.name),
      videogameName: e.videogameName,
      videogameId: e.videogameId,
      isOnline: e.isOnline,
      startDate: e.startAt ? unixToMoscowDateTime(e.startAt).date : null,
      startTime: e.startAt ? unixToMoscowDateTime(e.startAt).time : null,
      mappedGameKey: matched?.key ?? null,
      mappedGameLabel: matched?.label ?? null,
    };
  });

  return NextResponse.json({ tournamentName: tournament.name, events });
}
