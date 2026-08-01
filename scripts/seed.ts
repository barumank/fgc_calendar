import { prisma } from '../lib/db';
import { mockTournaments } from '../src/data/mock-tournaments';

async function main() {
  for (const t of mockTournaments) {
    await prisma.tournament.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t },
    });
  }
  console.log(`Seeded ${mockTournaments.length} tournaments`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
