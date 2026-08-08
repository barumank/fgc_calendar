import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { extractChallongeSlug, fetchChallongeParticipants, pointsForRank, currentUsageMonth, ChallongeParticipant } from '@/lib/challonge';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const request = await prisma.tournamentRequest.findUnique({ where: { id: params.id } });
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  if (request.status !== 'approved') {
    return NextResponse.json({ error: 'Request is not approved' }, { status: 409 });
  }

  const slug = extractChallongeSlug(request.url);
  if (!slug) {
    return NextResponse.json({ error: 'URL is not a Challonge tournament link' }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { requestId: request.id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found for this request' }, { status: 404 });
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
      country: tournament.country,
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
