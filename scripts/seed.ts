import { prisma } from '../lib/db';
import { mockTournaments } from '../src/data/mock-tournaments';
import { mockPlayers } from '../src/data/mock-players';

async function main() {
  for (const t of mockTournaments) {
    await prisma.tournament.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t },
    });
  }
  console.log(`Seeded ${mockTournaments.length} tournaments`);

  for (const p of mockPlayers) {
    await prisma.player.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        tag: p.tag,
        realName: p.realName,
        country: p.country,
        region: p.region,
        mainGame: p.mainGame,
        avatarUrl: p.avatarUrl,
        tournamentsPlayed: p.tournamentsPlayed,
        wins: p.wins,
        top3: p.top3,
        points: p.points,
        discord: p.socialLinks?.discord,
        twitter: p.socialLinks?.twitter,
        twitch: p.socialLinks?.twitch,
      },
    });
  }
  console.log(`Seeded ${mockPlayers.length} players`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
