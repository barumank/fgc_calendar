import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getLegendVoteState } from '@/lib/legend-votes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await getLegendVoteState();
  const cards = await prisma.legendCard.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { legendNumber: 'asc' },
    select: { legendNumber: true, nickname: true, discipline: true, achievement: true, imageData: true, publishedAt: true },
  });
  return NextResponse.json({
    activeLegendNumber: state.legendNumber,
    deadlineAt: state.deadlineAt,
    status: state.status,
    publishedCount: cards.length,
    cards,
  });
}
