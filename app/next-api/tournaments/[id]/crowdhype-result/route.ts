import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';
import {
  extractCrowdhypeTournamentId,
  fetchCrowdhypeTournament,
  fetchCrowdhypeBracket,
  computeFdeStandings,
  CROWDHYPE_COLLECTIBLE_FORMAT,
} from '@/lib/crowdhype';
import { reversePreviousCredits, creditTop8 } from '@/lib/tournament-results';

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

  const crowdhypeTournamentId = extractCrowdhypeTournamentId(tournament.sourceUrl);
  if (!crowdhypeTournamentId) {
    return NextResponse.json({ error: 'Ссылка на турнир не похожа на турнир crowdhype.pro' }, { status: 400 });
  }

  let crowdhypeTournament;
  try {
    crowdhypeTournament = await fetchCrowdhypeTournament(crowdhypeTournamentId);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Не удалось получить данные с crowdhype.pro' }, { status: 502 });
  }
  if (!crowdhypeTournament) {
    return NextResponse.json({ error: 'Турнир не найден на crowdhype.pro' }, { status: 404 });
  }
  if (crowdhypeTournament.format !== CROWDHYPE_COLLECTIBLE_FORMAT) {
    return NextResponse.json(
      { error: 'Автосбор результатов поддерживается только для формата Full Double Elimination (FDE)' },
      { status: 400 },
    );
  }

  let bracket;
  try {
    bracket = await fetchCrowdhypeBracket(crowdhypeTournamentId);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Не удалось получить сетку с crowdhype.pro' }, { status: 502 });
  }

  const top8 = computeFdeStandings(bracket);

  let players: any[] = [];
  if (top8.length > 0) {
    if (alreadyCollected > 0) await reversePreviousCredits(tournament.id);
    players = await creditTop8(
      tournament.id,
      tournament,
      top8.map((s) => ({ rank: s.rank, name: s.name, crowdhypePlayerId: s.crowdhypePlayerId })),
    );
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { playersCount: crowdhypeTournament.participantsCount, resultsFetchedAt: new Date() },
    });
  } else {
    await prisma.tournament.update({ where: { id: tournament.id }, data: { playersCount: crowdhypeTournament.participantsCount } });
  }

  return NextResponse.json({
    playersCount: crowdhypeTournament.participantsCount,
    top8: players,
    tournamentFinished: top8.length > 0,
  });
}
