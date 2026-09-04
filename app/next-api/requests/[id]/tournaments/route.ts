import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/require-role';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireRole(['admin', 'moderator']);
  if (error) return error;

  const tournaments = await prisma.tournament.findMany({
    where: { requestId: params.id },
    select: { id: true, name: true, sourceUrl: true, playersCount: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(tournaments);
}
