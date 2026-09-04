import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const credits = await prisma.tournamentResultCredit.findMany({ where: { playerId: params.id } });
  if (credits.length === 0) {
    return NextResponse.json([]);
  }

  const tournaments = await prisma.tournament.findMany({
    where: { id: { in: credits.map((c) => c.tournamentId) } },
    select: { id: true, name: true, startDate: true },
    orderBy: { startDate: 'desc' },
  });

  return NextResponse.json(tournaments);
}
