import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const leagues = await prisma.league.findMany({
    orderBy: [{ startDate: 'asc' }, { endDate: 'asc' }],
    select: { id: true, name: true, game: true, startDate: true, endDate: true, registrationUrl: true, discordUrl: true },
  });
  return NextResponse.json(leagues);
}
