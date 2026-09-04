import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractChallongeSlug, fetchChallongeParticipants, pointsForRank, currentUsageMonth, ChallongeParticipant } from '@/lib/challonge';
import { REGION_LABELS, RegionType } from '@/src/types';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Турнир не найден' }, { status: 404 });
  }

  const slug = extractChallongeSlug(tournament.sourceUrl);
  if (!slug) {
    return NextResponse.json({ error: 'Ссылка на турнир не похожа на Challonge' }, { status: 400 });
  }

  let participants: ChallongeParticipant[];
  try {
    participants = await fetchChallongeParticipants(slug);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Challonge request failed' }, { status: 502 });
  }

  const month = currentUsageMonth();
  const usage = await prisma.challongeApiUsage.upsert({
    where: { month },
    update: { count: { increment: 1 } },
    create: { month, count: 1 },
  });

  const playersCount = participants.length;
  await prisma.tournament.update({ where: { id: tournament.id }, data: { playersCount } });

  const top8 = participants
    .filter((p) => typeof p.finalRank === 'number' && p.finalRank > 0)
    .sort((a, b) => (a.finalRank as number) - (b.finalRank as number))
    .slice(0, 8);

  const players: any[] = [];
  for (const p of top8) {
    const rank = p.finalRank as number;
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

    const player = p.username
      ? await prisma.player.upsert({
          where: { challongeUsername: p.username },
          update: statUpdate,
          create: { tag: p.name, challongeUsername: p.username, ...baseData },
        })
      : await prisma.player.create({
          data: { tag: p.name, ...baseData },
        });

    players.push({ ...player, finalRank: rank });
  }

  return NextResponse.json({
    playersCount,
    top8: players,
    tournamentFinished: top8.length > 0,
    usage: usage.count,
  });
}
