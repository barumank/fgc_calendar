import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [players, credits] = await Promise.all([
    prisma.player.findMany({ orderBy: { points: 'desc' } }),
    prisma.tournamentResultCredit.findMany({
      where: { rank: { lte: 16 } },
      select: { playerId: true, tournamentId: true },
    }),
  ]);

  const tournaments = await prisma.tournament.findMany({
    where: { id: { in: [...new Set(credits.map((credit) => credit.tournamentId))] } },
    select: { id: true, game: true },
  });
  const gamesByTournament = new Map(tournaments.map((tournament) => [tournament.id, tournament.game]));
  const gamesByPlayer = new Map<string, Set<string>>();
  for (const credit of credits) {
    const game = gamesByTournament.get(credit.tournamentId);
    if (!game) continue;
    const games = gamesByPlayer.get(credit.playerId) ?? new Set<string>();
    games.add(game);
    gamesByPlayer.set(credit.playerId, games);
  }

  return NextResponse.json(players.map((player) => ({
    ...player,
    games: [...(gamesByPlayer.get(player.id) ?? new Set([player.mainGame]))],
  })));
}
