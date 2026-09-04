import { prisma } from '@/lib/db';
import { pointsForRank } from '@/lib/challonge';
import { REGION_LABELS, RegionType } from '@/src/types';

export interface RankedResult {
  rank: number;
  name: string;
  challongeUsername?: string | null;
  startggPlayerId?: string | null;
}

// Undoes exactly what a previous collection credited to each player, using
// the recorded TournamentResultCredit rows — so a forced re-collect never
// double-counts points/wins/top3 on top of the earlier run.
export async function reversePreviousCredits(tournamentId: string): Promise<void> {
  const credits = await prisma.tournamentResultCredit.findMany({ where: { tournamentId } });
  for (const c of credits) {
    await prisma.player
      .update({
        where: { id: c.playerId },
        data: {
          tournamentsPlayed: { decrement: 1 },
          points: { decrement: c.points },
          wins: { decrement: c.rank === 1 ? 1 : 0 },
          top3: { decrement: c.rank <= 3 ? 1 : 0 },
        },
      })
      .catch(() => {});
  }
  await prisma.tournamentResultCredit.deleteMany({ where: { tournamentId } });
}

export async function creditTop8(
  tournamentId: string,
  tournament: { region: string; game: string },
  top8: RankedResult[],
): Promise<any[]> {
  const players: any[] = [];
  for (const r of top8) {
    const pts = pointsForRank(r.rank);
    const statUpdate = {
      tournamentsPlayed: { increment: 1 },
      points: { increment: pts },
      wins: { increment: r.rank === 1 ? 1 : 0 },
      top3: { increment: r.rank <= 3 ? 1 : 0 },
    };
    const baseData = {
      country: REGION_LABELS[tournament.region as RegionType] ?? tournament.region,
      region: tournament.region,
      mainGame: tournament.game,
      tournamentsPlayed: 1,
      points: pts,
      wins: r.rank === 1 ? 1 : 0,
      top3: r.rank <= 3 ? 1 : 0,
    };

    const player = r.challongeUsername
      ? await prisma.player.upsert({
          where: { challongeUsername: r.challongeUsername },
          update: statUpdate,
          create: { tag: r.name, challongeUsername: r.challongeUsername, ...baseData },
        })
      : r.startggPlayerId
        ? await prisma.player.upsert({
            where: { startggPlayerId: r.startggPlayerId },
            update: statUpdate,
            create: { tag: r.name, startggPlayerId: r.startggPlayerId, ...baseData },
          })
        : await prisma.player.create({ data: { tag: r.name, ...baseData } });

    await prisma.tournamentResultCredit.upsert({
      where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
      update: { rank: r.rank, points: pts },
      create: { tournamentId, playerId: player.id, rank: r.rank, points: pts },
    });

    players.push({ ...player, finalRank: r.rank });
  }
  return players;
}
