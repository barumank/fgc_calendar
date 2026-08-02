import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const players = await prisma.player.findMany({ orderBy: { points: 'desc' } });
  return NextResponse.json(players);
}
