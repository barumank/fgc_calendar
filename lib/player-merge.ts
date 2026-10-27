import { prisma } from '@/lib/db';
import type { Player } from '@prisma/client';

export const PLATFORM_ID_FIELDS = ['challongeUsername', 'startggPlayerId', 'crowdhypePlayerId'] as const;
export type PlatformIdField = (typeof PLATFORM_ID_FIELDS)[number];

const PLATFORM_LABELS: Record<PlatformIdField, string> = {
  challongeUsername: 'Challonge',
  startggPlayerId: 'start.gg',
  crowdhypePlayerId: 'crowdhype',
};

export class MergeError extends Error {}

// Two tags are "the same" when they differ only by case and surrounding or
// repeated whitespace.
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, ' ').toLowerCase();
}

// Players that carry two different accounts of the same platform can't be
// folded into one record: the second account would be lost and its next
// result would create a duplicate again.
export function findIdConflict(players: Player[]): string | null {
  for (const field of PLATFORM_ID_FIELDS) {
    const values = new Set(players.map((p) => p[field]).filter(Boolean));
    if (values.size > 1) return `Разные аккаунты ${PLATFORM_LABELS[field]}`;
  }
  return null;
}

export interface DuplicateGroup {
  key: string;
  game: string;
  tag: string;
  players: Player[];
  conflict: string | null;
}

export async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  const players = await prisma.player.findMany({ orderBy: [{ points: 'desc' }, { createdAt: 'asc' }] });
  const groups = new Map<string, Player[]>();
  for (const p of players) {
    const key = `${p.mainGame}::${normalizeTag(p.tag)}`;
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return [...groups.entries()]
    .filter(([, members]) => members.length > 1)
    .map(([key, members]) => ({
      key,
      game: members[0].mainGame,
      tag: members[0].tag,
      players: members,
      conflict: findIdConflict(members),
    }));
}

// Folds `otherIds` into `primaryId`: stats are summed, tournament credits move
// to the primary player and platform ids / profile fields are carried over.
export async function mergePlayers(primaryId: string, otherIds: string[]): Promise<Player> {
  const ids = [...new Set(otherIds)].filter((id) => id !== primaryId);
  if (ids.length === 0) throw new MergeError('Выберите игроков для объединения');

  return prisma.$transaction(
    async (tx) => {
      const players = await tx.player.findMany({ where: { id: { in: [primaryId, ...ids] } } });
      if (players.length !== ids.length + 1) throw new MergeError('Игрок не найден — обновите страницу');
      const primary = players.find((p) => p.id === primaryId)!;
      const others = players.filter((p) => p.id !== primaryId);

      if (others.some((o) => o.mainGame !== primary.mainGame)) {
        throw new MergeError('Объединять можно только игроков одной дисциплины');
      }
      const conflict = findIdConflict(players);
      if (conflict) throw new MergeError(`${conflict} — такие карточки объединять нельзя`);

      let { tournamentsPlayed, wins, top3, points } = primary;
      const takenTournaments = new Set(
        (await tx.tournamentResultCredit.findMany({ where: { playerId: primaryId }, select: { tournamentId: true } }))
          .map((c) => c.tournamentId),
      );

      for (const other of others) {
        tournamentsPlayed += other.tournamentsPlayed;
        wins += other.wins;
        top3 += other.top3;
        points += other.points;

        const credits = await tx.tournamentResultCredit.findMany({ where: { playerId: other.id } });
        for (const credit of credits) {
          if (takenTournaments.has(credit.tournamentId)) {
            // Both cards were credited for one tournament: keep a single result.
            tournamentsPlayed -= 1;
            points -= credit.points;
            wins -= credit.rank === 1 ? 1 : 0;
            top3 -= credit.rank <= 3 ? 1 : 0;
            await tx.tournamentResultCredit.delete({ where: { id: credit.id } });
          } else {
            takenTournaments.add(credit.tournamentId);
            await tx.tournamentResultCredit.update({ where: { id: credit.id }, data: { playerId: primaryId } });
          }
        }
      }

      const firstOf = <K extends keyof Player>(field: K): Player[K] =>
        [primary, ...others].map((p) => p[field]).find((v) => v != null && v !== '') ?? (null as Player[K]);

      // The unique platform ids must be free before the primary takes them over.
      await tx.player.deleteMany({ where: { id: { in: ids } } });
      return tx.player.update({
        where: { id: primaryId },
        data: {
          tournamentsPlayed: Math.max(0, tournamentsPlayed),
          wins: Math.max(0, wins),
          top3: Math.max(0, top3),
          points: Math.max(0, points),
          realName: firstOf('realName'),
          avatarUrl: firstOf('avatarUrl'),
          discord: firstOf('discord'),
          twitter: firstOf('twitter'),
          twitch: firstOf('twitch'),
          challongeUsername: firstOf('challongeUsername'),
          startggPlayerId: firstOf('startggPlayerId'),
          crowdhypePlayerId: firstOf('crowdhypePlayerId'),
        },
      });
    },
    { timeout: 20_000 },
  );
}
