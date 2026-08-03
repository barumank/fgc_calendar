import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { DEFAULT_GAMES } from '@/src/data/default-games';

export const dynamic = 'force-dynamic';

export async function GET() {
  const count = await prisma.game.count();
  if (count === 0) {
    await prisma.game.createMany({ data: DEFAULT_GAMES, skipDuplicates: true });
  }
  const games = await prisma.game.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(games);
}
