import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import { getSetting, SETTING_KEYS } from '@/lib/app-settings';
import { extractStartggEventSlug, fetchStartggEventStandings } from '@/lib/startgg';
import { pointsForRank } from '@/lib/challonge';
import { REGION_LABELS, RegionType } from '@/src/types';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Турнир не найден' }, { status: 404 });
  }

  const eventSlug = extractStartggEventSlug(tournament.sourceUrl);
  if (!eventSlug) {
    return NextResponse.json({ error: 'Ссылка на турнир не похожа на событие start.gg' }, { status: 400 });
  }

  const apiToken = await getSetting(SETTING_KEYS.startggApiToken);
  if (!apiToken) {
    return NextResponse.json({ error: 'Не задан токен start.gg API в разделе «Настройки»' }, { status: 400 });
  }

  let result;
  try {
    result = await fetchStartggEventStandings(eventSlug, apiToken);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Не удалось получить результаты со start.gg' }, { status: 502 });
  }

  await prisma.tournament.update({ where: { id: tournament.id }, data: { playersCount: result.numEntrants } });

  const top8 = result.standings
    .filter((s) => s.placement > 0)
    .sort((a, b) => a.placement - b.placement)
    .slice(0, 8);

  const players: any[] = [];
  for (const s of top8) {
    const rank = s.placement;
    const pts = pointsForRank(rank);
    const statUpdate = {
      tournamentsPlayed: { increment: 1 },
      points: { increment: pts },
      wins: { increment: rank === 1 ? 1 : 0 },
      top3: { increment: rank <= 3 ? 1 : 0 },
    };
    const baseData = {
      country: REGION_LABELS[tournament.region as RegionType] ?? tournament.region,
      region: tournament.region,
      mainGame: tournament.game,
      tournamentsPlayed: 1,
      points: pts,
      wins: rank === 1 ? 1 : 0,
      top3: rank <= 3 ? 1 : 0,
    };

    const player = s.playerId
      ? await prisma.player.upsert({
          where: { startggPlayerId: s.playerId },
          update: statUpdate,
          create: { tag: s.name, startggPlayerId: s.playerId, ...baseData },
        })
      : await prisma.player.create({
          data: { tag: s.name, ...baseData },
        });

    players.push({ ...player, finalRank: rank });
  }

  return NextResponse.json({
    playersCount: result.numEntrants,
    top8: players,
    tournamentFinished: top8.length > 0,
  });
}
