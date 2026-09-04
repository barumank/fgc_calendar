import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { extractChallongeSlug, fetchChallongeParticipants, currentUsageMonth, ChallongeParticipant } from '@/lib/challonge';
import { reversePreviousCredits, creditTop8 } from '@/lib/tournament-results';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const force = !!body?.force;

  const tournament = await prisma.tournament.findUnique({ where: { id: params.id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Турнир не найден' }, { status: 404 });
  }

  const alreadyCollected = await prisma.tournamentResultCredit.count({ where: { tournamentId: tournament.id } });
  if (alreadyCollected > 0 && !force) {
    return NextResponse.json(
      { error: 'Результаты уже собраны для этого турнира', resultsFetchedAt: tournament.resultsFetchedAt },
      { status: 409 },
    );
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
  const top8 = participants
    .filter((p) => typeof p.finalRank === 'number' && p.finalRank > 0)
    .sort((a, b) => (a.finalRank as number) - (b.finalRank as number))
    .slice(0, 8);

  let players: any[] = [];
  if (top8.length > 0) {
    if (alreadyCollected > 0) await reversePreviousCredits(tournament.id);
    players = await creditTop8(
      tournament.id,
      tournament,
      top8.map((p) => ({ rank: p.finalRank as number, name: p.name, challongeUsername: p.username })),
    );
    await prisma.tournament.update({ where: { id: tournament.id }, data: { playersCount, resultsFetchedAt: new Date() } });
  } else {
    await prisma.tournament.update({ where: { id: tournament.id }, data: { playersCount } });
  }

  return NextResponse.json({
    playersCount,
    top8: players,
    tournamentFinished: top8.length > 0,
    usage: usage.count,
  });
}
