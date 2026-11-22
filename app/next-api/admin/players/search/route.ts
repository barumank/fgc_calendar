import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { error } = await requireRole(['admin']);
  if (error) return error;

  const query = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) return NextResponse.json([]);

  const players = await prisma.player.findMany({
    where: { tag: { contains: query, mode: 'insensitive' } },
    orderBy: [{ points: 'desc' }, { createdAt: 'asc' }],
    take: 20,
    select: {
      id: true,
      tag: true,
      mainGame: true,
      points: true,
      tournamentsPlayed: true,
      challongeUsername: true,
      startggPlayerId: true,
      crowdhypePlayerId: true,
    },
  });

  return NextResponse.json(players);
}
