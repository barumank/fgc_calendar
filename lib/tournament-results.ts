import { prisma } from '@/lib/db';
import { pointsForRank } from '@/lib/challonge';
import { REGION_LABELS, RegionType } from '@/src/types';
import { PLATFORM_ID_FIELDS, type PlatformIdField } from '@/lib/player-merge';
import type { Player } from '@prisma/client';

export interface RankedResult {
  rank: number;
  name: string;
  challongeUsername?: string | null;
  startggPlayerId?: string | null;
  crowdhypePlayerId?: string | null;
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

// A platform account id identifies a player exactly. Without a match on any
// id, a player in the same discipline whose tag is identical (ignoring case)
// is taken to be the same person — unless that card already holds a different
// account of the same platform, which means a namesake.
async function findExistingPlayer(
  tag: string,
  game: string,
  accountIds: Record<PlatformIdField, string | null>,
): Promise<Player | null> {
  for (const field of PLATFORM_ID_FIELDS) {
    const value = accountIds[field];
    if (!value) continue;
    const found = await prisma.player.findFirst({ where: { [field]: value } });
    if (found) return found;
  }

  const sameTag = await prisma.player.findMany({
    where: { mainGame: game, tag: { equals: tag.trim(), mode: 'insensitive' } },
    orderBy: { createdAt: 'asc' },
  });
  return sameTag.find((p) => PLATFORM_ID_FIELDS.every((f) => !accountIds[f] || !p[f] || p[f] === accountIds[f])) ?? null;
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

    const accountIds = {
      challongeUsername: r.challongeUsername || null,
      startggPlayerId: r.startggPlayerId || null,
      crowdhypePlayerId: r.crowdhypePlayerId || null,
    };
    const existing = await findExistingPlayer(r.name, tournament.game, accountIds);
    const player = existing
      ? await prisma.player.update({
          where: { id: existing.id },
          data: {
            ...statUpdate,
            // A card matched by tag learns the new platform account, so later
            // results from either platform land on the same card.
            ...Object.fromEntries(PLATFORM_ID_FIELDS.filter((f) => accountIds[f] && !existing[f]).map((f) => [f, accountIds[f]])),
          },
        })
      : await prisma.player.create({ data: { tag: r.name, ...accountIds, ...baseData } });

    await prisma.tournamentResultCredit.upsert({
      where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
      update: { rank: r.rank, points: pts },
      create: { tournamentId, playerId: player.id, rank: r.rank, points: pts },
    });

    players.push({ ...player, finalRank: r.rank });
  }
  return players;
}
